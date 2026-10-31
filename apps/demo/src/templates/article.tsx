"use client";

import React from "react";
import { CMSField, CMSPageData } from "@next-booking/cms-core";
import { DemoSiteLayout } from "../components/site-layout";

export function ArticleTemplate({ page }: { page: CMSPageData }) {
  return (
    <DemoSiteLayout page={page}>
      <article className="max-w-3xl mx-auto space-y-8">
        <header className="space-y-4">
          <CMSField.Text
            nbr={1}
            as="h1"
            fallbackToPageTitle
            className="text-3xl md:text-4xl font-extrabold tracking-tight leading-tight text-slate-900 dark:text-foreground"
          />

          <div className="h-1 w-14 rounded-full bg-gradient-to-r from-sky-600 to-cyan-400" />

          <CMSField.Text
            nbr={2}
            as="p"
            className="text-base text-slate-600 dark:text-muted-foreground leading-relaxed"
          />
        </header>

        <CMSField.Image
          nbr={1}
          alt={page.page_title}
          wrapperClassName="overflow-hidden rounded-3xl border border-neutral-300 dark:border-border bg-neutral-100 dark:bg-card p-2 shadow-xl shadow-black/10"
          className="w-full h-auto object-cover rounded-2xl max-h-[420px]"
        />

        <div className="rounded-3xl border border-neutral-300 dark:border-border bg-neutral-100 dark:bg-card/60 p-6 sm:p-8 shadow-md shadow-black/5">
          <CMSField.Text
            nbr={3}
            as="div"
            className="text-sm leading-relaxed text-slate-700 dark:text-foreground space-y-4"
          />
        </div>
      </article>
    </DemoSiteLayout>
  );
}
