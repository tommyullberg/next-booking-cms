"use client";

import React from "react";
import { CMSPageData } from "@next-booking/cms-core";
import { emptyFallbackPage } from "../components/site-layout";
import { StartpageTemplate } from "./startpage";
import { BookingUnitTemplate } from "./booking-unit";
import { BookingOverviewTemplate } from "./booking-overview";
import { ArticleTemplate } from "./article";
import { ContactTemplate } from "./contact";

export const DEMO_TEMPLATES: Record<
  string,
  React.ComponentType<{ page: CMSPageData }>
> = {
  startpage: StartpageTemplate,
  Startpage: StartpageTemplate,
  "booking-unit": BookingUnitTemplate,
  "Booking unit": BookingUnitTemplate,
  booking: BookingUnitTemplate,
  "booking-overview": BookingOverviewTemplate,
  "Booking overview": BookingOverviewTemplate,
  article: ArticleTemplate,
  Article: ArticleTemplate,
  Default: ArticleTemplate,
  "Entire page": ArticleTemplate,
  contact: ContactTemplate,
  Contact: ContactTemplate,
};

export function DemoTemplateRenderer({ page }: { page?: CMSPageData | null }) {
  const activePage = page || emptyFallbackPage;
  const isHomepage = Number(activePage.id) === 1001;
  const templateKey = isHomepage
    ? "startpage"
    : activePage.template_name || "article";

  const TemplateComponent =
    DEMO_TEMPLATES[templateKey] || ArticleTemplate;

  return <TemplateComponent page={activePage} />;
}

export {
  StartpageTemplate,
  BookingUnitTemplate,
  BookingOverviewTemplate,
  ArticleTemplate,
  ContactTemplate,
};
