"use client";

import React, { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, Box, AlertTriangle } from "lucide-react";
import { Badge, Label } from "@cms/components/ui";
import { cn } from "@cms/utils/cn";
import { CMSTemplateOption } from "@cms/templates/types";
import {
  BookingObjectDetails,
  formatBookingObjectType,
} from "@cms/booking/types";
import { getTemplateIcon } from "../utils";

export interface TemplateSelectorProps {
  templateLabelId: string;
  templateTriggerId: string;
  templateListboxId: string;
  isHomepage: boolean;
  templateName: string;
  setTemplateName: (name: string) => void;
  selectableTemplates: CMSTemplateOption[];
  currentTemplateOption: CMSTemplateOption;
  getTemplateLabel: (optId: string, fallbackLabel: string) => string;
  linkedBookingObject: BookingObjectDetails | null;
}

export function TemplateSelector({
  templateLabelId,
  templateTriggerId,
  templateListboxId,
  isHomepage,
  templateName,
  setTemplateName,
  selectableTemplates,
  currentTemplateOption,
  getTemplateLabel,
  linkedBookingObject,
}: TemplateSelectorProps) {
  const t = useTranslations("pageEditor");
  const tCommon = useTranslations("common");

  const [isTemplateOpen, setIsTemplateOpen] = useState(false);
  const templateTriggerRef = useRef<HTMLButtonElement | null>(null);
  const templateOptionsRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const SelectedTemplateIcon = getTemplateIcon(currentTemplateOption.id);

  useEffect(() => {
    if (isTemplateOpen) {
      const selectedIdx = selectableTemplates.findIndex(
        (opt) => opt.id.toLowerCase() === templateName.toLowerCase()
      );
      const targetIdx = selectedIdx >= 0 ? selectedIdx : 0;
      setTimeout(() => {
        templateOptionsRefs.current[targetIdx]?.focus();
      }, 0);
    }
  }, [isTemplateOpen, selectableTemplates, templateName]);

  return (
    <div className='space-y-1.5 relative'>
      <Label
        id={templateLabelId}
        className='block text-xs font-medium text-slate-200'
      >
        {t("pageTemplate")}
      </Label>

      <button
        ref={templateTriggerRef}
        id={templateTriggerId}
        type='button'
        disabled={isHomepage}
        aria-haspopup='listbox'
        aria-expanded={isTemplateOpen}
        aria-controls={templateListboxId}
        aria-labelledby={templateLabelId}
        onClick={() => !isHomepage && setIsTemplateOpen((prev) => !prev)}
        onKeyDown={(e) => {
          if (isHomepage) return;
          if (
            e.key === "ArrowDown" ||
            e.key === "ArrowUp" ||
            e.key === "Enter" ||
            e.key === " "
          ) {
            e.preventDefault();
            setIsTemplateOpen(true);
          } else if (e.key === "Escape") {
            setIsTemplateOpen(false);
          }
        }}
        className={`w-full flex items-center justify-between rounded-xl border px-3.5 py-2.5 text-xs text-white bg-slate-950/90 transition ${
          isHomepage
            ? "opacity-60 cursor-not-allowed border-slate-800"
            : isTemplateOpen
            ? "border-sky-500 ring-1 ring-sky-500/30"
            : "border-slate-800 hover:border-slate-700"
        }`}
      >
        <span className='flex items-center gap-2.5'>
          <SelectedTemplateIcon className='cms-icon-md text-slate-400' />
          <span>
            {getTemplateLabel(
              currentTemplateOption.id,
              currentTemplateOption.label
            )}
          </span>
        </span>
        {!isHomepage && (
          <ChevronDown
            className={cn(
              "cms-icon-md text-slate-400 transition-transform",
              isTemplateOpen && "rotate-180"
            )}
          />
        )}
      </button>

      {isTemplateOpen && !isHomepage && (
        <div
          id={templateListboxId}
          role='listbox'
          aria-labelledby={templateTriggerId}
          className='mt-1 w-full rounded-xl border border-slate-800 bg-slate-900/95 shadow-xl overflow-hidden divide-y divide-slate-800/60 z-30'
        >
          {selectableTemplates.map((opt, idx) => {
            const Icon = getTemplateIcon(opt.id);
            const isSelected =
              opt.id.toLowerCase() === templateName.toLowerCase();
            return (
              <button
                key={opt.id}
                ref={(el) => {
                  templateOptionsRefs.current[idx] = el;
                }}
                type='button'
                role='option'
                aria-selected={isSelected}
                tabIndex={isSelected ? 0 : -1}
                onClick={() => {
                  setTemplateName(opt.id);
                  setIsTemplateOpen(false);
                  templateTriggerRef.current?.focus();
                }}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    const nextIdx = (idx + 1) % selectableTemplates.length;
                    templateOptionsRefs.current[nextIdx]?.focus();
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    const prevIdx =
                      (idx - 1 + selectableTemplates.length) %
                      selectableTemplates.length;
                    templateOptionsRefs.current[prevIdx]?.focus();
                  } else if (e.key === "Home") {
                    e.preventDefault();
                    templateOptionsRefs.current[0]?.focus();
                  } else if (e.key === "End") {
                    e.preventDefault();
                    templateOptionsRefs.current[
                      selectableTemplates.length - 1
                    ]?.focus();
                  } else if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setTemplateName(opt.id);
                    setIsTemplateOpen(false);
                    templateTriggerRef.current?.focus();
                  } else if (e.key === "Escape") {
                    e.preventDefault();
                    setIsTemplateOpen(false);
                    templateTriggerRef.current?.focus();
                  } else if (e.key === "Tab") {
                    setIsTemplateOpen(false);
                  }
                }}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-left transition ${
                  isSelected
                    ? "bg-sky-500/15 text-sky-300 font-medium"
                    : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                }`}
              >
                <Icon className='cms-icon-md text-slate-400' />
                <div className='flex flex-col'>
                  <span className='font-medium'>
                    {getTemplateLabel(opt.id, opt.label)}
                  </span>
                  {opt.description && (
                    <span className='cms-text-meta'>{opt.description}</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Informative connection banner for Booking Objects */}
      {(templateName === "booking-unit" || linkedBookingObject) && (
        <div
          className={`mt-2 rounded-xl border p-3 text-xs transition ${
            linkedBookingObject
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
              : "border-amber-500/30 bg-amber-500/10 text-amber-300"
          }`}
        >
          <div className='flex items-start gap-2.5'>
            {linkedBookingObject ? (
              <Box className='cms-icon-md text-emerald-400 mt-0.5' />
            ) : (
              <AlertTriangle className='cms-icon-md text-amber-400 mt-0.5' />
            )}
            <div className='space-y-1'>
              <div className='flex items-center gap-2'>
                <span className='font-semibold text-white'>
                  {linkedBookingObject
                    ? t("connectedBookingObjectPrefix", {
                        name: linkedBookingObject.name,
                      })
                    : t("noBookingObjectConnected")}
                </span>
                {linkedBookingObject && (
                  <Badge
                    variant='outline'
                    className='bg-emerald-500/20 px-1.5 py-0.5 cms-text-code font-bold uppercase text-emerald-300 border-emerald-500/30'
                  >
                    {tCommon("active")}
                  </Badge>
                )}
              </div>
              <p className='cms-text-meta opacity-90'>
                {linkedBookingObject
                  ? `${formatBookingObjectType(linkedBookingObject.type)} · ${linkedBookingObject.size_sqm ? `${linkedBookingObject.size_sqm} m² · ` : ""}${linkedBookingObject.bed_count} ${t("beds")} · ${t("landlord")}: ${linkedBookingObject.landlord ? `${linkedBookingObject.landlord.first_name} ${linkedBookingObject.landlord.last_name}` : tCommon("none")}`
                  : t("bookingUnitHelp")}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

