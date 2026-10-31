"use client";

import React from "react";
import Link from "next/link";

export interface SiteFooterProps {
  brandName?: string;
  pageTitle?: string;
}

export function SiteFooter({
  pageTitle,
}: SiteFooterProps) {
  return (
    <footer className="border-t border-neutral-300 dark:border-slate-800 bg-neutral-100/95 dark:bg-slate-900/90 py-10 mt-12 text-center text-xs text-neutral-600 dark:text-slate-400 transition-colors">
      <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <Link
          href="/"
          className="inline-flex items-center hover:opacity-95 transition-opacity"
        >
          <img
            src="/branding/villa-lullyhill-logo-light.png"
            alt="Villa Lullyhill Gotland"
            className="w-full max-w-[110px] sm:max-w-[125px] h-auto object-contain select-none block dark:hidden"
          />
          <img
            src="/branding/villa-lullyhill-logo-dark.png"
            alt="Villa Lullyhill Gotland"
            className="w-full max-w-[110px] sm:max-w-[125px] h-auto object-contain select-none hidden dark:block"
          />
        </Link>
        {pageTitle && <span>{pageTitle}</span>}
      </div>
    </footer>
  );
}

