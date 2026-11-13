import * as React from "react";
import { useTranslations } from "next-intl";
import { Calendar } from "lucide-react";
import { Card } from "@cms/components/ui";
import { CalendarLegend } from "./calendar-legend";
import { CalendarRangeActionBar } from "./calendar-range-action-bar";
import { MonthCalendar } from "./month-calendar";
import type { CalendarMonthData, EffectiveRange } from "./types";

export interface YearCalendarProps {
  objectName?: string | null;
  selectedYear: number;
  showYearCalendar: boolean;
  onToggleShowCalendar: () => void;
  effectiveRange: EffectiveRange | null;
  rangeStart: string | null;
  rangeEnd: string | null;
  calendarMonths: CalendarMonthData[];
  isSv: boolean;
  weekdayInitials: readonly string[];
  onCreatePricePeriodForRange: (startStr: string, endStr: string) => void;
  onCreateBlockedPeriodForRange: (startStr: string, endStr: string) => void;
  onClearSelection: () => void;
  onDayClick: (dateStr: string) => void;
  onHoverDate: (dateStr: string) => void;
  onSelectWeek: (weekNumber: number) => void;
  formatWeekSpan: (
    startWeek?: number | null,
    startYear?: number | null,
    endWeek?: number | null,
    endYear?: number | null
  ) => string;
}

export function YearCalendar({
  objectName,
  selectedYear,
  showYearCalendar,
  onToggleShowCalendar,
  effectiveRange,
  rangeStart,
  rangeEnd,
  calendarMonths,
  isSv,
  weekdayInitials,
  onCreatePricePeriodForRange,
  onCreateBlockedPeriodForRange,
  onClearSelection,
  onDayClick,
  onHoverDate,
  onSelectWeek,
  formatWeekSpan,
}: YearCalendarProps) {
  const t = useTranslations("pricesAvailability");

  return (
    <Card variant="admin" className='overflow-hidden shadow-xl'>
      <div className='p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3'>
        <div className='flex items-center gap-2'>
          <Calendar className='w-4 h-4 text-amber-400' />
          <h2 className='text-sm font-semibold text-white'>
            {t("yearCalendarTitle", { name: objectName || "Object", year: selectedYear })}
          </h2>
        </div>

        <CalendarLegend
          showYearCalendar={showYearCalendar}
          onToggleShow={onToggleShowCalendar}
        />
      </div>

      {effectiveRange && (
        <CalendarRangeActionBar
          effectiveRange={effectiveRange}
          onCreatePricePeriod={onCreatePricePeriodForRange}
          onCreateBlockedPeriod={onCreateBlockedPeriodForRange}
          onClearSelection={onClearSelection}
          formatWeekSpan={formatWeekSpan}
        />
      )}

      {showYearCalendar && (
        <div className='p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
          {calendarMonths.map((m) => (
            <MonthCalendar
              key={m.monthIndex}
              month={m}
              selectedYear={selectedYear}
              isSv={isSv}
              weekdayInitials={weekdayInitials}
              effectiveRange={effectiveRange}
              rangeStart={rangeStart}
              rangeEnd={rangeEnd}
              onDayClick={onDayClick}
              onHoverDate={onHoverDate}
              onSelectWeek={onSelectWeek}
            />
          ))}
        </div>
      )}
    </Card>
  );
}
