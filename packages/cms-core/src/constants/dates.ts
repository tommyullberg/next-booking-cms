/**
 * Centralized date and time constants and formatting utilities.
 */

import { getISOWeekNumber as calcISOWeekNumber } from "../utils/weeks";

export const MONTH_NAMES_EN: readonly string[] = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
] as const;

export const MONTH_NAMES_SV: readonly string[] = [
  "Januari", "Februari", "Mars", "April", "Maj", "Juni",
  "Juli", "Augusti", "September", "Oktober", "November", "December",
] as const;

export const WEEKDAY_NAMES_EN: readonly string[] = [
  "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday",
] as const;

export const WEEKDAY_NAMES_SV: readonly string[] = [
  "Måndag", "Tisdag", "Onsdag", "Torsdag", "Fredag", "Lördag", "Söndag",
] as const;

export const WEEKDAY_SHORT_EN: readonly string[] = [
  "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun",
] as const;

export const WEEKDAY_SHORT_SV: readonly string[] = [
  "Mån", "Tis", "Ons", "Tor", "Fre", "Lör", "Sön",
] as const;

export function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

/**
 * Creates an ISO date string "YYYY-MM-DD" from year, 0-indexed month, and day.
 */
export function toISODateString(year: number, month: number, day: number): string {
  return `${year}-${pad2(month + 1)}-${pad2(day)}`;
}

/**
 * Parses an ISO date string "YYYY-MM-DD" into numeric year, 0-indexed month, and day.
 */
export function parseISODate(
  str?: string
): { year: number; month: number; day: number } | null {
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

/**
 * Safely formats a Date object or ISO string to "YYYY-MM-DD".
 */
export function formatDateInput(val?: string | Date | null): string {
  if (!val) return "";
  const d = typeof val === "string" ? new Date(val) : val;
  if (isNaN(d.getTime())) return "";
  return d.toISOString().split("T")[0];
}

/**
 * Re-exports ISO week number calculation.
 */
export function getISOWeekNumber(date: Date | string): number {
  return calcISOWeekNumber(date).week;
}
