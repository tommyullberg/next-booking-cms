"use client";

import React from "react";
import {
  CMSField,
  BookingCalendar,
  AvailabilitySearch,
  CMSPageData,
} from "@next-booking/cms-core";
import { LullyhillSiteLayout } from "../components/site-layout";

export function StartpageTemplate({ page }: { page: CMSPageData }) {
  return (
    <LullyhillSiteLayout page={page}>
      <section className="text-center space-y-4 max-w-2xl mx-auto pt-4">
        <CMSField.Text
          nbr={1}
          as="h1"
          fallbackToPageTitle
          className="text-4xl sm:text-5xl font-serif tracking-tight text-slate-900 dark:text-white leading-tight"
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
        wrapperClassName="overflow-hidden rounded-3xl border border-neutral-300 dark:border-slate-800 shadow-2xl shadow-black/10 bg-neutral-100 dark:bg-slate-900/95 p-2.5"
        className="w-full h-auto object-cover rounded-2xl max-h-[520px]"
      />

      <section id="calendar" className="space-y-4">
        <div className="text-center max-w-xl mx-auto space-y-1">
          <CMSField.Text
            nbr={3}
            as="h2"
            className="text-2xl font-serif text-slate-900 dark:text-white"
          />
          <CMSField.Text
            nbr={4}
            as="p"
            className="text-xs text-slate-600 dark:text-slate-400"
          />
        </div>

        <BookingCalendar
          objectId="lullyhill-villa"
          objectName={page.page_title}
          basePrice={3200}
        />
      </section>

      <section id="search" className="space-y-4 pt-4">
        <AvailabilitySearch />
      </section>
    </LullyhillSiteLayout>
  );
}
