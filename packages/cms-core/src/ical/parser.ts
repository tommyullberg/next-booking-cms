export interface ParsedICalEvent {
  uid: string;
  summary: string;
  startDate: Date;
  endDate: Date;
  description?: string;
}

function parseICalDate(dateStr: string): Date {
  const clean = dateStr.replace(/^.*:/, "").trim();

  // Format: YYYYMMDD
  if (/^\d{8}$/.test(clean)) {
    const year = parseInt(clean.substring(0, 4), 10);
    const month = parseInt(clean.substring(4, 6), 10) - 1;
    const day = parseInt(clean.substring(6, 8), 10);
    return new Date(Date.UTC(year, month, day, 0, 0, 0));
  }

  // Format: YYYYMMDDTHHMMSSZ or YYYYMMDDTHHMMSS
  if (/^\d{8}T\d{6}Z?$/.test(clean)) {
    const year = parseInt(clean.substring(0, 4), 10);
    const month = parseInt(clean.substring(4, 6), 10) - 1;
    const day = parseInt(clean.substring(6, 8), 10);
    const hour = parseInt(clean.substring(9, 11), 10);
    const minute = parseInt(clean.substring(11, 13), 10);
    const second = parseInt(clean.substring(13, 15), 10);
    return new Date(Date.UTC(year, month, day, hour, minute, second));
  }

  return new Date(clean);
}

export function parseICalFeed(icsContent: string): ParsedICalEvent[] {
  const lines = icsContent.split(/\r\n|\n|\r/);
  const events: ParsedICalEvent[] = [];

  let inEvent = false;
  let currentEvent: Partial<ParsedICalEvent> = {};

  // Handle folded lines (RFC 5545 lines beginning with whitespace)
  const unfoldedLines: string[] = [];
  for (const line of lines) {
    if ((line.startsWith(" ") || line.startsWith("\t")) && unfoldedLines.length > 0) {
      unfoldedLines[unfoldedLines.length - 1] += line.trimStart();
    } else {
      unfoldedLines.push(line);
    }
  }

  for (const line of unfoldedLines) {
    const trimmed = line.trim();

    if (trimmed === "BEGIN:VEVENT") {
      inEvent = true;
      currentEvent = {};
      continue;
    }

    if (trimmed === "END:VEVENT") {
      if (currentEvent.uid && currentEvent.startDate && currentEvent.endDate) {
        events.push({
          uid: currentEvent.uid,
          summary: currentEvent.summary || "Bokad via extern kanal",
          startDate: currentEvent.startDate,
          endDate: currentEvent.endDate,
          description: currentEvent.description,
        });
      }
      inEvent = false;
      continue;
    }

    if (inEvent) {
      if (trimmed.startsWith("UID:")) {
        currentEvent.uid = trimmed.substring(4).trim();
      } else if (trimmed.startsWith("SUMMARY:")) {
        currentEvent.summary = trimmed.substring(8).trim();
      } else if (trimmed.startsWith("DESCRIPTION:")) {
        currentEvent.description = trimmed.substring(12).trim();
      } else if (trimmed.startsWith("DTSTART")) {
        currentEvent.startDate = parseICalDate(trimmed);
      } else if (trimmed.startsWith("DTEND")) {
        currentEvent.endDate = parseICalDate(trimmed);
      }
    }
  }

  return events;
}
