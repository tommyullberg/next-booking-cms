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
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Alert } from "../../components/ui/alert";
import { cn } from "../../utils/cn";

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
      <nav
        aria-label={tNav("bookingsDashboard")}
        className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-900/90 border border-slate-800 overflow-x-auto shadow-sm"
      >
        {navTabs.map((tab) => {
          const isActive = tab.id === "bookings-dashboard";
          return (
            <button
              key={tab.id}
              type="button"
              aria-current={isActive ? "page" : undefined}
              onClick={() => onNavigateTab?.(tab.id)}
              className={cn(
                "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-sky-500",
                isActive
                  ? "bg-sky-600 hover:bg-sky-500 text-white shadow-md shadow-sky-600/20"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              )}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Top Header Card */}
      <Card variant="admin" className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
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
          <Button
            type="button"
            variant="adminOutline"
            size="sm"
            onClick={() => onNavigateTab?.("prices-availability")}
            className="border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20"
          >
            <Coins className="w-4 h-4 text-amber-400" />
            <span>{t("pricesAvailabilityBtn")}</span>
          </Button>

          <Button
            type="button"
            variant="adminSecondary"
            size="sm"
            onClick={() => onNavigateTab?.("bookings")}
          >
            <Calendar className="w-4 h-4 text-slate-300" />
            <span>{t("calendarBtn")}</span>
          </Button>

          <Button
            type="button"
            variant="adminPrimary"
            size="sm"
            onClick={() => fetchSyncData(true)}
            disabled={isRefreshing || isLoading}
          >
            <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
            <span>{isRefreshing ? t("syncing") : t("syncChannels")}</span>
          </Button>
        </div>
      </Card>

      {errorMsg && (
        <Alert variant="destructive">
          {errorMsg}
        </Alert>
      )}

      {/* Primary KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card variant="adminSubtle" className="p-4 space-y-1">
          <span className="text-[11px] font-medium text-slate-400">{t("rentalUnits")}</span>
          <p className="text-2xl font-bold text-white font-mono">{totalUnitsCount}</p>
          <span className="text-[10px] text-slate-500 block">{t("managedAccommodations")}</span>
        </Card>

        <Card variant="adminSubtle" className="p-4 space-y-1">
          <span className="text-[11px] font-medium text-slate-400">{t("configuredSeasons")}</span>
          <p className="text-2xl font-bold text-amber-400 font-mono">{pricePeriods.length}</p>
          <span className="text-[10px] text-slate-500 block">{t("activePricingPeriods")}</span>
        </Card>

        <Card variant="adminSubtle" className="p-4 space-y-1">
          <span className="text-[11px] font-medium text-slate-400">{t("reservationsAndStays")}</span>
          <p className="text-2xl font-bold text-emerald-400 font-mono">
            {bookingsCount + (syncData?.totalImportedBookings || 0)}
          </p>
          <span className="text-[10px] text-slate-500 block">
            {t("directAndExternal", { direct: bookingsCount, external: syncData?.totalImportedBookings || 0 })}
          </span>
        </Card>

        <Card variant="adminSubtle" className="p-4 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-400">{t("channelFeeds")}</span>
            <Badge variant="adminAccent" size="xs">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
              <span>{t("healthy")}</span>
            </Badge>
          </div>
          <p className="text-2xl font-bold text-sky-400 font-mono">
            {syncData ? syncData.activeFeedsCount : "—"}
          </p>
          <span className="text-[10px] text-slate-500 block truncate" title={syncData?.lastSynced ? formatDateTime(syncData.lastSynced) : undefined}>
            {t("synced", { time: syncData?.lastSynced ? formatDateTime(syncData.lastSynced) : t("never") })}
          </span>
        </Card>
      </div>

      {/* Rental Units Status & Quick Actions */}
      <Card variant="admin" className="overflow-hidden">
        <div className="p-4 border-b border-admin-border flex items-center justify-between">
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
                        <Badge variant="adminDanger" size="xs">
                          {t("hidden")}
                        </Badge>
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
                        <Badge variant="adminSuccess" size="xs">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>
                            {t("seasonActive", {
                              name: activePeriod.name || "Season",
                              date: new Date(activePeriod.end_date!).toISOString().split("T")[0],
                            })}
                          </span>
                        </Badge>
                      ) : nextPeriod ? (
                        <Badge variant="adminAccent" size="xs">
                          <Clock className="w-3 h-3 text-sky-400" />
                          <span>
                            {t("upcomingSeason", {
                              name: nextPeriod.name || "Season",
                              date: new Date(nextPeriod.start_date!).toISOString().split("T")[0],
                            })}
                          </span>
                        </Badge>
                      ) : objectPeriods.length > 0 ? (
                        <Badge variant="adminWarning" size="xs">
                          <span>{t("configuredPeriods", { count: objectPeriods.length })}</span>
                        </Badge>
                      ) : (
                        <Badge variant="adminMuted" size="xs">
                          <span>{t("closedNoSeason")}</span>
                        </Badge>
                      )}

                      {obj.ical_url ? (
                        <Badge variant="adminAccent" size="xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                          <span>{t("connected")}</span>
                        </Badge>
                      ) : (
                        <Badge variant="adminMuted" size="xs">
                          <span>{t("noFeed")}</span>
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      type="button"
                      variant="adminOutline"
                      size="sm"
                      onClick={() => handleJumpToPrices(obj.id)}
                      className="border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300"
                      aria-label={`${t("pricesAvailabilityBtn")} - ${obj.name}`}
                    >
                      <Coins className="w-3.5 h-3.5 text-amber-400" />
                      <span>{t("pricesAvailabilityBtn")}</span>
                    </Button>

                    <Button
                      type="button"
                      variant="adminSecondary"
                      size="sm"
                      onClick={() => handleJumpToCalendar(obj.id)}
                      aria-label={`${t("calendarBtn")} - ${obj.name}`}
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{t("calendarBtn")}</span>
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>

      {/* External Channel Synchronization (Booking.com & iCal) Section */}
      <Card variant="admin" className="overflow-hidden shadow-lg">
        <div className="p-4 border-b border-admin-border flex items-center justify-between">
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
            <Button
              type="button"
              variant="adminOutline"
              size="sm"
              onClick={() => fetchSyncData(true)}
              disabled={isRefreshing || isLoading}
              className="border-sky-500/30 bg-sky-500/10 text-sky-300 hover:bg-sky-500/20"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", isRefreshing && "animate-spin")} />
              <span>{t("syncNow")}</span>
            </Button>

            <Button
              type="button"
              variant="adminGhost"
              size="iconSm"
              onClick={() => setShowIcalDetails(!showIcalDetails)}
              title="Toggle channel details"
              aria-label="Toggle channel details"
              aria-expanded={showIcalDetails}
            >
              {showIcalDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
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
                    className="rounded-xl border border-admin-border bg-admin-surface-subtle overflow-hidden shadow-sm"
                  >
                    <button
                      type="button"
                      onClick={() => toggleCollapse(res.objectId)}
                      aria-expanded={!isCollapsed}
                      className="w-full text-left p-3.5 flex items-center justify-between cursor-pointer hover:bg-slate-800/50 transition select-none outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
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
                          <Badge variant="adminWarning" size="xs">
                            {t("persistentCache")}
                          </Badge>
                        )}

                        {res.icalUrl ? (
                          <Badge variant="adminSuccess" size="xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            <span>{t("periodsCount", { count: res.bookings.length })}</span>
                          </Badge>
                        ) : (
                          <Badge variant="adminMuted" size="xs">
                            {t("notConnected")}
                          </Badge>
                        )}

                        <span className="text-slate-400 p-0.5" aria-hidden="true">
                          {isCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
                        </span>
                      </div>
                    </button>

                    {!isCollapsed && (
                      <div className="border-t border-admin-border p-3 bg-slate-950/40">
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
                          <div className="overflow-x-auto rounded-lg border border-admin-border">
                            <table className="w-full text-left border-collapse text-xs">
                              <thead>
                                <tr className="border-b border-admin-border bg-admin-surface-subtle text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
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
                                      <Badge variant="adminAccent" size="xs">
                                        {b.nightsCount} {b.nightsCount === 1 ? t("night") : t("nights")}
                                      </Badge>
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
      </Card>
    </div>
  );
}
