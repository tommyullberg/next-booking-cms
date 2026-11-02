import { AdminLanguage, SupportedLocale } from "../constants/languages";

export interface GallerySettings {
  layout: "grid" | "bento" | "carousel";
  columns: 2 | 3 | 4;
  aspectRatio: "16/9" | "4/3" | "3/2" | "1/1";
  captionPosition: "lightbox" | "both" | "hidden";
  showThumbnails: boolean;
}

export const DEFAULT_GALLERY_SETTINGS: GallerySettings = {
  layout: "grid",
  columns: 3,
  aspectRatio: "16/9",
  captionPosition: "both",
  showThumbnails: true,
};

export type DefaultTurnoverDay = "SUNDAY" | "SATURDAY";

export interface BookingSettings {
  defaultTurnoverDay: DefaultTurnoverDay;
  checkInTime: string;
  checkOutTime: string;
}

export const DEFAULT_BOOKING_SETTINGS: BookingSettings = {
  defaultTurnoverDay: "SUNDAY",
  checkInTime: "15:00",
  checkOutTime: "11:00",
};

export interface CmsSettingsData {
  activeLanguages: string[];
  adminLanguage: AdminLanguage;
  gallerySettings: GallerySettings;
  bookingSettings?: BookingSettings;
}

export type { AdminLanguage, SupportedLocale };

