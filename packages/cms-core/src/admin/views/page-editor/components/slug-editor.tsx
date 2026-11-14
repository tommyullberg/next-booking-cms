"use client";

import React from "react";
import { useTranslations } from "next-intl";
import {
  FlagIcon,
  FormField,
  Input,
  Label,
  SegmentedControl,
} from "@cms/components/ui";
import { cn } from "@cms/utils/cn";
import {
  LANGUAGE_META,
  getLanguageMeta,
  SupportedLocale,
} from "@cms/constants/languages";
import { DefaultLanguageUrlPrefix } from "@cms/types/settings";

export interface SlugEditorProps {
  pageId: number | string;
  isHomepage: boolean;
  defaultLanguage: SupportedLocale;
  defaultLanguageUrlPrefix: DefaultLanguageUrlPrefix;
  pageActiveLanguages: string[];
  slugMode: "same" | "separate";
  onSlugModeChange: (mode: "same" | "separate") => void;
  slug: string;
  onSlugChange: (val: string) => void;
  onSlugBlur: () => void;
  separateSlugs: Record<string, string>;
  onSeparateSlugChange: (locale: string, val: string) => void;
  onSeparateSlugBlur: (locale: string) => void;
  slugErrors: Record<string, string>;
  slugValidation: { isValid: boolean; error: string | null };
}

export function SlugEditor({
  pageId,
  isHomepage,
  defaultLanguage,
  defaultLanguageUrlPrefix,
  pageActiveLanguages,
  slugMode,
  onSlugModeChange,
  slug,
  onSlugChange,
  onSlugBlur,
  separateSlugs,
  onSeparateSlugChange,
  onSeparateSlugBlur,
  slugErrors,
  slugValidation,
}: SlugEditorProps) {
  const t = useTranslations("pageEditor");

  return (
    <div className='space-y-3 pt-2 border-t border-slate-800/80'>
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-2'>
        <div>
          <Label className='block text-xs font-semibold text-slate-200'>
            {t("slugMode")}
          </Label>
          <p className='text-[11px] text-slate-400'>
            {isHomepage
              ? t("startpageSlugNotice")
              : t("slugHelp", { id: String(pageId) })}
          </p>
        </div>

        {!isHomepage && (
          <SegmentedControl<"same" | "separate">
            value={slugMode}
            onChange={onSlugModeChange}
            size='sm'
            options={[
              { value: "same", label: t("slugModeSame") },
              { value: "separate", label: t("slugModeSeparate") },
            ]}
          />
        )}
      </div>

      {isHomepage ? (
        <div className='flex items-center gap-2 rounded-xl border border-slate-800/80 bg-slate-950/40 px-3.5 py-2.5 text-xs text-slate-400 font-mono'>
          <span className='text-sky-400 font-semibold'>/</span>
          <span className='text-[11px] text-slate-500 font-sans'>
            ({t("startpageSlugHelp")})
          </span>
        </div>
      ) : slugMode === "same" ? (
        <div className='space-y-1.5'>
          <FormField
            label={t("urlSlug")}
            labelClassName='font-medium text-slate-200'
            error={
              slugErrors["common"] ||
              (!slugValidation.isValid ? slugValidation.error : undefined)
            }
          >
            {(control) => (
              <div
                className={cn(
                  "flex items-center rounded-xl border bg-slate-950/90 overflow-hidden transition",
                  slugErrors["common"] || !slugValidation.isValid
                    ? "border-red-500 ring-1 ring-red-500/30"
                    : "border-slate-800 focus-within:border-sky-500"
                )}
              >
                <span className='flex items-center justify-center px-2 py-2.5 text-xs font-mono text-slate-400 bg-slate-900/70 border-r border-slate-800 shrink-0 w-16'>
                  {defaultLanguageUrlPrefix === "with-prefix"
                    ? `/${defaultLanguage}/`
                    : "/"}
                </span>
                <Input
                  {...control}
                  type='text'
                  value={slug}
                  onChange={(e) => onSlugChange(e.target.value)}
                  onBlur={onSlugBlur}
                  placeholder={String(pageId)}
                  className='h-auto border-0 bg-transparent px-3.5 py-2.5 text-xs text-white font-mono placeholder:text-slate-500 focus-visible:ring-0 focus-visible:ring-offset-0'
                />
              </div>
            )}
          </FormField>
          <p className='text-[11px] text-slate-400 pl-1'>
            {t("slugModeSameHelp")}
          </p>
        </div>
      ) : (
        <div className='space-y-2.5'>
          {pageActiveLanguages.map((loc) => {
            const meta = LANGUAGE_META[loc] || getLanguageMeta(loc);
            const prefix =
              loc === defaultLanguage
                ? defaultLanguageUrlPrefix === "with-prefix"
                  ? `/${defaultLanguage}/`
                  : "/"
                : `/${loc}/`;
            const currentVal = separateSlugs[loc] || "";
            const err = slugErrors[loc];

            return (
              <div key={loc} className='space-y-1'>
                <div
                  className={cn(
                    "flex items-center rounded-xl border bg-slate-950/90 overflow-hidden transition",
                    err
                      ? "border-red-500 ring-1 ring-red-500/30"
                      : "border-slate-800 focus-within:border-sky-500"
                  )}
                >
                  <span className='flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-400 bg-slate-900/70 border-r border-slate-800 shrink-0 w-20'>
                    <FlagIcon code={loc} size='sm' />
                    <span className='cms-text-code'>{meta.code}</span>
                  </span>
                  <span className='flex items-center justify-center px-2 py-2 text-xs font-mono text-slate-400 bg-slate-900/40 border-r border-slate-800/80 shrink-0 w-16'>
                    {prefix}
                  </span>
                  <Input
                    type='text'
                    value={currentVal}
                    onChange={(e) => onSeparateSlugChange(loc, e.target.value)}
                    onBlur={() => onSeparateSlugBlur(loc)}
                    placeholder={String(pageId)}
                    className='h-auto border-0 bg-transparent px-3.5 py-2 text-xs text-white font-mono placeholder:text-slate-500 focus-visible:ring-0 focus-visible:ring-offset-0'
                  />
                </div>
                {err && (
                  <p className='text-[11px] text-red-400 pl-1'>{err}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

