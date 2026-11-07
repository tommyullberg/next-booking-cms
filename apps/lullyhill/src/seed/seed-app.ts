import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import path from "path";
import dotenv from "dotenv";
import { seedTenant } from "@next-booking/cms-core/seed";

// Load environment variables from cwd, app directory, and monorepo root
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

process.env.APP_NAME = "lullyhill";

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://nextbooking:nextbooking_secret@localhost:5432/nextbooking_cms?schema=public";

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("=== Seeding Lullyhill Application ===");
  await seedTenant(prisma, pool);
  console.log("=== Lullyhill Seeding Finished Successfully ===");
}

main()
  .catch((e) => {
    console.error("Lullyhill seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
