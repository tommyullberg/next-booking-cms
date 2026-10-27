/**
 * ISO 8601 week calculation utilities.
 */

export interface ISOWeekInfo {
  year: number;
  week: number;
}

/**
 * Returns the number of ISO 8601 weeks in a given year (52 or 53).
 * A year has 53 ISO weeks if 1 January or 31 December is a Thursday.
 */
export function getWeeksInYear(year: number): number {
  const p = (y: number) =>
    (y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400)) % 7;
  return p(year) === 4 || p(year - 1) === 3 ? 53 : 52;
}

/**
 * Returns the ISO 8601 week number and year for any given date.
 */
export function getISOWeek(date: Date | string): ISOWeekInfo {
  const d = typeof date === "string" ? new Date(date + "T00:00:00") : new Date(date);
  const day = (d.getDay() + 6) % 7; // Monday = 0
  d.setDate(d.getDate() - day + 3); // nearest Thursday
  const firstThursday = new Date(d.getFullYear(), 0, 4);
  const firstDay = (firstThursday.getDay() + 6) % 7;
  firstThursday.setDate(firstThursday.getDate() - firstDay + 3);
  const week = 1 + Math.round(((d.getTime() - firstThursday.getTime()) / 86400000) / 7);
  return { year: d.getFullYear(), week };
}

/**
 * Returns only the ISO 8601 week number (1–53) for any given date.
 */
export function getISOWeekNumber(date: Date | string): number {
  return getISOWeek(date).week;
}

/**
 * Formats a booking week span (e.g. "26" if within same week, or "26–27" across weeks).
 */
export function formatBookingWeekSpan(startDate: string, endDate: string): string {
  const startWeek = getISOWeekNumber(startDate);
  const endWeek = getISOWeekNumber(endDate);
  if (startWeek === endWeek) {
    return `${startWeek}`;
  }
  return `${startWeek}–${endWeek}`;
}
