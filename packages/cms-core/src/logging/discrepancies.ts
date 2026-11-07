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
  acknowledged: boolean;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
}

const SETTING_KEY = "system_booking_discrepancies";
const MAX_LOG_ENTRIES = 50;

/**
 * In-process mutex chain ensuring serial execution of discrepancy logging within the same Node.js process.
 */
let inProcessLock: Promise<void> = Promise.resolve();

async function withInProcessLock<T>(fn: () => Promise<T>): Promise<T> {
  let release: () => void;
  const nextLock = new Promise<void>((resolve) => {
    release = resolve;
  });
  const currentLock = inProcessLock;
  inProcessLock = currentLock.then(() => nextLock);

  await currentLock;
  try {
    return await fn();
  } finally {
    release!();
  }
}

/**
 * Records an operational booking discrepancy or configuration error.
 * Logs to server console in English and persistently stores a deduplicated entry in the database.
 * Never throws an error so that logging failures never mask original booking logic errors.
 * Never records sensitive customer data.
 * Safe against concurrent calls even when the database setting row does not exist yet.
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

  // 1. Structured console output for real-time developer log aggregation (English)
  try {
    console.error(
      `[Booking Discrepancy] [${entry.type}] ${entry.message}${
        entry.objectId ? ` (Object ID: ${entry.objectId})` : ""
      }${
        entry.period?.startDate && entry.period?.endDate
          ? ` (Period: ${entry.period.startDate} to ${entry.period.endDate})`
          : ""
      }`
    );
  } catch {
    // Non-fatal if console is detached
  }

  // 2. Persistent transactional storage in PostgreSQL settings table
  try {
    await withInProcessLock(async () => {
      await prisma.$transaction(async (tx) => {
        // Transaction-level advisory lock on the setting key.
        // This locks on the key string itself, ensuring serialization across multiple server
        // processes or containers even when the setting row does not exist yet in the database.
        try {
          await tx.$queryRaw`
            SELECT pg_advisory_xact_lock(hashtext(${SETTING_KEY}))
          `;
        } catch {
          // Fallback for non-Postgres environments (e.g. SQLite or in-memory mocks)
        }

        // Read current row within the locked transaction
        let rowSettingValue: string | null = null;
        try {
          const rows = await tx.$queryRaw<Array<{ setting_value: string }>>`
            SELECT setting_value FROM settings WHERE setting_key = ${SETTING_KEY} FOR UPDATE
          `;
          if (rows && rows.length > 0) {
            rowSettingValue = rows[0].setting_value;
          }
        } catch {
          // Fallback if raw query fails in non-Postgres test environments
        }

        if (rowSettingValue === null) {
          const fallbackRow = await tx.setting.findUnique({
            where: { setting_key: SETTING_KEY },
          });
          rowSettingValue = fallbackRow?.setting_value || null;
        }

        let entries: BookingDiscrepancy[] = [];
        if (rowSettingValue) {
          try {
            const parsed = JSON.parse(rowSettingValue);
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
            // Re-flag as active if the error recurs after being previously acknowledged
            acknowledged: false,
            acknowledgedAt: undefined,
            acknowledgedBy: undefined,
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
            acknowledged: false,
          };
          entries.unshift(newEntry);
        }

        // Keep within bounded maximum entries
        if (entries.length > MAX_LOG_ENTRIES) {
          entries = entries.slice(0, MAX_LOG_ENTRIES);
        }

        await tx.setting.upsert({
          where: { setting_key: SETTING_KEY },
          create: {
            setting_key: SETTING_KEY,
            setting_value: JSON.stringify(entries),
          },
          update: {
            setting_value: JSON.stringify(entries),
          },
        });
      });
    });
  } catch (dbErr) {
    // Fail silently without disrupting caller or throwing secondary errors
    console.warn("[Booking Discrepancy] Could not persist discrepancy to database:", dbErr);
  }
}

/**
 * Retrieves the list of recorded discrepancies.
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
 * Marks a single discrepancy or all discrepancies as acknowledged / unacknowledged.
 * Preserves historical records so administrators can follow up on issues.
 */
export async function acknowledgeBookingDiscrepancyAction(params: {
  id?: string;
  acknowledged?: boolean;
  adminEmail?: string;
}): Promise<{ success: boolean; count: number }> {
  try {
    const { id, acknowledged = true, adminEmail } = params;
    const now = new Date().toISOString();

    let updatedCount = 0;

    await withInProcessLock(async () => {
      await prisma.$transaction(async (tx) => {
        try {
          await tx.$queryRaw`
            SELECT pg_advisory_xact_lock(hashtext(${SETTING_KEY}))
          `;
        } catch {}

        const row = await tx.setting.findUnique({
          where: { setting_key: SETTING_KEY },
        });
        if (!row?.setting_value) return;

        const parsed = JSON.parse(row.setting_value);
        if (!Array.isArray(parsed)) return;

        const updated = parsed.map((item: BookingDiscrepancy) => {
          if (!id || item.id === id) {
            updatedCount++;
            return {
              ...item,
              acknowledged,
              acknowledgedAt: acknowledged ? now : undefined,
              acknowledgedBy: acknowledged ? adminEmail || "admin" : undefined,
            };
          }
          return item;
        });

        await tx.setting.update({
          where: { setting_key: SETTING_KEY },
          data: { setting_value: JSON.stringify(updated) },
        });
      });
    });

    return { success: true, count: updatedCount };
  } catch (err) {
    console.error("[Booking Discrepancy] Failed to acknowledge discrepancy:", err);
    return { success: false, count: 0 };
  }
}

/**
 * Clears either a single discrepancy by ID or all discrepancies permanently.
 */
export async function clearBookingDiscrepanciesAction(id?: string): Promise<{ success: boolean }> {
  try {
    return await withInProcessLock(async () => {
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
    });
  } catch (err) {
    console.error("[Booking Discrepancy] Failed to clear discrepancies:", err);
    return { success: false };
  }
}
