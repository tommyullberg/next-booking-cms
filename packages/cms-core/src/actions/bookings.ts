import { prisma } from "@cms/db";
import { BookingStatus } from "@prisma/client";
import { AvailabilitySearchResult, CreateBookingRequest, SearchMatchItem } from "@cms/booking/types";
import { sendBookingEmail } from "@cms/mail";
import { getMondayOfISOWeek, getSundayOfISOWeek } from "@cms/utils/weeks";
import { getCmsSettingsAction } from "./settings";
import { AllowedBookingPeriods } from "@cms/types/settings";
import { recordBookingDiscrepancy } from "@cms/logging/discrepancies";

export async function resolveBookingObjectId(idOrAlias?: string): Promise<string | undefined> {
  if (!idOrAlias || typeof idOrAlias !== "string") return undefined;
  const trimmed = idOrAlias.trim();
  if (!trimmed) return undefined;

  // 1. Exact match on BookingObject primary key
  const exact = await prisma.bookingObject.findUnique({
    where: { id: trimmed },
    select: { id: true },
  });
  if (exact) return exact.id;

  // Clean leading slash for page slug checks
  const cleanSlug = trimmed.replace(/^\//, "");

  // 2. Strict match via associated page slug
  const bySlug = await prisma.bookingObject.findFirst({
    where: {
      page: {
        slug: {
          in: [cleanSlug, `/${cleanSlug}`],
        },
      },
    },
    select: { id: true },
  });
  if (bySlug) return bySlug.id;

  // 3. Exact match if numeric page_id was provided (pure digits only)
  if (/^\d+$/.test(trimmed)) {
    const pageId = parseInt(trimmed, 10);
    const byPageId = await prisma.bookingObject.findFirst({
      where: { page_id: pageId },
      select: { id: true },
    });
    if (byPageId) return byPageId.id;
  }

  return undefined;
}

export interface PeriodPriceResult {
  totalPrice: number;
  isPriced: boolean;
  error?: string;
}

function getPeriodDateBounds(p: any): { startStr: string; endStr: string } | null {
  let startStr: string | null = null;
  let endStr: string | null = null;
  if (p.start_date && p.end_date) {
    startStr =
      typeof p.start_date === "string"
        ? p.start_date.slice(0, 10)
        : new Date(p.start_date).toISOString().split("T")[0];
    endStr =
      typeof p.end_date === "string"
        ? p.end_date.slice(0, 10)
        : new Date(p.end_date).toISOString().split("T")[0];
  } else if (p.start_year && p.start_week && p.end_year && p.end_week) {
    startStr = getMondayOfISOWeek(p.start_year, p.start_week).toISOString().split("T")[0];
    endStr = getSundayOfISOWeek(p.end_year, p.end_week).toISOString().split("T")[0];
  }
  if (startStr && endStr) {
    return { startStr, endStr };
  }
  return null;
}

export function calculatePeriodPrice(
  obj: any,
  pricePeriods: any[],
  startDate: Date,
  endDate: Date
): PeriodPriceResult {
  const startMs = Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate());
  const endMs = Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth(), endDate.getUTCDate());
  const nights = Math.round((endMs - startMs) / (1000 * 60 * 60 * 24));

  if (nights <= 0) {
    return {
      totalPrice: 0,
      isPriced: false,
      error: "End date must be strictly after start date.",
    };
  }

  const startDow = startDate.getUTCDay();
  const endDow = endDate.getUTCDay();
  const sStr = startDate.toISOString().split("T")[0];
  const eStr = endDate.toISOString().split("T")[0];

  const baseNightPrice =
    typeof (obj?.price_matrix as any)?.base_night_price === "number" &&
    (obj?.price_matrix as any)?.base_night_price > 0
      ? (obj.price_matrix as any).base_night_price
      : 0;

  // 1. Check if the entire requested range falls within a single seasonal period
  const matchingPeriod = (pricePeriods || []).find((p) => {
    const bounds = getPeriodDateBounds(p);
    return bounds && sStr >= bounds.startStr && eStr <= bounds.endStr;
  });

  if (matchingPeriod) {
    if (nights % 7 === 0 && matchingPeriod.price_week && matchingPeriod.price_week > 0) {
      return {
        totalPrice: Math.round((nights / 7) * matchingPeriod.price_week),
        isPriced: true,
      };
    }
    if (
      nights === 3 &&
      startDow === 4 &&
      endDow === 0 &&
      matchingPeriod.price_thu_sun &&
      matchingPeriod.price_thu_sun > 0
    ) {
      return {
        totalPrice: Math.round(matchingPeriod.price_thu_sun),
        isPriced: true,
      };
    }
    if (
      nights === 4 &&
      startDow === 0 &&
      endDow === 4 &&
      matchingPeriod.price_sun_thu &&
      matchingPeriod.price_sun_thu > 0
    ) {
      return {
        totalPrice: Math.round(matchingPeriod.price_sun_thu),
        isPriced: true,
      };
    }
    if (nights === 2 && matchingPeriod.price_2_days && matchingPeriod.price_2_days > 0) {
      return { totalPrice: Math.round(matchingPeriod.price_2_days), isPriced: true };
    }
    if (nights === 3 && matchingPeriod.price_3_days && matchingPeriod.price_3_days > 0) {
      return { totalPrice: Math.round(matchingPeriod.price_3_days), isPriced: true };
    }
    if (nights === 4 && matchingPeriod.price_4_days && matchingPeriod.price_4_days > 0) {
      return { totalPrice: Math.round(matchingPeriod.price_4_days), isPriced: true };
    }
    if (nights === 5 && matchingPeriod.price_5_days && matchingPeriod.price_5_days > 0) {
      return { totalPrice: Math.round(matchingPeriod.price_5_days), isPriced: true };
    }
    if (nights === 6 && matchingPeriod.price_6_days && matchingPeriod.price_6_days > 0) {
      return { totalPrice: Math.round(matchingPeriod.price_6_days), isPriced: true };
    }
    if (matchingPeriod.price_day && matchingPeriod.price_day > 0) {
      return {
        totalPrice: Math.round(matchingPeriod.price_day * nights),
        isPriced: true,
      };
    }
    if (matchingPeriod.price_week && matchingPeriod.price_week > 0) {
      return {
        totalPrice: Math.round((matchingPeriod.price_week / 7) * nights),
        isPriced: true,
      };
    }
  }

  // 2. Night-by-night calculation (for split periods, boundary crossings, or fallback to base_night_price)
  let calculatedTotal = 0;
  for (let i = 0; i < nights; i++) {
    const nightDate = new Date(startMs + i * 86400000);
    const dayStr = nightDate.toISOString().split("T")[0];
    const periodForNight = (pricePeriods || []).find((p) => {
      const bounds = getPeriodDateBounds(p);
      return bounds && dayStr >= bounds.startStr && dayStr <= bounds.endStr;
    });

    let nightPrice = 0;
    if (periodForNight?.price_day && periodForNight.price_day > 0) {
      nightPrice = periodForNight.price_day;
    } else if (periodForNight?.price_week && periodForNight.price_week > 0) {
      nightPrice = periodForNight.price_week / 7;
    } else if (baseNightPrice > 0) {
      nightPrice = baseNightPrice;
    }

    if (nightPrice <= 0) {
      return {
        totalPrice: 0,
        isPriced: false,
        error: `Pricing is missing for night ${dayStr}.`,
      };
    }

    calculatedTotal += nightPrice;
  }

  return {
    totalPrice: Math.round(calculatedTotal),
    isPriced: true,
  };
}

