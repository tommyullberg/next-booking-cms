import { prisma } from "../db";
import { parseICalFeed } from "./parser";
import { BookingStatus } from "@prisma/client";

export interface SyncResult {
  importedCount: number;
  totalEvents: number;
  objectId: string;
  sourceUrl: string;
}

export async function syncICalFromUrl(
  icalUrl: string,
  objectId: string
): Promise<SyncResult> {
  const response = await fetch(icalUrl, {
    headers: {
      "User-Agent": "NextBooking-CMS-iCal-Sync/1.0",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to download iCal feed from ${icalUrl} (status ${response.status})`
    );
  }

  const icsText = await response.text();
  const events = parseICalFeed(icsText);

  let importedCount = 0;

  for (const ev of events) {
    // Check if booking already exists by ical_source_id or overlapping import
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

  return {
    importedCount,
    totalEvents: events.length,
    objectId,
    sourceUrl: icalUrl,
  };
}

export async function syncICalBackgroundJob(): Promise<SyncResult[]> {
  // Check settings table for global or object iCal URLs
  const settings = await prisma.setting.findMany({
    where: {
      setting_key: {
        startsWith: "ical_url",
      },
    },
  });

  if (!settings.length) {
    return [];
  }

  // Get first available booking object if objectId is not explicitly specified
  const firstObject = await prisma.bookingObject.findFirst();
  if (!firstObject) {
    return [];
  }

  const results: SyncResult[] = [];
  for (const s of settings) {
    if (s.setting_value) {
      try {
        const res = await syncICalFromUrl(s.setting_value, firstObject.id);
        results.push(res);
      } catch (err) {
        console.error(`iCal sync error for ${s.setting_key}:`, err);
      }
    }
  }

  return results;
}
