import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseICalFeed } from "../parser";

describe("iCal Parser & RFC 5545 Compliance", () => {
  it("1. should parse standard VEVENT with date-only values", () => {
    const ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Example//Booking Feed//EN
BEGIN:VEVENT
UID:evt-101@example.com
DTSTART;VALUE=DATE:20260701
DTEND;VALUE=DATE:20260708
SUMMARY:Reserved - Guest Stay
DESCRIPTION:Direct Booking
END:VEVENT
END:VCALENDAR`;

    const events = parseICalFeed(ics);
    assert.equal(events.length, 1);
    assert.equal(events[0].uid, "evt-101@example.com");
    assert.equal(events[0].summary, "Reserved - Guest Stay");
    assert.equal(events[0].description, "Direct Booking");
    assert.equal(events[0].startDate.toISOString(), "2026-07-01T00:00:00.000Z");
    assert.equal(events[0].endDate.toISOString(), "2026-07-08T00:00:00.000Z");
  });

  it("2. should correctly unfold multi-line folded headers per RFC 5545", () => {
    const ics = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
UID:evt-folded@example.com
DTSTART:20260810T140000Z
DTEND:20260815T100000Z
SUMMARY:This is a very long summary that has been
 folded over multiple lines per RFC 5545 specifications
DESCRIPTION:First line of description
 that continues on a second line
 and even a third line
END:VEVENT
END:VCALENDAR`;

    const events = parseICalFeed(ics);
    assert.equal(events.length, 1);
    assert.equal(events[0].uid, "evt-folded@example.com");
    assert.equal(
      events[0].summary,
      "This is a very long summary that has beenfolded over multiple lines per RFC 5545 specifications"
    );
    assert.equal(
      events[0].description,
      "First line of descriptionthat continues on a second lineand even a third line"
    );
  });

  it("3. should skip events missing required fields (UID, DTSTART, or DTEND)", () => {
    const ics = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
SUMMARY:Event missing UID and dates
END:VEVENT
BEGIN:VEVENT
UID:valid-evt@example.com
DTSTART;VALUE=DATE:20260901
DTEND;VALUE=DATE:20260905
SUMMARY:Valid Event
END:VEVENT
BEGIN:VEVENT
UID:missing-end@example.com
DTSTART;VALUE=DATE:20260910
SUMMARY:Missing end date
END:VEVENT
END:VCALENDAR`;

    const events = parseICalFeed(ics);
    assert.equal(events.length, 1);
    assert.equal(events[0].uid, "valid-evt@example.com");
  });

  it("4. should parse valid empty feed without VEVENT and reject invalid or empty input", () => {
    assert.deepEqual(
      parseICalFeed("BEGIN:VCALENDAR\nVERSION:2.0\nEND:VCALENDAR"),
      []
    );
    assert.throws(() => parseICalFeed(""), /Empty iCalendar content/);
    assert.throws(
      () => parseICalFeed("<!DOCTYPE html><html><body>Error</body></html>"),
      /received HTML\/XML\/JSON response/
    );
    assert.throws(
      () => parseICalFeed("BEGIN:VCALENDAR\nVERSION:2.0"),
      /missing or truncated END:VCALENDAR/
    );
    assert.throws(
      () =>
        parseICalFeed(
          "BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nUID:unclosed@example.com\nEND:VCALENDAR"
        ),
      /truncated feed with unclosed BEGIN:VEVENT/
    );
  });
});
