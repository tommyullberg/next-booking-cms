"use client";

import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import { SyncSummaryResult, SyncObjectResult, SyncBookingItem } from "../../ical/types";

export interface BookingsDashboardViewProps {
  initialSyncData?: SyncSummaryResult | null;
}

export function BookingsDashboardView({ initialSyncData }: BookingsDashboardViewProps) {
  const [syncData, setSyncData] = useState<SyncSummaryResult | null>(initialSyncData || null);
  const [isLoading, setIsLoading] = useState(!initialSyncData);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [collapsedObjects, setCollapsedObjects] = useState<Record<string, boolean>>({});

  const fetchSyncData = async (force: boolean = false) => {
    if (force) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/cms/ical/sync-all?force=${force ? "true" : "false"}`, {
        cache: "no-store",
      });
      if (!res.ok) {
        throw new Error(`Failed to fetch iCal data (status ${res.status})`);
      }
      const data: SyncSummaryResult = await res.json();
      setSyncData(data);
    } catch (err: any) {
      setErrorMsg(err?.message || "An error occurred while fetching calendar data.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (!initialSyncData) {
      fetchSyncData(false);
    }
  }, [initialSyncData]);

  const toggleCollapse = (id: string) => {
    setCollapsedObjects((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const formatDateTime = (iso?: string | null) => {
    if (!iso) return "Never";
    try {
      const d = new Date(iso);
      return d.toLocaleString("en-GB", {
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

  return (
    <div className="space-y-6 max-w-6xl animate-in fade-in duration-150">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Calendar className="w-6 h-6 text-sky-400" />
            <span>Bookings Dashboard</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Overview of blocked dates synchronized from Booking.com and external iCal feeds.
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchSyncData(true)}
          disabled={isRefreshing || isLoading}
          className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-sky-600/20 hover:bg-sky-500 transition disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
          <span>{isRefreshing ? "Syncing from Booking.com..." : "Sync Booking Data"}</span>
        </button>
      </div>

      {/* Info Alert Banner about Caching & Half-Open Date Intervals */}
      <div className="p-4 rounded-2xl border border-sky-500/20 bg-sky-950/20 text-xs text-slate-300 space-y-2">
        <div className="flex items-center gap-2 text-sky-300 font-semibold">
          <ShieldCheck className="w-4 h-4 text-sky-400" />
          <span>Persistent Cache & Automatic Date Handling</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          iCal feeds are automatically cached for 60 minutes for high performance. If Booking.com is temporarily unreachable, the latest saved dates are always preserved so your calendar remains fully functional. In accordance with the iCalendar standard (RFC 5545), check-out dates are exclusive: a guest departing on a given date frees the property for a new guest checking in the same afternoon.
        </p>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl border border-rose-500/30 bg-rose-950/20 text-xs text-rose-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Summary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-1">
          <span className="text-[11px] font-medium text-slate-400">Rental Objects</span>
          <p className="text-xl font-bold text-white font-mono">
            {syncData ? syncData.totalObjects : "—"}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-1">
          <span className="text-[11px] font-medium text-slate-400">Active iCal Feeds</span>
          <p className="text-xl font-bold text-sky-400 font-mono">
            {syncData ? syncData.activeFeedsCount : "—"}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-1">
          <span className="text-[11px] font-medium text-slate-400">Blocked Periods</span>
          <p className="text-xl font-bold text-emerald-400 font-mono">
            {syncData ? syncData.totalImportedBookings : "—"}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-1">
          <span className="text-[11px] font-medium text-slate-400">Last Sync</span>
          <p className="text-xs font-semibold text-slate-200 mt-1 truncate">
            {syncData?.lastSynced ? formatDateTime(syncData.lastSynced) : "—"}
          </p>
          <span className="text-[10px] text-slate-500 block">Cache: 60 minutes</span>
        </div>
      </div>

      {/* Objects & Feeds List */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-white flex items-center justify-between">
          <span>Imported Booking Data per Rental Object</span>
          <span className="text-xs text-slate-400 font-normal">
            {syncData?.results?.length || 0} objects listed
          </span>
        </h2>

        {isLoading && !syncData ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-12 text-center text-slate-400 space-y-3">
            <RefreshCw className="w-6 h-6 text-sky-400 animate-spin mx-auto" />
            <p className="text-xs">Loading and syncing calendar feeds...</p>
          </div>
        ) : (
          syncData?.results?.map((res) => {
            const isCollapsed = Boolean(collapsedObjects[res.objectId]);
            return (
              <div
                key={res.objectId}
                className="rounded-2xl border border-slate-800 bg-slate-900/70 overflow-hidden shadow-lg transition"
              >
                {/* Object Header Bar */}
                <div
                  onClick={() => toggleCollapse(res.objectId)}
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-850 transition select-none bg-slate-900"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
                      <Box className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-white truncate">
                        {res.objectName}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400 flex-wrap">
                        {res.icalUrl ? (
                          <span className="font-mono text-slate-400 truncate max-w-xs sm:max-w-md">
                            {res.icalUrl}
                          </span>
                        ) : (
                          <span className="text-slate-500 italic">No iCal feed configured</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {res.persistentFallback && (
                      <span className="inline-flex items-center gap-1 rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-300">
                        <AlertTriangle className="w-3 h-3 text-amber-400" />
                        Persistent cache
                      </span>
                    )}

                    {res.icalUrl ? (
                      <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <span>{res.bookings.length} periods</span>
                      </span>
                    ) : (
                      <span className="rounded-lg border border-slate-700 bg-slate-800 px-2 py-0.5 text-[10px] text-slate-400 font-medium">
                        Not connected
                      </span>
                    )}

                    <button
                      type="button"
                      className="text-slate-400 hover:text-white transition p-1"
                      aria-label="Toggle details"
                    >
                      {isCollapsed ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronUp className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Object Bookings Table / Details */}
                {!isCollapsed && (
                  <div className="border-t border-slate-800 p-4 space-y-3 bg-slate-950/40">
                    {res.warning && (
                      <div className="p-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300 text-[11px] flex items-center gap-2">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>{res.warning}</span>
                      </div>
                    )}

                    {res.bookings.length === 0 ? (
                      <div className="py-6 text-center text-xs text-slate-500">
                        {res.icalUrl
                          ? "No occupied dates found in the current calendar feed."
                          : "No iCal feed configured for this object. Add an iCal export URL under Booking Objects to synchronize dates."}
                      </div>
                    ) : (
                      <div className="overflow-x-auto rounded-xl border border-slate-800">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="border-b border-slate-800 bg-slate-900/90 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                              <th className="py-2.5 px-3">Check-in</th>
                              <th className="py-2.5 px-3">Check-out</th>
                              <th className="py-2.5 px-3 text-center">Nights</th>
                              <th className="py-2.5 px-4">Status / Description</th>
                              <th className="py-2.5 px-4 font-mono">Booking ID (iCal UID)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                            {res.bookings.map((b) => (
                              <tr
                                key={b.id}
                                className="hover:bg-slate-900/60 transition text-slate-200"
                              >
                                <td className="py-2.5 px-3 font-semibold text-white">
                                  {b.startDate}
                                </td>
                                <td className="py-2.5 px-3 font-semibold text-white">
                                  {b.endDate}
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  <span className="inline-block px-2 py-0.5 rounded bg-sky-500/15 border border-sky-500/30 text-sky-300 font-bold">
                                    {b.nightsCount} {b.nightsCount === 1 ? "night" : "nights"}
                                  </span>
                                </td>
                                <td className="py-2.5 px-4 font-sans text-xs">
                                  <span className="inline-flex items-center gap-1.5 text-amber-300 font-medium">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                    <span>{b.summary}</span>
                                  </span>
                                </td>
                                <td className="py-2.5 px-4 text-slate-400 text-[10px] truncate max-w-[200px]" title={b.sourceId}>
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
    </div>
  );
}
