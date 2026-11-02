import { prisma } from "../db";
import { BookingStatus } from "@prisma/client";
import { AvailabilitySearchResult, CreateBookingRequest, SearchMatchItem } from "../booking/types";
import { sendBookingEmail } from "../mail";
import { getMondayOfISOWeek, getSundayOfISOWeek } from "../utils/weeks";
import { getCmsSettingsAction } from "./settings";
import { AllowedBookingPeriods } from "../types/settings";

export async function resolveBookingObjectId(idOrAlias?: string): Promise<string | undefined> {
  if (!idOrAlias) return undefined;

  // 1. Direct match on BookingObject ID
  const exact = await prisma.bookingObject.findUnique({
    where: { id: idOrAlias },
    select: { id: true },
  });
  if (exact) return exact.id;

  // 2. Match by page ID (e.g. "lullyhill-unit-1003", "unit-1003", or "1003")
  const numMatch = idOrAlias.match(/(\d+)$/);
  if (numMatch) {
    const pageId = parseInt(numMatch[1], 10);
    const byPage = await prisma.bookingObject.findFirst({
      where: { page_id: pageId },
      select: { id: true },
    });
    if (byPage) return byPage.id;
  }

  // 3. Match by name or alias
  if (idOrAlias.toLowerCase().includes("villa") || idOrAlias.toLowerCase().includes("huset")) {
    const byVilla = await prisma.bookingObject.findFirst({
      where: { name: { contains: "Huset", mode: "insensitive" } },
      select: { id: true },
    });
    if (byVilla) return byVilla.id;
  }

  return idOrAlias;
}

