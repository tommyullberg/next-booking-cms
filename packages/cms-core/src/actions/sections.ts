import { prisma } from "../db";

export async function getSectionsAction() {
  return prisma.section.findMany({
    orderBy: { sort_order: "asc" },
    include: {
      pages: {
        select: {
          id: true,
          page_title: true,
          slug: true,
          status: true,
        },
      },
    },
  });
}

export interface SaveSectionParams {
  id?: string;
  name: string;
  startPageId?: string | null;
  sortOrder?: number;
  isVisible?: boolean;
}

export async function saveSectionAction(data: SaveSectionParams) {
  if (data.id) {
    return prisma.section.update({
      where: { id: data.id },
      data: {
        name: data.name,
        start_page_id: data.startPageId,
        sort_order: data.sortOrder ?? 0,
        is_visible: data.isVisible ?? true,
      },
    });
  }

  return prisma.section.create({
    data: {
      name: data.name,
      start_page_id: data.startPageId,
      sort_order: data.sortOrder ?? 0,
      is_visible: data.isVisible ?? true,
    },
  });
}

export async function deleteSectionAction(id: string) {
  return prisma.section.delete({
    where: { id },
  });
}
