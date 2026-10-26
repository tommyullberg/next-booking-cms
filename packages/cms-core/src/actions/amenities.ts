import { prisma } from "../db";

export interface AmenityDetails {
  id: string;
  name: string;
  sort_order: number;
  object_count?: number;
  created_at?: Date;
  updated_at?: Date;
}

export async function getAmenitiesAction(): Promise<AmenityDetails[]> {
  try {
    const raw = await prisma.amenity.findMany({
      orderBy: [{ sort_order: "asc" }, { name: "asc" }],
      include: {
        _count: {
          select: { objects: true },
        },
      },
    });

    return raw.map((a) => ({
      id: a.id,
      name: a.name,
      sort_order: a.sort_order,
      object_count: a._count.objects,
      created_at: a.created_at,
      updated_at: a.updated_at,
    }));
  } catch (err) {
    console.error("[cms-core] Failed to fetch amenities:", err);
    return [];
  }
}

export async function createAmenityAction(data: {
  name: string;
  sort_order?: number;
}): Promise<AmenityDetails> {
  const normalizedName = data.name.trim();
  if (!normalizedName) {
    throw new Error("Amenity name cannot be empty");
  }

  const created = await prisma.amenity.create({
    data: {
      name: normalizedName,
      sort_order: Number(data.sort_order ?? 0),
    },
    include: {
      _count: {
        select: { objects: true },
      },
    },
  });

  return {
    id: created.id,
    name: created.name,
    sort_order: created.sort_order,
    object_count: created._count.objects,
    created_at: created.created_at,
    updated_at: created.updated_at,
  };
}

export async function updateAmenityAction(data: {
  id: string;
  name: string;
  sort_order?: number;
}): Promise<AmenityDetails> {
  const normalizedName = data.name.trim();
  if (!normalizedName) {
    throw new Error("Amenity name cannot be empty");
  }

  const updated = await prisma.amenity.update({
    where: { id: data.id },
    data: {
      name: normalizedName,
      ...(data.sort_order !== undefined
        ? { sort_order: Number(data.sort_order) }
        : {}),
    },
    include: {
      _count: {
        select: { objects: true },
      },
    },
  });

  return {
    id: updated.id,
    name: updated.name,
    sort_order: updated.sort_order,
    object_count: updated._count.objects,
    created_at: updated.created_at,
    updated_at: updated.updated_at,
  };
}

export async function deleteAmenityAction(id: string): Promise<void> {
  await prisma.amenity.delete({
    where: { id },
  });
}

export async function reorderAmenitiesAction(
  orderedIds: string[]
): Promise<void> {
  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.amenity.update({
        where: { id },
        data: { sort_order: (index + 1) * 10 },
      })
    )
  );
}

