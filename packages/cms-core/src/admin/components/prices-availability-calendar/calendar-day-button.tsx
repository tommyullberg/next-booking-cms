import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import type { CalendarDayVariant } from "./types";

export const calendarDayVariants = cva("calendar-day", {
  variants: {
    variant: {
      selected: "calendar-day--selected",
      blocked: "calendar-day--blocked",
      priced: "calendar-day--priced",
      past: "calendar-day--past",
      closed: "calendar-day--closed",
    },
    isToday: {
      true: "calendar-day--today",
      false: "",
    },
  },
  defaultVariants: {
    variant: "closed",
    isToday: false,
  },
});

export interface CalendarDayButtonProps
  extends VariantProps<typeof calendarDayVariants> {
  day: number;
  dateStr: string;
  variant: CalendarDayVariant;
  isToday?: boolean;
  title: string;
  ariaLabel: string;
  onClick: () => void;
  onMouseEnter?: () => void;
}

export function CalendarDayButton({
  day,
  dateStr,
  variant,
  isToday = false,
  title,
  ariaLabel,
  onClick,
  onMouseEnter,
}: CalendarDayButtonProps) {
  return (
    <button
      type='button'
      data-date={dateStr}
      title={title}
      aria-label={ariaLabel}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      className={calendarDayVariants({ variant, isToday })}>
      {day}
    </button>
  );
}
