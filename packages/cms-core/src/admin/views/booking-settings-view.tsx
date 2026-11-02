"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  Sliders,
  Calendar,
  Clock,
  CheckCircle2,
  Save,
  Loader2,
  Info,
  Sparkles,
  Layers,
  Globe,
  SlidersHorizontal,
  CalendarDays,
  ShieldCheck,
  Search,
} from "lucide-react";
import {
  BookingSettings,
  DEFAULT_BOOKING_SETTINGS,
  DefaultTurnoverDay,
  BookingSettingScope,
  AllowedBookingPeriods,
} from "../../types/settings";

export interface BookingSettingsViewProps {
  bookingSettings?: BookingSettings;
  pages?: Array<{ id: string | number; page_title?: string; title?: string; slug?: string }>;
  onSaveSettings: (newSettings: {
    bookingSettings: BookingSettings;
  }) => Promise<void>;
}

export function BookingSettingsView({
  bookingSettings = DEFAULT_BOOKING_SETTINGS,
  pages = [],
  onSaveSettings,
}: BookingSettingsViewProps) {
  const t = useTranslations("bookingSettings");

  const [turnoverDay, setTurnoverDay] = useState<DefaultTurnoverDay>(
    bookingSettings?.defaultTurnoverDay || "SUNDAY"
  );
  const [turnoverDayScope, setTurnoverDayScope] = useState<BookingSettingScope>(
    bookingSettings?.turnoverDayScope || "GLOBAL"
  );

  const [checkInTime, setCheckInTime] = useState<string>(
    bookingSettings?.checkInTime || "15:00"
  );
  const [checkOutTime, setCheckOutTime] = useState<string>(
    bookingSettings?.checkOutTime || "11:00"
  );
  const [checkTimesScope, setCheckTimesScope] = useState<BookingSettingScope>(
    bookingSettings?.checkTimesScope || "GLOBAL"
  );

  const [allowedBookingPeriods, setAllowedBookingPeriods] =
    useState<AllowedBookingPeriods>(
      bookingSettings?.allowedBookingPeriods ||
        (bookingSettings?.allowCustomDays === false
          ? "PERIODS_AND_WEEKS"
          : "ALL")
    );
  const [customDaysScope, setCustomDaysScope] = useState<BookingSettingScope>(
    bookingSettings?.customDaysScope || "GLOBAL"
  );

  const [bookingSearchPageSlug, setBookingSearchPageSlug] = useState<string>(
    bookingSettings?.bookingSearchPageSlug || ""
  );

  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (bookingSettings) {
      if (bookingSettings.defaultTurnoverDay) {
        setTurnoverDay(bookingSettings.defaultTurnoverDay);
      }
      if (bookingSettings.turnoverDayScope) {
        setTurnoverDayScope(bookingSettings.turnoverDayScope);
      }
      if (bookingSettings.checkInTime) {
        setCheckInTime(bookingSettings.checkInTime);
      }
      if (bookingSettings.checkOutTime) {
        setCheckOutTime(bookingSettings.checkOutTime);
      }
      if (bookingSettings.checkTimesScope) {
        setCheckTimesScope(bookingSettings.checkTimesScope);
      }
      if (bookingSettings.allowedBookingPeriods) {
        setAllowedBookingPeriods(bookingSettings.allowedBookingPeriods);
      } else if (bookingSettings.allowCustomDays !== undefined) {
        setAllowedBookingPeriods(
          bookingSettings.allowCustomDays ? "ALL" : "PERIODS_AND_WEEKS"
        );
      }
      if (bookingSettings.customDaysScope) {
        setCustomDaysScope(bookingSettings.customDaysScope);
      }
      if (bookingSettings.bookingSearchPageSlug !== undefined) {
        setBookingSearchPageSlug(bookingSettings.bookingSearchPageSlug);
      }
    }
  }, [bookingSettings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSavedSuccess(false);
    setErrorMsg(null);

    try {
      await onSaveSettings({
        bookingSettings: {
          defaultTurnoverDay: turnoverDay,
          turnoverDayScope,
          checkInTime: checkInTime || "15:00",
          checkOutTime: checkOutTime || "11:00",
          checkTimesScope,
          allowedBookingPeriods,
          allowCustomDays: allowedBookingPeriods === "ALL",
          customDaysScope,
          bookingSearchPageSlug: bookingSearchPageSlug.trim(),
        },
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3500);
    } catch (err: any) {
      setErrorMsg(err?.message || t("saveError"));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-4xl pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-sky-500/20 to-blue-600/10 border border-sky-500/30 text-sky-400">
            <Sliders className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              {t("title")}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">{t("subtitle")}</p>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-xs font-semibold shadow-lg shadow-sky-600/20 transition cursor-pointer"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{t("saving")}</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>{t("saveBtn")}</span>
            </>
          )}
        </button>
      </div>

      {/* Success / Error notification banner */}
      {savedSuccess && (
        <div className="flex items-center gap-2 p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span className="font-medium">{t("saveSuccess")}</span>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-2 p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
          <Info className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Section 1: Default turnover day */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2 text-white">
            <Calendar className="w-4 h-4 text-sky-400" />
            <h2 className="text-sm font-semibold text-white">
              {t("turnoverDaySectionTitle")}
            </h2>
          </div>

          {/* Scope selector */}
          <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-lg border border-slate-800">
            <button
              type="button"
              onClick={() => setTurnoverDayScope("GLOBAL")}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition cursor-pointer flex items-center gap-1 ${
                turnoverDayScope === "GLOBAL"
                  ? "bg-sky-500 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Globe className="w-3 h-3" />
              <span>{t("scopeGlobal")}</span>
            </button>
            <button
              type="button"
              onClick={() => setTurnoverDayScope("PER_OBJECT")}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition cursor-pointer flex items-center gap-1 ${
                turnoverDayScope === "PER_OBJECT"
                  ? "bg-amber-500 text-slate-950 font-semibold shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Layers className="w-3 h-3" />
              <span>{t("scopePerObject")}</span>
            </button>
          </div>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          {t("turnoverDaySectionDesc")}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          {/* Sunday card */}
          <div
            onClick={() => setTurnoverDay("SUNDAY")}
            className={`cursor-pointer p-4 rounded-xl border transition relative flex flex-col justify-between ${
              turnoverDay === "SUNDAY"
                ? "border-sky-500/80 bg-sky-500/10 shadow-md shadow-sky-500/5 ring-1 ring-sky-500/30"
                : "border-slate-800 bg-slate-950/40 hover:border-slate-700 hover:bg-slate-900/50"
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white">
                    {t("sundayTitle")}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-semibold">
                    <Sparkles className="w-2.5 h-2.5" />
                    {t("sundayBadge")}
                  </span>
                </div>
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    turnoverDay === "SUNDAY"
                      ? "border-sky-400 bg-sky-500"
                      : "border-slate-600 bg-transparent"
                  }`}
                >
                  {turnoverDay === "SUNDAY" && (
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  )}
                </div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {t("sundayDesc")}
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center gap-2 text-[11px] text-slate-500 font-mono">
              <span>Söndag → Söndag</span>
              <span className="text-slate-600">•</span>
              <span>Delvecka: Tors–Sön / Sön–Tors</span>
            </div>
          </div>

          {/* Saturday card */}
          <div
            onClick={() => setTurnoverDay("SATURDAY")}
            className={`cursor-pointer p-4 rounded-xl border transition relative flex flex-col justify-between ${
              turnoverDay === "SATURDAY"
                ? "border-sky-500/80 bg-sky-500/10 shadow-md shadow-sky-500/5 ring-1 ring-sky-500/30"
                : "border-slate-800 bg-slate-950/40 hover:border-slate-700 hover:bg-slate-900/50"
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white">
                    {t("saturdayTitle")}
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-semibold">
                    {t("saturdayBadge")}
                  </span>
                </div>
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    turnoverDay === "SATURDAY"
                      ? "border-sky-400 bg-sky-500"
                      : "border-slate-600 bg-transparent"
                  }`}
                >
                  {turnoverDay === "SATURDAY" && (
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  )}
                </div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {t("saturdayDesc")}
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center gap-2 text-[11px] text-slate-500 font-mono">
              <span>Lördag → Lördag</span>
              <span className="text-slate-600">•</span>
              <span>Traditionell högsommarmodell</span>
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Check-in and Check-out Times */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2 text-white">
            <Clock className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-semibold text-white">
              {t("checkTimesSectionTitle")}
            </h2>
          </div>

          {/* Scope selector */}
          <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-lg border border-slate-800">
            <button
              type="button"
              onClick={() => setCheckTimesScope("GLOBAL")}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition cursor-pointer flex items-center gap-1 ${
                checkTimesScope === "GLOBAL"
                  ? "bg-sky-500 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Globe className="w-3 h-3" />
              <span>{t("scopeGlobal")}</span>
            </button>
            <button
              type="button"
              onClick={() => setCheckTimesScope("PER_OBJECT")}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition cursor-pointer flex items-center gap-1 ${
                checkTimesScope === "PER_OBJECT"
                  ? "bg-amber-500 text-slate-950 font-semibold shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Layers className="w-3 h-3" />
              <span>{t("scopePerObject")}</span>
            </button>
          </div>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          {t("checkTimesSectionDesc")}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-1">
          {/* Check-in time */}
          <div className="p-4 rounded-xl border border-slate-800/80 bg-slate-950/40 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                {t("checkInTimeLabel")}
              </label>
              <span className="text-[10px] font-mono text-slate-500">
                Default: 15:00
              </span>
            </div>
            <input
              type="time"
              value={checkInTime}
              onChange={(e) => setCheckInTime(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm font-mono focus:outline-none focus:border-sky-500 transition"
              required
            />
            <p className="text-[11px] text-slate-400 leading-normal">
              {t("checkInTimeHelp")}
            </p>
            <div className="flex items-center gap-1.5 pt-1">
              <span className="text-[10px] text-slate-500">Snabbval:</span>
              {["14:00", "15:00", "16:00"].map((tPreset) => (
                <button
                  key={tPreset}
                  type="button"
                  onClick={() => setCheckInTime(tPreset)}
                  className={`text-[10px] font-mono px-2 py-0.5 rounded border transition cursor-pointer ${
                    checkInTime === tPreset
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                      : "bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200"
                  }`}
                >
                  {tPreset}
                </button>
              ))}
            </div>
          </div>

          {/* Check-out time */}
          <div className="p-4 rounded-xl border border-slate-800/80 bg-slate-950/40 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-400" />
                {t("checkOutTimeLabel")}
              </label>
              <span className="text-[10px] font-mono text-slate-500">
                Default: 11:00
              </span>
            </div>
            <input
              type="time"
              value={checkOutTime}
              onChange={(e) => setCheckOutTime(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm font-mono focus:outline-none focus:border-sky-500 transition"
              required
            />
            <p className="text-[11px] text-slate-400 leading-normal">
              {t("checkOutTimeHelp")}
            </p>
            <div className="flex items-center gap-1.5 pt-1">
              <span className="text-[10px] text-slate-500">Snabbval:</span>
              {["10:00", "11:00", "12:00"].map((tPreset) => (
                <button
                  key={tPreset}
                  type="button"
                  onClick={() => setCheckOutTime(tPreset)}
                  className={`text-[10px] font-mono px-2 py-0.5 rounded border transition cursor-pointer ${
                    checkOutTime === tPreset
                      ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                      : "bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200"
                  }`}
                >
                  {tPreset}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Allowed booking periods */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2 text-white">
            <CalendarDays className="w-4 h-4 text-purple-400" />
            <h2 className="text-sm font-semibold text-white">
              {t("customDaysSectionTitle")}
            </h2>
          </div>

          {/* Scope selector */}
          <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-lg border border-slate-800">
            <button
              type="button"
              onClick={() => setCustomDaysScope("GLOBAL")}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition cursor-pointer flex items-center gap-1 ${
                customDaysScope === "GLOBAL"
                  ? "bg-sky-500 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Globe className="w-3 h-3" />
              <span>{t("scopeGlobal")}</span>
            </button>
            <button
              type="button"
              onClick={() => setCustomDaysScope("PER_OBJECT")}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition cursor-pointer flex items-center gap-1 ${
                customDaysScope === "PER_OBJECT"
                  ? "bg-amber-500 text-slate-950 font-semibold shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Layers className="w-3 h-3" />
              <span>{t("scopePerObject")}</span>
            </button>
          </div>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          {t("customDaysSectionDesc")}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          {/* 1. Allow custom number of days */}
          <div
            onClick={() => setAllowedBookingPeriods("ALL")}
            className={`cursor-pointer p-4 rounded-xl border transition relative flex flex-col justify-between ${
              allowedBookingPeriods === "ALL"
                ? "border-sky-500/80 bg-sky-500/10 shadow-md shadow-sky-500/5 ring-1 ring-sky-500/30"
                : "border-slate-800 bg-slate-950/40 hover:border-slate-700 hover:bg-slate-900/50"
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-white">
                  {t("customDaysAllowedTitle")}
                </span>
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    allowedBookingPeriods === "ALL"
                      ? "border-sky-400 bg-sky-500"
                      : "border-slate-600 bg-transparent"
                  }`}
                >
                  {allowedBookingPeriods === "ALL" && (
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  )}
                </div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {t("customDaysAllowedDesc")}
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center gap-2 text-[11px] text-emerald-400 font-mono">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>Valfria nätter (1–6 dygn samt helveckor)</span>
            </div>
          </div>

          {/* 2. Strict 3/4-day periods or full weeks */}
          <div
            onClick={() => setAllowedBookingPeriods("PERIODS_AND_WEEKS")}
            className={`cursor-pointer p-4 rounded-xl border transition relative flex flex-col justify-between ${
              allowedBookingPeriods === "PERIODS_AND_WEEKS"
                ? "border-sky-500/80 bg-sky-500/10 shadow-md shadow-sky-500/5 ring-1 ring-sky-500/30"
                : "border-slate-800 bg-slate-950/40 hover:border-slate-700 hover:bg-slate-900/50"
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-white">
                  {t("customDaysStrictTitle")}
                </span>
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    allowedBookingPeriods === "PERIODS_AND_WEEKS"
                      ? "border-sky-400 bg-sky-500"
                      : "border-slate-600 bg-transparent"
                  }`}
                >
                  {allowedBookingPeriods === "PERIODS_AND_WEEKS" && (
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  )}
                </div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {t("customDaysStrictDesc")}
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center gap-2 text-[11px] text-amber-300 font-mono">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span>Fasta delveckor (3/4d) eller helvecka</span>
            </div>
          </div>

          {/* 3. Full weeks only from turnover day */}
          <div
            onClick={() => setAllowedBookingPeriods("FULL_WEEKS_ONLY")}
            className={`cursor-pointer p-4 rounded-xl border transition relative flex flex-col justify-between ${
              allowedBookingPeriods === "FULL_WEEKS_ONLY"
                ? "border-sky-500/80 bg-sky-500/10 shadow-md shadow-sky-500/5 ring-1 ring-sky-500/30"
                : "border-slate-800 bg-slate-950/40 hover:border-slate-700 hover:bg-slate-900/50"
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-white">
                  {t("customDaysFullWeeksTitle")}
                </span>
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    allowedBookingPeriods === "FULL_WEEKS_ONLY"
                      ? "border-sky-400 bg-sky-500"
                      : "border-slate-600 bg-transparent"
                  }`}
                >
                  {allowedBookingPeriods === "FULL_WEEKS_ONLY" && (
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  )}
                </div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {t("customDaysFullWeeksDesc")}
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center gap-2 text-[11px] text-purple-300 font-mono">
              <Calendar className="w-3.5 h-3.5 shrink-0" />
              <span>Enbart hela veckor (7, 14, 21 nätter...)</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Booking Search Page Selection */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Search className="w-4 h-4 text-sky-400" />
            {t("searchPageSectionTitle")}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {t("searchPageSectionDesc")}
          </p>
        </div>

        <div className="max-w-md space-y-1.5">
          <label className="text-xs font-semibold text-slate-200">
            {t("searchPageSelectLabel")}
          </label>
          <select
            value={bookingSearchPageSlug}
            onChange={(e) => setBookingSearchPageSlug(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none transition"
          >
            <option value="">{t("searchPageNone")}</option>
            {pages.map((p) => {
              const displayTitle = p.page_title || p.title || p.slug || `Page #${p.id}`;
              const slugPath = p.slug ? (p.slug.startsWith("/") ? p.slug : `/${p.slug}`) : "/";
              return (
                <option key={p.id} value={p.slug || ""}>
                  {displayTitle} ({slugPath})
                </option>
              );
            })}
          </select>
          <p className="text-[11px] text-slate-500">
            {bookingSearchPageSlug
              ? `Aktiv länk: ${bookingSearchPageSlug.startsWith("/") ? bookingSearchPageSlug : `/${bookingSearchPageSlug}`}`
              : "Ingen sida vald – sökknapp och länk döljs i kalendern"}
          </p>
        </div>
      </div>

      {/* Live Preview Card */}
      <div className="rounded-xl border border-sky-500/20 bg-sky-950/20 p-4 flex items-start gap-3">
        <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <div className="font-semibold text-sky-200">
            Sammanfattning av gällande regler:
          </div>
          <div className="text-slate-300">
            Bytesdag: <span className="text-white font-medium">{turnoverDay === "SUNDAY" ? "Söndag" : "Lördag"}</span> ({turnoverDayScope === "GLOBAL" ? "Låst globalt" : "Kan anpassas per objekt"})
            {" • "}
            Tider: <span className="text-white font-medium">In {checkInTime || "15:00"} / Ut {checkOutTime || "11:00"}</span> ({checkTimesScope === "GLOBAL" ? "Låst globalt" : "Kan anpassas per objekt"})
            {" • "}
            Bokningsperioder: <span className="text-white font-medium">
              {allowedBookingPeriods === "ALL"
                ? "Valfritt antal dygn (1-6 dgr)"
                : allowedBookingPeriods === "PERIODS_AND_WEEKS"
                ? "Endast 3/4-dagars eller helveckor"
                : "Endast hela veckor (från bytesdag)"}
            </span> ({customDaysScope === "GLOBAL" ? "Låst globalt" : "Kan anpassas per objekt"})
            {" • "}
            Söksida: <span className="text-white font-medium">
              {bookingSearchPageSlug
                ? (bookingSearchPageSlug.startsWith("/") ? bookingSearchPageSlug : `/${bookingSearchPageSlug}`)
                : "Dold länk"}
            </span>
          </div>
        </div>
      </div>

      {/* Footer Save Button */}
      <div className="flex items-center justify-end gap-3 pt-3">
        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-xs font-semibold shadow-lg shadow-sky-600/20 transition cursor-pointer"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{t("saving")}</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>{t("saveBtn")}</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
