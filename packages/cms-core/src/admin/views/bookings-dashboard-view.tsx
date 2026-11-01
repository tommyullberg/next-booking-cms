"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import {
  Calendar,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ExternalLink,
  Box,
  Layers,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Info,
  Coins,
  Sparkles,
  Users,
  Bed,
  ArrowRight,
  LayoutDashboard,
  Check,
  Building,
  Plus,
  Tag,
} from "lucide-react";
import { SyncSummaryResult, SyncObjectResult, SyncBookingItem } from "../../ical/types";
import { AdminTab } from "../../types/admin";
import { BookingObjectItem } from "./booking-objects-view";
import { PricePeriodItem } from "./prices-availability-view";

export interface BookingsDashboardViewProps {
  initialSyncData?: SyncSummaryResult | null;
  bookingObjects?: BookingObjectItem[];
  onNavigateTab?: (tab: AdminTab) => void;
  onNavigateToCalendar?: (objectId: string) => void;
}

export function BookingsDashboardView({
  initialSyncData,
  bookingObjects = [],
  onNavigateTab,
  onNavigateToCalendar,
}: BookingsDashboardViewProps) {
  const t = useTranslations("bookingsDashboard");
  const tNav = useTranslations("navigation");
  const tCommon = useTranslations("common");

  const [syncData, setSyncData] = useState<SyncSummaryResult | null>(initialSyncData || null);
  const [pricePeriods, setPricePeriods] = useState<PricePeriodItem[]>([]);
  const [bookingsCount, setBookingsCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(!initialSyncData);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [collapsedObjects, setCollapsedObjects] = useState<Record<string, boolean>>({});
  const [showIcalDetails, setShowIcalDetails] = useState(true);

  const fetchSyncData = async (force: boolean = false) => {
    if (force) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setErrorMsg(null);

    try {
      const [syncRes, periodsRes, bookingsRes] = await Promise.all([
        fetch(`/api/cms/ical/sync-all?force=${force ? "true" : "false"}`, { cache: "no-store" }),
        fetch("/api/cms/price-periods", { cache: "no-store" }),
        fetch("/api/cms/bookings", { cache: "no-store" }),
      ]);

      if (!syncRes.ok) {
        throw new Error(`Failed to fetch iCal data (status ${syncRes.status})`);
      }
      const sData: SyncSummaryResult = await syncRes.json();
      setSyncData(sData);

      if (periodsRes.ok) {
        const pData = await periodsRes.json();
        if (Array.isArray(pData)) setPricePeriods(pData);
      }

      if (bookingsRes.ok) {
        const bData = await bookingsRes.json();
        if (Array.isArray(bData)) setBookingsCount(bData.length);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "An error occurred while fetching booking data.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSyncData(false);
  }, []);

  const toggleCollapse = (id: string) => {
    setCollapsedObjects((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const formatDateTime = (iso?: string | null) => {
    if (!iso) return t("never");
    try {
      const d = new Date(iso);
      return d.toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  const handleJumpToPrices = (objectId: string) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("cms_price_selected_object_id", objectId);
    }
    onNavigateTab?.("prices-availability");
  };

  const handleJumpToCalendar = (objectId: string) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("cms_calendar_filter_object_id", objectId);
    }
    if (onNavigateToCalendar) {
      onNavigateToCalendar(objectId);
    } else {
      onNavigateTab?.("bookings");
    }
  };

  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);

  // Quick navigation tabs for the booking subsystem
  const navTabs: Array<{ id: AdminTab; label: string; icon: React.ReactNode }> = [
    { id: "bookings-dashboard", label: tNav("bookingsDashboard"), icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: "bookings", label: tNav("bookings"), icon: <Calendar className="w-4 h-4" /> },
    { id: "prices-availability", label: tNav("pricesAvailability"), icon: <Coins className="w-4 h-4" /> },
    { id: "objects", label: tNav("bookingObjects"), icon: <Box className="w-4 h-4" /> },
    { id: "optionals", label: tNav("optionals"), icon: <Sparkles className="w-4 h-4" /> },
    { id: "amenities", label: tNav("amenities"), icon: <Tag className="w-4 h-4" /> },
  ];

  const totalUnitsCount = bookingObjects.length || syncData?.totalObjects || 0;

  return (
    <div className="space-y-6 max-w-6xl animate-in fade-in duration-150">
      {/* Sub-Navigation Jump Bar */}
      <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-900/90 border border-slate-800 overflow-x-auto shadow-sm">
        {navTabs.map((tab) => {
          const isActive = tab.id === "bookings-dashboard";
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onNavigateTab?.(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition shrink-0 ${
                isActive
                  ? "bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Top Header Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <LayoutDashboard className="w-6 h-6 text-sky-400" />
            <span>{t("title")}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {t("subtitle")}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => onNavigateTab?.("prices-availability")}
            className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-2 text-xs font-semibold text-amber-300 hover:bg-amber-500/20 transition shadow-sm"
          >
            <Coins className="w-4 h-4 text-amber-400" />
            <span>{t("pricesAvailabilityBtn")}</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab?.("bookings")}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition shadow-sm"
          >
            <Calendar className="w-4 h-4 text-slate-300" />
            <span>{t("calendarBtn")}</span>
          </button>

          <button
            type="button"
            onClick={() => fetchSyncData(true)}
            disabled={isRefreshing || isLoading}
            className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-sky-600/20 hover:bg-sky-500 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
            <span>{isRefreshing ? t("syncing") : t("syncChannels")}</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl border border-rose-500/30 bg-rose-950/20 text-xs text-rose-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Primary KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-1">
          <span className="text-[11px] font-medium text-slate-400">{t("rentalUnits")}</span>
          <p className="text-2xl font-bold text-white font-mono">{totalUnitsCount}</p>
          <span className="text-[10px] text-slate-500 block">{t("managedAccommodations")}</span>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-1">
          <span className="text-[11px] font-medium text-slate-400">{t("configuredSeasons")}</span>
          <p className="text-2xl font-bold text-amber-400 font-mono">{pricePeriods.length}</p>
          <span className="text-[10px] text-slate-500 block">{t("activePricingPeriods")}</span>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-1">
          <span className="text-[11px] font-medium text-slate-400">{t("reservationsAndStays")}</span>
          <p className="text-2xl font-bold text-emerald-400 font-mono">
            {bookingsCount + (syncData?.totalImportedBookings || 0)}
          </p>
          <span className="text-[10px] text-slate-500 block">
            {t("directAndExternal", { direct: bookingsCount, external: syncData?.totalImportedBookings || 0 })}
          </span>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-400">{t("channelFeeds")}</span>
            <span className="inline-flex items-center gap-1 text-[10px] text-sky-400">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
              <span>{t("healthy")}</span>
            </span>
          </div>
          <p className="text-2xl font-bold text-sky-400 font-mono">
            {syncData ? syncData.activeFeedsCount : "—"}
          </p>
          <span className="text-[10px] text-slate-500 block truncate" title={syncData?.lastSynced ? formatDateTime(syncData.lastSynced) : undefined}>
            {t("synced", { time: syncData?.lastSynced ? formatDateTime(syncData.lastSynced) : t("never") })}
          </span>
        </div>
      </div>

      {/* Rental Units Status & Quick Actions */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Box className="w-4 h-4 text-sky-400" />
            <h2 className="text-sm font-semibold text-white">{t("unitsOverview")}</h2>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab?.("objects")}
            className="text-xs text-sky-400 hover:text-sky-300 transition flex items-center gap-1"
          >
            <span>{t("manageAllUnits")}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="divide-y divide-slate-800/60">
          {bookingObjects.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              {t("noObjectsFound")}
            </div>
          ) : (
            bookingObjects.map((obj) => {
              const objectPeriods = pricePeriods.filter((p) => p.object_id === obj.id);
              const activePeriod = objectPeriods.find((p) => {
                if (p.start_date && p.end_date) {
                  const s = new Date(p.start_date).toISOString().split("T")[0];
                  const e = new Date(p.end_date).toISOString().split("T")[0];
                  return todayStr >= s && todayStr <= e;
                }
                return false;
              });

              const nextPeriod = objectPeriods.find((p) => {
                if (p.start_date) {
                  const s = new Date(p.start_date).toISOString().split("T")[0];
                  return s > todayStr;
                }
                return false;
              });

              return (
                <div
                  key={obj.id}
                  className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-900/50 transition"
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h3 className="text-sm font-bold text-white truncate">{obj.name}</h3>
                      {obj.page?.slug && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                          /{obj.page.slug}
                        </span>
                      )}
                      {obj.is_visible === false && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-rose-950/60 text-rose-300 border border-rose-800/40">
                          {t("hidden")}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                      {obj.bed_count > 0 && (
                        <span className="flex items-center gap-1">
                          <Bed className="w-3.5 h-3.5 text-slate-500" />
                          <span>{obj.bed_count} {obj.bed_count === 1 ? t("bed") : t("beds")}</span>
                        </span>
                      )}
                      {obj.room_count && (
                        <span>{obj.room_count} {obj.room_count === 1 ? t("room") : t("rooms")}</span>
                      )}
                      {obj.size_sqm && (
                        <span>{obj.size_sqm} m²</span>
                      )}
                      {obj.type && (
                        <span className="capitalize">{obj.type}</span>
                      )}
                    </div>

                    {/* Season / Pricing Status */}
                    <div className="flex items-center gap-2 pt-1 flex-wrap">
                      {activePeriod ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-medium">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>
                            {t("seasonActive", {
                              name: activePeriod.name || "Season",
                              date: new Date(activePeriod.end_date!).toISOString().split("T")[0]
                            })}
                          </span>
                        </span>
                      ) : nextPeriod ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-sky-500/15 border border-sky-500/30 text-sky-300 text-[11px] font-medium">
                          <Clock className="w-3 h-3 text-sky-400" />
                          <span>
                            {t("upcomingSeason", {
                              name: nextPeriod.name || "Season",
                              date: new Date(nextPeriod.start_date!).toISOString().split("T")[0]
                            })}
                          </span>
                        </span>
                      ) : objectPeriods.length > 0 ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-medium">
                          <span>{t("configuredPeriods", { count: objectPeriods.length })}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-slate-800 text-slate-400 text-[11px]">
                          <span>{t("closedNoSeason")}</span>
                        </span>
                      )}

                      {obj.ical_url ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-sky-950/40 border border-sky-500/20 text-sky-300 text-[10px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                          <span>{t("connected")}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-500 text-[10px]">
                          <span>{t("noFeed")}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleJumpToPrices(obj.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-semibold transition"
                    >
                      <Coins className="w-3.5 h-3.5 text-amber-400" />
                      <span>{t("pricesAvailabilityBtn")}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleJumpToCalendar(obj.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{t("calendarBtn")}</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* External Channel Synchronization (Booking.com & iCal) Section */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 overflow-hidden shadow-lg">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <RefreshCw className="w-4 h-4 text-sky-400" />
            <div>
              <h2 className="text-sm font-semibold text-white">
                {t("syncSectionTitle")}
              </h2>
              <p className="text-[11px] text-slate-400">
                {t("syncSectionDesc")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fetchSyncData(true)}
              disabled={isRefreshing || isLoading}
              className="px-3 py-1.5 rounded-xl border border-sky-500/30 bg-sky-500/10 text-sky-300 hover:bg-sky-500/20 text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
              <span>{t("syncNow")}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowIcalDetails(!showIcalDetails)}
              className="text-slate-400 hover:text-white transition p-1.5 rounded-lg"
              title="Toggle channel details"
            >
              {showIcalDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {showIcalDetails && (
          <div className="p-4 space-y-4">
            <div className="p-3.5 rounded-xl border border-sky-500/20 bg-sky-950/20 text-xs text-slate-300 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
              <div className="text-[11px] text-slate-400 leading-relaxed">
                {t("syncHelpText")}
              </div>
            </div>

            {isLoading && !syncData ? (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto text-sky-400" />
                <p className="text-xs">{t("loadingChannelData")}</p>
              </div>
            ) : (
              syncData?.results?.map((res) => {
                const isCollapsed = Boolean(collapsedObjects[res.objectId]);
                return (
                  <div
                    key={res.objectId}
                    className="rounded-xl border border-slate-800 bg-slate-900/70 overflow-hidden shadow-sm"
                  >
                    <div
                      onClick={() => toggleCollapse(res.objectId)}
                      className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-slate-800/50 transition select-none"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Box className="w-4 h-4 text-sky-400 shrink-0" />
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-white truncate">{res.objectName}</h4>
                          <span className="font-mono text-[10px] text-slate-400 truncate max-w-xs sm:max-w-md block">
                            {res.icalUrl || t("noFeedRegistered")}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {res.persistentFallback && (
                          <span className="inline-flex items-center gap-1 rounded border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-medium text-amber-300">
                            {t("persistentCache")}
                          </span>
                        )}

                        {res.icalUrl ? (
                          <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            <span>{t("periodsCount", { count: res.bookings.length })}</span>
                          </span>
                        ) : (
                          <span className="rounded border border-slate-700 bg-slate-800 px-2 py-0.5 text-[10px] text-slate-400">
                            {t("notConnected")}
                          </span>
                        )}

                        <span className="text-slate-400 p-0.5">
                          {isCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
                        </span>
                      </div>
                    </div>

                    {!isCollapsed && (
                      <div className="border-t border-slate-800 p-3 bg-slate-950/40">
                        {res.warning && (
                          <div className="p-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-300 text-[11px] flex items-center gap-2 mb-3">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                            <span>{res.warning}</span>
                          </div>
                        )}

                        {res.bookings.length === 0 ? (
                          <div className="py-4 text-center text-xs text-slate-500">
                            {res.icalUrl
                              ? t("noOccupiedDates")
                              : t("noExternalFeed")}
                          </div>
                        ) : (
                          <div className="overflow-x-auto rounded-lg border border-slate-800">
                            <table className="w-full text-left border-collapse text-xs">
                              <thead>
                                <tr className="border-b border-slate-800 bg-slate-900/90 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                                  <th className="py-2 px-3">{t("colCheckIn")}</th>
                                  <th className="py-2 px-3">{t("colCheckOut")}</th>
                                  <th className="py-2 px-3 text-center">{t("colNights")}</th>
                                  <th className="py-2 px-3">{t("colDescription")}</th>
                                  <th className="py-2 px-3 font-mono">{t("colUid")}</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                                {res.bookings.map((b) => (
                                  <tr key={b.id} className="hover:bg-slate-900/60 transition text-slate-200">
                                    <td className="py-2 px-3 font-semibold text-white">{b.startDate}</td>
                                    <td className="py-2 px-3 font-semibold text-white">{b.endDate}</td>
                                    <td className="py-2 px-3 text-center">
                                      <span className="inline-block px-1.5 py-0.5 rounded bg-sky-500/15 border border-sky-500/30 text-sky-300 font-bold text-[10px]">
                                        {b.nightsCount} {b.nightsCount === 1 ? t("night") : t("nights")}
                                      </span>
                                    </td>
                                    <td className="py-2 px-3 font-sans text-xs">
                                      <span className="inline-flex items-center gap-1.5 text-amber-300 font-medium">
                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                        <span>{b.summary}</span>
                                      </span>
                                    </td>
                                    <td className="py-2 px-3 text-slate-400 text-[10px] truncate max-w-[180px]" title={b.sourceId}>
                                      {b.sourceId}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
