import { prisma } from "../db";
import {
  BookingObjectDetails,
  BOOKING_OBJECT_TYPES,
  formatBookingObjectType,
} from "../booking/types";

export const SAMPLE_BOOKING_OBJECTS: BookingObjectDetails[] = [
  {
    id: "obj-11",
    name: 'Stuga "Storstugan"',
    type: "Cabin / Stuga",
    description:
      'Stuga "Storstugan"\nToppmodern m inglasad veranda och fin havsutsikt\n6 bäddar, 66 m2',
    page_id: 1001,
    landlord_id: "sample-landlord-1",
    sort_order: 10,
    is_visible: true,
    size_sqm: 66,
    room_count: 5,
    room_type: "rum och kök",
    bed_count: 6,
    extra_bed_count: 0,
    pets_allowed: true,
    price_matrix: { base_night_price: 2500 },
    landlord: {
      id: "sample-landlord-1",
      first_name: "Jan",
      last_name: "Ullberg",
      mobile: "070-620 96 11",
    },
    page: {
      id: 1001,
      page_title: 'Stuga "Storstugan"',
      slug: "stuga-storstugan",
    },
    galleries: [],
    amenities: [],
  },
  {
    id: "obj-12",
    name: 'Stuga "Rödan"',
    type: "Cabin / Stuga",
    description:
      'Stuga "Rödan"\nCharmig modern stuga med havsutsikt\n2+2 bäddar, 25 m2',
    page_id: null,
    landlord_id: "sample-landlord-1",
    sort_order: 20,
    is_visible: false,
    size_sqm: 25,
    room_count: 2,
    room_type: "ROP",
    bed_count: 2,
    extra_bed_count: 2,
    pets_allowed: false,
    price_matrix: { base_night_price: 1800 },
    landlord: {
      id: "sample-landlord-1",
      first_name: "Jan",
      last_name: "Ullberg",
      mobile: "070-620 96 11",
    },
    page: null,
    galleries: [],
    amenities: [],
  },
  {
    id: "obj-13",
    name: 'Stuga "Snäckskalet"',
    type: "Cabin / Stuga",
    description:
      'Stuga "Snäckskalet"\nToppmodern stuga m havsutsikt\n4+2 bäddar, 35 m2',
    page_id: null,
    landlord_id: "sample-landlord-1",
    sort_order: 30,
    is_visible: true,
    size_sqm: 35,
    room_count: 3,
    room_type: "rum och kök",
    bed_count: 4,
    extra_bed_count: 2,
    pets_allowed: true,
    price_matrix: { base_night_price: 2100 },
    landlord: {
      id: "sample-landlord-1",
      first_name: "Jan",
      last_name: "Ullberg",
      mobile: "070-620 96 11",
    },
    page: null,
    galleries: [],
    amenities: [],
  },
  {
    id: "obj-14",
    name: 'Stuga "Cuba"',
    type: "Cabin / Stuga",
    description:
      'Stuga "Cuba"\nToppmodern med avskilt läge och havet mellan tallarna\n4 +2 bäddar, 40 m2',
    page_id: null,
    landlord_id: "sample-landlord-1",
    sort_order: 40,
    is_visible: true,
    size_sqm: 40,
    room_count: 3,
    room_type: "rum och kök",
    bed_count: 4,
    extra_bed_count: 2,
    pets_allowed: false,
    price_matrix: { base_night_price: 2300 },
    landlord: {
      id: "sample-landlord-1",
      first_name: "Jan",
      last_name: "Ullberg",
      mobile: "070-620 96 11",
    },
    page: null,
    galleries: [],
    amenities: [],
  },
];

let inMemoryBookingObjects: BookingObjectDetails[] = [...SAMPLE_BOOKING_OBJECTS];

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
        amenities: true,
        galleries: {
          include: { image: true },
          orderBy: { sort_order: "asc" },
        },
      },
    });

    if (raw.length === 0) {
      return inMemoryBookingObjects;
    }

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
      amenities: obj.amenities.map((a) => ({ id: a.id, name: a.name })),
      galleries: obj.galleries.map((g) => ({
        id: g.id,
        image: { file_url: g.image.file_url, file_name: g.image.file_name },
      })),
    }));
  } catch {
    return inMemoryBookingObjects;
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
    room_type: data.room_type?.trim() || "rum och kök",
    bed_count: Number(data.bed_count ?? 1),
    extra_bed_count: Number(data.extra_bed_count ?? 0),
    pets_allowed: Boolean(data.pets_allowed),
  };

  try {
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
        amenities: true,
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
      price_matrix: created.price_matrix as any,
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
      amenities: [],
      galleries: [],
    };
  } catch {
    const newEntry: BookingObjectDetails = {
      id: `obj-${Date.now()}`,
      ...normalized,
      landlord: null,
      page: null,
      galleries: [],
      amenities: [],
    };
    inMemoryBookingObjects = [...inMemoryBookingObjects, newEntry];
    return newEntry;
  }
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
    room_type: data.room_type?.trim() || "rum och kök",
    bed_count: Number(data.bed_count ?? 1),
    extra_bed_count: Number(data.extra_bed_count ?? 0),
    pets_allowed: Boolean(data.pets_allowed),
  };

  try {
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
        amenities: true,
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
      amenities: updated.amenities.map((a) => ({ id: a.id, name: a.name })),
      galleries: updated.galleries.map((g) => ({
        id: g.id,
        image: { file_url: g.image.file_url, file_name: g.image.file_name },
      })),
    };
  } catch {
    const idx = inMemoryBookingObjects.findIndex((o) => o.id === data.id);
    const existing = inMemoryBookingObjects[idx] || SAMPLE_BOOKING_OBJECTS[0];
    const updatedEntry: BookingObjectDetails = {
      ...existing,
      ...normalized,
    };
    if (idx !== -1) {
      inMemoryBookingObjects[idx] = updatedEntry;
    } else {
      inMemoryBookingObjects.push(updatedEntry);
    }
    return updatedEntry;
  }
}

export async function deleteBookingObjectAction(id: string): Promise<void> {
  try {
    await prisma.bookingObject.delete({
      where: { id },
    });
  } catch {
    inMemoryBookingObjects = inMemoryBookingObjects.filter((o) => o.id !== id);
  }
}

