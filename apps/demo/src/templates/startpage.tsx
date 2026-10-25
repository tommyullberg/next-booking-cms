"use client";

import React from "react";
import { CMSField, AvailabilitySearch, CMSPageData } from "@next-booking/cms-core";
import { DemoSiteLayout } from "../components/site-layout";

export function StartpageTemplate({ page }: { page: CMSPageData }) {
  return (
    <DemoSiteLayout page={page}>
      <section className="text-center space-y-4 max-w-3xl mx-auto">
        <CMSField.Text
          nbr={1}
          as="h1"
          fallbackToPageTitle
          className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight"
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
        wrapperClassName="overflow-hidden rounded-3xl border border-border shadow-2xl"
        className="w-full h-auto object-cover max-h-[480px]"
      />

      <section id="booking" className="space-y-6">
        <div className="text-center max-w-xl mx-auto">
          <CMSField.Text
            nbr={3}
            as="h2"
            className="text-2xl font-bold tracking-tight mb-2"
          />
          <CMSField.Text
            nbr={4}
            as="p"
            className="text-xs text-muted-foreground"
          />
        </div>

        <AvailabilitySearch />
      </section>
    </DemoSiteLayout>
  );
}
