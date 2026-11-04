"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
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
  Info,
  CalendarDays,
  Sparkles,
  Ban,
} from "lucide-react";
import { BookingObjectItem } from "./booking-objects-view";
import {
  getWeeksInYear,
  getISOWeek,
  getMondayOfISOWeek,
  getSundayOfISOWeek,
} from "../../utils/weeks";
import {
  MONTH_NAMES_EN,
  MONTH_NAMES_SV,
  WEEKDAY_INITIALS_EN,
  WEEKDAY_INITIALS_SV,
  isFutureYearWarningActive,
  FUTURE_YEAR_WARNING_THRESHOLD_LABEL_EN,
  FUTURE_YEAR_WARNING_THRESHOLD_LABEL_SV,
} from "../../constants/dates";
import type { MissingWeekRange, BlockedPeriodItem } from "../../actions/price-periods";
import { ModalPortal } from "../../components/ui/modal-portal";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { useConfirm } from "../../components/confirm";
import { YearCalendar } from "../components/prices-availability-calendar";
import { useBookingSettingsQuery } from "../../booking/hooks";

export type { MissingWeekRange, BlockedPeriodItem };

export function formatWeekSpan(
  startWeek?: number | null,
  startYear?: number | null,
  endWeek?: number | null,
  endYear?: number | null
): string {
  if (!startWeek) return "";
  const endW = endWeek || startWeek;
  const startY = startYear || null;
  const endY = endYear || startYear || null;

  if (startY && endY && startY !== endY) {
    return `w.${startWeek} ${startY}–w.${endW} ${endY}`;
  }

  const yearSuffix = startY ? ` ${startY}` : "";
  if (startWeek === endW) {
    return `w.${startWeek}${yearSuffix}`;
  }
  return `w.${startWeek}–${endW}${yearSuffix}`;
}

export interface PricePeriodItem {
  id: string;
  object_id: string;
  name: string | null;
  start_date?: string | Date | null;
  end_date?: string | Date | null;
  start_year?: number | null;
  start_week?: number | null;
  end_year?: number | null;
  end_week?: number | null;
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

export interface PricesAvailabilityViewProps {
  objects: BookingObjectItem[];
}

export type ObjectPricesViewProps = PricesAvailabilityViewProps;

export function PricesAvailabilityView({ objects = [] }: PricesAvailabilityViewProps) {
  const t = useTranslations("pricesAvailability");
  const tCommon = useTranslations("common");
  const { confirm } = useConfirm();
  const locale = useLocale();
  const isSv = locale === "sv";

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

  const { data: bookingSettings } = useBookingSettingsQuery();
  const currentSelectedObject = useMemo(() => {
    return objects.find((o) => o.id === selectedObjectId);
  }, [objects, selectedObjectId]);
  const isCustomDaysAllowed = useMemo(() => {
    const scope = bookingSettings?.customDaysScope ?? "GLOBAL";
    const objSettings = (currentSelectedObject?.price_matrix as any)?.booking_settings;
    if (scope === "PER_OBJECT" && objSettings?.allowedBookingPeriods) {
      return objSettings.allowedBookingPeriods === "ALL";
    }
    if (scope === "PER_OBJECT" && objSettings?.allowCustomDays !== undefined) {
      return Boolean(objSettings.allowCustomDays);
    }
    const globalPeriods = bookingSettings?.allowedBookingPeriods;
    if (globalPeriods) {
      return globalPeriods === "ALL";
    }
    return bookingSettings?.allowCustomDays ?? true;
  }, [currentSelectedObject, bookingSettings]);

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

  // Calendar date range selection states
  const [rangeStart, setRangeStart] = useState<string | null>(null);
  const [rangeEnd, setRangeEnd] = useState<string | null>(null);
  const [hoverDate, setHoverDate] = useState<string | null>(null);

  // Price period modal states
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingPeriod, setEditingPeriod] = useState<PricePeriodItem | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Price period form fields (date-based)
  const [formName, setFormName] = useState<string>("");
  const [formStartDate, setFormStartDate] = useState<string>("");
  const [formEndDate, setFormEndDate] = useState<string>("");
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

  const formDateSpanInfo = useMemo(() => {
    if (!formStartDate || !formEndDate) return null;
    const s = new Date(formStartDate);
    const e = new Date(formEndDate);
    if (isNaN(s.getTime()) || isNaN(e.getTime()) || s > e) return null;
    const days = Math.round((e.getTime() - s.getTime()) / 86400000) + 1;
    const sIso = getISOWeek(formStartDate);
    const eIso = getISOWeek(formEndDate);
    const weekLabel = formatWeekSpan(sIso.week, sIso.year, eIso.week, eIso.year);
    return { days, weekLabel };
  }, [formStartDate, formEndDate]);

