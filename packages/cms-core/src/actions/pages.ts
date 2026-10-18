import { prisma } from "../db";
import { PageStatus } from "@prisma/client";

export const SLUG_BLACKLIST = [
  "admin",
  "api",
  "login",
  "auth",
  "dashboard",
  "settings",
  "booking",
  "uploads",
  "static",
  "_next",
];

export function sanitizeSlug(rawSlug: string, fallbackId?: string): string {
  const cleaned = rawSlug
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-/]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  if (!cleaned || SLUG_BLACKLIST.includes(cleaned)) {
    return fallbackId ? `page-${fallbackId}` : `page-${Date.now()}`;
  }

  return cleaned;
}

export async function getPagesAction() {
  return prisma.page.findMany({
    orderBy: { created_date: "desc" },
    include: {
      section: true,
      translations: true,
      _count: {
        select: { page_fields: true },
      },
    },
  });
}

export async function getPageByIdAction(id: string) {
  return prisma.page.findUnique({
    where: { id },
    include: {
      section: true,
      translations: true,
      page_fields: {
        include: {
          image: true,
          translations: true,
          navigation: {
            include: {
              navigation_links: {
                orderBy: { sort_order: "asc" },
              },
            },
          },
        },
        orderBy: [{ field_type: "asc" }, { nbr: "asc" }],
      },
    },
  });
}

export async function getPageBySlugAction(slug: string) {
  return prisma.page.findUnique({
    where: { slug },
    include: {
      section: true,
      translations: true,
      page_fields: {
        include: {
          image: true,
          translations: true,
          navigation: {
            include: {
              navigation_links: {
                orderBy: { sort_order: "asc" },
              },
            },
          },
        },
        orderBy: [{ field_type: "asc" }, { nbr: "asc" }],
      },
    },
  });
}

export interface SavePageParams {
  id?: string;
  templateName: string;
  sectionId?: string | null;
  pageTitle: string;
  linkDescription?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  slug: string;
  status?: PageStatus;
  publicationStart?: Date | null;
  publicationEnd?: Date | null;
  createdBy?: string | null;
  translations?: Array<{
    locale: string;
    pageTitle: string;
    linkDescription?: string | null;
    metaTitle?: string | null;
    metaDescription?: string | null;
  }>;
}

export async function savePageAction(data: SavePageParams) {
  const validSlug = sanitizeSlug(data.slug, data.id);

  if (data.id) {
    // Update existing page
    const page = await prisma.page.update({
      where: { id: data.id },
      data: {
        template_name: data.templateName,
        section_id: data.sectionId,
        page_title: data.pageTitle,
        link_description: data.linkDescription,
        meta_title: data.metaTitle,
        meta_description: data.metaDescription,
        slug: validSlug,
        status: data.status,
        publication_start: data.publicationStart,
        publication_end: data.publicationEnd,
      },
    });

    // Update translations if provided
    if (data.translations && data.translations.length > 0) {
      for (const t of data.translations) {
        await prisma.pageTranslation.upsert({
          where: {
            page_id_locale: {
              page_id: page.id,
              locale: t.locale,
            },
          },
          update: {
            page_title: t.pageTitle,
            link_description: t.linkDescription,
            meta_title: t.metaTitle,
            meta_description: t.metaDescription,
          },
          create: {
            page_id: page.id,
            locale: t.locale,
            page_title: t.pageTitle,
            link_description: t.linkDescription,
            meta_title: t.metaTitle,
            meta_description: t.metaDescription,
          },
        });
      }
    }

    return getPageByIdAction(page.id);
  }

  // Create new page
  const page = await prisma.page.create({
    data: {
      template_name: data.templateName,
      section_id: data.sectionId,
      page_title: data.pageTitle,
      link_description: data.linkDescription,
      meta_title: data.metaTitle,
      meta_description: data.metaDescription,
      slug: validSlug,
      status: data.status || PageStatus.NEW,
      publication_start: data.publicationStart,
      publication_end: data.publicationEnd,
      created_by: data.createdBy,
    },
  });

  if (data.translations && data.translations.length > 0) {
    for (const t of data.translations) {
      await prisma.pageTranslation.create({
        data: {
          page_id: page.id,
          locale: t.locale,
          page_title: t.pageTitle,
          link_description: t.linkDescription,
          meta_title: t.metaTitle,
          meta_description: t.metaDescription,
        },
      });
    }
  }

  return getPageByIdAction(page.id);
}

export async function deletePageAction(id: string) {
  return prisma.page.delete({
    where: { id },
  });
}
