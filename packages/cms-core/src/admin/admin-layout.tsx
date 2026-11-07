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
  Sparkles,
  Coins,
  Sliders,
  AlertTriangle,
} from "lucide-react";

import { AdminTab } from "../types/admin";
import { AdminLanguage, DEFAULT_ADMIN_LANGUAGE } from "../constants/languages";
import { CmsBrandLogo } from "../components/ui/cms-brand-logo";
import { FlagIcon } from "../components/ui/flag-icon";
import { Button } from "../components/ui/button";
import { IconButton } from "../components/ui/icon-button";
import { useTranslations } from "next-intl";
import { useAdminIntl } from "../i18n";

export type { AdminTab };

export interface AdminLayoutProps {
  currentTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  adminLanguage?: AdminLanguage;
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
  adminLanguage = DEFAULT_ADMIN_LANGUAGE,
  adminName = "Super Admin",
  onLogout,
  frontendUrl = "/",
  onHideAdmin,
  isOverlay = false,
  children,
}: AdminLayoutProps) {
  const { theme, toggleTheme, isThemeLocked } = useAdminTheme();
  const { locale, setLocale, isPending } = useAdminIntl();
  const tNav = useTranslations("navigation");
  const tCommon = useTranslations("common");

  const cmsNavItems: Array<{ id: AdminTab; label: string; icon: React.ReactNode }> = [
    { id: "dashboard", label: tNav("dashboard"), icon: <Gauge className='w-4 h-4' /> },
    { id: "sections", label: tNav("sections"), icon: <FolderTree className='w-4 h-4' /> },
    { id: "pages", label: tNav("pages"), icon: <FileText className='w-4 h-4' /> },
    { id: "navigation-menus", label: tNav("menus"), icon: <GitBranch className='w-4 h-4' /> },
    { id: "media", label: tNav("media"), icon: <ImageIcon className='w-4 h-4' /> },
    { id: "categories", label: tNav("categories"), icon: <Layers className='w-4 h-4' /> },
    { id: "administrators", label: tNav("administrators"), icon: <Users className='w-4 h-4' /> },
    { id: "settings", label: tNav("settings"), icon: <Settings className='w-4 h-4' /> },
  ];

  const bookingNavItems: Array<{ id: AdminTab; label: string; icon: React.ReactNode }> = [
    { id: "bookings-dashboard", label: tNav("bookingDashboard"), icon: <LayoutDashboard className='w-4 h-4' /> },
    { id: "bookings", label: tNav("bookings"), icon: <Calendar className='w-4 h-4' /> },
    { id: "objects", label: tNav("objects"), icon: <Box className='w-4 h-4' /> },
    { id: "prices-availability", label: tNav("pricesAvailability"), icon: <Coins className='w-4 h-4' /> },
    { id: "landlords", label: tNav("landlords"), icon: <UserCheck className='w-4 h-4' /> },
    { id: "optionals", label: tNav("optionals"), icon: <Sparkles className='w-4 h-4' /> },
    { id: "amenities", label: tNav("amenities"), icon: <Tag className='w-4 h-4' /> },
    { id: "mail-templates", label: tNav("mailTemplates"), icon: <Mail className='w-4 h-4' /> },
    { id: "booking-settings", label: tNav("bookingSettings"), icon: <Sliders className='w-4 h-4' /> },
    { id: "discrepancies", label: "Avvikelser", icon: <AlertTriangle className='w-4 h-4 text-amber-500' /> },
  ];

  const initials =
    adminName
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
      lang={locale === "sv" ? "sv-SE" : "en-US"}
      className={`${
        isOverlay ? "fixed inset-0 z-50" : "min-h-screen"
      } flex flex-col font-sans bg-slate-950 text-slate-100`}>
      {/* Top Header */}
      <header className='h-14 border-b border-slate-800/90 bg-slate-950/95 backdrop-blur sticky top-0 z-40 px-6 flex items-center justify-between shrink-0'>
        <div className='flex items-center gap-3'>
          <CmsBrandLogo variant='dark' heightClassName='h-7' />
          <span className='text-[10px] font-semibold uppercase tracking-wider bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded px-1.5 py-0.5'>
            ADMIN
          </span>
        </div>

        <div className='flex items-center gap-3'>
          <Button
            type='button'
            variant='adminOutline'
            size='xs'
            onClick={handleReturnToPage}
            aria-label={locale === "sv" ? "Dölj admin / Tillbaka till sidan" : "Hide Admin / Return to Page"}
          >
            <span>{locale === "sv" ? "Dölj admin / Tillbaka till sidan" : "Hide Admin / Return to Page"}</span>
            <ExternalLink className='w-3.5 h-3.5 text-slate-400' />
          </Button>

          {/* Admin Language Switcher */}
          <div role='group' aria-label={locale === "sv" ? "Välj språk" : "Choose language"} className='flex items-center gap-0.5 rounded-xl border border-slate-800 bg-slate-900/80 p-0.5 text-xs'>
            <button
              type='button'
              disabled={isPending}
              aria-pressed={locale === "en"}
              onClick={() => setLocale("en")}
              title='Switch to English'
              aria-label='English'
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${
                locale === "en" ? "bg-sky-600 text-white shadow-sm font-semibold" : "text-slate-400 hover:text-white"
              }`}>
              <FlagIcon code='en' size='xs' />
              <span>English</span>
            </button>
            <button
              type='button'
              disabled={isPending}
              aria-pressed={locale === "sv"}
              onClick={() => setLocale("sv")}
              title='Växla till svenska'
              aria-label='Svenska'
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${
                locale === "sv" ? "bg-sky-600 text-white shadow-sm font-semibold" : "text-slate-400 hover:text-white"
              }`}>
              <FlagIcon code='sv' size='xs' />
              <span>Svenska</span>
            </button>
          </div>

          <IconButton
            type='button'
            size='xs'
            variant='ghost'
            onClick={toggleTheme}
            disabled={isThemeLocked}
            className='text-amber-400/90 hover:text-amber-300 hover:bg-slate-900'
            aria-label={isThemeLocked ? "Dark Mode locked" : theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            tooltip={isThemeLocked ? "Dark Mode locked" : "Toggle theme"}
          >
            {theme === "dark" ? <Sun className='w-4 h-4' /> : <Moon className='w-4 h-4' />}
          </IconButton>

          <div className='h-5 w-px bg-slate-800' />

          <div className='flex items-center gap-2.5'>
            <div className='w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[11px] font-semibold text-slate-200'>
              {initials}
            </div>
            <span className='text-xs font-medium text-slate-200 hidden md:inline'>{adminName}</span>
          </div>

          {onLogout && (
            <IconButton
              type='button'
              size='xs'
              variant='adminGhostDestructive'
              onClick={onLogout}
              aria-label={tCommon("signOut")}
              tooltip={tCommon("signOut")}
            >
              <LogOut className='w-4 h-4' />
            </IconButton>
          )}
        </div>
      </header>

      {/* Main Container */}
      <div className='flex-1 flex overflow-hidden'>
        {/* Left Sidebar */}
        <aside aria-label='Admin navigation' className='w-60 border-r border-slate-800/90 bg-slate-950 flex flex-col p-4 space-y-6 overflow-y-auto shrink-0'>
          {/* CMS Category */}
          <div>
            <div className='text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2'>
              {tNav("cmsManagement")}
            </div>
            <nav aria-label={tNav("cmsManagement")} className='space-y-0.5'>
              {cmsNavItems.map((item) => {
                const isActive = currentTab === item.id || (item.id === "pages" && currentTab === "page-editor");
                return (
                  <button
                    key={item.id}
                    type='button'
                    aria-current={isActive ? "page" : undefined}
                    onClick={() => onTabChange(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-xl transition outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${
                      isActive
                        ? "bg-sky-500/10 text-sky-400 border border-sky-500/30 font-semibold shadow-sm"
                        : "text-slate-400 hover:bg-slate-900 hover:text-slate-200 border border-transparent"
                    }`}>
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Bookings Category */}
          <div>
            <div className='text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2'>
              {tNav("bookingManagement")}
            </div>
            <nav aria-label={tNav("bookingManagement")} className='space-y-0.5'>
              {bookingNavItems.map((item) => {
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    type='button'
                    aria-current={isActive ? "page" : undefined}
                    onClick={() => onTabChange(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-xl transition outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${
                      isActive
                        ? "bg-sky-500/10 text-sky-400 border border-sky-500/30 font-semibold shadow-sm"
                        : "text-slate-400 hover:bg-slate-900 hover:text-slate-200 border border-transparent"
                    }`}>
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className='mt-auto pt-4'>
            <div className='px-3 py-2.5 rounded-xl border border-slate-800/90 bg-slate-900/40 text-[11px] text-slate-500'>
              NextBooking Engine v0.1.0
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <main className='flex-1 overflow-y-auto p-8 bg-slate-950'>
          <motion.div
            key={currentTab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}>
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
