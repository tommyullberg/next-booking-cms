import { prisma } from "../db";
import { HOMEPAGE_ID } from "./pages";

export async function getSectionsAction() {
  const [sections, allPages, navMenuSetting] = await Promise.all([
    prisma.section.findMany({
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
    }),
    prisma.page.findMany({
      select: {
        id: true,
        page_title: true,
        link_description: true,
        slug: true,
        status: true,
        sort_order: true,
        section_id: true,
      },
    }),
    prisma.setting
      .findUnique({
        where: { setting_key: "navigation_menus" },
      })
      .catch(() => null),
  ]);

  const pageMap = new Map(allPages.map((p) => [p.id, p]));

  let menuConfig: Record<string, Array<{ pageId: number; title?: string }>> = {};
  if (navMenuSetting?.setting_value) {
    try {
      menuConfig = JSON.parse(navMenuSetting.setting_value);
    } catch {
      menuConfig = {};
    }
  }

  // Always guarantee the root section (start_page_id === 1001) is first
  const sorted = sections.sort((a, b) => {
    const aIsRoot = a.start_page_id === HOMEPAGE_ID ? 0 : 1;
    const bIsRoot = b.start_page_id === HOMEPAGE_ID ? 0 : 1;
    if (aIsRoot !== bIsRoot) return aIsRoot - bIsRoot;
    return a.sort_order - b.sort_order;
  });

  return sorted.map((s) => {
    const menuEntries = menuConfig[s.id] || [];
    const menuItems = menuEntries
      .map((entry) => {
        const p = pageMap.get(entry.pageId);
        return p
          ? {
              ...p,
              link_description: entry.title || p.link_description,
            }
          : null;
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    return {
      ...s,
      menu_items: menuItems,
    };
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

  // Fetch current menu config from settings
  const settingRow = await prisma.setting
    .findUnique({
      where: { setting_key: "navigation_menus" },
    })
    .catch(() => null);

  let menuConfig: Record<string, Array<{ pageId: number; title?: string }>> = {};
  if (settingRow?.setting_value) {
    try {
      menuConfig = JSON.parse(settingRow.setting_value);
    } catch {
      menuConfig = {};
    }
  }

  if (!params.sectionId) {
    // Remove from navigation menu
    for (const secKey of Object.keys(menuConfig)) {
      menuConfig[secKey] = menuConfig[secKey].filter(
        (e) => e.pageId !== targetId && e.pageId !== prevId
      );
    }
  } else {
    const secId = params.sectionId;
    if (!menuConfig[secId]) {
      menuConfig[secId] = [];
    }

    // Ensure targetId (and prevId if different) is removed from any other section
    for (const secKey of Object.keys(menuConfig)) {
      if (secKey !== secId) {
        menuConfig[secKey] = menuConfig[secKey].filter(
          (e) => e.pageId !== targetId && (prevId ? e.pageId !== prevId : true)
        );
      }
    }

    if (prevId && prevId !== targetId) {
      menuConfig[secId] = menuConfig[secId].filter((e) => e.pageId !== prevId);
    }

    const existingIdx = menuConfig[secId].findIndex(
      (e) => e.pageId === targetId
    );
    if (existingIdx >= 0) {
      menuConfig[secId][existingIdx] = {
        pageId: targetId,
        title: params.menuTitle || menuConfig[secId][existingIdx].title,
      };
    } else {
      menuConfig[secId].push({
        pageId: targetId,
        title: params.menuTitle,
      });
    }

    if (params.sortOrder !== undefined && params.sortOrder > 0) {
      const itemToMove = menuConfig[secId].find((e) => e.pageId === targetId);
      if (itemToMove) {
        menuConfig[secId] = menuConfig[secId].filter(
          (e) => e.pageId !== targetId
        );
        menuConfig[secId].splice(params.sortOrder - 1, 0, itemToMove);
      }
    }
  }

  // Update page title if specified
  if (!isNaN(targetId) && params.menuTitle !== undefined) {
    await prisma.page.update({
      where: { id: targetId },
      data: {
        link_description: params.menuTitle,
      },
    });
  }

  await prisma.setting.upsert({
    where: { setting_key: "navigation_menus" },
    create: {
      setting_key: "navigation_menus",
      setting_value: JSON.stringify(menuConfig),
    },
    update: {
      setting_value: JSON.stringify(menuConfig),
    },
  });

  return getSectionsAction();
}

export async function reorderNavigationMenuItemsAction(
  items: Array<{
    pageId: number | string;
    sectionId: string | null;
    sortOrder: number;
  }>
) {
  const settingRow = await prisma.setting
    .findUnique({
      where: { setting_key: "navigation_menus" },
    })
    .catch(() => null);

  let menuConfig: Record<string, Array<{ pageId: number; title?: string }>> = {};
  if (settingRow?.setting_value) {
    try {
      menuConfig = JSON.parse(settingRow.setting_value);
    } catch {
      menuConfig = {};
    }
  }

  // Helper to preserve titles across sections when moving items
  const findTitleAcrossAll = (pId: number) => {
    for (const list of Object.values(menuConfig)) {
      const found = list.find((e) => e.pageId === pId);
      if (found?.title) return found.title;
    }
    return undefined;
  };

  const grouped: Record<
    string,
    Array<{ pageId: number; sortOrder: number }>
  > = {};
  for (const it of items) {
    if (it.sectionId && !isNaN(Number(it.pageId))) {
      if (!grouped[it.sectionId]) grouped[it.sectionId] = [];
      grouped[it.sectionId].push({
        pageId: Number(it.pageId),
        sortOrder: it.sortOrder,
      });
    }
  }

  for (const [secId, list] of Object.entries(grouped)) {
    list.sort((a, b) => a.sortOrder - b.sortOrder);
    menuConfig[secId] = list.map((l) => ({
      pageId: l.pageId,
      title: findTitleAcrossAll(l.pageId),
    }));
  }

  await prisma.setting.upsert({
    where: { setting_key: "navigation_menus" },
    create: {
      setting_key: "navigation_menus",
      setting_value: JSON.stringify(menuConfig),
    },
    update: {
      setting_value: JSON.stringify(menuConfig),
    },
  });

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
