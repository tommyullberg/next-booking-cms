# Local Development Guide

This guide walks you through setting up and running NextBooking CMS on your local development machine.

## Prerequisites

Required software tools:

- Node.js 20.x or later
- npm 10.x or later
- Docker Desktop (for database and object storage)
- Git

## Step-by-Step Quickstart

### 1. Clone Repository and Install Dependencies

Execute the following commands to clone the repository and install all npm dependencies:

```bash
git clone https://github.com/tommyullberg/next-booking-cms.git
cd next-booking-cms
npm install
```

### 2. Start Infrastructure Containers via Docker

Docker is used strictly to run the PostgreSQL database and MinIO storage in the background. The Next.js frontend applications and CMS core run natively on the host OS for fast hot-module replacement:

```bash
docker compose up -d
```

This launches the following services:

- PostgreSQL 16: Port 5432 (database `next_booking_cms`, user `cms_admin`, password `cms_secure_pass`)
- MinIO S3: API on port 9000, Web Console on port 9001 (user `minio_admin`, password `minio_secure_pass`)

### 3. Configure Environment Variables

Copy `.env.example` to `.env` in the repository root (and optionally into `packages/cms-core` for standalone Prisma CLI commands):

```env
DATABASE_URL="postgresql://cms_admin:cms_secure_pass@localhost:5432/next_booking_cms?schema=public"
NEXTAUTH_SECRET="dev-super-secret-key-change-in-prod"
NEXTAUTH_URL="http://localhost:3000"

STORAGE_PROVIDER="local" # or "s3"
UPLOAD_DIR="./uploads"

MINIO_ENDPOINT="http://localhost:9000"
MINIO_ACCESS_KEY="minio_admin"
MINIO_SECRET_KEY="minio_secure_pass"
MINIO_BUCKET="cms-media"

# Optional external integration keys:
GEMINI_API_KEY=""
RESEND_API_KEY=""
SENDGRID_API_KEY=""

# SuperAdmin Initial Seed Configuration
SUPERADMIN_EMAIL="superadmin@nextbooking.internal"
SUPERADMIN_PASSWORD="Admin123!"
SUPERADMIN_FIRSTNAME="Super"
SUPERADMIN_LASTNAME="Admin"
```

### 4. Apply Database Migrations and Seed SuperAdmin

Initialize database tables with Prisma 7 and seed the root SuperAdmin account:

```bash
# Run database schema migrations
npx prisma migrate dev --schema=packages/cms-core/prisma/schema.prisma

# Seed initial SuperAdmin account and root startsida (1001) into the database
npm run db:seed --workspace=@next-booking/cms-core

# (Optional) Seed tenant-specific booking data (e.g. for Lullyhill)
npx tsx apps/lullyhill/seeds/seed-booking.ts
```

### 5. Start Development Servers

Start all monorepo apps and packages concurrently with Turborepo:

```bash
npm run dev
```

The web services will be accessible at:

- Demo Website: [http://localhost:3000](http://localhost:3000)
- Villa Lullyhill: [http://localhost:3001](http://localhost:3001)
- MinIO Storage Console: [http://localhost:9001](http://localhost:9001)

## Administrative Access

The admin dashboard is mounted directly inside each application:

- Demo Admin Portal: [http://localhost:3000/admin](http://localhost:3000/admin)
- Demo Dedicated Login: [http://localhost:3000/admin/login](http://localhost:3000/admin/login)
- Lullyhill Admin Portal: [http://localhost:3001/admin](http://localhost:3001/admin)
- Lullyhill Dedicated Login: [http://localhost:3001/admin/login](http://localhost:3001/admin/login)

### Default Local Credentials

When initializing development databases without overrides, the seed script provisions:

- Email: `superadmin@nextbooking.internal`
- Password: `Admin123!`
- Role: `SUPERADMIN`

### Customer-Specific SuperAdmin Configuration

To configure unique SuperAdmin credentials for a specific tenant or customer environment, define the following variables in the `.env` file before running the seed script:

```env
SUPERADMIN_EMAIL="admin@customerdomain.com"
SUPERADMIN_PASSWORD="YourSecurePasswordHere123!"
SUPERADMIN_FIRSTNAME="Admin"
SUPERADMIN_LASTNAME="User"
```

Then execute the seed command:

```bash
npm run db:seed --workspace=@next-booking/cms-core
```

The seed script utilizes an idempotent `upsert` on the unique email address. If an account with the specified email already exists, its password hash and `SUPERADMIN` role are refreshed without disrupting foreign key relationships or content.

## Code Quality and Verification Commands

Always verify type integrity and production builds before committing:

```bash
# Check types across all packages and apps
npm run check-types

# Build optimized production bundles
npm run build

# Clear turbo build cache
npx turbo clean
```
