import { PrismaClient, AdminRole, FieldType } from "@prisma/client";
import pg from "pg";
import bcrypt from "bcryptjs";
import { resolveSeedConfig } from "./loader";
import { HOMEPAGE_ID } from "../utils/slug";

export async function ensureIntegerPageIdSchema(pool: pg.Pool): Promise<void> {
  const colCheck = await pool.query(`
    SELECT data_type FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'pages' AND column_name = 'id';
  `);
  if (colCheck.rows[0]?.data_type && colCheck.rows[0].data_type !== "integer") {
    console.log("[seed] Migrating pages.id and foreign keys from text to integer (starting at 1001)...");
    await pool.query(`
      TRUNCATE TABLE page_field_translations, page_fields, page_translations, pages, sections CASCADE;
      ALTER TABLE page_fields DROP CONSTRAINT IF EXISTS page_fields_page_id_fkey;
      ALTER TABLE page_translations DROP CONSTRAINT IF EXISTS page_translations_page_id_fkey;
      ALTER TABLE objects DROP CONSTRAINT IF EXISTS objects_page_id_fkey;
      CREATE SEQUENCE IF NOT EXISTS pages_id_seq START WITH 1001;
      ALTER TABLE pages ALTER COLUMN id TYPE integer USING id::integer;
      ALTER TABLE pages ALTER COLUMN id SET DEFAULT nextval('pages_id_seq');
      ALTER SEQUENCE pages_id_seq OWNED BY pages.id;
      ALTER TABLE sections ALTER COLUMN start_page_id TYPE integer USING start_page_id::integer;
      ALTER TABLE page_translations ALTER COLUMN page_id TYPE integer USING page_id::integer;
      ALTER TABLE objects ALTER COLUMN page_id TYPE integer USING page_id::integer;
      ALTER TABLE page_fields ALTER COLUMN page_id TYPE integer USING page_id::integer;
      ALTER TABLE page_fields ADD CONSTRAINT page_fields_page_id_fkey FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE ON UPDATE CASCADE;
      ALTER TABLE page_translations ADD CONSTRAINT page_translations_page_id_fkey FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE ON UPDATE CASCADE;
      ALTER TABLE objects ADD CONSTRAINT objects_page_id_fkey FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE SET NULL ON UPDATE CASCADE;
    `);
  }
}

export async function seedSuperAdmin(
  prisma: PrismaClient,
  options?: { overwrite?: boolean }
) {
  const email = (process.env.SUPERADMIN_EMAIL || "superadmin@nextbooking.internal")
    .toLowerCase()
    .trim();
  const password = process.env.SUPERADMIN_PASSWORD || "Admin123!";
  const firstName = process.env.SUPERADMIN_FIRSTNAME || "Super";
  const lastName = process.env.SUPERADMIN_LASTNAME || "Admin";

  const existing = await prisma.administrator.findUnique({
    where: { email },
  });

  if (existing) {
    if (options?.overwrite) {
      const password_hash = await bcrypt.hash(password, 10);
      const updated = await prisma.administrator.update({
        where: { id: existing.id },
        data: {
          password_hash,
          role: AdminRole.SUPERADMIN,
          first_name: firstName,
          last_name: lastName,
        },
      });
      console.log(`[seed] Updated SuperAdmin: ${updated.email} (${updated.id})`);
      return updated;
    }
    console.log(`[seed] Retained existing SuperAdmin: ${existing.email} (${existing.id})`);
    return existing;
  }

  const password_hash = await bcrypt.hash(password, 10);
  const created = await prisma.administrator.create({
    data: {
      email,
      first_name: firstName,
      last_name: lastName,
      password_hash,
      role: AdminRole.SUPERADMIN,
    },
  });
  console.log(`[seed] SuperAdmin created: ${created.email} (Role: ${created.role})`);
  return created;
}

