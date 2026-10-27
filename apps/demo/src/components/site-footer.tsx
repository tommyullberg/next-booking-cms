"use client";

import React from "react";

export interface SiteFooterProps {
  brandName?: string;
  pageTitle?: string;
}

export function SiteFooter({
  brandName = "NextBooking",
  pageTitle,
}: SiteFooterProps) {
  return (
    <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
      <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <span>{brandName}</span>
        {pageTitle && <span>{pageTitle}</span>}
      </div>
    </footer>
  );
}

