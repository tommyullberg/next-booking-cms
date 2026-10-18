"use client";

import React, { createContext, useContext, useMemo } from "react";
import { CMSPageData, CMSPageField } from "./types";

export interface CMSPageContextValue {
  page: CMSPageData;
  locale: string;
  getField: (
    nbr: number,
    fieldType: "TEXT" | "IMAGE" | "NAVIGATION"
  ) => CMSPageField | undefined;
  getLocalizedContent: (field?: CMSPageField) => string | null;
  getLocalizedPageTitle: () => string;
}

const CMSPageContext = createContext<CMSPageContextValue | null>(null);

export interface CMSPageProviderProps {
  page: CMSPageData;
  locale?: string;
  children: React.ReactNode;
}

export function CMSPageProvider({
  page,
  locale = "sv",
  children,
}: CMSPageProviderProps) {
  const value = useMemo<CMSPageContextValue>(() => {
    const fieldsMap = new Map<string, CMSPageField>();
    for (const f of page.page_fields || []) {
      fieldsMap.set(`${f.nbr}:${f.field_type}`, f);
    }

    const getField = (
      nbr: number,
      fieldType: "TEXT" | "IMAGE" | "NAVIGATION"
    ): CMSPageField | undefined => {
      return fieldsMap.get(`${nbr}:${fieldType}`);
    };

    const getLocalizedContent = (field?: CMSPageField): string | null => {
      if (!field) return null;
      if (locale === "sv" || !field.translations || field.translations.length === 0) {
        return field.content ?? null;
      }
      const translation = field.translations.find((t) => t.locale === locale);
      return translation?.content || field.content || null;
    };

    const getLocalizedPageTitle = (): string => {
      if (locale === "sv" || !page.translations || page.translations.length === 0) {
        return page.page_title;
      }
      const translation = page.translations.find((t) => t.locale === locale);
      return translation?.page_title || page.page_title;
    };

    return {
      page,
      locale,
      getField,
      getLocalizedContent,
      getLocalizedPageTitle,
    };
  }, [page, locale]);

  return (
    <CMSPageContext.Provider value={value}>
      {children}
    </CMSPageContext.Provider>
  );
}

export function useCMSPage(): CMSPageContextValue {
  const context = useContext(CMSPageContext);
  if (!context) {
    throw new Error("useCMSPage must be used within a <CMSPageProvider>");
  }
  return context;
}
