"use client";

import React from "react";
import { CMSField, CMSPageData } from "@next-booking/cms-core";
import { LullyhillSiteLayout } from "../components/site-layout";

export function ContactTemplate({ page }: { page: CMSPageData }) {
  return (
    <LullyhillSiteLayout page={page}>
      <div className="max-w-3xl mx-auto space-y-8">
        <header className="space-y-4">
          <CMSField.Text
            nbr={1}
            as="h1"
            fallbackToPageTitle
            className="text-3xl sm:text-4xl font-serif tracking-tight text-slate-900"
          />

          <CMSField.Text
            nbr={2}
            as="p"
            className="text-sm text-slate-600 leading-relaxed"
          />
        </header>

        <CMSField.Image
          nbr={1}
          alt={page.page_title}
          wrapperClassName="overflow-hidden rounded-3xl border border-slate-200 bg-white p-2 shadow-lg"
          className="w-full h-auto object-cover rounded-2xl max-h-[380px]"
        />

        <div className="space-y-4">
          <CMSField.Text
            nbr={3}
            as="div"
            className="text-sm text-slate-800 leading-relaxed"
          />
          <CMSField.Text
            nbr={4}
            as="div"
            className="text-sm text-slate-600 leading-relaxed"
          />
        </div>
      </div>
    </LullyhillSiteLayout>
  );
}
