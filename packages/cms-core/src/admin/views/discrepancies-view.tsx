"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  RefreshCw,
  Trash2,
  Check,
  Calendar,
  Box,
  Hash,
  AlertCircle,
  HelpCircle,
  Filter,
} from "lucide-react";
import { BookingDiscrepancy, DiscrepancyType } from "@cms/logging/discrepancies";
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  Card,
  SegmentedControl,
} from "@cms/components/ui";

export function DiscrepanciesView() {
  const [discrepancies, setDiscrepancies] = useState<BookingDiscrepancy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filter, setFilter] = useState<"ALL" | "ACTIVE" | "ACKNOWLEDGED">("ACTIVE");
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchDiscrepancies = useCallback(async (isBackground = false) => {
    if (!isBackground) setIsLoading(true);
    else setIsRefreshing(true);
    setActionError(null);

    try {
      const res = await fetch("/api/cms/bookings/discrepancies", { cache: "no-store" });
      if (!res.ok) {
        throw new Error("Kunde inte hämta systemavvikelser från servern.");
      }
      const data = await res.json();
      if (Array.isArray(data)) {
        setDiscrepancies(data);
      }
    } catch (err: any) {
      setActionError(err?.message || "Ett fel uppstod vid hämtning av avvikelser.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDiscrepancies();
  }, [fetchDiscrepancies]);

  const handleToggleAcknowledge = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch("/api/cms/bookings/discrepancies/acknowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, acknowledged: !currentStatus }),
      });
      if (!res.ok) {
        throw new Error("Kunde inte uppdatera avvikelsens status.");
      }
      await fetchDiscrepancies(true);
    } catch (err: any) {
      setActionError(err?.message || "Fel vid uppdatering av status.");
    }
  };

  const handleAcknowledgeAll = async () => {
    try {
      const res = await fetch("/api/cms/bookings/discrepancies/acknowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ acknowledged: true }),
      });
      if (!res.ok) {
        throw new Error("Kunde inte kvittera alla avvikelser.");
      }
      await fetchDiscrepancies(true);
    } catch (err: any) {
      setActionError(err?.message || "Fel vid kvittering av alla avvikelser.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Är du säker på att du vill radera denna loggpost permanent?")) return;
    try {
      const res = await fetch(`/api/cms/bookings/discrepancies?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        throw new Error("Kunde inte radera avvikelsen.");
      }
      await fetchDiscrepancies(true);
    } catch (err: any) {
      setActionError(err?.message || "Fel vid radering av avvikelse.");
    }
  };

  const formatTimestamp = (isoString?: string) => {
    if (!isoString) return "-";
    try {
      const d = new Date(isoString);
      return d.toLocaleString("sv-SE", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  const getTypeLabel = (type: DiscrepancyType) => {
    switch (type) {
      case "OBJECT_NOT_FOUND":
        return { label: "Okänt objekt", variant: "destructive" as const };
      case "OBJECT_MISSING_PRICE":
        return { label: "Objekt saknar pris", variant: "warning" as const };
      case "PERIOD_MISSING_PRICE":
        return { label: "Period saknar pris", variant: "warning" as const };
      case "INVALID_SETTINGS":
        return { label: "Ogiltig konfiguration", variant: "secondary" as const };
      case "TECHNICAL_DATABASE_ERROR":
        return { label: "Tekniskt databasfel", variant: "destructive" as const };
      default:
        return { label: type, variant: "secondary" as const };
    }
  };

  const filteredDiscrepancies = discrepancies.filter((item) => {
    if (filter === "ACTIVE") return !item.acknowledged;
    if (filter === "ACKNOWLEDGED") return item.acknowledged;
    return true;
  });

  const totalCount = discrepancies.length;
  const activeCount = discrepancies.filter((d) => !d.acknowledged).length;
  const acknowledgedCount = discrepancies.filter((d) => d.acknowledged).length;

  return (
    <div className="space-y-6">
      {/* Header and Summary Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-admin-border">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <span>System- och bokningsavvikelser</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Övervaka och åtgärda avvikelser i prissättning, objektrelationer och tekniska anrop.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleAcknowledgeAll}
              className="text-xs flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5 text-emerald-500" />
              <span>Kvittera alla aktiva</span>
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchDiscrepancies(true)}
            disabled={isRefreshing}
            className="text-xs flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-sky-500" : ""}`} />
            <span>Uppdatera</span>
          </Button>
        </div>
      </div>

      {actionError && (
        <Alert variant="destructive">
          <AlertTitle>Fel</AlertTitle>
          <AlertDescription>{actionError}</AlertDescription>
        </Alert>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 bg-admin-surface border border-admin-border rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Aktiva avvikelser</span>
            <AlertCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-foreground mt-2">
            {activeCount}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">Kräver uppföljning</p>
        </Card>

        <Card className="p-4 bg-admin-surface border border-admin-border rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Kvitterade</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-foreground mt-2">
            {acknowledgedCount}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">Markerade som åtgärdade</p>
        </Card>

        <Card className="p-4 bg-admin-surface border border-admin-border rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Totalt i historik</span>
            <Hash className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-2xl font-bold text-foreground mt-2">
            {totalCount}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">Max 50 deduplicerade poster</p>
        </Card>
      </div>

      {/* Filter Mode Selector */}
      <div className="flex items-center gap-2 border-b border-admin-border pb-3">
        <Filter className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        <SegmentedControl<"ACTIVE" | "ALL" | "ACKNOWLEDGED">
          size="sm"
          value={filter}
          onChange={(val) => setFilter(val)}
          aria-label="Filtrera avvikelser efter status"
          options={[
            {
              value: "ACTIVE",
              label: `Aktiva (${activeCount})`,
            },
            {
              value: "ALL",
              label: `Alla (${totalCount})`,
            },
            {
              value: "ACKNOWLEDGED",
              label: `Kvitterade (${acknowledgedCount})`,
            },
          ]}
        />
      </div>

      {/* List of Discrepancies */}
      {isLoading ? (
        <div className="p-8 text-center text-xs text-muted-foreground">
          Laddar systemavvikelser...
        </div>
      ) : filteredDiscrepancies.length === 0 ? (
        <div className="p-8 rounded-xl border border-dashed border-admin-border bg-admin-surface/40 text-center">
          <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
          <h4 className="text-sm font-semibold text-foreground">Inga avvikelser att visa</h4>
          <p className="text-xs text-muted-foreground mt-1">
            {filter === "ACTIVE"
              ? "Alla registrerade avvikelser är åtgärdade och kvitterade."
              : "Inga poster matchar det valda filtret."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredDiscrepancies.map((item) => {
            const typeInfo = getTypeLabel(item.type);
            return (
              <Card
                key={item.id}
                className={`p-4 border rounded-xl transition-all ${
                  item.acknowledged
                    ? "bg-admin-surface/50 border-admin-border opacity-75"
                    : "bg-admin-surface border-rose-500/30 shadow-sm"
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={typeInfo.variant}>{typeInfo.label}</Badge>

                      {item.acknowledged ? (
                        <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center gap-1">
                          <Check className="w-3 h-3" /> Kvitterad
                        </span>
                      ) : (
                        <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-rose-500/10 text-rose-500 border border-rose-500/20">
                          Aktiv
                        </span>
                      )}

                      {item.occurrences > 1 && (
                        <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold bg-slate-200 dark:bg-slate-800 text-foreground">
                          {item.occurrences} förekomster
                        </span>
                      )}
                    </div>

                    <div className="text-xs font-mono font-medium text-foreground mt-1 break-words">
                      {item.message}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground pt-1">
                      {item.objectName && (
                        <span className="flex items-center gap-1">
                          <Box className="w-3 h-3 text-muted-foreground" />
                          <span>Boende: <strong className="text-foreground">{item.objectName}</strong></span>
                        </span>
                      )}

                      {item.objectId && (
                        <span className="flex items-center gap-1">
                          <Hash className="w-3 h-3 text-muted-foreground" />
                          <span>ID: <code className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">{item.objectId}</code></span>
                        </span>
                      )}

                      {item.period?.startDate && item.period?.endDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-muted-foreground" />
                          <span>Period: {item.period.startDate} till {item.period.endDate}</span>
                        </span>
                      )}

                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        <span>Senast: {formatTimestamp(item.lastOccurredAt)}</span>
                      </span>

                      {item.acknowledged && item.acknowledgedAt && (
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                          Kvitterad {formatTimestamp(item.acknowledgedAt)} av {item.acknowledgedBy || "admin"}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                    <Button
                      variant={item.acknowledged ? "outline" : "default"}
                      size="sm"
                      onClick={() => handleToggleAcknowledge(item.id, item.acknowledged)}
                      className="text-xs"
                    >
                      {item.acknowledged ? "Återöppna" : "Markera åtgärdad"}
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(item.id)}
                      title="Radera permanent"
                      className="text-muted-foreground hover:text-rose-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
