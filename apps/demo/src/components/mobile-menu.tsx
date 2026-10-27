"use client";

import React, { useEffect, useRef } from "react";
import { Home, CornerDownRight } from "lucide-react";
import { CMSNavigationSection } from "@next-booking/cms-core";

export interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  sections: CMSNavigationSection[];
  currentPageId: number | string;
  triggerRef?: React.RefObject<HTMLElement | null>;
}

export function MobileMenu({
  isOpen,
  onClose,
  sections,
  currentPageId,
  triggerRef,
}: MobileMenuProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  const rootSection = sections.find((s) => s.is_root);
  const childSections = sections.filter((s) => !s.is_root);
  const isRootActive = Number(currentPageId) === 1001;

  // WCAG Focus trap and keyboard listeners (Escape, Tab cycle)
  useEffect(() => {
    if (!isOpen) return;

    const panel = panelRef.current;
    if (!panel) return;

    const getFocusableElements = () => {
      return Array.from(
        panel.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => !el.hasAttribute("disabled") && el.offsetParent !== null);
    };

    // Focus first element on open
    const focusable = getFocusableElements();
    if (focusable.length > 0) {
      focusable[0].focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        if (triggerRef?.current) {
          triggerRef.current.focus();
        }
        return;
      }

      if (e.key === "Tab") {
        const elements = getFocusableElements();
        if (elements.length === 0) {
          e.preventDefault();
          return;
        }

        const first = elements[0];
        const last = elements[elements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (
        panel &&
        !panel.contains(target) &&
        (!triggerRef?.current || !triggerRef.current.contains(target))
      ) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen, onClose, triggerRef]);

  if (!isOpen) return null;

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-label="Webbplatsens navigering"
      className="absolute right-6 top-[calc(100%+8px)] w-72 sm:w-80 max-h-[calc(100vh-5rem)] overflow-y-auto rounded-2xl border border-border bg-card/95 backdrop-blur-xl shadow-2xl z-50 p-2.5 space-y-1.5 animate-in fade-in-0 zoom-in-95 duration-150"
    >
      {/* Root Section (Hem) */}
      <a
        href="/"
        onClick={onClose}
        className={`group flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold tracking-tight transition ${
          isRootActive
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-foreground hover:bg-accent focus:bg-accent focus:outline-none"
        }`}
      >
        <div className="flex items-center gap-2.5">
          <Home className="w-4 h-4 shrink-0" />
          <span>{rootSection?.name || "Hem"}</span>
        </div>
      </a>

      {/* Root Section Sub-Items (if explicitly configured) */}
      {rootSection && rootSection.items.length > 0 && (
        <div className="pl-3.5 space-y-1">
          {rootSection.items.map((item) => {
            const isActive = Number(currentPageId) === item.id;
            return (
              <a
                key={item.id}
                href={item.url}
                onClick={onClose}
                className={`group flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition ${
                  isActive
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/60 focus:bg-accent/60 focus:outline-none"
                }`}
              >
                <CornerDownRight className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
                <span className="truncate">{item.label}</span>
              </a>
            );
          })}
        </div>
      )}

      {/* Divider if child sections exist */}
      {childSections.length > 0 && (
        <div className="my-1.5 border-t border-border/60" />
      )}

      {/* Child Sections */}
      {childSections.map((sec) => {
        const isSectionActive =
          sec.start_page_id != null &&
          Number(currentPageId) === Number(sec.start_page_id);

        return (
          <div key={sec.id} className="space-y-1">
            {/* Direct Section Link */}
            {sec.start_page_url ? (
              <a
                href={sec.start_page_url}
                onClick={onClose}
                className={`group flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
                  isSectionActive
                    ? "bg-primary/15 text-primary"
                    : "text-foreground hover:bg-accent focus:bg-accent focus:outline-none"
                }`}
              >
                <div className="flex items-center gap-2">
                  <CornerDownRight className="w-3.5 h-3.5 text-muted-foreground/70 shrink-0" />
                  <span>{sec.name}</span>
                </div>
              </a>
            ) : (
              <div className="flex items-center gap-2 px-3 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <CornerDownRight className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
                <span>{sec.name}</span>
              </div>
            )}

            {/* Sub-items (explicitly added in CMS) */}
            {sec.items.length > 0 && (
              <div className="pl-4 space-y-1">
                {sec.items.map((item) => {
                  const isActive = Number(currentPageId) === item.id;
                  return (
                    <a
                      key={item.id}
                      href={item.url}
                      onClick={onClose}
                      className={`group flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                        isActive
                          ? "bg-primary/10 text-primary font-semibold"
                          : "text-muted-foreground hover:text-foreground hover:bg-accent/60 focus:bg-accent/60 focus:outline-none"
                      }`}
                    >
                      <CornerDownRight className="w-3 h-3 text-muted-foreground/50 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </a>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
