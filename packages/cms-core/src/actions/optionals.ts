import { prisma } from "../db";
import { BookingOptionalItem } from "../booking/types";

export async function getBookingOptionalsAction(objectId?: string): Promise<BookingOptionalItem[]> {
  try {
    const raw = await prisma.bookingOptional.findMany({
      where: objectId ? { OR: [{ object_id: objectId }, { object_id: null }] } : undefined,
      orderBy: { sort_order: "asc" },
      include: {
        object: {
          select: { id: true, name: true },
        },
      },
    });

    return raw.map((opt) => ({
      id: opt.id,
      name: opt.name,
      description: opt.description,
      image_url: opt.image_url,
      object_id: opt.object_id,
      is_active: opt.is_active,
      price_hour: opt.price_hour,
      price_day: opt.price_day,
      price_sun_thu: opt.price_sun_thu,
      price_thu_sun: opt.price_thu_sun,
      price_week: opt.price_week,
      sort_order: opt.sort_order,
      object: opt.object ? { id: opt.object.id, name: opt.object.name } : null,
      created_at: opt.created_at.toISOString(),
      updated_at: opt.updated_at.toISOString(),
    }));
  } catch (err) {
    console.error("[cms-core] Failed to fetch booking optionals:", err);
    return [];
  }
}

export async function createBookingOptionalAction(data: {
  name: string;
  description?: string | null;
  image_url?: string | null;
  object_id?: string | null;
  is_active?: boolean;
  price_hour?: number | null;
  price_day?: number | null;
  price_sun_thu?: number | null;
  price_thu_sun?: number | null;
  price_week?: number | null;
  sort_order?: number;
}): Promise<BookingOptionalItem> {
  const normalized = {
    name: data.name.trim(),
    description: data.description?.trim() || null,
    image_url: data.image_url?.trim() || null,
    object_id: data.object_id?.trim() || null,
    is_active: data.is_active !== undefined ? Boolean(data.is_active) : true,
    price_hour: Number(data.price_hour || 0),
    price_day: Number(data.price_day || 0),
    price_sun_thu: Number(data.price_sun_thu || 0),
    price_thu_sun: Number(data.price_thu_sun || 0),
    price_week: Number(data.price_week || 0),
    sort_order: Number(data.sort_order || 0),
  };

  const created = await prisma.bookingOptional.create({
    data: normalized,
    include: {
      object: {
        select: { id: true, name: true },
      },
    },
  });

  return {
    id: created.id,
    name: created.name,
    description: created.description,
    image_url: created.image_url,
    object_id: created.object_id,
    is_active: created.is_active,
    price_hour: created.price_hour,
    price_day: created.price_day,
    price_sun_thu: created.price_sun_thu,
    price_thu_sun: created.price_thu_sun,
    price_week: created.price_week,
    sort_order: created.sort_order,
    object: created.object ? { id: created.object.id, name: created.object.name } : null,
    created_at: created.created_at.toISOString(),
    updated_at: created.updated_at.toISOString(),
  };
}

export async function updateBookingOptionalAction(data: {
  id: string;
  name: string;
  description?: string | null;
  image_url?: string | null;
  object_id?: string | null;
  is_active?: boolean;
  price_hour?: number | null;
  price_day?: number | null;
  price_sun_thu?: number | null;
  price_thu_sun?: number | null;
  price_week?: number | null;
  sort_order?: number;
}): Promise<BookingOptionalItem> {
  const normalized = {
    name: data.name.trim(),
    description: data.description?.trim() || null,
    image_url: data.image_url?.trim() || null,
    object_id: data.object_id?.trim() || null,
    is_active: data.is_active !== undefined ? Boolean(data.is_active) : true,
    price_hour: Number(data.price_hour || 0),
    price_day: Number(data.price_day || 0),
    price_sun_thu: Number(data.price_sun_thu || 0),
    price_thu_sun: Number(data.price_thu_sun || 0),
    price_week: Number(data.price_week || 0),
    sort_order: Number(data.sort_order || 0),
  };

  const updated = await prisma.bookingOptional.update({
    where: { id: data.id },
    data: normalized,
    include: {
      object: {
        select: { id: true, name: true },
      },
    },
  });

  return {
    id: updated.id,
    name: updated.name,
    description: updated.description,
    image_url: updated.image_url,
    object_id: updated.object_id,
    is_active: updated.is_active,
    price_hour: updated.price_hour,
    price_day: updated.price_day,
    price_sun_thu: updated.price_sun_thu,
    price_thu_sun: updated.price_thu_sun,
    price_week: updated.price_week,
    sort_order: updated.sort_order,
    object: updated.object ? { id: updated.object.id, name: updated.object.name } : null,
    created_at: updated.created_at.toISOString(),
    updated_at: updated.updated_at.toISOString(),
  };
}

export async function deleteBookingOptionalAction(id: string): Promise<void> {
  await prisma.bookingOptional.delete({
    where: { id },
  });
}
