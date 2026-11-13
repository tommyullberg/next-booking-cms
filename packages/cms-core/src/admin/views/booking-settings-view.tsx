"use client";

import React, { useState, useEffect, useId } from "react";
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
  CalendarDays,
  ShieldCheck,
  Search,
} from "lucide-react";
import {
  Alert,
  Badge,
  Button,
  Card,
  FormField,
  Input,
  Label,
  NativeSelect,
  SegmentedControl,
  SelectableCard,
  SelectableCardGroup,
} from "@cms/components/ui";
import {
  BookingSettings,
  DEFAULT_BOOKING_SETTINGS,
  DefaultTurnoverDay,
  BookingSettingScope,
  AllowedBookingPeriods,
} from "@cms/types/settings";

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

  const checkInTimeId = useId();
  const checkOutTimeId = useId();

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
            <Sliders className="cms-icon-lg" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              {t("title")}
            </h1>
            <p className="cms-text-meta mt-0.5">{t("subtitle")}</p>
          </div>
        </div>

        <Button
          type="submit"
          variant="adminPrimary"
          size="default"
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <Loader2 className="cms-icon-md animate-spin" />
              <span>{t("saving")}</span>
            </>
          ) : (
            <>
              <Save className="cms-icon-md" />
              <span>{t("saveBtn")}</span>
            </>
          )}
        </Button>
      </div>

      {/* Success / Error notification banner */}
      {savedSuccess && (
        <Alert variant="success" className="animate-in fade-in">
          {t("saveSuccess")}
        </Alert>
      )}

      {errorMsg && (
        <Alert variant="destructive">
          {errorMsg}
        </Alert>
      )}

      {/* Section 1: Default turnover day */}
      <Card variant="admin" className="p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2 text-white">
            <Calendar className="cms-icon-md text-sky-400" />
            <h2 className="text-sm font-semibold text-white">
              {t("turnoverDaySectionTitle")}
            </h2>
          </div>

          {/* Scope selector */}
          <SegmentedControl<BookingSettingScope>
            size="sm"
            aria-label={t("turnoverDaySectionTitle")}
            value={turnoverDayScope}
            onChange={setTurnoverDayScope}
            options={[
              {
                value: "GLOBAL",
                label: t("scopeGlobal"),
                icon: <Globe className="cms-icon-xs" />,
              },
              {
                value: "PER_OBJECT",
                label: t("scopePerObject"),
                icon: <Layers className="cms-icon-xs" />,
              },
            ]}
          />
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          {t("turnoverDaySectionDesc")}
        </p>

        <SelectableCardGroup<DefaultTurnoverDay>
          value={turnoverDay}
          onChange={setTurnoverDay}
          aria-label={t("turnoverDaySectionTitle")}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1"
        >
          {/* Sunday card */}
          <SelectableCard
            value="SUNDAY"
            indicator="radio"
            className="p-4 justify-between"
          >
            <div>
              <div className="flex items-center gap-2 mb-2 pr-8">
                <span className="text-sm font-bold text-white">
                  {t("sundayTitle")}
                </span>
                <Badge variant="adminSuccess" size="xs">
                  <Sparkles className="w-2.5 h-2.5" />
                  {t("sundayBadge")}
                </Badge>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {t("sundayDesc")}
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center gap-2 cms-text-code text-slate-500">
              <span>Söndag → Söndag</span>
              <span className="text-slate-600">•</span>
              <span>Delvecka: Tors–Sön / Sön–Tors</span>
            </div>
          </SelectableCard>

          {/* Saturday card */}
          <SelectableCard
            value="SATURDAY"
            indicator="radio"
            className="p-4 justify-between"
          >
            <div>
              <div className="flex items-center gap-2 mb-2 pr-8">
                <span className="text-sm font-bold text-white">
                  {t("saturdayTitle")}
                </span>
                <Badge variant="adminWarning" size="xs">
                  {t("saturdayBadge")}
                </Badge>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {t("saturdayDesc")}
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center gap-2 cms-text-code text-slate-500">
              <span>Lördag → Lördag</span>
              <span className="text-slate-600">•</span>
              <span>Traditionell högsommarmodell</span>
            </div>
          </SelectableCard>
        </SelectableCardGroup>
      </Card>

      {/* Section 2: Check-in and Check-out Times */}
      <Card variant="admin" className="p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2 text-white">
            <Clock className="cms-icon-md text-emerald-400" />
            <h2 className="text-sm font-semibold text-white">
              {t("checkTimesSectionTitle")}
            </h2>
          </div>

          {/* Scope selector */}
          <SegmentedControl<BookingSettingScope>
            size="sm"
            aria-label={t("checkTimesSectionTitle")}
            value={checkTimesScope}
            onChange={setCheckTimesScope}
            options={[
              {
                value: "GLOBAL",
                label: t("scopeGlobal"),
                icon: <Globe className="cms-icon-xs" />,
              },
              {
                value: "PER_OBJECT",
                label: t("scopePerObject"),
                icon: <Layers className="cms-icon-xs" />,
              },
            ]}
          />
        </div>

        <p className="cms-text-meta leading-relaxed">
          {t("checkTimesSectionDesc")}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-1">
          {/* Check-in time */}
          <Card variant="adminSubtle" className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Label
                htmlFor={checkInTimeId}
                variant="admin"
                className="flex items-center gap-1.5 font-semibold text-slate-200"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                {t("checkInTimeLabel")}
              </Label>
              <span className="cms-text-caption font-mono text-slate-500">
                Default: 15:00
              </span>
            </div>
            <Input
              id={checkInTimeId}
              type="time"
              value={checkInTime}
              onChange={(e) => setCheckInTime(e.target.value)}
              size="sm"
              variant="admin"
              className="font-mono text-sm"
              required
            />
            <p className="cms-text-meta leading-normal">
              {t("checkInTimeHelp")}
            </p>
            <div className="flex items-center gap-1.5 pt-1">
              <span className="cms-text-caption text-slate-500">Snabbval:</span>
              {["14:00", "15:00", "16:00"].map((tPreset) => (
                <Button
                  key={tPreset}
                  type="button"
                  variant={checkInTime === tPreset ? "adminPrimary" : "adminSecondary"}
                  size="xs"
                  className="font-mono"
                  aria-label={`${t("checkInTimeLabel")}: ${tPreset}`}
                  onClick={() => setCheckInTime(tPreset)}
                >
                  {tPreset}
                </Button>
              ))}
            </div>
          </Card>

          {/* Check-out time */}
          <Card variant="adminSubtle" className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Label
                htmlFor={checkOutTimeId}
                variant="admin"
                className="flex items-center gap-1.5 font-semibold text-slate-200"
              >
                <span className="w-2 h-2 rounded-full bg-rose-400" />
                {t("checkOutTimeLabel")}
              </Label>
              <span className="cms-text-caption font-mono text-slate-500">
                Default: 11:00
              </span>
            </div>
            <Input
              id={checkOutTimeId}
              type="time"
              value={checkOutTime}
              onChange={(e) => setCheckOutTime(e.target.value)}
              size="sm"
              variant="admin"
              className="font-mono text-sm"
              required
            />
            <p className="cms-text-meta leading-normal">
              {t("checkOutTimeHelp")}
            </p>
            <div className="flex items-center gap-1.5 pt-1">
              <span className="cms-text-caption text-slate-500">Snabbval:</span>
              {["10:00", "11:00", "12:00"].map((tPreset) => (
                <Button
                  key={tPreset}
                  type="button"
                  variant={checkOutTime === tPreset ? "adminPrimary" : "adminSecondary"}
                  size="xs"
                  className="font-mono"
                  aria-label={`${t("checkOutTimeLabel")}: ${tPreset}`}
                  onClick={() => setCheckOutTime(tPreset)}
                >
                  {tPreset}
                </Button>
              ))}
            </div>
          </Card>
        </div>
      </Card>

      {/* Section 3: Allowed booking periods */}
      <Card variant="admin" className="p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2 text-white">
            <CalendarDays className="cms-icon-md text-purple-400" />
            <h2 className="text-sm font-semibold text-white">
              {t("customDaysSectionTitle")}
            </h2>
          </div>

          {/* Scope selector */}
          <SegmentedControl<BookingSettingScope>
            size="sm"
            aria-label={t("customDaysSectionTitle")}
            value={customDaysScope}
            onChange={setCustomDaysScope}
            options={[
              {
                value: "GLOBAL",
                label: t("scopeGlobal"),
                icon: <Globe className="cms-icon-xs" />,
              },
              {
                value: "PER_OBJECT",
                label: t("scopePerObject"),
                icon: <Layers className="cms-icon-xs" />,
              },
            ]}
          />
        </div>

        <p className="cms-text-meta leading-relaxed">
          {t("customDaysSectionDesc")}
        </p>

        <SelectableCardGroup<AllowedBookingPeriods>
          value={allowedBookingPeriods}
          onChange={setAllowedBookingPeriods}
          aria-label={t("customDaysSectionTitle")}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1"
        >
          {/* 1. Allow custom number of days */}
          <SelectableCard
            value="ALL"
            indicator="radio"
            className="p-4 justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2 pr-8">
                <span className="text-sm font-bold text-white">
                  {t("customDaysAllowedTitle")}
                </span>
              </div>
              <p className="cms-text-meta leading-relaxed">
                {t("customDaysAllowedDesc")}
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center gap-2 cms-text-code text-emerald-400">
              <CheckCircle2 className="cms-icon-sm shrink-0" />
              <span>Valfria nätter (1–6 dygn samt helveckor)</span>
            </div>
          </SelectableCard>

          {/* 2. Strict 3/4-day periods or full weeks */}
          <SelectableCard
            value="PERIODS_AND_WEEKS"
            indicator="radio"
            className="p-4 justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2 pr-8">
                <span className="text-sm font-bold text-white">
                  {t("customDaysStrictTitle")}
                </span>
              </div>
              <p className="cms-text-meta leading-relaxed">
                {t("customDaysStrictDesc")}
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center gap-2 cms-text-code text-amber-300">
              <ShieldCheck className="cms-icon-sm shrink-0" />
              <span>Fasta delveckor (3/4d) eller helvecka</span>
            </div>
          </SelectableCard>

          {/* 3. Full weeks only from turnover day */}
          <SelectableCard
            value="FULL_WEEKS_ONLY"
            indicator="radio"
            className="p-4 justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2 pr-8">
                <span className="text-sm font-bold text-white">
                  {t("customDaysFullWeeksTitle")}
                </span>
              </div>
              <p className="cms-text-meta leading-relaxed">
                {t("customDaysFullWeeksDesc")}
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center gap-2 cms-text-code text-purple-300">
              <Calendar className="cms-icon-sm shrink-0" />
              <span>Enbart hela veckor (7, 14, 21 nätter...)</span>
            </div>
          </SelectableCard>
        </SelectableCardGroup>
      </Card>

      {/* 4. Booking Search Page Selection */}
      <Card variant="admin" className="p-6 space-y-4">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Search className="cms-icon-md text-sky-400" />
            {t("searchPageSectionTitle")}
          </h2>
          <p className="cms-text-meta mt-1">
            {t("searchPageSectionDesc")}
          </p>
        </div>

        <FormField
          label={t("searchPageSelectLabel")}
          labelVariant="admin"
          labelClassName="font-semibold text-slate-200"
          className="max-w-md"
          description={
            bookingSearchPageSlug
              ? `Aktiv länk: ${bookingSearchPageSlug.startsWith("/") ? bookingSearchPageSlug : `/${bookingSearchPageSlug}`}`
              : "Ingen sida vald – sökknapp och länk döljs i kalendern"
          }
        >
          <NativeSelect
            value={bookingSearchPageSlug}
            onChange={(e) => setBookingSearchPageSlug(e.target.value)}
            size="sm"
            variant="admin"
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
          </NativeSelect>
        </FormField>
      </Card>

      {/* Live Preview Card */}
      <Card variant="adminGlass" className="p-4 flex items-start gap-3">
        <Info className="cms-icon-md text-sky-400 shrink-0 mt-0.5" />
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
      </Card>

      {/* Footer Save Button */}
      <div className="flex items-center justify-end gap-3 pt-3">
        <Button
          type="submit"
          variant="adminPrimary"
          size="default"
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <Loader2 className="cms-icon-md animate-spin" />
              <span>{t("saving")}</span>
            </>
          ) : (
            <>
              <Save className="cms-icon-md" />
              <span>{t("saveBtn")}</span>
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