  // Blocked period ("Not for rent") modal states
  const [isBlockedModalOpen, setIsBlockedModalOpen] = useState<boolean>(false);
  const [blockedFormName, setBlockedFormName] = useState<string>("");
  const [blockedFormStartDate, setBlockedFormStartDate] = useState<string>("");
  const [blockedFormEndDate, setBlockedFormEndDate] = useState<string>("");
  const [isSavingBlocked, setIsSavingBlocked] = useState<boolean>(false);
  const [blockedErrorMessage, setBlockedErrorMessage] = useState<string | null>(null);

  // Close modals on Escape
  useEffect(() => {
    if (!isModalOpen && !isBlockedModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setIsModalOpen(false);
        setIsBlockedModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isModalOpen, isBlockedModalOpen]);

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
      const sY = p.start_date ? new Date(p.start_date).getFullYear() : p.start_year;
      const eY = p.end_date ? new Date(p.end_date).getFullYear() : p.end_year;
      if (sY && sY >= currentActualYear) yearsSet.add(sY);
      if (eY && eY >= currentActualYear) yearsSet.add(eY);
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

  // Effective range from calendar click / selection
  const effectiveRange = useMemo(() => {
    if (!rangeStart) return null;
    const end = rangeEnd || hoverDate || rangeStart;
    const startStr = rangeStart <= end ? rangeStart : end;
    const endStr = rangeStart <= end ? end : rangeStart;
    const sDate = new Date(startStr);
    const eDate = new Date(endStr);
    const daysCount = Math.round((eDate.getTime() - sDate.getTime()) / 86400000) + 1;
    const startIso = getISOWeek(startStr);
    const endIso = getISOWeek(endStr);
    return {
      startStr,
      endStr,
      daysCount,
      startIso,
      endIso,
      isFinalized: Boolean(rangeEnd),
    };
  }, [rangeStart, rangeEnd, hoverDate]);

  const handleDayClick = (dateStr: string) => {
    if (!rangeStart || rangeEnd) {
      setRangeStart(dateStr);
      setRangeEnd(null);
      setHoverDate(null);
    } else {
      if (dateStr < rangeStart) {
        setRangeEnd(rangeStart);
        setRangeStart(dateStr);
      } else {
        setRangeEnd(dateStr);
      }
    }
  };

  const handleClearSelection = () => {
    setRangeStart(null);
    setRangeEnd(null);
    setHoverDate(null);
  };

  // Open modal for Create Price Period
  const handleOpenCreate = () => {
    setEditingPeriod(null);
    setErrorMessage(null);
    setFormName("");
    setFormStartDate(`${selectedYear}-06-01`);
    setFormEndDate(`${selectedYear}-08-31`);
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

  // Open modal for Create Price Period targeting a specific date range
  const handleOpenCreateForRange = (startDate: string, endDate: string) => {
    setEditingPeriod(null);
    setErrorMessage(null);
    setFormName("");
    setFormStartDate(startDate);
    setFormEndDate(endDate);
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
    const mon = getMondayOfISOWeek(selectedYear, week).toISOString().split("T")[0];
    const sun = getSundayOfISOWeek(selectedYear, week).toISOString().split("T")[0];
    handleOpenCreateForRange(mon, sun);
  };

  // Open modal for Create Blocked Period targeting a specific date range
  const handleOpenCreateBlockedForRange = (startDate: string, endDate: string) => {
    setBlockedFormName("");
    setBlockedFormStartDate(startDate);
    setBlockedFormEndDate(endDate);
    setBlockedErrorMessage(null);
    setIsBlockedModalOpen(true);
  };

  // Open modal for Edit Price Period
  const handleOpenEdit = (period: PricePeriodItem) => {
    setEditingPeriod(period);
    setErrorMessage(null);
    setFormName(period.name || "");
    const sDateStr = period.start_date
      ? new Date(period.start_date).toISOString().split("T")[0]
      : period.start_year && period.start_week
      ? getMondayOfISOWeek(period.start_year, period.start_week).toISOString().split("T")[0]
      : `${selectedYear}-06-01`;
    const eDateStr = period.end_date
      ? new Date(period.end_date).toISOString().split("T")[0]
      : period.end_year && period.end_week
      ? getSundayOfISOWeek(period.end_year, period.end_week).toISOString().split("T")[0]
      : `${selectedYear}-08-31`;
    setFormStartDate(sDateStr);
    setFormEndDate(eDateStr);
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
    const sDateStr = period.start_date
      ? new Date(period.start_date).toISOString().split("T")[0]
      : period.start_year && period.start_week
      ? getMondayOfISOWeek(period.start_year, period.start_week).toISOString().split("T")[0]
      : `${selectedYear}-06-01`;
    const eDateStr = period.end_date
      ? new Date(period.end_date).toISOString().split("T")[0]
      : period.end_year && period.end_week
      ? getSundayOfISOWeek(period.end_year, period.end_week).toISOString().split("T")[0]
      : `${selectedYear}-08-31`;
    setFormStartDate(sDateStr);
    setFormEndDate(eDateStr);
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
      startDate: formStartDate,
      endDate: formEndDate,
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
        throw new Error(data?.error || t("errorSaveSeason"));
      }

      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      setErrorMessage(err.message || t("errorUnexpected"));
    } finally {
      setIsSaving(false);
    }
  };

