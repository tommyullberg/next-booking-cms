"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import {
  CMSPageData,
  CMSNavigationSection,
  CmsBrandLogo,
} from "@next-booking/cms-core";
import { ThemeToggle } from "./theme-toggle";
import { MobileMenu } from "./mobile-menu";

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
  const menuButtonRef = useRef<HTMLButtonElement>(null);

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

  return (
    <header className="border-b border-neutral-300 dark:border-border bg-neutral-100/95 dark:bg-background/85 shadow-sm shadow-black/5 dark:shadow-none backdrop-blur sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between relative">
        <Link href="/" className="flex items-center gap-3 group">
          <CmsBrandLogo
            variant="auto"
            heightClassName="h-8 sm:h-9"
            className="group-hover:opacity-95 transition-opacity"
          />
          <span className="hidden sm:inline-block h-5 w-px bg-neutral-300 dark:bg-border" />
          <span className="inline-flex items-center gap-1.5 rounded-md border border-sky-600/35 dark:border-sky-500/30 bg-sky-500/15 dark:bg-sky-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-sky-700 dark:text-sky-400">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-600 dark:bg-sky-400" />
            <span>
              Demo<span className="hidden sm:inline"> Template</span>
            </span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <div className="hidden sm:block">
            <ThemeToggle />
          </div>
          <button
            ref={menuButtonRef}
            type="button"
            onClick={toggleMenu}
            aria-expanded={isMenuOpen}
            aria-haspopup="dialog"
            aria-label="Toggle navigation menu"
            className="inline-flex items-center gap-2 rounded-xl border border-neutral-300 dark:border-border bg-neutral-50 dark:bg-card px-3.5 py-2 text-xs font-semibold text-foreground shadow-xs hover:bg-neutral-200/70 dark:hover:bg-accent transition"
          >
            {isMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            <span className="hidden min-[480px]:inline">Menu</span>
          </button>
        </div>

        {/* Anchored Floating Dropdown Mobile Menu */}
        <MobileMenu
          isOpen={isMenuOpen}
          onClose={closeMenu}
          sections={navSections}
          currentPageId={page.id}
          triggerRef={menuButtonRef}
        />
      </div>
    </header>
  );
}

