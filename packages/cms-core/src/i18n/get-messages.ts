import enMessages from "./messages/en.json";
import svMessages from "./messages/sv.json";
import { AdminLocale, AdminMessages } from "./types";

export function getAdminMessages(locale?: string | null): AdminMessages {
  if (locale === "sv") {
    return svMessages as AdminMessages;
  }
  return enMessages as AdminMessages;
}

export function isValidAdminLocale(locale?: string | null): locale is AdminLocale {
  return locale === "en" || locale === "sv";
}

