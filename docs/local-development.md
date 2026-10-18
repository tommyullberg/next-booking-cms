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
```

### 4. Apply Database Migrations

Initialize database tables with Prisma 7:

```bash
npx prisma migrate dev --schema=packages/cms-core/prisma/schema.prisma
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

- Demo Admin: [http://localhost:3000/admin](http://localhost:3000/admin)
- Lullyhill Admin: [http://localhost:3001/admin](http://localhost:3001/admin)

Default development credentials:

- Email: `superadmin@nextbooking.internal`
- Password: `Admin123!`

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
