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
export type BookingSettingScope = "GLOBAL" | "PER_OBJECT";
export type AllowedBookingPeriods = "ALL" | "PERIODS_AND_WEEKS" | "FULL_WEEKS_ONLY";

export interface BookingSettings {
  defaultTurnoverDay: DefaultTurnoverDay;
  checkInTime: string;
  checkOutTime: string;
  allowedBookingPeriods: AllowedBookingPeriods;
  allowCustomDays: boolean;
  turnoverDayScope: BookingSettingScope;
  checkTimesScope: BookingSettingScope;
  customDaysScope: BookingSettingScope;
}

export const DEFAULT_BOOKING_SETTINGS: BookingSettings = {
  defaultTurnoverDay: "SUNDAY",
  checkInTime: "15:00",
  checkOutTime: "11:00",
  allowedBookingPeriods: "ALL",
  allowCustomDays: true,
  turnoverDayScope: "GLOBAL",
  checkTimesScope: "GLOBAL",
  customDaysScope: "GLOBAL",
};

export interface ObjectBookingSettings {
  defaultTurnoverDay?: DefaultTurnoverDay;
  checkInTime?: string;
  checkOutTime?: string;
  allowedBookingPeriods?: AllowedBookingPeriods;
  allowCustomDays?: boolean;
}

export interface CmsSettingsData {
  activeLanguages: string[];
  adminLanguage: AdminLanguage;
  gallerySettings: GallerySettings;
  bookingSettings?: BookingSettings;
}

export type { AdminLanguage, SupportedLocale };
