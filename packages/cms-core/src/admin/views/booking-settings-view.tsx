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
  ArrowRight,
} from "lucide-react";
import {
  BookingSettings,
  DEFAULT_BOOKING_SETTINGS,
  DefaultTurnoverDay,
} from "../../types/settings";

export interface BookingSettingsViewProps {
  bookingSettings?: BookingSettings;
  onSaveSettings: (newSettings: {
    bookingSettings: BookingSettings;
  }) => Promise<void>;
}

export function BookingSettingsView({
  bookingSettings = DEFAULT_BOOKING_SETTINGS,
  onSaveSettings,
}: BookingSettingsViewProps) {
  const t = useTranslations("bookingSettings");

  const [turnoverDay, setTurnoverDay] = useState<DefaultTurnoverDay>(
    bookingSettings?.defaultTurnoverDay || "SUNDAY"
  );
  const [checkInTime, setCheckInTime] = useState<string>(
    bookingSettings?.checkInTime || "15:00"
  );
  const [checkOutTime, setCheckOutTime] = useState<string>(
    bookingSettings?.checkOutTime || "11:00"
  );

  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (bookingSettings) {
      if (bookingSettings.defaultTurnoverDay) {
        setTurnoverDay(bookingSettings.defaultTurnoverDay);
      }
      if (bookingSettings.checkInTime) {
        setCheckInTime(bookingSettings.checkInTime);
      }
      if (bookingSettings.checkOutTime) {
        setCheckOutTime(bookingSettings.checkOutTime);
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
          checkInTime: checkInTime || "15:00",
          checkOutTime: checkOutTime || "11:00",
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
        <div className="flex items-center gap-2 text-white">
          <Calendar className="w-4 h-4 text-sky-400" />
          <h2 className="text-sm font-semibold text-white">
            {t("turnoverDaySectionTitle")}
          </h2>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          {t("turnoverDaySectionDesc")}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
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
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 space-y-5 shadow-sm">
        <div className="flex items-center gap-2 text-white">
          <Clock className="w-4 h-4 text-emerald-400" />
          <h2 className="text-sm font-semibold text-white">
            {t("checkTimesSectionTitle")}
          </h2>
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

      {/* Live Preview Card */}
      <div className="rounded-xl border border-sky-500/20 bg-sky-950/20 p-4 flex items-start gap-3">
        <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <div className="font-semibold text-sky-200">
            Förhandsgranskning av kalendertext:
          </div>
          <div className="text-slate-300 italic">
            &ldquo;Incheckning sker kl {checkInTime || "15:00"} och utcheckning kl{" "}
            {checkOutTime || "11:00"}. Bytesdagar visas som delade dagar där båda
            sällskapen kan anlända och avresa samma dag. Perioder utanför aktiv
            prissäsong samt spärrade datum visas som Ej uthyrning och går ej att
            boka.&rdquo;
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