  // Delete handler for Price Period
  const handleDelete = async (id: string, name: string | null) => {
    const displayName = name ? `"${name}"` : t("modal.periodName");
    await confirm({
      title: tCommon("delete"),
      description: t("confirmDeleteSeason", { name: displayName }),
      variant: "destructive",
      onConfirm: async () => {
        const res = await fetch(`/api/cms/price-periods/${id}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          const data = await res.json().catch(() => null);
          throw new Error(data?.error || t("errorDeleteSeason"));
        }
        await loadData();
      },
    });
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
          name: blockedFormName.trim() || t("defaultBlockedReason"),
          startDate: blockedFormStartDate,
          endDate: blockedFormEndDate,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || t("errorSaveBlocked"));
      }

      setIsBlockedModalOpen(false);
      await loadData();
    } catch (err: any) {
      setBlockedErrorMessage(err.message || t("errorUnexpected"));
    } finally {
      setIsSavingBlocked(false);
    }
  };

  // Delete handler for Blocked Period
  const handleDeleteBlocked = async (id: string, name: string) => {
    await confirm({
      title: tCommon("delete"),
      description: t("confirmDeleteBlocked", { name }),
      variant: "destructive",
      onConfirm: async () => {
        const res = await fetch(`/api/cms/price-periods/blocked/${id}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          const data = await res.json().catch(() => null);
          throw new Error(data?.error || t("errorDeleteBlocked"));
        }
        await loadData();
      },
    });
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

        // Check if inside a price period by date
        const iso = getISOWeek(dateStr);
        const score = iso.year * 100 + iso.week;
        const priceMatch = periods.find((p) => {
          if (p.start_date && p.end_date) {
            const s = new Date(p.start_date).toISOString().split("T")[0];
            const e = new Date(p.end_date).toISOString().split("T")[0];
            return dateStr >= s && dateStr <= e;
          }
          const pStart = (p.start_year || 0) * 100 + (p.start_week || 0);
          const pEnd = (p.end_year || 0) * 100 + (p.end_week || 0);
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
        name: (isSv ? MONTH_NAMES_SV : MONTH_NAMES_EN)[m],
        firstDayWeekday,
        days,
        weeks,
      });
    }

