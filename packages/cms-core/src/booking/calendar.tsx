"use client";

import React, { useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import { useBookingsQuery, useCreateBookingMutation, usePricePeriodsQuery } from "./hooks";
import { BookingDetailsModal } from "./booking-details-modal";
import { BookingItem } from "./types";
import { getISOWeekNumber, getMondayOfISOWeek, getSundayOfISOWeek } from "../utils/weeks";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Info,
  ShieldCheck,
  Mail,
  Phone,
  MapPin,
  User,
  Users,
  Dog,
  Clock,
  Lock,
} from "lucide-react";
import { ModalPortal } from "../components/ui/modal-portal";

export interface BookingCalendarProps {
  objectId: string;
  objectName?: string;
  basePrice?: number;
  className?: string;
}

export function BookingCalendar({
  objectId,
  objectName = "Boende",
  basePrice = 2500,
  className = "",
}: BookingCalendarProps) {
  const { data: session } = useSession();
  const isAdmin = Boolean(session?.user);
  const queryClient = useQueryClient();
  const [selectedAdminBooking, setSelectedAdminBooking] = useState<BookingItem | null>(null);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [hoveredBookingId, setHoveredBookingId] = useState<string | null>(null);
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);
  const [hoveredHalf, setHoveredHalf] = useState<"morning" | "afternoon" | null>(null);
  const [tooltipData, setTooltipData] = useState<{
    booking: BookingItem;
    x: number;
    y: number;
  } | null>(null);

  // Form modal state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerMobile, setCustomerMobile] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("Sverige");
  const [adultsCount, setAdultsCount] = useState(2);
  const [childrenCount, setChildrenCount] = useState(0);
  const [petsCount, setPetsCount] = useState(0);
  const [customerNotes, setCustomerNotes] = useState("");
  const [isPreliminary, setIsPreliminary] = useState(true);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  const { data: bookings = [], isLoading: isBookingsLoading } = useBookingsQuery(objectId);
  const { data: pricePeriods = [], isLoading: isPricePeriodsLoading } = usePricePeriodsQuery(objectId);
  const isCalendarLoading = isBookingsLoading || isPricePeriodsLoading;
  const createMutation = useCreateBookingMutation();

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

  // Check if dateStr is covered by an active configured price season
  const isDateInActiveSeason = (dateStr: string): boolean => {
    if (!pricePeriods || pricePeriods.length === 0) {
      // Only dates within configured price periods can be booked
      return false;
    }
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
      if (startStr && endStr) {
        return dateStr >= startStr && dateStr <= endStr;
      }
      return false;
    });
  };

  // Filter active blocking bookings (all active statuses except CANCELLED and REJECTED)
  const activeBookings = useMemo(
    () => bookings.filter((b) => b.status !== "CANCELLED" && b.status !== "REJECTED"),
    [bookings]
  );

  const isBlockedBooking = (b?: BookingItem | null): boolean => {
    if (!b) return false;
    return (
      b.icalSourceId === "blocked_period" ||
      b.customerEmail === "internal@blocked" ||
      (b.status as string) === "BLOCKED" ||
      (b.customerName ? b.customerName.toLowerCase().includes("blockad") : false)
    );
  };

  const isImportedBooking = (b?: BookingItem | null): boolean => {
    if (!b || isBlockedBooking(b)) return false;
    return (
      b.status === "IMPORTED" ||
      (Boolean(b.icalSourceId) && b.icalSourceId !== "blocked_period")
    );
  };

  // Analyze occupancy per day for half-day logic (checkout in morning, checkin in afternoon)
  const getDayBookingInfo = (dateStr: string) => {
    let morningBooking: BookingItem | null = null;
    let afternoonBooking: BookingItem | null = null;
    let blockedBooking: BookingItem | null = null;

    for (const b of activeBookings) {
      if (isBlockedBooking(b)) {
        if (dateStr >= b.startDate && dateStr <= b.endDate) {
          blockedBooking = b;
        }
      } else {
        // Morning: night ending on dateStr (checkout day)
        if (b.startDate < dateStr && dateStr <= b.endDate) {
          morningBooking = b;
        }
        // Afternoon: night starting on dateStr (checkin day)
        if (b.startDate <= dateStr && dateStr < b.endDate) {
          afternoonBooking = b;
        }
      }
    }

    const isOutsideSeason = !isDateInActiveSeason(dateStr);
    const isLocked = isOutsideSeason || Boolean(blockedBooking);

    const isCheckOut = Boolean(
      morningBooking && !isBlockedBooking(morningBooking) && morningBooking.endDate === dateStr
    );
    const isCheckIn = Boolean(
      afternoonBooking && !isBlockedBooking(afternoonBooking) && afternoonBooking.startDate === dateStr
    );
    const isStayNight = Boolean(
      morningBooking && afternoonBooking && morningBooking.id === afternoonBooking.id
    );
    const isTurnoverDay = Boolean(
      morningBooking && afternoonBooking && morningBooking.id !== afternoonBooking.id
    );

    const morningBlocked = isLocked || Boolean(morningBooking);
    const afternoonBlocked = isLocked || Boolean(afternoonBooking);
    const isFullBlocked = isLocked || (morningBlocked && afternoonBlocked);
    const isHalfDay = !isLocked && ((morningBlocked && !afternoonBlocked) || (!morningBlocked && afternoonBlocked));

    return {
      morningBooking,
      afternoonBooking,
      blockedBooking,
      isOutsideSeason,
      isLocked,
      isCheckOut,
      isCheckIn,
      isStayNight,
      isTurnoverDay,
      morningBlocked,
      afternoonBlocked,
      isFullBlocked,
      isHalfDay,
      dayBooking: afternoonBooking || morningBooking || blockedBooking,
    };
  };

  // Verify that all nights strictly between start and end date are free and active
  const canSelectAsEndDate = (start: string, end: string): boolean => {
    if (end <= start) return false;
    let curr = new Date(start);
    const target = new Date(end);

    while (curr < target) {
      const checkStr = curr.toISOString().split("T")[0];
      const checkInfo = getDayBookingInfo(checkStr);
      if (checkInfo.isLocked) return false;
      const isNightOccupied = activeBookings.some((b: BookingItem) => {
        if (isBlockedBooking(b)) return false;
        return checkStr >= b.startDate && checkStr < b.endDate;
      });
      if (isNightOccupied) return false;
      curr.setDate(curr.getDate() + 1);
    }

    const endInfo = getDayBookingInfo(end);
    if (endInfo.isLocked) return false;

    return true;
  };

  const calculateNights = (s?: string | null, e?: string | null) => {
    if (!s || !e) return 0;
    const diff = new Date(e).getTime() - new Date(s).getTime();
    return Math.max(1, Math.round(diff / 86400000));
  };

  const effectiveEnd =
    endDate ||
    (startDate && hoveredDate && hoveredDate > startDate && canSelectAsEndDate(startDate, hoveredDate)
      ? hoveredDate
      : null);
  const isCandidate = !endDate && Boolean(effectiveEnd);

  const nights = startDate && effectiveEnd ? calculateNights(startDate, effectiveEnd) : 0;
  const estimatedPrice = nights * totalPricePerNight();

  function totalPricePerNight(): number {
    return basePathPrice() + (petsCount > 0 ? 300 : 0);
  }

  function basePathPrice(): number {
    return totalPrice(basePrice);
  }

  function totalPrice(p: number): number {
    return p;
  }

  const getBookingColorClass = (b?: BookingItem | null): string => {
    if (!b) return "";
    if (isBlockedBooking(b)) {
      return "bg-purple-600/40 dark:bg-purple-600/45 text-purple-200";
    }
    if (!isAdmin) {
      // Standard uniform color for all bookings for public visitors
      return "bg-blue-600/40 dark:bg-blue-600/45 text-white";
    }
    if (b.status === "PENDING") {
      return "bg-amber-600/45 dark:bg-amber-500/45 text-amber-100";
    }
    if (isImportedBooking(b)) {
      return "bg-indigo-600/40 dark:bg-indigo-600/45 text-indigo-100";
    }
    return "bg-blue-600/40 dark:bg-blue-600/45 text-white";
  };

  const hoveredBooking = useMemo(
    () => (hoveredBookingId ? activeBookings.find((b: BookingItem) => b.id === hoveredBookingId) || null : null),
    [hoveredBookingId, activeBookings]
  );

  const handleSlotClick = (dateStr: string, slot: "morning" | "afternoon" | "full") => {
    const info = getDayBookingInfo(dateStr);
    const targetBooking =
      info.blockedBooking ||
      (slot === "morning" ? info.morningBooking : (info.afternoonBooking || info.morningBooking));

    // If administrator clicks an occupied day/half or blocked period: open the View Booking modal!
    if (isAdmin && targetBooking) {
      setSelectedAdminBooking(targetBooking);
      return;
    }

    // Locked days (outside active price season or maintenance blocks) cannot be selected
    if (info.isLocked) {
      return;
    }

    // Stay nights cannot be clicked by normal visitors
    if (info.isStayNight) {
      return;
    }

    // 1. Initial click or resetting selection
    if (!startDate || (startDate && endDate)) {
      if (!info.afternoonBlocked) {
        setStartDate(dateStr);
        setEndDate(null);
      }
      return;
    }

    // 2. Selecting end date
    if (startDate && !endDate) {
      if (dateStr <= startDate) {
        if (!info.afternoonBlocked) {
          setStartDate(dateStr);
          setEndDate(null);
        }
      } else {
        if (canSelectAsEndDate(startDate, dateStr)) {
          setEndDate(dateStr);
        } else if (!info.afternoonBlocked) {
          setStartDate(dateStr);
          setEndDate(null);
        }
      }
    }
  };

  // Build Calendar Weeks (7 days per row, starting on Monday)
  const calendarWeeks = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const startDow = (firstDay.getDay() + 6) % 7; // Monday = 0
    const daysInCurr = new Date(year, month + 1, 0).getDate();
    const daysInPrev = new Date(year, month, 0).getDate();
    const todayStr = new Date().toISOString().split("T")[0];

    type CalendarDayItem = {
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
    };

    const allDays: CalendarDayItem[] = [];

    // Preceding month padding
    for (let i = startDow - 1; i >= 0; i--) {
      const dNum = daysInPrev - i;
      const d = new Date(year, month - 1, dNum);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(dNum).padStart(2, "0")}`;
      allDays.push({
        dateStr,
        dayNumber: dNum,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
      });
    }

    // Current month days
    for (let dNum = 1; dNum <= daysInCurr; dNum++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(dNum).padStart(2, "0")}`;
      allDays.push({
        dateStr,
        dayNumber: dNum,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
      });
    }

    // Trailing month padding to finish 7-day row
    const rem = (7 - (allDays.length % 7)) % 7;
    for (let dNum = 1; dNum <= rem; dNum++) {
      const d = new Date(year, month + 1, dNum);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(dNum).padStart(2, "0")}`;
      allDays.push({
        dateStr,
        dayNumber: dNum,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
      });
    }

    // Slice into week chunks of 7 days
    const rows: CalendarDayItem[][] = [];
    for (let i = 0; i < allDays.length; i += 7) {
      rows.push(allDays.slice(i, i + 7));
    }
    return rows;
  }, [year, month]);

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate) return;

    setBookingError(null);
    try {
      const totalGuests = Math.max(1, adultsCount + childrenCount);
      await createMutation.mutateAsync({
        objectId,
        startDate,
        endDate,
        customerName,
        customerEmail,
        customerPhone: customerPhone || undefined,
        customerMobile: customerMobile || undefined,
        addressLine1: addressLine1 || undefined,
        addressLine2: addressLine2 || undefined,
        postalCode: postalCode || undefined,
        city: city || undefined,
        country: country || "Sverige",
        guestsCount: totalGuests,
        adultsCount,
        childrenCount,
        petsCount,
        customerNotes: customerNotes || undefined,
        isPreliminary,
      });
      setBookingSuccess(true);
      setTimeout(() => {
        setIsFormOpen(false);
        setBookingSuccess(false);
        setStartDate(null);
        setEndDate(null);
      }, 3000);
    } catch (err: any) {
      setBookingError(err.message || "Bokningsförfrågan misslyckades.");
    }
  };

  return (
    <div
      className={`rounded-3xl border border-neutral-300 bg-neutral-100 p-6 shadow-xl shadow-black/10 dark:border-slate-800 dark:bg-slate-900 ${className}`}>
      <div className='flex items-center justify-between mb-5 pb-4 border-b border-neutral-300 dark:border-slate-800'>
        <div>
          <h3 className='text-lg font-bold tracking-tight text-neutral-900 dark:text-white flex items-center gap-2'>
            <CalendarIcon className='w-5 h-5 text-sky-600 dark:text-sky-400' />
            <span>Tillgänglighet & Bokningskalender</span>
          </h3>
          <p className='text-xs text-neutral-600 dark:text-slate-400 mt-0.5'>
            Välj in- och utcheckningsdatum för {objectName}.
          </p>
        </div>

        <div className='flex items-center gap-2'>
          <button
            type='button'
            onClick={handlePrevMonth}
            className='p-2 rounded-xl border border-neutral-300 bg-white hover:bg-neutral-200/70 dark:border-slate-800 dark:bg-transparent dark:hover:bg-slate-800 text-neutral-800 dark:text-slate-300 transition shadow-xs cursor-pointer'>
            <ChevronLeft className='w-4 h-4' />
          </button>
          <span className='text-xs font-bold text-neutral-900 dark:text-slate-200 min-w-28 text-center'>
            {monthNames[month]} {year}
          </span>
          <button
            type='button'
            onClick={handleNextMonth}
            className='p-2 rounded-xl border border-neutral-300 bg-white hover:bg-neutral-200/70 dark:border-slate-800 dark:bg-transparent dark:hover:bg-slate-800 text-neutral-800 dark:text-slate-300 transition shadow-xs cursor-pointer'>
            <ChevronRight className='w-4 h-4' />
          </button>
        </div>
      </div>

      {/* Calendar Body with blur overlay during loading */}
      <div className='relative'>
        {/* Weekday headers with week number column */}
        <div className='grid grid-cols-[38px_repeat(7,1fr)] gap-x-0 text-center text-[11px] font-bold text-neutral-600 dark:text-slate-400 mb-2 px-1'>
        <span className='font-mono text-amber-500/80'>V</span>
        <span>Mån</span>
        <span>Tis</span>
        <span>Ons</span>
        <span>Tor</span>
        <span>Fre</span>
        <span>Lör</span>
        <span>Sön</span>
      </div>

      {/* Days grid - Week by Week continuous span rows */}
      <div
        className='space-y-1.5 text-xs select-none'
        onMouseLeave={() => {
          setHoveredBookingId(null);
          setHoveredDate(null);
          setHoveredHalf(null);
          setTooltipData(null);
        }}>
        {calendarWeeks.map((week, weekIdx) => {
          const weekNumber = getISOWeekNumber(week[0].dateStr);
          return (
            <div
              key={`week-${weekIdx}`}
              className='grid grid-cols-[38px_repeat(7,1fr)] gap-x-0 relative bg-neutral-200/60 dark:bg-slate-900/80 rounded-2xl overflow-hidden border border-neutral-300/80 dark:border-slate-800/90 divide-x divide-neutral-300/80 dark:divide-slate-800/90'>
              {/* Week Number Column */}
              <div className='flex items-center justify-center font-mono text-[11px] font-bold text-amber-500/90 dark:text-amber-400/80 bg-neutral-200/50 dark:bg-slate-950/50 select-none'>
                {weekNumber}
              </div>

              {week.map((day, colIdx) => {
                const info = getDayBookingInfo(day.dateStr);
                const morningB = info.morningBooking;
                const afternoonB = info.afternoonBooking;
                const blockedB = info.blockedBooking;

                const isMorningHovered = Boolean(isAdmin && morningB && hoveredBookingId === morningB.id);
                const isAfternoonHovered = Boolean(isAdmin && afternoonB && hoveredBookingId === afternoonB.id);
                const isBlockedHovered = Boolean(isAdmin && blockedB && hoveredBookingId === blockedB.id);

                const isSpanStart = Boolean(morningB && day.dateStr === morningB.startDate);
                const isSpanEnd = Boolean(morningB && day.dateStr === morningB.endDate);

                const isStart = startDate === day.dateStr;
                const isEnd = effectiveEnd === day.dateStr;
                const inSelectionMiddle = Boolean(
                  startDate && effectiveEnd && day.dateStr > startDate && day.dateStr < effectiveEnd
                );

                return (
                  <div
                    key={day.dateStr}
                    className={`relative h-12 flex items-center justify-center overflow-hidden transition ${
                      !day.isCurrentMonth ? "opacity-35" : ""
                    }`}>
                    {/* Layer 1: Existing Booking Spans / Locked inactive days */}
                    {info.isLocked ? (
                      <div
                        className={`absolute inset-0 transition-colors ${
                          isAdmin && blockedB
                            ? "bg-rose-950/60 dark:bg-rose-950/70 border border-rose-500/40"
                            : "bg-neutral-300/40 dark:bg-slate-950/70"
                        } ${
                          isBlockedHovered
                            ? "border-2 border-amber-400 dark:border-amber-300 z-10 brightness-125 shadow-xs"
                            : ""
                        }`}>
                        {isAdmin && blockedB && (
                          <svg
                            className='absolute inset-0 w-full h-full pointer-events-none text-rose-600/70 dark:text-rose-500/60'
                            viewBox='0 0 100 100'
                            preserveAspectRatio='none'>
                            <line
                              x1='0'
                              y1='0'
                              x2='100'
                              y2='100'
                              stroke='currentColor'
                              strokeWidth='1.5'
                              vectorEffect='non-scaling-stroke'
                            />
                            <line
                              x1='100'
                              y1='0'
                              x2='0'
                              y2='100'
                              stroke='currentColor'
                              strokeWidth='1.5'
                              vectorEffect='non-scaling-stroke'
                            />
                          </svg>
                        )}
                      </div>
                    ) : info.isStayNight && morningB ? (
                      // Full day continuous stay
                      <div
                        className={`absolute inset-0 transition-colors ${getBookingColorClass(morningB)} ${
                          isSpanStart ? "rounded-l-xl" : ""
                        } ${isSpanEnd ? "rounded-r-xl" : ""} ${
                          isMorningHovered
                            ? `border-y-2 border-amber-400 dark:border-amber-300 z-10 brightness-125 shadow-xs ${
                                isSpanStart || colIdx === 0 ? "border-l-2 border-amber-400 rounded-l-xl" : ""
                              } ${isSpanEnd || colIdx === 6 ? "border-r-2 border-amber-400 rounded-r-xl" : ""}`
                            : ""
                        }`}
                      />
                    ) : (
                      <>
                        {/* Morning Half (0% to 50%) */}
                        {morningB && (
                          <div
                            className={`absolute top-0 bottom-0 left-0 w-1/2 transition-colors ${getBookingColorClass(morningB)} ${
                              info.isCheckOut ? "rounded-r-lg" : ""
                            } ${
                              isMorningHovered
                                ? `border-y-2 border-amber-400 dark:border-amber-300 z-10 brightness-125 shadow-xs ${
                                    info.isCheckOut ? "border-r-2 border-amber-400" : ""
                                  } ${colIdx === 0 ? "border-l-2 border-amber-400" : ""}`
                                : ""
                            }`}
                          />
                        )}

                        {/* Turnover divider line at 50% when two different bookings meet */}
                        {info.isTurnoverDay && (
                          <div className='absolute top-0 bottom-0 left-[calc(50%-1px)] w-[2px] bg-white dark:bg-slate-950 z-15 pointer-events-none' />
                        )}

                        {/* Afternoon Half (50% to 100%) */}
                        {afternoonB && (
                          <div
                            className={`absolute top-0 bottom-0 right-0 w-1/2 transition-colors ${getBookingColorClass(afternoonB)} ${
                              info.isCheckIn ? "rounded-l-lg" : ""
                            } ${
                              isAfternoonHovered
                                ? `border-y-2 border-amber-400 dark:border-amber-300 z-10 brightness-125 shadow-xs ${
                                    info.isCheckIn ? "border-l-2 border-amber-400" : ""
                                  } ${colIdx === 6 ? "border-r-2 border-amber-400" : ""}`
                                : ""
                            }`}
                          />
                        )}
                      </>
                    )}

                    {/* Layer 2: Selection / Candidate Preview Span */}
                    {isStart && !isEnd && (
                      <div
                        className={`absolute top-0 bottom-0 right-0 w-1/2 bg-sky-500 text-white rounded-l-lg border-y-2 border-l-2 border-sky-400 shadow-sm z-15 ${
                          colIdx === 6 ? "rounded-r-lg border-r-2 border-sky-400" : ""
                        }`}
                      />
                    )}

                    {inSelectionMiddle && (
                      <div
                        className={`absolute inset-0 bg-sky-400/40 dark:bg-sky-600/40 border-y-2 border-sky-400 z-15 ${
                          colIdx === 0 ? "border-l-2 border-sky-400 rounded-l-md" : ""
                        } ${colIdx === 6 ? "border-r-2 border-sky-400 rounded-r-md" : ""}`}
                      />
                    )}

                    {isEnd && !isStart && (
                      <div
                        className={`absolute top-0 bottom-0 left-0 w-1/2 bg-sky-500 text-white rounded-r-lg border-y-2 border-r-2 border-sky-400 shadow-sm z-15 ${
                          colIdx === 0 ? "rounded-l-lg border-l-2 border-sky-400" : ""
                        }`}
                      />
                    )}

                    {isStart && isEnd && (
                      <div className='absolute inset-y-1 inset-x-1.5 rounded-lg bg-sky-500 border-2 border-sky-400 shadow-sm z-15' />
                    )}

                    {/* Layer 3: Interactive Left Hitbox (Morning) */}
                    <div
                      className={`absolute top-0 bottom-0 left-0 w-1/2 z-20 ${
                        (isAdmin && (blockedB || morningB)) ||
                        (!info.isLocked && startDate && !endDate && canSelectAsEndDate(startDate, day.dateStr)) ||
                        (!info.isLocked && !morningB && !info.morningBlocked)
                          ? "cursor-pointer"
                          : "cursor-default"
                      }`}
                      onMouseEnter={(e) => {
                        if (isAdmin && (blockedB || morningB)) {
                          const targetB = blockedB || morningB!;
                          setHoveredBookingId(targetB.id);
                          setTooltipData({ booking: targetB, x: e.clientX, y: e.clientY });
                        } else if (!info.isLocked && startDate && !endDate) {
                          setHoveredDate(day.dateStr);
                          setHoveredHalf("morning");
                        }
                      }}
                      onMouseMove={(e) => {
                        if (isAdmin && (blockedB || morningB)) {
                          const targetB = blockedB || morningB!;
                          setTooltipData({ booking: targetB, x: e.clientX, y: e.clientY });
                        }
                      }}
                      onMouseLeave={() => {
                        const targetB = blockedB || morningB;
                        if (isAdmin && targetB && hoveredBookingId === targetB.id) {
                          setHoveredBookingId(null);
                          setTooltipData(null);
                        }
                      }}
                      onClick={() => handleSlotClick(day.dateStr, "morning")}
                    />

                    {/* Layer 3: Interactive Right Hitbox (Afternoon) */}
                    <div
                      className={`absolute top-0 bottom-0 right-0 w-1/2 z-20 ${
                        (isAdmin && (blockedB || afternoonB)) ||
                        (!info.isLocked && !afternoonB && !info.afternoonBlocked)
                          ? "cursor-pointer"
                          : "cursor-default"
                      }`}
                      onMouseEnter={(e) => {
                        if (isAdmin && (blockedB || afternoonB)) {
                          const targetB = blockedB || afternoonB!;
                          setHoveredBookingId(targetB.id);
                          setTooltipData({ booking: targetB, x: e.clientX, y: e.clientY });
                        } else if (!info.isLocked && startDate && !endDate) {
                          setHoveredDate(day.dateStr);
                          setHoveredHalf("afternoon");
                        }
                      }}
                      onMouseMove={(e) => {
                        if (isAdmin && (blockedB || afternoonB)) {
                          const targetB = blockedB || afternoonB!;
                          setTooltipData({ booking: targetB, x: e.clientX, y: e.clientY });
                        }
                      }}
                      onMouseLeave={() => {
                        const targetB = blockedB || afternoonB;
                        if (isAdmin && targetB && hoveredBookingId === targetB.id) {
                          setHoveredBookingId(null);
                          setTooltipData(null);
                        }
                      }}
                      onClick={() => handleSlotClick(day.dateStr, "afternoon")}
                    />

                    {/* Day Number */}
                    <span
                      className={`relative z-25 pointer-events-none text-xs font-bold transition-transform ${
                        !day.isCurrentMonth
                          ? "text-neutral-400/50 dark:text-slate-600/70"
                          : isAdmin && blockedB
                          ? "text-rose-200 dark:text-rose-100 drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]"
                          : info.isLocked
                          ? "text-neutral-400/70 dark:text-slate-600"
                          : isStart || isEnd
                          ? "text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)] scale-110"
                          : inSelectionMiddle
                          ? "text-sky-950 dark:text-sky-100 drop-shadow-xs"
                          : morningB || afternoonB
                          ? "text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]"
                          : "text-neutral-900 dark:text-slate-100"
                      }`}>
                      {day.dayNumber}
                    </span>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Calendar Legend */}
      <div className='mt-5 pt-4 border-t border-neutral-300 dark:border-slate-800 space-y-3'>
        <div className='grid grid-cols-2 sm:grid-cols-5 gap-3 text-[11px] text-neutral-700 dark:text-slate-400 font-medium'>
          <div className='flex items-center gap-2'>
            <span className='w-5 h-4 rounded-md bg-sky-500 border border-sky-400 shadow-xs inline-block shrink-0' />
            <span>Vald period</span>
          </div>

          <div className='flex items-center gap-2'>
            <span className='w-5 h-4 rounded-md bg-blue-600/40 dark:bg-blue-600/45 border border-blue-500/50 inline-block shrink-0' />
            <span>Bokat / Upptaget</span>
          </div>

          <div className='flex items-center gap-2'>
            <span className='relative w-6 h-4 rounded-md overflow-hidden border border-neutral-400 dark:border-slate-700 inline-flex shrink-0 bg-neutral-200 dark:bg-slate-900'>
              <span className='w-1/2 h-full bg-blue-600/40 dark:bg-blue-600/45' />
              <span className='w-[2px] h-full bg-white dark:bg-slate-950' />
              <span className='flex-1 h-full bg-neutral-200 dark:bg-slate-900' />
            </span>
            <span>Bytesdag (halvdag)</span>
          </div>

          <div className='flex items-center gap-2'>
            <span className='w-5 h-4 rounded-md bg-neutral-300/50 dark:bg-slate-950/75 border border-neutral-400/50 dark:border-slate-800 inline-block shrink-0' />
            <span>Ej uthyrning</span>
          </div>

          <div className='flex items-center gap-2'>
            <span className='w-5 h-4 rounded-md bg-neutral-200/90 dark:bg-slate-800/60 border border-neutral-400 dark:border-slate-700 inline-block shrink-0' />
            <span>Ledigt för bokning</span>
          </div>
        </div>

        {isAdmin && (
          <div className='pt-2 flex flex-wrap items-center gap-2 text-[10px] text-slate-400 border-t border-neutral-300/60 dark:border-slate-800/60'>
            <span className='font-semibold text-slate-300'>Administratörsstatus:</span>
            <span className='inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/30 font-medium'>
              ● Direkt
            </span>
            <span className='inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 font-medium'>
              ● iCal / Booking.com
            </span>
            <span className='inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-300 border border-rose-500/30 font-medium'>
              ✕ Spärrad / Underhåll
            </span>
            <span className='inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 font-medium'>
              ● Förfrågan
            </span>
          </div>
        )}

        <p className='text-[11px] text-neutral-600 dark:text-slate-400 leading-normal'>
          Incheckning sker kl 15:00 och utcheckning kl 11:00. Bytesdagar visas som delade dagar där båda sällskapen kan anlända och avresa samma dag. Perioder utanför aktiv prissäsong samt spärrade datum visas som Ej uthyrning och går ej att boka.
        </p>
      </div>

      {/* Selection Summary and Booking Trigger */}
      <div className='mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-neutral-300 dark:border-slate-800 pt-4'>
        <div className='text-xs'>
          {startDate ? (
            <div className='flex items-center gap-2'>
              <span className='font-semibold text-neutral-900 dark:text-white'>
                {endDate ? "Valt:" : "Preliminärt val:"} {startDate} → {effectiveEnd || "(Välj utcheckning)"}{" "}
                {nights > 0 ? `(${nights} nätter)` : ""}
              </span>
              {nights > 0 && (
                <span className='text-sky-700 dark:text-sky-400 font-bold'>
                  Ca {estimatedPrice.toLocaleString("sv-SE")} SEK
                </span>
              )}
            </div>
          ) : (
            <span className='text-neutral-600 dark:text-slate-500'>Klicka på kalendern för att välja datum.</span>
          )}
        </div>

        {startDate && endDate && (
          <button
            type='button'
            onClick={() => setIsFormOpen(true)}
            className='rounded-xl bg-sky-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-sky-600/20 hover:bg-sky-500 transition cursor-pointer'>
            Boka dessa datum
          </button>
        )}
      </div>

      {/* Blur Layer and Loader over Calendar Body */}
      {isCalendarLoading && (
        <div className='absolute inset-0 z-30 flex flex-col items-center justify-center rounded-2xl bg-neutral-100/50 dark:bg-slate-900/60 backdrop-blur-xs transition-all duration-200 pointer-events-auto'>
          <div className='flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-white/95 dark:bg-slate-950/95 border border-neutral-300 dark:border-slate-800 shadow-xl shadow-black/10'>
            <Loader2 className='w-4 h-4 text-sky-600 dark:text-sky-400 animate-spin' />
            <span className='text-xs font-semibold text-neutral-800 dark:text-slate-200'>
              Laddar kalender...
            </span>
          </div>
        </div>
      )}
    </div>

      {/* Floating HTML Popover for Admins (zero layout shift) */}
      {isAdmin && tooltipData && (
        <div
          className='fixed pointer-events-none z-50 -translate-x-1/2 -translate-y-full mb-3 transition-all duration-75 ease-out'
          style={{
            top: `${tooltipData.y - 12}px`,
            left: `${Math.min(
              Math.max(tooltipData.x, 150),
              typeof window !== "undefined" ? window.innerWidth - 150 : 500
            )}px`,
          }}>
          <div className='rounded-2xl border border-slate-700 bg-slate-900/95 p-3 text-xs text-white shadow-2xl backdrop-blur-md min-w-56 max-w-xs space-y-1.5'>
            <div className='flex items-center justify-between gap-2 border-b border-slate-800 pb-1.5'>
              <span className='font-bold text-slate-100 truncate flex items-center gap-1.5'>
                <User className='w-3.5 h-3.5 text-sky-400 shrink-0' />
                {tooltipData.booking.customerName || "Bokning"}
              </span>
              {isBlockedBooking(tooltipData.booking) ? (
                <span className='inline-flex items-center gap-1 text-[10px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded-md font-semibold border border-purple-400/30 shrink-0'>
                  Blockad
                </span>
              ) : isImportedBooking(tooltipData.booking) ? (
                <span className='inline-flex items-center gap-1 text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded-md font-semibold border border-amber-400/30 shrink-0'>
                  iCal
                </span>
              ) : (
                <span className='inline-flex items-center gap-1 text-[10px] bg-sky-500/20 text-sky-300 px-1.5 py-0.5 rounded-md font-semibold border border-sky-400/30 shrink-0'>
                  Direkt
                </span>
              )}
            </div>

            <div className='flex items-center gap-1.5 text-[11px] text-slate-300'>
              <CalendarIcon className='w-3 h-3 text-slate-400 shrink-0' />
              <span>
                {tooltipData.booking.startDate} → {tooltipData.booking.endDate} (
                {calculateNights(tooltipData.booking.startDate, tooltipData.booking.endDate)} nätter)
              </span>
            </div>

            <div className='pt-1 border-t border-slate-800/80 text-[10px] text-sky-400 font-medium flex items-center justify-between'>
              <span>Klicka för att administrera</span>
              <span>→</span>
            </div>
          </div>
        </div>
      )}

      {/* Booking Modal */}
      {isFormOpen && (
        <ModalPortal>
          <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-150'>
            <div className='w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 shadow-2xl dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-white my-8 max-h-[90vh] overflow-y-auto'>
              <div className='flex items-start justify-between border-b border-slate-200 dark:border-slate-800 pb-4 mb-4'>
                <div>
                  <h3 className='text-lg font-bold'>Slutför bokningsförfrågan</h3>
                  <p className='text-xs text-slate-500 dark:text-slate-400 mt-0.5'>
                    {objectName}: <span className='font-semibold text-slate-900 dark:text-white'>{startDate}</span> till{" "}
                    <span className='font-semibold text-slate-900 dark:text-white'>{endDate}</span> ({nights} nätter)
                  </p>
                </div>
                <button
                  type='button'
                  onClick={() => setIsFormOpen(false)}
                  className='rounded-xl p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition'>
                  <span className='sr-only'>Stäng</span>
                  ✕
                </button>
              </div>

              {bookingSuccess ? (
                <div className='flex flex-col items-center justify-center p-8 text-center text-emerald-600 dark:text-emerald-400 space-y-3'>
                  <CheckCircle2 className='w-14 h-14' />
                  <h4 className='font-bold text-base'>Tack för din bokningsförfrågan!</h4>
                  <p className='text-xs text-slate-500 max-w-md'>
                    En bekräftelsekopia har skickats till din e-post. Hyresvärden granskar uppgifterna och återkommer med avtal och instruktioner.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmitBooking} className='space-y-5'>
                  {bookingError && (
                    <div className='flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-600 dark:bg-rose-950/20 dark:text-rose-400'>
                      <AlertCircle className='w-4 h-4 shrink-0' />
                      <span>{bookingError}</span>
                    </div>
                  )}

                  {/* Informational Disclaimer regarding Booking.com sync */}
                  <div className='flex items-start gap-3 p-3.5 rounded-2xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800/40 text-xs text-sky-900 dark:text-sky-200'>
                    <Info className='w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5' />
                    <div className='space-y-1'>
                      <span className='font-semibold block'>Manuell avstämning mot externa bokningskanaler</span>
                      <p className='text-[11px] leading-relaxed text-sky-800/90 dark:text-sky-300/80'>
                        Boendet hyrs även ut via externa kanaler såsom Booking.com. Alla bokningar granskas och bekräftas manuellt av hyresvärden innan bindande avtal och betalningsinstruktioner utfärdas, för att säkerställa att inga dubbelbokningar sker.
                      </p>
                    </div>
                  </div>

                  {/* Booking Flow Choice: Preliminary Reservation vs General Inquiry */}
                  <div className='space-y-2'>
                    <label className='block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400'>
                      Typ av bokning
                    </label>
                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                      <label
                        className={`cursor-pointer rounded-2xl border p-3.5 transition flex flex-col justify-between ${
                          isPreliminary
                            ? "border-sky-500 bg-sky-50/50 dark:bg-sky-950/30 ring-1 ring-sky-500"
                            : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                        }`}>
                        <div className='flex items-center justify-between mb-1'>
                          <span className='font-semibold text-xs text-slate-900 dark:text-white flex items-center gap-1.5'>
                            <Clock className='w-3.5 h-3.5 text-sky-600 dark:text-sky-400' />
                            Preliminär reservation
                          </span>
                          <input
                            type='radio'
                            name='bookingType'
                            checked={isPreliminary}
                            onChange={() => setIsPreliminary(true)}
                            className='accent-sky-600'
                          />
                        </div>
                        <p className='text-[11px] text-slate-500 dark:text-slate-400 leading-normal'>
                          Håller datumen reserverade i 24–48 timmar medan vi förbereder hyresavtal.
                        </p>
                      </label>

                      <label
                        className={`cursor-pointer rounded-2xl border p-3.5 transition flex flex-col justify-between ${
                          !isPreliminary
                            ? "border-sky-500 bg-sky-50/50 dark:bg-sky-950/30 ring-1 ring-sky-500"
                            : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                        }`}>
                        <div className='flex items-center justify-between mb-1'>
                          <span className='font-semibold text-xs text-slate-900 dark:text-white flex items-center gap-1.5'>
                            <ShieldCheck className='w-3.5 h-3.5 text-slate-500' />
                            Bokningsförfrågan
                          </span>
                          <input
                            type='radio'
                            name='bookingType'
                            checked={!isPreliminary}
                            onChange={() => setIsPreliminary(false)}
                            className='accent-sky-600'
                          />
                        </div>
                        <p className='text-[11px] text-slate-500 dark:text-slate-400 leading-normal'>
                          Öppen prisförfrågan och intresseanmälan utan preliminär låsning av datumen.
                        </p>
                      </label>
                    </div>
                  </div>

                  {/* Guest Contact & Address Details */}
                  <div className='space-y-3 pt-1'>
                    <label className='block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400'>
                      Kontakt- och adressuppgifter
                    </label>

                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                      <div>
                        <label className='block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1'>
                          För- och efternamn *
                        </label>
                        <input
                          type='text'
                          required
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          placeholder='Anna Andersson'
                          className='w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent p-2.5 text-xs text-slate-900 dark:text-white focus:border-sky-500 focus:outline-none'
                        />
                      </div>

                      <div>
                        <label className='block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1'>
                          E-postadress *
                        </label>
                        <input
                          type='email'
                          required
                          value={customerEmail}
                          onChange={(e) => setCustomerEmail(e.target.value)}
                          placeholder='anna@example.com'
                          className='w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent p-2.5 text-xs text-slate-900 dark:text-white focus:border-sky-500 focus:outline-none'
                        />
                      </div>

                      <div>
                        <label className='block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1'>
                          Mobilnummer
                        </label>
                        <input
                          type='tel'
                          value={customerMobile}
                          onChange={(e) => setCustomerMobile(e.target.value)}
                          placeholder='+46 70 123 4567'
                          className='w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent p-2.5 text-xs text-slate-900 dark:text-white focus:border-sky-500 focus:outline-none'
                        />
                      </div>

                      <div>
                        <label className='block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1'>
                          Fast telefon (valfritt)
                        </label>
                        <input
                          type='tel'
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          placeholder='+46 8 123 456'
                          className='w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent p-2.5 text-xs text-slate-900 dark:text-white focus:border-sky-500 focus:outline-none'
                        />
                      </div>

                      <div className='sm:col-span-2'>
                        <label className='block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1'>
                          Gatuadress (Adressrad 1)
                        </label>
                        <input
                          type='text'
                          value={addressLine1}
                          onChange={(e) => setAddressLine1(e.target.value)}
                          placeholder='Storgatan 12'
                          className='w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent p-2.5 text-xs text-slate-900 dark:text-white focus:border-sky-500 focus:outline-none'
                        />
                      </div>

                      <div>
                        <label className='block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1'>
                          Postnummer
                        </label>
                        <input
                          type='text'
                          value={postalCode}
                          onChange={(e) => setPostalCode(e.target.value)}
                          placeholder='123 45'
                          className='w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent p-2.5 text-xs text-slate-900 dark:text-white focus:border-sky-500 focus:outline-none'
                        />
                      </div>

                      <div>
                        <label className='block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1'>
                          Ort
                        </label>
                        <input
                          type='text'
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder='Stockholm'
                          className='w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent p-2.5 text-xs text-slate-900 dark:text-white focus:border-sky-500 focus:outline-none'
                        />
                      </div>

                      <div className='sm:col-span-2'>
                        <label className='block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1'>
                          Land
                        </label>
                        <input
                          type='text'
                          value={country}
                          onChange={(e) => setCountry(e.target.value)}
                          placeholder='Sverige'
                          className='w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent p-2.5 text-xs text-slate-900 dark:text-white focus:border-sky-500 focus:outline-none'
                        />
                      </div>
                    </div>
                  </div>

                  {/* Guests and Pet Breakdown */}
                  <div className='space-y-3 pt-1'>
                    <label className='block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400'>
                      Sällskap
                    </label>

                    <div className='grid grid-cols-3 gap-3'>
                      <div>
                        <label className='block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1'>
                          Antal vuxna
                        </label>
                        <input
                          type='number'
                          min={1}
                          max={16}
                          value={adultsCount}
                          onChange={(e) => setAdultsCount(Number(e.target.value))}
                          className='w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent p-2.5 text-xs text-slate-900 dark:text-white focus:border-sky-500 focus:outline-none'
                        />
                      </div>

                      <div>
                        <label className='block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1'>
                          Antal barn
                        </label>
                        <input
                          type='number'
                          min={0}
                          max={10}
                          value={childrenCount}
                          onChange={(e) => setChildrenCount(Number(e.target.value))}
                          className='w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent p-2.5 text-xs text-slate-900 dark:text-white focus:border-sky-500 focus:outline-none'
                        />
                      </div>

                      <div>
                        <label className='block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1'>
                          Husdjur
                        </label>
                        <input
                          type='number'
                          min={0}
                          max={4}
                          value={petsCount}
                          onChange={(e) => setPetsCount(Number(e.target.value))}
                          className='w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent p-2.5 text-xs text-slate-900 dark:text-white focus:border-sky-500 focus:outline-none'
                        />
                      </div>
                    </div>
                  </div>

                  {/* Guest message / special requests */}
                  <div>
                    <label className='block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1'>
                      Meddelande eller särskilda önskemål till hyresvärden
                    </label>
                    <textarea
                      rows={3}
                      value={customerNotes}
                      onChange={(e) => setCustomerNotes(e.target.value)}
                      placeholder='T.ex. ankomsttid, frågor om barnsäng, sänglinne eller specifika önskemål...'
                      className='w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent p-2.5 text-xs text-slate-900 dark:text-white focus:border-sky-500 focus:outline-none resize-none'
                    />
                  </div>

                  {/* Summary & Price */}
                  <div className='border-t border-slate-200 dark:border-slate-800 pt-3 flex items-center justify-between'>
                    <div>
                      <span className='text-xs text-slate-500 block'>Uppskattat totalpris:</span>
                      <span className='text-[11px] text-slate-400'>
                        {nights} nätter • {adultsCount} vuxna{childrenCount > 0 ? `, ${childrenCount} barn` : ""}{petsCount > 0 ? `, ${petsCount} husdjur` : ""}
                      </span>
                    </div>
                    <span className='text-base font-bold text-sky-600 dark:text-sky-400'>
                      {estimatedPrice.toLocaleString("sv-SE")} SEK
                    </span>
                  </div>

                  {/* Actions */}
                  <div className='flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800'>
                    <button
                      type='button'
                      onClick={() => setIsFormOpen(false)}
                      className='px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition'>
                      Avbryt
                    </button>
                    <button
                      type='submit'
                      disabled={createMutation.isPending}
                      className='flex items-center gap-1.5 px-5 py-2.5 text-xs font-semibold rounded-xl bg-sky-600 text-white hover:bg-sky-500 shadow-lg shadow-sky-600/25 transition'>
                      {createMutation.isPending && <Loader2 className='w-3.5 h-3.5 animate-spin' />}
                      <span>{isPreliminary ? "Skicka preliminär reservation" : "Skicka bokningsförfrågan"}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </ModalPortal>
      )}
      {/* Admin Booking Details Modal */}
      {isAdmin && selectedAdminBooking && (
        <BookingDetailsModal
          booking={selectedAdminBooking}
          isOpen={Boolean(selectedAdminBooking)}
          onClose={() => setSelectedAdminBooking(null)}
          onSave={async (updated) => {
            const res = await fetch("/api/cms/bookings", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(updated),
            });
            if (!res.ok) {
              const err = await res.json();
              throw new Error(err.error || "Kunde inte spara bokning");
            }
            const saved = await res.json();
            await queryClient.invalidateQueries({ queryKey: ["bookings"] });
            setSelectedAdminBooking(saved);
          }}
          initialMode='view'
        />
      )}
    </div>
  );
}
