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
  Ban,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { BookingObjectItem } from "./booking-objects-view";
import { getWeeksInYear, getISOWeek } from "../../utils/weeks";
import {
  MONTH_NAMES_EN,
  WEEKDAY_INITIALS_EN,
  isFutureYearWarningActive,
  FUTURE_YEAR_WARNING_THRESHOLD_LABEL_EN,
} from "../../constants/dates";
import type { MissingWeekRange, BlockedPeriodItem } from "../../actions/price-periods";
import { ModalPortal } from "../../components/ui/modal-portal";

export type { MissingWeekRange, BlockedPeriodItem };

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

export interface ObjectPricesViewProps {
  objects: BookingObjectItem[];
}

export function ObjectPricesView({ objects = [] }: ObjectPricesViewProps) {
  const currentActualYear = useMemo(() => new Date().getFullYear(), []);
  const currentISOWeek = useMemo(() => getISOWeek(new Date()).week, []);

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

  // Remaining weeks in the year for current year
  const remainingWeeksCount = useMemo(() => {
    if (selectedYear !== currentActualYear) return maxWeeksInSelectedYear;
    return Math.max(1, maxWeeksInSelectedYear - currentISOWeek + 1);
  }, [selectedYear, currentActualYear, maxWeeksInSelectedYear, currentISOWeek]);

  // Data states
  const [periods, setPeriods] = useState<PricePeriodItem[]>([]);
  const [allPeriodsForCopy, setAllPeriodsForCopy] = useState<PricePeriodItem[]>([]);
  const [blockedPeriods, setBlockedPeriods] = useState<BlockedPeriodItem[]>([]);
  const [missingWeeks, setMissingWeeks] = useState<MissingWeekRange[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Year calendar toggle
  const [showYearCalendar, setShowYearCalendar] = useState<boolean>(true);

  // Price period modal states
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingPeriod, setEditingPeriod] = useState<PricePeriodItem | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Price period form fields
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

  // Blocked period ("Not for rent") modal states
  const [isBlockedModalOpen, setIsBlockedModalOpen] = useState<boolean>(false);
  const [blockedFormName, setBlockedFormName] = useState<string>("");
  const [blockedFormStartDate, setBlockedFormStartDate] = useState<string>("");
  const [blockedFormEndDate, setBlockedFormEndDate] = useState<string>("");
  const [isSavingBlocked, setIsSavingBlocked] = useState<boolean>(false);
  const [blockedErrorMessage, setBlockedErrorMessage] = useState<string | null>(null);

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

  // Load periods, missing weeks, and blocked periods for selected object & year
  const loadData = useCallback(async () => {
    if (!selectedObjectId) return;
    setIsLoading(true);
    try {
      const [periodsRes, missingRes, allRes, blockedRes] = await Promise.all([
        fetch(`/api/cms/price-periods?objectId=${selectedObjectId}&year=${selectedYear}`, {
          cache: "no-store",
        }),
        fetch(`/api/cms/price-periods/missing-weeks?objectId=${selectedObjectId}&year=${selectedYear}`, {
          cache: "no-store",
        }),
        fetch("/api/cms/price-periods", { cache: "no-store" }),
        fetch(`/api/cms/price-periods/blocked?objectId=${selectedObjectId}&year=${selectedYear}`, {
          cache: "no-store",
        }),
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
      if (blockedRes.ok) {
        const data = await blockedRes.json();
        setBlockedPeriods(Array.isArray(data) ? data : []);
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

  // Check if viewing next year before price warning activation cutoff
  const isFutureYearWarningSuppressed = useMemo(() => {
    return selectedYear === currentActualYear + 1 && !isFutureYearWarningActive();
  }, [selectedYear, currentActualYear]);

  // Open modal for Create Price Period
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

  // Open modal for Create Price Period targeting a clicked week
  const handleOpenCreateForWeek = (week: number) => {
    setEditingPeriod(null);
    setErrorMessage(null);
    setFormName("");
    setFormStartYear(selectedYear);
    setFormStartWeek(week);
    setFormEndYear(selectedYear);
    setFormEndWeek(week);
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

  // Open modal for Edit Price Period
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

  // Duplicate period
  const handleOpenDuplicate = (period: PricePeriodItem) => {
    setEditingPeriod(null);
    setErrorMessage(null);
    setFormName(period.name ? `${period.name} (Copy)` : "Copy");
    setFormStartYear(selectedYear);
    const maxWeeks = getWeeksInYear(selectedYear);
    if (missingWeeks.length > 0) {
      setFormStartWeek(missingWeeks[0].startWeek);
      setFormEndWeek(missingWeeks[0].endWeek);
    } else {
      setFormStartWeek(Math.min(period.start_week, maxWeeks));
      setFormEndWeek(Math.min(period.end_week, maxWeeks));
    }
    setFormEndYear(selectedYear);
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

  // Save handler for Price Period
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

  // Delete handler for Price Period
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

  // Open modal for Blocked Period ("Not for Rent")
  const handleOpenCreateBlocked = () => {
    setBlockedFormName("");
    const today = new Date().toISOString().split("T")[0];
    const defaultStart = selectedYear === currentActualYear ? today : `${selectedYear}-01-01`;
    setBlockedFormStartDate(defaultStart);
    setBlockedFormEndDate(defaultStart);
    setBlockedErrorMessage(null);
    setIsBlockedModalOpen(true);
  };

  // Save handler for Blocked Period
  const handleSaveBlocked = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedObjectId) return;
    setIsSavingBlocked(true);
    setBlockedErrorMessage(null);

    try {
      const res = await fetch("/api/cms/price-periods/blocked", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          objectId: selectedObjectId,
          name: blockedFormName.trim() || "Not for rent",
          startDate: blockedFormStartDate,
          endDate: blockedFormEndDate,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Could not save blocked period.");
      }

      setIsBlockedModalOpen(false);
      await loadData();
    } catch (err: any) {
      setBlockedErrorMessage(err.message || "An unexpected error occurred.");
    } finally {
      setIsSavingBlocked(false);
    }
  };

  // Delete handler for Blocked Period
  const handleDeleteBlocked = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete blocked period "${name}"?`)) return;

    try {
      const res = await fetch(`/api/cms/price-periods/blocked/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data?.error || "Could not delete blocked period.");
        return;
      }
      await loadData();
    } catch (err) {
      console.error("[ObjectPricesView] Delete blocked error:", err);
    }
  };

  const formatKr = (val: number | null) => {
    if (val === null || val === undefined) return "—";
    return `${val.toLocaleString("sv-SE")} SEK`;
  };

  // Year Calendar Matrix computation for all 12 months
  const calendarMonths = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    const months = [];

    for (let m = 0; m < 12; m++) {
      const daysInMonth = new Date(selectedYear, m + 1, 0).getDate();
      const firstDayWeekday = (new Date(selectedYear, m, 1).getDay() + 6) % 7;
      const days = [];

      for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${selectedYear}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        const isPast =
          selectedYear < currentActualYear ? true : selectedYear === currentActualYear ? dateStr < todayStr : false;
        const isToday = dateStr === todayStr;

        // Check if inside a blocked period ("Not for rent")
        const blockedMatch = blockedPeriods.find((b) => dateStr >= b.startDate && dateStr <= b.endDate);

        // Check if inside a price period by ISO week
        const iso = getISOWeek(dateStr);
        const score = iso.year * 100 + iso.week;
        const priceMatch = periods.find((p) => {
          const pStart = p.start_year * 100 + p.start_week;
          const pEnd = p.end_year * 100 + p.end_week;
          return score >= pStart && score <= pEnd;
        });

        const isMissing = !isPast && !blockedMatch && !priceMatch;

        days.push({
          day: d,
          dateStr,
          isPast,
          isToday,
          isoWeek: iso.week,
          blocked: blockedMatch,
          period: priceMatch,
          isMissing,
        });
      }

      // Build weekly rows for the month
      const weeks: Array<{
        weekNumber: number;
        days: Array<(typeof days)[0] | null>;
      }> = [];

      let currentWeekDays: Array<(typeof days)[0] | null> = [];
      for (let i = 0; i < firstDayWeekday; i++) {
        currentWeekDays.push(null);
      }

      for (const day of days) {
        currentWeekDays.push(day);
        if (currentWeekDays.length === 7) {
          const refDay = currentWeekDays.find((d) => d !== null);
          const weekNumber = refDay ? refDay.isoWeek : 1;
          weeks.push({ weekNumber, days: currentWeekDays });
          currentWeekDays = [];
        }
      }

      if (currentWeekDays.length > 0) {
        const refDay = currentWeekDays.find((d) => d !== null);
        const weekNumber = refDay ? refDay.isoWeek : 1;
        while (currentWeekDays.length < 7) {
          currentWeekDays.push(null);
        }
        weeks.push({ weekNumber, days: currentWeekDays });
      }

      months.push({
        monthIndex: m,
        name: MONTH_NAMES_EN[m],
        firstDayWeekday,
        days,
        weeks,
      });
    }

    return months;
  }, [selectedYear, currentActualYear, blockedPeriods, periods]);

  return (
    <div className='space-y-6'>
      {/* Top Header Card */}
      <div className='rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur'>
        <div className='flex flex-col md:flex-row md:items-center justify-between gap-4'>
          <div className='flex items-center gap-3'>
            <div className='h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/20'>
              <Coins className='w-5 h-5' />
            </div>
            <div>
              <h1 className='text-xl font-bold text-white tracking-tight'>Object Prices</h1>
              <p className='text-xs text-slate-400'>
                Manage seasonal week periods, custom stay rules, and tiered prices per rental object.
              </p>
            </div>
          </div>

          <div className='flex flex-wrap items-center gap-3'>
            {/* Object selector */}
            <div className='flex items-center gap-2 bg-slate-950/70 border border-slate-800 rounded-xl px-3 py-1.5'>
              <span className='text-xs text-slate-400'>Object:</span>
              <select
                value={selectedObjectId}
                onChange={(e) => setSelectedObjectId(e.target.value)}
                className='bg-transparent text-xs font-semibold text-white focus:outline-none cursor-pointer'>
                {objects.map((obj) => (
                  <option key={obj.id} value={obj.id} className='bg-slate-900 text-white'>
                    {obj.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Year selector */}
            <div className='flex items-center gap-2 bg-slate-950/70 border border-slate-800 rounded-xl px-3 py-1.5'>
              <Calendar className='w-3.5 h-3.5 text-amber-400' />
              <span className='text-xs text-slate-400'>Year:</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
                className='bg-transparent text-xs font-semibold text-white focus:outline-none cursor-pointer'>
                {availableYears.map((y) => (
                  <option key={y} value={y} className='bg-slate-900 text-white'>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            {/* Block Period Button */}
            <button
              type='button'
              onClick={handleOpenCreateBlocked}
              disabled={!selectedObjectId}
              className='flex items-center gap-1.5 rounded-xl border border-rose-500/40 bg-rose-500/10 px-3.5 py-2 text-xs font-semibold text-rose-300 shadow-sm hover:bg-rose-500/20 transition disabled:opacity-50'>
              <Plus className='w-4 h-4 text-rose-400' />
              <span>Block Period</span>
            </button>

            {/* New Price Period Button */}
            <button
              type='button'
              onClick={handleOpenCreate}
              disabled={!selectedObjectId}
              className='flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-xs font-semibold text-slate-950 shadow-lg shadow-amber-500/20 hover:bg-amber-400 transition disabled:opacity-50'>
              <Plus className='w-4 h-4' />
              <span>New Price Period</span>
            </button>
          </div>
        </div>
      </div>

      {/* Missing Weeks / Planning Warning Banner */}
      {selectedObjectId && (
        <>
          {isFutureYearWarningSuppressed ? (
            <div className='rounded-xl border border-sky-500/30 bg-sky-500/10 p-3.5 text-sky-200 flex items-center gap-2.5 text-xs'>
              <Info className='w-4 h-4 text-sky-400 shrink-0' />
              <span>
                Planning for {selectedYear}: Missing pricing warnings for next year will become active on{" "}
                {FUTURE_YEAR_WARNING_THRESHOLD_LABEL_EN}.
              </span>
            </div>
          ) : periods.length === 0 && blockedPeriods.length === 0 ? (
            <div className='rounded-xl border border-rose-500/40 bg-rose-500/10 p-4 text-rose-200 flex items-start gap-3'>
              <AlertTriangle className='w-5 h-5 text-rose-400 shrink-0 mt-0.5' />
              <div className='text-xs space-y-1'>
                <div className='font-semibold text-rose-300'>
                  No active prices or blocked periods configured for {selectedObject?.name || "this object"} in{" "}
                  {selectedYear}.
                </div>
                <div className='text-rose-200/90 pt-0.5'>
                  Click &quot;New Price Period&quot; to configure seasonal prices, or &quot;Block Period&quot; to close
                  the object.
                </div>
              </div>
            </div>
          ) : missingWeeks.length > 0 ? (
            <div className='rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-amber-200 flex items-start gap-3'>
              <AlertTriangle className='w-5 h-5 text-amber-400 shrink-0 mt-0.5' />
              <div className='text-xs space-y-1'>
                <div className='font-semibold text-amber-300'>
                  The following future weeks lack pricing for {selectedObject?.name || "this object"} in {selectedYear}:
                </div>
                <div className='text-amber-200/90 flex flex-wrap gap-1.5 pt-0.5'>
                  {missingWeeks.map((mw, idx) => (
                    <span
                      key={idx}
                      className='inline-flex items-center px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/30 text-amber-200 font-mono text-[11px]'>
                      {mw.startWeek === mw.endWeek ? `w.${mw.startWeek}` : `w.${mw.startWeek}–w.${mw.endWeek}`}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className='rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-emerald-300 flex items-center gap-2.5 text-xs'>
              <CheckCircle2 className='w-4 h-4 text-emerald-400 shrink-0' />
              <span>
                {selectedYear === currentActualYear
                  ? `All ${remainingWeeksCount} weeks remaining in ${selectedYear} have active pricing for ${selectedObject?.name || "this object"}.`
                  : `All ${maxWeeksInSelectedYear} weeks in ${selectedYear} have active pricing for ${selectedObject?.name || "this object"}.`}
              </span>
            </div>
          )}
        </>
      )}

      {/* Price Periods Table */}
      <div className='rounded-2xl border border-slate-800 bg-slate-900/40 overflow-hidden'>
        <div className='p-4 border-b border-slate-800 flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <CalendarDays className='w-4 h-4 text-slate-400' />
            <h2 className='text-sm font-semibold text-white'>
              Price Periods ({selectedObject?.name || "Object"} – {selectedYear})
            </h2>
          </div>
          <div className='flex items-center gap-3'>
            <span className='text-xs text-slate-400'>
              {periods.length} {periods.length === 1 ? "period" : "periods"} configured
            </span>
            <button
              type='button'
              onClick={handleOpenCreate}
              disabled={!selectedObjectId}
              className='flex items-center gap-1.5 rounded-xl bg-amber-500 px-3 py-1.5 text-xs font-semibold text-slate-950 shadow-md shadow-amber-500/20 hover:bg-amber-400 transition disabled:opacity-50'>
              <Plus className='w-3.5 h-3.5' />
              <span>New Price Period</span>
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className='p-12 text-center text-slate-400 flex items-center justify-center gap-2'>
            <Loader2 className='w-5 h-5 animate-spin text-amber-400' />
            <span className='text-xs'>Loading price periods...</span>
          </div>
        ) : periods.length === 0 ? (
          <div className='p-12 text-center text-slate-400 space-y-3'>
            <Coins className='w-8 h-8 mx-auto text-slate-600' />
            <div className='text-sm font-medium text-slate-300'>No price periods configured yet</div>
            <p className='text-xs text-slate-500 max-w-sm mx-auto'>
              Configure tiered pricing and seasonal periods for {selectedObject?.name || "this object"} in{" "}
              {selectedYear}.
            </p>
            <button
              type='button'
              onClick={handleOpenCreate}
              className='inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-xs font-semibold text-slate-950 shadow-lg shadow-amber-500/20 hover:bg-amber-400 transition'>
              <Plus className='w-4 h-4' />
              <span>New Price Period</span>
            </button>
          </div>
        ) : (
          <div className='overflow-x-auto'>
            <table className='w-full text-left text-xs'>
              <thead className='bg-slate-950/60 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[10px]'>
                <tr>
                  <th className='py-3 px-4'>Period / Name</th>
                  <th className='py-3 px-4 text-center'>Week Span</th>
                  <th className='py-3 px-4 text-center'>Custom Days</th>
                  <th className='py-3 px-4 text-right'>Daily (SEK)</th>
                  <th className='py-3 px-4 text-right'>Sun–Thu</th>
                  <th className='py-3 px-4 text-right'>Thu–Sun</th>
                  <th className='py-3 px-4 text-right font-bold text-slate-300'>Full Week</th>
                  <th className='py-3 px-4 text-center'>Actions</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-slate-800/60 text-slate-200'>
                {periods.map((period) => (
                  <tr key={period.id} className='hover:bg-slate-800/30 transition'>
                    <td className='py-3.5 px-4'>
                      <div className='font-semibold text-white'>
                        {period.name || <span className='text-slate-500 italic'>Unnamed Period</span>}
                      </div>
                      {period.allow_custom_days && (
                        <div className='text-[10px] text-slate-400 pt-0.5'>
                          {period.price_2_days ? `2d: ${formatKr(period.price_2_days)} • ` : ""}
                          {period.price_3_days ? `3d: ${formatKr(period.price_3_days)} • ` : ""}
                          {period.price_4_days ? `4d: ${formatKr(period.price_4_days)}` : ""}
                        </div>
                      )}
                    </td>
                    <td className='py-3.5 px-4 text-center'>
                      <span className='inline-flex items-center px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300 font-mono text-[11px]'>
                        w.{period.start_week}–w.{period.end_week}
                        {period.start_year !== period.end_year
                          ? ` (${period.start_year}–${period.end_year})`
                          : ` (${period.start_year})`}
                      </span>
                    </td>
                    <td className='py-3.5 px-4 text-center'>
                      {period.allow_custom_days ? (
                        <span className='inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 text-[11px] font-medium border border-emerald-500/30'>
                          <CheckCircle2 className='w-3 h-3' />
                          <span>Allowed</span>
                        </span>
                      ) : (
                        <span className='inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 text-[11px] font-medium border border-slate-700'>
                          <span>Full Week Only</span>
                        </span>
                      )}
                    </td>
                    <td className='py-3.5 px-4 text-right font-medium'>{formatKr(period.price_day)}</td>
                    <td className='py-3.5 px-4 text-right font-medium'>{formatKr(period.price_sun_thu)}</td>
                    <td className='py-3.5 px-4 text-right font-medium'>{formatKr(period.price_thu_sun)}</td>
                    <td className='py-3.5 px-4 text-right font-bold text-amber-300'>{formatKr(period.price_week)}</td>
                    <td className='py-3.5 px-4 text-center'>
                      <div className='flex items-center justify-center gap-1.5'>
                        <button
                          type='button'
                          onClick={() => handleOpenDuplicate(period)}
                          title='Duplicate / copy to new period'
                          className='p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition'>
                          <Copy className='w-3.5 h-3.5' />
                        </button>
                        <button
                          type='button'
                          onClick={() => handleOpenEdit(period)}
                          title='Edit period'
                          className='p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition'>
                          <Edit3 className='w-3.5 h-3.5' />
                        </button>
                        <button
                          type='button'
                          onClick={() => handleDelete(period.id, period.name)}
                          title='Delete period'
                          className='p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition'>
                          <Trash2 className='w-3.5 h-3.5' />
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

      {/* Blocked Periods (Not for Rent) Section */}
      <div className='rounded-2xl border border-slate-800 bg-slate-900/40 overflow-hidden'>
        <div className='p-4 border-b border-slate-800 flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <Ban className='w-4 h-4 text-rose-400' />
            <h2 className='text-sm font-semibold text-white'>
              Blocked Periods / Not for Rent ({selectedObject?.name || "Object"} – {selectedYear})
            </h2>
          </div>
          <div className='flex items-center gap-3'>
            <span className='text-xs text-slate-400'>
              {blockedPeriods.length} {blockedPeriods.length === 1 ? "period" : "periods"} blocked
            </span>
            <button
              type='button'
              onClick={handleOpenCreateBlocked}
              disabled={!selectedObjectId}
              className='flex items-center gap-1.5 rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 transition disabled:opacity-50'>
              <Plus className='w-3.5 h-3.5' />
              <span>Block Period</span>
            </button>
          </div>
        </div>

        {blockedPeriods.length === 0 ? (
          <div className='p-8 text-center text-slate-400 space-y-2'>
            <Ban className='w-7 h-7 mx-auto text-slate-600' />
            <div className='text-xs font-medium text-slate-300'>No blocked periods registered for {selectedYear}.</div>
            <p className='text-[11px] text-slate-500'>
              If the unit is closed for the season, under renovation, or reserved for private use, you can block any
              date range here.
            </p>
          </div>
        ) : (
          <div className='overflow-x-auto'>
            <table className='w-full text-left text-xs'>
              <thead className='bg-slate-950/60 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[10px]'>
                <tr>
                  <th className='py-3 px-4'>Reason / Name</th>
                  <th className='py-3 px-4'>Date Range</th>
                  <th className='py-3 px-4 text-center'>Duration</th>
                  <th className='py-3 px-4'>Status</th>
                  <th className='py-3 px-4 text-center'>Actions</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-slate-800/60 text-slate-200'>
                {blockedPeriods.map((bp) => {
                  const s = new Date(bp.startDate);
                  const e = new Date(bp.endDate);
                  const days = Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                  return (
                    <tr key={bp.id} className='hover:bg-slate-800/30 transition'>
                      <td className='py-3.5 px-4 font-semibold text-white flex items-center gap-2'>
                        <span className='w-2 h-2 rounded-full bg-rose-500' />
                        <span>{bp.name}</span>
                      </td>
                      <td className='py-3.5 px-4 font-mono text-slate-300'>
                        {bp.startDate} – {bp.endDate}
                      </td>
                      <td className='py-3.5 px-4 text-center'>
                        <span className='inline-flex items-center px-2 py-0.5 rounded-md bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[11px] font-mono'>
                          {days} {days === 1 ? "day" : "days"}
                        </span>
                      </td>
                      <td className='py-3.5 px-4 text-slate-400 text-[11px]'>
                        Blocked from booking in calendar & iCal
                      </td>
                      <td className='py-3.5 px-4 text-center'>
                        <button
                          type='button'
                          onClick={() => handleDeleteBlocked(bp.id, bp.name)}
                          title='Delete blocked period'
                          className='p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition'>
                          <Trash2 className='w-3.5 h-3.5' />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Year Calendar Matrix Visualization */}
      {selectedObjectId && (
        <div className='rounded-2xl border border-slate-800 bg-slate-900/40 overflow-hidden'>
          <div className='p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3'>
            <div className='flex items-center gap-2'>
              <Calendar className='w-4 h-4 text-amber-400' />
              <h2 className='text-sm font-semibold text-white'>
                Year Calendar ({selectedObject?.name || "Object"} – {selectedYear})
              </h2>
            </div>

            {/* Legend & Collapse Toggle */}
            <div className='flex flex-wrap items-center gap-3 text-xs'>
              <div className='flex items-center gap-1.5 text-slate-300'>
                <span className='w-2.5 h-2.5 rounded-sm bg-emerald-500 border border-emerald-400' />
                <span>Active Pricing</span>
              </div>
              <div className='flex items-center gap-1.5 text-slate-300'>
                <span className='w-2.5 h-2.5 rounded-sm bg-rose-600 border border-rose-500' />
                <span>Not for Rent</span>
              </div>
              <div className='flex items-center gap-1.5 text-slate-300'>
                <span className='w-2.5 h-2.5 rounded-sm bg-amber-500 border border-amber-400' />
                <span>Missing Pricing</span>
              </div>
              <div className='flex items-center gap-1.5 text-slate-400'>
                <span className='w-2.5 h-2.5 rounded-sm bg-slate-800 border border-slate-700' />
                <span>Past Dates</span>
              </div>
              <div className='flex items-center gap-1.5 text-sky-300/90'>
                <span className='w-3.5 h-3.5 rounded-sm bg-sky-950/30 border border-sky-500/10 text-[9px] font-mono text-sky-400/70 flex items-center justify-center'>
                  w
                </span>
                <span>Week Number</span>
              </div>

              <button
                type='button'
                onClick={() => setShowYearCalendar(!showYearCalendar)}
                className='ml-2 flex items-center gap-1 text-slate-400 hover:text-white transition'>
                {showYearCalendar ? (
                  <>
                    <span>Hide</span>
                    <ChevronUp className='w-4 h-4' />
                  </>
                ) : (
                  <>
                    <span>Show</span>
                    <ChevronDown className='w-4 h-4' />
                  </>
                )}
              </button>
            </div>
          </div>

          {showYearCalendar && (
            <div className='p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
              {calendarMonths.map((m) => (
                <div
                  key={m.monthIndex}
                  className='rounded-xl border border-slate-800/80 bg-slate-950/50 p-3 flex flex-col justify-between'>
                  <div>
                    <div className='text-xs font-bold text-slate-300 pb-2 border-b border-slate-800/60 flex items-center justify-between'>
                      <span>{m.name}</span>
                      <span className='text-[10px] text-slate-500 font-mono'>{selectedYear}</span>
                    </div>

                    <div className='grid grid-cols-8 gap-1 text-[10px] text-center font-medium pt-2 pb-1.5 border-b border-slate-800/40 mb-1'>
                      <div className='text-sky-400/70 font-mono font-bold text-[9px] flex items-center justify-center'>
                        Wk
                      </div>
                      {WEEKDAY_INITIALS_EN.map((w, idx) => (
                        <div key={idx} className='text-slate-500'>
                          {w}
                        </div>
                      ))}
                    </div>

                    <div className='space-y-1'>
                      {m.weeks.map((week, wIdx) => (
                        <div key={wIdx} className='grid grid-cols-8 gap-1 text-center items-center'>
                          {/* Week Number Cell */}
                          <div
                            title={`Week ${week.weekNumber}`}
                            onClick={() => {
                              const hasMissing = week.days.some((d) => d?.isMissing);
                              if (hasMissing) {
                                handleOpenCreateForWeek(week.weekNumber);
                              }
                            }}
                            className={`h-6 flex items-center justify-center rounded text-[9px] font-mono font-medium text-sky-400/50 bg-sky-950/10 border border-sky-500/10 select-none ${
                              week.days.some((d) => d?.isMissing)
                                ? "cursor-pointer hover:border-sky-400 hover:bg-sky-900/60"
                                : ""
                            }`}>
                            {week.weekNumber}
                          </div>

                          {/* 7 Day Cells */}
                          {week.days.map((dayObj, dIdx) => {
                            if (!dayObj) {
                              return <div key={`empty-${dIdx}`} className='h-6 w-full' />;
                            }

                            let cellClass = "";
                            let title = "";

                            if (dayObj.blocked) {
                              cellClass =
                                "bg-rose-950/80 border border-rose-600/60 text-rose-300 font-bold hover:bg-rose-900";
                              title = `${dayObj.dateStr}: Not for Rent (${dayObj.blocked.name})`;
                            } else if (dayObj.period) {
                              cellClass =
                                "bg-emerald-950/70 border border-emerald-500/50 text-emerald-300 font-bold hover:bg-emerald-900";
                              const pName = dayObj.period.name || "Price Period";
                              const pPrice = dayObj.period.price_week
                                ? `${dayObj.period.price_week} SEK/wk`
                                : dayObj.period.price_day
                                  ? `${dayObj.period.price_day} SEK/day`
                                  : "Priced";
                              title = `${dayObj.dateStr} (w.${dayObj.isoWeek}): ${pName} (${pPrice})`;
                            } else if (dayObj.isMissing) {
                              cellClass =
                                "bg-amber-500/20 border border-amber-500/50 text-amber-300 font-bold hover:bg-amber-500/40 cursor-pointer animate-pulse";
                              title = `${dayObj.dateStr} (w.${dayObj.isoWeek}): Missing pricing. Click to create period.`;
                            } else {
                              // Past dates
                              cellClass = "bg-slate-900/40 border border-slate-800/30 text-slate-600";
                              title = `${dayObj.dateStr} (Past)`;
                            }

                            if (dayObj.isToday) {
                              cellClass += " ring-2 ring-white/60";
                            }

                            return (
                              <div
                                key={dayObj.dateStr}
                                title={title}
                                onClick={() => {
                                  if (dayObj.isMissing) {
                                    handleOpenCreateForWeek(dayObj.isoWeek);
                                  }
                                }}
                                className={`h-6 flex items-center justify-center rounded text-[10px] transition select-none ${cellClass}`}>
                                {dayObj.day}
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal Dialog for Create & Edit Price Period */}
      {isModalOpen && (
        <ModalPortal>
          <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto'>
            <div className='w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl p-6 text-white my-8'>
              <div className='flex items-center justify-between border-b border-slate-800 pb-4 mb-5'>
                <div className='flex items-center gap-2.5'>
                  <div className='h-8 w-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center'>
                    <Coins className='w-4 h-4' />
                  </div>
                  <div>
                    <h3 className='text-base font-bold text-white'>
                      {editingPeriod ? "Edit Price Period" : "New Price Period"}
                    </h3>
                    <p className='text-xs text-slate-400'>
                      Object: <span className='text-amber-300 font-semibold'>{selectedObject?.name}</span>
                    </p>
                  </div>
                </div>
                <button
                  type='button'
                  onClick={() => setIsModalOpen(false)}
                  className='p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition'>
                  <X className='w-5 h-5' />
                </button>
              </div>

              {/* Error Message if Overlap / Failure */}
              {errorMessage && (
                <div className='mb-4 rounded-xl border border-rose-500/40 bg-rose-500/10 p-3.5 text-rose-300 flex items-start gap-2.5 text-xs'>
                  <AlertTriangle className='w-4 h-4 text-rose-400 shrink-0 mt-0.5' />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleSave} className='space-y-5'>
                {/* Copy Values Select */}
                {allPeriodsForCopy.length > 0 && (
                  <div className='p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 space-y-1.5'>
                    <label className='block text-xs font-semibold text-slate-300 flex items-center gap-1.5'>
                      <Sparkles className='w-3.5 h-3.5 text-amber-400' />
                      <span>Copy prices from existing period</span>
                    </label>
                    <select
                      defaultValue=''
                      onChange={(e) => {
                        if (e.target.value) handleCopyFromPeriod(e.target.value);
                      }}
                      className='w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-200 focus:border-amber-400 focus:outline-none'>
                      <option value='' disabled>
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

                {/* Name */}
                <div>
                  <label className='block text-xs font-semibold text-slate-300 mb-1.5'>Period Name / Season</label>
                  <input
                    type='text'
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder='e.g. High Season, Mid Season, Christmas & New Year'
                    className='w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none'
                  />
                </div>

                {/* Week Span */}
                <div className='grid grid-cols-2 sm:grid-cols-4 gap-3'>
                  <div>
                    <label className='block text-xs font-semibold text-slate-300 mb-1.5'>Start Year</label>
                    <input
                      type='number'
                      required
                      value={formStartYear}
                      onChange={(e) => setFormStartYear(parseInt(e.target.value, 10))}
                      className='w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none'
                    />
                  </div>
                  <div>
                    <label className='block text-xs font-semibold text-slate-300 mb-1.5'>
                      Start Week (1–{getWeeksInYear(formStartYear)})
                    </label>
                    <input
                      type='number'
                      required
                      min={1}
                      max={getWeeksInYear(formStartYear)}
                      value={formStartWeek}
                      onChange={(e) => setFormStartWeek(parseInt(e.target.value, 10))}
                      className='w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none'
                    />
                  </div>
                  <div>
                    <label className='block text-xs font-semibold text-slate-300 mb-1.5'>End Year</label>
                    <input
                      type='number'
                      required
                      value={formEndYear}
                      onChange={(e) => setFormEndYear(parseInt(e.target.value, 10))}
                      className='w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none'
                    />
                  </div>
                  <div>
                    <label className='block text-xs font-semibold text-slate-300 mb-1.5'>
                      End Week (1–{getWeeksInYear(formEndYear)})
                    </label>
                    <input
                      type='number'
                      required
                      min={1}
                      max={getWeeksInYear(formEndYear)}
                      value={formEndWeek}
                      onChange={(e) => setFormEndWeek(parseInt(e.target.value, 10))}
                      className='w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none'
                    />
                  </div>
                </div>

                {/* Base Prices: Daily & Weekly */}
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800'>
                  <div>
                    <label className='block text-xs font-semibold text-slate-300 mb-1.5'>Daily Base Price (SEK)</label>
                    <input
                      type='number'
                      step='any'
                      placeholder='e.g. 1500'
                      value={formPriceDay}
                      onChange={(e) => setFormPriceDay(e.target.value)}
                      className='w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-600 focus:border-amber-400 focus:outline-none'
                    />
                  </div>
                  <div>
                    <label className='block text-xs font-semibold text-amber-300 mb-1.5'>Full Week Price (SEK)</label>
                    <input
                      type='number'
                      step='any'
                      placeholder='e.g. 8500'
                      value={formPriceWeek}
                      onChange={(e) => setFormPriceWeek(e.target.value)}
                      className='w-full rounded-xl border border-amber-500/50 bg-slate-950 px-3 py-2 text-xs text-amber-200 placeholder-slate-600 focus:border-amber-400 focus:outline-none'
                    />
                  </div>
                </div>

                {/* Weekend / Midweek Rates */}
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                  <div>
                    <label className='block text-xs font-semibold text-slate-300 mb-1.5'>
                      Sun–Thu Midweek Package (SEK)
                    </label>
                    <input
                      type='number'
                      step='any'
                      placeholder='Optional, e.g. 4500'
                      value={formPriceSunThu}
                      onChange={(e) => setFormPriceSunThu(e.target.value)}
                      className='w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-600 focus:border-amber-400 focus:outline-none'
                    />
                  </div>
                  <div>
                    <label className='block text-xs font-semibold text-slate-300 mb-1.5'>
                      Thu–Sun Weekend Package (SEK)
                    </label>
                    <input
                      type='number'
                      step='any'
                      placeholder='Optional, e.g. 4900'
                      value={formPriceThuSun}
                      onChange={(e) => setFormPriceThuSun(e.target.value)}
                      className='w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-600 focus:border-amber-400 focus:outline-none'
                    />
                  </div>
                </div>

                {/* Custom Days Toggle */}
                <div className='pt-2 border-t border-slate-800'>
                  <label className='flex items-center gap-2.5 cursor-pointer'>
                    <input
                      type='checkbox'
                      checked={formAllowCustomDays}
                      onChange={(e) => setFormAllowCustomDays(e.target.checked)}
                      className='h-4 w-4 rounded border-slate-700 bg-slate-950 text-amber-500 focus:ring-amber-500 focus:ring-offset-slate-900'
                    />
                    <span className='text-xs font-semibold text-slate-200'>
                      Allow Custom Day Stays (Tiered Stays: 2, 3, 4, 5, 6 days)
                    </span>
                  </label>
                </div>

                {/* Tiered Custom Day Prices */}
                {formAllowCustomDays && (
                  <div className='p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 space-y-3'>
                    <div className='text-[11px] font-semibold text-slate-300'>Tiered Stay Prices (SEK)</div>
                    <div className='grid grid-cols-2 sm:grid-cols-5 gap-2.5'>
                      <div>
                        <label className='block text-[10px] text-slate-400 mb-1'>2 Days</label>
                        <input
                          type='number'
                          step='any'
                          value={formPrice2Days}
                          onChange={(e) => setFormPrice2Days(e.target.value)}
                          className='w-full rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-white focus:border-amber-400 focus:outline-none'
                        />
                      </div>
                      <div>
                        <label className='block text-[10px] text-slate-400 mb-1'>3 Days</label>
                        <input
                          type='number'
                          step='any'
                          value={formPrice3Days}
                          onChange={(e) => setFormPrice3Days(e.target.value)}
                          className='w-full rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-white focus:border-amber-400 focus:outline-none'
                        />
                      </div>
                      <div>
                        <label className='block text-[10px] text-slate-400 mb-1'>4 Days</label>
                        <input
                          type='number'
                          step='any'
                          value={formPrice4Days}
                          onChange={(e) => setFormPrice4Days(e.target.value)}
                          className='w-full rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-white focus:border-amber-400 focus:outline-none'
                        />
                      </div>
                      <div>
                        <label className='block text-[10px] text-slate-400 mb-1'>5 Days</label>
                        <input
                          type='number'
                          step='any'
                          value={formPrice5Days}
                          onChange={(e) => setFormPrice5Days(e.target.value)}
                          className='w-full rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-white focus:border-amber-400 focus:outline-none'
                        />
                      </div>
                      <div>
                        <label className='block text-[10px] text-slate-400 mb-1'>6 Days</label>
                        <input
                          type='number'
                          step='any'
                          value={formPrice6Days}
                          onChange={(e) => setFormPrice6Days(e.target.value)}
                          className='w-full rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-white focus:border-amber-400 focus:outline-none'
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Modal Buttons */}
                <div className='flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800'>
                  <button
                    type='button'
                    onClick={() => setIsModalOpen(false)}
                    className='rounded-xl border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition'>
                    Cancel
                  </button>
                  <button
                    type='submit'
                    disabled={isSaving}
                    className='flex items-center gap-1.5 rounded-xl bg-amber-500 px-5 py-2 text-xs font-semibold text-slate-950 shadow-lg shadow-amber-500/20 hover:bg-amber-400 transition disabled:opacity-50'>
                    {isSaving && <Loader2 className='w-3.5 h-3.5 animate-spin' />}
                    <span>{editingPeriod ? "Save Changes" : "Create Price Period"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Modal Dialog for Blocked Period ("Not for Rent") */}
      {isBlockedModalOpen && (
        <ModalPortal>
          <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200'>
            <div className='relative w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4'>
              <div className='flex items-center justify-between border-b border-slate-800 pb-3'>
                <div className='flex items-center gap-2.5'>
                  <div className='h-8 w-8 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center'>
                    <Ban className='w-4 h-4' />
                  </div>
                  <div>
                    <h3 className='text-base font-bold text-white'>Block Period / Not for Rent</h3>
                    <p className='text-xs text-slate-400'>
                      Object: <span className='text-rose-300 font-semibold'>{selectedObject?.name}</span>
                    </p>
                  </div>
                </div>
                <button
                  type='button'
                  onClick={() => setIsBlockedModalOpen(false)}
                  className='p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition'>
                  <X className='w-5 h-5' />
                </button>
              </div>

              {blockedErrorMessage && (
                <div className='rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-300 flex items-start gap-2'>
                  <AlertTriangle className='w-4 h-4 shrink-0 text-rose-400 mt-0.5' />
                  <span>{blockedErrorMessage}</span>
                </div>
              )}

              <form onSubmit={handleSaveBlocked} className='space-y-4'>
                <div>
                  <label className='block text-xs font-semibold text-slate-300 mb-1'>Reason / Name</label>
                  <input
                    type='text'
                    value={blockedFormName}
                    onChange={(e) => setBlockedFormName(e.target.value)}
                    placeholder='e.g. Winter Closure, Renovation, Private Use'
                    className='w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-rose-500 focus:outline-none'
                  />
                </div>

                <div className='grid grid-cols-2 gap-3'>
                  <div>
                    <label className='block text-xs font-semibold text-slate-300 mb-1'>Start Date</label>
                    <input
                      type='date'
                      required
                      value={blockedFormStartDate}
                      onChange={(e) => setBlockedFormStartDate(e.target.value)}
                      className='w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-rose-500 focus:outline-none'
                    />
                  </div>

                  <div>
                    <label className='block text-xs font-semibold text-slate-300 mb-1'>End Date</label>
                    <input
                      type='date'
                      required
                      value={blockedFormEndDate}
                      onChange={(e) => setBlockedFormEndDate(e.target.value)}
                      className='w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-rose-500 focus:outline-none'
                    />
                  </div>
                </div>

                <div className='rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-[11px] text-slate-400 leading-relaxed'>
                  The unit is automatically marked as unavailable in the website booking calendar and exported as
                  occupied in iCal feeds. No prices need to be specified for this period.
                </div>

                <div className='flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800'>
                  <button
                    type='button'
                    onClick={() => setIsBlockedModalOpen(false)}
                    className='rounded-xl border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition'>
                    Cancel
                  </button>
                  <button
                    type='submit'
                    disabled={isSavingBlocked}
                    className='flex items-center gap-1.5 rounded-xl bg-rose-600 px-5 py-2 text-xs font-semibold text-white shadow-lg shadow-rose-600/30 hover:bg-rose-500 transition disabled:opacity-50'>
                    {isSavingBlocked && <Loader2 className='w-3.5 h-3.5 animate-spin' />}
                    <span>Save Blocked Period</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
}
