"use client";

import React from "react";
import { motion } from "framer-motion";
import { useAdminTheme } from "./theme-context";
import {
  LayoutDashboard,
  FileText,
  FolderTree,
  GitBranch,
  Image as ImageIcon,
  Layers,
  Users,
  Settings,
  Calendar,
  Box,
  Tag,
  Mail,
  Sun,
  Moon,
  LogOut,
  ExternalLink,
  Gauge,
  UserCheck,
} from "lucide-react";

export type AdminTab =
  | "dashboard"
  | "sections"
  | "pages"
  | "page-editor"
  | "navigation-menus"
  | "media"
  | "categories"
  | "administrators"
  | "settings"
  | "bookings-dashboard"
  | "bookings"
  | "objects"
  | "landlords"
  | "amenities"
  | "mail-templates";

export interface AdminLayoutProps {
  currentTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  adminName?: string;
  onLogout?: () => void;
  frontendUrl?: string;
  onHideAdmin?: () => void;
  isOverlay?: boolean;
  children: React.ReactNode;
}

export function AdminLayout({
  currentTab,
  onTabChange,
  adminName = "Super Admin",
  onLogout,
  frontendUrl = "/",
  onHideAdmin,
  isOverlay = false,
  children,
}: AdminLayoutProps) {
  const { theme, toggleTheme, isThemeLocked } = useAdminTheme();

  const cmsNavItems: Array<{ id: AdminTab; label: string; icon: React.ReactNode }> = [
    { id: "dashboard", label: "Dashboard", icon: <Gauge className="w-4 h-4" /> },
    { id: "sections", label: "Sections", icon: <FolderTree className="w-4 h-4" /> },
    { id: "pages", label: "Pages", icon: <FileText className="w-4 h-4" /> },
    { id: "navigation-menus", label: "Navigation Menus", icon: <GitBranch className="w-4 h-4" /> },
    { id: "media", label: "Media & Files", icon: <ImageIcon className="w-4 h-4" /> },
    { id: "categories", label: "Categories & Types", icon: <Layers className="w-4 h-4" /> },
    { id: "administrators", label: "Administrators", icon: <Users className="w-4 h-4" /> },
    { id: "settings", label: "Settings", icon: <Settings className="w-4 h-4" /> },
  ];

  const bookingNavItems: Array<{ id: AdminTab; label: string; icon: React.ReactNode }> = [
    { id: "bookings-dashboard", label: "Dashboard & Overview", icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: "bookings", label: "Bookings Calendar", icon: <Calendar className="w-4 h-4" /> },
    { id: "objects", label: "Booking Objects", icon: <Box className="w-4 h-4" /> },
    { id: "landlords", label: "Landlords", icon: <UserCheck className="w-4 h-4" /> },
    { id: "amenities", label: "Amenities", icon: <Tag className="w-4 h-4" /> },
    { id: "mail-templates", label: "Mail Templates", icon: <Mail className="w-4 h-4" /> },
  ];

  const initials = adminName
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "SU";

  const handleReturnToPage = () => {
    if (onHideAdmin) {
      onHideAdmin();
      return;
    }
    if (typeof window !== "undefined") {
      window.location.href = frontendUrl;
    }
  };

  return (
    <div
      className={`${
        isOverlay ? "fixed inset-0 z-50" : "min-h-screen"
      } flex flex-col font-sans bg-slate-950 text-slate-100`}
    >
      {/* Top Header */}
      <header className="h-14 border-b border-slate-800/90 bg-slate-950/95 backdrop-blur sticky top-0 z-40 px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-white font-bold shadow-lg shadow-sky-500/20">
            <Layers className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold tracking-tight text-white">
              NextBooking <span className="text-sky-400 font-normal">CMS</span>
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-wider bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded px-1.5 py-0.5">
              ADMIN
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleReturnToPage}
            className="flex items-center gap-2 text-xs font-medium text-slate-200 hover:text-white px-3.5 py-1.5 rounded-lg border border-slate-800 bg-slate-900/70 hover:bg-slate-800/80 hover:border-slate-700 transition"
          >
            <span>Hide Admin / Return to Page</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </button>

          <button
            type="button"
            onClick={toggleTheme}
            disabled={isThemeLocked}
            className="p-2 rounded-lg text-amber-400/90 hover:text-amber-300 hover:bg-slate-900 transition disabled:opacity-80 disabled:cursor-default"
            title={isThemeLocked ? "Dark Mode locked" : "Toggle theme"}
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <div className="h-5 w-px bg-slate-800" />

          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[11px] font-semibold text-slate-200">
              {initials}
            </div>
            <span className="text-xs font-medium text-slate-200 hidden md:inline">
              {adminName}
            </span>
          </div>

          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800/80 transition"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <aside className="w-60 border-r border-slate-800/90 bg-slate-950 flex flex-col p-4 space-y-6 overflow-y-auto shrink-0">
          {/* CMS Category */}
          <div>
            <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2">
              CMS
            </div>
            <nav className="space-y-0.5">
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
                        ? "bg-sky-500/10 text-sky-400 border border-sky-500/30 font-semibold shadow-sm"
                        : "text-slate-400 hover:bg-slate-900 hover:text-slate-200 border border-transparent"
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Bookings Category */}
          <div>
            <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2">
              BOOKINGS
            </div>
            <nav className="space-y-0.5">
              {bookingNavItems.map((item) => {
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onTabChange(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-xl transition ${
                      isActive
                        ? "bg-sky-500/10 text-sky-400 border border-sky-500/30 font-semibold shadow-sm"
                        : "text-slate-400 hover:bg-slate-900 hover:text-slate-200 border border-transparent"
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="mt-auto pt-4">
            <div className="px-3 py-2.5 rounded-xl border border-slate-800/90 bg-slate-900/40 text-[11px] text-slate-500">
              NextBooking Engine v0.1.0
            </div>
          </div>
        </aside>

        {/* Content Area */}
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
