"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Globe } from "lucide-react";
import { FlagIcon, Input, Label, Textarea } from "@cms/components/ui";
import {
  LANGUAGE_META,
  getLanguageMeta,
  SupportedLocale,
  AdminLanguage,
} from "@cms/constants/languages";
import { LocaleTranslationMap } from "../types";
import { CharacterCounter } from "../utils";

export interface SeoSectionProps {
  primaryMetaTitleId: string;
  primaryMetaDescId: string;
  defaultLanguage: SupportedLocale;
  adminLanguage?: AdminLanguage;
  pageActiveLanguages: string[];
  secondaryActiveLocales: string[];
  primaryMetaTitle: string;
  setPrimaryMetaTitle: (val: string) => void;
  primaryMetaDesc: string;
  setPrimaryMetaDesc: (val: string) => void;
  translations: LocaleTranslationMap;
  updateTranslation: (
    locale: string,
    field: "metaTitle" | "metaDescription",
    value: string
  ) => void;
}

export function SeoSection({
  primaryMetaTitleId,
  primaryMetaDescId,
  defaultLanguage,
  adminLanguage = "en",
  pageActiveLanguages,
  secondaryActiveLocales,
  primaryMetaTitle,
  setPrimaryMetaTitle,
  primaryMetaDesc,
  setPrimaryMetaDesc,
  translations,
  updateTranslation,
}: SeoSectionProps) {
  const t = useTranslations("pageEditor");

  return (
    <div className='space-y-4 pt-2 border-t border-slate-800/70'>
      <div className='flex items-center gap-2'>
        <Globe className='cms-icon-md text-sky-400' />
        <h3 className='text-xs font-semibold text-slate-200'>
          {t("seoSettings")}
        </h3>
      </div>

      {/* Meta-titel */}
      <div className='space-y-2.5'>
        <div className='flex items-center justify-between'>
          <Label
            htmlFor={primaryMetaTitleId}
            className='block text-xs font-medium text-slate-300'
          >
            {adminLanguage === "sv" ? "Meta-titel" : "Meta Title"}
          </Label>
          <CharacterCounter current={primaryMetaTitle.length} limit={60} />
        </div>

        {/* Primary Meta Title */}
        {pageActiveLanguages.includes(defaultLanguage) && (
          <div className='flex items-center rounded-xl border border-slate-800 bg-slate-950/90 overflow-hidden focus-within:border-sky-500 transition'>
            <span className='flex items-center gap-2 px-3 py-2.5 text-xs font-medium text-slate-400 bg-slate-900/70 border-r border-slate-800 shrink-0 w-20'>
              <FlagIcon code={defaultLanguage} size='sm' />
              <span className='cms-text-code'>
                {
                  (
                    LANGUAGE_META[defaultLanguage] ||
                    getLanguageMeta(defaultLanguage)
                  ).code
                }
              </span>
            </span>
            <Input
              id={primaryMetaTitleId}
              type='text'
              value={primaryMetaTitle}
              aria-label={`${adminLanguage === "sv" ? "Meta-titel" : "Meta Title"} – ${(LANGUAGE_META[defaultLanguage] || getLanguageMeta(defaultLanguage)).label}`}
              onChange={(e) => setPrimaryMetaTitle(e.target.value)}
              placeholder={
                adminLanguage === "sv"
                  ? "Titel för sökmotorer och delning..."
                  : "Search engine title..."
              }
              className='h-auto border-0 bg-transparent px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus-visible:ring-0 focus-visible:ring-offset-0'
            />
          </div>
        )}

        {/* Secondary Active Languages Meta Title */}
        {secondaryActiveLocales.map((loc) => {
          const meta = LANGUAGE_META[loc] || getLanguageMeta(loc);
          const val = translations[loc]?.metaTitle || "";
          return (
            <div key={loc} className='space-y-1'>
              <div className='flex items-center justify-end pr-1'>
                <CharacterCounter current={val.length} limit={60} />
              </div>
              <div className='flex items-center rounded-xl border border-slate-800/80 bg-slate-950/60 overflow-hidden focus-within:border-sky-500 transition'>
                <span className='flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-400 bg-slate-900/50 border-r border-slate-800/80 shrink-0 w-20'>
                  <FlagIcon code={loc} size='sm' />
                  <span className='cms-text-code'>{meta.code}</span>
                </span>
                <Input
                  type='text'
                  value={val}
                  aria-label={`${adminLanguage === "sv" ? "Meta-titel" : "Meta Title"} – ${meta.label}`}
                  onChange={(e) =>
                    updateTranslation(loc, "metaTitle", e.target.value)
                  }
                  placeholder={
                    adminLanguage === "sv"
                      ? `Titel för sökmotorer på ${meta.label}...`
                      : `Search engine title in ${meta.label}...`
                  }
                  className='h-auto border-0 bg-transparent px-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus-visible:ring-0 focus-visible:ring-offset-0'
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Meta-beskrivning */}
      <div className='space-y-2.5 pt-2'>
        <div className='flex items-center justify-between'>
          <Label
            htmlFor={primaryMetaDescId}
            className='block text-xs font-medium text-slate-300'
          >
            {adminLanguage === "sv" ? "Meta-beskrivning" : "Meta Description"}
          </Label>
          <CharacterCounter current={primaryMetaDesc.length} limit={160} />
        </div>

        {/* Primary Meta Description */}
        {pageActiveLanguages.includes(defaultLanguage) && (
          <div className='flex items-start rounded-xl border border-slate-800 bg-slate-950/90 overflow-hidden focus-within:border-sky-500 transition'>
            <span className='flex items-center gap-2 px-3 py-2.5 text-xs font-medium text-slate-400 bg-slate-900/70 border-r border-slate-800 shrink-0 w-20 self-stretch'>
              <FlagIcon code={defaultLanguage} size='sm' />
              <span className='cms-text-code'>
                {
                  (
                    LANGUAGE_META[defaultLanguage] ||
                    getLanguageMeta(defaultLanguage)
                  ).code
                }
              </span>
            </span>
            <Textarea
              id={primaryMetaDescId}
              rows={2}
              value={primaryMetaDesc}
              aria-label={`${adminLanguage === "sv" ? "Meta-beskrivning" : "Meta Description"} – ${(LANGUAGE_META[defaultLanguage] || getLanguageMeta(defaultLanguage)).label}`}
              onChange={(e) => setPrimaryMetaDesc(e.target.value)}
              placeholder={
                adminLanguage === "sv"
                  ? "Kort sammanfattning för sökmotorer och delning..."
                  : "Short summary for search engines and social sharing..."
              }
              className='min-h-[56px] border-0 bg-transparent px-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus-visible:ring-0 focus-visible:ring-offset-0 resize-y'
            />
          </div>
        )}

        {/* Secondary Active Languages Meta Description */}
        {secondaryActiveLocales.map((loc) => {
          const meta = LANGUAGE_META[loc] || getLanguageMeta(loc);
          const val = translations[loc]?.metaDescription || "";
          return (
            <div key={loc} className='space-y-1'>
              <div className='flex items-center justify-end pr-1'>
                <CharacterCounter current={val.length} limit={160} />
              </div>
              <div className='flex items-start rounded-xl border border-slate-800/80 bg-slate-950/60 overflow-hidden focus-within:border-sky-500 transition'>
                <span className='flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-400 bg-slate-900/50 border-r border-slate-800/80 shrink-0 w-20 self-stretch'>
                  <FlagIcon code={loc} size='sm' />
                  <span className='cms-text-code'>{meta.code}</span>
                </span>
                <Textarea
                  rows={2}
                  value={val}
                  aria-label={`${adminLanguage === "sv" ? "Meta-beskrivning" : "Meta Description"} – ${meta.label}`}
                  onChange={(e) =>
                    updateTranslation(loc, "metaDescription", e.target.value)
                  }
                  placeholder={
                    adminLanguage === "sv"
                      ? `Sammanfattning på ${meta.label}...`
                      : `Summary in ${meta.label}...`
                  }
                  className='min-h-[52px] border-0 bg-transparent px-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus-visible:ring-0 focus-visible:ring-offset-0 resize-y'
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

