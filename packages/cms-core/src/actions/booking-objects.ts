import { prisma } from "../db";
import {
  BookingObjectDetails,
  formatBookingObjectType,
} from "../booking/types";

export async function getBookingObjectsAction(): Promise<BookingObjectDetails[]> {
  try {
    const raw = await prisma.bookingObject.findMany({
      orderBy: { sort_order: "asc" },
      include: {
        landlord: true,
        page: {
          select: {
            id: true,
            page_title: true,
            slug: true,
          },
        },
        amenities: {
          orderBy: { sort_order: "asc" },
        },
        galleries: {
          include: { image: true },
          orderBy: { sort_order: "asc" },
        },
      },
    });

    return raw.map((obj) => ({
      id: obj.id,
      name: obj.name,
      type: obj.type,
      description: obj.description,
      page_id: obj.page_id,
      landlord_id: obj.landlord_id,
      sort_order: obj.sort_order,
      is_visible: obj.is_visible,
      size_sqm: obj.size_sqm,
      room_count: obj.room_count,
      room_type: obj.room_type,
      bed_count: obj.bed_count,
      extra_bed_count: obj.extra_bed_count,
      pets_allowed: obj.pets_allowed,
      price_matrix: obj.price_matrix as any,
      ical_url: obj.ical_url,
      ical_last_synced: obj.ical_last_synced,
      landlord: obj.landlord
        ? {
            id: obj.landlord.id,
            first_name: obj.landlord.first_name,
            last_name: obj.landlord.last_name,
            mobile: obj.landlord.mobile,
          }
        : null,
      page: obj.page
        ? {
            id: obj.page.id,
            page_title: obj.page.page_title,
            slug: obj.page.slug,
          }
        : null,
      amenities: obj.amenities.map((a) => ({
        id: a.id,
        name: a.name,
        sort_order: a.sort_order,
      })),
      galleries: obj.galleries.map((g) => ({
        id: g.id,
        image: { file_url: g.image.file_url, file_name: g.image.file_name },
      })),
    }));
  } catch (err) {
    console.error("[cms-core] Failed to fetch booking objects:", err);
    return [];
  }
}

export async function createBookingObjectAction(data: {
  name: string;
  type?: string | null;
  description?: string | null;
  page_id?: number | null;
  landlord_id?: string | null;
  sort_order?: number;
  is_visible?: boolean;
  size_sqm?: number | null;
  room_count?: number | null;
  room_type?: string | null;
  bed_count?: number;
  extra_bed_count?: number;
  pets_allowed?: boolean;
  ical_url?: string | null;
  amenity_ids?: string[];
}): Promise<BookingObjectDetails> {
  const normalized = {
    name: data.name.trim(),
    type: formatBookingObjectType(data.type),
    description: data.description?.trim() || null,
    page_id: data.page_id ? Number(data.page_id) : null,
    landlord_id: data.landlord_id?.trim() || null,
    sort_order: Number(data.sort_order ?? 0),
    is_visible: data.is_visible !== undefined ? Boolean(data.is_visible) : true,
    size_sqm: data.size_sqm !== undefined && data.size_sqm !== null ? Number(data.size_sqm) : null,
    room_count: data.room_count !== undefined && data.room_count !== null ? Number(data.room_count) : 1,
    room_type: data.room_type?.trim() || "Room(s) and kitchen / ROK",
    bed_count: Number(data.bed_count ?? 1),
    extra_bed_count: Number(data.extra_bed_count ?? 0),
    pets_allowed: Boolean(data.pets_allowed),
    ical_url: data.ical_url?.trim() || null,
    amenities: data.amenity_ids?.length
      ? {
          connect: data.amenity_ids.map((id) => ({ id })),
        }
      : undefined,
  };

  const created = await prisma.bookingObject.create({
    data: normalized,
    include: {
      landlord: true,
      page: {
        select: {
          id: true,
          page_title: true,
          slug: true,
        },
      },
      amenities: {
        orderBy: { sort_order: "asc" },
      },
      galleries: {
        include: { image: true },
        orderBy: { sort_order: "asc" },
      },
    },
  });

  return {
    id: created.id,
    name: created.name,
    type: created.type,
    description: created.description,
    page_id: created.page_id,
    landlord_id: created.landlord_id,
    sort_order: created.sort_order,
    is_visible: created.is_visible,
    size_sqm: created.size_sqm,
    room_count: created.room_count,
    room_type: created.room_type,
    bed_count: created.bed_count,
    extra_bed_count: created.extra_bed_count,
    pets_allowed: created.pets_allowed,
    ical_url: created.ical_url,
    ical_last_synced: created.ical_last_synced,
    landlord: created.landlord
      ? {
          id: created.landlord.id,
          first_name: created.landlord.first_name,
          last_name: created.landlord.last_name,
          mobile: created.landlord.mobile,
        }
      : null,
    page: created.page
      ? {
          id: created.page.id,
          page_title: created.page.page_title,
          slug: created.page.slug,
        }
      : null,
    amenities: created.amenities.map((a) => ({
      id: a.id,
      name: a.name,
      sort_order: a.sort_order,
    })),
    galleries: created.galleries.map((g) => ({
      id: g.id,
      image: { file_url: g.image.file_url, file_name: g.image.file_name },
    })),
  };
}

