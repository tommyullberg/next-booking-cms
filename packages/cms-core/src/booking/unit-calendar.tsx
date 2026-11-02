"use client";

import React from "react";
import { useBookingSettingsQuery, useBookingObjectQuery } from "./hooks";
import { UnitCalendarInteract, UnitCalendarInteractProps } from "./unit-calendar-interact";
import { UnitCalendarView, UnitCalendarViewProps } from "./unit-calendar-view";

export interface UnitCalendarProps {
  objectId: string;
  objectName?: string;
  basePrice?: number;
  className?: string;
  searchUrl?: string;
  onSearchClick?: () => void;
  /**
   * Calendar presentation mode:
   * - "auto": Automatically determines if the unit permits arbitrary day selections (1-6 days)
   *   based on global settings and per-object overrides.
   *   If custom days are enabled ("ALL") -> UnitCalendarInteract (clickable days & direct booking).
   *   If restricted to fixed periods or full weeks ("PERIODS_AND_WEEKS" / "FULL_WEEKS_ONLY") -> UnitCalendarView (informational & search link).
   * - "interact": Forces interactive booking calendar regardless of settings.
   * - "view": Forces display-only informational calendar regardless of settings.
   */
  mode?: "auto" | "interact" | "view";
  /** Optional override for allowCustomDays */
  allowCustomDays?: boolean;
}

/**
 * UnitCalendar - Container component for property booking calendars.
 * Automatically chooses between interactive direct booking and informational view
 * based on allowed rental period configuration (flexible days vs strict periods/full weeks).
 */
export function UnitCalendar({
  objectId,
  objectName = "Boende",
  basePrice = 2500,
  className = "",
  searchUrl,
  onSearchClick,
  mode = "auto",
  allowCustomDays,
}: UnitCalendarProps) {
  const { data: bookingSettings } = useBookingSettingsQuery();
  const { data: bookingObject } = useBookingObjectQuery(objectId);

  const rawSearchBase =
    searchUrl !== undefined
      ? searchUrl
      : (bookingSettings?.bookingSearchPageSlug || "/bookings");

  const effectiveSearchUrl = rawSearchBase
    ? (() => {
        const path = rawSearchBase.startsWith("/") ? rawSearchBase : `/${rawSearchBase}`;
        if (!objectId || path.includes("objectId=")) return path;
        const separator = path.includes("?") ? "&" : "?";
        return `${path}${separator}objectId=${encodeURIComponent(String(objectId))}`;
      })()
    : undefined;

  if (mode === "interact") {
    return (
      <UnitCalendarInteract
        objectId={objectId}
        objectName={objectName}
        basePrice={basePrice}
        className={className}
      />
    );
  }

  if (mode === "view") {
    return (
      <UnitCalendarView
        objectId={objectId}
        objectName={objectName}
        basePrice={basePrice}
        className={className}
        searchUrl={effectiveSearchUrl}
        onSearchClick={onSearchClick}
      />
    );
  }

  // mode === "auto": evaluate whether arbitrary single days are permitted
  const scope = bookingSettings?.customDaysScope ?? "GLOBAL";
  const objSettings = (bookingObject?.price_matrix as any)?.booking_settings;

  let isCustomDaysAllowed: boolean;
  if (typeof allowCustomDays === "boolean") {
    isCustomDaysAllowed = allowCustomDays;
  } else if (scope === "PER_OBJECT" && objSettings?.allowedBookingPeriods) {
    isCustomDaysAllowed = objSettings.allowedBookingPeriods === "ALL";
  } else if (scope === "PER_OBJECT" && typeof objSettings?.allowCustomDays === "boolean") {
    isCustomDaysAllowed = objSettings.allowCustomDays;
  } else if (bookingSettings?.allowedBookingPeriods) {
    isCustomDaysAllowed = bookingSettings.allowedBookingPeriods === "ALL";
  } else {
    isCustomDaysAllowed = bookingSettings?.allowCustomDays ?? true;
  }

  if (isCustomDaysAllowed) {
    return (
      <UnitCalendarInteract
        objectId={objectId}
        objectName={objectName}
        basePrice={basePrice}
        className={className}
      />
    );
  }

  return (
    <UnitCalendarView
      objectId={objectId}
      objectName={objectName}
      basePrice={basePrice}
      className={className}
      searchUrl={effectiveSearchUrl}
      onSearchClick={onSearchClick}
    />
  );
}
