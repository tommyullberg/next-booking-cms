"use client";

import React from "react";
import { FileText, FolderTree, Image as ImageIcon, CheckCircle2, ArrowRight } from "lucide-react";
import { AdminTab } from "../admin-layout";
import { useTranslations } from "next-intl";
import { Button, Card } from "@cms/components/ui";

export interface DashboardViewProps {
  totalPages: number;
  publishedPages: number;
  totalSections: number;
  totalMedia: number;
  onNavigate: (tab: AdminTab) => void;
}

export function DashboardView({
  totalPages,
  publishedPages,
  totalSections,
  totalMedia,
  onNavigate,
}: DashboardViewProps) {
  const t = useTranslations("dashboard");
  const tCommon = useTranslations("common");

  const cards = [
    {
      label: t("totalPages"),
      value: totalPages,
      subtext: `${publishedPages} ${tCommon("active")}`,
      icon: <FileText className="w-5 h-5 text-sky-400" />,
      tab: "pages" as AdminTab,
    },
    {
      label: t("totalSections"),
      value: totalSections,
      subtext: t("subtitle"),
      icon: <FolderTree className="w-5 h-5 text-indigo-400" />,
      tab: "sections" as AdminTab,
    },
    {
      label: t("totalMedia"),
      value: totalMedia,
      subtext: t("viewMedia"),
      icon: <ImageIcon className="w-5 h-5 text-emerald-400" />,
      tab: "media" as AdminTab,
    },
    {
      label: tCommon("status"),
      value: tCommon("active"),
      subtext: "PostgreSQL & Storage OK",
      icon: <CheckCircle2 className="w-5 h-5 text-green-400" />,
      tab: "dashboard" as AdminTab,
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          {t("title")}
        </h1>
        <p className="mt-1 text-xs text-slate-400">
          {t("subtitle")}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <Card
            key={c.label}
            variant="adminInteractive"
            className="group relative p-5 transition shadow-sm text-left"
          >
            <button
              type="button"
              onClick={() => onNavigate(c.tab)}
              aria-label={`${c.label}: ${c.value}. ${c.subtext}`}
              className="absolute inset-0 w-full h-full rounded-admin-card outline-none focus-visible:ring-2 focus-visible:ring-admin-accent"
            />
            <div className="flex items-center justify-between mb-3 pointer-events-none">
              <span className="text-xs font-medium text-slate-400">{c.label}</span>
              <div className="p-2 rounded-xl bg-slate-800/80 group-hover:scale-105 transition">
                {c.icon}
              </div>
            </div>
            <div className="text-2xl font-bold text-white mb-1 pointer-events-none">{c.value}</div>
            <div className="flex items-center justify-between text-xs text-slate-500 pointer-events-none">
              <span className="line-clamp-1">{c.subtext}</span>
              <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition text-sky-400" />
            </div>
          </Card>
        ))}
      </div>

      <Card variant="admin" className="p-6">
        <h2 className="text-sm font-semibold text-white mb-1.5">{t("quickActions")}</h2>
        <p className="text-xs text-slate-400 mb-4">
          {t("subtitle")}
        </p>
        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            variant="adminPrimary"
            size="sm"
            onClick={() => onNavigate("pages")}
          >
            {t("createNewPage")}
          </Button>
          <Button
            type="button"
            variant="adminSecondary"
            size="sm"
            onClick={() => onNavigate("bookings-dashboard")}
          >
            {t("manageBookings")}
          </Button>
          <Button
            type="button"
            variant="adminSecondary"
            size="sm"
            onClick={() => onNavigate("media")}
          >
            {t("viewMedia")}
          </Button>
          <Button
            type="button"
            variant="adminSecondary"
            size="sm"
            onClick={() => onNavigate("settings")}
          >
            {t("configureSettings")}
          </Button>
        </div>
      </Card>
    </div>
  );
}
