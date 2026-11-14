import { useState } from "react";
import {
  cleanSlugInput,
  validateSlugInput,
  isDefaultIdOrRootSlug,
} from "@cms/utils/slug";
import { SupportedLocale } from "@cms/constants/languages";
import { PageEditorData } from "../types";

export interface UsePageEditorSlugsOptions {
  page: PageEditorData;
  isHomepage: boolean;
  defaultLanguage: SupportedLocale;
  siteLanguages: string[];
  existingPages?: Array<{
    id: number | string;
    slug: string;
    page_title?: string;
  }>;
}

export function usePageEditorSlugs({
  page,
  isHomepage,
  defaultLanguage,
  siteLanguages,
  existingPages = [],
}: UsePageEditorSlugsOptions) {
  const [slugMode, setSlugMode] = useState<"same" | "separate">(() =>
    page.slug_mode === "same" ? "same" : "separate"
  );

  const [slug, setSlug] = useState<string>(() => {
    if (isHomepage || isDefaultIdOrRootSlug(page.slug, page.id)) {
      return "";
    }
    return page.slug.replace(/^\/+/, "");
  });

  const [separateSlugs, setSeparateSlugs] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    map[defaultLanguage] =
      !isHomepage && !isDefaultIdOrRootSlug(page.slug, page.id)
        ? page.slug.replace(/^\/+/, "")
        : "";
    for (const loc of siteLanguages) {
      if (loc === defaultLanguage) continue;
      const existing = page.translations?.find(
        (t) => t.locale.toLowerCase() === loc.toLowerCase()
      );
      if (existing?.slug && !isDefaultIdOrRootSlug(existing.slug, page.id)) {
        map[loc] = existing.slug.replace(/^\/+/, "");
      } else {
        map[loc] = "";
      }
    }
    return map;
  });

  const [slugErrors, setSlugErrors] = useState<Record<string, string>>({});

  const handleSlugModeChange = (newMode: "same" | "separate") => {
    if (newMode === slugMode) return;
    if (newMode === "same") {
      const commonVal = separateSlugs[defaultLanguage] || slug;
      setSlug(commonVal);
      setSlugMode("same");
    } else {
      setSeparateSlugs((prev) => {
        const next = { ...prev };
        for (const loc of siteLanguages) {
          if (!next[loc] || !next[loc].trim()) {
            next[loc] = slug;
          }
        }
        return next;
      });
      setSlugMode("separate");
    }
  };

  const slugValidation = isHomepage
    ? { isValid: true, error: null }
    : validateSlugInput(slug, {
        currentPageId: page.id,
        existingPages,
      });

  return {
    slugMode,
    setSlugMode,
    slug,
    setSlug,
    separateSlugs,
    setSeparateSlugs,
    handleSlugModeChange,
    slugValidation,
    slugErrors,
    setSlugErrors,
  };
}

