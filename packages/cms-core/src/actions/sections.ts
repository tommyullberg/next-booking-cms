import { prisma } from "../db";
import { HOMEPAGE_ID } from "./pages";

export async function getSectionsAction() {
  const sections = await prisma.section.findMany({
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

  // Always guarantee the root section (start_page_id === 1001) is first
  return sections.sort((a, b) => {
    const aIsRoot = a.start_page_id === HOMEPAGE_ID ? 0 : 1;
    const bIsRoot = b.start_page_id === HOMEPAGE_ID ? 0 : 1;
    if (aIsRoot !== bIsRoot) return aIsRoot - bIsRoot;
    return a.sort_order - b.sort_order;
  });
}

export interface SaveSectionParams {
  id?: string;
  name: string;
  translations?: Record<string, string> | null;
  startPageId?: number | string | null;
  sortOrder?: number;
  isVisible?: boolean;
}

export async function saveSectionAction(data: SaveSectionParams) {
  const parsedStartPageId =
    data.startPageId !== undefined &&
    data.startPageId !== null &&
    data.startPageId !== "" &&
    !isNaN(Number(data.startPageId))
      ? Number(data.startPageId)
      : null;

  if (data.id && !data.id.startsWith("temp-")) {
    const existing = await prisma.section.findUnique({
      where: { id: data.id },
    });

    const isRootSection = existing?.start_page_id === HOMEPAGE_ID;

    return prisma.section.update({
      where: { id: data.id },
      data: {
        name: data.name,
        translations: data.translations ?? undefined,
        // Root section (page 1001) cannot change its start_page_id or sort_order
        start_page_id: isRootSection ? HOMEPAGE_ID : parsedStartPageId,
        sort_order: isRootSection ? 0 : (data.sortOrder ?? existing?.sort_order ?? 1),
        is_visible: isRootSection ? true : (data.isVisible ?? true),
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
      start_page_id:
        parsedStartPageId === HOMEPAGE_ID ? null : parsedStartPageId,
      sort_order: Math.max(1, data.sortOrder ?? 1),
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
  const allSections = await prisma.section.findMany();
  const rootSection = allSections.find((s) => s.start_page_id === HOMEPAGE_ID);
  const nonRootOrdered = orderedIds.filter((id) => id !== rootSection?.id);

  const updates = [
    ...(rootSection
      ? [
          prisma.section.update({
            where: { id: rootSection.id },
            data: { sort_order: 0 },
          }),
        ]
      : []),
    ...nonRootOrdered.map((id, index) =>
      prisma.section.update({
        where: { id },
        data: { sort_order: index + 1 },
      })
    ),
  ];

  if (updates.length > 0) {
    await prisma.$transaction(updates);
  }
  return getSectionsAction();
}

export async function updateNavigationMenuItemAction(params: {
  previousPageId?: number | string | null;
  targetPageId: number | string;
  sectionId: string | null;
  menuTitle?: string;
  sortOrder?: number;
}) {
  const prevId =
    params.previousPageId !== undefined &&
    params.previousPageId !== null &&
    params.previousPageId !== "" &&
    !isNaN(Number(params.previousPageId))
      ? Number(params.previousPageId)
      : null;

  const targetId = Number(params.targetPageId);

  if (prevId && prevId !== targetId && prevId !== HOMEPAGE_ID) {
    await prisma.page.update({
      where: { id: prevId },
      data: { section_id: null },
    });
  }

  if (!isNaN(targetId)) {
    await prisma.page.update({
      where: { id: targetId },
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
  items: Array<{
    pageId: number | string;
    sectionId: string | null;
    sortOrder: number;
  }>
) {
  const validItems = items.filter((item) => !isNaN(Number(item.pageId)));
  await prisma.$transaction(
    validItems.map((item) =>
      prisma.page.update({
        where: { id: Number(item.pageId) },
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
  const existing = await prisma.section.findUnique({
    where: { id },
  });
  if (existing?.start_page_id === HOMEPAGE_ID) {
    throw new Error(
      "The root section (linked to page 1001) is protected and cannot be deleted."
    );
  }
  return prisma.section.delete({
    where: { id },
  });
}
