import fs from "fs";
import path from "path";
import { prisma } from "../db";
import { parseICalFeed, validateICalFeed, ParsedICalEvent } from "./parser";
import { BookingStatus } from "@prisma/client";
import {
  SyncBookingItem,
  SyncObjectResult,
  SyncSummaryResult,
} from "./types";

export * from "./types";

function readLocalIcs(relativeOrPath: string): string {
  const cleanPath = relativeOrPath.replace(/^\//, "");

  // 1. If an explicit APP_NAME is defined, prioritize that app's public directory
  if (process.env.APP_NAME) {
    const appCandidates = [
      path.resolve(process.cwd(), "apps", process.env.APP_NAME, "public", cleanPath),
      path.resolve(process.cwd(), "..", "..", "apps", process.env.APP_NAME, "public", cleanPath),
    ];
    for (const cand of appCandidates) {
      if (fs.existsSync(cand)) {
        return fs.readFileSync(cand, "utf-8");
      }
    }
  }

  // 2. Direct paths relative to process.cwd() or root
  const directCandidates = [
    path.resolve(process.cwd(), cleanPath),
    path.resolve(process.cwd(), "public", cleanPath),
    path.resolve(process.cwd(), "mock-ical", path.basename(cleanPath)),
    path.resolve(process.cwd(), "..", "..", "mock-ical", path.basename(cleanPath)),
  ];
  for (const cand of directCandidates) {
    if (fs.existsSync(cand)) {
      return fs.readFileSync(cand, "utf-8");
    }
  }

  // 3. Scan apps directory dynamically if running without APP_NAME
  const appMatches: string[] = [];
  const appsDirCandidates = [
    path.resolve(process.cwd(), "apps"),
    path.resolve(process.cwd(), "..", "..", "apps"),
  ];
  for (const appsDir of appsDirCandidates) {
    if (fs.existsSync(appsDir)) {
      try {
        const appFolders = fs.readdirSync(appsDir);
        for (const folder of appFolders) {
          const cand = path.resolve(appsDir, folder, "public", cleanPath);
          if (fs.existsSync(cand) && !appMatches.includes(cand)) {
            appMatches.push(cand);
          }
        }
      } catch {
        // Ignore folder read errors
      }
    }
  }

  if (appMatches.length === 1) {
    return fs.readFileSync(appMatches[0], "utf-8");
  }
  if (appMatches.length > 1) {
    throw new Error(
      `Ambiguous local iCal file: multiple matches found for '${cleanPath}' across apps: ${appMatches.join(
        ", "
      )}. Specify APP_NAME or use an explicit path.`
    );
  }

  throw new Error(`Local iCal file not found at any candidate path: ${cleanPath}`);
}

const ONE_HOUR_MS = 60 * 60 * 1000;

export async function syncICalFromUrl(
  icalUrl: string,
  objectId: string,
  options?: { force?: boolean; timeoutMs?: number }
): Promise<SyncObjectResult> {
  const obj = await prisma.bookingObject.findUnique({
    where: { id: objectId },
    select: {
      id: true,
      name: true,
      ical_url: true,
      ical_last_synced: true,
    },
  });

  const objectName = obj?.name || objectId;
  const lastSyncedDate = obj?.ical_last_synced;
  const isCacheFresh =
    lastSyncedDate &&
    Date.now() - new Date(lastSyncedDate).getTime() < ONE_HOUR_MS;

  // 1. If cache is fresh and not forced, return cached bookings from database
  if (isCacheFresh && !options?.force) {
    const cachedRows = await prisma.booking.findMany({
      where: {
        object_id: objectId,
        status: BookingStatus.IMPORTED,
      },
      orderBy: { start_date: "asc" },
    });

    return {
      objectId,
      objectName,
      icalUrl,
      lastSynced: lastSyncedDate.toISOString(),
      importedCount: 0,
      totalEvents: cachedRows.length,
      cached: true,
      bookings: cachedRows.map(mapBookingRowToItem),
    };
  }

  // 2. Fetch fresh iCal data and parse with strict fail-safe validation
  let events: ParsedICalEvent[] = [];
  try {
    let icsText = "";
    if (icalUrl.startsWith("http://") || icalUrl.startsWith("https://")) {
      const timeout = options?.timeoutMs ?? 10000;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeout);
      let res: Response;
      try {
        res = await fetch(icalUrl, {
          headers: {
            "User-Agent": "NextBooking-CMS-iCal-Sync/1.0",
            Accept: "text/calendar, text/plain, */*",
          },
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timer);
      }

      if (!res.ok) {
        throw new Error(`HTTP ${res.status} ${res.statusText || ""}`.trim());
      }

      const contentType = res.headers.get("content-type") || "";
      if (
        contentType.includes("text/html") ||
        contentType.includes("application/xhtml+xml")
      ) {
        throw new Error(`Invalid content-type: ${contentType}. Expected text/calendar.`);
      }

      icsText = await res.text();
    } else {
      // Local mock feed or relative path
      icsText = readLocalIcs(icalUrl);
    }

    validateICalFeed(icsText);
    events = parseICalFeed(icsText);
  } catch (err: any) {
    // 3. Persistent fallback on network, validation, or parser failure:
    // Retain previously imported bookings so existing reservations and availability are NEVER deleted
    console.warn(
      `[iCal Sync] Warning: Could not fetch or parse iCal feed from ${icalUrl} for object "${objectName}": ${err?.message}. Using persistent cached data.`
    );

    const fallbackRows = await prisma.booking.findMany({
      where: {
        object_id: objectId,
        status: BookingStatus.IMPORTED,
      },
      orderBy: { start_date: "asc" },
    });

    return {
      objectId,
      objectName,
      icalUrl,
      lastSynced: lastSyncedDate ? lastSyncedDate.toISOString() : null,
      importedCount: 0,
      totalEvents: fallbackRows.length,
      cached: true,
      persistentFallback: true,
      warning: `Kunde inte hämta eller tolka kalenderdata (${err?.message || "ogiltigt format"}). Befintliga sparade datum behålls för att förhindra radering och dubbelbokning.`,
      bookings: fallbackRows.map(mapBookingRowToItem),
    };
  }

  // 4. Update / upsert parsed iCal events
  const activeEventUids = new Set<string>();
  let importedCount = 0;

  for (const ev of events) {
    if (!ev.uid) continue;
    activeEventUids.add(ev.uid);

    const existing = await prisma.booking.findFirst({
      where: {
        object_id: objectId,
        ical_source_id: ev.uid,
      },
    });

    if (existing) {
      await prisma.booking.update({
        where: { id: existing.id },
        data: {
          start_date: ev.startDate,
          end_date: ev.endDate,
          customer_name: ev.summary || "Bokad via Booking.com",
          status: BookingStatus.IMPORTED,
        },
      });
    } else {
      await prisma.booking.create({
        data: {
          object_id: objectId,
          start_date: ev.startDate,
          end_date: ev.endDate,
          customer_name: ev.summary || "Bokad via Booking.com",
          customer_email: "noreply@booking.com",
          status: BookingStatus.IMPORTED,
          ical_source_id: ev.uid,
          guests_count: 1,
          pets_count: 0,
        },
      });
      importedCount++;
    }
  }

  // 5. Clean up obsolete imported bookings that are no longer present in the external feed
  await prisma.booking.deleteMany({
    where: {
      object_id: objectId,
      status: BookingStatus.IMPORTED,
      ...(activeEventUids.size > 0
        ? {
            ical_source_id: {
              notIn: Array.from(activeEventUids),
            },
          }
        : {}),
    },
  });

  // 6. Update object's ical_last_synced timestamp
  const now = new Date();
  await prisma.bookingObject.update({
    where: { id: objectId },
    data: {
      ical_last_synced: now,
    },
  });

  // 7. Return current live bookings
  const liveRows = await prisma.booking.findMany({
    where: {
      object_id: objectId,
      status: BookingStatus.IMPORTED,
    },
    orderBy: { start_date: "asc" },
  });

  return {
    objectId,
    objectName,
    icalUrl,
    lastSynced: now.toISOString(),
    importedCount,
    totalEvents: liveRows.length,
    cached: false,
    bookings: liveRows.map(mapBookingRowToItem),
  };
}

function mapBookingRowToItem(b: any): SyncBookingItem {
  const start = new Date(b.start_date);
  const end = new Date(b.end_date);
  const diffDays = Math.max(
    1,
    Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  );

  return {
    id: b.id,
    objectId: b.object_id,
    startDate: start.toISOString().split("T")[0],
    endDate: end.toISOString().split("T")[0],
    nightsCount: diffDays,
    summary: b.customer_name || "Bokad via Booking.com",
    sourceId: b.ical_source_id || b.id,
    status: b.status,
    createdAt: b.created_at ? new Date(b.created_at).toISOString() : new Date().toISOString(),
  };
}

export async function syncAllBookingObjects(options?: {
  force?: boolean;
}): Promise<SyncSummaryResult> {
  const objects = await prisma.bookingObject.findMany({
    orderBy: { sort_order: "asc" },
  });

  const results: SyncObjectResult[] = [];
  let totalImported = 0;

  for (const obj of objects) {
    if (obj.ical_url) {
      try {
        const res = await syncICalFromUrl(obj.ical_url, obj.id, options);
        results.push(res);
        totalImported += res.bookings.length;
      } catch (err: any) {
        console.error(`Failed to sync iCal for object ${obj.id}:`, err);
        // Fallback: load existing bookings
        const existing = await prisma.booking.findMany({
          where: { object_id: obj.id, status: BookingStatus.IMPORTED },
          orderBy: { start_date: "asc" },
        });

        results.push({
          objectId: obj.id,
          objectName: obj.name,
          icalUrl: obj.ical_url,
          lastSynced: obj.ical_last_synced ? obj.ical_last_synced.toISOString() : null,
          importedCount: 0,
          totalEvents: existing.length,
          cached: true,
          persistentFallback: true,
          error: err?.message || "Sync failed",
          bookings: existing.map(mapBookingRowToItem),
        });
        totalImported += existing.length;
      }
    } else {
      // Object has no iCal URL configured
      const existing = await prisma.booking.findMany({
        where: { object_id: obj.id, status: BookingStatus.IMPORTED },
        orderBy: { start_date: "asc" },
      });

      results.push({
        objectId: obj.id,
        objectName: obj.name,
        icalUrl: null,
        lastSynced: null,
        importedCount: 0,
        totalEvents: existing.length,
        cached: true,
        bookings: existing.map(mapBookingRowToItem),
      });
      totalImported += existing.length;
    }
  }

  const activeFeeds = results.filter((r) => Boolean(r.icalUrl)).length;

  return {
    totalObjects: objects.length,
    activeFeedsCount: activeFeeds,
    totalImportedBookings: totalImported,
    lastSynced: new Date().toISOString(),
    results,
  };
}

export async function syncICalBackgroundJob(): Promise<any> {
  return syncAllBookingObjects({ force: false });
}
