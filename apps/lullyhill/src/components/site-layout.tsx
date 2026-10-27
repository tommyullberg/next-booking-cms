"use client";

import React, { useState } from "react";
import {
  CMSPageProvider,
  InlineEditor,
  CMSQueryProvider,
  CMSPageData,
  CMSNavigationSection,
} from "@next-booking/cms-core";
import { ThemeToggle } from "./theme-toggle";
import { SiteHeader } from "./site-header";
import { SiteFooter } from "./site-footer";

export { ThemeToggle, SiteHeader, SiteFooter };

export const emptyFallbackLullyhillPage: CMSPageData = {
  id: 1001,
  template_name: "startpage",
  page_title: "",
  slug: "/",
  status: "PUBLISHED",
  page_fields: [],
  navigation_sections: [],
};

export function LullyhillSiteLayout({
  page,
  children,
}: {
  page: CMSPageData;
  children: React.ReactNode;
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navSections: CMSNavigationSection[] = page.navigation_sections || [];
  const rootSection = navSections.find((s) => s.is_root);

  return (
    <CMSQueryProvider>
      <CMSPageProvider page={page} locale="sv">
        <div
          data-page-id={page.id}
          data-template={page.template_name}
          className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200 selection:bg-sky-100 selection:text-sky-900"
        >
          {/* Extracted Header */}
          <SiteHeader
            page={page}
            isMenuOpen={isMenuOpen}
            onToggleMenu={() => setIsMenuOpen((prev) => !prev)}
            onCloseMenu={() => setIsMenuOpen(false)}
          />

          {/* Template Main Content */}
          <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-12 space-y-12">
            {/* Assigned Categories (if any on this page) */}
            {page.categories && page.categories.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                {page.categories.map((cat) => (
                  <span
                    key={cat.id}
                    className="inline-flex items-center rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 shadow-sm"
                  >
                    {cat.name}
                  </span>
                ))}
              </div>
            )}

            {children}
          </main>

          {/* Extracted Footer */}
          <SiteFooter
            brandName={rootSection?.name || "Villa Lullyhill"}
            pageTitle={page.page_title}
          />

          {/* Floating Inline Editor Toolbar */}
          <InlineEditor adminUrl="/admin" />
        </div>
      </CMSPageProvider>
    </CMSQueryProvider>
  );
}
