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
          className="text-3xl md:text-4xl font-extrabold tracking-tight"
        />

        <CMSField.Text
          nbr={2}
          as="p"
          className="text-base text-muted-foreground leading-relaxed"
        />
      </section>

      <CMSField.Image
        nbr={1}
        alt={page.page_title}
        wrapperClassName="overflow-hidden rounded-3xl border border-border shadow-xl"
        className="w-full h-auto object-cover max-h-[460px]"
      />

      <section className="space-y-3 max-w-3xl">
        <CMSField.Text
          nbr={3}
          as="h2"
          className="text-xl font-bold tracking-tight"
        />
        <CMSField.Text
          nbr={4}
          as="div"
          className="text-sm text-muted-foreground leading-relaxed"
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
