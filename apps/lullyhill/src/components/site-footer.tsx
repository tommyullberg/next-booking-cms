"use client";

import React from "react";

export interface SiteFooterProps {
  brandName?: string;
  pageTitle?: string;
}

export function SiteFooter({
  brandName = "Villa Lullyhill",
  pageTitle,
}: SiteFooterProps) {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 py-10 mt-12 text-center text-xs text-slate-500 dark:text-slate-400 transition-colors">
      <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <span className="font-serif font-semibold text-slate-900 dark:text-white">
          {brandName}
        </span>
        {pageTitle && <span>{pageTitle}</span>}
      </div>
    </footer>
  );
}
