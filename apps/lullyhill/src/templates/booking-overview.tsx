"use client";

import React from "react";
import { CMSField, AvailabilitySearch, CMSPageData } from "@next-booking/cms-core";
import { LullyhillSiteLayout } from "../components/site-layout";

export function BookingOverviewTemplate({ page }: { page: CMSPageData }) {
  return (
    <LullyhillSiteLayout page={page}>
      <section className="text-center space-y-4 max-w-2xl mx-auto">
        <CMSField.Text
          nbr={1}
          as="h1"
          fallbackToPageTitle
          className="text-3xl sm:text-4xl font-serif tracking-tight text-slate-900 dark:text-white"
        />

        <div className="mx-auto h-1 w-20 rounded-full bg-gradient-to-r from-sky-700 via-sky-500 to-amber-500/80" />

        <CMSField.Text
          nbr={2}
          as="p"
          className="text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed"
        />
      </section>

      <CMSField.Image
        nbr={1}
        alt={page.page_title}
        wrapperClassName="overflow-hidden rounded-3xl border border-neutral-300 dark:border-slate-800 bg-neutral-100 dark:bg-slate-900/95 p-2.5 shadow-xl shadow-black/10"
        className="w-full h-auto object-cover rounded-2xl max-h-[420px]"
      />

      <section className="space-y-6">
        <AvailabilitySearch />
      </section>
    </LullyhillSiteLayout>
  );
}
