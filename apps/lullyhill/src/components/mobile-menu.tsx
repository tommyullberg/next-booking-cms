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
      className="absolute right-6 top-[calc(100%+8px)] w-72 sm:w-80 max-h-[calc(100vh-6rem)] overflow-y-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-2xl z-50 p-2.5 space-y-1.5 animate-in fade-in-0 zoom-in-95 duration-150"
    >
      {/* Root Section (Hem) */}
      <a
        href="/"
        onClick={onClose}
        className={`group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold tracking-tight transition ${
          isRootActive
            ? "bg-sky-600 text-white shadow-sm"
            : "text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-slate-100 dark:focus:bg-slate-800 focus:outline-none"
        }`}
      >
        <div className="flex items-center gap-2.5">
          <Home className="w-4 h-4 shrink-0" />
          <span className="font-serif">{rootSection?.name || "Hem"}</span>
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
                    ? "bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 font-semibold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/70 dark:hover:bg-slate-800/70 focus:bg-slate-100/70 dark:focus:bg-slate-800/70 focus:outline-none"
                }`}
              >
                <CornerDownRight className="w-3.5 h-3.5 text-slate-400/70 shrink-0" />
                <span className="truncate">{item.label}</span>
              </a>
            );
          })}
        </div>
      )}

      {/* Divider if child sections exist */}
      {childSections.length > 0 && (
        <div className="my-1.5 border-t border-slate-200/80 dark:border-slate-800" />
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
                    ? "bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400"
                    : "text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-slate-100 dark:focus:bg-slate-800 focus:outline-none"
                }`}
              >
                <div className="flex items-center gap-2">
                  <CornerDownRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="font-serif">{sec.name}</span>
                </div>
              </a>
            ) : (
              <div className="flex items-center gap-2 px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                <CornerDownRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="font-serif">{sec.name}</span>
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
                          ? "bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 font-semibold"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/70 dark:hover:bg-slate-800/70 focus:bg-slate-100/70 dark:focus:bg-slate-800/70 focus:outline-none"
                      }`}
                    >
                      <CornerDownRight className="w-3 h-3 text-slate-400/60 shrink-0" />
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
