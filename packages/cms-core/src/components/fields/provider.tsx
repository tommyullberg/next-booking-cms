"use client";

import React, { createContext, useContext, useMemo } from "react";
import { CMSGalleryItem, CMSPageData, CMSPageField } from "./types";
import {
  DEFAULT_GALLERY_SETTINGS,
  GallerySettings,
} from "../../types/settings";

export interface CMSPageContextValue {
  page: CMSPageData;
  locale: string;
  gallerySettings: GallerySettings;
  getField: (
    nbr: number,
    fieldType: "TEXT" | "IMAGE" | "NAVIGATION" | "GALLERY"
  ) => CMSPageField | undefined;
  getGalleryItems: (nbr: number) => CMSGalleryItem[];
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

    const galleriesMap = new Map<number, CMSGalleryItem[]>();
    for (const g of page.galleries || []) {
      const numNbr = Number(g.nbr) || 1;
      const list = galleriesMap.get(numNbr) || [];
      list.push(g);
      galleriesMap.set(numNbr, list);
    }
    for (const [k, list] of galleriesMap.entries()) {
      galleriesMap.set(
        k,
        [...list].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      );
    }

    const getField = (
      nbr: number,
      fieldType: "TEXT" | "IMAGE" | "NAVIGATION" | "GALLERY"
    ): CMSPageField | undefined => {
      return fieldsMap.get(`${nbr}:${fieldType}`);
    };

    const getGalleryItems = (nbr: number): CMSGalleryItem[] => {
      return galleriesMap.get(Number(nbr) || 1) || [];
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

    const gallerySettings: GallerySettings = {
      ...DEFAULT_GALLERY_SETTINGS,
      ...(page.gallery_settings || {}),
    };

    return {
      page,
      locale,
      gallerySettings,
      getField,
      getGalleryItems,
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
