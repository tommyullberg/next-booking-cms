# Deployment & Production Operations

This document outlines architectural recommendations and production deployment practices for NextBooking CMS.

## Deployment Models

NextBooking CMS supports multiple target environments depending on operational requirements:

### Model A: Serverless Edge (Vercel / AWS Amplify)

The applications (`apps/demo` and `apps/lullyhill`) deploy as standalone Next.js projects:

- Static assets and ISR pages are distributed across global edge CDNs.
- Server Actions and API route handlers execute as serverless micro-functions.
- Connects to managed PostgreSQL instances (e.g. Supabase, Neon, or AWS RDS).

### Model B: Containerized Docker Deployment

For Kubernetes or container-based infrastructures (AWS ECS, Google Cloud Run, on-premise VMs), applications can be packaged using Next.js `standalone` output mode:

```dockerfile
# Example multi-stage Dockerfile for apps/lullyhill
FROM node:20-alpine AS base
WORKDIR /app
COPY . .
RUN npm ci
RUN npx turbo run build --filter=lullyhill...
EXPOSE 3000
CMD ["node", "apps/lullyhill/.next/standalone/apps/lullyhill/server.js"]
```

## Database Connection Pooling and Sizing

In high-concurrency environments, Prisma 7 using `@prisma/adapter-pg` benefits from pooled connection management.

Configure `pg.Pool` with connection limits tailored to your database tier:

```typescript
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // Maximum pool connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});
```

In serverless architectures, an intermediary transaction pooler such as PgBouncer or Supabase Transaction Pooler is recommended to mitigate connection exhaustion.

## Cloud Media Storage

In production environments, configure `STORAGE_PROVIDER="s3"`:

- Use AWS S3, Cloudflare R2, or Google Cloud Storage via S3-compatible APIs.
- Attach an edge CDN domain (e.g. `media.lullyhill.se`) for cached, low-latency image delivery.
- Ensure CORS rules allow `GET` requests from your production domains and `PUT` requests for pre-signed or authenticated uploads.

## Production Environment Variables Checklist

Ensure the following variables are configured in production:

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string with SSL | `postgresql://user:pass@db.provider.com:5432/cms?sslmode=require` |
| `NEXTAUTH_SECRET` | 32+ character random cryptographic secret | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Canonical production URL | `https://lullyhill.se` |
| `STORAGE_PROVIDER` | Active storage adapter (`s3` recommended) | `s3` |
| `MINIO_ENDPOINT` | Endpoint for S3-compatible cloud storage | `https://s3.eu-north-1.amazonaws.com` |
| `MINIO_ACCESS_KEY` | Storage Access Key | `AKIAIOSFODNN7EXAMPLE` |
| `MINIO_SECRET_KEY` | Storage Secret Key | `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY` |
| `MINIO_BUCKET` | Production bucket name | `lullyhill-production-media` |
| `GEMINI_API_KEY` | Google Gemini API key for translation | `AIzaSy...` |
| `RESEND_API_KEY` | Transactional email provider key | `re_123456789` |
| `SUPERADMIN_EMAIL` | Initial root SuperAdmin account email | `admin@customerdomain.com` |
| `SUPERADMIN_PASSWORD` | Initial root SuperAdmin secure password | `StrongSecretPassword123!` |
| `SUPERADMIN_FIRSTNAME` | Initial root SuperAdmin first name | `Admin` |
| `SUPERADMIN_LASTNAME` | Initial root SuperAdmin last name | `User` |

## Initial SuperAdmin Provisioning & Customer Setup

When provisioning a new production tenant or customer instance, configure the customer-specific `SUPERADMIN_*` environment variables in your deployment environment (e.g. Vercel Environment Variables, AWS ECS task definition, or Docker environment files):

```bash
# Apply pending schema migrations to production PostgreSQL
npx prisma migrate deploy --schema=packages/cms-core/prisma/schema.prisma

# Seed initial SuperAdmin account with bcrypt password hashing and root startsida
npm run db:seed --workspace=@next-booking/cms-core

# Optional: Seed customer/tenant-specific booking units and landlords (e.g. for Lullyhill)
DATABASE_URL="postgresql://user:pass@db.provider.com:5432/cms?sslmode=require" npx tsx apps/lullyhill/seeds/seed-booking.ts
```

### Accessing the Administrative Interface

Once seeded, administrators access the portal at:

- Production Admin Portal: `https://<customer-domain>/admin`
- Production Login Endpoint: `https://<customer-domain>/admin/login`

Unauthenticated requests to `/admin` or its subroutes are automatically intercepted by Next.js middleware and redirected to `/admin/login`.

### Role-Based Access Control (RBAC) Protections

The system distinguishes between three administrative tiers (`SUPERADMIN`, `ADMIN`, `EDITOR`):

- `SUPERADMIN`: Full root privileges across all content, settings, and administrator accounts.
- `ADMIN`: Operational management of pages, bookings, media, and standard user accounts.
- Server-side immutability: Standard `ADMIN` users are strictly prevented from editing, deleting, or altering credentials of any `SUPERADMIN` account.

## Security Best Practices

Key security measures for production deployments:

- HTTPS & Secure Cookies: NextAuth automatically enables secure cookie attributes (`__Secure-` prefix and `SameSite=Lax`) when running with `NODE_ENV=production`.
- Parameterized Queries: All database interaction flows through Prisma 7, inherently protecting against SQL injection attacks.
- Upload Validation: Media uploads are restricted to validated MIME types (JPEG, PNG, WebP, SVG, PDF) and capped at 10 MB per file.
- Automated Backups: Establish scheduled daily snapshots of the PostgreSQL database (`pg_dump`) alongside versioned S3 object storage policies.
