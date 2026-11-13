import { HOMEPAGE_ID } from "./slug";
import {
  DEFAULT_ACTIVE_LANGUAGES,
  DEFAULT_SITE_LANGUAGE,
  DEFAULT_LANGUAGE_URL_PREFIX,
  SupportedLocale,
} from "@cms/constants/languages";
import { DefaultLanguageUrlPrefix } from "@cms/types/settings";

export interface PageUrlEntity {
  id: number | string;
  slug?: string | null;
  slug_mode?: string | null;
  active_languages?: unknown;
  translations?: Array<{
    locale: string;
    slug?: string | null;
    page_title?: string;
  }> | null;
}

export interface GetPageUrlOptions {
  page?: PageUrlEntity | null;
  slug?: string | null;
  slugMode?: "same" | "separate" | string;
  locale?: string;
  defaultLanguage?: string;
  urlPrefixMode?: DefaultLanguageUrlPrefix;
  isHomepage?: boolean;
}

/**
 * Central URL Generator for Next Booking CMS.
 * Generates canonical, locale-aware URLs for public routing, navigation menus,
 * internal links, language switchers, and previews.
 */
export function getPageUrl(options: GetPageUrlOptions): string {
  const defaultLanguage = (options.defaultLanguage || DEFAULT_SITE_LANGUAGE).toLowerCase();
  const locale = (options.locale || defaultLanguage).toLowerCase();
  const urlPrefixMode: DefaultLanguageUrlPrefix =
    options.urlPrefixMode || DEFAULT_LANGUAGE_URL_PREFIX;

  const page = options.page;
  const isHomepage = Boolean(
    options.isHomepage ||
      (page && (Number(page.id) === HOMEPAGE_ID || page.slug === "/")) ||
      options.slug === "/" ||
      options.slug === String(HOMEPAGE_ID)
  );

  // 1. Homepage URL generation
  if (isHomepage) {
    if (locale === defaultLanguage) {
      return urlPrefixMode === "with-prefix" ? `/${defaultLanguage}` : "/";
    }
    return `/${locale}`;
  }

  // 2. Subpage slug resolution
  const slugMode =
    options.slugMode ||
    (page?.slug_mode === "separate" ? "separate" : "same");

  let effectiveSlug = "";

  if (slugMode === "separate" && page?.translations && page.translations.length > 0) {
    const translation = page.translations.find(
      (t) => t.locale.toLowerCase() === locale
    );
    if (translation?.slug && translation.slug.trim()) {
      effectiveSlug = translation.slug.trim();
    }
  }

  if (!effectiveSlug) {
    if (typeof options.slug === "string" && options.slug.trim()) {
      effectiveSlug = options.slug.trim();
    } else if (page?.slug && page.slug.trim()) {
      effectiveSlug = page.slug.trim();
    } else if (page?.id !== undefined) {
      effectiveSlug = String(page.id);
    }
  }

  // Normalize slug: remove leading/trailing slashes
  const cleanSlug = effectiveSlug.replace(/^\/+|\/+$/g, "");
  if (!cleanSlug || cleanSlug === String(HOMEPAGE_ID)) {
    return getPageUrl({
      ...options,
      isHomepage: true,
      slug: "/",
    });
  }

  // 3. Subpage URL generation
  if (locale === defaultLanguage) {
    return urlPrefixMode === "with-prefix"
      ? `/${defaultLanguage}/${cleanSlug}`
      : `/${cleanSlug}`;
  }

  return `/${locale}/${cleanSlug}`;
}

export interface ParsedPublicRoute {
  locale: string;
  slug: string;
  isHomepage: boolean;
  isDefaultLanguage: boolean;
  hasPrefix: boolean;
  shouldRedirectToRoot: boolean;
  canonicalUrl: string;
}

export interface ParsePublicRouteOptions {
  defaultLanguage?: string;
  urlPrefixMode?: DefaultLanguageUrlPrefix;
  activeLanguages?: string[];
}

/**
 * Parses an incoming public route path (e.g. from [...slug] params)
 * and resolves target locale, slug, homepage status, and canonical redirect flags.
 */
