import { useState } from "react";
import { SupportedLocale } from "@cms/constants/languages";
import { PageEditorData, LocaleTranslationMap } from "../types";

export interface UsePageEditorTranslationsOptions {
  page: PageEditorData;
  defaultLanguage: SupportedLocale;
  siteLanguages: string[];
}

export function usePageEditorTranslations({
  page,
  defaultLanguage,
  siteLanguages,
}: UsePageEditorTranslationsOptions) {
  const [primaryTitle, setPrimaryTitle] = useState(page.page_title || "");
  const [primaryLinkTitle, setPrimaryLinkTitle] = useState(() => {
    if (
      page.link_description &&
      page.link_description.trim() !== (page.page_title || "").trim()
    ) {
      return page.link_description;
    }
    return "";
  });
  const [primaryMetaTitle, setPrimaryMetaTitle] = useState(
    page.meta_title || ""
  );
  const [primaryMetaDesc, setPrimaryMetaDesc] = useState(
    page.meta_description || ""
  );

  const [translations, setTranslations] = useState<LocaleTranslationMap>(() => {
    const map: LocaleTranslationMap = {};
    for (const loc of siteLanguages) {
      if (loc === defaultLanguage) continue;
      const existing = page.translations?.find(
        (t) => t.locale.toLowerCase() === loc.toLowerCase()
      );
      const existingTitle = existing?.page_title || "";
      const existingLink =
        existing?.link_description ||
        (existing as any)?.linkDescription ||
        "";
      const customLink =
        existingLink && existingLink.trim() !== existingTitle.trim()
          ? existingLink
          : "";
      map[loc] = {
        pageTitle: existingTitle,
        linkDescription: customLink,
        metaTitle: existing?.meta_title || (existing as any)?.metaTitle || "",
        metaDescription:
          existing?.meta_description ||
          (existing as any)?.metaDescription ||
          "",
      };
    }
    return map;
  });

  const [useSamePageTitle, setUseSamePageTitle] = useState(false);
  const [useSameLinkTitle, setUseSameLinkTitle] = useState(false);
  const [titleErrors, setTitleErrors] = useState<Record<string, string>>({});

  const updateTranslation = (
    locale: string,
    field: "pageTitle" | "linkDescription" | "metaTitle" | "metaDescription",
    value: string
  ) => {
    setTranslations((prev) => ({
      ...prev,
      [locale]: {
        ...(prev[locale] || {
          pageTitle: "",
          linkDescription: "",
          metaTitle: "",
          metaDescription: "",
        }),
        [field]: value,
      },
    }));
  };

  return {
    primaryTitle,
    setPrimaryTitle,
    primaryLinkTitle,
    setPrimaryLinkTitle,
    primaryMetaTitle,
    setPrimaryMetaTitle,
    primaryMetaDesc,
    setPrimaryMetaDesc,
    translations,
    setTranslations,
    useSamePageTitle,
    setUseSamePageTitle,
    useSameLinkTitle,
    setUseSameLinkTitle,
    titleErrors,
    setTitleErrors,
    updateTranslation,
  };
}

