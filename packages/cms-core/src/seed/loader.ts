import fs from "fs";
import path from "path";
import { SeedConfig, SeedTextFieldConfig, SeedImageFieldConfig } from "./types";
import { defaultSeedConfig } from "./default-seed";

export function resolveSeedConfig(): { config: SeedConfig; source: string } {
  // Clone the default configuration
  const config: SeedConfig = JSON.parse(JSON.stringify(defaultSeedConfig));
  let source = "cms-core defaults";

  // 1. Check for override file
  let overrideFilePath: string | null = null;
  const repoRoot = path.resolve(__dirname, "../../..");

  if (process.env.SEED_CONFIG_FILE) {
    const rawPath = process.env.SEED_CONFIG_FILE;
    const candidates = [
      path.isAbsolute(rawPath) ? rawPath : path.resolve(process.cwd(), rawPath),
      path.resolve(repoRoot, rawPath),
    ];
    for (const cand of candidates) {
      if (fs.existsSync(cand)) {
        overrideFilePath = cand;
        break;
      }
    }
  } else {
    // Check standard locations relative to process.cwd() and repo root
    const candidates = [
      path.resolve(process.cwd(), "seed-override.json"),
      path.resolve(repoRoot, "seed-override.json"),
    ];

    if (process.env.APP_NAME) {
      candidates.push(
        path.resolve(process.cwd(), "apps", process.env.APP_NAME, "seed-config.json"),
        path.resolve(repoRoot, "apps", process.env.APP_NAME, "seed-config.json")
      );
    }

    for (const cand of candidates) {
      if (fs.existsSync(cand)) {
        overrideFilePath = cand;
        break;
      }
    }
  }

  if (overrideFilePath) {
    try {
      const rawContent = fs.readFileSync(overrideFilePath, "utf-8");
      const fileData = JSON.parse(rawContent) as Partial<SeedConfig>;

      if (fileData.section) {
        config.section = {
          ...config.section,
          ...fileData.section,
        };
      }

      if (fileData.page) {
        config.page = {
          ...config.page,
          ...fileData.page,
          fields: fileData.page.fields || config.page.fields,
        };
      }

      source = `override file: ${path.relative(process.cwd(), overrideFilePath)}`;
    } catch (err: any) {
      console.warn(`[seed] Failed to parse override file ${overrideFilePath}:`, err.message);
    }
  }

  // 2. Check environment variable overrides
  const envOverrides: string[] = [];

  if (process.env.SEED_SECTION_NAME) {
    config.section.name = process.env.SEED_SECTION_NAME.trim();
    envOverrides.push("SEED_SECTION_NAME");
  }

  if (process.env.SEED_PAGE_TITLE) {
    config.page.page_title = process.env.SEED_PAGE_TITLE.trim();
    envOverrides.push("SEED_PAGE_TITLE");
  }

  if (process.env.SEED_PAGE_SLUG) {
    config.page.slug = process.env.SEED_PAGE_SLUG.trim();
    envOverrides.push("SEED_PAGE_SLUG");
  }

  if (process.env.SEED_PAGE_TEMPLATE) {
    config.page.template_name = process.env.SEED_PAGE_TEMPLATE.trim();
    envOverrides.push("SEED_PAGE_TEMPLATE");
  }

  if (process.env.SEED_META_TITLE) {
    config.page.meta_title = process.env.SEED_META_TITLE.trim();
    envOverrides.push("SEED_META_TITLE");
  }

  if (process.env.SEED_META_DESCRIPTION) {
    config.page.meta_description = process.env.SEED_META_DESCRIPTION.trim();
    envOverrides.push("SEED_META_DESCRIPTION");
  }

  // Optional overrides for specific field values
  if (process.env.SEED_TEXT_1) {
    const textField1 = config.page.fields.find(
      (f) => f.field_type === "TEXT" && f.nbr === 1
    ) as SeedTextFieldConfig | undefined;
    if (textField1) {
      textField1.content = process.env.SEED_TEXT_1;
      envOverrides.push("SEED_TEXT_1");
    }
  }

  if (process.env.SEED_TEXT_2) {
    const textField2 = config.page.fields.find(
      (f) => f.field_type === "TEXT" && f.nbr === 2
    ) as SeedTextFieldConfig | undefined;
    if (textField2) {
      textField2.content = process.env.SEED_TEXT_2;
      envOverrides.push("SEED_TEXT_2");
    }
  }

  if (process.env.SEED_TEXT_3) {
    const textField3 = config.page.fields.find(
      (f) => f.field_type === "TEXT" && f.nbr === 3
    ) as SeedTextFieldConfig | undefined;
    if (textField3) {
      textField3.content = process.env.SEED_TEXT_3;
      envOverrides.push("SEED_TEXT_3");
    }
  }

  if (process.env.SEED_HERO_IMAGE_URL) {
    const imgField = config.page.fields.find(
      (f) => f.field_type === "IMAGE" && f.nbr === 1
    ) as SeedImageFieldConfig | undefined;
    if (imgField) {
      imgField.file_url = process.env.SEED_HERO_IMAGE_URL;
      if (process.env.SEED_HERO_IMAGE_NAME) {
        imgField.file_name = process.env.SEED_HERO_IMAGE_NAME;
      }
      envOverrides.push("SEED_HERO_IMAGE_URL");
    }
  }

  if (envOverrides.length > 0) {
    source = `${source} + env variables (${envOverrides.join(", ")})`;
  }

  return { config, source };
}
