"use client";

import React, { useState } from "react";
import {
  CMSPageProvider,
  InlineEditor,
  CMSQueryProvider,
  CMSPageData,
  CMSNavigationSection,
} from "@next-booking/cms-core";
import { Menu, X, ChevronRight, Home, FolderTree } from "lucide-react";

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
  const childSections = navSections.filter((s) => !s.is_root);

  return (
    <CMSQueryProvider>
      <CMSPageProvider page={page} locale="sv">
        <div
          data-page-id={page.id}
          data-template={page.template_name}
          className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-sky-100 selection:text-sky-900"
        >
          {/* Header with Hamburger Menu */}
          <header className="border-b border-slate-200/80 bg-slate-50/90 backdrop-blur sticky top-0 z-40">
            <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
              <a href="/" className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-sky-700 text-white flex items-center justify-center font-serif text-lg shadow-md shadow-sky-900/10">
                  L
                </div>
                <div>
                  <span className="text-base font-semibold tracking-wider uppercase font-serif text-slate-900 block">
                    {rootSection?.name || "Villa Lullyhill"}
                  </span>
                </div>
              </a>

              <button
                type="button"
                onClick={() => setIsMenuOpen((prev) => !prev)}
                aria-expanded={isMenuOpen}
                aria-label="Toggle navigation menu"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-100 transition shadow-sm"
              >
                {isMenuOpen ? (
                  <X className="w-4 h-4" />
                ) : (
                  <Menu className="w-4 h-4" />
                )}
                <span>Menu</span>
              </button>
            </div>

            {/* Expandable Hamburger Navigation Menu built from Sections & Navigation Menus */}
            {isMenuOpen && (
              <div className="border-t border-slate-200 bg-white/95 backdrop-blur-md shadow-xl">
                <nav
                  aria-label="Site navigation"
                  className="max-w-6xl mx-auto px-6 py-6 space-y-6"
                >
                  {/* Root Section (Page 1001) */}
                  <div className="space-y-2">
                    <a
                      href="/"
                      onClick={() => setIsMenuOpen(false)}
                      className={`inline-flex items-center gap-2 text-sm font-bold transition ${
                        Number(page.id) === 1001
                          ? "text-sky-700"
                          : "text-slate-900 hover:text-sky-700"
                      }`}
                    >
                      <Home className="w-4 h-4" />
                      <span>{rootSection?.name || "Home"}</span>
                    </a>

                    {rootSection && rootSection.items.length > 0 && (
                      <ul className="pl-6 space-y-1.5 border-l border-slate-200 ml-2">
                        {rootSection.items.map((item) => {
                          const isActive = Number(page.id) === item.id;
                          return (
                            <li key={item.id}>
                              <a
                                href={item.url}
                                onClick={() => setIsMenuOpen(false)}
                                className={`inline-flex items-center gap-2 text-xs py-1 transition ${
                                  isActive
                                    ? "font-bold text-sky-700"
                                    : "text-slate-600 hover:text-slate-900"
                                }`}
                              >
                                <ChevronRight className="w-3.5 h-3.5" />
                                <span>{item.label}</span>
                                {item.status !== "PUBLISHED" && (
                                  <span
                                    className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                                      item.status === "NEW"
                                        ? "bg-amber-500/15 text-amber-600 border border-amber-500/30"
                                        : "bg-red-500/15 text-red-600 border border-red-500/30"
                                    }`}
                                  >
                                    {item.status}
                                  </span>
                                )}
                              </a>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>

                  {/* Level 2 Sections & their Navigation Menu Items */}
                  {childSections.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 pt-4 border-t border-slate-200">
                      {childSections.map((sec) => {
                        const isSectionPageActive =
                          sec.start_page_id != null &&
                          Number(page.id) === Number(sec.start_page_id);

                        return (
                          <div key={sec.id} className="space-y-2.5">
                            <div className="flex items-center gap-2">
                              <FolderTree className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              {sec.start_page_url ? (
                                <a
                                  href={sec.start_page_url}
                                  onClick={() => setIsMenuOpen(false)}
                                  className={`text-xs font-bold uppercase tracking-wider transition ${
                                    isSectionPageActive
                                      ? "text-sky-700"
                                      : "text-slate-900 hover:text-sky-700"
                                  }`}
                                >
                                  {sec.name}
                                </a>
                              ) : (
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
                                  {sec.name}
                                </span>
                              )}
                            </div>

                            {sec.items.length > 0 && (
                              <ul className="space-y-1.5 pl-4 border-l border-slate-200">
                                {sec.items.map((item) => {
                                  const isActive = Number(page.id) === item.id;
                                  return (
                                    <li key={item.id}>
                                      <a
                                        href={item.url}
                                        onClick={() => setIsMenuOpen(false)}
                                        className={`inline-flex items-center gap-2 text-xs py-0.5 transition ${
                                          isActive
                                            ? "font-semibold text-sky-700"
                                            : "text-slate-600 hover:text-slate-900"
                                        }`}
                                      >
                                        <span>{item.label}</span>
                                        {item.status !== "PUBLISHED" && (
                                          <span
                                            className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                                              item.status === "NEW"
                                                ? "bg-amber-500/15 text-amber-600 border border-amber-500/30"
                                                : "bg-red-500/15 text-red-600 border border-red-500/30"
                                            }`}
                                          >
                                            {item.status}
                                          </span>
                                        )}
                                      </a>
                                    </li>
                                  );
                                })}
                              </ul>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </nav>
              </div>
            )}
          </header>

          {/* Main Content */}
          <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-12 space-y-12">
            {/* Assigned Categories (if any on this page) */}
            {page.categories && page.categories.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                {page.categories.map((cat) => (
                  <span
                    key={cat.id}
                    className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-sm"
                  >
                    {cat.name}
                  </span>
                ))}
              </div>
            )}

            {children}
          </main>

          {/* Footer */}
          <footer className="border-t border-slate-200 bg-white py-10 mt-12 text-center text-xs text-slate-500">
            <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="font-serif font-semibold text-slate-900">
                {rootSection?.name || "Villa Lullyhill"}
              </span>
              <span>{page.page_title}</span>
            </div>
          </footer>

          {/* Floating Inline Editor Toolbar */}
          <InlineEditor adminUrl="/admin" />
        </div>
      </CMSPageProvider>
    </CMSQueryProvider>
  );
}
