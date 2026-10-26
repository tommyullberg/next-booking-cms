"use client";

/**
 * COMPLETE TEMPLATE EXAMPLE (Hidden developer reference — not selectable in Admin)
 */

import React from "react";
import {
  CMSField,
  BookingCalendar,
  AvailabilitySearch,
  CMSPageData,
} from "@next-booking/cms-core";
import { LullyhillSiteLayout } from "../../components/site-layout";

export function CompleteExampleTemplate({ page }: { page: CMSPageData }) {
  return (
    <LullyhillSiteLayout page={page}>
      <section className="space-y-4 max-w-3xl mx-auto text-center">
        <CMSField.Text
          nbr={1}
          as="h1"
          className="text-4xl font-serif tracking-tight text-slate-900 dark:text-white"
        />
        <CMSField.Text
          nbr={2}
          as="p"
          className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed"
        />
      </section>

      <section className="overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/95 p-2 shadow-xl">
        <CMSField.Image
          nbr={1}
          alt="Complete Example Hero"
          className="w-full h-auto object-cover rounded-2xl max-h-[480px]"
        />
      </section>

      <section className="space-y-4">
        <BookingCalendar
          objectId="lullyhill-villa"
          objectName="Villa Lullyhill"
          basePrice={3200}
        />
      </section>

      <section className="space-y-4">
        <AvailabilitySearch />
      </section>
    </LullyhillSiteLayout>
  );
}
