"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Plus,
  Edit3,
  Trash2,
  Copy,
  Coins,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  X,
  Loader2,
  Filter,
  Info,
  CalendarDays,
  Sparkles,
} from "lucide-react";
import { BookingObjectItem } from "./booking-objects-view";
import { getWeeksInYear } from "../../utils/weeks";

export interface PricePeriodItem {
  id: string;
  object_id: string;
  name: string | null;
  start_year: number;
  start_week: number;
  end_year: number;
  end_week: number;
  allow_custom_days: boolean;
  price_day: number | null;
  price_2_days: number | null;
  price_3_days: number | null;
  price_4_days: number | null;
  price_5_days: number | null;
  price_6_days: number | null;
  price_week: number | null;
  price_sun_thu: number | null;
  price_thu_sun: number | null;
  created_at?: string | Date;
  updated_at?: string | Date;
  object?: {
    id: string;
    name: string;
  };
}

export interface MissingWeekRange {
  startWeek: number;
  endWeek: number;
}

export interface ObjectPricesViewProps {
  objects: BookingObjectItem[];
}

export function ObjectPricesView({ objects = [] }: ObjectPricesViewProps) {
  const currentActualYear = useMemo(() => new Date().getFullYear(), []);

  // Object selection (stored in localStorage)
  const [selectedObjectId, setSelectedObjectId] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("cms_price_selected_object_id");
      if (stored && objects.some((o) => o.id === stored)) return stored;
    }
    return objects[0]?.id || "";
  });

  // Year selection (stored in localStorage, filters out past years)
  const [selectedYear, setSelectedYear] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("cms_price_selected_year");
      if (stored) {
        const parsed = parseInt(stored, 10);
        if (parsed >= currentActualYear) return parsed;
      }
    }
    return currentActualYear;
  });

  // Dynamic max weeks for selected year (52 or 53 based on ISO 8601)
  const maxWeeksInSelectedYear = useMemo(() => {
    return getWeeksInYear(selectedYear);
  }, [selectedYear]);

  // Data states
  const [periods, setPeriods] = useState<PricePeriodItem[]>([]);
  const [allPeriodsForCopy, setAllPeriodsForCopy] = useState<PricePeriodItem[]>([]);
  const [missingWeeks, setMissingWeeks] = useState<MissingWeekRange[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingPeriod, setEditingPeriod] = useState<PricePeriodItem | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form field states
  const [formName, setFormName] = useState<string>("");
  const [formStartYear, setFormStartYear] = useState<number>(selectedYear);
  const [formStartWeek, setFormStartWeek] = useState<number>(1);
  const [formEndYear, setFormEndYear] = useState<number>(selectedYear);
  const [formEndWeek, setFormEndWeek] = useState<number>(maxWeeksInSelectedYear);
  const [formAllowCustomDays, setFormAllowCustomDays] = useState<boolean>(false);
  const [formPriceDay, setFormPriceDay] = useState<string>("");
  const [formPriceSunThu, setFormPriceSunThu] = useState<string>("");
  const [formPriceThuSun, setFormPriceThuSun] = useState<string>("");
  const [formPriceWeek, setFormPriceWeek] = useState<string>("");
  const [formPrice2Days, setFormPrice2Days] = useState<string>("");
  const [formPrice3Days, setFormPrice3Days] = useState<string>("");
  const [formPrice4Days, setFormPrice4Days] = useState<string>("");
  const [formPrice5Days, setFormPrice5Days] = useState<string>("");
  const [formPrice6Days, setFormPrice6Days] = useState<string>("");

  // Persist selections
  useEffect(() => {
    if (selectedObjectId) {
      localStorage.setItem("cms_price_selected_object_id", selectedObjectId);
    }
  }, [selectedObjectId]);

  useEffect(() => {
    localStorage.setItem("cms_price_selected_year", String(selectedYear));
  }, [selectedYear]);

  // Keep selectedObjectId valid if objects change
  useEffect(() => {
    if (!selectedObjectId && objects.length > 0) {
      setSelectedObjectId(objects[0].id);
    }
  }, [objects, selectedObjectId]);

  // Load periods & missing weeks for selected object & year
  const loadData = useCallback(async () => {
    if (!selectedObjectId) return;
    setIsLoading(true);
    try {
      const [periodsRes, missingRes, allRes] = await Promise.all([
        fetch(`/api/cms/price-periods?objectId=${selectedObjectId}&year=${selectedYear}`, {
          cache: "no-store",
        }),
        fetch(
          `/api/cms/price-periods/missing-weeks?objectId=${selectedObjectId}&year=${selectedYear}`,
          { cache: "no-store" }
        ),
        fetch("/api/cms/price-periods", { cache: "no-store" }),
      ]);

      if (periodsRes.ok) {
        const data = await periodsRes.json();
        setPeriods(Array.isArray(data) ? data : []);
      }
      if (missingRes.ok) {
        const data = await missingRes.json();
        setMissingWeeks(Array.isArray(data) ? data : []);
      }
      if (allRes.ok) {
        const data = await allRes.json();
        setAllPeriodsForCopy(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("[ObjectPricesView] Failed to load data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedObjectId, selectedYear]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Available year options (current year up to +4 years, plus any year with configured data)
  const availableYears = useMemo(() => {
    const yearsSet = new Set<number>();
    for (let y = currentActualYear; y <= currentActualYear + 4; y++) {
      yearsSet.add(y);
    }
    for (const p of allPeriodsForCopy) {
      if (p.start_year >= currentActualYear) yearsSet.add(p.start_year);
      if (p.end_year >= currentActualYear) yearsSet.add(p.end_year);
    }
    return Array.from(yearsSet).sort((a, b) => a - b);
  }, [currentActualYear, allPeriodsForCopy]);

  const selectedObject = useMemo(() => {
    return objects.find((o) => o.id === selectedObjectId);
  }, [objects, selectedObjectId]);

  // Open modal for Create
  const handleOpenCreate = () => {
    setEditingPeriod(null);
    setErrorMessage(null);
    setFormName("");
    setFormStartYear(selectedYear);
    const maxWeeks = getWeeksInYear(selectedYear);
    if (missingWeeks.length > 0) {
      setFormStartWeek(missingWeeks[0].startWeek);
      setFormEndWeek(missingWeeks[0].endWeek);
    } else {
      setFormStartWeek(1);
      setFormEndWeek(maxWeeks);
    }
    setFormEndYear(selectedYear);
    setFormAllowCustomDays(false);
    setFormPriceDay("");
    setFormPriceSunThu("");
    setFormPriceThuSun("");
    setFormPriceWeek("");
    setFormPrice2Days("");
    setFormPrice3Days("");
    setFormPrice4Days("");
    setFormPrice5Days("");
    setFormPrice6Days("");
    setIsModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEdit = (period: PricePeriodItem) => {
    setEditingPeriod(period);
    setErrorMessage(null);
    setFormName(period.name || "");
    setFormStartYear(period.start_year);
    setFormStartWeek(period.start_week);
    setFormEndYear(period.end_year);
    setFormEndWeek(period.end_week);
    setFormAllowCustomDays(Boolean(period.allow_custom_days));
    setFormPriceDay(period.price_day !== null ? String(period.price_day) : "");
    setFormPriceSunThu(period.price_sun_thu !== null ? String(period.price_sun_thu) : "");
    setFormPriceThuSun(period.price_thu_sun !== null ? String(period.price_thu_sun) : "");
    setFormPriceWeek(period.price_week !== null ? String(period.price_week) : "");
    setFormPrice2Days(period.price_2_days !== null ? String(period.price_2_days) : "");
    setFormPrice3Days(period.price_3_days !== null ? String(period.price_3_days) : "");
    setFormPrice4Days(period.price_4_days !== null ? String(period.price_4_days) : "");
    setFormPrice5Days(period.price_5_days !== null ? String(period.price_5_days) : "");
    setFormPrice6Days(period.price_6_days !== null ? String(period.price_6_days) : "");
    setIsModalOpen(true);
  };

  // Open modal for Duplicate / Copy to new period
  const handleOpenDuplicate = (period: PricePeriodItem) => {
    setEditingPeriod(null);
    setErrorMessage(null);
    setFormName(period.name ? `${period.name} (Copy)` : "Copy of price period");
    setFormStartYear(selectedYear);
    setFormStartWeek(period.start_week);
    setFormEndYear(selectedYear);
    setFormEndWeek(period.end_week);
    setFormAllowCustomDays(Boolean(period.allow_custom_days));
    setFormPriceDay(period.price_day !== null ? String(period.price_day) : "");
    setFormPriceSunThu(period.price_sun_thu !== null ? String(period.price_sun_thu) : "");
    setFormPriceThuSun(period.price_thu_sun !== null ? String(period.price_thu_sun) : "");
    setFormPriceWeek(period.price_week !== null ? String(period.price_week) : "");
    setFormPrice2Days(period.price_2_days !== null ? String(period.price_2_days) : "");
    setFormPrice3Days(period.price_3_days !== null ? String(period.price_3_days) : "");
    setFormPrice4Days(period.price_4_days !== null ? String(period.price_4_days) : "");
    setFormPrice5Days(period.price_5_days !== null ? String(period.price_5_days) : "");
    setFormPrice6Days(period.price_6_days !== null ? String(period.price_6_days) : "");
    setIsModalOpen(true);
  };

  // Copy values from another period into form
  const handleCopyFromPeriod = (sourcePeriodId: string) => {
    const source = allPeriodsForCopy.find((p) => p.id === sourcePeriodId);
    if (!source) return;

    if (!formName && source.name) {
      setFormName(source.name);
    }
    setFormAllowCustomDays(Boolean(source.allow_custom_days));
    setFormPriceDay(source.price_day !== null ? String(source.price_day) : "");
    setFormPriceSunThu(source.price_sun_thu !== null ? String(source.price_sun_thu) : "");
    setFormPriceThuSun(source.price_thu_sun !== null ? String(source.price_thu_sun) : "");
    setFormPriceWeek(source.price_week !== null ? String(source.price_week) : "");
    setFormPrice2Days(source.price_2_days !== null ? String(source.price_2_days) : "");
    setFormPrice3Days(source.price_3_days !== null ? String(source.price_3_days) : "");
    setFormPrice4Days(source.price_4_days !== null ? String(source.price_4_days) : "");
    setFormPrice5Days(source.price_5_days !== null ? String(source.price_5_days) : "");
    setFormPrice6Days(source.price_6_days !== null ? String(source.price_6_days) : "");
  };

  // Save handler
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedObjectId) return;

    setIsSaving(true);
    setErrorMessage(null);

    const payload = {
      ...(editingPeriod ? { id: editingPeriod.id } : {}),
      objectId: selectedObjectId,
      name: formName.trim() || undefined,
      startYear: Number(formStartYear),
      startWeek: Number(formStartWeek),
      endYear: Number(formEndYear),
      endWeek: Number(formEndWeek),
      allowCustomDays: formAllowCustomDays,
      priceDay: formPriceDay !== "" ? parseFloat(formPriceDay) : null,
      priceSunThu: formPriceSunThu !== "" ? parseFloat(formPriceSunThu) : null,
      priceThuSun: formPriceThuSun !== "" ? parseFloat(formPriceThuSun) : null,
      priceWeek: formPriceWeek !== "" ? parseFloat(formPriceWeek) : null,
      price2Days: formAllowCustomDays && formPrice2Days !== "" ? parseFloat(formPrice2Days) : null,
      price3Days: formAllowCustomDays && formPrice3Days !== "" ? parseFloat(formPrice3Days) : null,
      price4Days: formAllowCustomDays && formPrice4Days !== "" ? parseFloat(formPrice4Days) : null,
      price5Days: formAllowCustomDays && formPrice5Days !== "" ? parseFloat(formPrice5Days) : null,
      price6Days: formAllowCustomDays && formPrice6Days !== "" ? parseFloat(formPrice6Days) : null,
    };

    try {
      const res = await fetch("/api/cms/price-periods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Could not save price period.");
      }

      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred.");
    } finally {
      setIsSaving(false);
    }
  };

  // Delete handler
  const handleDelete = async (id: string, name: string | null) => {
    const displayName = name ? `"${name}"` : "this price period";
    if (!confirm(`Are you sure you want to delete ${displayName}?`)) return;

    try {
      const res = await fetch(`/api/cms/price-periods/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data?.error || "Could not delete price period.");
        return;
      }
      await loadData();
    } catch (err) {
      console.error("[ObjectPricesView] Delete error:", err);
    }
  };

  const formatKr = (val: number | null) => {
    if (val === null || val === undefined) return "—";
    return `${val.toLocaleString("sv-SE")} SEK`;
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">Object Prices</h1>
              <p className="text-xs text-slate-400">
                Manage seasonal week periods, custom stay rules, and tiered prices per rental object.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Object selector */}
            <div className="flex items-center gap-2 bg-slate-950/70 border border-slate-800 rounded-xl px-3 py-1.5">
              <span className="text-xs text-slate-400">Object:</span>
              <select
                value={selectedObjectId}
                onChange={(e) => setSelectedObjectId(e.target.value)}
                className="bg-transparent text-xs font-semibold text-white focus:outline-none cursor-pointer"
              >
                {objects.map((obj) => (
                  <option key={obj.id} value={obj.id} className="bg-slate-900 text-white">
                    {obj.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Year selector (auto-persisted, filters out past years) */}
            <div className="flex items-center gap-2 bg-slate-950/70 border border-slate-800 rounded-xl px-3 py-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs text-slate-400">Year:</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
                className="bg-transparent text-xs font-semibold text-white focus:outline-none cursor-pointer"
              >
                {availableYears.map((y) => (
                  <option key={y} value={y} className="bg-slate-900 text-white">
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleOpenCreate}
              disabled={!selectedObjectId}
              className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-xs font-semibold text-slate-950 shadow-lg shadow-amber-500/20 hover:bg-amber-400 transition disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>New Price Period</span>
            </button>
          </div>
        </div>
      </div>

      {/* Missing Weeks Warning Banner */}
      {selectedObjectId && (
        <>
          {periods.length === 0 ? (
            <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-4 text-rose-200 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <div className="font-semibold text-rose-300">
                  No weeks have active pricing for {selectedObject?.name || "this object"} in {selectedYear}.
                </div>
                <div className="text-rose-200/90 pt-0.5">
                  Weeks 1–{maxWeeksInSelectedYear} lack pricing. Click &quot;New Price Period&quot; to configure seasonal periods and daily/weekly prices for this year.
                </div>
              </div>
            </div>
          ) : missingWeeks.length > 0 ? (
            <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-amber-200 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <div className="font-semibold text-amber-300">
                  The following weeks lack pricing for {selectedObject?.name || "this object"} in {selectedYear}:
                </div>
                <div className="text-amber-200/90 flex flex-wrap gap-1.5 pt-0.5">
                  {missingWeeks.map((mw, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/30 text-amber-200 font-mono text-[11px]"
                    >
                      {mw.startWeek === mw.endWeek ? `w.${mw.startWeek}` : `w.${mw.startWeek}–w.${mw.endWeek}`}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-emerald-300 flex items-center gap-2.5 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                All {maxWeeksInSelectedYear} weeks have active pricing for {selectedObject?.name || "this object"} in {selectedYear}.
              </span>
            </div>
          )}
        </>
      )}

      {/* Price Periods Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-slate-400" />
            <h2 className="text-sm font-semibold text-white">
              Price Periods ({selectedObject?.name || "Object"} – {selectedYear})
            </h2>
          </div>
          <span className="text-xs text-slate-400">
            {periods.length} {periods.length === 1 ? "period" : "periods"} configured
          </span>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
            <span className="text-xs">Loading price periods...</span>
          </div>
        ) : periods.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Calendar className="w-8 h-8 mx-auto text-slate-600 mb-2" />
            <p className="text-sm font-medium text-slate-300">No price periods created yet for {selectedYear}</p>
            <p className="text-xs text-slate-500 mt-1">
              Click &quot;New Price Period&quot; to define week spans and prices.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Period / Name</th>
                  <th className="py-3 px-3">Week Span</th>
                  <th className="py-3 px-3">Custom Days</th>
                  <th className="py-3 px-3 text-right">Daily (SEK)</th>
                  <th className="py-3 px-3 text-right">Sun–Thu</th>
                  <th className="py-3 px-3 text-right">Thu–Sun</th>
                  <th className="py-3 px-3 text-right">Full Week</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {periods.map((period) => (
                  <tr key={period.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white">{period.name || "Price Period"}</div>
                      {period.allow_custom_days && (
                        <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1.5">
                          <span>2d: {formatKr(period.price_2_days)}</span>
                          <span>•</span>
                          <span>3d: {formatKr(period.price_3_days)}</span>
                          <span>•</span>
                          <span>4d: {formatKr(period.price_4_days)}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 font-mono text-[11px] text-amber-300">
                        w.{period.start_week}–w.{period.end_week} ({period.start_year})
                      </span>
                    </td>
                    <td className="py-3.5 px-3">
                      {period.allow_custom_days ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Allowed</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
                          Fixed changeover only
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono font-medium text-slate-100">
                      {formatKr(period.price_day)}
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono text-slate-200">
                      {formatKr(period.price_sun_thu)}
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono text-slate-200">
                      {formatKr(period.price_thu_sun)}
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono font-semibold text-amber-300">
                      {formatKr(period.price_week)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenDuplicate(period)}
                          title="Duplicate / copy to new period"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(period)}
                          title="Edit period"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(period.id, period.name)}
                          title="Delete period"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Dialog for Create & Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl p-6 text-white my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Coins className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingPeriod ? "Edit Price Period" : "New Price Period"}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Object: <span className="text-amber-300 font-semibold">{selectedObject?.name}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error Message if Overlap / Failure */}
            {errorMessage && (
              <div className="mb-4 rounded-xl border border-rose-500/40 bg-rose-500/10 p-3.5 text-rose-300 flex items-start gap-2.5 text-xs">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-5">
              {/* Copy Values Select */}
              {allPeriodsForCopy.length > 0 && (
                <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Copy prices from existing period</span>
                  </label>
                  <select
                    defaultValue=""
                    onChange={(e) => {
                      if (e.target.value) handleCopyFromPeriod(e.target.value);
                    }}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-200 focus:border-amber-400 focus:outline-none"
                  >
                    <option value="" disabled>
                      Select period to copy values from...
                    </option>
                    {allPeriodsForCopy.map((p) => {
                      const objName = p.object?.name || "Unknown object";
                      return (
                        <option key={p.id} value={p.id}>
                          {objName}: {p.name || "Period"} (w.{p.start_week}–w.{p.end_week}, {p.start_year})
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}

              {/* Period Name */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Period Name
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Peak Summer, Mid Season, Low Season, Christmas & New Year"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-xs text-white focus:border-amber-400 focus:outline-none"
                />
              </div>

              {/* Week Spans: Start & End */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Start */}
                <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/40 space-y-2">
                  <span className="text-xs font-semibold text-amber-300">Start Period</span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Start Year</label>
                      <input
                        type="number"
                        required
                        min={currentActualYear}
                        max={currentActualYear + 10}
                        value={formStartYear}
                        onChange={(e) => setFormStartYear(parseInt(e.target.value, 10) || currentActualYear)}
                        className="w-full rounded-lg border border-slate-700 bg-slate-900 p-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">
                        Start Week (1–{getWeeksInYear(formStartYear)})
                      </label>
                      <input
                        type="number"
                        required
                        min={1}
                        max={getWeeksInYear(formStartYear)}
                        value={formStartWeek}
                        onChange={(e) => setFormStartWeek(parseInt(e.target.value, 10) || 1)}
                        className="w-full rounded-lg border border-slate-700 bg-slate-900 p-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* End */}
                <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/40 space-y-2">
                  <span className="text-xs font-semibold text-amber-300">End Period</span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">End Year</label>
                      <input
                        type="number"
                        required
                        min={currentActualYear}
                        max={currentActualYear + 10}
                        value={formEndYear}
                        onChange={(e) => setFormEndYear(parseInt(e.target.value, 10) || currentActualYear)}
                        className="w-full rounded-lg border border-slate-700 bg-slate-900 p-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">
                        End Week (1–{getWeeksInYear(formEndYear)})
                      </label>
                      <input
                        type="number"
                        required
                        min={1}
                        max={getWeeksInYear(formEndYear)}
                        value={formEndWeek}
                        onChange={(e) => setFormEndWeek(parseInt(e.target.value, 10) || getWeeksInYear(formEndYear))}
                        className="w-full rounded-lg border border-slate-700 bg-slate-900 p-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Allow Custom Days Toggle */}
              <div className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-800 bg-slate-950/40">
                <input
                  type="checkbox"
                  id="allowCustomDaysToggle"
                  checked={formAllowCustomDays}
                  onChange={(e) => setFormAllowCustomDays(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-slate-700 text-amber-500 focus:ring-amber-500 focus:ring-offset-slate-900"
                />
                <label htmlFor="allowCustomDaysToggle" className="cursor-pointer select-none space-y-0.5">
                  <div className="text-xs font-semibold text-white">
                    Allow custom periods / flexible number of days
                  </div>
                  <div className="text-[11px] text-slate-400">
                    When disabled, only standard check-in intervals (Sun–Thu, Thu–Sun, and full week) are allowed.
                    When enabled, guests can book 2–6 days freely during this period.
                  </div>
                </label>
              </div>

              {/* Standard Price Inputs */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-200">Standard Prices (SEK)</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Price per night</label>
                    <input
                      type="number"
                      step="any"
                      min={0}
                      value={formPriceDay}
                      onChange={(e) => setFormPriceDay(e.target.value)}
                      placeholder="e.g. 1500"
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-xs text-white focus:border-amber-400 focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Sun – Thu (4 nights)</label>
                    <input
                      type="number"
                      step="any"
                      min={0}
                      value={formPriceSunThu}
                      onChange={(e) => setFormPriceSunThu(e.target.value)}
                      placeholder="e.g. 4500"
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-xs text-white focus:border-amber-400 focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Thu – Sun (3 nights)</label>
                    <input
                      type="number"
                      step="any"
                      min={0}
                      value={formPriceThuSun}
                      onChange={(e) => setFormPriceThuSun(e.target.value)}
                      placeholder="e.g. 4000"
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-xs text-white focus:border-amber-400 focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1 font-semibold text-amber-300">
                      Full week (7 nights)
                    </label>
                    <input
                      type="number"
                      step="any"
                      min={0}
                      value={formPriceWeek}
                      onChange={(e) => setFormPriceWeek(e.target.value)}
                      placeholder="e.g. 8000"
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-xs text-white focus:border-amber-400 focus:outline-none font-mono font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Custom Days Price Inputs (active only when allow_custom_days is true) */}
              <div
                className={`space-y-2 p-3.5 rounded-xl border transition ${
                  formAllowCustomDays
                    ? "border-slate-800 bg-slate-950/60"
                    : "border-slate-800/40 bg-slate-950/20 opacity-40 pointer-events-none"
                }`}
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-200">
                    Custom day prices (2–6 days, SEK)
                  </h4>
                  {!formAllowCustomDays && (
                    <span className="text-[10px] text-slate-500 italic">
                      Disabled (activate via &quot;Allow custom periods&quot; above)
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">2 days</label>
                    <input
                      type="number"
                      step="any"
                      min={0}
                      disabled={!formAllowCustomDays}
                      value={formPrice2Days}
                      onChange={(e) => setFormPrice2Days(e.target.value)}
                      placeholder="2d price"
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 p-2 text-xs text-white focus:border-amber-400 focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">3 days</label>
                    <input
                      type="number"
                      step="any"
                      min={0}
                      disabled={!formAllowCustomDays}
                      value={formPrice3Days}
                      onChange={(e) => setFormPrice3Days(e.target.value)}
                      placeholder="3d price"
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 p-2 text-xs text-white focus:border-amber-400 focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">4 days</label>
                    <input
                      type="number"
                      step="any"
                      min={0}
                      disabled={!formAllowCustomDays}
                      value={formPrice4Days}
                      onChange={(e) => setFormPrice4Days(e.target.value)}
                      placeholder="4d price"
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 p-2 text-xs text-white focus:border-amber-400 focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">5 days</label>
                    <input
                      type="number"
                      step="any"
                      min={0}
                      disabled={!formAllowCustomDays}
                      value={formPrice5Days}
                      onChange={(e) => setFormPrice5Days(e.target.value)}
                      placeholder="5d price"
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 p-2 text-xs text-white focus:border-amber-400 focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">6 days</label>
                    <input
                      type="number"
                      step="any"
                      min={0}
                      disabled={!formAllowCustomDays}
                      value={formPrice6Days}
                      onChange={(e) => setFormPrice6Days(e.target.value)}
                      placeholder="6d price"
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 p-2 text-xs text-white focus:border-amber-400 focus:outline-none font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-5 py-2 text-xs font-semibold text-slate-950 shadow-lg shadow-amber-500/20 hover:bg-amber-400 transition disabled:opacity-50"
                >
                  {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingPeriod ? "Save Changes" : "Create Price Period"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
