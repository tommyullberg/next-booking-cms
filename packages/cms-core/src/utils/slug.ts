export const HOMEPAGE_ID = 1001;

/**
 * Reserved system prefixes where any slug starting with these (e.g. "admin*", "api*") is forbidden.
 */
export const RESERVED_SLUG_PREFIXES = [
  "admin",
  "api",
  "_next",
  "auth",
  "login",
  "logout",
  "signin",
  "signout",
  "dashboard",
  "settings",
  "uploads",
  "static",
  "public",
  "assets",
];

/**
 * Exact reserved system filenames / paths.
 */
export const RESERVED_EXACT_SLUGS = [
  "favicon",
  "favicon.ico",
  "robots",
  "robots.txt",
  "sitemap",
  "sitemap.xml",
  "manifest",
  "manifest.json",
  "1001",
];

/**
 * Transliterates Swedish/Nordic and accented characters, lowercases,
 * converts spaces to "-", strips leading "/", and removes invalid characters.
 *
 * @param raw Raw input string
 * @param isTyping If true, allows a trailing "-" or "/" while the user is actively typing
 */
export function cleanSlugInput(raw: string, isTyping = false): string {
  if (!raw) return "";

  let s = raw
    .toLowerCase()
    .replace(/å/g, "a")
    .replace(/ä/g, "a")
    .replace(/ö/g, "o")
    .replace(/ø/g, "o")
    .replace(/æ/g, "ae")
    .replace(/ü/g, "u")
    .replace(/ß/g, "ss")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  // Convert whitespace and underscores to "-"
  s = s.replace(/[\s_]+/g, "-");

  // Strip leading slashes or dashes ("^/(a-z0-9)" -> "$1")
  s = s.replace(/^[-/]+/, "");

  // Remove any character that is not a-z, 0-9, "-", or "/"
  s = s.replace(/[^a-z0-9-/]/g, "");

  // Collapse multiple consecutive dashes or slashes
  s = s.replace(/-+/g, "-").replace(/\/+/g, "/");

  // Clean up "-/" or "/-" combinations
  s = s.replace(/-\//g, "/").replace(/\/-/g, "/");

  if (!isTyping) {
    s = s.replace(/[-/]+$/, "");
  }

  return s;
}

export interface SlugValidationResult {
  isValid: boolean;
  error: string | null;
}

/**
 * Validates a cleaned slug against system blacklists ("admin*", "api*", "1001", numeric IDs)
 * and existing page slugs in the CMS.
 */
export function validateSlugInput(
  rawSlug: string,
  options?: {
    currentPageId?: number | string;
    existingPages?: Array<{
      id: number | string;
      slug: string;
      page_title?: string;
    }>;
  }
): SlugValidationResult {
  const cleaned = cleanSlugInput(rawSlug, false);

  // Empty slug is always valid (falls back to page ID placeholder)
  if (!cleaned) {
    return { isValid: true, error: null };
  }

  // 1. Check reserved prefixes ("admin*", "api*", etc.) on full path or first segment
  const firstSegment = cleaned.split("/")[0] || "";
  for (const prefix of RESERVED_SLUG_PREFIXES) {
    if (
      cleaned === prefix ||
      cleaned.startsWith(prefix) ||
      firstSegment.startsWith(prefix)
    ) {
      return {
        isValid: false,
        error: `The path "${cleaned}" is reserved by the system ("${prefix}*" is not allowed).`,
      };
    }
  }

  // 2. Check exact reserved paths
  if (RESERVED_EXACT_SLUGS.includes(cleaned) || RESERVED_EXACT_SLUGS.includes(firstSegment)) {
    return {
      isValid: false,
      error: `The path "${cleaned}" is a reserved system path and cannot be used.`,
    };
  }

  // 3. Disallow pure numeric slugs (e.g. "1001", "1002", "1003") or paths starting with "1001/"
  if (/^\d+$/.test(cleaned) || /^\d+\//.test(cleaned)) {
    return {
      isValid: false,
      error: `Numeric paths like "${cleaned}" are reserved for page IDs. Leave empty to use the page ID automatically.`,
    };
  }

  // 4. Check against existing pages' slugs so no two pages can share the same path
  if (options?.existingPages && options.existingPages.length > 0) {
    const conflict = options.existingPages.find((p) => {
      if (
        options.currentPageId !== undefined &&
        String(p.id) === String(options.currentPageId)
      ) {
        return false;
      }
      const existingClean = cleanSlugInput(
        p.slug === "/" || p.slug === String(p.id) ? "" : p.slug,
        false
      );
      return existingClean && existingClean === cleaned;
    });

    if (conflict) {
      return {
        isValid: false,
        error: `The path "/${cleaned}" is already in use by page #${conflict.id}${
          conflict.page_title ? ` (${conflict.page_title})` : ""
        }.`,
      };
    }
  }

  return { isValid: true, error: null };
}

/**
 * Helper to determine if a stored slug is just the default numeric page ID or root "/".
 */
export function isDefaultIdOrRootSlug(
  slug?: string | null,
  pageId?: number | string
): boolean {
  if (!slug || slug === "/") return true;
  const cleaned = slug.replace(/^\/+/, "");
  if (pageId !== undefined && cleaned === String(pageId)) return true;
  if (/^\d+$/.test(cleaned)) return true;
  return false;
}
