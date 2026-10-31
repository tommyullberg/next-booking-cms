"use client";

import React from "react";
import { CMSField, BookingCalendar, CMSPageData } from "@next-booking/cms-core";
import { DemoSiteLayout } from "../components/site-layout";

export function BookingUnitTemplate({ page }: { page: CMSPageData }) {
  return (
    <DemoSiteLayout page={page}>
      <section className="space-y-4 max-w-3xl">
        <CMSField.Text
          nbr={1}
          as="h1"
          fallbackToPageTitle
          className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-foreground"
        />

        <div className="h-1 w-14 rounded-full bg-gradient-to-r from-sky-600 to-cyan-400" />

        <CMSField.Text
          nbr={2}
          as="p"
          className="text-base text-slate-600 dark:text-muted-foreground leading-relaxed"
        />
      </section>

      <CMSField.Image
        nbr={1}
        alt={page.page_title}
        wrapperClassName="overflow-hidden rounded-3xl border border-neutral-300 dark:border-border bg-neutral-100 dark:bg-card p-2 shadow-xl shadow-black/10"
        className="w-full h-auto object-cover rounded-2xl max-h-[460px]"
      />

      <section className="space-y-3 max-w-3xl rounded-3xl border border-neutral-300 dark:border-border bg-neutral-100 dark:bg-card/60 p-6 sm:p-8 shadow-md shadow-black/5 border-l-4 border-l-sky-600 dark:border-l-sky-500">
        <CMSField.Text
          nbr={3}
          as="h2"
          className="text-xl font-bold tracking-tight text-slate-900 dark:text-foreground"
        />
        <CMSField.Text
          nbr={4}
          as="div"
          className="text-sm text-slate-700 dark:text-muted-foreground leading-relaxed"
        />
      </section>

      <section className="space-y-4">
        <CMSField.Gallery nbr={1} />
      </section>

      <section id="calendar" className="space-y-4">
        <BookingCalendar
          objectId={`unit-${page.id}`}
          objectName={page.page_title}
          basePrice={2400}
        />
      </section>
    </DemoSiteLayout>
  );
}
