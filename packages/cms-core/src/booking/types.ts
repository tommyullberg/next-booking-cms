export type BookingStatusType =
  | "PENDING"
  | "APPROVED"
  | "BOOKED"
  | "CONFIRMED"
  | "COMPLETED"
  | "CANCELLED"
  | "REJECTED"
  | "IMPORTED";

export interface BookingStatusOption {
  id: BookingStatusType;
  label: {
    sv: string;
    en: string;
  };
  description: {
    sv: string;
    en: string;
  };
  color: {
    badge: string;
    bg: string;
    border: string;
    text: string;
    active: string;
  };
}

export const BOOKING_STATUSES: BookingStatusOption[] = [
  {
    id: "PENDING",
    label: {
      sv: "Förfrågan",
      en: "Inquiry",
    },
    description: {
      sv: "Preliminär eller öppen förfrågan som väntar på hantering",
      en: "Preliminary or open inquiry awaiting review",
    },
    color: {
      badge: "bg-amber-500/15 text-amber-300 border-amber-500/30",
      bg: "bg-amber-950/20",
      border: "border-amber-600/40",
      text: "text-amber-300",
      active: "bg-amber-600 text-white border-amber-500 shadow-md shadow-amber-600/30",
    },
  },
  {
    id: "APPROVED",
    label: {
      sv: "Godkänd",
      en: "Approved",
    },
    description: {
      sv: "Godkänd av hyresvärden, väntar på avtal",
      en: "Approved by host, awaiting agreement",
    },
    color: {
      badge: "bg-sky-500/15 text-sky-300 border-sky-500/30",
      bg: "bg-sky-950/20",
      border: "border-sky-600/40",
      text: "text-sky-300",
      active: "bg-sky-600 text-white border-sky-500 shadow-md shadow-sky-600/30",
    },
  },
  {
    id: "BOOKED",
    label: {
      sv: "Bokad",
      en: "Booked",
    },
    description: {
      sv: "Bekräftad bokning med överenskomna villkor",
      en: "Confirmed booking with agreed terms",
    },
    color: {
      badge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
      bg: "bg-emerald-950/20",
      border: "border-emerald-600/40",
      text: "text-emerald-300",
      active: "bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/30",
    },
  },
  {
    id: "COMPLETED",
    label: {
      sv: "Genomförd",
      en: "Completed",
    },
    description: {
      sv: "Vistelsen är genomförd och avslutad",
      en: "Stay completed and finished",
    },
    color: {
      badge: "bg-teal-500/15 text-teal-300 border-teal-500/30",
      bg: "bg-teal-950/20",
      border: "border-teal-600/40",
      text: "text-teal-300",
      active: "bg-teal-600 text-white border-teal-500 shadow-md shadow-teal-600/30",
    },
  },
  {
    id: "CANCELLED",
    label: {
      sv: "Avbokad",
      en: "Cancelled",
    },
    description: {
      sv: "Avbokad av gäst eller värd",
      en: "Cancelled by guest or host",
    },
    color: {
      badge: "bg-rose-500/15 text-rose-300 border-rose-500/30",
      bg: "bg-rose-950/20",
      border: "border-rose-600/40",
      text: "text-rose-300",
      active: "bg-rose-600 text-white border-rose-500 shadow-md shadow-rose-600/30",
    },
  },
  {
    id: "REJECTED",
    label: {
      sv: "Avvisad",
      en: "Rejected",
    },
    description: {
      sv: "Förfrågan avböjd",
      en: "Inquiry rejected",
    },
    color: {
      badge: "bg-slate-700 text-slate-300 border-slate-600",
      bg: "bg-slate-900",
      border: "border-slate-700",
      text: "text-slate-300",
      active: "bg-slate-700 text-white border-slate-500",
    },
  },
  {
    id: "IMPORTED",
    label: {
      sv: "Importerad (Booking.com)",
      en: "Imported (Booking.com)",
    },
    description: {
      sv: "Synkad från extern Booking.com/iCal-kalender",
      en: "Synced from external Booking.com/iCal feed",
    },
    color: {
      badge: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",
      bg: "bg-indigo-950/20",
      border: "border-indigo-600/40",
      text: "text-indigo-300",
      active: "bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30",
    },
  },
];

