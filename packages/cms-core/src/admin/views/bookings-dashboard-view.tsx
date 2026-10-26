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
        throw new Error(`Kunde inte hämta iCal-data (status ${res.status})`);
      }
      const data: SyncSummaryResult = await res.json();
      setSyncData(data);
    } catch (err: any) {
      setErrorMsg(err?.message || "Ett fel uppstod vid hämtning av kalenderdata.");
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
    if (!iso) return "Aldrig";
    try {
      const d = new Date(iso);
      return d.toLocaleString("sv-SE", {
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
            Översikt över blockerade datum synkroniserade från Booking.com och externa iCal-flöden.
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchSyncData(true)}
          disabled={isRefreshing || isLoading}
          className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-sky-600/20 hover:bg-sky-500 transition disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
          <span>{isRefreshing ? "Hämtar från Booking.com..." : "Hämta ny Booking-data"}</span>
        </button>
      </div>

      {/* Info Alert Banner about Caching & Half-Open Date Intervals */}
      <div className="p-4 rounded-2xl border border-sky-500/20 bg-sky-950/20 text-xs text-slate-300 space-y-2">
        <div className="flex items-center gap-2 text-sky-300 font-semibold">
          <ShieldCheck className="w-4 h-4 text-sky-400" />
          <span>Persistent Cache & Automatisk datumhantering</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          iCal-data cachas automatiskt i 60 minuter för hög prestanda. Om Booking.com tillfälligt inte skulle svara behålls alltid de senaste sparade datumen så att ni aldrig står utan data. I enlighet med iCalendar-standarden (RFC 5545) är utcheckningsdagen exklusiv: en gäst som checkar ut ett datum frigör stugan för en ny gästs incheckning samma dag.
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
          <span className="text-[11px] font-medium text-slate-400">Hyresobjekt</span>
          <p className="text-xl font-bold text-white font-mono">
            {syncData ? syncData.totalObjects : "—"}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-1">
          <span className="text-[11px] font-medium text-slate-400">Aktiva iCal-länkar</span>
          <p className="text-xl font-bold text-sky-400 font-mono">
            {syncData ? syncData.activeFeedsCount : "—"}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-1">
          <span className="text-[11px] font-medium text-slate-400">Blockerade perioder</span>
          <p className="text-xl font-bold text-emerald-400 font-mono">
            {syncData ? syncData.totalImportedBookings : "—"}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-1">
          <span className="text-[11px] font-medium text-slate-400">Senaste synk</span>
          <p className="text-xs font-semibold text-slate-200 mt-1 truncate">
            {syncData?.lastSynced ? formatDateTime(syncData.lastSynced) : "—"}
          </p>
          <span className="text-[10px] text-slate-500 block">Cache: 60 minuter</span>
        </div>
      </div>

      {/* Objects & Feeds List */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-white flex items-center justify-between">
          <span>Importerade bokningsdata per hyresobjekt</span>
          <span className="text-xs text-slate-400 font-normal">
            {syncData?.results?.length || 0} objekt listade
          </span>
        </h2>

        {isLoading && !syncData ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-12 text-center text-slate-400 space-y-3">
            <RefreshCw className="w-6 h-6 text-sky-400 animate-spin mx-auto" />
            <p className="text-xs">Läser in och synkroniserar kalenderflöden...</p>
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
                          <span className="text-slate-500 italic">Ingen iCal-länk konfigurerad</span>
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
                        <span>{res.bookings.length} perioder</span>
                      </span>
                    ) : (
                      <span className="rounded-lg border border-slate-700 bg-slate-800 px-2 py-0.5 text-[10px] text-slate-400 font-medium">
                        Ej kopplad
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
                          ? "Inga upptagna datum hittades i det aktuella kalenderflödet."
                          : "Ingen iCal-länk är inlagd för detta objekt. Lägg in en iCal-exportlänk under Hyresobjekt för att synka datum."}
                      </div>
                    ) : (
                      <div className="overflow-x-auto rounded-xl border border-slate-800">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="border-b border-slate-800 bg-slate-900/90 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                              <th className="py-2.5 px-3">Incheckning</th>
                              <th className="py-2.5 px-3">Utcheckning</th>
                              <th className="py-2.5 px-3 text-center">Nätter</th>
                              <th className="py-2.5 px-4">Status / Beskrivning</th>
                              <th className="py-2.5 px-4 font-mono">Boknings-ID (iCal UID)</th>
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
                                    {b.nightsCount} {b.nightsCount === 1 ? "natt" : "nätter"}
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