    return months;
  }, [selectedYear, currentActualYear, blockedPeriods, periods, isSv]);

  return (
    <div className='space-y-6'>
      {/* Top Header Card */}
      <Card variant="admin" className='p-6 backdrop-blur shadow-xl'>
        <div className='flex flex-col md:flex-row md:items-center justify-between gap-4'>
          <div className='flex items-center gap-3'>
            <div className='h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/20'>
              <Coins className='w-5 h-5' />
            </div>
            <div>
              <h1 className='text-xl font-bold text-white tracking-tight'>{t("title")}</h1>
              <p className='text-xs text-slate-400'>
                {t("subtitle")}
              </p>
            </div>
          </div>

          <div className='flex flex-wrap items-center gap-3'>
            {/* Object selector */}
            <div className='flex items-center gap-2 bg-slate-950/70 border border-slate-800 rounded-xl px-3 py-1.5'>
              <label htmlFor='price-object-select' className='text-xs text-slate-400 cursor-pointer'>{t("object")}</label>
              <select
                id='price-object-select'
                aria-label={t("object")}
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
              <label htmlFor='price-year-select' className='text-xs text-slate-400 cursor-pointer'>{t("year")}</label>
              <select
                id='price-year-select'
                aria-label={t("year")}
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
            <Button
              type='button'
              variant='outline'
              onClick={handleOpenCreateBlocked}
              disabled={!selectedObjectId}
              className='h-auto rounded-xl border-rose-500/40 bg-rose-500/10 px-3.5 py-2 text-xs font-semibold text-rose-300 shadow-sm hover:bg-rose-500/20 hover:text-rose-200 transition disabled:opacity-50'>
              <Plus className='w-4 h-4 text-rose-400' />
              <span>{t("blockPeriod")}</span>
            </Button>

            {/* New Price Period Button */}
            <Button
              type='button'
              onClick={handleOpenCreate}
              disabled={!selectedObjectId}
              className='h-auto rounded-xl bg-amber-500 px-4 py-2 text-xs font-semibold text-slate-950 shadow-lg shadow-amber-500/20 hover:bg-amber-400 transition disabled:opacity-50 border-none'>
              <Plus className='w-4 h-4' />
              <span>{t("newPricePeriod")}</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* Rental Season Status Banner */}
      {selectedObjectId && (
        <>
          {periods.length === 0 ? (
            <div className='rounded-xl border border-slate-700/60 bg-slate-900/60 p-4 text-slate-300 flex items-start gap-3'>
              <Info className='w-5 h-5 text-slate-400 shrink-0 mt-0.5' />
              <div className='text-xs space-y-1'>
                <div className='font-semibold text-white'>
                  {t("noSeasonConfigured", { name: selectedObject?.name || "this object", year: selectedYear })}
                </div>
                <div className='text-slate-400 leading-relaxed'>
                  {t("outsideDatesClosed")}
                </div>
              </div>
            </div>
          ) : (
            <div className='rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-emerald-300 flex items-center justify-between gap-3 text-xs'>
              <div className='flex items-center gap-2.5'>
                <CheckCircle2 className='w-4 h-4 text-emerald-400 shrink-0' />
                <span>
                  {t("rentalSeasonActive", {
                    year: selectedYear,
                    count: periods.length,
                    plural: periods.length === 1 ? t("period") : t("periods"),
                    name: selectedObject?.name || "this object",
                  })}
                  {blockedPeriods.length > 0 &&
                    t("blockedOverrideNotice", {
                      count: blockedPeriods.length,
                      plural: blockedPeriods.length === 1 ? t("blockedPeriod") : t("blockedPeriods"),
                    })}
                </span>
              </div>
            </div>
          )}
        </>
      )}

      {/* Price Periods Table */}
      <Card variant="admin" className='overflow-hidden shadow-xl'>
        <div className='p-4 border-b border-slate-800 flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <CalendarDays className='w-4 h-4 text-slate-400' />
            <h2 className='text-sm font-semibold text-white'>
              {t("periodsTitle", { name: selectedObject?.name || "Object", year: selectedYear })}
            </h2>
          </div>
          <div className='flex items-center gap-3'>
            <span className='text-xs text-slate-400'>
              {t("periodsConfigured", {
                count: periods.length,
                plural: periods.length === 1 ? t("period") : t("periods"),
              })}
            </span>
            <Button
              type='button'
              onClick={handleOpenCreate}
              disabled={!selectedObjectId}
              className='h-auto rounded-xl bg-amber-500 px-3 py-1.5 text-xs font-semibold text-slate-950 shadow-md shadow-amber-500/20 hover:bg-amber-400 transition disabled:opacity-50 border-none'>
              <Plus className='w-3.5 h-3.5' />
              <span>{t("newPricePeriod")}</span>
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className='p-12 text-center text-slate-400 flex items-center justify-center gap-2'>
            <Loader2 className='w-5 h-5 animate-spin text-amber-400' />
            <span className='text-xs'>{t("loading")}</span>
          </div>
        ) : periods.length === 0 ? (
          <div className='p-12 text-center text-slate-400 space-y-3'>
            <Coins className='w-8 h-8 mx-auto text-slate-600' />
            <div className='text-sm font-medium text-slate-300'>{t("noPeriodsConfigured")}</div>
            <p className='text-xs text-slate-500 max-w-sm mx-auto'>
              {t("noPeriodsDesc", { name: selectedObject?.name || "this object", year: selectedYear })}
            </p>
            <Button
              type='button'
              onClick={handleOpenCreate}
              className='h-auto inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-xs font-semibold text-slate-950 shadow-lg shadow-amber-500/20 hover:bg-amber-400 transition border-none'>
              <Plus className='w-4 h-4' />
              <span>{t("newPricePeriod")}</span>
            </Button>
          </div>
        ) : (
          <div className='overflow-x-auto'>
            <table className='w-full text-left text-xs'>
              <thead className='bg-slate-950/60 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[10px]'>
                <tr>
                  <th className='py-3 px-4'>{t("colPeriodName")}</th>
                  <th className='py-3 px-4 text-center'>{t("colDateRange")}</th>
                  {isCustomDaysAllowed && (
                    <th className='py-3 px-4 text-center'>{t("colCustomDays")}</th>
                  )}
                  {isCustomDaysAllowed && (
                    <th className='py-3 px-4 text-right'>{t("colDaily")}</th>
                  )}
                  <th className='py-3 px-4 text-right'>{t("colSunThu")}</th>
                  <th className='py-3 px-4 text-right'>{t("colThuSun")}</th>
                  <th className='py-3 px-4 text-right font-bold text-slate-300'>{t("colFullWeek")}</th>
                  <th className='py-3 px-4 text-center'>{t("colActions")}</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-slate-800/60 text-slate-200'>
                {periods.map((period) => (
                  <tr key={period.id} className='hover:bg-slate-800/30 transition'>
                    <td className='py-3.5 px-4'>
                      <div className='font-semibold text-white'>
                        {period.name || <span className='text-slate-500 italic'>{t("unnamedPeriod")}</span>}
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
                      <div className='flex flex-col items-center gap-0.5'>
                        {period.start_date && period.end_date ? (
                          <>
                            <span className='font-mono text-white text-[11px] font-medium'>
                              {new Date(period.start_date).toISOString().split("T")[0]} – {new Date(period.end_date).toISOString().split("T")[0]}
                            </span>
                            <span className='inline-flex items-center px-1.5 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300 font-mono text-[10px]'>
                              {formatWeekSpan(period.start_week, period.start_year, period.end_week, period.end_year)}
                            </span>
                          </>
                        ) : (
                          <span className='inline-flex items-center px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300 font-mono text-[11px]'>
                            {formatWeekSpan(period.start_week, period.start_year, period.end_week, period.end_year)}
                          </span>
                        )}
                      </div>
                    </td>
                    {isCustomDaysAllowed && (
                      <td className='py-3.5 px-4 text-center'>
                        {period.allow_custom_days ? (
                          <span className='inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 text-[11px] font-medium border border-emerald-500/30'>
                            <CheckCircle2 className='w-3 h-3' />
                            <span>{t("allowed")}</span>
                          </span>
                        ) : (
                          <span className='inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 text-[11px] font-medium border border-slate-700'>
                            <span>{t("fullWeekOnly")}</span>
                          </span>
                        )}
                      </td>
                    )}
                    {isCustomDaysAllowed && (
                      <td className='py-3.5 px-4 text-right font-medium'>{formatKr(period.price_day)}</td>
                    )}
                    <td className='py-3.5 px-4 text-right font-medium'>{formatKr(period.price_sun_thu)}</td>
                    <td className='py-3.5 px-4 text-right font-medium'>{formatKr(period.price_thu_sun)}</td>
                    <td className='py-3.5 px-4 text-right font-bold text-amber-300'>{formatKr(period.price_week)}</td>
                    <td className='py-3.5 px-4 text-center'>
                      <div className='flex items-center justify-center gap-1.5'>
                        <button
                          type='button'
                          onClick={() => handleOpenDuplicate(period)}
                          title={t("modal.duplicate")}
                          aria-label={t("modal.duplicate")}
                          className='p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition outline-none focus-visible:ring-2 focus-visible:ring-amber-500'>
                          <Copy className='w-3.5 h-3.5' />
                        </button>
                        <button
                          type='button'
                          onClick={() => handleOpenEdit(period)}
                          title={t("modal.editSeasonTitle")}
                          aria-label={t("modal.editSeasonTitle")}
                          className='p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition outline-none focus-visible:ring-2 focus-visible:ring-sky-500'>
                          <Edit3 className='w-3.5 h-3.5' />
                        </button>
                        <button
                          type='button'
                          onClick={() => handleDelete(period.id, period.name)}
                          title={tCommon("delete")}
                          aria-label={tCommon("delete")}
                          className='p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition outline-none focus-visible:ring-2 focus-visible:ring-rose-500'>
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
      </Card>

      {/* Blocked Dates (Private Use & Maintenance) Section */}
      <Card variant="admin" className='overflow-hidden shadow-xl'>
        <div className='p-4 border-b border-slate-800 flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <Ban className='w-4 h-4 text-rose-400' />
            <h2 className='text-sm font-semibold text-white'>
              {t("blockedTab")} ({selectedObject?.name || "Object"} – {selectedYear})
            </h2>
          </div>
          <div className='flex items-center gap-3'>
            <span className='text-xs text-slate-400'>
              {blockedPeriods.length} {blockedPeriods.length === 1 ? t("period") : t("periods")}
            </span>
            <Button
              type='button'
              variant='outline'
              onClick={handleOpenCreateBlocked}
              disabled={!selectedObjectId}
              className='h-auto rounded-xl border-rose-500/40 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 hover:text-rose-200 transition disabled:opacity-50'>
              <Plus className='w-3.5 h-3.5' />
              <span>{t("newBlocked")}</span>
            </Button>
          </div>
        </div>

        {blockedPeriods.length === 0 ? (
          <div className='p-8 text-center text-slate-400 space-y-2'>
            <Ban className='w-7 h-7 mx-auto text-slate-600' />
            <div className='text-xs font-medium text-slate-300'>{t("noBlockedRegistered", { year: selectedYear })}</div>
            <p className='text-[11px] text-slate-500 max-w-md mx-auto'>
              {t("blockedHelpDesc")}
            </p>
          </div>
        ) : (
          <div className='overflow-x-auto'>
            <table className='w-full text-left text-xs'>
              <thead className='bg-slate-950/60 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[10px]'>
                <tr>
                  <th className='py-3 px-4'>{t("blockedTable.reason")}</th>
                  <th className='py-3 px-4'>{t("blockedTable.dates")}</th>
                  <th className='py-3 px-4 text-center'>{t("blockedTable.duration")}</th>
                  <th className='py-3 px-4'>{tCommon("status")}</th>
                  <th className='py-3 px-4 text-center'>{t("blockedTable.actions")}</th>
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
                          {days} {days === 1 ? t("daySingle") : t("dayPlural")}
                        </span>
                      </td>
                      <td className='py-3.5 px-4 text-slate-400 text-[11px]'>
                        {t("blockedStatusHelp")}
                      </td>
                      <td className='py-3.5 px-4 text-center'>
                        <button
                          type='button'
                          onClick={() => handleDeleteBlocked(bp.id, bp.name)}
                          title={tCommon("delete")}
                          aria-label={tCommon("delete")}
                          className='p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition outline-none focus-visible:ring-2 focus-visible:ring-rose-500'>
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
      </Card>

      {/* Year Calendar Matrix Visualization */}
      {selectedObjectId && (
        <YearCalendar
          objectName={selectedObject?.name}
          selectedYear={selectedYear}
          showYearCalendar={showYearCalendar}
          onToggleShowCalendar={() => setShowYearCalendar(!showYearCalendar)}
          effectiveRange={effectiveRange}
          rangeStart={rangeStart}
          rangeEnd={rangeEnd}
          calendarMonths={calendarMonths}
          isSv={isSv}
          weekdayInitials={isSv ? WEEKDAY_INITIALS_SV : WEEKDAY_INITIALS_EN}
          onCreatePricePeriodForRange={handleOpenCreateForRange}
          onCreateBlockedPeriodForRange={handleOpenCreateBlockedForRange}
          onClearSelection={handleClearSelection}
          onDayClick={handleDayClick}
          onHoverDate={setHoverDate}
          onSelectWeek={(weekNumber) => {
            const mon = getMondayOfISOWeek(selectedYear, weekNumber).toISOString().split("T")[0];
            const sun = getSundayOfISOWeek(selectedYear, weekNumber).toISOString().split("T")[0];
            setRangeStart(mon);
            setRangeEnd(sun);
          }}
          formatWeekSpan={formatWeekSpan}
        />
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
                      {editingPeriod ? t("modal.editSeasonTitle") : t("modal.createSeasonTitle")}
                    </h3>
                    <p className='text-xs text-slate-400'>
                      {t("modalObjectLabel")} <span className='text-amber-300 font-semibold'>{selectedObject?.name}</span>
                    </p>
                  </div>
                </div>
                <button
                  type='button'
                  onClick={() => setIsModalOpen(false)}
                  aria-label={tCommon("cancel")}
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
                      <span>{t("modal.copyFromExisting")}</span>
                    </label>
                    <select
                      defaultValue=''
                      onChange={(e) => {
                        if (e.target.value) handleCopyFromPeriod(e.target.value);
                      }}
                      className='w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-200 focus:border-amber-400 focus:outline-none'>
                      <option value='' disabled>
                        {t("modal.copyPlaceholder")}
                      </option>
                      {allPeriodsForCopy.map((p) => {
                        const objName = p.object?.name || "Unknown object";
                        const sStr = p.start_date
                          ? new Date(p.start_date).toISOString().split("T")[0]
                          : p.start_week
                          ? `w.${p.start_week}`
                          : "";
                        const eStr = p.end_date
                          ? new Date(p.end_date).toISOString().split("T")[0]
                          : p.end_week
                          ? `w.${p.end_week}`
                          : "";
                        const dateSpan = sStr && eStr ? ` (${sStr} to ${eStr})` : "";
                        return (
                          <option key={p.id} value={p.id}>
                            {objName}: {p.name || "Period"}{dateSpan}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                )}

                {/* Name */}
                <div>
                  <label className='block text-xs font-semibold text-slate-300 mb-1.5'>{t("modal.periodName")}</label>
                  <input
                    type='text'
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder={t("modal.periodNamePlaceholder")}
                    className='w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none'
                  />
                </div>

                {/* Date Span */}
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                  <div>
                    <label className='block text-xs font-semibold text-slate-300 mb-1.5'>{t("modal.startDate")}</label>
                    <input
                      type='date'
                      required
                      value={formStartDate}
                      onChange={(e) => setFormStartDate(e.target.value)}
                      className='w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-amber-400 focus:outline-none'
                    />
                  </div>
                  <div>
                    <label className='block text-xs font-semibold text-slate-300 mb-1.5'>{t("modal.endDate")}</label>
                    <input
                      type='date'
                      required
                      value={formEndDate}
                      onChange={(e) => setFormEndDate(e.target.value)}
                      className='w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-amber-400 focus:outline-none'
                    />
                  </div>
                </div>

                {formDateSpanInfo && (
                  <div className='rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-2 text-xs text-amber-200 flex items-center justify-between'>
                    <span>
                      {t("modal.duration")}{" "}
                      <strong className='text-amber-100 font-semibold'>
                        {t("modal.durationDays", { days: formDateSpanInfo.days })}
                      </strong>
                    </span>
                    <span className='font-mono text-[11px] bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30'>
                      {formDateSpanInfo.weekLabel}
                    </span>
                  </div>
                )}

                {/* Base Prices: Daily & Weekly */}
                <div className={`grid gap-3 pt-2 border-t border-slate-800 ${isCustomDaysAllowed ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"}`}>
                  {isCustomDaysAllowed && (
                    <div>
                      <label className='block text-xs font-semibold text-slate-300 mb-1.5'>{t("modal.dailyBasePrice")}</label>
                      <input
                        type='number'
                        step='any'
                        placeholder={t("modal.priceOptionalPlaceholder", { amount: "1500" })}
                        value={formPriceDay}
                        onChange={(e) => setFormPriceDay(e.target.value)}
                        className='w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-600 focus:border-amber-400 focus:outline-none'
                      />
                    </div>
                  )}
                  <div>
                    <label className='block text-xs font-semibold text-amber-300 mb-1.5'>{t("modal.priceWeek")}</label>
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
                      {t("modal.priceSunThu")}
                    </label>
                    <input
                      type='number'
                      step='any'
                      placeholder={t("modal.priceOptionalPlaceholder", { amount: "4500" })}
                      value={formPriceSunThu}
                      onChange={(e) => setFormPriceSunThu(e.target.value)}
                      className='w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-600 focus:border-amber-400 focus:outline-none'
                    />
                  </div>
                  <div>
                    <label className='block text-xs font-semibold text-slate-300 mb-1.5'>
                      {t("modal.priceThuSun")}
                    </label>
                    <input
                      type='number'
                      step='any'
                      placeholder={t("modal.priceOptionalPlaceholder", { amount: "4900" })}
                      value={formPriceThuSun}
                      onChange={(e) => setFormPriceThuSun(e.target.value)}
                      className='w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-600 focus:border-amber-400 focus:outline-none'
                    />
                  </div>
                </div>

                {/* Custom Days Toggle & Tiered Prices (only if custom days are enabled for this unit) */}
                {isCustomDaysAllowed && (
                  <>
                    <div className='pt-2 border-t border-slate-800'>
                      <label className='flex items-center gap-2.5 cursor-pointer'>
                        <input
                          type='checkbox'
                          checked={formAllowCustomDays}
                          onChange={(e) => setFormAllowCustomDays(e.target.checked)}
                          className='h-4 w-4 rounded border-slate-700 bg-slate-950 text-amber-500 focus:ring-amber-500 focus:ring-offset-slate-900'
                        />
                        <span className='text-xs font-semibold text-slate-200'>
                          {t("modal.allowCustomDays")}
                        </span>
                      </label>
                    </div>

                    {formAllowCustomDays && (
                      <div className='p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 space-y-3'>
                        <div className='text-[11px] font-semibold text-slate-300'>{t("modal.tieredPricesTitle")}</div>
                        <div className='grid grid-cols-2 sm:grid-cols-5 gap-2.5'>
                          <div>
                            <label className='block text-[10px] text-slate-400 mb-1'>{t("modal.daysCount", { count: 2 })}</label>
                            <input
                              type='number'
                              step='any'
                              value={formPrice2Days}
                              onChange={(e) => setFormPrice2Days(e.target.value)}
                              className='w-full rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-white focus:border-amber-400 focus:outline-none'
                            />
                          </div>
                          <div>
                            <label className='block text-[10px] text-slate-400 mb-1'>{t("modal.daysCount", { count: 3 })}</label>
                            <input
                              type='number'
                              step='any'
                              value={formPrice3Days}
                              onChange={(e) => setFormPrice3Days(e.target.value)}
                              className='w-full rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-white focus:border-amber-400 focus:outline-none'
                            />
                          </div>
                          <div>
                            <label className='block text-[10px] text-slate-400 mb-1'>{t("modal.daysCount", { count: 4 })}</label>
                            <input
                              type='number'
                              step='any'
                              value={formPrice4Days}
                              onChange={(e) => setFormPrice4Days(e.target.value)}
                              className='w-full rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-white focus:border-amber-400 focus:outline-none'
                            />
                          </div>
                          <div>
                            <label className='block text-[10px] text-slate-400 mb-1'>{t("modal.daysCount", { count: 5 })}</label>
                            <input
                              type='number'
                              step='any'
                              value={formPrice5Days}
                              onChange={(e) => setFormPrice5Days(e.target.value)}
                              className='w-full rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-white focus:border-amber-400 focus:outline-none'
                            />
                          </div>
                          <div>
                            <label className='block text-[10px] text-slate-400 mb-1'>{t("modal.daysCount", { count: 6 })}</label>
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
                  </>
                )}

                {/* Modal Buttons */}
                <div className='flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800'>
                  <Button
                    type='button'
                    variant='outline'
                    onClick={() => setIsModalOpen(false)}
                    className='h-auto rounded-xl border-slate-700 bg-transparent px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition'>
                    {tCommon("cancel")}
                  </Button>
                  <Button
                    type='submit'
                    disabled={isSaving}
                    className='h-auto flex items-center gap-1.5 rounded-xl bg-amber-500 px-5 py-2 text-xs font-semibold text-slate-950 shadow-lg shadow-amber-500/20 hover:bg-amber-400 transition disabled:opacity-50 border-none'>
                    {isSaving && <Loader2 className='w-3.5 h-3.5 animate-spin' />}
                    <span>{editingPeriod ? tCommon("save") : t("newSeason")}</span>
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Modal Dialog for Blocked Dates (Private & Maintenance) */}
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
                    <h3 className='text-base font-bold text-white'>{t("modal.createBlockedTitle")}</h3>
                    <p className='text-xs text-slate-400'>
                      {t("modalObjectLabel")} <span className='text-rose-300 font-semibold'>{selectedObject?.name}</span>
                    </p>
                  </div>
                </div>
                <button
                  type='button'
                  onClick={() => setIsBlockedModalOpen(false)}
                  aria-label={tCommon("cancel")}
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
                  <label className='block text-xs font-semibold text-slate-300 mb-1'>{t("modal.reason")}</label>
                  <input
                    type='text'
                    value={blockedFormName}
                    onChange={(e) => setBlockedFormName(e.target.value)}
                    placeholder={t("modal.reasonPlaceholder")}
                    className='w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-rose-500 focus:outline-none'
                  />
                </div>

                <div className='grid grid-cols-2 gap-3'>
                  <div>
                    <label className='block text-xs font-semibold text-slate-300 mb-1'>{t("modal.startDate")}</label>
                    <input
                      type='date'
                      required
                      value={blockedFormStartDate}
                      onChange={(e) => setBlockedFormStartDate(e.target.value)}
                      className='w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-rose-500 focus:outline-none'
                    />
                  </div>

                  <div>
                    <label className='block text-xs font-semibold text-slate-300 mb-1'>{t("modal.endDate")}</label>
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
                  {t("modal.blockedHelpP1")}
                </div>

                <div className='flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800'>
                  <Button
                    type='button'
                    variant='outline'
                    onClick={() => setIsBlockedModalOpen(false)}
                    className='h-auto rounded-xl border-slate-700 bg-transparent px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition'>
                    {tCommon("cancel")}
                  </Button>
                  <Button
                    type='submit'
                    disabled={isSavingBlocked}
                    className='h-auto flex items-center gap-1.5 rounded-xl bg-rose-600 px-5 py-2 text-xs font-semibold text-white shadow-lg shadow-rose-600/30 hover:bg-rose-500 transition disabled:opacity-50 border-none'>
                    {isSavingBlocked && <Loader2 className='w-3.5 h-3.5 animate-spin' />}
                    <span>{tCommon("save")}</span>
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
}

export const ObjectPricesView = PricesAvailabilityView;