export function parsePublicRoutePath(
  rawPath?: string | string[],
  options?: ParsePublicRouteOptions
): ParsedPublicRoute {
  const defaultLanguage = (options?.defaultLanguage || DEFAULT_SITE_LANGUAGE).toLowerCase();
  const urlPrefixMode = options?.urlPrefixMode || DEFAULT_LANGUAGE_URL_PREFIX;
  const activeLanguages = (options?.activeLanguages || DEFAULT_ACTIVE_LANGUAGES).map((l) =>
    l.toLowerCase()
  );

  let segments: string[] = [];
  if (Array.isArray(rawPath)) {
    segments = rawPath
      .map((s) => (s || "").trim())
      .filter((s) => s.length > 0 && s !== "/");
  } else if (typeof rawPath === "string") {
    segments = rawPath
      .split("/")
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && s !== "/");
  }

  // Empty path -> Root Homepage
  if (segments.length === 0) {
    const canonicalUrl =
      urlPrefixMode === "with-prefix" ? `/${defaultLanguage}` : "/";
    return {
      locale: defaultLanguage,
      slug: "/",
      isHomepage: true,
      isDefaultLanguage: true,
      hasPrefix: false,
      shouldRedirectToRoot: false,
      canonicalUrl,
    };
  }

  const first = segments[0].toLowerCase();
  const isLanguagePrefix = activeLanguages.includes(first);

  if (isLanguagePrefix) {
    const locale = first;
    const isDefault = locale === defaultLanguage;
    const subsegments = segments.slice(1);

    if (subsegments.length === 0) {
      // Visiting "/<lang>"
      const shouldRedirect = isDefault && urlPrefixMode === "without-prefix";
      const canonicalUrl =
        isDefault && urlPrefixMode === "without-prefix"
          ? "/"
          : `/${locale}`;

      return {
        locale,
        slug: "/",
        isHomepage: true,
        isDefaultLanguage: isDefault,
        hasPrefix: true,
        shouldRedirectToRoot: shouldRedirect,
        canonicalUrl,
      };
    }

    const subpath = subsegments.join("/");
    const isNumericHomepage = subpath === String(HOMEPAGE_ID);

    if (isNumericHomepage) {
      const canonicalUrl =
        isDefault && urlPrefixMode === "without-prefix"
          ? "/"
          : `/${locale}`;

      return {
        locale,
        slug: "/",
        isHomepage: true,
        isDefaultLanguage: isDefault,
        hasPrefix: true,
        shouldRedirectToRoot: isDefault && urlPrefixMode === "without-prefix",
        canonicalUrl,
      };
    }

    const canonicalUrl =
      isDefault && urlPrefixMode === "without-prefix"
        ? `/${subpath}`
        : `/${locale}/${subpath}`;

    return {
      locale,
      slug: subpath,
      isHomepage: false,
      isDefaultLanguage: isDefault,
      hasPrefix: true,
      shouldRedirectToRoot: false,
      canonicalUrl,
    };
  }

  // No language prefix -> defaults to site default language
  const path = segments.join("/");
  if (path === String(HOMEPAGE_ID)) {
    return {
      locale: defaultLanguage,
      slug: "/",
      isHomepage: true,
      isDefaultLanguage: true,
      hasPrefix: false,
      shouldRedirectToRoot: true,
      canonicalUrl: urlPrefixMode === "with-prefix" ? `/${defaultLanguage}` : "/",
    };
  }

  const canonicalUrl =
    urlPrefixMode === "with-prefix"
      ? `/${defaultLanguage}/${path}`
      : `/${path}`;

  return {
    locale: defaultLanguage,
    slug: path,
    isHomepage: false,
    isDefaultLanguage: true,
    hasPrefix: false,
    shouldRedirectToRoot: false,
    canonicalUrl,
  };
}

export interface InternalLinkRef {
  type: "internal";
  pageId: number | string;
  locale?: string;
}

export function formatInternalLink(pageId: number | string, locale?: string): string {
  return JSON.stringify({
    type: "internal",
    pageId,
    ...(locale ? { locale } : {}),
  });
}

export function parseInternalLink(value: string): InternalLinkRef | null {
  if (!value || typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed.startsWith("{") || !trimmed.endsWith("}")) return null;
  try {
    const parsed = JSON.parse(trimmed);
    if (parsed && parsed.type === "internal" && parsed.pageId !== undefined) {
      return {
        type: "internal",
        pageId: parsed.pageId,
        locale: parsed.locale,
      };
    }
  } catch {
    // Ignore non-JSON
  }
  return null;
}