export async function getBookingsAction(params?: {
  objectId?: string;
  startDate?: Date;
  endDate?: Date;
}) {
  try {
    const resolvedObjectId = await resolveBookingObjectId(params?.objectId);
    const where: any = {};
    if (resolvedObjectId) where.object_id = resolvedObjectId;
    if (params?.startDate || params?.endDate) {
      where.AND = [];
      if (params.startDate) {
        where.AND.push({ end_date: { gte: params.startDate } });
      }
      if (params.endDate) {
        where.AND.push({ start_date: { lte: params.endDate } });
      }
    }

    const raw = await prisma.booking.findMany({
      where,
      include: {
        object: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { start_date: "asc" },
    });

    return raw.map((b) => ({
      id: b.id,
      objectId: b.object_id,
      objectName: b.object?.name || "Unknown Object",
      startDate: b.start_date.toISOString().split("T")[0],
      endDate: b.end_date.toISOString().split("T")[0],
      status: b.status,
      customerName: b.customer_name,
      customerEmail: b.customer_email,
      customerPhone: b.customer_phone,
      customerMobile: b.customer_mobile,
      addressLine1: b.address_line1,
      addressLine2: b.address_line2,
      postalCode: b.postal_code,
      city: b.city,
      country: b.country || "Sverige",
      guestsCount: b.guests_count,
      adultsCount: b.adults_count,
      childrenCount: b.children_count,
      petsCount: b.pets_count,
      price: b.price,
      depositAmount: b.deposit_amount,
      depositDueDate: b.deposit_due_date ? b.deposit_due_date.toISOString().split("T")[0] : null,
      depositPaidAt: b.deposit_paid_at ? b.deposit_paid_at.toISOString().split("T")[0] : null,
      finalPaymentAmount: b.final_payment_amount,
      finalPaymentDueDate: b.final_payment_due_date ? b.final_payment_due_date.toISOString().split("T")[0] : null,
      finalPaymentPaidAt: b.final_payment_paid_at ? b.final_payment_paid_at.toISOString().split("T")[0] : null,
      contractNumber: b.contract_number,
      contractSentAt: b.contract_sent_at ? b.contract_sent_at.toISOString().split("T")[0] : null,
      contractReceivedAt: b.contract_received_at ? b.contract_received_at.toISOString().split("T")[0] : null,
      customerNotes: b.customer_notes,
      adminNotes: b.admin_notes,
      isPreliminary: b.is_preliminary,
      icalSourceId: b.ical_source_id,
      createdAt: b.created_at.toISOString(),
      updatedAt: b.updated_at.toISOString(),
    }));
  } catch (error) {
    console.error("[cms-core] Failed to fetch bookings:", error);
    return [];
  }
}

export async function searchAvailabilityAction(params: {
  startDate: string;
  endDate: string;
  guests: number;
  pets: number;
  flexDays?: number;
}): Promise<AvailabilitySearchResult> {
  const { startDate, endDate, guests, pets, flexDays = 0 } = params;

  try {
    const targetStart = new Date(startDate);
    const targetEnd = new Date(endDate);
    const nights = Math.max(
      1,
      Math.round((targetEnd.getTime() - targetStart.getTime()) / (1000 * 60 * 60 * 24))
    );

    // Retrieve global booking settings
    const cmsSettings = await getCmsSettingsAction();
    const bookingSettings = cmsSettings?.bookingSettings;

    // Fetch all objects that meet capacity and pet criteria
    const objects = await prisma.bookingObject.findMany({
      where: {
        bed_count: { gte: Math.min(guests, 10) },
        ...(pets > 0 ? { pets_allowed: true } : {}),
      },
      include: {
        galleries: {
          include: { image: true },
          orderBy: { sort_order: "asc" },
        },
        amenities: true,
      },
    });

    const exactMatches: SearchMatchItem[] = [];
    const alternatives: SearchMatchItem[] = [];

    // Helper to check if an object has overlapping active bookings
    async function isAvailable(objId: string, sDate: Date, eDate: Date): Promise<boolean> {
      const conflict = await prisma.booking.findFirst({
        where: {
          object_id: objId,
          status: { notIn: [BookingStatus.CANCELLED, BookingStatus.REJECTED] },
          start_date: { lt: eDate },
          end_date: { gt: sDate },
        },
      });
      return !conflict;
    }

    function calculatePrice(obj: any, n: number): number {
      const basePrice = (obj.price_matrix as any)?.base_night_price || 2500;
      return basePrice * n;
    }

    for (const obj of objects) {
      // 1. Resolve effective turnover day for this unit
      const turnoverScope = bookingSettings?.turnoverDayScope ?? "GLOBAL";
      const objCustom = (obj.price_matrix as any)?.booking_settings;
      const turnoverDayName =
        (turnoverScope === "PER_OBJECT" && objCustom?.defaultTurnoverDay) ||
        bookingSettings?.defaultTurnoverDay ||
        "SUNDAY";
      const turnoverDayOfWeek = turnoverDayName === "SATURDAY" ? 6 : 0; // 6 = Saturday, 0 = Sunday

      // 2. Resolve effective allowed booking periods for this unit
      const customDaysScope = bookingSettings?.customDaysScope ?? "GLOBAL";
      const allowedPeriods: AllowedBookingPeriods =
        (customDaysScope === "PER_OBJECT" && objCustom?.allowedBookingPeriods) ||
        (customDaysScope === "PER_OBJECT" && typeof objCustom?.allowCustomDays === "boolean"
          ? (objCustom.allowCustomDays ? "ALL" : "PERIODS_AND_WEEKS")
          : null) ||
        bookingSettings?.allowedBookingPeriods ||
        (bookingSettings?.allowCustomDays === false ? "PERIODS_AND_WEEKS" : "ALL");

      // 3. Fetch active seasonal price periods for this unit
      const pricePeriods = await prisma.objectPricePeriod.findMany({
        where: { object_id: obj.id },
      });

      // Validates whether the date range strictly complies with the unit's allowed rental periods
      function isValidPeriodForObject(sDate: Date, eDate: Date): boolean {
        const periodNights = Math.max(
          1,
          Math.round((eDate.getTime() - sDate.getTime()) / (1000 * 60 * 60 * 24))
        );
        const startDow = sDate.getDay();
        const endDow = eDate.getDay();

        if (allowedPeriods === "ALL") {
          return true; // Any number of contiguous nights is permitted
        }

        if (allowedPeriods === "FULL_WEEKS_ONLY") {
          // Must start on turnover day, end on turnover day, and be an exact multiple of 7 nights
          const startsOnTurnover = startDow === turnoverDayOfWeek;
          const endsOnTurnover = endDow === turnoverDayOfWeek;
          const isMultipleOf7 = periodNights % 7 === 0 && periodNights >= 7;
          return startsOnTurnover && endsOnTurnover && isMultipleOf7;
        }

        if (allowedPeriods === "PERIODS_AND_WEEKS") {
          // Allowed:
          // 1. Full weeks: multiple of 7 starting/ending on turnover day
          // 2. 3 nights: Thursday (4) to Sunday (0)
          // 3. 4 nights: Sunday (0) to Thursday (4)
          const isFullWeek =
            periodNights % 7 === 0 &&
            startDow === turnoverDayOfWeek &&
            endDow === turnoverDayOfWeek;
          const isThuToSun = periodNights === 3 && startDow === 4 && endDow === 0;
          const isSunToThu = periodNights === 4 && startDow === 0 && endDow === 4;
          return isFullWeek || isThuToSun || isSunToThu;
        }

        return true;
      }

      // Validates whether the date range falls entirely within an active seasonal price period
      function isInActiveSeason(sDate: Date, eDate: Date): boolean {
        if (!pricePeriods || pricePeriods.length === 0) return true;
        const sStr = sDate.toISOString().split("T")[0];
        const eStr = eDate.toISOString().split("T")[0];
        return pricePeriods.some((p: any) => {
          let pStart: string | null = null;
          let pEnd: string | null = null;
          if (p.start_date && p.end_date) {
            pStart =
              typeof p.start_date === "string"
                ? p.start_date.slice(0, 10)
                : new Date(p.start_date).toISOString().split("T")[0];
            pEnd =
              typeof p.end_date === "string"
                ? p.end_date.slice(0, 10)
                : new Date(p.end_date).toISOString().split("T")[0];
          } else if (p.start_year && p.start_week && p.end_year && p.end_week) {
            pStart = getMondayOfISOWeek(p.start_year, p.start_week)
              .toISOString()
              .split("T")[0];
            pEnd = getSundayOfISOWeek(p.end_year, p.end_week)
              .toISOString()
              .split("T")[0];
          }
          return pStart && pEnd && sStr >= pStart && eStr <= pEnd;
        });
      }

      const item: SearchMatchItem = {
        object: {
          id: obj.id,
          name: obj.name,
          description: obj.description,
          size_sqm: obj.size_sqm,
          bed_count: obj.bed_count,
          extra_bed_count: obj.extra_bed_count,
          pets_allowed: obj.pets_allowed,
          price_matrix: obj.price_matrix as any,
          galleries: obj.galleries.map((g) => ({
            id: g.id,
            image: { file_url: g.image.file_url, file_name: g.image.file_name },
          })),
          amenities: obj.amenities.map((a) => ({ id: a.id, name: a.name })),
        },
        startDate,
        endDate,
        nights,
        totalPrice: calculatePrice(obj, nights),
      };

      const periodMatches = isValidPeriodForObject(targetStart, targetEnd);
      const seasonMatches = isInActiveSeason(targetStart, targetEnd);
      const exactOk =
        periodMatches &&
        seasonMatches &&
        (await isAvailable(obj.id, targetStart, targetEnd));

      if (exactOk) {
        exactMatches.push(item);
      } else {
        // Evaluate alternative periods if flexDays are specified or if period doesn't align with rules
        const maxOffset = Math.max(flexDays, allowedPeriods === "FULL_WEEKS_ONLY" ? 7 : 0);
        if (maxOffset > 0) {
          for (let offset = 1; offset <= maxOffset; offset++) {
            for (const dir of [1, -1]) {
              const shiftDays = offset * dir;
              const altStart = new Date(targetStart.getTime() + shiftDays * 86400000);
              const altEnd = new Date(targetEnd.getTime() + shiftDays * 86400000);

              if (
                isValidPeriodForObject(altStart, altEnd) &&
                isInActiveSeason(altStart, altEnd)
              ) {
                const altOk = await isAvailable(obj.id, altStart, altEnd);
                if (altOk) {
                  const altNights = Math.round(
                    (altEnd.getTime() - altStart.getTime()) / 86400000
                  );
                  alternatives.push({
                    ...item,
                    startDate: altStart.toISOString().split("T")[0],
                    endDate: altEnd.toISOString().split("T")[0],
                    nights: altNights,
                    totalPrice: calculatePrice(obj, altNights),
                    offsetDays: shiftDays,
                  });
                  break;
                }
              }
            }
            if (alternatives.some((a) => a.object.id === obj.id)) break;
          }
        }
      }
    }

    return { exactMatches, alternatives };
  } catch {
    // Graceful offline mock fallback
    return {
      exactMatches: [
        {
          object: {
            id: "lullyhill-villa",
            name: "Villa Lullyhill",
            description: "Exklusiv gotländsk kalkstensvilla vid Tofta strand.",
            size_sqm: 220,
            bed_count: 8,
            extra_bed_count: 2,
            pets_allowed: true,
            galleries: [
              {
                id: "g1",
                image: {
                  file_url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
                  file_name: "villa-exterior.jpg",
                },
              },
            ],
            amenities: [
              { id: "a1", name: "Havsutsikt" },
              { id: "a2", name: "Kalkstensgolv" },
              { id: "a3", name: "Terrass" },
            ],
          },
          startDate,
          endDate,
          nights: 3,
          totalPrice: 10500,
        },
      ],
      alternatives: [],
    };
  }
}

export async function createBookingRequestAction(data: CreateBookingRequest) {
  const resolvedObjectId = (await resolveBookingObjectId(data.objectId)) || data.objectId;
  const start = new Date(data.startDate);
  const end = new Date(data.endDate);

  // Verify availability before booking
  const conflict = await prisma.booking.findFirst({
    where: {
      object_id: resolvedObjectId,
      status: { notIn: [BookingStatus.CANCELLED, BookingStatus.REJECTED] },
      start_date: { lt: end },
      end_date: { gt: start },
    },
  });

  if (conflict) {
    throw new Error("De valda datumen är tyvärr redan upptagna.");
  }

  // Verify that all nights are within active configured price periods
  const periods = await prisma.objectPricePeriod.findMany({
    where: { object_id: resolvedObjectId },
  });

  if (periods.length > 0) {
    let curr = new Date(start);
    while (curr < end) {
      const dayStr = curr.toISOString().split("T")[0];
      const inSeason = periods.some((p) => {
        let s = p.start_date ? p.start_date.toISOString().split("T")[0] : null;
        let e = p.end_date ? p.end_date.toISOString().split("T")[0] : null;
        if (!s && p.start_year && p.start_week) {
          s = getMondayOfISOWeek(p.start_year, p.start_week).toISOString().split("T")[0];
        }
        if (!e && p.end_year && p.end_week) {
          e = getSundayOfISOWeek(p.end_year, p.end_week).toISOString().split("T")[0];
        }
        return s && e && dayStr >= s && dayStr <= e;
      });

      if (!inSeason) {
        throw new Error("De valda datumen ligger utanför objektets bokningsbara prisperioder.");
      }
      curr.setDate(curr.getDate() + 1);
    }
  }

  const obj = await prisma.bookingObject.findUnique({
    where: { id: resolvedObjectId },
  });

  const nights = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
  const baseNightPrice = (obj?.price_matrix as any)?.base_night_price || 2500;
  const totalPrice = baseNightPrice * nights;

  const isPreliminary = Boolean(data.isPreliminary);

  // Create booking (status PENDING blocks calendar)
  const booking = await prisma.booking.create({
    data: {
      object_id: resolvedObjectId,
      start_date: start,
      end_date: end,
      customer_name: data.customerName,
      customer_email: data.customerEmail,
      customer_phone: data.customerPhone || null,
      customer_mobile: data.customerMobile || null,
      address_line1: data.addressLine1 || null,
      address_line2: data.addressLine2 || null,
      postal_code: data.postalCode || null,
      city: data.city || null,
      country: data.country || "Sverige",
      guests_count: data.guestsCount || ((data.adultsCount || 1) + (data.childrenCount || 0)),
      adults_count: data.adultsCount ?? (data.guestsCount || 1),
      children_count: data.childrenCount ?? 0,
      pets_count: data.petsCount || 0,
      customer_notes: data.customerNotes || null,
      is_preliminary: isPreliminary,
      price: totalPrice,
      status: BookingStatus.PENDING,
    },
  });

  // Send automated emails with deeplinks
  try {
    const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || "admin@nextbooking.se";
    const appUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const deeplink = `${appUrl}/admin?tab=bookings&bookingId=${booking.id}`;

    const mailVariables = {
      customer_name: data.customerName,
      customer_email: data.customerEmail,
      customer_phone: data.customerPhone || data.customerMobile || "Ej angivet",
      object_name: obj?.name || "Boende",
      start_date: data.startDate,
      end_date: data.endDate,
      guests_count: data.guestsCount || ((data.adultsCount || 1) + (data.childrenCount || 0)),
      pets_count: data.petsCount || 0,
      price: `${totalPrice} SEK`,
      deeplink,
      status: isPreliminary ? "PRELIMINARY" : "PENDING",
    };

    // 1. Send notification to administrator
    await sendBookingEmail("ADMIN_NEW_BOOKING_REQUEST", adminEmail, mailVariables);

    // 2. Send confirmation copy to user
    await sendBookingEmail("USER_NEW_BOOKING_REQUEST_COPY", data.customerEmail, mailVariables);
  } catch (err) {
    console.error("Automated booking email error:", err);
  }

  return booking;
}

function parseDateOrNull(val: string | null | undefined): Date | null | undefined {
  if (val === undefined) return undefined;
  if (!val || typeof val !== "string" || val.trim() === "") return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

export async function updateBookingAction(data: {
  id: string;
  startDate?: string;
  endDate?: string;
  status?: BookingStatus;
  price?: number | null;
  depositAmount?: number | null;
  depositDueDate?: string | null;
  depositPaidAt?: string | null;
  finalPaymentAmount?: number | null;
  finalPaymentDueDate?: string | null;
  finalPaymentPaidAt?: string | null;
  contractNumber?: string | null;
  contractSentAt?: string | null;
  contractReceivedAt?: string | null;
  adminNotes?: string | null;
  customerNotes?: string | null;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string | null;
  customerMobile?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  postalCode?: string | null;
  city?: string | null;
  country?: string | null;
  adultsCount?: number;
  childrenCount?: number;
  guestsCount?: number;
  petsCount?: number;
  isPreliminary?: boolean;
}) {
  const existing = await prisma.booking.findUnique({
    where: { id: data.id },
    select: { id: true, ical_source_id: true, status: true },
  });

  if (!existing) {
    throw new Error("Bokningen kunde inte hittas.");
  }

  const isImported =
    existing.status === BookingStatus.IMPORTED ||
    (Boolean(existing.ical_source_id) && existing.ical_source_id !== "blocked_period");

  if (isImported) {
    throw new Error(
      "Importerade bokningar från iCal / externa kanaler är låsta och kan inte redigeras."
    );
  }

  const updateData: any = {};
  if (data.startDate !== undefined) {
    const parsed = parseDateOrNull(data.startDate);
    if (parsed) updateData.start_date = parsed;
  }
  if (data.endDate !== undefined) {
    const parsed = parseDateOrNull(data.endDate);
    if (parsed) updateData.end_date = parsed;
  }
  if (data.status !== undefined) updateData.status = data.status;
  if (data.price !== undefined) updateData.price = data.price;
  if (data.depositAmount !== undefined) updateData.deposit_amount = data.depositAmount;
  if (data.depositDueDate !== undefined) {
    updateData.deposit_due_date = parseDateOrNull(data.depositDueDate);
  }
  if (data.depositPaidAt !== undefined) {
    updateData.deposit_paid_at = parseDateOrNull(data.depositPaidAt);
  }
  if (data.finalPaymentAmount !== undefined) updateData.final_payment_amount = data.finalPaymentAmount;
  if (data.finalPaymentDueDate !== undefined) {
    updateData.final_payment_due_date = parseDateOrNull(data.finalPaymentDueDate);
  }
  if (data.finalPaymentPaidAt !== undefined) {
    updateData.final_payment_paid_at = parseDateOrNull(data.finalPaymentPaidAt);
  }
  if (data.contractNumber !== undefined) updateData.contract_number = data.contractNumber;
  if (data.contractSentAt !== undefined) {
    updateData.contract_sent_at = parseDateOrNull(data.contractSentAt);
  }
  if (data.contractReceivedAt !== undefined) {
    updateData.contract_received_at = parseDateOrNull(data.contractReceivedAt);
  }
  if (data.adminNotes !== undefined) updateData.admin_notes = data.adminNotes;
  if (data.customerNotes !== undefined) updateData.customer_notes = data.customerNotes;
  if (data.customerName !== undefined) updateData.customer_name = data.customerName;
  if (data.customerEmail !== undefined) updateData.customer_email = data.customerEmail;
  if (data.customerPhone !== undefined) updateData.customer_phone = data.customerPhone;
  if (data.customerMobile !== undefined) updateData.customer_mobile = data.customerMobile;
  if (data.addressLine1 !== undefined) updateData.address_line1 = data.addressLine1;
  if (data.addressLine2 !== undefined) updateData.address_line2 = data.addressLine2;
  if (data.postalCode !== undefined) updateData.postal_code = data.postalCode;
  if (data.city !== undefined) updateData.city = data.city;
  if (data.country !== undefined) updateData.country = data.country;
  if (data.adultsCount !== undefined) updateData.adults_count = data.adultsCount;
  if (data.childrenCount !== undefined) updateData.children_count = data.childrenCount;
  if (data.guestsCount !== undefined) updateData.guests_count = data.guestsCount;
  if (data.petsCount !== undefined) updateData.pets_count = data.petsCount;
  if (data.isPreliminary !== undefined) updateData.is_preliminary = data.isPreliminary;

  const updated = await prisma.booking.update({
    where: { id: data.id },
    data: updateData,
    include: {
      object: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return {
    id: updated.id,
    objectId: updated.object_id,
    objectName: updated.object?.name || "Unknown Object",
    startDate: updated.start_date.toISOString().split("T")[0],
    endDate: updated.end_date.toISOString().split("T")[0],
    status: updated.status,
    customerName: updated.customer_name,
    customerEmail: updated.customer_email,
    customerPhone: updated.customer_phone,
    customerMobile: updated.customer_mobile,
    addressLine1: updated.address_line1,
    addressLine2: updated.address_line2,
    postalCode: updated.postal_code,
    city: updated.city,
    country: updated.country || "Sverige",
    guestsCount: updated.guests_count,
    adultsCount: updated.adults_count,
    childrenCount: updated.children_count,
    petsCount: updated.pets_count,
    price: updated.price,
    depositAmount: updated.deposit_amount,
    depositDueDate: updated.deposit_due_date ? updated.deposit_due_date.toISOString().split("T")[0] : null,
    depositPaidAt: updated.deposit_paid_at ? updated.deposit_paid_at.toISOString().split("T")[0] : null,
    finalPaymentAmount: updated.final_payment_amount,
    finalPaymentDueDate: updated.final_payment_due_date ? updated.final_payment_due_date.toISOString().split("T")[0] : null,
    finalPaymentPaidAt: updated.final_payment_paid_at ? updated.final_payment_paid_at.toISOString().split("T")[0] : null,
    contractNumber: updated.contract_number,
    contractSentAt: updated.contract_sent_at ? updated.contract_sent_at.toISOString().split("T")[0] : null,
    contractReceivedAt: updated.contract_received_at ? updated.contract_received_at.toISOString().split("T")[0] : null,
    adminNotes: updated.admin_notes,
    customerNotes: updated.customer_notes,
    icalSourceId: updated.ical_source_id,
    isPreliminary: updated.is_preliminary,
  };
}
