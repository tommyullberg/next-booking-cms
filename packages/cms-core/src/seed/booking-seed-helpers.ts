import { PrismaClient, BookingStatus } from "@prisma/client";

export interface SeedLandlordInput {
  first_name: string;
  last_name: string;
  address?: string | null;
  postal_code?: string | null;
  city?: string | null;
  email?: string | null;
  phone?: string | null;
  mobile?: string | null;
  has_swish?: boolean;
  account_type?: string | null;
  account_number?: string | null;
}

export interface SeedAmenityInput {
  name: string;
  sort_order?: number;
}

export interface SeedBookingObjectInput {
  id?: string;
  name: string;
  type?: string | null;
  description?: string | null;
  size_sqm?: number | null;
  room_count?: number | null;
  room_type?: string | null;
  bed_count?: number;
  extra_bed_count?: number;
  pets_allowed?: boolean;
  sort_order?: number;
  is_visible?: boolean;
  landlord_email?: string | null;
  landlord_name?: string | null;
  page_slug?: string | null;
  page_id?: number | null;
  amenities?: string[];
}

export interface SeedBookingOptionalInput {
  name: string;
  description?: string | null;
  image_url?: string | null;
  object_name?: string | null;
  is_active?: boolean;
  price_hour?: number | null;
  price_day?: number | null;
  price_sun_thu?: number | null;
  price_thu_sun?: number | null;
  price_week?: number | null;
  sort_order?: number;
}

export interface SeedPricePeriodInput {
  object_name: string;
  name: string;
  start_date: string; // YYYY-MM-DD
  end_date: string;   // YYYY-MM-DD
  allow_custom_days?: boolean;
  price_week?: number | null;
  price_day?: number | null;
  price_sun_thu?: number | null;
  price_thu_sun?: number | null;
  price_2_days?: number | null;
  price_3_days?: number | null;
  price_4_days?: number | null;
  price_5_days?: number | null;
  price_6_days?: number | null;
}

export interface SeedBookingInput {
  object_name: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string | null;
  start_date: string; // YYYY-MM-DD
  end_date: string;   // YYYY-MM-DD
  guests_count?: number;
  price?: number;
  total_price?: number;
  status?: BookingStatus;
  admin_notes?: string | null;
}

export interface SeedBookingBundleInput {
  landlords?: SeedLandlordInput[];
  amenities?: (string | SeedAmenityInput)[];
  objects?: SeedBookingObjectInput[];
  optionals?: SeedBookingOptionalInput[];
  price_periods?: SeedPricePeriodInput[];
  bookings?: SeedBookingInput[];
}

export interface SeedOptions {
  overwrite?: boolean;
}

function getISOWeek(date: Date): { year: number; week: number } {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return { year: d.getUTCFullYear(), week: weekNo };
}

function parseUtcDate(dateStr: string): Date {
  return new Date(dateStr + "T00:00:00.000Z");
}

export async function seedLandlords(
  prisma: PrismaClient,
  landlords: SeedLandlordInput[],
  options?: SeedOptions
): Promise<Map<string, string>> {
  const map = new Map<string, string>();

  for (const item of landlords) {
    let existing = null;
    if (item.email) {
      existing = await prisma.landlord.findFirst({
        where: { email: item.email },
      });
    }
    if (!existing) {
      existing = await prisma.landlord.findFirst({
        where: {
          first_name: item.first_name,
          last_name: item.last_name,
        },
      });
    }

    if (existing) {
      if (options?.overwrite) {
        const updated = await prisma.landlord.update({
          where: { id: existing.id },
          data: {
            first_name: item.first_name,
            last_name: item.last_name,
            address: item.address,
            postal_code: item.postal_code,
            city: item.city,
            email: item.email,
            phone: item.phone,
            mobile: item.mobile,
            has_swish: item.has_swish ?? false,
            account_type: item.account_type,
            account_number: item.account_number,
          },
        });
        console.log(`[seed] Updated landlord: ${updated.first_name} ${updated.last_name} (${updated.id})`);
        map.set(`${item.first_name} ${item.last_name}`.trim(), updated.id);
        if (item.email) map.set(item.email.toLowerCase(), updated.id);
      } else {
        console.log(`[seed] Retained existing landlord: ${existing.first_name} ${existing.last_name} (${existing.id})`);
        map.set(`${item.first_name} ${item.last_name}`.trim(), existing.id);
        if (item.email) map.set(item.email.toLowerCase(), existing.id);
      }
    } else {
      const created = await prisma.landlord.create({
        data: {
          first_name: item.first_name,
          last_name: item.last_name,
          address: item.address,
          postal_code: item.postal_code,
          city: item.city,
          email: item.email,
          phone: item.phone,
          mobile: item.mobile,
          has_swish: item.has_swish ?? false,
          account_type: item.account_type,
          account_number: item.account_number,
        },
      });
      console.log(`[seed] Created landlord: ${created.first_name} ${created.last_name} (${created.id})`);
      map.set(`${item.first_name} ${item.last_name}`.trim(), created.id);
      if (item.email) map.set(item.email.toLowerCase(), created.id);
    }
  }

  return map;
}

