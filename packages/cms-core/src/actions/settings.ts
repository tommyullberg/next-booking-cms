import { getServerSession } from "next-auth";
import { authOptions } from "@cms/auth/auth-options";
import { prisma } from "@cms/db";
import {
  DEFAULT_ACTIVE_LANGUAGES,
  DEFAULT_SITE_LANGUAGE,
  DEFAULT_LANGUAGE_URL_PREFIX,
  SupportedLocale,
} from "@cms/constants/languages";
import {
  CmsSettingsData,
  DEFAULT_GALLERY_SETTINGS,
  GallerySettings,
  BookingSettings,
  DEFAULT_BOOKING_SETTINGS,
  DefaultLanguageUrlPrefix,
} from "@cms/types/settings";

export type { CmsSettingsData, GallerySettings, BookingSettings };

export async function getCmsSettingsAction(): Promise<CmsSettingsData> {
  try {
    const rows = await prisma.setting.findMany({
      where: {
        setting_key: {
          in: [
            "active_languages",
            "default_language",
            "default_language_url_prefix",
            "admin_language",
            "gallery_settings",
            "booking_settings",
          ],
        },
      },
    });

    const langRow = rows.find((r) => r.setting_key === "active_languages");
    const defaultLangRow = rows.find((r) => r.setting_key === "default_language");
    const prefixRow = rows.find((r) => r.setting_key === "default_language_url_prefix");
    const adminLangRow = rows.find((r) => r.setting_key === "admin_language");
    const galleryRow = rows.find((r) => r.setting_key === "gallery_settings");
    const bookingRow = rows.find((r) => r.setting_key === "booking_settings");

    const defaultLanguage: SupportedLocale =
      (defaultLangRow?.setting_value?.trim().toLowerCase() as SupportedLocale) ||
      DEFAULT_SITE_LANGUAGE;

    const defaultLanguageUrlPrefix: DefaultLanguageUrlPrefix =
      prefixRow?.setting_value === "without-prefix"
        ? "without-prefix"
        : prefixRow?.setting_value === "with-prefix"
        ? "with-prefix"
        : DEFAULT_LANGUAGE_URL_PREFIX;

    let activeLanguages: string[] = [...DEFAULT_ACTIVE_LANGUAGES];
    if (langRow?.setting_value) {
      try {
        const parsed = JSON.parse(langRow.setting_value);
        if (Array.isArray(parsed) && parsed.length > 0) {
          activeLanguages = Array.from(
            new Set(parsed.map((s) => String(s).toLowerCase().trim()).filter(Boolean))
          );
        }
      } catch {
        // Fallback to default
      }
    }

    if (!activeLanguages.includes(defaultLanguage)) {
      activeLanguages = [defaultLanguage, ...activeLanguages];
    }
    if (activeLanguages.length === 0) {
      activeLanguages = [defaultLanguage];
    }

    const adminLanguage: "en" | "sv" =
      adminLangRow?.setting_value === "sv" ? "sv" : "en";

    let gallerySettings: GallerySettings = { ...DEFAULT_GALLERY_SETTINGS };
    if (galleryRow?.setting_value) {
      try {
        const parsed = JSON.parse(galleryRow.setting_value);
        if (parsed && typeof parsed === "object") {
          gallerySettings = {
            layout:
              parsed.layout === "bento" || parsed.layout === "carousel"
                ? parsed.layout
                : "grid",
            columns:
              parsed.columns === 2 || parsed.columns === 4
                ? parsed.columns
                : 3,
            aspectRatio:
              parsed.aspectRatio === "4/3" ||
              parsed.aspectRatio === "3/2" ||
              parsed.aspectRatio === "1/1"
                ? parsed.aspectRatio
                : "16/9",
            captionPosition:
              parsed.captionPosition === "lightbox" ||
              parsed.captionPosition === "hidden"
                ? parsed.captionPosition
                : "both",
            showThumbnails:
              typeof parsed.showThumbnails === "boolean"
                ? parsed.showThumbnails
                : true,
          };
        }
      } catch {
        // Fallback to default
      }
    }

    let bookingSettings: BookingSettings = { ...DEFAULT_BOOKING_SETTINGS };
    if (bookingRow?.setting_value) {
      try {
        const parsed = JSON.parse(bookingRow.setting_value);
        if (parsed && typeof parsed === "object") {
          const allowedPeriods =
            parsed.allowedBookingPeriods === "PERIODS_AND_WEEKS" ||
            parsed.allowedBookingPeriods === "FULL_WEEKS_ONLY"
              ? parsed.allowedBookingPeriods
              : parsed.allowCustomDays === false
              ? "PERIODS_AND_WEEKS"
              : "ALL";

          bookingSettings = {
            defaultTurnoverDay:
              parsed.defaultTurnoverDay === "SATURDAY" ? "SATURDAY" : "SUNDAY",
            checkInTime:
              typeof parsed.checkInTime === "string" && parsed.checkInTime.trim()
                ? parsed.checkInTime.trim()
                : "15:00",
            checkOutTime:
              typeof parsed.checkOutTime === "string" && parsed.checkOutTime.trim()
                ? parsed.checkOutTime.trim()
                : "11:00",
            allowedBookingPeriods: allowedPeriods,
            allowCustomDays: allowedPeriods === "ALL",
            turnoverDayScope:
              parsed.turnoverDayScope === "PER_OBJECT" ? "PER_OBJECT" : "GLOBAL",
            checkTimesScope:
              parsed.checkTimesScope === "PER_OBJECT" ? "PER_OBJECT" : "GLOBAL",
            customDaysScope:
              parsed.customDaysScope === "PER_OBJECT" ? "PER_OBJECT" : "GLOBAL",
            bookingSearchPageSlug:
              typeof parsed.bookingSearchPageSlug === "string"
                ? parsed.bookingSearchPageSlug.trim()
                : "",
          };
        }
      } catch {
        // Fallback to default
      }
    }

    return {
      activeLanguages,
      defaultLanguage,
      defaultLanguageUrlPrefix,
      adminLanguage,
      gallerySettings,
      bookingSettings,
    };
  } catch {
    return {
      activeLanguages: [...DEFAULT_ACTIVE_LANGUAGES],
      defaultLanguage: DEFAULT_SITE_LANGUAGE,
      defaultLanguageUrlPrefix: DEFAULT_LANGUAGE_URL_PREFIX,
      adminLanguage: "en",
      gallerySettings: { ...DEFAULT_GALLERY_SETTINGS },
      bookingSettings: { ...DEFAULT_BOOKING_SETTINGS },
    };
  }
}

