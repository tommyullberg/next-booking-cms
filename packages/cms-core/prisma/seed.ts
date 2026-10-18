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

async function seedSuperAdmin() {
  const email = (process.env.SUPERADMIN_EMAIL || "superadmin@nextbooking.internal").toLowerCase().trim();
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

  // 1. Ensure primary Section exists
  let section = await prisma.section.findFirst({
    where: { name: seedConfig.section.name },
  });

  if (!section) {
    section = await prisma.section.create({
      data: {
        name: seedConfig.section.name,
        sort_order: seedConfig.section.sort_order ?? 0,
        is_visible: seedConfig.section.is_visible ?? true,
      },
    });
    console.log(`[seed] Created primary section: "${section.name}" (ID: ${section.id})`);
  } else {
    console.log(`[seed] Using existing section: "${section.name}" (ID: ${section.id})`);
  }

  // 2. Ensure initial Page exists
  let page = await prisma.page.findUnique({
    where: { slug: seedConfig.page.slug },
  });

  if (!page) {
    page = await prisma.page.create({
      data: {
        page_title: seedConfig.page.page_title,
        slug: seedConfig.page.slug,
        template_name: seedConfig.page.template_name,
        section_id: section.id,
        status: seedConfig.page.status || "PUBLISHED",
        meta_title: seedConfig.page.meta_title || `${seedConfig.page.page_title} | NextBooking CMS`,
        meta_description: seedConfig.page.meta_description,
        created_by: adminId,
      },
    });
    console.log(`[seed] Created initial page: "${page.page_title}" (Slug: "${page.slug}", ID: ${page.id})`);
  } else {
    console.log(`[seed] Using existing page: "${page.page_title}" (Slug: "${page.slug}", ID: ${page.id})`);
  }

  // 3. Link section's start_page_id if unset
  if (!section.start_page_id) {
    await prisma.section.update({
      where: { id: section.id },
      data: { start_page_id: page.id },
    });
    console.log(`[seed] Linked start_page_id on section "${section.name}" to page "${page.page_title}"`);
  }

  // 4. Seed Page Fields
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
      console.log(`[seed] Seeded text field #${field.nbr} ("${field.content.slice(0, 30)}...")`);
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

async function main() {
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
