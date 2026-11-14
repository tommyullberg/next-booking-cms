"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { ArrowLeft } from "lucide-react";
import { Badge, Button } from "@cms/components/ui";
import { PageStatus } from "../types";

export interface PageEditorHeaderProps {
  primaryTitle: string;
  savedStatus: PageStatus;
  statusLabel: string;
  onBack: () => void;
}

export function PageEditorHeader({
  primaryTitle,
  savedStatus,
  statusLabel,
  onBack,
}: PageEditorHeaderProps) {
  const t = useTranslations("pageEditor");
  const tCommon = useTranslations("common");

  return (
    <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
      <h1 className='text-2xl font-bold tracking-tight text-white'>
        {t("editPageTitle", { title: primaryTitle || "Untitled" })}
      </h1>

      <div className='flex items-center gap-2.5'>
        <Button
          type='button'
          variant='outline'
          size='sm'
          onClick={onBack}
          className='h-8 text-xs font-medium gap-1.5'
        >
          <ArrowLeft className='cms-icon-sm' />
          <span>{tCommon("back")}</span>
        </Button>

        <Badge
          title='Current saved status'
          className={`uppercase tracking-wider select-none cms-text-caption font-semibold px-2.5 py-1 ${
            savedStatus === "PUBLISHED"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
              : savedStatus === "NEW"
              ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
              : "border-red-500/30 bg-red-500/10 text-red-400"
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full mr-1.5 ${
              savedStatus === "PUBLISHED"
                ? "bg-emerald-400"
                : savedStatus === "NEW"
                ? "bg-amber-400"
                : "bg-red-400"
            }`}
          />
          <span>{statusLabel}</span>
        </Badge>
      </div>
    </div>
  );
}

