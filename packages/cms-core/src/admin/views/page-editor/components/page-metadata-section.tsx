"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Badge, FlagIcon, Input, Label } from "@cms/components/ui";
import { cn } from "@cms/utils/cn";
import {
  LANGUAGE_META,
  getLanguageMeta,
  SupportedLocale,
} from "@cms/constants/languages";
import { LocaleTranslationMap } from "../types";

export interface PageMetadataSectionProps {
  primaryInputId: string;
  primaryLinkId: string;
  defaultLanguage: SupportedLocale;
  pageActiveLanguages: string[];
  secondaryActiveLocales: string[];
  primaryTitle: string;
  setPrimaryTitle: (val: string) => void;
  primaryLinkTitle: string;
  setPrimaryLinkTitle: (val: string) => void;
  translations: LocaleTranslationMap;
  updateTranslation: (
    locale: string,
    field: "pageTitle" | "linkDescription",
    value: string
  ) => void;
  useSamePageTitle: boolean;
  setUseSamePageTitle: (val: boolean) => void;
  useSameLinkTitle: boolean;
  setUseSameLinkTitle: (val: boolean) => void;
  titleErrors: Record<string, string>;
  setTitleErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

export function PageMetadataSection({
  primaryInputId,
  primaryLinkId,
  defaultLanguage,
  pageActiveLanguages,
  secondaryActiveLocales,
  primaryTitle,
  setPrimaryTitle,
  primaryLinkTitle,
  setPrimaryLinkTitle,
  translations,
  updateTranslation,
  useSamePageTitle,
  setUseSamePageTitle,
  useSameLinkTitle,
  setUseSameLinkTitle,
  titleErrors,
  setTitleErrors,
}: PageMetadataSectionProps) {
  const t = useTranslations("pageEditor");

  return (
    <>
      {/* 1. Page Title (Multi-language stacked) */}
      <div className='space-y-2.5'>
        <div className='flex items-center justify-between'>
          <Label
            htmlFor={primaryInputId}
            className='block text-xs font-medium text-slate-200'
          >
            {t("pageTitle")} <span className='text-red-400'>*</span>
          </Label>
          <span className='text-[11px] text-slate-400'>
            {t("titleRequired")}
          </span>
        </div>

        {/* Primary Language */}
        {pageActiveLanguages.includes(defaultLanguage) && (
          <div className='space-y-1'>
            <div
              className={cn(
                "flex items-center rounded-xl border bg-slate-950/90 overflow-hidden transition",
                titleErrors[defaultLanguage]
                  ? "border-red-500 ring-1 ring-red-500/30"
                  : "border-slate-800 focus-within:border-sky-500"
              )}
            >
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
                id={primaryInputId}
                type='text'
                required
                value={primaryTitle}
                onChange={(e) => {
                  setPrimaryTitle(e.target.value);
                  if (e.target.value.trim()) {
                    setTitleErrors((prev) => {
                      const next = { ...prev };
                      delete next[defaultLanguage];
                      return next;
                    });
                  }
                }}
                placeholder={t("svTitlePlaceholder")}
                className='h-auto border-0 bg-transparent px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus-visible:ring-0 focus-visible:ring-offset-0'
              />
            </div>
            {titleErrors[defaultLanguage] && (
              <p className='text-[11px] text-red-400 pl-1'>
                {titleErrors[defaultLanguage]}
              </p>
            )}
          </div>
        )}

        {/* Secondary Active Languages (Tightly stacked underneath, one per row) */}
        {!useSamePageTitle &&
          secondaryActiveLocales.map((loc) => {
            const meta = LANGUAGE_META[loc] || getLanguageMeta(loc);
            const err = titleErrors[loc];
            return (
              <div key={loc} className='space-y-1'>
                <div
                  className={cn(
                    "flex items-center rounded-xl border bg-slate-950/60 overflow-hidden transition",
                    err
                      ? "border-red-500 ring-1 ring-red-500/30"
                      : "border-slate-800/80 focus-within:border-sky-500"
                  )}
                >
                  <span className='flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-400 bg-slate-900/50 border-r border-slate-800/80 shrink-0 w-20'>
                    <FlagIcon code={loc} size='sm' />
                    <span className='cms-text-code'>{meta.code}</span>
                  </span>
                  <Input
                    type='text'
                    value={translations[loc]?.pageTitle || ""}
                    onChange={(e) =>
                      updateTranslation(loc, "pageTitle", e.target.value)
                    }
                    placeholder={t("translationsTitlePlaceholder", {
                      language: meta.label,
                    })}
                    className='h-auto border-0 bg-transparent px-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus-visible:ring-0 focus-visible:ring-offset-0'
                  />
                </div>
                {err && (
                  <p className='text-[11px] text-red-400 pl-1'>{err}</p>
                )}
              </div>
            );
          })}

        {/* Hide translations toggle */}
        <div className='pt-0.5 flex items-center justify-between'>
          <label className='inline-flex items-center gap-2 cursor-pointer text-xs text-slate-400 hover:text-slate-300 select-none'>
            <input
              type='checkbox'
              checked={useSamePageTitle}
              onChange={(e) => setUseSamePageTitle(e.target.checked)}
              className='h-3.5 w-3.5 rounded border-slate-700 bg-slate-900 text-sky-500 focus:ring-sky-500 focus:ring-offset-slate-950'
            />
            <span>{t("useSameTitle")}</span>
          </label>

          {useSamePageTitle && (
            <Badge
              variant='outline'
              className='text-[11px] text-sky-400 bg-sky-500/10 border-sky-500/20 font-normal py-0.5 px-2'
            >
              {t("sameTitleFallback")}
            </Badge>
          )}
        </div>
      </div>

      {/* 2. Link text (if other) */}
      <div className='space-y-2.5'>
        <Label
          htmlFor={primaryLinkId}
          className='block text-xs font-medium text-slate-200'
        >
          {t("linkText")}
        </Label>

        {/* Primary Language */}
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
              id={primaryLinkId}
              type='text'
              value={primaryLinkTitle}
              onChange={(e) => setPrimaryLinkTitle(e.target.value)}
              placeholder={primaryTitle.trim() || t("svLinkPlaceholder")}
              className='h-auto border-0 bg-transparent px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus-visible:ring-0 focus-visible:ring-offset-0'
            />
          </div>
        )}

