import * as React from "react";
import { useTranslations } from "next-intl";
import { CalendarDayButton } from "./calendar-day-button";
import { WeekNumberButton } from "./week-number-button";
import type { CalendarWeekData, CalendarDayVariant, EffectiveRange } from "./types";

export interface CalendarWeekRowProps {
  week: CalendarWeekData;
  effectiveRange: EffectiveRange | null;
  rangeStart: string | null;
  rangeEnd: string | null;
  isSv: boolean;
  onDayClick: (dateStr: string) => void;
  onHoverDate: (dateStr: string) => void;
  onSelectWeek: (weekNumber: number) => void;
}

export function CalendarWeekRow({
  week,
  effectiveRange,
  rangeStart,
  rangeEnd,
  isSv,
  onDayClick,
  onHoverDate,
  onSelectWeek,
}: CalendarWeekRowProps) {
  const t = useTranslations("pricesAvailability");

  const weekTooltip = t("selectWeekTooltip", { week: week.weekNumber });

  return (
    <div className='calendar-week-grid'>
      {/* Week Number Button */}
      <WeekNumberButton
        weekNumber={week.weekNumber}
        title={weekTooltip}
        ariaLabel={weekTooltip}
        onClick={() => onSelectWeek(week.weekNumber)}
      />

      {/* 7 Day Cells */}
      {week.days.map((dayObj, dIdx) => {
        if (!dayObj) {
          return <div key={`empty-${dIdx}`} className='h-6 w-full' />;
        }

        const isSelected = Boolean(
          effectiveRange &&
            dayObj.dateStr >= effectiveRange.startStr &&
            dayObj.dateStr <= effectiveRange.endStr
        );

        let variant: CalendarDayVariant = "closed";
        let title = "";

        if (isSelected) {
          variant = "selected";
          title = t("calendarDaySelected", { date: dayObj.dateStr });
        } else if (dayObj.blocked) {
          variant = "blocked";
          const overrideText = dayObj.period
            ? t("overridesPricePeriod", { name: dayObj.period.name || "Price Period" })
            : "";
          title = t("calendarDayBlocked", {
            date: dayObj.dateStr,
            name: dayObj.blocked.name,
            overrideText,
          });
        } else if (dayObj.period) {
          variant = "priced";
          const pName = dayObj.period.name || "Price Period";
          const pPrice = dayObj.period.price_week
            ? `${dayObj.period.price_week} SEK/${isSv ? "v" : "wk"}`
            : dayObj.period.price_day
              ? `${dayObj.period.price_day} SEK/${isSv ? "dag" : "day"}`
              : "Priced";
          title = t("calendarDayPriced", {
            date: dayObj.dateStr,
            week: dayObj.isoWeek,
            name: pName,
            price: pPrice,
          });
        } else if (dayObj.isPast) {
          variant = "past";
          title = t("calendarDayPast", { date: dayObj.dateStr });
        } else {
          variant = "closed";
          title = t("calendarDayClosed", { date: dayObj.dateStr, week: dayObj.isoWeek });
        }

        const isToday = dayObj.isToday && !isSelected;

        return (
          <CalendarDayButton
            key={dayObj.dateStr}
            day={dayObj.day}
            dateStr={dayObj.dateStr}
            variant={variant}
            isToday={isToday}
            title={title}
            ariaLabel={title}
            onClick={() => onDayClick(dayObj.dateStr)}
            onMouseEnter={() => {
              if (rangeStart && !rangeEnd) {
                onHoverDate(dayObj.dateStr);
              }
            }}
          />
        );
      })}
    </div>
  );
}
