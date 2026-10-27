import { AdminLanguage, SupportedLocale } from "../constants/languages";

export interface CmsSettingsData {
  activeLanguages: string[];
  adminLanguage: AdminLanguage;
}

export type { AdminLanguage, SupportedLocale };
