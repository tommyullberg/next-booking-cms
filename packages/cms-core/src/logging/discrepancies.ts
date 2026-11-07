import { prisma } from "../db";
import crypto from "crypto";

export type DiscrepancyType =
  | "OBJECT_NOT_FOUND"
  | "OBJECT_MISSING_PRICE"
  | "PERIOD_MISSING_PRICE"
  | "INVALID_SETTINGS"
  | "TECHNICAL_DATABASE_ERROR";

export interface BookingDiscrepancy {
  id: string;
  type: DiscrepancyType;
  objectId?: string;
  objectName?: string;
  period?: {
    startDate?: string;
    endDate?: string;
  };
  message: string;
  timestamp: string;
  lastOccurredAt: string;
  occurrences: number;
}

const SETTING_KEY = "system_booking_discrepancies";
const MAX_LOG_ENTRIES = 50;

/**
 * Records an operational booking discrepancy or configuration error.
 * Logs to server console and persistently stores a deduplicated entry in the database.
 */
export async function recordBookingDiscrepancy(entry: {
  type: DiscrepancyType;
  objectId?: string;
  objectName?: string;
  period?: {
    startDate?: string;
    endDate?: string;
  };
  message: string;
}): Promise<void> {
  const now = new Date().toISOString();

  // 1. Structured console output for real-time log collectors
  console.error(
    `[Booking Discrepancy] [${entry.type}] ${entry.message}${
      entry.objectId ? ` (Object ID: ${entry.objectId})` : ""
    }${
      entry.period?.startDate && entry.period?.endDate
        ? ` (Period: ${entry.period.startDate} to ${entry.period.endDate})`
        : ""
    }`
  );

  // 2. Persistent storage in PostgreSQL settings table with deduplication
  try {
    const row = await prisma.setting.findUnique({
      where: { setting_key: SETTING_KEY },
    });

    let entries: BookingDiscrepancy[] = [];
    if (row?.setting_value) {
      try {
        const parsed = JSON.parse(row.setting_value);
        if (Array.isArray(parsed)) entries = parsed;
      } catch {
        entries = [];
      }
    }

    // Deduplicate: match existing discrepancy by type and objectId (or message if no objectId)
    const existingIndex = entries.findIndex(
      (e) =>
        e.type === entry.type &&
        (entry.objectId ? e.objectId === entry.objectId : e.message === entry.message)
    );

    if (existingIndex >= 0) {
      const existing = entries[existingIndex];
      entries[existingIndex] = {
        ...existing,
        message: entry.message,
        objectName: entry.objectName || existing.objectName,
        period: entry.period || existing.period,
        lastOccurredAt: now,
        occurrences: (existing.occurrences || 1) + 1,
      };
    } else {
      const newEntry: BookingDiscrepancy = {
        id: crypto.randomUUID(),
        type: entry.type,
        objectId: entry.objectId,
        objectName: entry.objectName,
        period: entry.period,
        message: entry.message,
        timestamp: now,
        lastOccurredAt: now,
        occurrences: 1,
      };
      entries.unshift(newEntry);
    }

    // Bound entries to prevent unbounded growth
    if (entries.length > MAX_LOG_ENTRIES) {
      entries = entries.slice(0, MAX_LOG_ENTRIES);
    }

    await prisma.setting.upsert({
      where: { setting_key: SETTING_KEY },
      create: {
        setting_key: SETTING_KEY,
        setting_value: JSON.stringify(entries),
      },
      update: {
        setting_value: JSON.stringify(entries),
      },
    });
  } catch (dbErr) {
    // If database is completely unreachable, fail gracefully without throwing a secondary error
    console.warn("[Booking Discrepancy] Could not persist discrepancy to database:", dbErr);
  }
}

/**
 * Retrieves the list of active configuration discrepancies and errors.
 */
export async function getBookingDiscrepanciesAction(): Promise<BookingDiscrepancy[]> {
  try {
    const row = await prisma.setting.findUnique({
      where: { setting_key: SETTING_KEY },
    });
    if (!row?.setting_value) return [];
    const parsed = JSON.parse(row.setting_value);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error("[Booking Discrepancy] Failed to retrieve discrepancies:", err);
    return [];
  }
}

/**
 * Clears either a single discrepancy by ID or all discrepancies.
 */
export async function clearBookingDiscrepanciesAction(id?: string): Promise<{ success: boolean }> {
  try {
    if (!id) {
      await prisma.setting.deleteMany({
        where: { setting_key: SETTING_KEY },
      });
      return { success: true };
    }

    const row = await prisma.setting.findUnique({
      where: { setting_key: SETTING_KEY },
    });
    if (!row?.setting_value) return { success: true };

    const parsed = JSON.parse(row.setting_value);
    if (!Array.isArray(parsed)) return { success: true };

    const remaining = parsed.filter((item: BookingDiscrepancy) => item.id !== id);
    await prisma.setting.update({
      where: { setting_key: SETTING_KEY },
      data: { setting_value: JSON.stringify(remaining) },
    });
    return { success: true };
  } catch (err) {
    console.error("[Booking Discrepancy] Failed to clear discrepancies:", err);
    return { success: false };
  }
}

