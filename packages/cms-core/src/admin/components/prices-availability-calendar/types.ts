import type { PricePeriodItem } from "../../views/prices-availability-view";
import type { BlockedPeriodItem } from "../../../actions/price-periods";

export interface CalendarDayData {
  day: number;
  dateStr: string;
  isPast: boolean;
  isToday: boolean;
  isoWeek: number;
  blocked?: BlockedPeriodItem;
  period?: PricePeriodItem;
  isMissing: boolean;
}

export interface CalendarWeekData {
  weekNumber: number;
  days: Array<CalendarDayData | null>;
}

export interface CalendarMonthData {
  monthIndex: number;
  name: string;
  days: CalendarDayData[];
  weeks: CalendarWeekData[];
}

export type CalendarDayVariant =
  | "selected"
  | "blocked"
  | "priced"
  | "past"
  | "closed";

export interface EffectiveRange {
  startStr: string;
  endStr: string;
  daysCount: number;
  startIso: { week: number; year: number };
  endIso: { week: number; year: number };
  isFinalized: boolean;
}
