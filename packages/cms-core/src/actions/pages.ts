import { prisma } from "@cms/db";
import { PageStatus } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@cms/auth";
import {
  HOMEPAGE_ID,
  cleanSlugInput,
  validateSlugInput,
  isDefaultIdOrRootSlug,
  RESERVED_SLUG_PREFIXES,
} from "@cms/utils/slug";
import {
  DEFAULT_ACTIVE_LANGUAGES,
  DEFAULT_ADMIN_LANGUAGE,
  DEFAULT_SITE_LANGUAGE,
  DEFAULT_LANGUAGE_URL_PREFIX,
} from "@cms/constants/languages";
import {
  getPageUrl,
  parsePublicRoutePath,
} from "@cms/utils/url";
import { DefaultLanguageUrlPrefix } from "@cms/types/settings";

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

export const SLUG_BLACKLIST = RESERVED_SLUG_PREFIXES;

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
      galleries: {
        orderBy: { sort_order: "asc" },
        include: {
          image: true,
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
      galleries: {
        orderBy: { sort_order: "asc" },
        include: {
          image: true,
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

export interface GetPublicNavigationOptions {
  isAdmin?: boolean;
  locale?: string;
  defaultLanguage?: string;
  urlPrefixMode?: DefaultLanguageUrlPrefix;
}

export async function getPublicNavigationSectionsAction(
  optionsOrAdmin: boolean | GetPublicNavigationOptions = false
) {
  const isAdmin =
    typeof optionsOrAdmin === "boolean"
      ? optionsOrAdmin
      : Boolean(optionsOrAdmin?.isAdmin);
  const locale =
    typeof optionsOrAdmin === "object" && optionsOrAdmin.locale
      ? optionsOrAdmin.locale
      : undefined;
  const defaultLanguage =
    typeof optionsOrAdmin === "object" && optionsOrAdmin.defaultLanguage
      ? optionsOrAdmin.defaultLanguage
      : DEFAULT_SITE_LANGUAGE;
  const urlPrefixMode =
    typeof optionsOrAdmin === "object" && optionsOrAdmin.urlPrefixMode
      ? optionsOrAdmin.urlPrefixMode
      : DEFAULT_LANGUAGE_URL_PREFIX;

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
          slug_mode: true,
          active_languages: true,
          translations: {
            select: {
              locale: true,
              slug: true,
              page_title: true,
              link_description: true,
            },
          },
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

  return sections
    .filter((s) => s.is_visible !== false || s.start_page_id === HOMEPAGE_ID)
    .map((s) => {
      const isRoot = s.start_page_id === HOMEPAGE_ID;
      const startPage = s.start_page_id ? pageMap.get(s.start_page_id) : null;
      const startPageAllowed =
        startPage && (isAdmin || isPageVisibleToVisitor(startPage));

      // Resolve items: only items explicitly configured in Navigation Menus
      let sectionItems: Array<{
        id: number;
        label: string;
        url: string;
        status: string;
      }> = [];

      const menuItems = (s as any).menu_items;
      if (Array.isArray(menuItems)) {
        sectionItems = menuItems
          .map((item: any) => {
            const p = pageMap.get(item.id) || item;
            if (!isAdmin && !isPageVisibleToVisitor(p)) return null;
            if (p.id === s.start_page_id) return null; // never include section start page as sub-item

            let label = p.link_description || p.page_title;
            if (locale && locale !== defaultLanguage && p.translations) {
              const trans = p.translations.find(
                (t: any) => t.locale.toLowerCase() === locale.toLowerCase()
              );
              if (trans && (trans.link_description || trans.page_title)) {
                label = trans.link_description || trans.page_title;
              }
            }

            return {
              id: p.id,
              label,
              url: getPageUrl({
                page: p,
                locale,
                defaultLanguage,
                urlPrefixMode,
              }),
              status: p.status,
            };
          })
          .filter((item: any): item is NonNullable<typeof item> => item !== null);
      }

      const startPageUrl = isRoot
        ? getPageUrl({
            isHomepage: true,
            locale,
            defaultLanguage,
            urlPrefixMode,
          })
        : startPageAllowed && startPage
        ? getPageUrl({
            page: startPage,
            locale,
            defaultLanguage,
            urlPrefixMode,
          })
        : null;

      return {
        id: s.id,
        name: s.name,
        translations: s.translations,
        is_root: isRoot,
        start_page_id: s.start_page_id ?? null,
        start_page_url: startPageUrl,
        items: sectionItems,
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
        gallery_settings?: Awaited<
          ReturnType<typeof import("./settings").getCmsSettingsAction>
        >["gallerySettings"];
        current_locale?: string;
      })
    | null;
  shouldRedirectToRoot: boolean;
  isHiddenFromVisitor?: boolean;
}> {
  const session = await getServerSession(authOptions).catch(() => null);
  const isAdmin = Boolean(session?.user);
  const { getCmsSettingsAction } = await import("./settings");
  const cmsSettings = await getCmsSettingsAction().catch(() => null);

  const defaultLanguage = cmsSettings?.defaultLanguage || DEFAULT_SITE_LANGUAGE;
  const urlPrefixMode = cmsSettings?.defaultLanguageUrlPrefix || DEFAULT_LANGUAGE_URL_PREFIX;
  const activeLanguages = cmsSettings?.activeLanguages || [...DEFAULT_ACTIVE_LANGUAGES];

  const parsedRoute = parsePublicRoutePath(rawPath, {
    defaultLanguage,
    urlPrefixMode,
    activeLanguages,
  });

  const navigationSections = await getPublicNavigationSectionsAction({
    isAdmin,
    locale: parsedRoute.locale,
    defaultLanguage,
    urlPrefixMode,
  });

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

    if (!isAdmin && p.active_languages) {
      const pageActiveLanguages = Array.isArray(p.active_languages)
        ? (p.active_languages as string[])
        : [];
      if (
        pageActiveLanguages.length > 0 &&
        !pageActiveLanguages.includes(parsedRoute.locale)
      ) {
        return {
          page: null,
          shouldRedirectToRoot: false,
          isHiddenFromVisitor: true,
        };
      }
    }

    if (isAdmin || isPageVisibleToVisitor(p)) {
      return {
        page: {
          ...p,
          navigation_sections: navigationSections,
          gallery_settings: cmsSettings?.gallerySettings,
          current_locale: parsedRoute.locale,
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

  if (parsedRoute.shouldRedirectToRoot) {
    return {
      page: null,
      shouldRedirectToRoot: true,
      isHiddenFromVisitor: false,
    };
  }

  // 1. Homepage
  if (parsedRoute.isHomepage) {
    const home =
      (await getPageByIdAction(HOMEPAGE_ID)) ||
      (await getPageBySlugAction("/"));
    return checkAccess(home, false);
  }

  // 2. Subpage lookup:
  let matchedPage: Awaited<ReturnType<typeof getPageByIdAction>> = null;

  // 2a. If requested in a non-default language, first search PageTranslation by (locale, slug)
  if (parsedRoute.locale !== defaultLanguage) {
    const translationMatch = await prisma.pageTranslation.findFirst({
      where: {
        locale: parsedRoute.locale,
        slug: parsedRoute.slug,
      },
      select: { page_id: true },
    });
    if (translationMatch) {
      matchedPage = await getPageByIdAction(translationMatch.page_id);
    }
  }

  // 2b. If not matched, search Page by base slug
  if (!matchedPage) {
    matchedPage = await getPageBySlugAction(parsedRoute.slug);
  }

  // 2c. If not matched and slug is numeric page ID (e.g. "1002")
  if (!matchedPage && /^\d+$/.test(parsedRoute.slug)) {
    matchedPage = await getPageByIdAction(Number(parsedRoute.slug));
  }

  if (matchedPage) {
    return checkAccess(matchedPage, matchedPage.id === HOMEPAGE_ID);
  }

  return {
    page: null,
    shouldRedirectToRoot: false,
    isHiddenFromVisitor: false,
  };
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
  slugMode?: "same" | "separate" | string;
  activeLanguages?: string[];
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
    slug?: string | null;
  }>;
}

export async function savePageAction(data: SavePageParams) {
  const { getCmsSettingsAction } = await import("./settings");
  const cmsSettings = await getCmsSettingsAction().catch(() => null);
  const defaultLanguage = cmsSettings?.defaultLanguage || DEFAULT_SITE_LANGUAGE;

  const activeLanguages =
    Array.isArray(data.activeLanguages) && data.activeLanguages.length > 0
      ? data.activeLanguages
      : [defaultLanguage];

  // Mandatory Page Title check for ALL active languages
  if (activeLanguages.includes(defaultLanguage)) {
    if (!data.pageTitle || !data.pageTitle.trim()) {
      throw new Error(`Page title is required for active language "${defaultLanguage.toUpperCase()}".`);
    }
  }

  for (const loc of activeLanguages) {
    if (loc.toLowerCase() === defaultLanguage.toLowerCase()) continue;
    const trans = data.translations?.find(
      (t) => t.locale.toLowerCase() === loc.toLowerCase()
    );
    if (!trans || !trans.pageTitle || !trans.pageTitle.trim()) {
      throw new Error(`Page title is required for active language "${loc.toUpperCase()}".`);
    }
  }

  const slugMode = data.slugMode === "same" ? "same" : "separate";

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

    if (slugMode === "separate" && data.translations && data.translations.length > 0) {
      for (const t of data.translations) {
        if (t.slug && t.slug.trim()) {
          const tCleaned = cleanSlugInput(t.slug.trim(), false);
          if (tCleaned && !isDefaultIdOrRootSlug(tCleaned, numericId)) {
            const tCheck = validateSlugInput(tCleaned, {
              currentPageId: numericId,
              existingPages,
            });
            if (!tCheck.isValid) {
              throw new Error(`[${t.locale.toUpperCase()}] ${tCheck.error}`);
            }
          }
        }
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
        slug_mode: slugMode,
        active_languages: activeLanguages,
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
        const transSlug = t.slug ? cleanSlugInput(t.slug, false) || null : null;
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
            slug: transSlug,
          },
          create: {
            page_id: page.id,
            locale: t.locale,
            page_title: t.pageTitle,
            link_description: t.linkDescription,
            meta_title: t.metaTitle,
            meta_description: t.metaDescription,
            slug: transSlug,
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

  if (slugMode === "separate" && data.translations && data.translations.length > 0) {
    for (const t of data.translations) {
      if (t.slug && t.slug.trim()) {
        const tCleaned = cleanSlugInput(t.slug.trim(), false);
        if (tCleaned && !isDefaultIdOrRootSlug(tCleaned)) {
          const tCheck = validateSlugInput(tCleaned, { existingPages });
          if (!tCheck.isValid) {
            throw new Error(`[${t.locale.toUpperCase()}] ${tCheck.error}`);
          }
        }
      }
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
      slug_mode: slugMode,
      active_languages: activeLanguages,
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
      const transSlug = t.slug ? cleanSlugInput(t.slug, false) || null : null;
      await prisma.pageTranslation.create({
        data: {
          page_id: page.id,
          locale: t.locale,
          page_title: t.pageTitle,
          link_description: t.linkDescription,
          meta_title: t.metaTitle,
          meta_description: t.metaDescription,
          slug: transSlug,
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
  const { getMediaFilesAction, getMediaFoldersAction } = await import("./media");
  const { getMailTemplatesAction } = await import("../mail");
  const { getCmsSettingsAction } = await import("./settings");
  const { getLandlordsAction } = await import("./landlords");
  const { getBookingObjectsAction } = await import("./booking-objects");
  const { getBookingOptionalsAction } = await import("./optionals");
  const { getAmenitiesAction } = await import("./amenities");
  const { getCurrentAdminLocaleAction } = await import("./administrators");

  const [
    pages,
    sections,
    categoryTypes,
    administrators,
    media,
    mediaFolders,
    mailTemplates,
    settings,
    landlords,
    bookingObjects,
    optionals,
    amenities,
    adminLocale,
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
    getMediaFoldersAction().catch((err) => {
      console.error("[cms-core] getMediaFoldersAction failed:", err);
      return [];
    }),
    getMailTemplatesAction().catch((err) => {
      console.error("[cms-core] getMailTemplatesAction failed:", err);
      return [];
    }),
    getCmsSettingsAction().catch((err) => {
      console.error("[cms-core] getCmsSettingsAction failed:", err);
      return {
        activeLanguages: [...DEFAULT_ACTIVE_LANGUAGES],
        defaultLanguage: DEFAULT_SITE_LANGUAGE,
        defaultLanguageUrlPrefix: DEFAULT_LANGUAGE_URL_PREFIX,
        adminLanguage: DEFAULT_ADMIN_LANGUAGE,
      };
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
    getCurrentAdminLocaleAction().catch(() => "en" as const),
  ]);

  return {
    pages,
    sections,
    categoryTypes,
    administrators,
    media,
    mediaFolders,
    mailTemplates,
    settings,
    landlords,
    bookingObjects,
    optionals,
    amenities,
    adminLocale,
  };
}
