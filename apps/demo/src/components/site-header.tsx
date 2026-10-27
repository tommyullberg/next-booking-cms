"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { Layers, Menu, X } from "lucide-react";
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
    <header className="border-b border-border bg-background/85 backdrop-blur sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between relative">
        <Link href="/" className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold shadow-md">
            <Layers className="w-5 h-5" />
          </div>
          <span className="text-base font-bold tracking-tight">
            {rootSection?.name || "NextBooking"}
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            ref={menuButtonRef}
            type="button"
            onClick={toggleMenu}
            aria-expanded={isMenuOpen}
            aria-haspopup="dialog"
            aria-label="Toggle navigation menu"
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-accent transition"
          >
            {isMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            <span>Menu</span>
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

