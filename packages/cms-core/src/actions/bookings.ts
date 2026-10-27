import { prisma } from "../db";
import { BookingStatus } from "@prisma/client";
import { AvailabilitySearchResult, CreateBookingRequest, SearchMatchItem } from "../booking/types";
import { sendBookingEmail } from "../mail";

async function resolveBookingObjectId(idOrAlias?: string): Promise<string | undefined> {
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
      guestsCount: b.guests_count,
      petsCount: b.pets_count,
      price: b.price,
      icalSourceId: b.ical_source_id,
      createdAt: b.created_at.toISOString(),
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

    // Helper to check if object is available for a date range
    async function isAvailable(objId: string, sDate: Date, eDate: Date): Promise<boolean> {
      const conflict = await prisma.booking.findFirst({
        where: {
          object_id: objId,
          status: { in: [BookingStatus.PENDING, BookingStatus.APPROVED, BookingStatus.IMPORTED] },
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
      const exactOk = await isAvailable(obj.id, targetStart, targetEnd);
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

      if (exactOk) {
        exactMatches.push(item);
      } else if (flexDays > 0) {
        // Check flexible date offsets
        for (let offset = 1; offset <= flexDays; offset++) {
          for (const dir of [1, -1]) {
            const shiftDays = offset * dir;
            const altStart = new Date(targetStart.getTime() + shiftDays * 86400000);
            const altEnd = new Date(targetEnd.getTime() + shiftDays * 86400000);

            const altOk = await isAvailable(obj.id, altStart, altEnd);
            if (altOk) {
              alternatives.push({
                ...item,
                startDate: altStart.toISOString().split("T")[0],
                endDate: altEnd.toISOString().split("T")[0],
                offsetDays: shiftDays,
              });
              break;
            }
          }
          if (alternatives.some((a) => a.object.id === obj.id)) break;
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
      status: { in: [BookingStatus.PENDING, BookingStatus.APPROVED, BookingStatus.IMPORTED] },
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

  const nights = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
  const baseNightPrice = (obj?.price_matrix as any)?.base_night_price || 2500;
  const totalPrice = baseNightPrice * nights;

  // Create booking with status PENDING (blocks calendar)
  const booking = await prisma.booking.create({
    data: {
      object_id: resolvedObjectId,
      start_date: start,
      end_date: end,
      customer_name: data.customerName,
      customer_email: data.customerEmail,
      customer_phone: data.customerPhone,
      guests_count: data.guestsCount,
      pets_count: data.petsCount,
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
      customer_phone: data.customerPhone || "Ej angivet",
      object_name: obj?.name || "Boende",
      start_date: data.startDate,
      end_date: data.endDate,
      guests_count: data.guestsCount,
      pets_count: data.petsCount,
      price: `${totalPrice} SEK`,
      deeplink,
      status: "PENDING",
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
