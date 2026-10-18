"use client";

import React from "react";
import { FileText, FolderTree, Image as ImageIcon, CheckCircle2, ArrowRight } from "lucide-react";
import { AdminTab } from "../admin-layout";

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
  const cards = [
    {
      label: "Totalt antal sidor",
      value: totalPages,
      subtext: `${publishedPages} publicerade`,
      icon: <FileText className="w-5 h-5 text-sky-400" />,
      tab: "pages" as AdminTab,
    },
    {
      label: "Sektioner",
      value: totalSections,
      subtext: "Strukturerade menygrupper",
      icon: <FolderTree className="w-5 h-5 text-indigo-400" />,
      tab: "sections" as AdminTab,
    },
    {
      label: "Mediefiler",
      value: totalMedia,
      subtext: "Bilder och filer",
      icon: <ImageIcon className="w-5 h-5 text-emerald-400" />,
      tab: "media" as AdminTab,
    },
    {
      label: "Systemstatus",
      value: "Aktiv",
      subtext: "PostgreSQL & Storage Adapter OK",
      icon: <CheckCircle2 className="w-5 h-5 text-green-400" />,
      tab: "dashboard" as AdminTab,
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Välkommen till NextBooking CMS
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Hantera sidor, mallfält, sektioner, media och flerspråkigt innehåll.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div
            key={c.label}
            onClick={() => onNavigate(c.tab)}
            className="group cursor-pointer rounded-2xl border border-slate-800 bg-slate-900/60 p-5 hover:border-slate-700 hover:bg-slate-900 transition shadow-sm"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-slate-400">{c.label}</span>
              <div className="p-2 rounded-xl bg-slate-800/80 group-hover:scale-105 transition">
                {c.icon}
              </div>
            </div>
            <div className="text-2xl font-bold text-white mb-1">{c.value}</div>
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>{c.subtext}</span>
              <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition text-sky-400" />
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
        <h2 className="text-base font-semibold text-white mb-2">Snabbstart</h2>
        <p className="text-xs text-slate-400 mb-4">
          Skapa nya sidor eller redigera befintligt innehåll direkt på webbplatsen via den flytande inline-redigeraren.
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => onNavigate("pages")}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-sky-600 text-white hover:bg-sky-500 shadow-md shadow-sky-600/20 transition"
          >
            Hantera sidor
          </button>
          <button
            type="button"
            onClick={() => onNavigate("media")}
            className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 transition"
          >
            Ladda upp media
          </button>
        </div>
      </div>
    </div>
  );
}
