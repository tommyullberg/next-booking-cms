import enMessages from "./messages/en.json";
import svMessages from "./messages/sv.json";

export type AdminLocale = "en" | "sv";
export const DEFAULT_ADMIN_LOCALE: AdminLocale = "en";
export const SUPPORTED_ADMIN_LOCALES: readonly AdminLocale[] = ["en", "sv"] as const;

export type AdminMessages = typeof enMessages;

// Next-intl v4 type-safe configuration: strictly type namespaces, keys and parameters
declare module "next-intl" {
  interface AppConfig {
    Messages: AdminMessages;
    Locale: AdminLocale;
  }
}

declare module "use-intl" {
  interface AppConfig {
    Messages: AdminMessages;
    Locale: AdminLocale;
  }
}

declare global {
  // Legacy / fallback interface
  interface IntlMessages extends AdminMessages {}
}

// Compile-time assertion: Ensure English and Swedish dictionaries stay 100% consistent
type EnMessages = typeof enMessages;
type SvMessages = typeof svMessages;

type DeepKeysMismatch<A, B> = {
  [K in keyof A]: K extends keyof B
    ? A[K] extends object
      ? B[K] extends object
        ? DeepKeysMismatch<A[K], B[K]>
        : `Type mismatch at key '${Extract<K, string>}'`
      : never
    : `Missing key '${Extract<K, string>}'`;
}[keyof A];

type AssertLocalesConsistent<EN, SV> =
  [DeepKeysMismatch<EN, SV>] extends [never]
    ? [DeepKeysMismatch<SV, EN>] extends [never]
      ? true
      : { error: "Swedish (sv.json) has extra keys missing in English (en.json)"; details: DeepKeysMismatch<SV, EN> }
    : { error: "English (en.json) has keys missing in Swedish (sv.json)"; details: DeepKeysMismatch<EN, SV> };

export const _assertLocalesConsistent: AssertLocalesConsistent<EnMessages, SvMessages> = true;


