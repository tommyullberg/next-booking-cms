import { prisma } from "../db";
import { DEFAULT_ACTIVE_LANGUAGES } from "../constants/languages";
import { CmsSettingsData } from "../types/settings";

export type { CmsSettingsData };

export async function getCmsSettingsAction(): Promise<CmsSettingsData> {
  try {
    const rows = await prisma.setting.findMany({
      where: {
        setting_key: {
          in: ["active_languages", "admin_language"],
        },
      },
    });

    const langRow = rows.find((r) => r.setting_key === "active_languages");
    const adminLangRow = rows.find((r) => r.setting_key === "admin_language");

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

    return {
      activeLanguages,
      adminLanguage,
    };
  } catch {
    return {
      activeLanguages: [...DEFAULT_ACTIVE_LANGUAGES],
      adminLanguage: "en",
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

  return getCmsSettingsAction();
}
