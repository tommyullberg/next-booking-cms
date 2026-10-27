"use client";

import React, { useState } from "react";
import { Layers, Menu, X, Home, FolderTree, ChevronRight } from "lucide-react";
import { CMSPageData, CMSNavigationSection } from "@next-booking/cms-core";
import { ThemeToggle } from "./theme-toggle";

export interface SiteHeaderProps {
  page: CMSPageData;
  isMenuOpen?: boolean;
  onToggleMenu?: () => void;
  onCloseMenu?: () => void;
}

export function SiteHeader({
  page,
  isMenuOpen: controlledMenuOpen,
  onToggleMenu,
  onCloseMenu,
}: SiteHeaderProps) {
  const [internalMenuOpen, setInternalMenuOpen] = useState(false);
  const isMenuOpen = controlledMenuOpen !== undefined ? controlledMenuOpen : internalMenuOpen;

  const toggleMenu = () => {
    if (onToggleMenu) {
      onToggleMenu();
    } else {
      setInternalMenuOpen((prev) => !prev);
    }
  };

  const closeMenu = () => {
    if (onCloseMenu) {
      onCloseMenu();
    } else {
      setInternalMenuOpen(false);
    }
  };

  const navSections: CMSNavigationSection[] = page.navigation_sections || [];
  const rootSection = navSections.find((s) => s.is_root);
  const childSections = navSections.filter((s) => !s.is_root);

  return (
    <header className="border-b border-border bg-background/85 backdrop-blur sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <a href="/" className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold shadow-md">
            <Layers className="w-5 h-5" />
          </div>
          <span className="text-base font-bold tracking-tight">
            {rootSection?.name || "NextBooking"}
          </span>
        </a>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            type="button"
            onClick={toggleMenu}
            aria-expanded={isMenuOpen}
            aria-label="Toggle navigation menu"
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-accent transition"
          >
            {isMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            <span>Menu</span>
          </button>
        </div>
      </div>

      {/* Expandable Hamburger Navigation Menu built from Sections & Navigation Menus */}
      {isMenuOpen && (
        <div className="border-t border-border bg-background/95 backdrop-blur-md shadow-2xl">
          <nav aria-label="Site navigation" className="max-w-6xl mx-auto px-6 py-6 space-y-6">
            {/* Root Section (Page 1001) */}
            <div className="space-y-2">
              <a
                href="/"
                onClick={closeMenu}
                className={`inline-flex items-center gap-2 text-sm font-bold transition ${
                  Number(page.id) === 1001
                    ? "text-primary"
                    : "text-foreground hover:text-primary"
                }`}
              >
                <Home className="w-4 h-4" />
                <span>{rootSection?.name || "Home"}</span>
              </a>

              {rootSection && rootSection.items.length > 0 && (
                <ul className="pl-6 space-y-1.5 border-l border-border ml-2">
                  {rootSection.items.map((item) => {
                    const isActive = Number(page.id) === item.id;
                    return (
                      <li key={item.id}>
                        <a
                          href={item.url}
                          onClick={closeMenu}
                          className={`inline-flex items-center gap-2 text-xs py-1 transition ${
                            isActive
                              ? "font-bold text-primary"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                          <span>{item.label}</span>
                          {item.status !== "PUBLISHED" && (
                            <span
                              className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                                item.status === "NEW"
                                  ? "bg-amber-500/15 text-amber-500 border border-amber-500/30"
                                  : "bg-red-500/15 text-red-500 border border-red-500/30"
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
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 pt-4 border-t border-border">
                {childSections.map((sec) => {
                  const isSectionPageActive =
                    sec.start_page_id != null &&
                    Number(page.id) === Number(sec.start_page_id);

                  return (
                    <div key={sec.id} className="space-y-2.5">
                      <div className="flex items-center gap-2">
                        <FolderTree className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        {sec.start_page_url ? (
                          <a
                            href={sec.start_page_url}
                            onClick={closeMenu}
                            className={`text-xs font-bold uppercase tracking-wider transition ${
                              isSectionPageActive
                                ? "text-primary"
                                : "text-foreground hover:text-primary"
                            }`}
                          >
                            {sec.name}
                          </a>
                        ) : (
                          <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                            {sec.name}
                          </span>
                        )}
                      </div>

                      {sec.items.length > 0 && (
                        <ul className="space-y-1.5 pl-4 border-l border-border">
                          {sec.items.map((item) => {
                            const isActive = Number(page.id) === item.id;
                            return (
                              <li key={item.id}>
                                <a
                                  href={item.url}
                                  onClick={closeMenu}
                                  className={`inline-flex items-center gap-2 text-xs py-0.5 transition ${
                                    isActive
                                      ? "font-semibold text-primary"
                                      : "text-muted-foreground hover:text-foreground"
                                  }`}
                                >
                                  <span>{item.label}</span>
                                  {item.status !== "PUBLISHED" && (
                                    <span
                                      className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                                        item.status === "NEW"
                                          ? "bg-amber-500/15 text-amber-500 border border-amber-500/30"
                                          : "bg-red-500/15 text-red-500 border border-red-500/30"
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
  );
}
