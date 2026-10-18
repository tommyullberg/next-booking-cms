"use client";

import React from "react";
import { motion } from "framer-motion";
import { useAdminTheme } from "./theme-context";
import {
  LayoutDashboard,
  FileText,
  FolderTree,
  Image as ImageIcon,
  Calendar,
  Home,
  Mail,
  Sun,
  Moon,
  LogOut,
  ExternalLink,
  Layers,
} from "lucide-react";

export type AdminTab =
  | "dashboard"
  | "pages"
  | "page-editor"
  | "sections"
  | "media"
  | "bookings"
  | "objects"
  | "mail-templates";

export interface AdminLayoutProps {
  currentTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  adminName?: string;
  onLogout?: () => void;
  frontendUrl?: string;
  children: React.ReactNode;
}

export function AdminLayout({
  currentTab,
  onTabChange,
  adminName = "Administratör",
  onLogout,
  frontendUrl = "/",
  children,
}: AdminLayoutProps) {
  const { theme, toggleTheme } = useAdminTheme();

  const cmsNavItems: Array<{ id: AdminTab; label: string; icon: React.ReactNode }> = [
    { id: "dashboard", label: "Översikt", icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: "pages", label: "Sidor & Innehåll", icon: <FileText className="w-4 h-4" /> },
    { id: "sections", label: "Sektioner", icon: <FolderTree className="w-4 h-4" /> },
    { id: "media", label: "Mediebibliotek", icon: <ImageIcon className="w-4 h-4" /> },
  ];

  const bookingNavItems: Array<{ id: AdminTab; label: string; icon: React.ReactNode }> = [
    { id: "bookings", label: "Bokningar & Kalender", icon: <Calendar className="w-4 h-4" /> },
    { id: "objects", label: "Boendeobjekt", icon: <Home className="w-4 h-4" /> },
    { id: "mail-templates", label: "E-postmallar", icon: <Mail className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen flex flex-col font-sans">
      {/* Top Header */}
      <header className="h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-40 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-white font-bold shadow-lg shadow-sky-500/20">
            <Layers className="w-5 h-5" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-base font-bold tracking-tight text-white">
              NextBooking <span className="text-sky-400 font-normal">CMS</span>
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-wider bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded px-1.5 py-0.5">
              Admin
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={frontendUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg border border-slate-800 hover:border-slate-700 transition"
          >
            <span>Visa webbplats</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Växla tema"
          >
            {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          <div className="h-5 w-px bg-slate-800" />

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-semibold text-slate-200">
              {adminName.slice(0, 2).toUpperCase()}
            </div>
            <span className="text-xs font-medium text-slate-300 hidden md:inline">
              {adminName}
            </span>
          </div>

          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800/80 transition"
              title="Logga ut"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 border-r border-slate-800 bg-slate-900/50 flex flex-col p-4 space-y-6">
          {/* CMS Section */}
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2">
              CMS
            </div>
            <nav className="space-y-1">
              {cmsNavItems.map((item) => {
                const isActive =
                  currentTab === item.id ||
                  (item.id === "pages" && currentTab === "page-editor");
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onTabChange(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-xl transition ${
                      isActive
                        ? "bg-sky-500/10 text-sky-400 border border-sky-500/20 font-semibold shadow-sm"
                        : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Bookings Section */}
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2">
              Bokningsmotor
            </div>
            <nav className="space-y-1">
              {bookingNavItems.map((item) => {
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onTabChange(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-xl transition ${
                      isActive
                        ? "bg-sky-500/10 text-sky-400 border border-sky-500/20 font-semibold shadow-sm"
                        : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="mt-auto p-3 rounded-xl border border-slate-800 bg-slate-950/40 text-[11px] text-slate-500">
            NextBooking Engine v0.1.0
          </div>
        </aside>

        {/* Content area */}
        <main className="flex-1 overflow-y-auto p-8 bg-slate-950">
          <motion.div
            key={currentTab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
