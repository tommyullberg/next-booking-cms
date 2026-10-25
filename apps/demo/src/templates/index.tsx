"use client";

import React from "react";
import {
  CMSPageData,
  CMSTemplateOption,
  resolveTemplateOption,
} from "@next-booking/cms-core";
import { emptyFallbackPage } from "../components/site-layout";
import { StartpageTemplate } from "./startpage";
import { BookingUnitTemplate } from "./booking-unit";
import { BookingOverviewTemplate } from "./booking-overview";
import { ArticleTemplate } from "./article";
import { ContactTemplate } from "./contact";

export interface ProjectTemplateDefinition extends CMSTemplateOption {
  component: React.ComponentType<{ page: CMSPageData }>;
}

export const CMS_PAGE_TEMPLATES: ProjectTemplateDefinition[] = [
  {
    id: "startpage",
    label: "Startpage",
    description: "Main website landing page with hero banner and highlights",
    isProtected: true,
    component: StartpageTemplate,
  },
  {
    id: "booking-unit",
    label: "Booking unit",
    description: "Detailed unit presentation with calendar and amenities",
    component: BookingUnitTemplate,
  },
  {
    id: "booking-overview",
    label: "Booking overview",
    description: "Overview grid of rentable cottages and accommodation units",
    component: BookingOverviewTemplate,
  },
  {
    id: "article",
    label: "Article",
    description: "Standard editorial content page",
    component: ArticleTemplate,
  },
  {
    id: "contact",
    label: "Contact",
    description: "Contact information, host details and directions",
    component: ContactTemplate,
  },
];

export const CMS_PAGE_TEMPLATE_OPTIONS: CMSTemplateOption[] =
  CMS_PAGE_TEMPLATES.map(({ component: _, ...opt }) => opt);

// Backwards-compatible aliases
export const DEMO_TEMPLATES = CMS_PAGE_TEMPLATES;
export const DEMO_TEMPLATE_OPTIONS = CMS_PAGE_TEMPLATE_OPTIONS;

const TEMPLATE_COMPONENTS = new Map<
  string,
  React.ComponentType<{ page: CMSPageData }>
>(CMS_PAGE_TEMPLATES.map((t) => [t.id, t.component]));

export function DemoTemplateRenderer({ page }: { page?: CMSPageData | null }) {
  const activePage = page || emptyFallbackPage;
  const isHomepage = Number(activePage.id) === 1001;
  const rawKey = isHomepage
    ? "startpage"
    : activePage.template_name || "article";

  const resolved = resolveTemplateOption(rawKey, CMS_PAGE_TEMPLATE_OPTIONS);
  const TemplateComponent =
    TEMPLATE_COMPONENTS.get(resolved.id) || ArticleTemplate;

  return <TemplateComponent page={activePage} />;
}

export {
  StartpageTemplate,
  BookingUnitTemplate,
  BookingOverviewTemplate,
  ArticleTemplate,
  ContactTemplate,
};
