export interface ExportBookingItem {
  id: string;
  startDate: Date;
  endDate: Date;
  status: string;
  customerName?: string | null;
}

function formatICalDate(date: Date): string {
  const d = new Date(date);
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

function formatICalTimestamp(date: Date): string {
  const d = new Date(date);
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  const hours = String(d.getUTCHours()).padStart(2, "0");
  const minutes = String(d.getUTCMinutes()).padStart(2, "0");
  const seconds = String(d.getUTCSeconds()).padStart(2, "0");
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

export function generateICalFeed(
  bookings: ExportBookingItem[],
  calendarName: string = "NextBooking Calendar"
): string {
  const nowStamp = formatICalTimestamp(new Date());

  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//NextBooking CMS//Booking Calendar Engine//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${calendarName}`,
  ];

  for (const b of bookings) {
    if (b.status === "REJECTED") continue;

    const dtStart = formatICalDate(b.startDate);
    const dtEnd = formatICalDate(b.endDate);

    lines.push(
      "BEGIN:VEVENT",
      `UID:booking-${b.id}@nextbooking.cms`,
      `DTSTAMP:${nowStamp}`,
      `DTSTART;VALUE=DATE:${dtStart}`,
      `DTEND;VALUE=DATE:${dtEnd}`,
      `SUMMARY:Bokad (${b.status === "APPROVED" ? "Bekräftad" : "Preliminär"})`,
      `STATUS:${b.status === "APPROVED" || b.status === "IMPORTED" ? "CONFIRMED" : "TENTATIVE"}`,
      "END:VEVENT"
    );
  }

  lines.push("END:VCALENDAR", "");

  return lines.join("\r\n");
}
