import { prisma } from "../db";
import { PageStatus } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth";
import {
  HOMEPAGE_ID,
  cleanSlugInput,
  validateSlugInput,
  isDefaultIdOrRootSlug,
} from "../utils/slug";

export { HOMEPAGE_ID };

export function isPageVisibleToVisitor(page: {
  status: PageStatus | string;
  publication_start?: Date | string | null;
  publication_end?: Date | string | null;
}): boolean {
  if (page.status !== "PUBLISHED") {
    return false;
  }
  const now = new Date();
  if (page.publication_start && new Date(page.publication_start) > now) {
    return false;
  }
  if (page.publication_end && new Date(page.publication_end) < now) {
    return false;
  }
  return true;
}

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
  if (
    trimmed === "/" ||
    trimmed === "" ||
    (numId !== undefined && trimmed === String(numId))
  ) {
    return numId && !isNaN(numId) ? String(numId) : "";
  }

  const cleaned = cleanSlugInput(trimmed, false);
  const validation = validateSlugInput(cleaned, { currentPageId: numId });

  if (!cleaned || !validation.isValid) {
    return numId && !isNaN(numId) ? String(numId) : "";
  }

  return cleaned;
}

export async function getPagesAction() {
  return prisma.page.findMany({
    orderBy: [{ id: "asc" }],
    include: {
      section: true,
      categories: true,
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
      categories: true,
      translations: true,
      objects: {
        include: {
          amenities: true,
        },
      },
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
      categories: true,
      translations: true,
      objects: {
        include: {
          amenities: true,
        },
      },
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

export async function getPublicNavigationSectionsAction(isAdmin = false) {
  const { getSectionsAction } = await import("./sections");
  const [sections, allPages] = await Promise.all([
    getSectionsAction().catch(() => []),
    prisma.page
      .findMany({
        select: {
          id: true,
          page_title: true,
          link_description: true,
          slug: true,
          status: true,
          sort_order: true,
          section_id: true,
          publication_start: true,
          publication_end: true,
        },
        orderBy: [{ sort_order: "asc" }, { id: "asc" }],
      })
      .catch(() => []),
  ]);

  const pageMap = new Map(allPages.map((p) => [p.id, p]));
  const toUrl = (p: { id: number; slug: string }) => {
    if (p.id === HOMEPAGE_ID || p.slug === "/") return "/";
    const clean = (p.slug || String(p.id)).replace(/^\/+/, "");
    return `/${clean || p.id}`;
  };

  return sections
    .filter((s) => s.is_visible !== false || s.start_page_id === HOMEPAGE_ID)
    .map((s) => {
      const isRoot = s.start_page_id === HOMEPAGE_ID;
      const startPage = s.start_page_id ? pageMap.get(s.start_page_id) : null;
      const startPageAllowed =
        startPage && (isAdmin || isPageVisibleToVisitor(startPage));

      const sectionPages = allPages.filter(
        (p) =>
          p.section_id === s.id &&
          p.id !== HOMEPAGE_ID &&
          (isAdmin || isPageVisibleToVisitor(p))
      );

      return {
        id: s.id,
        name: s.name,
        translations: s.translations,
        is_root: isRoot,
        start_page_id: s.start_page_id ?? null,
        start_page_url: isRoot
          ? "/"
          : startPageAllowed && startPage
            ? toUrl(startPage)
            : null,
        items: sectionPages.map((p) => ({
          id: p.id,
          label: p.link_description || p.page_title,
          url: toUrl(p),
          status: p.status,
        })),
      };
    });
}

export async function resolvePageBySlugOrIdAction(
  rawPath?: string | string[]
): Promise<{
  page:
    | (NonNullable<Awaited<ReturnType<typeof getPageByIdAction>>> & {
        navigation_sections?: Awaited<
          ReturnType<typeof getPublicNavigationSectionsAction>
        >;
      })
    | null;
  shouldRedirectToRoot: boolean;
  isHiddenFromVisitor?: boolean;
}> {
  const session = await getServerSession(authOptions).catch(() => null);
  const isAdmin = Boolean(session?.user);
  const navigationSections = await getPublicNavigationSectionsAction(isAdmin);

  const checkAccess = (
    p: Awaited<ReturnType<typeof getPageByIdAction>>,
    shouldRedirect: boolean
  ) => {
    if (!p) {
      return {
        page: null,
        shouldRedirectToRoot: false,
        isHiddenFromVisitor: false,
      };
    }
    if (isAdmin || isPageVisibleToVisitor(p)) {
      return {
        page: {
          ...p,
          navigation_sections: navigationSections,
        },
        shouldRedirectToRoot: shouldRedirect,
        isHiddenFromVisitor: false,
      };
    }
    return {
      page: null,
      shouldRedirectToRoot: false,
      isHiddenFromVisitor: true,
    };
  };

  const joined = Array.isArray(rawPath)
    ? rawPath.join("/").trim()
    : (rawPath || "").trim();
  const normalized = joined.replace(/^\/+|\/+$/g, "");

  // 1. Root "/" or empty -> load Homepage (ID 1001)
  if (!normalized || normalized === "/") {
    const home =
      (await getPageByIdAction(HOMEPAGE_ID)) ||
      (await getPageBySlugAction("/"));
    return checkAccess(home, false);
  }

  // 2. Visiting "/1001" -> redirect to "/" so homepage is always served at "/"
  if (normalized === String(HOMEPAGE_ID)) {
    const home =
      (await getPageByIdAction(HOMEPAGE_ID)) ||
      (await getPageBySlugAction("/"));
    return checkAccess(home, true);
  }

  // 3. Match by slug first
  const bySlug = await getPageBySlugAction(normalized);
  if (bySlug) {
    return checkAccess(bySlug, bySlug.id === HOMEPAGE_ID);
  }

  // 4. Match by numeric page ID (e.g. "/1002")
  if (/^\d+$/.test(normalized)) {
    const byId = await getPageByIdAction(Number(normalized));
    if (byId) {
      return checkAccess(byId, byId.id === HOMEPAGE_ID);
    }
  }

  return { page: null, shouldRedirectToRoot: false, isHiddenFromVisitor: false };
}

export interface SavePageParams {
  id?: number | string;
  templateName: string;
  sectionId?: string | null;
  categoryIds?: string[];
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

  const existingPages = await prisma.page.findMany({
    select: { id: true, slug: true, page_title: true },
  });

  if (numericId) {
    const isHomepage = numericId === HOMEPAGE_ID;
    const rawTrimmed = (data.slug || "").trim();
    const isDefaultId = isDefaultIdOrRootSlug(rawTrimmed, numericId);

    if (!isHomepage && !isDefaultId) {
      const cleaned = cleanSlugInput(rawTrimmed, false);
      const check = validateSlugInput(cleaned, {
        currentPageId: numericId,
        existingPages,
      });
      if (!check.isValid) {
        throw new Error(check.error || "Invalid URL slug.");
      }
    }

    const validSlug = isHomepage
      ? "/"
      : isDefaultId
        ? String(numericId)
        : sanitizeSlug(data.slug, numericId) || String(numericId);
    const effectiveTemplate = isHomepage
      ? data.templateName || "startpage"
      : data.templateName || "article";

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
        ...(Array.isArray(data.categoryIds)
          ? {
              categories: {
                set: data.categoryIds.map((id) => ({ id })),
              },
            }
          : {}),
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
  const rawCreateSlug = (data.slug || "").trim();
  if (rawCreateSlug && !isDefaultIdOrRootSlug(rawCreateSlug)) {
    const cleaned = cleanSlugInput(rawCreateSlug, false);
    const check = validateSlugInput(cleaned, { existingPages });
    if (!check.isValid) {
      throw new Error(check.error || "Invalid URL slug.");
    }
  }
  const initialSlug = sanitizeSlug(data.slug);
  const tempSlug = initialSlug || `temp-${Date.now()}`;

  let page = await prisma.page.create({
    data: {
      template_name: data.templateName || "article",
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
      ...(Array.isArray(data.categoryIds) && data.categoryIds.length > 0
        ? {
            categories: {
              connect: data.categoryIds.map((id) => ({ id })),
            },
          }
        : {}),
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
  const { getCategoryTypesAction } = await import("./categories");
  const { getAdministratorsAction } = await import("./administrators");
  const { getMediaFilesAction } = await import("./media");
  const { getMailTemplatesAction } = await import("../mail");
  const { getCmsSettingsAction } = await import("./settings");
  const { getLandlordsAction } = await import("./landlords");
  const { getBookingObjectsAction } = await import("./booking-objects");
  const { getBookingOptionalsAction } = await import("./optionals");
  const { getAmenitiesAction } = await import("./amenities");

  const [
    pages,
    sections,
    categoryTypes,
    administrators,
    media,
    mailTemplates,
    settings,
    landlords,
    bookingObjects,
    optionals,
    amenities,
  ] = await Promise.all([
    getPagesAction().catch((err) => {
      console.error("[cms-core] getPagesAction failed:", err);
      return [];
    }),
    getSectionsAction().catch((err) => {
      console.error("[cms-core] getSectionsAction failed:", err);
      return [];
    }),
    getCategoryTypesAction().catch((err) => {
      console.error("[cms-core] getCategoryTypesAction failed:", err);
      return [];
    }),
    getAdministratorsAction().catch((err) => {
      console.error("[cms-core] getAdministratorsAction failed:", err);
      return [];
    }),
    getMediaFilesAction().catch((err) => {
      console.error("[cms-core] getMediaFilesAction failed:", err);
      return [];
    }),
    getMailTemplatesAction().catch((err) => {
      console.error("[cms-core] getMailTemplatesAction failed:", err);
      return [];
    }),
    getCmsSettingsAction().catch((err) => {
      console.error("[cms-core] getCmsSettingsAction failed:", err);
      return { activeLanguages: ["sv", "en", "de"], adminLanguage: "en" as const };
    }),
    getLandlordsAction().catch((err) => {
      console.error("[cms-core] getLandlordsAction failed:", err);
      return [];
    }),
    getBookingObjectsAction().catch((err) => {
      console.error("[cms-core] getBookingObjectsAction failed:", err);
      return [];
    }),
    getBookingOptionalsAction().catch((err) => {
      console.error("[cms-core] getBookingOptionalsAction failed:", err);
      return [];
    }),
    getAmenitiesAction().catch((err) => {
      console.error("[cms-core] getAmenitiesAction failed:", err);
      return [];
    }),
  ]);

  return {
    pages,
    sections,
    categoryTypes,
    administrators,
    media,
    mailTemplates,
    settings,
    landlords,
    bookingObjects,
    optionals,
    amenities,
  };
}
