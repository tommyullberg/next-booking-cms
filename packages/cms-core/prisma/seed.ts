import { PrismaClient, AdminRole } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";

dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
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

  console.log(`SuperAdmin seeded successfully: ${admin.email} (Role: ${admin.role})`);
}

main()
  .catch((e) => {
    console.error("Error seeding superadmin:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
