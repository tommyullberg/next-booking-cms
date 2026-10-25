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
  }>;
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
