import { prisma } from "../db";
import { PageStatus } from "@prisma/client";

export const HOMEPAGE_ID = 1001;

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

export function sanitizeSlug(
  rawSlug: string,
  fallbackId?: number | string
): string {
  const numId = fallbackId !== undefined ? Number(fallbackId) : undefined;
  if (numId === HOMEPAGE_ID) {
    return "/";
  }

  const trimmed = (rawSlug || "").trim();
  if (trimmed === "/" || trimmed === "") {
    return numId && !isNaN(numId) ? String(numId) : "";
  }

  const cleaned = trimmed
    .toLowerCase()
    .replace(/^\/+/, "")
    .replace(/[^a-z0-9-/]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  if (!cleaned || SLUG_BLACKLIST.includes(cleaned)) {
    return numId && !isNaN(numId) ? String(numId) : "";
  }

  return cleaned;
}

export async function getPagesAction() {
  return prisma.page.findMany({
    orderBy: [{ id: "asc" }],
    include: {
      section: true,
      translations: true,
      _count: {
        select: { page_fields: true },
      },
    },
  });
}

export async function getPageByIdAction(id: number | string) {
  const numericId = Number(id);
  if (isNaN(numericId)) return null;

  return prisma.page.findUnique({
    where: { id: numericId },
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
      },
    },
  });
}

export async function resolvePageBySlugOrIdAction(
  rawPath?: string | string[]
): Promise<{
  page: Awaited<ReturnType<typeof getPageByIdAction>>;
  shouldRedirectToRoot: boolean;
}> {
  const joined = Array.isArray(rawPath)
    ? rawPath.join("/").trim()
    : (rawPath || "").trim();
  const normalized = joined.replace(/^\/+|\/+$/g, "");

  // 1. Root "/" or empty -> load Homepage (ID 1001)
  if (!normalized || normalized === "/") {
    const home =
      (await getPageByIdAction(HOMEPAGE_ID)) ||
      (await getPageBySlugAction("/"));
    return { page: home, shouldRedirectToRoot: false };
  }

  // 2. Visiting "/1001" -> redirect to "/" so homepage is always served at "/"
  if (normalized === String(HOMEPAGE_ID)) {
    const home =
      (await getPageByIdAction(HOMEPAGE_ID)) ||
      (await getPageBySlugAction("/"));
    return { page: home, shouldRedirectToRoot: true };
  }

  // 3. Match by slug first
  const bySlug = await getPageBySlugAction(normalized);
  if (bySlug) {
    if (bySlug.id === HOMEPAGE_ID) {
      return { page: bySlug, shouldRedirectToRoot: true };
    }
    return { page: bySlug, shouldRedirectToRoot: false };
  }

  // 4. Match by numeric page ID (e.g. "/1002")
  if (/^\d+$/.test(normalized)) {
    const byId = await getPageByIdAction(Number(normalized));
    if (byId) {
      if (byId.id === HOMEPAGE_ID) {
        return { page: byId, shouldRedirectToRoot: true };
      }
      return { page: byId, shouldRedirectToRoot: false };
    }
  }

  return { page: null, shouldRedirectToRoot: false };
}

export interface SavePageParams {
  id?: number | string;
  templateName: string;
  sectionId?: string | null;
  pageTitle: string;
  linkDescription?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  slug: string;
  status?: PageStatus;
  publicationStart?: Date | string | null;
  publicationEnd?: Date | string | null;
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
  const numericId =
    data.id !== undefined && data.id !== "" && !isNaN(Number(data.id))
      ? Number(data.id)
      : undefined;

  if (numericId) {
    const isHomepage = numericId === HOMEPAGE_ID;
    const validSlug = isHomepage
      ? "/"
      : sanitizeSlug(data.slug, numericId) || String(numericId);
    const effectiveTemplate = isHomepage
      ? data.templateName || "startpage"
      : data.templateName || "Default";

    // Update existing page
    const page = await prisma.page.update({
      where: { id: numericId },
      data: {
        template_name: effectiveTemplate,
        section_id: data.sectionId || null,
        page_title: data.pageTitle,
        link_description: data.linkDescription,
        meta_title: data.metaTitle,
        meta_description: data.metaDescription,
        slug: validSlug,
        status: data.status,
        publication_start: data.publicationStart
          ? new Date(data.publicationStart)
          : null,
        publication_end: data.publicationEnd
          ? new Date(data.publicationEnd)
          : null,
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

  // Create new page (gets autoincrement ID >= 1002)
  const initialSlug = sanitizeSlug(data.slug);
  const tempSlug = initialSlug || `temp-${Date.now()}`;

  let page = await prisma.page.create({
    data: {
      template_name: data.templateName || "Default",
      section_id: data.sectionId || null,
      page_title: data.pageTitle,
      link_description: data.linkDescription,
      meta_title: data.metaTitle,
      meta_description: data.metaDescription,
      slug: tempSlug,
      status: data.status || PageStatus.NEW,
      publication_start: data.publicationStart
        ? new Date(data.publicationStart)
        : null,
      publication_end: data.publicationEnd
        ? new Date(data.publicationEnd)
        : null,
      created_by: data.createdBy,
    },
  });

  // If no custom slug was provided, set the default slug to the numeric page ID (e.g. "1002")
  if (!initialSlug) {
    page = await prisma.page.update({
      where: { id: page.id },
      data: { slug: String(page.id) },
    });
  }

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

export async function deletePageAction(id: number | string) {
  const numericId = Number(id);
  if (numericId === HOMEPAGE_ID) {
    throw new Error("The startpage (ID 1001) is protected and cannot be deleted.");
  }
  return prisma.page.delete({
    where: { id: numericId },
  });
}

export async function loadAdminInitialData() {
  const { getSectionsAction } = await import("./sections");
  const { getMediaFilesAction } = await import("./media");
  const { getMailTemplatesAction } = await import("../mail");
  const { getCmsSettingsAction } = await import("./settings");

  let pages: any[] = [];
  let sections: any[] = [];
  let media: any[] = [];
  let mailTemplates: any[] = [];
  let settings = { activeLanguages: ["sv", "en", "de"], bookingIcalUrl: "" };

  try {
    [pages, sections, media, mailTemplates, settings] = await Promise.all([
      getPagesAction(),
      getSectionsAction(),
      getMediaFilesAction(),
      getMailTemplatesAction(),
      getCmsSettingsAction(),
    ]);
  } catch {
    pages = [];
    sections = [];
    media = [];
    mailTemplates = [];
  }

  return { pages, sections, media, mailTemplates, settings };
}