export async function seedCmsContent(
  prisma: PrismaClient,
  pool: pg.Pool,
  adminId: string,
  options?: { overwrite?: boolean }
) {
  const { config: seedConfig, source } = resolveSeedConfig();
  console.log(`[seed] Resolving CMS structure from: ${source}`);

  // 1. Ensure Root Section exists
  let section = await prisma.section.findFirst({
    where: {
      OR: [{ start_page_id: HOMEPAGE_ID }, { name: seedConfig.section.name }],
    },
    orderBy: { sort_order: "asc" },
  });

  if (!section) {
    section = await prisma.section.create({
      data: {
        name: seedConfig.section.name,
        translations: seedConfig.section.translations ?? {
          en: "Home",
          de: "Zuhause",
        },
        start_page_id: HOMEPAGE_ID,
        sort_order: 0,
        is_visible: seedConfig.section.is_visible ?? true,
      },
    });
    console.log(`[seed] Created root section: "${section.name}" (ID: ${section.id})`);
  } else {
    if (options?.overwrite) {
      section = await prisma.section.update({
        where: { id: section.id },
        data: {
          start_page_id: HOMEPAGE_ID,
          sort_order: 0,
          translations:
            (section.translations as any) ??
            seedConfig.section.translations ?? { en: "Home", de: "Zuhause" },
        },
      });
      console.log(`[seed] Updated root section: "${section.name}" (ID: ${section.id})`);
    } else {
      console.log(`[seed] Retained existing root section: "${section.name}" (ID: ${section.id})`);
    }
  }

  // 2. Ensure Homepage (ID: 1001, Slug: "/", Template: "startpage") exists
  const templateName =
    seedConfig.page.template_name === "standard"
      ? "startpage"
      : seedConfig.page.template_name || "startpage";

  const existingPage = await prisma.page.findUnique({
    where: { id: HOMEPAGE_ID },
  });

  let page;
  if (!existingPage) {
    page = await prisma.page.create({
      data: {
        id: HOMEPAGE_ID,
        page_title: seedConfig.page.page_title,
        slug: "/",
        template_name: templateName,
        section_id: section.id,
        sort_order: 0,
        status: seedConfig.page.status || "PUBLISHED",
        meta_title:
          seedConfig.page.meta_title ||
          `${seedConfig.page.page_title} | NextBooking CMS`,
        meta_description: seedConfig.page.meta_description,
        created_by: adminId,
      },
    });
    console.log(`[seed] Created homepage: "${page.page_title}" (ID: ${page.id})`);
  } else {
    if (options?.overwrite) {
      page = await prisma.page.update({
        where: { id: HOMEPAGE_ID },
        data: {
          slug: "/",
          template_name: templateName,
          section_id: section.id,
        },
      });
      console.log(`[seed] Updated homepage: "${page.page_title}" (ID: ${page.id})`);
    } else {
      page = existingPage;
      console.log(`[seed] Retained existing homepage: "${page.page_title}" (ID: ${page.id})`);
    }
  }

  // 3. Synchronize PostgreSQL sequence so next autoincrement page ID starts at 1002+
  await pool.query(
    `SELECT setval(pg_get_serial_sequence('pages', 'id'), GREATEST((SELECT COALESCE(MAX(id), 1001) FROM pages), 1001), true);`
  );

  // 4. Seed Page Fields for Homepage (ID: 1001) - only if missing
  for (const field of seedConfig.page.fields) {
    if (field.field_type === "TEXT") {
      const existingField = await prisma.pageField.findUnique({
        where: {
          page_id_nbr_field_type: {
            page_id: page.id,
            nbr: field.nbr,
            field_type: FieldType.TEXT,
          },
        },
      });
      if (!existingField) {
        await prisma.pageField.create({
          data: {
            page_id: page.id,
            nbr: field.nbr,
            field_type: FieldType.TEXT,
            type: field.type,
            content: field.content,
          },
        });
        console.log(`[seed] Seeded text field #${field.nbr}`);
      }
    } else if (field.field_type === "IMAGE") {
      let imageRecord = await prisma.fileAndImage.findFirst({
        where: { file_url: field.file_url },
      });

      if (!imageRecord) {
        imageRecord = await prisma.fileAndImage.create({
          data: {
            file_name: field.file_name,
            file_url: field.file_url,
          },
        });
      }

      const existingField = await prisma.pageField.findUnique({
        where: {
          page_id_nbr_field_type: {
            page_id: page.id,
            nbr: field.nbr,
            field_type: FieldType.IMAGE,
          },
        },
      });
      if (!existingField) {
        await prisma.pageField.create({
          data: {
            page_id: page.id,
            nbr: field.nbr,
            field_type: FieldType.IMAGE,
            image_id: imageRecord.id,
            ratio: field.ratio,
            max_width: field.max_width,
          },
        });
        console.log(`[seed] Seeded image field #${field.nbr} (${field.file_name})`);
      }
    } else if (field.field_type === "NAVIGATION") {
      let navRecord = await prisma.navigationAndLink.findFirst({
        where: { name: field.name },
      });

      if (!navRecord) {
        navRecord = await prisma.navigationAndLink.create({
          data: {
            name: field.name,
            type: field.type,
            navigation_links: {
              create: field.links.map((link) => ({
                link_text: link.link_text,
                link_url: link.link_url,
                sort_order: link.sort_order,
              })),
            },
          },
        });
      }

      const existingField = await prisma.pageField.findUnique({
        where: {
          page_id_nbr_field_type: {
            page_id: page.id,
            nbr: field.nbr,
            field_type: FieldType.NAVIGATION,
          },
        },
      });
      if (!existingField) {
        await prisma.pageField.create({
          data: {
            page_id: page.id,
            nbr: field.nbr,
            field_type: FieldType.NAVIGATION,
            navigation_id: navRecord.id,
          },
        });
        console.log(`[seed] Seeded navigation field #${field.nbr} ("${field.name}")`);
      }
    }
  }

  console.log(`[seed] CMS system structure verified.`);
  return { section, page };
}

export async function seedSystemDefaults(
  prisma: PrismaClient,
  pool: pg.Pool,
  options?: { overwrite?: boolean }
) {
  await ensureIntegerPageIdSchema(pool);
  const admin = await seedSuperAdmin(prisma, options);
  await seedCmsContent(prisma, pool, admin.id, options);
  return { admin };
}
