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

export interface CmsSettingsData {
  activeLanguages: string[];
  adminLanguage: AdminLanguage;
  gallerySettings: GallerySettings;
}

export type { AdminLanguage, SupportedLocale };

