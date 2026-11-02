"use client";

import React, { useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useBookingsQuery, usePricePeriodsQuery, useBookingSettingsQuery } from "./hooks";
import { BookingDetailsModal } from "./booking-details-modal";
import { BookingItem } from "./types";
import { getISOWeekNumber, getMondayOfISOWeek, getSundayOfISOWeek } from "../utils/weeks";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Loader2,
  Lock,
  ArrowRight,
  Search,
} from "lucide-react";

export interface UnitCalendarViewProps {
  objectId: string;
  objectName?: string;
  basePrice?: number;
  className?: string;
  searchUrl?: string;
  onSearchClick?: () => void;
}

/**
 * UnitCalendarView - Informational calendar view for accommodation units.
 * Displays real-time availability, turnover days, reserved and blocked dates
 * without interactive single-day selection in the grid. Used when
 * rentals are restricted to fixed periods or full weeks.
 */
export function UnitCalendarView({
  objectId,
  objectName = "Boende",
  basePrice,
  className = "",
  searchUrl,
  onSearchClick,
}: UnitCalendarViewProps) {
  const { data: session } = useSession();
  const isAdmin = Boolean(session?.user);
  const [selectedAdminBooking, setSelectedAdminBooking] = useState<BookingItem | null>(null);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);

  const { data: bookings = [], isLoading: isBookingsLoading } = useBookingsQuery(objectId);
  const { data: pricePeriods = [], isLoading: isPricePeriodsLoading } = usePricePeriodsQuery(objectId);
  const { data: bookingSettings } = useBookingSettingsQuery();

  const checkInTime = bookingSettings?.checkInTime || "15:00";
  const checkOutTime = bookingSettings?.checkOutTime || "11:00";
  const isCalendarLoading = isBookingsLoading || isPricePeriodsLoading;

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    "Januari",
    "Februari",
    "Mars",
    "April",
    "Maj",
    "Juni",
    "Juli",
    "Augusti",
    "September",
    "Oktober",
    "November",
    "December",
  ];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const isDateInActiveSeason = (dateStr: string): boolean => {
    if (!pricePeriods || pricePeriods.length === 0) return false;
    return pricePeriods.some((p: any) => {
      let startStr: string | null = null;
      let endStr: string | null = null;
      if (p.start_date && p.end_date) {
        startStr = typeof p.start_date === "string" ? p.start_date.slice(0, 10) : new Date(p.start_date).toISOString().split("T")[0];
        endStr = typeof p.end_date === "string" ? p.end_date.slice(0, 10) : new Date(p.end_date).toISOString().split("T")[0];
      } else if (p.start_year && p.start_week && p.end_year && p.end_week) {
        startStr = getMondayOfISOWeek(p.start_year, p.start_week).toISOString().split("T")[0];
        endStr = getSundayOfISOWeek(p.end_year, p.end_week).toISOString().split("T")[0];
      }
      if (!startStr || !endStr) return false;
      return dateStr >= startStr && dateStr <= endStr;
    });
  };

  const daysInMonth = useMemo(() => {
    const days: Array<{
      date: Date;
      dateStr: string;
      isCurrentMonth: boolean;
      isoWeek: number;
    }> = [];
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const firstDayOfWeek = (firstDay.getDay() + 6) % 7;
    for (let i = firstDayOfWeek; i > 0; i--) {
      const d = new Date(year, month, 1 - i);
      const dateStr = d.toISOString().split("T")[0];
      days.push({
        date: d,
        dateStr,
        isCurrentMonth: false,
        isoWeek: getISOWeekNumber(d),
      });
    }

    for (let i = 1; i <= lastDay.getDate(); i++) {
      const d = new Date(year, month, i);
      const dateStr = d.toISOString().split("T")[0];
      days.push({
        date: d,
        dateStr,
        isCurrentMonth: true,
        isoWeek: getISOWeekNumber(d),
      });
    }

    const lastDayOfWeek = (lastDay.getDay() + 6) % 7;
    const remainingDays = 6 - lastDayOfWeek;
    for (let i = 1; i <= remainingDays; i++) {
      const d = new Date(year, month + 1, i);
      const dateStr = d.toISOString().split("T")[0];
      days.push({
        date: d,
        dateStr,
        isCurrentMonth: false,
        isoWeek: getISOWeekNumber(d),
      });
    }

    return days;
  }, [year, month]);

  const getDayBookingInfo = (dateStr: string) => {
    const activeSeason = isDateInActiveSeason(dateStr);
    let morningBooking: BookingItem | null = null;
    let afternoonBooking: BookingItem | null = null;

    for (const b of bookings) {
      if (b.status === "CANCELLED") continue;
      if (dateStr > b.startDate && dateStr < b.endDate) {
        morningBooking = b;
        afternoonBooking = b;
        break;
      }
      if (dateStr === b.endDate) {
        morningBooking = b;
      }
      if (dateStr === b.startDate) {
        afternoonBooking = b;
      }
    }

    const isBlocked = Boolean(
      (morningBooking && (morningBooking.icalSourceId === "blocked_period" || morningBooking.customerEmail === "internal@blocked" || (morningBooking.status as string) === "BLOCKED")) ||
      (afternoonBooking && (afternoonBooking.icalSourceId === "blocked_period" || afternoonBooking.customerEmail === "internal@blocked" || (afternoonBooking.status as string) === "BLOCKED"))
    );

    const isTurnoverDay = Boolean(
      (morningBooking && afternoonBooking && morningBooking.id !== afternoonBooking.id) ||
      (morningBooking && !afternoonBooking) ||
      (!morningBooking && afternoonBooking)
    );

    return {
      morningBooking,
      afternoonBooking,
      isFullyBooked: Boolean(morningBooking && afternoonBooking),
      isTurnoverDay,
      isBlocked,
      activeSeason,
    };
  };

  const getStatusColor = (booking: BookingItem | null, isMorning: boolean) => {
    if (!booking) return "";
    const isBlocked =
      booking.icalSourceId === "blocked_period" ||
      booking.customerEmail === "internal@blocked" ||
      (booking.status as string) === "BLOCKED" ||
      booking.customerName?.toLowerCase().includes("blockad");

    if (isBlocked) {
      return isAdmin
        ? "bg-rose-950/70 border-rose-500/80 text-rose-300"
        : "bg-slate-900/90 border-slate-700/60 text-slate-500";
    }

    if (!isAdmin) {
      return "bg-sky-600/60 border-sky-500/80 text-white";
    }

    const isImported = Boolean(
      booking.status === "IMPORTED" ||
      (booking.icalSourceId && booking.icalSourceId !== "blocked_period")
    );

    if (isImported) {
      return "bg-indigo-900/60 border-indigo-500/80 text-indigo-200";
    }
    if (booking.status === "PENDING") {
      return "bg-amber-900/60 border-amber-500/80 text-amber-200";
    }
    return "bg-sky-600/60 border-sky-500/80 text-white";
  };

  const weeks = useMemo(() => {
    const chunked: Array<{
      weekNumber: number;
      days: typeof daysInMonth;
    }> = [];
    for (let i = 0; i < daysInMonth.length; i += 7) {
      const weekDays = daysInMonth.slice(i, i + 7);
      const weekNumber = weekDays[0]?.isoWeek || 1;
      chunked.push({ weekNumber, days: weekDays });
    }
    return chunked;
  }, [daysInMonth]);

  return (
    <div className={`p-6 rounded-2xl bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 shadow-xl ${className}`}>
      {/* Calendar Header */}
      <div className='flex items-center justify-between mb-6'>
        <div className='flex items-center gap-3'>
          <div className='p-2 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400'>
            <CalendarIcon className='w-5 h-5' />
          </div>
          <div>
            <h3 className='font-bold text-lg text-neutral-900 dark:text-white flex items-center gap-2'>
              <span>Tillgänglighetskalender</span>
              <span className='text-xs font-normal px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700'>
                Visning
              </span>
            </h3>
            <p className='text-xs text-neutral-500 dark:text-slate-400'>
              Aktuell tillgänglighet och bokningsläge för {objectName}.
            </p>
          </div>
        </div>

        <div className='flex items-center gap-2'>
          <button
            onClick={handlePrevMonth}
            className='p-2 rounded-lg border border-neutral-200 dark:border-slate-800 hover:bg-neutral-100 dark:hover:bg-slate-800 transition text-neutral-600 dark:text-slate-400 cursor-pointer'
          >
            <ChevronLeft className='w-4 h-4' />
          </button>
          <span className='font-semibold text-sm w-28 text-center text-neutral-800 dark:text-slate-200'>
            {monthNames[month]} {year}
          </span>
          <button
            onClick={handleNextMonth}
            className='p-2 rounded-lg border border-neutral-200 dark:border-slate-800 hover:bg-neutral-100 dark:hover:bg-slate-800 transition text-neutral-600 dark:text-slate-400 cursor-pointer'
          >
            <ChevronRight className='w-4 h-4' />
          </button>
        </div>
      </div>

      {/* Calendar Grid Container */}
      <div className='relative'>
        {isCalendarLoading && (
          <div className='absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-950/40 backdrop-blur-[2.5px] rounded-2xl transition-all duration-300'>
            <div className='flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900/90 border border-slate-700/80 shadow-2xl text-xs font-medium text-slate-200'>
              <Loader2 className='w-4 h-4 animate-spin text-sky-400' />
              <span>Uppdaterar kalenderdata...</span>
            </div>
          </div>
        )}

        {/* Days of Week Header with V Column */}
        <div className='grid grid-cols-[36px_repeat(7,1fr)] gap-1 mb-2 text-center text-xs font-semibold text-neutral-400 dark:text-slate-500'>
          <div className='text-amber-400/80 font-mono'>V</div>
          <div>Mån</div>
          <div>Tis</div>
          <div>Ons</div>
          <div>Tor</div>
          <div>Fre</div>
          <div>Lör</div>
          <div>Sön</div>
        </div>

        {/* Calendar Rows by Week */}
        <div className='space-y-1 select-none'>
          {weeks.map(({ weekNumber, days }) => {
            return (
              <div
                key={weekNumber}
                className='grid grid-cols-[36px_repeat(7,1fr)] gap-1 p-0.5 rounded-xl border border-slate-700/60 dark:border-slate-800/80 bg-slate-950/30'
              >
                {/* ISO Week Number Column */}
                <div className='flex items-center justify-center font-mono text-[11px] font-bold text-amber-400/90 bg-amber-500/10 rounded-lg border border-amber-500/20'>
                  {weekNumber}
                </div>

                {/* Days of the Week */}
                {days.map(({ date, dateStr, isCurrentMonth }) => {
                  const dayNum = date.getDate();
                  const info = getDayBookingInfo(dateStr);
                  const isInactive = !info.activeSeason;

                  return (
                    <div
                      key={dateStr}
                      onMouseEnter={() => setHoveredDate(dateStr)}
                      onMouseLeave={() => setHoveredDate(null)}
                      onClick={() => {
                        if (isAdmin && (info.morningBooking || info.afternoonBooking)) {
                          setSelectedAdminBooking(info.afternoonBooking || info.morningBooking);
                        }
                      }}
                      className={`relative h-12 flex flex-col justify-between p-1 text-xs transition rounded-lg border overflow-hidden ${
                        !isCurrentMonth
                          ? "opacity-25 border-transparent bg-transparent"
                          : isInactive
                          ? "bg-slate-950/60 border-slate-900 text-slate-600"
                          : "border-slate-800/60 bg-slate-900/40 hover:border-slate-700"
                      } ${isAdmin && (info.morningBooking || info.afternoonBooking) ? "cursor-pointer" : "cursor-default"}`}
                    >
                      {/* Half-day booking overlays */}
                      {isCurrentMonth && (
                        <div className='absolute inset-0 pointer-events-none'>
                          {info.morningBooking && (
                            <div
                              className={`absolute inset-y-0 left-0 w-1/2 opacity-75 border-r border-slate-950/40 ${getStatusColor(
                                info.morningBooking,
                                true
                              )}`}
                            />
                          )}
                          {info.afternoonBooking && (
                            <div
                              className={`absolute inset-y-0 right-0 w-1/2 opacity-75 ${getStatusColor(
                                info.afternoonBooking,
                                false
                              )}`}
                            />
                          )}
                        </div>
                      )}

                      {/* Day number */}
                      <span className='relative z-10 font-medium text-[11px] text-slate-200'>
                        {dayNum}
                      </span>

                      {/* Inactive season note */}
                      {isCurrentMonth && isInactive && (
                        <span className='relative z-10 text-[9px] text-slate-600 font-mono'>
                          Stängt
                        </span>
                      )}

                      {/* Blocked "X" overlay for admin */}
                      {isCurrentMonth && info.isBlocked && isAdmin && (
                        <div className='absolute inset-0 flex items-center justify-center pointer-events-none z-10'>
                          <span className='text-rose-400 font-bold text-xs opacity-80'>✕</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className='mt-6 pt-4 border-t border-neutral-200 dark:border-slate-800 space-y-3'>
        <div className='flex flex-wrap items-center gap-4 text-xs text-neutral-600 dark:text-slate-400'>
          <div className='flex items-center gap-1.5'>
            <div className='w-3 h-3 rounded bg-sky-600/70 border border-sky-500' />
            <span>Bokat / Upptaget</span>
          </div>
          <div className='flex items-center gap-1.5'>
            <div className='w-3 h-3 rounded bg-slate-900 border border-slate-700' />
            <span>Ledigt</span>
          </div>
          <div className='flex items-center gap-1.5'>
            <div className='w-3 h-3 rounded bg-slate-950 border border-slate-900' />
            <span>Ej uthyrning</span>
          </div>
        </div>

        <p className='text-[11px] text-neutral-500 dark:text-slate-400 leading-normal'>
          Incheckning sker kl {checkInTime} och utcheckning kl {checkOutTime}. Bytesdagar visas som delade dagar där ett sällskap avreser på förmiddagen och nästa anländer på eftermiddagen.
        </p>

        {/* CTA to Search / Booking Flow (hidden if no searchUrl or onSearchClick is provided) */}
        {(onSearchClick || searchUrl) ? (
          <div className='pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3'>
            <div className='text-xs text-slate-400'>
              Vill du boka en ledig period för {objectName}?
            </div>
            {onSearchClick ? (
              <button
                type='button'
                onClick={onSearchClick}
                className='inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-md shadow-sky-600/20 transition cursor-pointer'
              >
                <Search className='w-3.5 h-3.5' />
                <span>Sök lediga datum & boka</span>
                <ArrowRight className='w-3.5 h-3.5' />
              </button>
            ) : searchUrl ? (
              <a
                href={searchUrl}
                className='inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-md shadow-sky-600/20 transition'
              >
                <Search className='w-3.5 h-3.5' />
                <span>Sök lediga datum & boka</span>
                <ArrowRight className='w-3.5 h-3.5' />
              </a>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* Admin details modal if clicked */}
      {isAdmin && selectedAdminBooking && (
        <BookingDetailsModal
          booking={selectedAdminBooking}
          isOpen={Boolean(selectedAdminBooking)}
          onClose={() => setSelectedAdminBooking(null)}
        />
      )}
    </div>
  );
}
