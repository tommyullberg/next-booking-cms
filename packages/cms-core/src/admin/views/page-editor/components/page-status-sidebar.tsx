"use client";

import React, { useRef } from "react";
import { useTranslations } from "next-intl";
import {
  Box,
  Check,
  ExternalLink,
  Loader2,
  Save,
  UserCheck,
} from "lucide-react";
import { Badge, Button, Card } from "@cms/components/ui";
import {
  BookingObjectDetails,
  formatBookingObjectType,
} from "@cms/booking/types";
import { PageStatus } from "../types";

export interface PageStatusSidebarProps {
  pageId: number | string;
  status: PageStatus;
  setStatus: (st: PageStatus) => void;
  statusOptions: PageStatus[];
  getStatusLabel: (st: PageStatus) => string;
  currentTemplateLabel: string;
  templateName: string;
  linkedBookingObject: BookingObjectDetails | null;
  publicUrlPath: string;
  systemUrlPath: string;
  lastSavedText: string;
  createdDateFormatted: string;
  todayFormatted: string;
  isSaving: boolean;
  saveSuccess: boolean;
  isSlugValid: boolean;
  onSave: () => void;
}

export function PageStatusSidebar({
  pageId,
  status,
  setStatus,
  statusOptions,
  getStatusLabel,
  currentTemplateLabel,
  templateName,
  linkedBookingObject,
  publicUrlPath,
  systemUrlPath,
  lastSavedText,
  createdDateFormatted,
  todayFormatted,
  isSaving,
  saveSuccess,
  isSlugValid,
  onSave,
}: PageStatusSidebarProps) {
  const t = useTranslations("pageEditor");
  const tCommon = useTranslations("common");

  const statusLabelId = React.useId();
  const statusButtonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const handleStatusKeyDown = (
    e: React.KeyboardEvent,
    currentStatus: PageStatus
  ) => {
    const currentIndex = statusOptions.indexOf(currentStatus);
    let targetIndex = -1;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      targetIndex = (currentIndex + 1) % statusOptions.length;
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      targetIndex =
        (currentIndex - 1 + statusOptions.length) % statusOptions.length;
    } else if (e.key === "Home") {
      e.preventDefault();
      targetIndex = 0;
    } else if (e.key === "End") {
      e.preventDefault();
      targetIndex = statusOptions.length - 1;
    }
    if (targetIndex !== -1) {
      const next = statusOptions[targetIndex];
      setStatus(next);
      statusButtonRefs.current[targetIndex]?.focus();
    }
  };

  return (
    <div className='lg:col-span-1 space-y-3'>
      <h2 className='text-sm font-semibold text-slate-200'>
        {t("docStatusTitle")}
      </h2>

      <Card variant='admin' className='p-6 space-y-5'>
        {/* Status */}
        <div className='space-y-2'>
          <div id={statusLabelId} className='text-xs font-medium text-slate-400'>
            {tCommon("status")}
          </div>
          <div
            role='radiogroup'
            aria-labelledby={statusLabelId}
            className='grid grid-cols-3 gap-1.5 bg-slate-950/90 border border-slate-800 rounded-xl p-1'
          >
            {statusOptions.map((st, idx) => {
              const active = status === st;
              return (
                <button
                  key={st}
                  ref={(el) => {
                    statusButtonRefs.current[idx] = el;
                  }}
                  type='button'
                  role='radio'
                  aria-checked={active}
                  tabIndex={active ? 0 : -1}
                  onClick={() => setStatus(st)}
                  onKeyDown={(e) => handleStatusKeyDown(e, st)}
                  className={`py-1.5 px-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition ${
                    active
                      ? st === "PUBLISHED"
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : st === "NEW"
                        ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                        : "bg-red-500/20 text-red-400 border border-red-500/30"
                      : "text-slate-500 hover:text-slate-300 border border-transparent"
                  }`}
                >
                  {getStatusLabel(st)}
                </button>
              );
            })}
          </div>
          <p className='cms-text-meta text-slate-500'>
            {status === "PUBLISHED"
              ? t("visiblePublicly")
              : t("visibleAdminsOnly")}
          </p>
        </div>

        {/* Page ID & Page Template */}
        <div className='grid grid-cols-2 gap-4'>
          <div className='space-y-1'>
            <div className='text-xs font-medium text-slate-400'>
              {t("pageId")}
            </div>
            <div className='cms-text-code text-slate-200 font-medium'>
              {pageId}
            </div>
          </div>
          <div className='space-y-1'>
            <div className='text-xs font-medium text-slate-400'>
              {t("pageTemplate")}
            </div>
            <div className='text-xs text-slate-200 font-medium'>
              {currentTemplateLabel}
            </div>
          </div>
        </div>

        {/* Linked Booking Object */}
        <div className='space-y-1.5 pt-1 border-t border-slate-800/80'>
          <div className='text-xs font-medium text-slate-400 flex items-center gap-1.5'>
            <Box className='cms-icon-sm text-sky-400' />
            <span>{t("connectedBookingObject")}</span>
          </div>
          {linkedBookingObject ? (
            <div className='rounded-xl border border-slate-800 bg-slate-950/80 p-2.5 space-y-1 text-xs'>
              <div className='font-semibold text-white flex items-center justify-between'>
                <span>{linkedBookingObject.name}</span>
                <Badge
                  variant='outline'
                  className='text-[10px] text-emerald-400 font-medium bg-emerald-500/10 border-emerald-500/20 px-1.5 py-0.5'
                >
                  {tCommon("active")}
                </Badge>
              </div>
              <div className='cms-text-meta'>
                {formatBookingObjectType(linkedBookingObject.type)}
                {linkedBookingObject.size_sqm
                  ? ` · ${linkedBookingObject.size_sqm} m²`
                  : ""}
                {` · ${linkedBookingObject.bed_count} ${t("beds")}`}
              </div>
              {linkedBookingObject.landlord && (
                <div className='cms-text-meta flex items-center gap-1 pt-0.5'>
                  <UserCheck className='cms-icon-xs text-sky-400' />
                  <span>
                    {linkedBookingObject.landlord.first_name}{" "}
                    {linkedBookingObject.landlord.last_name}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className='rounded-xl border border-slate-800/80 bg-slate-950/40 p-2.5 cms-text-meta text-slate-500'>
              {templateName === "booking-unit" ? (
                <span className='text-amber-400/90 font-medium'>
                  {t("noObjectConnectedHelp")}
                </span>
              ) : (
                <span>{t("notConnectedOptional")}</span>
              )}
            </div>
          )}
        </div>

        {/* Public Link */}
        <div className='space-y-1'>
          <div className='text-xs font-medium text-slate-400'>
            {t("publicLink")}
          </div>
          <a
            href={publicUrlPath}
            target='_blank'
            rel='noreferrer'
            className='inline-flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300 underline underline-offset-4 break-all'
          >
            <ExternalLink className='cms-icon-sm' />
            <span>
              {typeof window !== "undefined"
                ? `${window.location.origin}${publicUrlPath}`
                : `http://localhost:3000${publicUrlPath}`}
            </span>
          </a>
        </div>

        {/* System Link */}
        <div className='space-y-1'>
          <div className='text-xs font-medium text-slate-400'>
            {t("systemLink")}
          </div>
          <a
            href={systemUrlPath}
            target='_blank'
            rel='noreferrer'
            className='inline-flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300 underline underline-offset-4 break-all'
          >
            <ExternalLink className='cms-icon-sm' />
            <span>
              {typeof window !== "undefined"
                ? `${window.location.origin}${systemUrlPath}`
                : `http://localhost:3000${systemUrlPath}`}
            </span>
          </a>
        </div>

        {/* Last Saved */}
        <div className='space-y-1'>
          <div className='text-xs font-medium text-slate-400'>
            {t("lastSaved")}
          </div>
          <div className='text-xs text-slate-300'>{lastSavedText}</div>
        </div>

        {/* Original Author */}
        <div className='space-y-1'>
          <div className='text-xs font-medium text-slate-400'>
            {t("originalAuthor")}
          </div>
          <div className='text-xs text-slate-300'>
            {t("originalAuthorBy", {
              author: "Super Admin (SU)",
              date: createdDateFormatted,
            })}
          </div>
        </div>

        {/* Revisions */}
        <div className='space-y-1'>
          <div className='text-xs font-medium text-slate-400'>
            {t("revisions")}
          </div>
          <div className='text-xs text-slate-300'>
            {t("revisionsCount", { count: 4 })}
          </div>
        </div>

        {/* Activity timestamps */}
        <div className='border-t border-slate-800/80 pt-4 space-y-1 cms-text-meta text-slate-500'>
          <div>
            {t("publishedOnBy", { date: createdDateFormatted, author: "SU" })}
          </div>
          <div>
            {t("metadataUpdatedOnBy", { date: todayFormatted, author: "SU" })}
          </div>
        </div>

        {/* Save Button */}
        <div className='pt-2'>
          <Button
            type='button'
            variant='adminPrimary'
            onClick={onSave}
            disabled={isSaving || !isSlugValid}
            className='w-full h-10 font-semibold text-xs'
          >
            {isSaving ? (
              <Loader2 className='cms-icon-md animate-spin' />
            ) : saveSuccess ? (
              <Check className='cms-icon-md text-emerald-300' />
            ) : (
              <Save className='cms-icon-md' />
            )}
            <span>{saveSuccess ? tCommon("saved") : t("saveChanges")}</span>
          </Button>
        </div>
      </Card>
    </div>
  );
}

