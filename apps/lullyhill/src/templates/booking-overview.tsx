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

        <CMSField.Text
          nbr={2}
          as="p"
          className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed"
        />
      </section>

      <CMSField.Image
        nbr={1}
        alt={page.page_title}
        wrapperClassName="overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/95 p-2 shadow-lg"
        className="w-full h-auto object-cover rounded-2xl max-h-[420px]"
      />

      <section className="space-y-6">
        <AvailabilitySearch />
      </section>
    </LullyhillSiteLayout>
  );
}
