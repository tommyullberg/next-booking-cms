"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { Info } from "lucide-react";
import { DatePicker, Label } from "@cms/components/ui";
import { AdminLanguage } from "@cms/constants/languages";

export interface PublicationSectionProps {
  pubStartId: string;
  pubEndId: string;
  publicationStart: string;
  setPublicationStart: (val: string) => void;
  publicationEnd: string;
  setPublicationEnd: (val: string) => void;
  adminLanguage?: AdminLanguage;
}

export function PublicationSection({
  pubStartId,
  pubEndId,
  publicationStart,
  setPublicationStart,
  publicationEnd,
  setPublicationEnd,
  adminLanguage = "en",
}: PublicationSectionProps) {
  const t = useTranslations("pageEditor");
  const [activeTooltip, setActiveTooltip] = useState<"pubStart" | "pubEnd" | null>(
    null
  );

  return (
    <>
      {/* 7. Published At (Scheduled Publication Start) */}
      <div className='space-y-1.5'>
        <div className='flex items-center gap-1.5'>
          <Label
            htmlFor={pubStartId}
            className='block text-xs font-medium text-slate-200'
          >
            {t("publishedAt")}
          </Label>
          <button
            type='button'
            onClick={() =>
              setActiveTooltip((prev) =>
                prev === "pubStart" ? null : "pubStart"
              )
            }
            className='text-slate-400 hover:text-sky-400 transition'
            title='Publishing schedule info'
          >
            <Info className='cms-icon-sm' />
          </button>
        </div>

        {activeTooltip === "pubStart" && (
          <div className='rounded-lg border border-sky-500/20 bg-sky-950/30 px-3 py-2 cms-text-meta text-sky-200'>
            {t("pubStartHelp")}
          </div>
        )}

        <DatePicker
          id={pubStartId}
          value={publicationStart}
          onChange={setPublicationStart}
          locale={adminLanguage}
          openDirection='up'
          showWeekNumbers={true}
          placeholder={t("immediatelyLeaveEmpty")}
          clearLabel={t("clear")}
        />
      </div>

      {/* 8. Unpublish Date */}
      <div className='space-y-1.5'>
        <div className='flex items-center gap-1.5'>
          <Label
            htmlFor={pubEndId}
            className='block text-xs font-medium text-slate-200'
          >
            {t("unpublishDate")}
          </Label>
          <button
            type='button'
            onClick={() =>
              setActiveTooltip((prev) => (prev === "pubEnd" ? null : "pubEnd"))
            }
            className='text-slate-400 hover:text-sky-400 transition'
            title='Unpublish date info'
          >
            <Info className='cms-icon-sm' />
          </button>
        </div>

        {activeTooltip === "pubEnd" && (
          <div className='rounded-lg border border-sky-500/20 bg-sky-950/30 px-3 py-2 cms-text-meta text-sky-200'>
            {t("pubEndHelp")}
          </div>
        )}

        <div className='flex items-center gap-2'>
          <div className='flex-1'>
            <DatePicker
              id={pubEndId}
              value={publicationEnd}
              onChange={setPublicationEnd}
              locale={adminLanguage}
              openDirection='up'
              showWeekNumbers={true}
              placeholder={t("neverLeaveEmpty")}
              clearLabel={t("clear")}
            />
          </div>
          <button
            type='button'
            onClick={() =>
              setActiveTooltip((prev) => (prev === "pubEnd" ? null : "pubEnd"))
            }
            className='p-2 text-slate-500 hover:text-slate-300 transition'
            title='How unpublish dates work'
          >
            <Info className='cms-icon-md' />
          </button>
        </div>
      </div>
    </>
  );
}

