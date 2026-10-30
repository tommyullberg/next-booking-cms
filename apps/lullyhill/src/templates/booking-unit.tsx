"use client";

import React from "react";
import { CMSField, BookingCalendar, CMSPageData } from "@next-booking/cms-core";
import { LullyhillSiteLayout } from "../components/site-layout";

export function BookingUnitTemplate({ page }: { page: CMSPageData }) {
  const bookingObj = page.objects?.[0];
  const objectId = bookingObj?.id || `lullyhill-unit-${page.id}`;
  const objectName = bookingObj?.name || page.page_title;
  const basePrice = (bookingObj?.price_matrix as any)?.base_night_price || 3200;

  return (
    <LullyhillSiteLayout page={page}>
      <section className="space-y-4 max-w-3xl">
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
        className="w-full h-auto object-cover rounded-2xl max-h-[460px]"
      />

      <section className="space-y-3 max-w-3xl">
        <CMSField.Text
          nbr={3}
          as="h2"
          className="text-xl font-serif text-slate-900 dark:text-white"
        />
        <CMSField.Text
          nbr={4}
          as="div"
          className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed"
        />
      </section>

      <section className="space-y-4">
        <CMSField.Gallery nbr={1} />
      </section>

      <section className="space-y-4">
        <BookingCalendar
          objectId={objectId}
          objectName={objectName}
          basePrice={basePrice}
        />
      </section>
    </LullyhillSiteLayout>
  );
}