export interface BookingItem {
  id: string;
  objectId: string;
  objectName?: string;
  startDate: string;
  endDate: string;
  status: BookingStatusType;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string | null;
  customerMobile?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  postalCode?: string | null;
  city?: string | null;
  country?: string | null;
  guestsCount?: number;
  adultsCount?: number;
  childrenCount?: number;
  petsCount?: number;
  price?: number | null;
  depositAmount?: number | null;
  depositDueDate?: string | null;
  depositPaidAt?: string | null;
  finalPaymentAmount?: number | null;
  finalPaymentDueDate?: string | null;
  finalPaymentPaidAt?: string | null;
  contractNumber?: string | null;
  contractSentAt?: string | null;
  contractReceivedAt?: string | null;
  customerNotes?: string | null;
  adminNotes?: string | null;
  isPreliminary?: boolean;
  icalSourceId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface BookingObjectDetails {
  id: string;
  name: string;
  type?: string | null;
  description?: string | null;
  page_id?: number | null;
  landlord_id?: string | null;
  sort_order?: number;
  is_visible?: boolean;
  size_sqm?: number | null;
  room_count?: number | null;
  room_type?: string | null;
  bed_count: number;
  extra_bed_count: number;
  pets_allowed: boolean;
  price_matrix?: Record<string, any> | null;
  ical_url?: string | null;
  ical_last_synced?: string | Date | null;
  landlord?: {
    id: string;
    first_name: string;
    last_name: string;
    mobile?: string | null;
  } | null;
  page?: {
    id: number;
    page_title: string;
    slug: string;
  } | null;
  galleries?: Array<{
    id: string;
    image: { file_url: string; file_name: string };
  }>;
  amenities?: Array<{
    id: string;
    name: string;
    sort_order?: number;
  }>;
}

export interface AmenityItem {
  id: string;
  name: string;
  sort_order: number;
  object_count?: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface SearchMatchItem {
  object: BookingObjectDetails;
  startDate: string;
  endDate: string;
  nights: number;
  totalPrice: number;
  offsetDays?: number;
}

export interface AvailabilitySearchResult {
  exactMatches: SearchMatchItem[];
  alternatives: SearchMatchItem[];
}

export interface CreateBookingRequest {
  objectId: string;
  startDate: string;
  endDate: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  customerMobile?: string;
  addressLine1?: string;
  addressLine2?: string;
  postalCode?: string;
  city?: string;
  country?: string;
  guestsCount?: number;
  adultsCount?: number;
  childrenCount?: number;
  petsCount?: number;
  customerNotes?: string;
  isPreliminary?: boolean;
}

export interface BookingObjectTypeOption {
  id: string;
  label: string;
  en: string;
  sv: string;
}

export const BOOKING_OBJECT_TYPES: BookingObjectTypeOption[] = [
  { id: "1", label: "Cabin / Stuga", en: "Cabin", sv: "Stuga" },
  { id: "2", label: "Apartment / Lägenhet", en: "Apartment", sv: "Lägenhet" },
  { id: "3", label: "Villa / Villa", en: "Villa", sv: "Villa" },
  { id: "4", label: "Mobile home / Villavagn", en: "Mobile home", sv: "Villavagn" },
];

export function formatBookingObjectType(val?: string | null): string {
  if (!val) return BOOKING_OBJECT_TYPES[0].label;
  const match = BOOKING_OBJECT_TYPES.find(
    (t) =>
      t.id === String(val) ||
      t.label.toLowerCase() === val.toLowerCase() ||
      t.en.toLowerCase() === val.toLowerCase() ||
      t.sv.toLowerCase() === val.toLowerCase()
  );
  return match ? match.label : val;
}

export interface BookingRoomTypeOption {
  id: string;
  label: string;
  en: string;
  sv: string;
  shortCode: string;
}

export const BOOKING_ROOM_TYPES: BookingRoomTypeOption[] = [
  {
    id: "rok",
    label: "Room(s) and kitchen / ROK",
    en: "Room(s) and kitchen",
    sv: "Rum och kök",
    shortCode: "ROK",
  },
  {
    id: "rop",
    label: "Room(s) and pentry / ROP",
    en: "Room(s) and pentry",
    sv: "Rum och pentry",
    shortCode: "ROP",
  },
  {
    id: "wc_shower",
    label: "Room(s) and WC/Shower",
    en: "Room(s) and WC/Shower",
    sv: "Rum och WC/dusch",
    shortCode: "WC/Shower",
  },
  {
    id: "rooms",
    label: "Room(s)",
    en: "Room(s)",
    sv: "Rum",
    shortCode: "Rum",
  },
];

export function formatBookingRoomType(val?: string | null): string {
  if (!val) return BOOKING_ROOM_TYPES[0].label;
  const lower = val.toLowerCase().trim();
  const match = BOOKING_ROOM_TYPES.find(
    (t) =>
      t.id === lower ||
      t.label.toLowerCase() === lower ||
      t.en.toLowerCase() === lower ||
      t.sv.toLowerCase() === lower ||
      t.shortCode.toLowerCase() === lower ||
      (t.id === "rok" && (lower === "rum och kök" || lower === "rum och kok" || lower === "rok")) ||
      (t.id === "rop" && (lower === "rum och pentry" || lower === "rop")) ||
      (t.id === "wc_shower" && (lower.includes("wc") || lower.includes("dusch") || lower.includes("shower"))) ||
      (t.id === "rooms" && (lower === "rum" || lower === "room" || lower === "rooms"))
  );
  return match ? match.label : val;
}

export function formatBookingRoomTypeShort(val?: string | null): string {
  if (!val) return "ROK";
  const lower = val.toLowerCase().trim();
  const match = BOOKING_ROOM_TYPES.find(
    (t) =>
      t.id === lower ||
      t.label.toLowerCase() === lower ||
      t.en.toLowerCase() === lower ||
      t.sv.toLowerCase() === lower ||
      t.shortCode.toLowerCase() === lower ||
      (t.id === "rok" && (lower === "rum och kök" || lower === "rum och kok" || lower === "rok")) ||
      (t.id === "rop" && (lower === "rum och pentry" || lower === "rop")) ||
      (t.id === "wc_shower" && (lower.includes("wc") || lower.includes("dusch") || lower.includes("shower"))) ||
      (t.id === "rooms" && (lower === "rum" || lower === "room" || lower === "rooms"))
  );
  return match ? match.shortCode : val;
}

export interface BookingOptionalItem {
  id: string;
  name: string;
  description?: string | null;
  image_url?: string | null;
  object_id?: string | null;
  is_active: boolean;
  price_hour?: number | null;
  price_day?: number | null;
  price_sun_thu?: number | null;
  price_thu_sun?: number | null;
  price_week?: number | null;
  sort_order?: number;
  object?: {
    id: string;
    name: string;
  } | null;
  created_at?: string;
  updated_at?: string;
}
