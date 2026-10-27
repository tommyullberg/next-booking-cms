/**
 * System-wide language and localization definitions.
 * Serves as the Single Source of Truth across the CMS.
 */

export type SupportedLocale = "sv" | "en" | "de" | "fi" | "no" | "da";

export type AdminLanguage = "en" | "sv";

export interface LanguageDefinition {
  locale: SupportedLocale;
  code: string;
  flag: string;
  name: string;
  subtitle: string;
  locked: boolean;
}

export interface AdminLanguageDefinition {
  locale: AdminLanguage;
  code: string;
  name: string;
  subtitle: string;
  isDefault: boolean;
}

export interface LanguageMetaItem {
  code: string;
  flag: string;
  label: string;
}

export const DEFAULT_ACTIVE_LANGUAGES: readonly SupportedLocale[] = [
  "sv",
  "en",
  "de",
] as const;

export const DEFAULT_ADMIN_LANGUAGE: AdminLanguage = "en";

export const AVAILABLE_LANGUAGES: readonly LanguageDefinition[] = [
  {
    locale: "sv",
    code: "SE",
    flag: "🇸🇪",
    name: "Swedish",
    subtitle: "Primary system & content language (Locked)",
    locked: true,
  },
  {
    locale: "en",
    code: "GB",
    flag: "🇬🇧",
    name: "English",
    subtitle: "International translations & English visitors",
    locked: false,
  },
  {
    locale: "de",
    code: "DE",
    flag: "🇩🇪",
    name: "German",
    subtitle: "German translations for DACH market guests",
    locked: false,
  },
  {
    locale: "fi",
    code: "FI",
    flag: "🇫🇮",
    name: "Finnish",
    subtitle: "Finnish translations for Nordic visitors",
    locked: false,
  },
  {
    locale: "no",
    code: "NO",
    flag: "🇳🇴",
    name: "Norwegian",
    subtitle: "Norwegian translations for Nordic visitors",
    locked: false,
  },
  {
    locale: "da",
    code: "DK",
    flag: "🇩🇰",
    name: "Danish",
    subtitle: "Danish translations for Nordic visitors",
    locked: false,
  },
] as const;

export const ADMIN_LANGUAGES: readonly AdminLanguageDefinition[] = [
  {
    locale: "en",
    code: "GB",
    name: "English",
    subtitle: "Default administration interface language",
    isDefault: true,
  },
  {
    locale: "sv",
    code: "SE",
    name: "Svenska",
    subtitle: "Svenskt administrationsgränssnitt",
    isDefault: false,
  },
] as const;

export const LANGUAGE_META: Record<string, LanguageMetaItem> = {
  sv: { code: "SE", flag: "🇸🇪", label: "Swedish" },
  en: { code: "GB", flag: "🇬🇧", label: "English" },
  de: { code: "DE", flag: "🇩🇪", label: "German" },
  fi: { code: "FI", flag: "🇫🇮", label: "Finnish" },
  no: { code: "NO", flag: "🇳🇴", label: "Norwegian" },
  da: { code: "DK", flag: "🇩🇰", label: "Danish" },
};

/**
 * Returns metadata (code, flag, label) for any locale with safe fallback.
 */
export function getLanguageMeta(locale: string): LanguageMetaItem {
  const normalized = (locale || "").toLowerCase().trim();
  if (LANGUAGE_META[normalized]) {
    return LANGUAGE_META[normalized];
  }
  return {
    code: normalized ? normalized.toUpperCase().slice(0, 3) : "—",
    flag: "🌐",
    label: normalized ? normalized.toUpperCase() : "Unknown",
  };
}

