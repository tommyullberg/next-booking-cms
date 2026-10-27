"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  List,
  Filter,
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  Info,
  User,
  Mail,
  Phone,
  Users,
  Dog,
  Coins,
  Box,
  Globe,
  Layers,
  Copy,
  X,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { BookingItem, BookingObjectDetails } from "../../booking/types";
import { getISOWeekNumber, formatBookingWeekSpan } from "../../utils/weeks";

export interface BookingsCalendarViewProps {
  objects?: BookingObjectDetails[];
}

export interface ObjectColorTheme {
  id: string;
  name: string;
  badge: string;
  badgeActive: string;
  bar: string;
  barImported: string;
  dot: string;
  text: string;
  border: string;
}

export const OBJECT_COLOR_PALETTES: ObjectColorTheme[] = [
  {
    id: "sky",
    name: "Sky Blue",
    badge: "bg-sky-500/10 border-sky-500/30 text-sky-300",
    badgeActive: "bg-sky-600 text-white border-sky-400 font-semibold shadow-md shadow-sky-600/30",
    bar: "bg-sky-600 text-white border-sky-400/40",
    barImported: "bg-sky-950/90 text-sky-200 border border-sky-500/60 border-dashed",
    dot: "bg-sky-400",
    text: "text-sky-300",
    border: "border-sky-500",
  },
  {
    id: "emerald",
    name: "Emerald Green",
    badge: "bg-emerald-500/10 border-emerald-500/30 text-emerald-300",
    badgeActive: "bg-emerald-600 text-white border-emerald-400 font-semibold shadow-md shadow-emerald-600/30",
    bar: "bg-emerald-600 text-white border-emerald-400/40",
    barImported: "bg-emerald-950/90 text-emerald-200 border border-emerald-500/60 border-dashed",
    dot: "bg-emerald-400",
    text: "text-emerald-300",
    border: "border-emerald-500",
  },
  {
    id: "violet",
    name: "Violet Purple",
    badge: "bg-violet-500/10 border-violet-500/30 text-violet-300",
    badgeActive: "bg-violet-600 text-white border-violet-400 font-semibold shadow-md shadow-violet-600/30",
    bar: "bg-violet-600 text-white border-violet-400/40",
    barImported: "bg-violet-950/90 text-violet-200 border border-violet-500/60 border-dashed",
    dot: "bg-violet-400",
    text: "text-violet-300",
    border: "border-violet-500",
  },
  {
    id: "amber",
    name: "Amber Orange",
    badge: "bg-amber-500/10 border-amber-500/30 text-amber-300",
    badgeActive: "bg-amber-600 text-white border-amber-400 font-semibold shadow-md shadow-amber-600/30",
    bar: "bg-amber-600 text-white border-amber-400/40",
    barImported: "bg-amber-950/90 text-amber-200 border border-amber-500/60 border-dashed",
    dot: "bg-amber-400",
    text: "text-amber-300",
    border: "border-amber-500",
  },
  {
    id: "rose",
    name: "Rose Red",
    badge: "bg-rose-500/10 border-rose-500/30 text-rose-300",
    badgeActive: "bg-rose-600 text-white border-rose-400 font-semibold shadow-md shadow-rose-600/30",
    bar: "bg-rose-600 text-white border-rose-400/40",
    barImported: "bg-rose-950/90 text-rose-200 border border-rose-500/60 border-dashed",
    dot: "bg-rose-400",
    text: "text-rose-300",
    border: "border-rose-500",
  },
  {
    id: "teal",
    name: "Teal Cyan",
    badge: "bg-teal-500/10 border-teal-500/30 text-teal-300",
    badgeActive: "bg-teal-600 text-white border-teal-400 font-semibold shadow-md shadow-teal-600/30",
    bar: "bg-teal-600 text-white border-teal-400/40",
    barImported: "bg-teal-950/90 text-teal-200 border border-teal-500/60 border-dashed",
    dot: "bg-teal-400",
    text: "text-teal-300",
    border: "border-teal-500",
  },
  {
    id: "pink",
    name: "Pink",
    badge: "bg-pink-500/10 border-pink-500/30 text-pink-300",
    badgeActive: "bg-pink-600 text-white border-pink-400 font-semibold shadow-md shadow-pink-600/30",
    bar: "bg-pink-600 text-white border-pink-400/40",
    barImported: "bg-pink-950/90 text-pink-200 border border-pink-500/60 border-dashed",
    dot: "bg-pink-400",
    text: "text-pink-300",
    border: "border-pink-500",
  },
  {
    id: "indigo",
    name: "Indigo Blue",
    badge: "bg-indigo-500/10 border-indigo-500/30 text-indigo-300",
    badgeActive: "bg-indigo-600 text-white border-indigo-400 font-semibold shadow-md shadow-indigo-600/30",
    bar: "bg-indigo-600 text-white border-indigo-400/40",
    barImported: "bg-indigo-950/90 text-indigo-200 border border-indigo-500/60 border-dashed",
    dot: "bg-indigo-400",
    text: "text-indigo-300",
    border: "border-indigo-500",
  },
];

interface CalendarDaySlot {
  date: Date;
  dateStr: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
}

