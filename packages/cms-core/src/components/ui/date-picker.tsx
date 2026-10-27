"use client";

import React, { useState, useEffect, useRef } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from "lucide-react";

export interface DatePickerProps {
  value: string; // ISO string "YYYY-MM-DD" or ""
  onChange: (val: string) => void;
  placeholder?: string;
  locale?: "en" | "sv";
  disabled?: boolean;
  minDate?: string; // "YYYY-MM-DD"
  maxDate?: string; // "YYYY-MM-DD"
  className?: string;
  allowClear?: boolean;
  clearLabel?: string;
  openDirection?: "up" | "down" | "auto";
  showWeekNumbers?: boolean;
}

const MONTH_NAMES_EN = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const MONTH_NAMES_SV = [
  "Januari", "Februari", "Mars", "April", "Maj", "Juni",
  "Juli", "Augusti", "September", "Oktober", "November", "December"
];

const WEEKDAY_NAMES_EN = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const WEEKDAY_NAMES_SV = ["Mån", "Tis", "Ons", "Tor", "Fre", "Lör", "Sön"];

function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

function toISODateString(year: number, month: number, day: number): string {
  return `${year}-${pad2(month + 1)}-${pad2(day)}`;
}

function parseISODate(str?: string): { year: number; month: number; day: number } | null {
  if (!str) return null;
  const parts = str.trim().split("-");
  if (parts.length !== 3) return null;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
  if (month < 0 || month > 11 || day < 1 || day > 31) return null;
  return { year, month, day };
}

