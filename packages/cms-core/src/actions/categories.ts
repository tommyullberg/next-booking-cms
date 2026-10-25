import { prisma } from "../db";

export async function getCategoryTypesAction() {
  return prisma.categoryType.findMany({
    orderBy: [{ sort_order: "asc" }, { name: "asc" }],
    include: {
      categories: {
        orderBy: [{ sort_order: "asc" }, { name: "asc" }],
      },
    },
  });
}

export interface SaveCategoryTypeParams {
  id?: string;
  name: string;
  isMultiple?: boolean;
  sortOrder?: number;
}

export async function saveCategoryTypeAction(data: SaveCategoryTypeParams) {
  if (data.id && !data.id.startsWith("temp-")) {
    await prisma.categoryType.update({
      where: { id: data.id },
      data: {
        name: data.name.trim(),
        is_multiple: Boolean(data.isMultiple),
        ...(data.sortOrder !== undefined ? { sort_order: data.sortOrder } : {}),
      },
    });
    return getCategoryTypesAction();
  }

  const maxSort = await prisma.categoryType.aggregate({
    _max: { sort_order: true },
  });
  const nextOrder =
    data.sortOrder !== undefined
      ? data.sortOrder
      : (maxSort._max.sort_order ?? 0) + 1;

  await prisma.categoryType.create({
    data: {
      name: data.name.trim(),
      is_multiple: Boolean(data.isMultiple),
      sort_order: nextOrder,
    },
  });

  return getCategoryTypesAction();
}

export async function deleteCategoryTypeAction(id: string) {
  await prisma.categoryType.delete({
    where: { id },
  });
  return getCategoryTypesAction();
}

export async function reorderCategoryTypesAction(orderedIds: string[]) {
  if (orderedIds.length > 0) {
    await prisma.$transaction(
      orderedIds.map((id, idx) =>
        prisma.categoryType.update({
          where: { id },
          data: { sort_order: idx + 1 },
        })
      )
    );
  }
  return getCategoryTypesAction();
}

export interface SaveCategoryParams {
  id?: string;
  categoryTypeId: string;
  name: string;
  sortOrder?: number;
}

export async function saveCategoryAction(data: SaveCategoryParams) {
  if (data.id && !data.id.startsWith("temp-")) {
    await prisma.category.update({
      where: { id: data.id },
      data: {
        name: data.name.trim(),
        category_type_id: data.categoryTypeId,
        ...(data.sortOrder !== undefined ? { sort_order: data.sortOrder } : {}),
      },
    });
    return getCategoryTypesAction();
  }

  const maxSort = await prisma.category.aggregate({
    where: { category_type_id: data.categoryTypeId },
    _max: { sort_order: true },
  });
  const nextOrder =
    data.sortOrder !== undefined
      ? data.sortOrder
      : (maxSort._max.sort_order ?? 0) + 1;

  await prisma.category.create({
    data: {
      category_type_id: data.categoryTypeId,
      name: data.name.trim(),
      sort_order: nextOrder,
    },
  });

  return getCategoryTypesAction();
}

export async function deleteCategoryAction(id: string) {
  await prisma.category.delete({
    where: { id },
  });
  return getCategoryTypesAction();
}

export async function reorderCategoriesAction(
  items: Array<{
    id: string;
    categoryTypeId: string;
    sortOrder: number;
  }>
) {
  if (items.length > 0) {
    await prisma.$transaction(
      items.map((item) =>
        prisma.category.update({
          where: { id: item.id },
          data: {
            category_type_id: item.categoryTypeId,
            sort_order: item.sortOrder,
          },
        })
      )
    );
  }
  return getCategoryTypesAction();
}
