import { PrismaClient, AdminRole, FieldType } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import path from "path";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { resolveSeedConfig } from "../src/seed";

// Load environment variables from cwd and monorepo root
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://nextbooking:nextbooking_secret@localhost:5432/nextbooking_cms?schema=public";

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const HOMEPAGE_ID = 1001;

async function seedSuperAdmin() {
  const email = (process.env.SUPERADMIN_EMAIL || "superadmin@nextbooking.internal")
    .toLowerCase()
    .trim();
  const password = process.env.SUPERADMIN_PASSWORD || "Admin123!";
  const firstName = process.env.SUPERADMIN_FIRSTNAME || "Super";
  const lastName = process.env.SUPERADMIN_LASTNAME || "Admin";

  const password_hash = await bcrypt.hash(password, 10);

  const admin = await prisma.administrator.upsert({
    where: { email },
    update: {
      password_hash,
      role: AdminRole.SUPERADMIN,
    },
    create: {
      email,
      first_name: firstName,
      last_name: lastName,
      password_hash,
      role: AdminRole.SUPERADMIN,
    },
  });

  console.log(`[seed] SuperAdmin configured: ${admin.email} (Role: ${admin.role})`);
  return admin;
}

async function seedCmsContent(adminId: string) {
  const { config: seedConfig, source } = resolveSeedConfig();
  console.log(`[seed] Resolving CMS structure from: ${source}`);

  // 1. Ensure Root Section (linked to Page 1001) exists
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
    console.log(`[seed] Using root section: "${section.name}" (ID: ${section.id})`);
  }

  // 2. Ensure Homepage (ID: 1001, Slug: "/", Template: "startpage") exists
  const templateName =
    seedConfig.page.template_name === "standard"
      ? "startpage"
      : seedConfig.page.template_name || "startpage";

  const page = await prisma.page.upsert({
    where: { id: HOMEPAGE_ID },
    update: {
      slug: "/",
      template_name: templateName,
      section_id: section.id,
    },
    create: {
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

  console.log(
    `[seed] Configured homepage: "${page.page_title}" (ID: ${page.id}, Slug: "${page.slug}", Template: "${page.template_name}")`
  );

  // 3. Synchronize PostgreSQL sequence so next autoincrement page ID starts at 1002+
  await pool.query(
    `SELECT setval(pg_get_serial_sequence('pages', 'id'), GREATEST((SELECT COALESCE(MAX(id), 1001) FROM pages), 1001), true);`
  );
  console.log(`[seed] Synchronized PostgreSQL pages_id_seq (starts at >= 1001)`);

  // 4. Seed Page Fields for Homepage (ID: 1001)
  for (const field of seedConfig.page.fields) {
    if (field.field_type === "TEXT") {
      await prisma.pageField.upsert({
        where: {
          page_id_nbr_field_type: {
            page_id: page.id,
            nbr: field.nbr,
            field_type: FieldType.TEXT,
          },
        },
        update: {},
        create: {
          page_id: page.id,
          nbr: field.nbr,
          field_type: FieldType.TEXT,
          type: field.type,
          content: field.content,
        },
      });
      console.log(
        `[seed] Seeded text field #${field.nbr} ("${field.content.slice(0, 30)}...")`
      );
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

      await prisma.pageField.upsert({
        where: {
          page_id_nbr_field_type: {
            page_id: page.id,
            nbr: field.nbr,
            field_type: FieldType.IMAGE,
          },
        },
        update: {},
        create: {
          page_id: page.id,
          nbr: field.nbr,
          field_type: FieldType.IMAGE,
          image_id: imageRecord.id,
          ratio: field.ratio,
          max_width: field.max_width,
        },
      });
      console.log(`[seed] Seeded image field #${field.nbr} (${field.file_name})`);
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

      await prisma.pageField.upsert({
        where: {
          page_id_nbr_field_type: {
            page_id: page.id,
            nbr: field.nbr,
            field_type: FieldType.NAVIGATION,
          },
        },
        update: {},
        create: {
          page_id: page.id,
          nbr: field.nbr,
          field_type: FieldType.NAVIGATION,
          navigation_id: navRecord.id,
        },
      });
      console.log(`[seed] Seeded navigation field #${field.nbr} ("${field.name}")`);
    }
  }

  console.log(`[seed] CMS structure successfully provisioned.`);
}

async function ensureIntegerPageIdSchema() {
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

async function main() {
  await ensureIntegerPageIdSchema();
  const admin = await seedSuperAdmin();
  await seedCmsContent(admin.id);
}

main()
  .catch((e) => {
    console.error("Error running database seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
