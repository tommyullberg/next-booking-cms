import { prisma } from "../db";

export interface CmsSettingsData {
  activeLanguages: string[];
  bookingIcalUrl: string;
}

const DEFAULT_ACTIVE_LANGUAGES = ["sv", "en", "de"];

export async function getCmsSettingsAction(): Promise<CmsSettingsData> {
  try {
    const rows = await prisma.setting.findMany({
      where: {
        setting_key: {
          in: ["active_languages", "booking_ical_url"],
        },
      },
    });

    const langRow = rows.find((r) => r.setting_key === "active_languages");
    const icalRow = rows.find((r) => r.setting_key === "booking_ical_url");

    let activeLanguages = DEFAULT_ACTIVE_LANGUAGES;
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

    return {
      activeLanguages,
      bookingIcalUrl: icalRow?.setting_value || "",
    };
  } catch {
    return {
      activeLanguages: DEFAULT_ACTIVE_LANGUAGES,
      bookingIcalUrl: "",
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

  if (data.bookingIcalUrl !== undefined) {
    await prisma.setting.upsert({
      where: { setting_key: "booking_ical_url" },
      update: { setting_value: data.bookingIcalUrl.trim() },
      create: {
        setting_key: "booking_ical_url",
        setting_value: data.bookingIcalUrl.trim(),
      },
    });
  }

  return getCmsSettingsAction();
}