export async function getBookingsAction(params?: {
  objectId?: string;
  startDate?: Date;
  endDate?: Date;
}) {
  try {
    let resolvedObjectId: string | undefined = undefined;
    if (params?.objectId) {
      resolvedObjectId = await resolveBookingObjectId(params.objectId);
      if (!resolvedObjectId) {
        await recordBookingDiscrepancy({
          type: "OBJECT_NOT_FOUND",
          objectId: params.objectId,
          message: `getBookingsAction anropades med okänt eller ogiltigt objekt-ID: '${params.objectId}'.`,
        });
        return [];
      }
    }
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
      objectName: b.object?.name || "Okänt boende",
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
  } catch (error: any) {
    console.error("[cms-core] Failed to fetch bookings:", error);
    await recordBookingDiscrepancy({
      type: "TECHNICAL_DATABASE_ERROR",
      objectId: params?.objectId,
      message: `Failed to fetch bookings from database: ${error?.message || String(error)}`,
    });
    throw error;
  }
}

export async function searchAvailabilityAction(params: {
  startDate: string;
  endDate: string;
  guests: number;
  pets: number;
  flexDays?: number;
  objectId?: string;
}): Promise<AvailabilitySearchResult> {
  const { startDate, endDate, guests, pets, flexDays = 0, objectId } = params;

  try {
    const targetStart = new Date(startDate);
    const targetEnd = new Date(endDate);
    if (isNaN(targetStart.getTime()) || isNaN(targetEnd.getTime()) || targetStart >= targetEnd) {
      return {
        exactMatches: [],
        alternatives: [],
        error: "Ogiltigt datumintervall angivet.",
      };
    }

    const nights = Math.max(
      1,
      Math.round((targetEnd.getTime() - targetStart.getTime()) / (1000 * 60 * 60 * 24))
    );

    // Retrieve global booking settings
    const cmsSettings = await getCmsSettingsAction();
    const bookingSettings = cmsSettings?.bookingSettings;

    let targetObjectId: string | undefined = undefined;
    if (objectId && objectId !== "all" && objectId !== "ALL") {
      targetObjectId = await resolveBookingObjectId(objectId);
      if (!targetObjectId) {
        await recordBookingDiscrepancy({
          type: "OBJECT_NOT_FOUND",
          objectId,
          period: { startDate, endDate },
          message: `Booking object with identifier '${objectId}' could not be resolved during availability search.`,
        });
        return {
          exactMatches: [],
          alternatives: [],
          error: "Det angivna bokningsobjektet kunde inte hittas.",
        };
      }
    }

    // Fetch matching object(s) meeting capacity and pet criteria
    const objects = await prisma.bookingObject.findMany({
      where: {
        ...(targetObjectId ? { id: targetObjectId } : {}),
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

    for (const obj of objects) {
      // 1. Resolve effective turnover day for this unit
      const turnoverScope = bookingSettings?.turnoverDayScope ?? "GLOBAL";
      const objCustom = (obj.price_matrix as any)?.booking_settings;
      const turnoverDayName =
        (turnoverScope === "PER_OBJECT" && objCustom?.defaultTurnoverDay) ||
        bookingSettings?.defaultTurnoverDay ||
        "SUNDAY";
      const turnoverDayOfWeek = turnoverDayName === "SATURDAY" ? 6 : 0;

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
          return true;
        }

        if (allowedPeriods === "FULL_WEEKS_ONLY") {
          const startsOnTurnover = startDow === turnoverDayOfWeek;
          const endsOnTurnover = endDow === turnoverDayOfWeek;
          const isMultipleOf7 = periodNights % 7 === 0 && periodNights >= 7;
          return startsOnTurnover && endsOnTurnover && isMultipleOf7;
        }

        if (allowedPeriods === "PERIODS_AND_WEEKS") {
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
          const bounds = getPeriodDateBounds(p);
          return bounds && sStr >= bounds.startStr && eStr <= bounds.endStr;
        });
      }

      // Calculate price strictly
      const priceResult = calculatePeriodPrice(obj, pricePeriods, targetStart, targetEnd);
      if (!priceResult.isPriced) {
        await recordBookingDiscrepancy({
          type: "OBJECT_MISSING_PRICE",
          objectId: obj.id,
          objectName: obj.name,
          period: { startDate, endDate },
          message: `Object '${obj.name}' (${obj.id}) lacks valid pricing for ${startDate} to ${endDate}: ${priceResult.error}`,
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
        totalPrice: priceResult.totalPrice,
        hasPriceError: !priceResult.isPriced,
        priceErrorMessage: priceResult.error,
      };

      const periodMatches = isValidPeriodForObject(targetStart, targetEnd);
      const seasonMatches = isInActiveSeason(targetStart, targetEnd);
      const isAvailableForDates = await isAvailable(obj.id, targetStart, targetEnd);

      // An exact match must be valid period, in season, available, AND have valid price
      const exactOk = periodMatches && seasonMatches && isAvailableForDates && priceResult.isPriced;

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
                  const altPriceResult = calculatePeriodPrice(obj, pricePeriods, altStart, altEnd);
                  if (altPriceResult.isPriced) {
                    alternatives.push({
                      ...item,
                      startDate: altStart.toISOString().split("T")[0],
                      endDate: altEnd.toISOString().split("T")[0],
                      nights: altNights,
                      totalPrice: altPriceResult.totalPrice,
                      offsetDays: shiftDays,
                      hasPriceError: false,
                      priceErrorMessage: undefined,
                    });
                    break;
                  }
                }
              }
            }
            if (alternatives.some((a) => a.object.id === obj.id)) break;
          }
        }
      }
    }

    return { exactMatches, alternatives };
  } catch (error: any) {
    console.error("[cms-core] searchAvailabilityAction error:", error);
    await recordBookingDiscrepancy({
      type: "TECHNICAL_DATABASE_ERROR",
      period: { startDate, endDate },
      message: `Database error during availability search: ${error?.message || String(error)}`,
    });
    return {
      exactMatches: [],
      alternatives: [],
      error: "Ett tekniskt fel uppstod vid hämtning av tillgängliga boenden.",
    };
  }
}

