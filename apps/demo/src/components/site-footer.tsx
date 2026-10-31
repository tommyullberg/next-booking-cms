"use client";

import React from "react";
import Link from "next/link";
import { CmsBrandLogo } from "@next-booking/cms-core";

export interface SiteFooterProps {
  brandName?: string;
  templateName?: string;
  pageTitle?: string;
}

export function SiteFooter({
  templateName,
  pageTitle,
}: SiteFooterProps) {
  return (
    <footer className="border-t border-neutral-300 dark:border-border bg-neutral-100/95 dark:bg-background py-8 text-center text-xs text-muted-foreground">
      <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
          <Link
            href="/"
            className="inline-flex items-center hover:opacity-95 transition-opacity"
          >
            <CmsBrandLogo variant="auto" heightClassName="h-7" />
          </Link>
          {templateName && (
            <>
              <span className="hidden sm:inline-block h-4 w-px bg-border" />
              <span className="inline-flex items-center gap-1.5 rounded-md border border-sky-600/35 dark:border-sky-500/30 bg-sky-500/15 dark:bg-sky-500/10 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-sky-700 dark:text-sky-400">
                <span className="h-1.5 w-1.5 rounded-full bg-sky-600 dark:bg-sky-400" />
                <span>
                  Template: <span className="italic font-medium">{templateName}</span>
                </span>
              </span>
            </>
          )}
        </div>
        {pageTitle && <span className="font-medium text-slate-600 dark:text-slate-400">{pageTitle}</span>}
      </div>
    </footer>
  );
}

