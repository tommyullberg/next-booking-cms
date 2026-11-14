import React, { useState } from "react";
import {
  DEFAULT_ACTIVE_LANGUAGES,
  DEFAULT_SITE_LANGUAGE,
  SupportedLocale,
} from "@cms/constants/languages";
import { PageEditorData } from "../types";

export interface UsePageEditorLanguagesOptions {
  page: PageEditorData;
  activeLanguages?: string[];
  activeLocales?: string[];
  defaultLanguage?: SupportedLocale;
}

export function usePageEditorLanguages({
  page,
  activeLanguages,
  activeLocales,
  defaultLanguage = DEFAULT_SITE_LANGUAGE,
}: UsePageEditorLanguagesOptions) {
  const siteLanguages = React.useMemo(() => {
    const list =
      Array.isArray(activeLanguages) && activeLanguages.length > 0
        ? activeLanguages
        : Array.isArray(activeLocales) && activeLocales.length > 0
        ? activeLocales
        : [...DEFAULT_ACTIVE_LANGUAGES];
    return Array.from(
      new Set([defaultLanguage, ...list.map((l) => l.toLowerCase())])
    );
  }, [activeLanguages, activeLocales, defaultLanguage]);

  const [pageActiveLanguages, setPageActiveLanguages] = useState<string[]>(() => {
    if (
      Array.isArray(page.active_languages) &&
      page.active_languages.length > 0
    ) {
      const parsed = (page.active_languages as string[])
        .map((l) => String(l).toLowerCase().trim())
        .filter(Boolean);
      if (parsed.length > 0) return Array.from(new Set(parsed));
    }
    return [defaultLanguage];
  });

  const togglePageLanguage = (locale: string) => {
    setPageActiveLanguages((prev) => {
      if (prev.includes(locale)) {
        if (prev.length <= 1) return prev; // At least one language must remain active
        return prev.filter((l) => l !== locale);
      }
      return [...prev, locale];
    });
  };

  const secondaryActiveLocales = React.useMemo(
    () => pageActiveLanguages.filter((l) => l !== defaultLanguage),
    [pageActiveLanguages, defaultLanguage]
  );

  return {
    siteLanguages,
    pageActiveLanguages,
    setPageActiveLanguages,
    togglePageLanguage,
    secondaryActiveLocales,
  };
}