export async function createBookingRequestAction(data: CreateBookingRequest) {
  const resolvedObjectId = await resolveBookingObjectId(data.objectId);
  if (!resolvedObjectId) {
    await recordBookingDiscrepancy({
      type: "OBJECT_NOT_FOUND",
      objectId: data.objectId,
      period: { startDate: data.startDate, endDate: data.endDate },
      message: `Booking request rejected: booking object with identifier '${data.objectId}' could not be resolved.`,
    });
    throw new Error("Det angivna bokningsobjektet kunde inte hittas eller är ogiltigt.");
  }

  const start = new Date(data.startDate);
  const end = new Date(data.endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) {
    throw new Error("Ogiltigt datumintervall för bokningsförfrågan.");
  }

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

  const obj = await prisma.bookingObject.findUnique({
    where: { id: resolvedObjectId },
  });

  if (!obj) {
    await recordBookingDiscrepancy({
      type: "OBJECT_NOT_FOUND",
      objectId: resolvedObjectId,
      message: `Booking object with ID '${resolvedObjectId}' could not be loaded from database.`,
    });
    throw new Error("Bokningsobjektet kunde inte hittas.");
  }

  const periods = await prisma.objectPricePeriod.findMany({
    where: { object_id: resolvedObjectId },
  });

  // Verify price strictly
  const priceResult = calculatePeriodPrice(obj, periods, start, end);
  if (!priceResult.isPriced || priceResult.totalPrice <= 0) {
    await recordBookingDiscrepancy({
      type: "PERIOD_MISSING_PRICE",
      objectId: resolvedObjectId,
      objectName: obj.name,
      period: { startDate: data.startDate, endDate: data.endDate },
      message: `Booking request rejected: valid pricing is missing for object '${obj.name}' (${resolvedObjectId}) during ${data.startDate} to ${data.endDate}.`,
    });
    throw new Error(
      priceResult.error ||
        "Bokningen kan inte genomföras eftersom giltig prissättning saknas för den valda perioden."
    );
  }

  const totalPrice = priceResult.totalPrice;
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
      object_name: obj.name || "Boende",
      start_date: data.startDate,
      end_date: data.endDate,
      guests_count: data.guestsCount || ((data.adultsCount || 1) + (data.childrenCount || 0)),
      pets_count: data.petsCount || 0,
      price: `${totalPrice.toLocaleString("sv-SE")} SEK`,
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
