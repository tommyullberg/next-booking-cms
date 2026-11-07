import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import path from "path";
import dotenv from "dotenv";
import { seedSystemDefaults, seedBookingBundle } from "@next-booking/cms-core/seed";
import { demoBookingBundle } from "./demo-data";

// Load environment variables from cwd, app directory, and monorepo root
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://nextbooking:nextbooking_secret@localhost:5432/nextbooking_cms?schema=public";

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("=== Seeding Demo Application (Neutral Environment) ===");

  // 1. Ensure core system prerequisites (SuperAdmin, Sequence, Root Page 1001)
  console.log("[demo-seed] 1. Ensuring core system defaults...");
  await seedSystemDefaults(prisma, pool);

  // 2. Seed generic demo booking bundle
  console.log("[demo-seed] 2. Seeding generic demo booking bundle...");
  const result = await seedBookingBundle(prisma, demoBookingBundle);

  console.log(
    `[demo-seed] Completed: ${result.landlordsMap.size} landlords, ${result.objectsMap.size} objects, ${result.amenitiesMap.size} amenities provisioned.`
  );
  console.log("=== Demo Seeding Successfully Finished ===");
}

main()
  .catch((e) => {
    console.error("Demo seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
