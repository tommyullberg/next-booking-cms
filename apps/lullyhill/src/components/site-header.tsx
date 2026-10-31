"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { CMSPageData, CMSNavigationSection } from "@next-booking/cms-core";
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
    <header className="border-b border-neutral-300 dark:border-slate-800 bg-neutral-100/95 dark:bg-slate-950/85 shadow-sm shadow-black/5 dark:shadow-none backdrop-blur sticky top-0 z-40 transition-colors">
      <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between relative">
        <Link
          href="/"
          className="inline-flex items-center hover:opacity-95 transition-opacity"
        >
          <img
            src="/branding/villa-lullyhill-logo-light.png"
            alt="Villa Lullyhill Gotland"
            className="w-full max-w-[180px] sm:max-w-[220px] h-auto object-contain select-none block dark:hidden"
          />
          <img
            src="/branding/villa-lullyhill-logo-dark.png"
            alt="Villa Lullyhill Gotland"
            className="w-full max-w-[180px] sm:max-w-[220px] h-auto object-contain select-none hidden dark:block"
          />
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
            className="inline-flex items-center gap-2 rounded-xl border border-neutral-300 dark:border-slate-800 bg-neutral-50 dark:bg-slate-900 px-4 py-2 text-xs font-semibold text-neutral-800 dark:text-slate-200 hover:bg-neutral-200/70 dark:hover:bg-slate-800 transition shadow-xs"
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

