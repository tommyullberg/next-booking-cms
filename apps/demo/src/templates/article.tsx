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
            className="text-3xl md:text-4xl font-extrabold tracking-tight leading-tight"
          />

          <CMSField.Text
            nbr={2}
            as="p"
            className="text-base text-muted-foreground leading-relaxed"
          />
        </header>

        <CMSField.Image
          nbr={1}
          alt={page.page_title}
          wrapperClassName="overflow-hidden rounded-3xl border border-border shadow-lg"
          className="w-full h-auto object-cover max-h-[420px]"
        />

        <CMSField.Text
          nbr={3}
          as="div"
          className="text-sm leading-relaxed text-foreground space-y-4"
        />
      </article>
    </DemoSiteLayout>
  );
}
