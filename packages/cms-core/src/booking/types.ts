export interface BookingItem {
  id: string;
  objectId: string;
  startDate: string;
  endDate: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "IMPORTED";
  customerName?: string;
  price?: number | null;
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
  guestsCount: number;
  petsCount: number;
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
