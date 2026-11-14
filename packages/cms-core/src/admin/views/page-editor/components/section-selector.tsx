"use client";

import React, { useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { Check, ChevronDown, FolderTree } from "lucide-react";
import { Label } from "@cms/components/ui";
import { cn } from "@cms/utils/cn";

export interface SectionSelectorProps {
  sectionLabelId: string;
  sectionTriggerId: string;
  sectionListboxId: string;
  sectionId: string;
  setSectionId: (id: string) => void;
  sections?: Array<{ id: string; name: string }>;
}

export function SectionSelector({
  sectionLabelId,
  sectionTriggerId,
  sectionListboxId,
  sectionId,
  setSectionId,
  sections = [],
}: SectionSelectorProps) {
  const t = useTranslations("pageEditor");

  const [isSectionOpen, setIsSectionOpen] = useState(false);
  const sectionTriggerRef = useRef<HTMLButtonElement | null>(null);
  const sectionOptionsRefs = useRef<(HTMLButtonElement | null)[]>([]);

  return (
    <div className='space-y-1.5 relative'>
      <Label
        id={sectionLabelId}
        className='block text-xs font-medium text-slate-200'
      >
        {t("section")}
      </Label>

      <button
        ref={sectionTriggerRef}
        id={sectionTriggerId}
        type='button'
        aria-haspopup='listbox'
        aria-expanded={isSectionOpen}
        aria-controls={sectionListboxId}
        aria-labelledby={sectionLabelId}
        onClick={() => setIsSectionOpen((prev) => !prev)}
        onKeyDown={(e) => {
          if (
            e.key === "ArrowDown" ||
            e.key === "ArrowUp" ||
            e.key === "Enter" ||
            e.key === " "
          ) {
            e.preventDefault();
            setIsSectionOpen(true);
          } else if (e.key === "Escape") {
            setIsSectionOpen(false);
          }
        }}
        className={cn(
          "w-full flex items-center justify-between rounded-xl border px-3.5 py-2.5 text-xs text-white bg-slate-950/90 transition",
          isSectionOpen
            ? "border-sky-500 ring-1 ring-sky-500/30"
            : "border-slate-800 hover:border-slate-700"
        )}
      >
        <span className='flex items-center gap-2.5'>
          <FolderTree className='cms-icon-md text-slate-400' />
          <span>
            {sections.find((s) => s.id === sectionId)?.name || t("noSection")}
          </span>
        </span>
        <ChevronDown
          className={cn(
            "cms-icon-md text-slate-400 transition-transform",
            isSectionOpen && "rotate-180"
          )}
        />
      </button>

      {isSectionOpen && (
        <div
          id={sectionListboxId}
          role='listbox'
          aria-labelledby={sectionTriggerId}
          className='mt-1 w-full rounded-xl border border-slate-800 bg-slate-900/95 shadow-xl overflow-hidden divide-y divide-slate-800/60 z-30 max-h-60 overflow-y-auto'
        >
          {/* Option: No section */}
          <button
            type='button'
            role='option'
            aria-selected={!sectionId}
            tabIndex={!sectionId ? 0 : -1}
            onClick={() => {
              setSectionId("");
              setIsSectionOpen(false);
              sectionTriggerRef.current?.focus();
            }}
            className={cn(
              "w-full flex items-center justify-between px-3.5 py-2.5 text-xs text-left transition",
              !sectionId
                ? "bg-sky-500/15 text-sky-300 font-medium"
                : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
            )}
          >
            <span className='flex items-center gap-2.5'>
              <FolderTree className='cms-icon-md text-slate-400' />
              <span>{t("noSection")}</span>
            </span>
            {!sectionId && <Check className='cms-icon-sm text-sky-400' />}
          </button>

          {/* Option: Available sections */}
          {sections.map((s, idx) => {
            const isSelected = s.id === sectionId;
            return (
              <button
                key={s.id}
                ref={(el) => {
                  sectionOptionsRefs.current[idx] = el;
                }}
                type='button'
                role='option'
                aria-selected={isSelected}
                tabIndex={isSelected ? 0 : -1}
                onClick={() => {
                  setSectionId(s.id);
                  setIsSectionOpen(false);
                  sectionTriggerRef.current?.focus();
                }}
                className={cn(
                  "w-full flex items-center justify-between px-3.5 py-2.5 text-xs text-left transition",
                  isSelected
                    ? "bg-sky-500/15 text-sky-300 font-medium"
                    : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                )}
              >
                <span className='flex items-center gap-2.5'>
                  <FolderTree className='cms-icon-md text-slate-400' />
                  <span>{s.name}</span>
                </span>
                {isSelected && <Check className='cms-icon-sm text-sky-400' />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