export async function updateBookingObjectAction(data: {
  id: string;
  name: string;
  type?: string | null;
  description?: string | null;
  page_id?: number | null;
  landlord_id?: string | null;
  sort_order?: number;
  is_visible?: boolean;
  size_sqm?: number | null;
  room_count?: number | null;
  room_type?: string | null;
  bed_count?: number;
  extra_bed_count?: number;
  pets_allowed?: boolean;
  ical_url?: string | null;
  amenity_ids?: string[];
}): Promise<BookingObjectDetails> {
  const normalized = {
    name: data.name.trim(),
    type: formatBookingObjectType(data.type),
    description: data.description?.trim() || null,
    page_id: data.page_id ? Number(data.page_id) : null,
    landlord_id: data.landlord_id?.trim() || null,
    sort_order: Number(data.sort_order ?? 0),
    is_visible: data.is_visible !== undefined ? Boolean(data.is_visible) : true,
    size_sqm: data.size_sqm !== undefined && data.size_sqm !== null ? Number(data.size_sqm) : null,
    room_count: data.room_count !== undefined && data.room_count !== null ? Number(data.room_count) : 1,
    room_type: data.room_type?.trim() || "Room(s) and kitchen / ROK",
    bed_count: Number(data.bed_count ?? 1),
    extra_bed_count: Number(data.extra_bed_count ?? 0),
    pets_allowed: Boolean(data.pets_allowed),
    ical_url: data.ical_url !== undefined ? (data.ical_url?.trim() || null) : undefined,
    amenities: data.amenity_ids !== undefined
      ? {
          set: data.amenity_ids.map((id) => ({ id })),
        }
      : undefined,
  };

  const updated = await prisma.bookingObject.update({
    where: { id: data.id },
    data: normalized,
    include: {
      landlord: true,
      page: {
        select: {
          id: true,
          page_title: true,
          slug: true,
        },
      },
      amenities: {
        orderBy: { sort_order: "asc" },
      },
      galleries: {
        include: { image: true },
        orderBy: { sort_order: "asc" },
      },
    },
  });

  return {
    id: updated.id,
    name: updated.name,
    type: updated.type,
    description: updated.description,
    page_id: updated.page_id,
    landlord_id: updated.landlord_id,
    sort_order: updated.sort_order,
    is_visible: updated.is_visible,
    size_sqm: updated.size_sqm,
    room_count: updated.room_count,
    room_type: updated.room_type,
    bed_count: updated.bed_count,
    extra_bed_count: updated.extra_bed_count,
    pets_allowed: updated.pets_allowed,
    ical_url: updated.ical_url,
    ical_last_synced: updated.ical_last_synced,
    landlord: updated.landlord
      ? {
          id: updated.landlord.id,
          first_name: updated.landlord.first_name,
          last_name: updated.landlord.last_name,
          mobile: updated.landlord.mobile,
        }
      : null,
    page: updated.page
      ? {
          id: updated.page.id,
          page_title: updated.page.page_title,
          slug: updated.page.slug,
        }
      : null,
    amenities: updated.amenities.map((a) => ({
      id: a.id,
      name: a.name,
      sort_order: a.sort_order,
    })),
    galleries: updated.galleries.map((g) => ({
      id: g.id,
      image: { file_url: g.image.file_url, file_name: g.image.file_name },
    })),
  };
}

export async function deleteBookingObjectAction(id: string): Promise<void> {
  await prisma.bookingObject.delete({
    where: { id },
  });
}
