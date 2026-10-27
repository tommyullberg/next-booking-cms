"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
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
      className="absolute right-6 top-[calc(100%+8px)] w-72 sm:w-80 max-h-[calc(100vh-5rem)] overflow-y-auto rounded-2xl border border-slate-300 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 shadow-2xl shadow-slate-900/10 dark:shadow-[0_12px_40px_rgba(255,255,255,0.08)] z-50 p-2.5 space-y-1.5 animate-in fade-in-0 zoom-in-95 duration-150"
    >
      {/* Root Section (Hem) */}
      <Link
        href="/"
        onClick={onClose}
        className={`group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold tracking-tight transition ${
          isRootActive
            ? "bg-slate-300 text-slate-950 shadow-sm dark:bg-slate-700 dark:text-white"
            : "text-slate-800 dark:text-slate-200 hover:bg-slate-200/90 dark:hover:bg-slate-800 hover:text-slate-950 dark:hover:text-white focus:bg-slate-200/90 dark:focus:bg-slate-800 focus:outline-none"
        }`}
      >
        <div className="flex items-center gap-2.5">
          <Home className="w-4 h-4 shrink-0" />
          <span>{rootSection?.name || "Hem"}</span>
        </div>
      </Link>

      {/* Root Section Sub-Items (if explicitly configured) */}
      {rootSection && rootSection.items.length > 0 && (
        <div className="pl-3.5 space-y-1">
          {rootSection.items.map((item) => {
            const isActive = Number(currentPageId) === item.id;
            return (
              <Link
                key={item.id}
                href={item.url}
                onClick={onClose}
                className={`group flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition ${
                  isActive
                    ? "bg-slate-300 text-slate-950 font-bold shadow-xs dark:bg-slate-700 dark:text-white"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200/80 dark:hover:bg-slate-800 focus:bg-slate-200/80 dark:focus:bg-slate-800 focus:outline-none"
                }`}
              >
                <CornerDownRight
                  className={`w-3.5 h-3.5 shrink-0 ${
                    isActive
                      ? "text-slate-950 dark:text-white"
                      : "text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300"
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>
      )}

      {/* Divider if child sections exist */}
      {childSections.length > 0 && (
        <div className="my-1.5 border-t border-slate-300/80 dark:border-slate-700/80" />
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
              <Link
                href={sec.start_page_url}
                onClick={onClose}
                className={`group flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
                  isSectionActive
                    ? "bg-slate-300 text-slate-950 font-bold dark:bg-slate-700 dark:text-white"
                    : "text-slate-800 dark:text-slate-200 hover:bg-slate-200/90 dark:hover:bg-slate-800 hover:text-slate-950 dark:hover:text-white focus:bg-slate-200/90 dark:focus:bg-slate-800 focus:outline-none"
                }`}
              >
                <div className="flex items-center gap-2">
                  <CornerDownRight
                    className={`w-3.5 h-3.5 shrink-0 ${
                      isSectionActive
                        ? "text-slate-950 dark:text-white"
                        : "text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300"
                    }`}
                  />
                  <span>{sec.name}</span>
                </div>
              </Link>
            ) : (
              <div className="flex items-center gap-2 px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <CornerDownRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{sec.name}</span>
              </div>
            )}

            {/* Sub-items (explicitly added in CMS) */}
            {sec.items.length > 0 && (
              <div className="pl-4 space-y-1">
                {sec.items.map((item) => {
                  const isActive = Number(currentPageId) === item.id;
                  return (
                    <Link
                      key={item.id}
                      href={item.url}
                      onClick={onClose}
                      className={`group flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                        isActive
                          ? "bg-slate-300 text-slate-950 font-bold dark:bg-slate-700 dark:text-white"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200/80 dark:hover:bg-slate-800 focus:bg-slate-200/80 dark:focus:bg-slate-800 focus:outline-none"
                      }`}
                    >
                      <CornerDownRight
                        className={`w-3 h-3 shrink-0 ${
                          isActive
                            ? "text-slate-950 dark:text-white"
                            : "text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300"
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </Link>
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
