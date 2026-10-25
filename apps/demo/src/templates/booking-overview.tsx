"use client";

import React from "react";
import { CMSField, AvailabilitySearch, CMSPageData } from "@next-booking/cms-core";
import { DemoSiteLayout } from "../components/site-layout";

export function BookingOverviewTemplate({ page }: { page: CMSPageData }) {
  return (
    <DemoSiteLayout page={page}>
      <section className="text-center space-y-4 max-w-3xl mx-auto">
        <CMSField.Text
          nbr={1}
          as="h1"
          fallbackToPageTitle
          className="text-3xl md:text-5xl font-extrabold tracking-tight"
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
        wrapperClassName="overflow-hidden rounded-3xl border border-border shadow-lg"
        className="w-full h-auto object-cover max-h-[420px]"
      />

      <section className="space-y-6">
        <AvailabilitySearch />
      </section>

      <section className="max-w-3xl mx-auto space-y-3">
        <CMSField.Text nbr={3} as="h2" className="text-xl font-bold" />
        <CMSField.Text
          nbr={4}
          as="div"
          className="text-sm text-muted-foreground leading-relaxed"
        />
      </section>
    </DemoSiteLayout>
  );
}
