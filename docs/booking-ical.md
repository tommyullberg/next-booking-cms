# Booking Engine & iCal Synchronization

The booking engine in NextBooking CMS combines an interactive guest reservation flow with robust calendar synchronization against third-party Online Travel Agencies (OTAs) such as Airbnb, Booking.com, and VRBO using the RFC 5545 iCalendar specification.

## TanStack Query Booking Calendar

The booking calendar (`BookingCalendar`) leverages `@tanstack/react-query` for asynchronous availability fetching, automatic background cache invalidation, and optimistic state updates.

### Core Features

The calendar component provides the following capabilities:

- Displays available, reserved, and blocked dates in a fluid monthly grid.
- **Half-Day Visual Indicators (Checkout / Check-in Splits)**: When a guest checks out in the morning and a new guest checks in during the afternoon, the calendar renders a diagonal half-day split style. The left half shows booked/occupied and the right half shows available/incoming, ensuring clarity on transition days.
- **Multi-Unit Color Palettes**: When viewing multiple booking units simultaneously, `OBJECT_COLOR_PALETTES` applies distinct, accessible accent colors to reservations and units.
- Enforces date boundaries to prevent overlapping or invalid bookings.
- Dynamic Pricing Calculation: Computes night counts and total prices based on unit base rates (`base_price`) and seasonal price periods (`object_price_periods`).
- Integrates guest contact information collection (name, email, phone) with client-side validation.

## Flexible Availability Search & Animated Loaders

The `AvailabilitySearch` module provides intuitive booking exploration:

- **Exact Match**: If the requested date range is free, the user is presented with immediate reservation options.
- **Alternative Suggestions**: If the exact period is occupied, the search algorithm analyzes adjacent availability windows and presents the three closest available date blocks of identical duration.
- **Graceful Loading Experience**: To prevent visual layout flashing during quick API responses, search execution is paced with `MIN_SEARCH_LOADER_DURATION_MS = 900` before displaying search results.

### Animated Search Loader (`Loader`)

Located in `packages/cms-core/src/components/ui/loader.tsx`, the `Loader` component delivers polished, hardware-accelerated SVG animations tailored for travel and hospitality workflows:

| Variant  | Name                    | Description                                                                                                            |
| -------- | ----------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `matrix` | Calendar Matrix Scanner | An interactive 3x3 / 4x4 calendar grid where cells light up in an undulating scanning pattern with glowing pulse rays. |
| `radar`  | Booking Radar           | A circular sonar/radar sweep scanning through booking frequencies with a trailing ping effect.                         |
| `cards`  | Harmonic Cards          | Staggered floating cards simulating search filters and availability cards settling into place.                         |

Each variant accepts customizable sizing (`sm`, `md`, `lg`), custom label text, and theme-adaptive coloring.

## iCal Synchronization (RFC 5545)

To prevent double bookings across diverse platforms, the CMS provides bidirectional iCal feed handling adhering to RFC 5545 specifications.

### 1. iCal Export (Feed Generation)

The system exposes dynamic, authenticated iCal feeds per rental unit at the endpoint:

```text
/api/cms/ical?objectId=<OBJECT_UUID>
```

Each confirmed reservation is exported as a `VEVENT` with:

- `UID`: Unique RFC identifier (`ical_uid`)
- `DTSTART` and `DTEND`: Booking duration (formatted in UTC)
- `SUMMARY`: Reservation status
- `STATUS`: CONFIRMED

This URL can be imported directly into external OTA calendars (Airbnb, Booking.com, VRBO, Google Calendar, Apple Calendar).

### 2. iCal Import and Parsing

The `parseICalFeed` module parses external iCal streams:

- Reads and validates `BEGIN:VEVENT`, `DTSTART`, `DTEND`, `UID`, and `SUMMARY` records.
- Identifies newly booked or updated periods from external sources.
- Creates blocking reservation records in PostgreSQL tagged with `source = 'ical_external'`.

### 3. Scheduled Background Sync

The synchronization pipeline (`syncAllExternalICalFeeds`) executes periodically via background workers or webhooks:

- Retrieves remote feeds across all active rental objects.
- Runs atomic database transactions to ensure consistency.
- Records sync diagnostics and reports connectivity exceptions.

## Email Notification Templates

The notification module in `packages/cms-core/src/mail/` handles transactional guest confirmations and host alerts.

### Dynamic Placeholders

The template engine supports automated token replacement:

- `{{guest_name}}`: Full name of the primary guest
- `{{guest_email}}`: Guest email address
- `{{guest_phone}}`: Contact phone number
- `{{object_name}}`: Name of the reserved unit or villa
- `{{start_date}}`: Check-in date (formatted YYYY-MM-DD)
- `{{end_date}}`: Check-out date (formatted YYYY-MM-DD)
- `{{total_price}}`: Total formatted price
- `{{booking_id}}`: Unique booking confirmation identifier

### Email Dispatch Adapters

Three interchangeable email adapters are provided:

- `ConsoleEmailAdapter`: Used during local development to print formatted HTML/plain text messages directly to the terminal stdout without requiring third-party credentials.
- `ResendEmailAdapter`: Production adapter dispatching responsive transactional emails via Resend API.
- `SendGridEmailAdapter`: Enterprise integration dispatching high-volume transactional emails via SendGrid API.
