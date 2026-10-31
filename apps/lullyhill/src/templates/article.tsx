"use client";

import React from "react";
import { CMSField, CMSPageData } from "@next-booking/cms-core";
import { LullyhillSiteLayout } from "../components/site-layout";

export function ArticleTemplate({ page }: { page: CMSPageData }) {
  return (
    <LullyhillSiteLayout page={page}>
      <article className="max-w-3xl mx-auto space-y-8">
        <header className="space-y-4">
          <CMSField.Text
            nbr={1}
            as="h1"
            fallbackToPageTitle
            className="text-3xl sm:text-4xl font-serif tracking-tight text-slate-900 dark:text-white leading-tight"
          />

          <div className="h-1 w-16 rounded-full bg-gradient-to-r from-sky-700 via-sky-500 to-amber-500/80" />

          <CMSField.Text
            nbr={2}
            as="p"
            className="text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed"
          />
        </header>

        <CMSField.Image
          nbr={1}
          alt={page.page_title}
          wrapperClassName="overflow-hidden rounded-3xl border border-neutral-300 dark:border-slate-800 bg-neutral-100 dark:bg-slate-900/95 p-2.5 shadow-xl shadow-black/10"
          className="w-full h-auto object-cover rounded-2xl max-h-[420px]"
        />

        <div className="rounded-3xl border border-neutral-300 dark:border-slate-800 bg-neutral-100 dark:bg-slate-900/90 p-6 sm:p-8 shadow-md shadow-black/5">
          <CMSField.Text
            nbr={3}
            as="div"
            className="text-sm leading-relaxed text-slate-700 dark:text-slate-300 space-y-4"
          />
        </div>
      </article>
    </LullyhillSiteLayout>
  );
}
