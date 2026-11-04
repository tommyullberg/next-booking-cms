import * as React from "react";
import { WeekdayHeader } from "./weekday-header";
import { CalendarWeekRow } from "./calendar-week-row";
import type { CalendarMonthData, EffectiveRange } from "./types";

export interface MonthCalendarProps {
  month: CalendarMonthData;
  selectedYear: number;
  isSv: boolean;
  weekdayInitials: readonly string[];
  effectiveRange: EffectiveRange | null;
  rangeStart: string | null;
  rangeEnd: string | null;
  onDayClick: (dateStr: string) => void;
  onHoverDate: (dateStr: string) => void;
  onSelectWeek: (weekNumber: number) => void;
}

export function MonthCalendar({
  month,
  selectedYear,
  isSv,
  weekdayInitials,
  effectiveRange,
  rangeStart,
  rangeEnd,
  onDayClick,
  onHoverDate,
  onSelectWeek,
}: MonthCalendarProps) {
  return (
    <div className='calendar-month-card'>
      <div>
        <div className='calendar-month-header'>
          <span>{month.name}</span>
          <span className='text-[10px] text-slate-500 font-mono'>{selectedYear}</span>
        </div>

        <WeekdayHeader isSv={isSv} weekdayInitials={weekdayInitials} />

        <div className='space-y-1'>
          {month.weeks.map((week, wIdx) => (
            <CalendarWeekRow
              key={wIdx}
              week={week}
              effectiveRange={effectiveRange}
              rangeStart={rangeStart}
              rangeEnd={rangeEnd}
              isSv={isSv}
              onDayClick={onDayClick}
              onHoverDate={onHoverDate}
              onSelectWeek={onSelectWeek}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
