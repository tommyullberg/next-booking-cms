import { prisma } from "../db";
import { DEFAULT_ACTIVE_LANGUAGES } from "../constants/languages";
import {
  CmsSettingsData,
  DEFAULT_GALLERY_SETTINGS,
  GallerySettings,
} from "../types/settings";

export type { CmsSettingsData, GallerySettings };

export async function getCmsSettingsAction(): Promise<CmsSettingsData> {
  try {
    const rows = await prisma.setting.findMany({
      where: {
        setting_key: {
          in: ["active_languages", "admin_language", "gallery_settings"],
        },
      },
    });

    const langRow = rows.find((r) => r.setting_key === "active_languages");
    const adminLangRow = rows.find((r) => r.setting_key === "admin_language");
    const galleryRow = rows.find((r) => r.setting_key === "gallery_settings");

    let activeLanguages: string[] = [...DEFAULT_ACTIVE_LANGUAGES];
    if (langRow?.setting_value) {
      try {
        const parsed = JSON.parse(langRow.setting_value);
        if (Array.isArray(parsed) && parsed.length > 0) {
          activeLanguages = Array.from(
            new Set(["sv", ...parsed.map((s) => String(s).toLowerCase())])
          );
        }
      } catch {
        // Fallback to default
      }
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

    return {
      activeLanguages,
      adminLanguage,
      gallerySettings,
    };
  } catch {
    return {
      activeLanguages: [...DEFAULT_ACTIVE_LANGUAGES],
      adminLanguage: "en",
      gallerySettings: { ...DEFAULT_GALLERY_SETTINGS },
    };
  }
}

export async function saveCmsSettingsAction(
  data: Partial<CmsSettingsData>
): Promise<CmsSettingsData> {
  if (data.activeLanguages) {
    const normalized = Array.from(
      new Set(["sv", ...data.activeLanguages.map((l) => l.toLowerCase())])
    );
    await prisma.setting.upsert({
      where: { setting_key: "active_languages" },
      update: { setting_value: JSON.stringify(normalized) },
      create: {
        setting_key: "active_languages",
        setting_value: JSON.stringify(normalized),
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

  return getCmsSettingsAction();
}
