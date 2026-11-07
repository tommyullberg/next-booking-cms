import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { syncICalFromUrl } from "../sync";
import { prisma } from "../../db";
import { BookingStatus } from "@prisma/client";

interface MockBooking {
  id: string;
  object_id: string;
  start_date: Date;
  end_date: Date;
  customer_name: string;
  customer_email: string;
  status: BookingStatus;
  ical_source_id: string;
  guests_count: number;
  pets_count: number;
  created_at: Date;
}

describe("iCal Sync Fail-Safe & Booking Retention", () => {
  let mockBookings: MockBooking[] = [];
  let mockBookingObject: any;
  let originalFetch: typeof globalThis.fetch;
  let originalFindUnique: any;
  let originalFindMany: any;
  let originalFindFirst: any;
  let originalCreate: any;
  let originalUpdate: any;
  let originalDeleteMany: any;
  let originalObjUpdate: any;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    originalFindUnique = prisma.bookingObject.findUnique;
    originalObjUpdate = prisma.bookingObject.update;
    originalFindMany = prisma.booking.findMany;
    originalFindFirst = prisma.booking.findFirst;
    originalCreate = prisma.booking.create;
    originalUpdate = prisma.booking.update;
    originalDeleteMany = prisma.booking.deleteMany;

    mockBookingObject = {
      id: "obj-test",
      name: "Sjöstugan",
      ical_url: "https://channels.example.com/obj-test.ics",
      ical_last_synced: new Date("2026-05-01T10:00:00Z"),
    };

    mockBookings = [
      {
        id: "b-existing-1",
        object_id: "obj-test",
        start_date: new Date("2026-07-01T14:00:00Z"),
        end_date: new Date("2026-07-08T10:00:00Z"),
        customer_name: "Existing Booking 1",
        customer_email: "noreply@booking.com",
        status: BookingStatus.IMPORTED,
        ical_source_id: "uid-existing-1",
        guests_count: 2,
        pets_count: 0,
        created_at: new Date("2026-05-01T10:00:00Z"),
      },
      {
        id: "b-existing-2",
        object_id: "obj-test",
        start_date: new Date("2026-07-15T14:00:00Z"),
        end_date: new Date("2026-07-22T10:00:00Z"),
        customer_name: "Existing Booking 2",
        customer_email: "noreply@booking.com",
        status: BookingStatus.IMPORTED,
        ical_source_id: "uid-existing-2",
        guests_count: 4,
        pets_count: 1,
        created_at: new Date("2026-05-01T10:00:00Z"),
      },
    ];

    (prisma.bookingObject.findUnique as any) = async ({ where }: any) => {
      if (where.id === mockBookingObject.id) {
        return { ...mockBookingObject };
      }
      return null;
    };

    (prisma.bookingObject.update as any) = async ({ where, data }: any) => {
      if (where.id === mockBookingObject.id) {
        mockBookingObject.ical_last_synced = data.ical_last_synced;
        return { ...mockBookingObject };
      }
      return null;
    };

    (prisma.booking.findMany as any) = async ({ where }: any) => {
      return mockBookings
        .filter((b) => {
          if (where.object_id && b.object_id !== where.object_id) return false;
          if (where.status && b.status !== where.status) return false;
          return true;
        })
        .map((b) => ({ ...b }));
    };

    (prisma.booking.findFirst as any) = async ({ where }: any) => {
      const match = mockBookings.find((b) => {
        if (where.object_id && b.object_id !== where.object_id) return false;
        if (where.ical_source_id && b.ical_source_id !== where.ical_source_id)
          return false;
        return true;
      });
      return match ? { ...match } : null;
    };

    (prisma.booking.create as any) = async ({ data }: any) => {
      const created: MockBooking = {
        id: `b-auto-${Date.now()}-${Math.random()}`,
        object_id: data.object_id,
        start_date: data.start_date,
        end_date: data.end_date,
        customer_name: data.customer_name,
        customer_email: data.customer_email,
        status: data.status,
        ical_source_id: data.ical_source_id,
        guests_count: data.guests_count || 1,
        pets_count: data.pets_count || 0,
        created_at: new Date(),
      };
      mockBookings.push(created);
      return { ...created };
    };

    (prisma.booking.update as any) = async ({ where, data }: any) => {
      const idx = mockBookings.findIndex((b) => b.id === where.id);
      if (idx !== -1) {
        mockBookings[idx] = {
          ...mockBookings[idx],
          ...data,
        };
        return { ...mockBookings[idx] };
      }
      return null;
    };

    (prisma.booking.deleteMany as any) = async ({ where }: any) => {
      const beforeCount = mockBookings.length;
      mockBookings = mockBookings.filter((b) => {
        if (where.object_id && b.object_id !== where.object_id) return true;
        if (where.status && b.status !== where.status) return true;
        if (where.ical_source_id?.notIn) {
          return where.ical_source_id.notIn.includes(b.ical_source_id);
        }
        return false;
      });
      return { count: beforeCount - mockBookings.length };
    };
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    prisma.bookingObject.findUnique = originalFindUnique;
    prisma.bookingObject.update = originalObjUpdate;
    prisma.booking.findMany = originalFindMany;
    prisma.booking.findFirst = originalFindFirst;
    prisma.booking.create = originalCreate;
    prisma.booking.update = originalUpdate;
    prisma.booking.deleteMany = originalDeleteMany;
  });

  it("1. should import valid calendar with bookings correctly into database", async () => {
    const validIcs = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Test Corp//EN
BEGIN:VEVENT
UID:uid-new-1
DTSTART;VALUE=DATE:20260801
DTEND;VALUE=DATE:20260807
SUMMARY:New Guest August
END:VEVENT
BEGIN:VEVENT
UID:uid-existing-1
DTSTART;VALUE=DATE:20260701
DTEND;VALUE=DATE:20260709
SUMMARY:Updated Guest July
END:VEVENT
END:VCALENDAR`;

    globalThis.fetch = async () =>
      new Response(validIcs, {
        status: 200,
        headers: { "content-type": "text/calendar; charset=utf-8" },
      });

    const res = await syncICalFromUrl(mockBookingObject.ical_url, "obj-test", {
      force: true,
    });

    assert.equal(res.cached, false);
    assert.equal(res.persistentFallback, undefined);

    // Verify database state:
    // uid-existing-1 updated (stay extended to July 9)
    // uid-existing-2 removed (not in new feed)
    // uid-new-1 inserted
    assert.equal(mockBookings.length, 2);
    const existing1 = mockBookings.find((b) => b.ical_source_id === "uid-existing-1");
    const new1 = mockBookings.find((b) => b.ical_source_id === "uid-new-1");
    const existing2 = mockBookings.find((b) => b.ical_source_id === "uid-existing-2");

    assert.ok(existing1);
    assert.equal(existing1.customer_name, "Updated Guest July");
    assert.ok(new1);
    assert.equal(new1.customer_name, "New Guest August");
    assert.equal(existing2, undefined);
  });

  it("2. should correctly process valid empty calendar and remove obsolete bookings", async () => {
    const emptyCalendarIcs = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Test Corp//EN
CALSCALE:GREGORIAN
END:VCALENDAR`;

    globalThis.fetch = async () =>
      new Response(emptyCalendarIcs, {
        status: 200,
        headers: { "content-type": "text/calendar" },
      });

    const res = await syncICalFromUrl(mockBookingObject.ical_url, "obj-test", {
      force: true,
    });

    assert.equal(res.cached, false);
    assert.equal(res.persistentFallback, undefined);
    assert.equal(res.bookings.length, 0);

    // Verify database state: all obsolete bookings legitimately removed
    assert.equal(mockBookings.length, 0);
  });

  it("3. should leave existing bookings untouched on HTTP 404 and HTTP 500 errors", async () => {
    // 3a. HTTP 404 Not Found
    globalThis.fetch = async () =>
      new Response("Not Found", {
        status: 404,
        statusText: "Not Found",
      });

    const res404 = await syncICalFromUrl(mockBookingObject.ical_url, "obj-test", {
      force: true,
    });

    assert.equal(res404.cached, true);
    assert.equal(res404.persistentFallback, true);
    assert.equal(mockBookings.length, 2);
    assert.equal(mockBookings[0].ical_source_id, "uid-existing-1");
    assert.equal(mockBookings[1].ical_source_id, "uid-existing-2");

    // 3b. HTTP 500 Internal Server Error
    globalThis.fetch = async () =>
      new Response("Server Error", {
        status: 500,
        statusText: "Internal Server Error",
      });

    const res500 = await syncICalFromUrl(mockBookingObject.ical_url, "obj-test", {
      force: true,
    });

    assert.equal(res500.cached, true);
    assert.equal(res500.persistentFallback, true);
    assert.equal(mockBookings.length, 2);
    assert.equal(mockBookings[0].ical_source_id, "uid-existing-1");
    assert.equal(mockBookings[1].ical_source_id, "uid-existing-2");
  });

  it("4. should leave existing bookings untouched when server returns HTML with HTTP 200", async () => {
    // 4a. HTML with Content-Type: text/html
    const htmlResponse = `<!DOCTYPE html>
<html>
<head><title>Access Denied / Captcha</title></head>
<body><h1>Please verify you are human</h1></body>
</html>`;

    globalThis.fetch = async () =>
      new Response(htmlResponse, {
        status: 200,
        headers: { "content-type": "text/html; charset=utf-8" },
      });

    const resHtmlHeader = await syncICalFromUrl(
      mockBookingObject.ical_url,
      "obj-test",
      { force: true }
    );

    assert.equal(resHtmlHeader.persistentFallback, true);
    assert.equal(mockBookings.length, 2);

    // 4b. HTML disguised as text/plain or without header
    globalThis.fetch = async () =>
      new Response("<html><body>An error occurred on the external gateway</body></html>", {
        status: 200,
        headers: { "content-type": "text/plain" },
      });

    const resHtmlBody = await syncICalFromUrl(
      mockBookingObject.ical_url,
      "obj-test",
      { force: true }
    );

    assert.equal(resHtmlBody.persistentFallback, true);
    assert.equal(mockBookings.length, 2);
    assert.equal(mockBookings[0].ical_source_id, "uid-existing-1");
    assert.equal(mockBookings[1].ical_source_id, "uid-existing-2");
  });

  it("5. should leave existing bookings untouched on invalid or truncated iCalendar data", async () => {
    // 5a. Truncated feed missing END:VCALENDAR
    const truncatedIcs = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Truncated//EN
BEGIN:VEVENT
UID:uid-lost
DTSTART;VALUE=DATE:20260901`;

    globalThis.fetch = async () =>
      new Response(truncatedIcs, {
        status: 200,
        headers: { "content-type": "text/calendar" },
      });

    const resTruncated = await syncICalFromUrl(
      mockBookingObject.ical_url,
      "obj-test",
      { force: true }
    );

    assert.equal(resTruncated.persistentFallback, true);
    assert.equal(mockBookings.length, 2);

    // 5b. Completely malformed text / garbage
    globalThis.fetch = async () =>
      new Response("Random text stream that is not iCalendar data at all", {
        status: 200,
        headers: { "content-type": "text/calendar" },
      });

    const resGarbage = await syncICalFromUrl(
      mockBookingObject.ical_url,
      "obj-test",
      { force: true }
    );

    assert.equal(resGarbage.persistentFallback, true);
    assert.equal(mockBookings.length, 2);
  });

  it("6. should leave existing bookings untouched on network timeout", async () => {
    globalThis.fetch = async () => {
      const abortErr = new Error("The operation was aborted due to timeout");
      abortErr.name = "AbortError";
      throw abortErr;
    };

    const resTimeout = await syncICalFromUrl(
      mockBookingObject.ical_url,
      "obj-test",
      { force: true, timeoutMs: 100 }
    );

    assert.equal(resTimeout.cached, true);
    assert.equal(resTimeout.persistentFallback, true);

    // Verify database state: completely untouched
    assert.equal(mockBookings.length, 2);
    assert.equal(mockBookings[0].ical_source_id, "uid-existing-1");
    assert.equal(mockBookings[1].ical_source_id, "uid-existing-2");
  });

  it("7. should never delete previously imported bookings on parser errors or interrupted streams", async () => {
    // Unclosed VEVENT inside calendar envelope
    const brokenEventIcs = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Broken//EN
BEGIN:VEVENT
UID:broken-event-1
SUMMARY:Incomplete Event
END:VCALENDAR`;

    globalThis.fetch = async () =>
      new Response(brokenEventIcs, {
        status: 200,
        headers: { "content-type": "text/calendar" },
      });

    const resBroken = await syncICalFromUrl(
      mockBookingObject.ical_url,
      "obj-test",
      { force: true }
    );

    assert.equal(resBroken.persistentFallback, true);

    // Verify database state: no bookings were wiped or altered
    assert.equal(mockBookings.length, 2);
    assert.equal(mockBookings[0].ical_source_id, "uid-existing-1");
    assert.equal(mockBookings[1].ical_source_id, "uid-existing-2");
  });
});