export async function saveCmsSettingsAction(
  data: Partial<CmsSettingsData>
): Promise<CmsSettingsData> {
  let effectiveDefaultLang = data.defaultLanguage;
  if (!effectiveDefaultLang) {
    const existingDefault = await prisma.setting.findUnique({
      where: { setting_key: "default_language" },
    });
    effectiveDefaultLang =
      (existingDefault?.setting_value?.trim().toLowerCase() as SupportedLocale) ||
      DEFAULT_SITE_LANGUAGE;
  }

  if (data.defaultLanguage) {
    const langVal = data.defaultLanguage.toLowerCase().trim();
    await prisma.setting.upsert({
      where: { setting_key: "default_language" },
      update: { setting_value: langVal },
      create: {
        setting_key: "default_language",
        setting_value: langVal,
      },
    });
  }

  if (data.defaultLanguageUrlPrefix) {
    const prefixVal =
      data.defaultLanguageUrlPrefix === "with-prefix" ? "with-prefix" : "without-prefix";
    await prisma.setting.upsert({
      where: { setting_key: "default_language_url_prefix" },
      update: { setting_value: prefixVal },
      create: {
        setting_key: "default_language_url_prefix",
        setting_value: prefixVal,
      },
    });
  }

  if (data.activeLanguages) {
    const rawList = data.activeLanguages.map((l) => l.toLowerCase().trim()).filter(Boolean);
    const set = new Set(rawList);
    if (effectiveDefaultLang) {
      set.add(effectiveDefaultLang);
    }
    const normalized = Array.from(set);
    const finalList = normalized.length > 0 ? normalized : [DEFAULT_SITE_LANGUAGE];

    await prisma.setting.upsert({
      where: { setting_key: "active_languages" },
      update: { setting_value: JSON.stringify(finalList) },
      create: {
        setting_key: "active_languages",
        setting_value: JSON.stringify(finalList),
      },
    });
  }

  if (data.adminLanguage) {
    const adminLangValue = data.adminLanguage === "sv" ? "sv" : "en";
    await prisma.setting.upsert({
      where: { setting_key: "admin_language" },
      update: { setting_value: adminLangValue },
      create: {
        setting_key: "admin_language",
        setting_value: adminLangValue,
      },
    });

    try {
      const session = await getServerSession(authOptions);
      if (session?.user) {
        const userEmail = session.user.email ? session.user.email.toLowerCase().trim() : undefined;
        const userId = session.user.id;
        const existing = await prisma.administrator.findFirst({
          where: {
            OR: [
              ...(userId ? [{ id: userId }] : []),
              ...(userEmail ? [{ email: userEmail }] : []),
            ],
          },
        });
        if (existing) {
          await prisma.administrator.update({
            where: { id: existing.id },
            data: { locale: adminLangValue },
          });
        }
      }
    } catch {
      // Ignore session errors
    }

    try {
      const { cookies } = await import("next/headers");
      const cookieStore = await cookies();
      cookieStore.set("cms_admin_locale", adminLangValue, {
        path: "/",
        maxAge: 30 * 24 * 60 * 60,
        sameSite: "lax",
      });
    } catch {
      // Ignore outside request context
    }
  }

  if (data.gallerySettings) {
    await prisma.setting.upsert({
      where: { setting_key: "gallery_settings" },
      update: { setting_value: JSON.stringify(data.gallerySettings) },
      create: {
        setting_key: "gallery_settings",
        setting_value: JSON.stringify(data.gallerySettings),
      },
    });
  }

  if (data.bookingSettings) {
    await prisma.setting.upsert({
      where: { setting_key: "booking_settings" },
      update: { setting_value: JSON.stringify(data.bookingSettings) },
      create: {
        setting_key: "booking_settings",
        setting_value: JSON.stringify(data.bookingSettings),
      },
    });
  }

  return getCmsSettingsAction();
}