interface WeekRowData {
  days: CalendarDaySlot[];
  weekNumber: number;
  segments: Array<{
    booking: BookingItem;
    startCol: number; // 0..6
    endCol: number; // 0..6
    isCheckIn: boolean; // checks in this week
    isCheckOut: boolean; // checks out this week
    lane: number; // vertical row track in day cell
  }>;
  totalLanes: number;
}

type SortField = "stayDates" | "object" | "week";
type SortDirection = "asc" | "desc";

export function BookingsCalendarView({ objects = [] }: BookingsCalendarViewProps) {
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");

  // Sorting state for List View
  const [sortField, setSortField] = useState<SortField>("stayDates");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  // Filter states
  const [showLocalBookings, setShowLocalBookings] = useState<boolean>(true);
  const [showImportedBookings, setShowImportedBookings] = useState<boolean>(true);
  const [activeObjectIds, setActiveObjectIds] = useState<Set<string>>(() => new Set(objects.map((o) => o.id)));

  // Modal inspection state
  const [selectedBooking, setSelectedBooking] = useState<BookingItem | null>(null);
  const [copiedId, setCopiedId] = useState<boolean>(false);

  // Sync activeObjectIds when objects list loads or updates
  useEffect(() => {
    if (objects.length > 0) {
      setActiveObjectIds((prev) => {
        if (prev.size === 0) return new Set(objects.map((o) => o.id));
        return prev;
      });
    }
  }, [objects]);

  // Fetch all bookings
  const fetchBookings = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/cms/bookings", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setBookings(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("[BookingsCalendarView] Failed to fetch bookings:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  // Map each object to a persistent color theme
  const objectColorMap = useMemo(() => {
    const map: Record<string, ObjectColorTheme> = {};
    objects.forEach((obj, idx) => {
      map[obj.id] = OBJECT_COLOR_PALETTES[idx % OBJECT_COLOR_PALETTES.length];
    });
    return map;
  }, [objects]);

  // Month navigation helpers
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const handleToday = () => setCurrentDate(new Date());

  // Toggle single object filter
  const toggleObject = (id: string) => {
    setActiveObjectIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAllObjects = () => {
    setActiveObjectIds(new Set(objects.map((o) => o.id)));
  };

  const handleDeselectAllObjects = () => {
    setActiveObjectIds(new Set());
  };

  // Toggle column sorting
  const handleToggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Filter bookings based on active source toggles and active objects
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const isImported = b.status === "IMPORTED" || !!b.icalSourceId;
      if (isImported && !showImportedBookings) return false;
      if (!isImported && !showLocalBookings) return false;
      if (!activeObjectIds.has(b.objectId)) return false;
      return true;
    });
  }, [bookings, showImportedBookings, showLocalBookings, activeObjectIds]);

  // Count totals for display badges
  const localCount = useMemo(
    () => bookings.filter((b) => b.status !== "IMPORTED" && !b.icalSourceId).length,
    [bookings],
  );
  const importedCount = useMemo(
    () => bookings.filter((b) => b.status === "IMPORTED" || !!b.icalSourceId).length,
    [bookings],
  );

  // Build Month Calendar Weeks & Lanes
  const calendarWeeks = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1);
    const startDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7; // Monday = 0
    const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const todayStr = new Date().toISOString().split("T")[0];

    // Build raw day cells (weeks)
    const allDays: CalendarDaySlot[] = [];

    // Preceding month days
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const d = new Date(year, month - 1, dayNum);
      allDays.push({
        date: d,
        dateStr: d.toISOString().split("T")[0],
        dayNumber: dayNum,
        isCurrentMonth: false,
        isToday: d.toISOString().split("T")[0] === todayStr,
      });
    }

    // Current month days
    for (let dayNum = 1; dayNum <= daysInCurrentMonth; dayNum++) {
      const d = new Date(year, month, dayNum);
      allDays.push({
        date: d,
        dateStr: d.toISOString().split("T")[0],
        dayNumber: dayNum,
        isCurrentMonth: true,
        isToday: d.toISOString().split("T")[0] === todayStr,
      });
    }

    // Trailing next month days to complete 7-day rows (up to 35 or 42)
    const remaining = (7 - (allDays.length % 7)) % 7;
    for (let dayNum = 1; dayNum <= remaining; dayNum++) {
      const d = new Date(year, month + 1, dayNum);
      allDays.push({
        date: d,
        dateStr: d.toISOString().split("T")[0],
        dayNumber: dayNum,
        isCurrentMonth: false,
        isToday: d.toISOString().split("T")[0] === todayStr,
      });
    }

    // Break into week chunks of 7 days
    const weekRows: WeekRowData[] = [];
    for (let w = 0; w < allDays.length; w += 7) {
      const days = allDays.slice(w, w + 7);
      const weekStartStr = days[0].dateStr;
      const weekEndStr = days[6].dateStr;

      // Calculate ISO week number for this row
      const weekNumber = getISOWeekNumber(days[3].dateStr).week; // Thursday in week defines ISO week

      // Find bookings overlapping this week (inclusive of check-in and check-out dates)
      const weekBookings = filteredBookings.filter((b) => b.startDate <= weekEndStr && b.endDate >= weekStartStr);

      // Sort bookings: earliest startDate first, then longer stays first
      weekBookings.sort((a, b) => {
        if (a.startDate !== b.startDate) return a.startDate.localeCompare(b.startDate);
        return a.endDate.localeCompare(b.endDate);
      });

      // Assign horizontal lanes (tracks) within this week
      // A lane has 14 half-day slots (2 per day: morning 0, afternoon 1)
      const laneOccupancy: Array<boolean[]> = [];

      const segments = weekBookings.map((b) => {
        let startCol = 0;
        let endCol = 6;
        let isCheckIn = false;
        let isCheckOut = false;

        for (let col = 0; col < 7; col++) {
          if (days[col].dateStr === b.startDate) {
            startCol = col;
            isCheckIn = true;
          }
          if (days[col].dateStr === b.endDate) {
            endCol = col;
            isCheckOut = true;
          }
        }

        // Clamp to 0..6 if booking started before or ends after this week
        if (b.startDate < weekStartStr) {
          startCol = 0;
          isCheckIn = false;
        }
        if (b.endDate > weekEndStr) {
          endCol = 6;
          isCheckOut = false;
        }

        // Half-day slot range inside this week (0..13):
        // Each day `c` has morning `2*c` and afternoon `2*c + 1`
        // If check-in day: starts afternoon (2*startCol + 1)
        // If check-out day: ends morning (2*endCol)
        const halfStart = isCheckIn ? 2 * startCol + 1 : 2 * startCol;
        const halfEnd = isCheckOut ? 2 * endCol : 2 * endCol + 1;

        // Find lowest free lane
        let chosenLane = 0;
        while (true) {
          if (!laneOccupancy[chosenLane]) {
            laneOccupancy[chosenLane] = new Array(14).fill(false);
          }
          let hasConflict = false;
          for (let h = halfStart; h <= halfEnd; h++) {
            if (laneOccupancy[chosenLane][h]) {
              hasConflict = true;
              break;
            }
          }
          if (!hasConflict) {
            for (let h = halfStart; h <= halfEnd; h++) {
              laneOccupancy[chosenLane][h] = true;
            }
            break;
          }
          chosenLane++;
        }

        return {
          booking: b,
          startCol,
          endCol,
          isCheckIn,
          isCheckOut,
          lane: chosenLane,
        };
      });

      const totalLanes = Math.max(1, laneOccupancy.length);

      weekRows.push({
        days,
        weekNumber,
        segments,
        totalLanes,
      });
    }

    return weekRows;
  }, [year, month, filteredBookings]);

  // List view bookings sorted according to sortField and sortDirection
  const sortedListBookings = useMemo(() => {
    const list = [...filteredBookings];
    list.sort((a, b) => {
      let comparison = 0;
      if (sortField === "object") {
        const nameA = a.objectName || "";
        const nameB = b.objectName || "";
        comparison = nameA.localeCompare(nameB);
        if (comparison === 0) comparison = a.startDate.localeCompare(b.startDate);
      } else if (sortField === "week") {
        const aInfo = getISOWeekNumber(a.startDate);
        const bInfo = getISOWeekNumber(b.startDate);
        const aScore = aInfo.year * 100 + aInfo.week;
        const bScore = bInfo.year * 100 + bInfo.week;
        comparison = aScore - bScore;
        if (comparison === 0) comparison = a.startDate.localeCompare(b.startDate);
      } else {
        // default: "stayDates"
        comparison = a.startDate.localeCompare(b.startDate);
        if (comparison === 0) comparison = a.endDate.localeCompare(b.endDate);
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });
    return list;
  }, [filteredBookings, sortField, sortDirection]);

  const calculateNights = (start: string, end: string) => {
    try {
      const diff = new Date(end).getTime() - new Date(start).getTime();
      return Math.max(1, Math.round(diff / (1000 * 60 * 60 * 24)));
    } catch {
      return 1;
    }
  };

  const handleCopyUid = (uid?: string | null) => {
    if (!uid) return;
    navigator.clipboard.writeText(uid);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className='w-3 h-3 text-slate-500 opacity-60' />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp className='w-3 h-3 text-sky-400 font-bold' />
    ) : (
      <ArrowDown className='w-3 h-3 text-sky-400 font-bold' />
    );
  };

  return (
    <div className='space-y-6'>
      {/* Top Header Card */}
      <div className='rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur shadow-xl'>
        <div className='flex flex-col lg:flex-row lg:items-center justify-between gap-4'>
          <div className='flex items-center gap-3'>
            <div className='h-10 w-10 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/20'>
              <CalendarIcon className='w-5 h-5' />
            </div>
            <div>
              <h1 className='text-xl font-bold text-white tracking-tight'>Bookings Calendar</h1>
              <p className='text-xs text-slate-400'>
                Visual reservation calendar across all rental units with changeovers and channel synchronization.
              </p>
            </div>
          </div>

          {/* View Mode & Date Switchers */}
          <div className='flex flex-wrap items-center gap-2.5'>
            {/* View Mode Tabs */}
            <div className='inline-flex rounded-xl bg-slate-950/70 p-1 border border-slate-800 text-xs'>
              <button
                type='button'
                onClick={() => setViewMode("calendar")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                  viewMode === "calendar" ? "bg-slate-800 text-white shadow-sm" : "text-slate-400 hover:text-white"
                }`}>
                <CalendarIcon className='w-3.5 h-3.5' />
                <span>Calendar view</span>
              </button>
              <button
                type='button'
                onClick={() => setViewMode("list")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                  viewMode === "list" ? "bg-slate-800 text-white shadow-sm" : "text-slate-400 hover:text-white"
                }`}>
                <List className='w-3.5 h-3.5' />
                <span>List view</span>
              </button>
            </div>

            {/* Calendar Month Controls (shown in calendar mode) */}
            {viewMode === "calendar" && (
              <div className='flex items-center gap-1.5 bg-slate-950/70 border border-slate-800 rounded-xl px-2 py-1'>
                <button
                  type='button'
                  onClick={handlePrevMonth}
                  className='p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer'
                  title='Previous month'>
                  <ChevronLeft className='w-4 h-4' />
                </button>
                <button
                  type='button'
                  onClick={handleToday}
                  className='px-2 py-0.5 text-[11px] font-semibold text-slate-300 hover:text-white hover:bg-slate-800 rounded transition cursor-pointer'>
                  Today
                </button>
                <span className='text-xs font-bold text-white min-w-32 text-center'>
                  {monthNames[month]} {year}
                </span>
                <button
                  type='button'
                  onClick={handleNextMonth}
                  className='p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer'
                  title='Next month'>
                  <ChevronRight className='w-4 h-4' />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Filters & Toggles Toolbar */}
        <div className='mt-5 pt-4 border-t border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs'>
          {/* Source toggles (Local vs Booking.com) */}
          <div className='flex flex-wrap items-center gap-2'>
            <span className='text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1'>Source:</span>

            {/* Local bookings toggle */}
            <button
              type='button'
              onClick={() => setShowLocalBookings((prev) => !prev)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition cursor-pointer ${
                showLocalBookings
                  ? "bg-sky-500/15 border-sky-500/40 text-sky-200 shadow-sm"
                  : "bg-slate-950/50 border-slate-800 text-slate-500 hover:text-slate-300"
              }`}>
              <span className={`w-2 h-2 rounded-full ${showLocalBookings ? "bg-sky-400" : "bg-slate-600"}`} />
              <span>Local Bookings</span>
              <span className='ml-1 px-1.5 py-0.2 rounded-full bg-slate-800 text-[10px] text-slate-300'>
                {localCount}
              </span>
            </button>

            {/* Booking.com toggle */}
            <button
              type='button'
              onClick={() => setShowImportedBookings((prev) => !prev)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition cursor-pointer ${
                showImportedBookings
                  ? "bg-indigo-500/15 border-indigo-500/40 text-indigo-200 shadow-sm"
                  : "bg-slate-950/50 border-slate-800 text-slate-500 hover:text-slate-300"
              }`}>
              <Globe className={`w-3.5 h-3.5 ${showImportedBookings ? "text-indigo-400" : "text-slate-600"}`} />
              <span>Booking.com (iCal)</span>
              <span className='ml-1 px-1.5 py-0.2 rounded-full bg-slate-800 text-[10px] text-slate-300'>
                {importedCount}
              </span>
            </button>
          </div>

          {/* Quick object selection actions */}
          <div className='flex items-center gap-2'>
            <button
              type='button'
              onClick={handleSelectAllObjects}
              className='text-[11px] text-slate-400 hover:text-white underline decoration-slate-600 cursor-pointer'>
              Show all units
            </button>
            <span className='text-slate-700'>•</span>
            <button
              type='button'
              onClick={handleDeselectAllObjects}
              className='text-[11px] text-slate-400 hover:text-white underline decoration-slate-600 cursor-pointer'>
              Hide all units
            </button>
          </div>
        </div>

        {/* Rental Objects Filter Badges */}
        <div className='mt-3 flex flex-wrap items-center gap-2'>
          <span className='text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1 flex items-center gap-1'>
            <Box className='w-3.5 h-3.5 text-slate-500' />
            <span>Units:</span>
          </span>

          {objects.map((obj) => {
            const theme = objectColorMap[obj.id] || OBJECT_COLOR_PALETTES[0];
            const isActive = activeObjectIds.has(obj.id);

            return (
              <button
                key={obj.id}
                type='button'
                onClick={() => toggleObject(obj.id)}
                className={`group inline-flex items-center gap-2 px-3 py-1 rounded-xl border text-xs transition select-none cursor-pointer ${
                  isActive
                    ? theme.badgeActive
                    : "bg-slate-950/60 border-slate-800 text-slate-500 hover:border-slate-700 hover:text-slate-300"
                }`}>
                <span
                  className={`w-2 h-2 rounded-full transition-transform group-hover:scale-125 ${
                    isActive ? "bg-white" : theme.dot
                  }`}
                />
                <span>{obj.name}</span>
                {isActive && <Check className='w-3 h-3 stroke-[2.5]' />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main View: Calendar or List */}
      {viewMode === "calendar" ? (
        <div className='rounded-2xl border border-slate-800 bg-slate-900/40 overflow-hidden shadow-2xl'>
          {/* Weekday headers with Wk column */}
          <div className='grid grid-cols-[44px_repeat(7,1fr)] border-b border-slate-800 bg-slate-950/80 text-center text-[11px] font-semibold text-slate-400 uppercase tracking-wider py-2.5'>
            <span className='text-slate-500 font-mono text-[10px]'>Wk</span>
            <span>Monday</span>
            <span>Tuesday</span>
            <span>Wednesday</span>
            <span>Thursday</span>
            <span>Friday</span>
            <span>Saturday</span>
            <span>Sunday</span>
          </div>

          {/* Week Rows */}
          <div className='divide-y divide-slate-800/80 bg-slate-950/30'>
            {calendarWeeks.map((week, wIdx) => {
              // Row minimum height based on number of active lanes
              const laneHeight = 26; // px per booking bar
              const baseHeaderHeight = 32; // px for date number
              const rowMinHeight = Math.max(90, baseHeaderHeight + week.totalLanes * laneHeight + 12);

              return (
                <div key={wIdx} className='flex relative group/week' style={{ minHeight: `${rowMinHeight}px` }}>
                  {/* Left Week Number Column */}
                  <div className='w-[44px] shrink-0 border-r border-slate-800/80 bg-slate-950/60 flex items-center justify-center font-mono text-[11px] text-amber-400/80 font-bold select-none'>
                    {week.weekNumber}
                  </div>

                  {/* 7-Day Grid & Events Area */}
                  <div className='flex-1 relative'>
                    {/* Grid background day cells (7 columns) */}
                    <div className='absolute inset-0 grid grid-cols-7 divide-x divide-slate-800/60 pointer-events-none'>
                      {week.days.map((day, dIdx) => (
                        <div
                          key={dIdx}
                          className={`h-full p-2 flex flex-col justify-between transition-colors ${
                            !day.isCurrentMonth
                              ? "bg-slate-950/60 text-slate-600"
                              : day.isToday
                                ? "bg-sky-950/20"
                                : "hover:bg-slate-900/30"
                          }`}>
                          <div className='flex items-center justify-between pointer-events-auto'>
                            <span
                              className={`text-xs font-mono font-semibold ${
                                day.isToday
                                  ? "inline-flex items-center justify-center w-6 h-6 rounded-full bg-sky-500 text-slate-950 font-bold shadow-md shadow-sky-500/30"
                                  : day.isCurrentMonth
                                    ? "text-slate-300"
                                    : "text-slate-600"
                              }`}>
                              {day.dayNumber}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Booking Segments (positioned absolute across columns in lanes) */}
                    <div className='relative pt-8 pb-2 px-1 z-10' style={{ height: `${rowMinHeight}px` }}>
                      {week.segments.map((seg, sIdx) => {
                        const theme = objectColorMap[seg.booking.objectId] || OBJECT_COLOR_PALETTES[0];
                        const isImported = seg.booking.status === "IMPORTED" || !!seg.booking.icalSourceId;
                        const nights = calculateNights(seg.booking.startDate, seg.booking.endDate);

                        // Calculate horizontal position across the 7-day grid (0% to 100%)
                        // Each day column is (100 / 7)% ≈ 14.2857%
                        const colWidthPct = 100 / 7;
                        const leftDayPct = seg.startCol * colWidthPct;
                        const rightDayPct = (seg.endCol + 1) * colWidthPct;

                        // Check-in day: starts in the afternoon at 50% of the start column
                        // Check-out day: ends in the morning at 50% of the end column
                        const actualLeftPct = seg.isCheckIn ? leftDayPct + colWidthPct * 0.5 : leftDayPct;
                        const actualRightPct = seg.isCheckOut ? (seg.endCol + 0.5) * colWidthPct : rightDayPct;
                        const widthPct = Math.max(1, actualRightPct - actualLeftPct);

                        // Rounded corner styles:
                        // Round on check-in start and check-out end; keep square when spanning across week boundaries
                        const roundedClass = `${
                          seg.isCheckIn ? "rounded-l-lg ml-0.5" : "rounded-l-none"
                        } ${seg.isCheckOut ? "rounded-r-lg mr-0.5" : "rounded-r-none"}`;

                        const topPx = seg.lane * laneHeight;

                        const tooltipText = `${seg.booking.objectName || "Unit"}: ${
                          seg.booking.customerName || "Reservation"
                        } (${seg.booking.startDate} → ${seg.booking.endDate}, w.${formatBookingWeekSpan(
                          seg.booking.startDate,
                          seg.booking.endDate,
                        )}, ${nights} nights)${isImported ? " [Booking.com]" : ""}`;

                        return (
                          <div
                            key={`${seg.booking.id}-${sIdx}`}
                            onClick={() => setSelectedBooking(seg.booking)}
                            title={tooltipText}
                            style={{
                              left: `${actualLeftPct}%`,
                              width: `calc(${widthPct}% - 2px)`,
                              top: `${topPx}px`,
                              height: `${laneHeight - 3}px`,
                            }}
                            className={`absolute flex items-center px-2 text-[11px] font-medium transition cursor-pointer select-none shadow-sm hover:z-20 hover:brightness-125 hover:shadow-lg ${roundedClass} ${
                              isImported ? theme.barImported : theme.bar
                            }`}>
                            {/* Inner bar content */}
                            <div className='flex items-center gap-1.5 truncate min-w-0 w-full'>
                              {isImported ? (
                                <Globe className='w-3 h-3 shrink-0 opacity-80' />
                              ) : (
                                <span className='w-1.5 h-1.5 rounded-full bg-white shrink-0' />
                              )}
                              <span className='font-semibold truncate'>{seg.booking.objectName}:</span>
                              <span className='truncate opacity-95'>
                                {seg.booking.customerName || (isImported ? "Booking.com" : "Guest")}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* List View */
        <div className='rounded-2xl border border-slate-800 bg-slate-900/40 overflow-hidden shadow-xl'>
          <div className='p-4 border-b border-slate-800 flex items-center justify-between'>
            <h2 className='text-sm font-semibold text-white flex items-center gap-2'>
              <List className='w-4 h-4 text-slate-400' />
              <span>Chronological Bookings Stream</span>
            </h2>
            <span className='text-xs text-slate-400'>{sortedListBookings.length} bookings match current filters</span>
          </div>

          {isLoading ? (
            <div className='p-12 text-center text-slate-400 text-xs'>Loading reservations...</div>
          ) : sortedListBookings.length === 0 ? (
            <div className='p-12 text-center text-slate-400 text-xs'>No bookings match the active filters.</div>
          ) : (
            <div className='overflow-x-auto'>
              <table className='w-full text-left text-xs'>
                <thead className='bg-slate-950/70 text-slate-400 font-semibold border-b border-slate-800 uppercase text-[10px] tracking-wider'>
                  <tr>
                    {/* Unit / Object (sortable) */}
                    <th
                      onClick={() => handleToggleSort("object")}
                      className='py-3 px-4 cursor-pointer hover:text-white transition select-none'>
                      <div className='flex items-center gap-1.5'>
                        <span>Unit / Object</span>
                        {renderSortIcon("object")}
                      </div>
                    </th>

                    {/* Stay Dates (sortable) */}
                    <th
                      onClick={() => handleToggleSort("stayDates")}
                      className='py-3 px-3 cursor-pointer hover:text-white transition select-none'>
                      <div className='flex items-center gap-1.5'>
                        <span>Stay Dates</span>
                        {renderSortIcon("stayDates")}
                      </div>
                    </th>

                    {/* Week column between Stay dates and Nights (sortable) */}
                    <th
                      onClick={() => handleToggleSort("week")}
                      className='py-3 px-3 cursor-pointer hover:text-white transition select-none'>
                      <div className='flex items-center gap-1.5'>
                        <span>Week</span>
                        {renderSortIcon("week")}
                      </div>
                    </th>

                    {/* Nights */}
                    <th className='py-3 px-3 text-center'>Nights</th>

                    {/* Guest / Channel */}
                    <th className='py-3 px-4'>Guest / Channel</th>

                    {/* Guests & Pets */}
                    <th className='py-3 px-3'>Guests & Pets</th>

                    {/* Price */}
                    <th className='py-3 px-3 text-right'>Price</th>

                    {/* Status */}
                    <th className='py-3 px-3 text-center'>Status</th>

                    {/* Action */}
                    <th className='py-3 px-4 text-center'>Action</th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-slate-800/60 text-slate-200'>
                  {sortedListBookings.map((b) => {
                    const theme = objectColorMap[b.objectId] || OBJECT_COLOR_PALETTES[0];
                    const isImported = b.status === "IMPORTED" || !!b.icalSourceId;
                    const nights = calculateNights(b.startDate, b.endDate);
                    const weekSpan = formatBookingWeekSpan(b.startDate, b.endDate);

                    return (
                      <tr key={b.id} className='hover:bg-slate-800/30 transition'>
                        {/* Unit name */}
                        <td className='py-3.5 px-4 font-semibold text-white'>
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs ${theme.badge}`}>
                            <span className={`w-2 h-2 rounded-full ${theme.dot}`} />
                            <span>{b.objectName || "Rental Unit"}</span>
                          </span>
                        </td>

                        {/* Dates */}
                        <td className='py-3.5 px-3'>
                          <div className='font-mono text-xs text-white'>
                            {b.startDate} → {b.endDate}
                          </div>
                          <div className='text-[10px] text-slate-500 mt-0.5'>Check-in 15:00 • Check-out 11:00</div>
                        </td>

                        {/* Week column (between Stay dates and Nights) */}
                        <td className='py-3.5 px-3 font-mono'>
                          <span className='inline-flex items-center px-2.5 py-0.5 rounded-md bg-slate-800 border border-slate-700/80 text-[11px] font-semibold text-amber-300'>
                            w.{weekSpan}
                          </span>
                        </td>

                        {/* Nights */}
                        <td className='py-3.5 px-3 text-center'>
                          <span className='inline-block px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold font-mono'>
                            {nights} {nights === 1 ? "night" : "nights"}
                          </span>
                        </td>

                        {/* Guest / Source */}
                        <td className='py-3.5 px-4'>
                          <div className='font-semibold text-white'>
                            {b.customerName || (isImported ? "Booking.com Guest" : "Guest")}
                          </div>
                          {isImported ? (
                            <span className='inline-flex items-center gap-1 text-[10px] text-indigo-400 mt-0.5'>
                              <Globe className='w-3 h-3' />
                              <span>Booking.com (iCal)</span>
                            </span>
                          ) : (
                            <div className='text-[10px] text-slate-400 mt-0.5 truncate max-w-xs'>
                              {b.customerEmail || "Direct Reservation"}
                            </div>
                          )}
                        </td>

                        {/* Guests & Pets */}
                        <td className='py-3.5 px-3 text-slate-400 text-xs'>
                          <div className='flex items-center gap-2'>
                            <span>{b.guestsCount || 2} pers</span>
                            {(b.petsCount || 0) > 0 && (
                              <span className='inline-flex items-center gap-0.5 text-amber-400 text-[11px]'>
                                <Dog className='w-3 h-3' />
                                <span>{b.petsCount}</span>
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Price */}
                        <td className='py-3.5 px-3 text-right font-mono font-medium text-slate-100'>
                          {b.price ? `${b.price.toLocaleString("sv-SE")} SEK` : "—"}
                        </td>

                        {/* Status */}
                        <td className='py-3.5 px-3 text-center'>
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              b.status === "APPROVED"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                                : b.status === "PENDING"
                                  ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                                  : b.status === "IMPORTED"
                                    ? "bg-indigo-500/10 text-indigo-300 border border-indigo-500/30"
                                    : "bg-slate-800 text-slate-400"
                            }`}>
                            {b.status}
                          </span>
                        </td>

                        {/* Action */}
                        <td className='py-3.5 px-4 text-center'>
                          <button
                            type='button'
                            onClick={() => setSelectedBooking(b)}
                            className='rounded-lg bg-slate-800 hover:bg-slate-700 px-3 py-1 text-[11px] font-medium text-slate-200 transition cursor-pointer'>
                            Details
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
      )}

      {/* Booking Details Modal Dialog */}
      {selectedBooking && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-150'>
          <div className='w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl p-6 text-white my-8'>
            {/* Modal Header */}
            <div className='flex items-start justify-between border-b border-slate-800 pb-4 mb-4'>
              <div className='flex items-center gap-3'>
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    selectedBooking.status === "IMPORTED"
                      ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"
                      : "bg-sky-500/20 text-sky-400 border border-sky-500/30"
                  }`}>
                  {selectedBooking.status === "IMPORTED" ? (
                    <Globe className='w-5 h-5' />
                  ) : (
                    <CalendarIcon className='w-5 h-5' />
                  )}
                </div>
                <div>
                  <h3 className='text-base font-bold text-white'>
                    {selectedBooking.customerName || "Reservation Details"}
                  </h3>
                  <div className='flex items-center gap-2 mt-0.5'>
                    <span className='text-xs text-slate-400'>
                      Unit: <span className='font-semibold text-white'>{selectedBooking.objectName}</span>
                    </span>
                    <span className='text-slate-600'>•</span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.2 rounded-full ${
                        selectedBooking.status === "APPROVED"
                          ? "bg-emerald-500/15 text-emerald-400"
                          : selectedBooking.status === "PENDING"
                            ? "bg-amber-500/15 text-amber-400"
                            : selectedBooking.status === "IMPORTED"
                              ? "bg-indigo-500/15 text-indigo-300"
                              : "bg-slate-800 text-slate-400"
                      }`}>
                      {selectedBooking.status}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type='button'
                onClick={() => setSelectedBooking(null)}
                className='p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer'>
                <X className='w-5 h-5' />
              </button>
            </div>

            {/* Modal Body Info Cards */}
            <div className='space-y-4'>
              {/* Dates & Times Card */}
              <div className='p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 grid grid-cols-3 gap-3 text-xs'>
                <div>
                  <span className='text-slate-400 block text-[11px] mb-0.5'>Check-in</span>
                  <div className='font-bold text-white font-mono text-sm'>{selectedBooking.startDate}</div>
                  <span className='text-[10px] text-sky-400'>From 15:00</span>
                </div>
                <div>
                  <span className='text-slate-400 block text-[11px] mb-0.5'>Check-out</span>
                  <div className='font-bold text-white font-mono text-sm'>{selectedBooking.endDate}</div>
                  <span className='text-[10px] text-amber-400'>Until 11:00</span>
                </div>
                <div>
                  <span className='text-slate-400 block text-[11px] mb-0.5'>Week & Duration</span>
                  <div className='font-bold text-amber-300 font-mono text-sm'>
                    w.{formatBookingWeekSpan(selectedBooking.startDate, selectedBooking.endDate)}
                  </div>
                  <span className='text-[10px] text-slate-400'>
                    {calculateNights(selectedBooking.startDate, selectedBooking.endDate)} nights
                  </span>
                </div>
              </div>

              {/* Guest / Customer Details */}
              <div className='p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 space-y-2.5 text-xs'>
                <span className='text-[11px] font-semibold text-slate-400 uppercase tracking-wider block'>
                  Guest & Reservation
                </span>

                <div className='grid grid-cols-2 gap-2 pt-1'>
                  <div>
                    <span className='text-slate-500 text-[11px] block'>Customer Name</span>
                    <span className='font-semibold text-white'>{selectedBooking.customerName || "—"}</span>
                  </div>

                  <div>
                    <span className='text-slate-500 text-[11px] block'>Total Duration</span>
                    <span className='font-semibold text-white'>
                      {calculateNights(selectedBooking.startDate, selectedBooking.endDate)} nights
                    </span>
                  </div>

                  {selectedBooking.customerEmail && (
                    <div className='col-span-2 flex items-center gap-2 pt-1'>
                      <Mail className='w-3.5 h-3.5 text-slate-400 shrink-0' />
                      <a
                        href={`mailto:${selectedBooking.customerEmail}`}
                        className='text-sky-400 hover:underline truncate'>
                        {selectedBooking.customerEmail}
                      </a>
                    </div>
                  )}

                  {selectedBooking.customerPhone && (
                    <div className='col-span-2 flex items-center gap-2'>
                      <Phone className='w-3.5 h-3.5 text-slate-400 shrink-0' />
                      <a href={`tel:${selectedBooking.customerPhone}`} className='text-sky-400 hover:underline'>
                        {selectedBooking.customerPhone}
                      </a>
                    </div>
                  )}

                  <div className='pt-1'>
                    <span className='text-slate-500 text-[11px] block'>Number of Guests</span>
                    <span className='font-medium text-slate-200'>{selectedBooking.guestsCount || 2} persons</span>
                  </div>

                  <div className='pt-1'>
                    <span className='text-slate-500 text-[11px] block'>Pets</span>
                    <span className='font-medium text-slate-200'>
                      {selectedBooking.petsCount ? `${selectedBooking.petsCount} pets` : "No pets"}
                    </span>
                  </div>
                </div>

                {selectedBooking.price !== null && selectedBooking.price !== undefined && (
                  <div className='pt-2 border-t border-slate-800/80 flex items-center justify-between'>
                    <span className='text-slate-400'>Total Price:</span>
                    <span className='text-base font-bold text-amber-400 font-mono'>
                      {selectedBooking.price.toLocaleString("sv-SE")} SEK
                    </span>
                  </div>
                )}
              </div>

              {/* Source Details (Booking.com / iCal UID) */}
              {selectedBooking.icalSourceId && (
                <div className='p-3.5 rounded-xl border border-indigo-500/20 bg-indigo-950/20 text-xs space-y-1.5'>
                  <span className='text-[11px] font-semibold text-indigo-300 flex items-center gap-1.5'>
                    <Globe className='w-3.5 h-3.5' />
                    <span>Booking.com / iCal Source</span>
                  </span>
                  <div className='flex items-center justify-between gap-2 pt-0.5'>
                    <span
                      className='font-mono text-[11px] text-slate-300 truncate max-w-xs'
                      title={selectedBooking.icalSourceId}>
                      {selectedBooking.icalSourceId}
                    </span>
                    <button
                      type='button'
                      onClick={() => handleCopyUid(selectedBooking.icalSourceId)}
                      className='p-1 rounded text-slate-400 hover:text-white transition shrink-0 cursor-pointer'
                      title='Copy UID'>
                      {copiedId ? <Check className='w-3.5 h-3.5 text-emerald-400' /> : <Copy className='w-3.5 h-3.5' />}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className='mt-6 pt-4 border-t border-slate-800 flex items-center justify-between gap-2'>
              <button
                type='button'
                onClick={() => setSelectedBooking(null)}
                className='rounded-xl border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition cursor-pointer'>
                Close
              </button>

              <div className='flex items-center gap-2'>
                {/* Local booking actions: open in same window or open in new tab */}
                {selectedBooking.status !== "IMPORTED" && !selectedBooking.icalSourceId ? (
                  <>
                    <button
                      type='button'
                      onClick={() => {
                        window.location.href = `/admin/bookings/${selectedBooking.id}`;
                      }}
                      className='rounded-xl bg-slate-800 hover:bg-slate-700 px-3.5 py-2 text-xs font-semibold text-slate-200 transition cursor-pointer'>
                      Open booking
                    </button>
                    <button
                      type='button'
                      onClick={() => {
                        window.open(`/admin/bookings/${selectedBooking.id}`, "_blank");
                      }}
                      className='flex items-center gap-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-sky-600/20 transition cursor-pointer'>
                      <ExternalLink className='w-3.5 h-3.5' />
                      <span>Open in new tab</span>
                    </button>
                  </>
                ) : (
                  <button
                    type='button'
                    onClick={() => handleCopyUid(selectedBooking.icalSourceId)}
                    className='flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-600/20 transition cursor-pointer'>
                    <Copy className='w-3.5 h-3.5' />
                    <span>{copiedId ? "Copied UID!" : "Copy Booking UID"}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
