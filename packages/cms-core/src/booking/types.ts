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
  description?: string | null;
  size_sqm?: number | null;
  bed_count: number;
  extra_bed_count: number;
  pets_allowed: boolean;
  price_matrix?: Record<string, any> | null;
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