        {/* Secondary Active Languages (Tightly stacked underneath, one per row) */}
        {!useSameLinkTitle &&
          secondaryActiveLocales.map((loc) => {
            const meta = LANGUAGE_META[loc] || getLanguageMeta(loc);
            const locPageTitle =
              translations[loc]?.pageTitle?.trim() ||
              (useSamePageTitle ? primaryTitle.trim() : "");
            const locPlaceholder =
              locPageTitle ||
              t("translationsLinkPlaceholder", { language: meta.label });

            return (
              <div
                key={loc}
                className='flex items-center rounded-xl border border-slate-800/80 bg-slate-950/60 overflow-hidden focus-within:border-sky-500 transition'
              >
                <span className='flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-400 bg-slate-900/50 border-r border-slate-800/80 shrink-0 w-20'>
                  <FlagIcon code={loc} size='sm' />
                  <span className='cms-text-code'>{meta.code}</span>
                </span>
                <Input
                  type='text'
                  value={translations[loc]?.linkDescription || ""}
                  onChange={(e) =>
                    updateTranslation(loc, "linkDescription", e.target.value)
                  }
                  placeholder={locPlaceholder}
                  className='h-auto border-0 bg-transparent px-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus-visible:ring-0 focus-visible:ring-offset-0'
                />
              </div>
            );
          })}

        {/* Hide translations toggle */}
        <div className='pt-0.5 flex items-center justify-between'>
          <label className='inline-flex items-center gap-2 cursor-pointer text-xs text-slate-400 hover:text-slate-300 select-none'>
            <input
              type='checkbox'
              checked={useSameLinkTitle}
              onChange={(e) => setUseSameLinkTitle(e.target.checked)}
              className='h-3.5 w-3.5 rounded border-slate-700 bg-slate-900 text-sky-500 focus:ring-sky-500 focus:ring-offset-slate-950'
            />
            <span>{t("useSameLinkText")}</span>
          </label>

          {useSameLinkTitle && (
            <Badge
              variant='outline'
              className='text-[11px] text-sky-400 bg-sky-500/10 border-sky-500/20 font-normal py-0.5 px-2'
            >
              {t("sameLinkFallback")}
            </Badge>
          )}
        </div>
      </div>
    </>
  );
}