export async function seedAmenities(
  prisma: PrismaClient,
  amenities: (string | SeedAmenityInput)[],
  options?: SeedOptions
): Promise<Map<string, string>> {
  const map = new Map<string, string>();

  for (let i = 0; i < amenities.length; i++) {
    const raw = amenities[i];
    const name = typeof raw === "string" ? raw : raw.name;
    const sortOrder = typeof raw === "string" ? (i + 1) * 10 : (raw.sort_order ?? (i + 1) * 10);

    const existing = await prisma.amenity.findUnique({
      where: { name },
    });

    if (existing) {
      if (options?.overwrite && existing.sort_order !== sortOrder) {
        const updated = await prisma.amenity.update({
          where: { id: existing.id },
          data: { sort_order: sortOrder },
        });
        map.set(name, updated.id);
      } else {
        map.set(name, existing.id);
      }
    } else {
      const created = await prisma.amenity.create({
        data: {
          name,
          sort_order: sortOrder,
        },
      });
      console.log(`[seed] Created amenity: "${name}" (${created.id})`);
      map.set(name, created.id);
    }
  }

  return map;
}

export async function seedBookingObjects(
  prisma: PrismaClient,
  objects: SeedBookingObjectInput[],
  landlordsMap?: Map<string, string>,
  amenitiesMap?: Map<string, string>,
  options?: SeedOptions
): Promise<Map<string, string>> {
  const map = new Map<string, string>();

  for (const obj of objects) {
    let existing = null;
    if (obj.id) {
      existing = await prisma.bookingObject.findUnique({
        where: { id: obj.id },
      });
    }
    if (!existing) {
      existing = await prisma.bookingObject.findFirst({
        where: { name: obj.name },
      });
    }

    let resolvedLandlordId: string | null = null;
    if (landlordsMap) {
      if (obj.landlord_email && landlordsMap.has(obj.landlord_email.toLowerCase())) {
        resolvedLandlordId = landlordsMap.get(obj.landlord_email.toLowerCase())!;
      } else if (obj.landlord_name && landlordsMap.has(obj.landlord_name.trim())) {
        resolvedLandlordId = landlordsMap.get(obj.landlord_name.trim())!;
      }
    }

    let resolvedPageId: number | null = obj.page_id || null;
    if (!resolvedPageId && obj.page_slug) {
      const foundPage = await prisma.page.findFirst({
        where: { slug: obj.page_slug },
      });
      if (foundPage) resolvedPageId = foundPage.id;
    }

    const payload = {
      name: obj.name,
      type: obj.type || "Cabin / Stuga",
      description: obj.description || null,
      size_sqm: obj.size_sqm || null,
      room_count: obj.room_count ?? 1,
      room_type: obj.room_type || null,
      bed_count: obj.bed_count ?? 2,
      extra_bed_count: obj.extra_bed_count ?? 0,
      pets_allowed: obj.pets_allowed ?? false,
      sort_order: obj.sort_order ?? 0,
      is_visible: obj.is_visible ?? true,
      landlord_id: resolvedLandlordId,
      page_id: resolvedPageId,
    };

    if (existing) {
      if (options?.overwrite) {
        const updated = await prisma.bookingObject.update({
          where: { id: existing.id },
          data: payload,
        });
        console.log(`[seed] Updated booking object: "${updated.name}" (${updated.id})`);
        map.set(obj.name, updated.id);
      } else {
        console.log(`[seed] Retained existing booking object: "${existing.name}" (${existing.id})`);
        map.set(obj.name, existing.id);
      }
    } else {
      const created = await prisma.bookingObject.create({
        data: {
          ...(obj.id ? { id: obj.id } : {}),
          ...payload,
        },
      });
      console.log(`[seed] Created booking object: "${created.name}" (${created.id})`);
      map.set(obj.name, created.id);
    }
  }

  return map;
}

export async function seedBookingOptionals(
  prisma: PrismaClient,
  optionals: SeedBookingOptionalInput[],
  objectsMap?: Map<string, string>,
  options?: SeedOptions
): Promise<void> {
  for (const opt of optionals) {
    let boundObjectId: string | null = null;
    if (opt.object_name && objectsMap?.has(opt.object_name)) {
      boundObjectId = objectsMap.get(opt.object_name)!;
    }

    const existing = await prisma.bookingOptional.findFirst({
      where: {
        name: opt.name,
        object_id: boundObjectId,
      },
    });

    const payload = {
      name: opt.name,
      description: opt.description || null,
      image_url: opt.image_url || null,
      object_id: boundObjectId,
      is_active: opt.is_active ?? true,
      price_hour: opt.price_hour ?? 0,
      price_day: opt.price_day ?? 0,
      price_sun_thu: opt.price_sun_thu ?? 0,
      price_thu_sun: opt.price_thu_sun ?? 0,
      price_week: opt.price_week ?? 0,
      sort_order: opt.sort_order ?? 0,
    };

    if (existing) {
      if (options?.overwrite) {
        await prisma.bookingOptional.update({
          where: { id: existing.id },
          data: payload,
        });
        console.log(`[seed] Updated optional: "${opt.name}"`);
      } else {
        console.log(`[seed] Retained existing optional: "${opt.name}"`);
      }
    } else {
      await prisma.bookingOptional.create({
        data: payload,
      });
      console.log(`[seed] Created optional: "${opt.name}"`);
    }
  }
}

