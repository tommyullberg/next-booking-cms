"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Check } from "lucide-react";
import { Badge, FlagIcon, Label } from "@cms/components/ui";
import { cn } from "@cms/utils/cn";
import {
  LANGUAGE_META,
  getLanguageMeta,
  SupportedLocale,
  AdminLanguage,
} from "@cms/constants/languages";

export interface ActiveLanguagesSectionProps {
  siteLanguages: string[];
  pageActiveLanguages: string[];
  defaultLanguage: SupportedLocale;
  adminLanguage?: AdminLanguage;
  onToggleLanguage: (locale: string) => void;
}

export function ActiveLanguagesSection({
  siteLanguages,
  pageActiveLanguages,
  defaultLanguage,
  adminLanguage = "en",
  onToggleLanguage,
}: ActiveLanguagesSectionProps) {
  const t = useTranslations("pageEditor");

  return (
    <div className='space-y-2 pb-3 border-b border-slate-800/80'>
      <div className='flex items-center justify-between'>
        <Label className='block text-xs font-semibold text-slate-200'>
          {t("activeLanguagesForPage")}
        </Label>
        <span className='text-[11px] text-slate-400 font-mono'>
          {pageActiveLanguages.length} {adminLanguage === "sv" ? "aktiva" : "active"}
        </span>
      </div>
      <p className='text-[11px] text-slate-400'>
        {t("activeLanguagesForPageHelp")}
      </p>
      <div className='flex flex-wrap gap-2 pt-1'>
        {siteLanguages.map((loc) => {
          const meta = LANGUAGE_META[loc] || getLanguageMeta(loc);
          const isChecked = pageActiveLanguages.includes(loc);
          const isLastActive = isChecked && pageActiveLanguages.length === 1;
          const isSiteDefault = loc === defaultLanguage;
          return (
            <button
              key={loc}
              type='button'
              aria-pressed={isChecked}
              disabled={isLastActive}
              onClick={() => onToggleLanguage(loc)}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition select-none",
                isChecked
                  ? "border-sky-500/60 bg-sky-950/40 text-sky-200 ring-1 ring-sky-500/30"
                  : "border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-slate-300",
                isLastActive && "opacity-80 cursor-not-allowed"
              )}
            >
              <FlagIcon code={loc} size='sm' />
              <span>{meta.label}</span>
              <Badge variant='adminMuted' size='xs' className='cms-text-code'>
                {meta.code}
              </Badge>
              {isChecked && (
                <Check
                  className='w-3.5 h-3.5 text-sky-400 shrink-0 stroke-[2.5]'
                  aria-hidden='true'
                />
              )}
              {isSiteDefault && (
                <span
                  className='text-[10px] text-sky-400 font-mono'
                  title='Standardspråk'
                >
                  ★
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

