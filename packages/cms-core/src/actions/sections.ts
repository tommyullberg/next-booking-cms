import { prisma } from "../db";

export async function getSectionsAction() {
  return prisma.section.findMany({
    orderBy: { sort_order: "asc" },
    include: {
      pages: {
        orderBy: { sort_order: "asc" },
        select: {
          id: true,
          page_title: true,
          link_description: true,
          slug: true,
          status: true,
          sort_order: true,
          section_id: true,
        },
      },
    },
  });
}

export interface SaveSectionParams {
  id?: string;
  name: string;
  translations?: Record<string, string> | null;
  startPageId?: string | null;
  sortOrder?: number;
  isVisible?: boolean;
}

export async function saveSectionAction(data: SaveSectionParams) {
  if (data.id && !data.id.startsWith("temp-")) {
    return prisma.section.update({
      where: { id: data.id },
      data: {
        name: data.name,
        translations: data.translations ?? undefined,
        start_page_id: data.startPageId ?? null,
        sort_order: data.sortOrder ?? 0,
        is_visible: data.isVisible ?? true,
      },
      include: {
        pages: {
          orderBy: { sort_order: "asc" },
          select: {
            id: true,
            page_title: true,
            link_description: true,
            slug: true,
            status: true,
            sort_order: true,
            section_id: true,
          },
        },
      },
    });
  }

  return prisma.section.create({
    data: {
      name: data.name,
      translations: data.translations ?? {},
      start_page_id: data.startPageId ?? null,
      sort_order: data.sortOrder ?? 0,
      is_visible: data.isVisible ?? true,
    },
    include: {
      pages: {
        orderBy: { sort_order: "asc" },
        select: {
          id: true,
          page_title: true,
          link_description: true,
          slug: true,
          status: true,
          sort_order: true,
          section_id: true,
        },
      },
    },
  });
}

export async function reorderSectionsAction(orderedIds: string[]) {
  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.section.update({
        where: { id },
        data: { sort_order: index + 1 },
      })
    )
  );
  return getSectionsAction();
}

export async function updateNavigationMenuItemAction(params: {
  previousPageId?: string | null;
  targetPageId: string;
  sectionId: string | null;
  menuTitle?: string;
  sortOrder?: number;
}) {
  if (
    params.previousPageId &&
    params.previousPageId !== params.targetPageId &&
    !params.previousPageId.startsWith("temp-")
  ) {
    await prisma.page.update({
      where: { id: params.previousPageId },
      data: { section_id: null },
    });
  }

  if (params.targetPageId && !params.targetPageId.startsWith("temp-")) {
    await prisma.page.update({
      where: { id: params.targetPageId },
      data: {
        section_id: params.sectionId,
        ...(params.menuTitle !== undefined
          ? { link_description: params.menuTitle }
          : {}),
        ...(params.sortOrder !== undefined
          ? { sort_order: params.sortOrder }
          : {}),
      },
    });
  }

  return getSectionsAction();
}

export async function reorderNavigationMenuItemsAction(
  items: Array<{ pageId: string; sectionId: string | null; sortOrder: number }>
) {
  await prisma.$transaction(
    items.map((item) =>
      prisma.page.update({
        where: { id: item.pageId },
        data: {
          section_id: item.sectionId,
          sort_order: item.sortOrder,
        },
      })
    )
  );
  return getSectionsAction();
}

export async function deleteSectionAction(id: string) {
  return prisma.section.delete({
    where: { id },
  });
}