export async function seedPricePeriods(
  prisma: PrismaClient,
  periods: SeedPricePeriodInput[],
  objectsMap: Map<string, string>,
  options?: SeedOptions
): Promise<void> {
  for (const p of periods) {
    const objectId = objectsMap.get(p.object_name);
    if (!objectId) {
      console.warn(`[seed] Skipped price period "${p.name}" - unknown object "${p.object_name}"`);
      continue;
    }

    const sDate = parseUtcDate(p.start_date);
    const eDate = parseUtcDate(p.end_date);
    const sIso = getISOWeek(sDate);
    const eIso = getISOWeek(eDate);

    const existing = await prisma.objectPricePeriod.findFirst({
      where: {
        object_id: objectId,
        name: p.name,
      },
    });

    const payload = {
      object_id: objectId,
      name: p.name,
      start_date: sDate,
      end_date: eDate,
      start_year: sIso.year,
      start_week: sIso.week,
      end_year: eIso.year,
      end_week: eIso.week,
      allow_custom_days: p.allow_custom_days ?? true,
      price_week: p.price_week ?? null,
      price_day: p.price_day ?? null,
      price_sun_thu: p.price_sun_thu ?? null,
      price_thu_sun: p.price_thu_sun ?? null,
      price_2_days: p.price_2_days ?? null,
      price_3_days: p.price_3_days ?? null,
      price_4_days: p.price_4_days ?? null,
      price_5_days: p.price_5_days ?? null,
      price_6_days: p.price_6_days ?? null,
    };

    if (existing) {
      if (options?.overwrite) {
        await prisma.objectPricePeriod.update({
          where: { id: existing.id },
          data: payload,
        });
        console.log(`[seed] Updated price period "${p.name}" for ${p.object_name}`);
      } else {
        console.log(`[seed] Retained existing price period "${p.name}" for ${p.object_name}`);
      }
    } else {
      await prisma.objectPricePeriod.create({
        data: payload,
      });
      console.log(`[seed] Created price period "${p.name}" for ${p.object_name}`);
    }
  }
}

export async function seedBookings(
  prisma: PrismaClient,
  bookings: SeedBookingInput[],
  objectsMap: Map<string, string>,
  options?: SeedOptions
): Promise<void> {
  for (const b of bookings) {
    const objectId = objectsMap.get(b.object_name);
    if (!objectId) {
      console.warn(`[seed] Skipped mock booking - unknown object "${b.object_name}"`);
      continue;
    }

    const sDate = parseUtcDate(b.start_date);
    const eDate = parseUtcDate(b.end_date);

    const existing = await prisma.booking.findFirst({
      where: {
        object_id: objectId,
        start_date: sDate,
        end_date: eDate,
      },
    });

    if (existing) {
      console.log(`[seed] Retained existing booking for ${b.object_name} (${b.start_date} to ${b.end_date})`);
    } else {
      await prisma.booking.create({
        data: {
          object_id: objectId,
          start_date: sDate,
          end_date: eDate,
          customer_name: b.customer_name,
          customer_email: b.customer_email,
          customer_phone: b.customer_phone || null,
          guests_count: b.guests_count ?? 2,
          price: b.price !== undefined ? b.price : (b.total_price ?? 0),
          status: b.status || BookingStatus.APPROVED,
          admin_notes: b.admin_notes || "[Seed Demo Booking]",
        },
      });
      console.log(`[seed] Created demo booking for ${b.object_name} (${b.start_date} to ${b.end_date})`);
    }
  }
}

export async function seedBookingBundle(
  prisma: PrismaClient,
  bundle: SeedBookingBundleInput,
  options?: SeedOptions
): Promise<{
  landlordsMap: Map<string, string>;
  amenitiesMap: Map<string, string>;
  objectsMap: Map<string, string>;
}> {
  console.log("=== Seeding Booking Bundle ===");

  const landlordsMap = bundle.landlords
    ? await seedLandlords(prisma, bundle.landlords, options)
    : new Map<string, string>();

  const amenitiesMap = bundle.amenities
    ? await seedAmenities(prisma, bundle.amenities, options)
    : new Map<string, string>();

  const objectsMap = bundle.objects
    ? await seedBookingObjects(prisma, bundle.objects, landlordsMap, amenitiesMap, options)
    : new Map<string, string>();

  if (bundle.optionals) {
    await seedBookingOptionals(prisma, bundle.optionals, objectsMap, options);
  }

  if (bundle.price_periods) {
    await seedPricePeriods(prisma, bundle.price_periods, objectsMap, options);
  }

  if (bundle.bookings) {
    await seedBookings(prisma, bundle.bookings, objectsMap, options);
  }

  console.log("=== Booking Bundle Completed ===");
  return { landlordsMap, amenitiesMap, objectsMap };
}