function getISOWeekNumber(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

export function DatePicker({
  value,
  onChange,
  placeholder,
  locale = "en",
  disabled = false,
  minDate,
  maxDate,
  className = "",
  allowClear = true,
  clearLabel,
  openDirection = "auto",
  showWeekNumbers = true,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value || "");
  const [openUpward, setOpenUpward] = useState(openDirection === "up");

  const parsed = parseISODate(value);
  const today = new Date();
  const todayISO = toISODateString(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  const [viewYear, setViewYear] = useState<number>(
    parsed ? parsed.year : today.getFullYear()
  );
  const [viewMonth, setViewMonth] = useState<number>(
    parsed ? parsed.month : today.getMonth()
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInputValue(value || "");
    if (value) {
      const p = parseISODate(value);
      if (p) {
        setViewYear(p.year);
        setViewMonth(p.month);
      }
    }
  }, [value]);

  // Adjust direction on open
  useEffect(() => {
    if (isOpen) {
      if (openDirection === "up") {
        setOpenUpward(true);
      } else if (openDirection === "down") {
        setOpenUpward(false);
      } else if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        setOpenUpward(spaceBelow < 340);
      }
    }
  }, [isOpen, openDirection]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const monthNames = locale === "sv" ? MONTH_NAMES_SV : MONTH_NAMES_EN;
  const weekdayNames = locale === "sv" ? WEEKDAY_NAMES_SV : WEEKDAY_NAMES_EN;
  const defaultPlaceholder = locale === "sv" ? "ÅÅÅÅ-MM-DD" : "YYYY-MM-DD";
  const effectivePlaceholder = placeholder || defaultPlaceholder;
  const effectiveClearLabel =
    clearLabel || (locale === "sv" ? "Rensa" : "Clear");
  const todayLabel = locale === "sv" ? "Idag" : "Today";
  const weekColHeader = locale === "sv" ? "V." : "Wk";

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleSelectDay = (dayISO: string) => {
    if (disabled) return;
    if (minDate && dayISO < minDate) return;
    if (maxDate && dayISO > maxDate) return;
    onChange(dayISO);
    setInputValue(dayISO);
    setIsOpen(false);
  };

  const handleClear = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    onChange("");
    setInputValue("");
    setIsOpen(false);
  };

  const handleSelectToday = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleSelectDay(todayISO);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);

    // If matches complete ISO YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
      const p = parseISODate(val);
      if (p) {
        onChange(val);
        setViewYear(p.year);
        setViewMonth(p.month);
      }
    } else if (val.trim() === "") {
      onChange("");
    }
  };

  const handleInputBlur = () => {
    if (inputValue.trim() === "") {
      onChange("");
    } else {
      const p = parseISODate(inputValue);
      if (p) {
        const normalized = toISODateString(p.year, p.month, p.day);
        onChange(normalized);
        setInputValue(normalized);
      } else {
        // revert to last valid value
        setInputValue(value || "");
      }
    }
  };

  // Build month calendar grid (ISO weeks starting Monday)
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay(); // 0 is Sun, 1 is Mon...
  const startOffset = (firstDayOfMonth + 6) % 7; // 0 for Mon, 1 for Tue, ..., 6 for Sun
  const daysInCurrentMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  const days: Array<{
    iso: string;
    dayNum: number;
    isCurrentMonth: boolean;
    isToday: boolean;
    isSelected: boolean;
    isDisabled: boolean;
  }> = [];

  // Trailing days from previous month
  for (let i = startOffset - 1; i >= 0; i--) {
    const dayNum = daysInPrevMonth - i;
    const prevMonthIdx = viewMonth === 0 ? 11 : viewMonth - 1;
    const prevYear = viewMonth === 0 ? viewYear - 1 : viewYear;
    const iso = toISODateString(prevYear, prevMonthIdx, dayNum);
    days.push({
      iso,
      dayNum,
      isCurrentMonth: false,
      isToday: iso === todayISO,
      isSelected: iso === value,
      isDisabled:
        (Boolean(minDate) && iso < (minDate || "")) ||
        (Boolean(maxDate) && iso > (maxDate || "")),
    });
  }

  // Days in current month
  for (let dayNum = 1; dayNum <= daysInCurrentMonth; dayNum++) {
    const iso = toISODateString(viewYear, viewMonth, dayNum);
    days.push({
      iso,
      dayNum,
      isCurrentMonth: true,
      isToday: iso === todayISO,
      isSelected: iso === value,
      isDisabled:
        (Boolean(minDate) && iso < (minDate || "")) ||
        (Boolean(maxDate) && iso > (maxDate || "")),
    });
  }

  // Leading days from next month to complete standard 35 or 42 grid cells
  const remainingCells = (7 - (days.length % 7)) % 7;
  for (let dayNum = 1; dayNum <= remainingCells; dayNum++) {
    const nextMonthIdx = viewMonth === 11 ? 0 : viewMonth + 1;
    const nextYear = viewMonth === 11 ? viewYear + 1 : viewYear;
    const iso = toISODateString(nextYear, nextMonthIdx, dayNum);
    days.push({
      iso,
      dayNum,
      isCurrentMonth: false,
      isToday: iso === todayISO,
      isSelected: iso === value,
      isDisabled:
        (Boolean(minDate) && iso < (minDate || "")) ||
        (Boolean(maxDate) && iso > (maxDate || "")),
    });
  }

  // Chunk days into weeks of 7
  const weeks: Array<{
    weekNum: number;
    days: typeof days;
  }> = [];

  for (let i = 0; i < days.length; i += 7) {
    const weekDays = days.slice(i, i + 7);
    const thursday = weekDays[3] || weekDays[0];
    const p = parseISODate(thursday.iso);
    const wNum = p ? getISOWeekNumber(new Date(p.year, p.month, p.day)) : 0;
    weeks.push({
      weekNum: wNum,
      days: weekDays,
    });
  }

  return (
    <div ref={containerRef} className={`relative select-none ${className}`}>
      {/* Input container */}
      <div
        onClick={() => {
          if (!disabled) {
            setIsOpen((prev) => !prev);
          }
        }}
        className={`flex items-center rounded-xl border transition overflow-hidden cursor-pointer ${
          isOpen
            ? "border-sky-500 ring-2 ring-sky-500/20 bg-white dark:bg-slate-950"
            : "border-slate-300 dark:border-slate-800 bg-white/90 dark:bg-slate-950/90 hover:border-slate-400 dark:hover:border-slate-700"
        } ${disabled ? "opacity-50 pointer-events-none" : ""}`}
      >
        {/* Calendar Icon Button */}
        <button
          type="button"
          tabIndex={-1}
          aria-label="Toggle calendar"
          className="flex items-center justify-center px-3 py-2.5 bg-slate-100 dark:bg-slate-900/70 border-r border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-sky-500 dark:hover:text-sky-400 transition"
        >
          <CalendarIcon className="w-4 h-4" />
        </button>

        {/* Text input */}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          disabled={disabled}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleInputBlur();
              setIsOpen(false);
            } else if (e.key === "Escape") {
              setIsOpen(false);
            }
          }}
          placeholder={effectivePlaceholder}
          className="w-full bg-transparent px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none font-mono tracking-wide"
        />

        {/* Clear Button if value present */}
        {allowClear && Boolean(value) && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            title={effectiveClearLabel}
            className="flex items-center justify-center p-1.5 mr-2 rounded-lg text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Popover Calendar Dropdown */}
      {isOpen && (
        <div
          className={`absolute left-0 z-50 ${
            openUpward ? "bottom-full mb-2" : "top-full mt-2"
          } ${
            showWeekNumbers ? "w-72" : "w-64"
          } rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-3 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100`}
        >
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-xs font-semibold text-slate-900 dark:text-white tracking-tight">
              {monthNames[viewMonth]} {viewYear}
            </span>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                aria-label="Previous month"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                aria-label="Next month"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Weekday Names Header */}
          <div
            className={`grid ${
              showWeekNumbers ? "grid-cols-[26px_repeat(7,1fr)]" : "grid-cols-7"
            } gap-1 mb-1 text-center items-center`}
          >
            {showWeekNumbers && (
              <span className="text-[9px] font-mono font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider py-1 border-r border-slate-200 dark:border-slate-800/80">
                {weekColHeader}
              </span>
            )}
            {weekdayNames.map((wd) => (
              <span
                key={wd}
                className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider py-1"
              >
                {wd}
              </span>
            ))}
          </div>

          {/* Days Grid per Week */}
          <div className="space-y-1">
            {weeks.map((w, wIdx) => (
              <div
                key={wIdx}
                className={`grid ${
                  showWeekNumbers ? "grid-cols-[26px_repeat(7,1fr)]" : "grid-cols-7"
                } gap-1 text-center items-center`}
              >
                {showWeekNumbers && (
                  <span className="text-[10px] font-mono font-semibold text-slate-400 dark:text-slate-500 select-none border-r border-slate-200 dark:border-slate-800/80 pr-1 flex items-center justify-center">
                    {w.weekNum}
                  </span>
                )}

                {w.days.map((d) => {
                  if (d.isDisabled) {
                    return (
                      <div
                        key={d.iso}
                        className="w-7 h-7 flex items-center justify-center text-[11px] text-slate-300 dark:text-slate-700 rounded-lg cursor-not-allowed mx-auto"
                      >
                        {d.dayNum}
                      </div>
                    );
                  }

                  return (
                    <button
                      key={d.iso}
                      type="button"
                      onClick={() => handleSelectDay(d.iso)}
                      className={`w-7 h-7 flex items-center justify-center text-[11px] font-medium rounded-lg transition relative mx-auto ${
                        d.isSelected
                          ? "bg-sky-600 text-white font-bold shadow-md shadow-sky-600/30"
                          : d.isToday
                          ? "border border-sky-500/50 text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-500/20"
                          : d.isCurrentMonth
                          ? "text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white"
                          : "text-slate-300 dark:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-slate-500 dark:hover:text-slate-400"
                      }`}
                    >
                      {d.dayNum}
                      {d.isToday && !d.isSelected && (
                        <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-sky-500 dark:bg-sky-400" />
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Footer with Today and Clear shortcuts */}
          <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-slate-100 dark:border-slate-800/80 px-1">
            <button
              type="button"
              onClick={handleSelectToday}
              className="text-[11px] font-medium text-sky-600 dark:text-sky-400 hover:text-sky-500 dark:hover:text-sky-300 transition"
            >
              {todayLabel}
            </button>

            {allowClear && (
              <button
                type="button"
                onClick={handleClear}
                className="text-[11px] font-medium text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition"
              >
                {effectiveClearLabel}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

