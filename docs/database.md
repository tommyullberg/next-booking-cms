# Database Schema & Prisma 7

The database layer of NextBooking CMS runs on PostgreSQL 16 and is managed with Prisma 7 ORM. All tables and columns adhere to a strict English `snake_case` naming convention.

## Prisma 7 Architecture and Driver Adapters

Prisma 7 introduces a modernized connection architecture:

First, `schema.prisma` specifies models, relations, indexes, and generators. In Prisma 7, setting `url = env("DATABASE_URL")` directly inside the `datasource db` block in the schema file is obsolete and causes configuration warnings.

Second, the database connection URL is declared in `packages/cms-core/prisma.config.ts` using `@prisma/config`:

```typescript
import { defineConfig, env } from '@prisma/config';
import dotenv from 'dotenv';
dotenv.config();

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasources: {
    db: {
      url: env('DATABASE_URL'),
    },
  },
});
```

Third, runtime client initialization in `packages/cms-core/src/db.ts` uses the official `@prisma/adapter-pg` driver adapter paired with a connection pool from `pg`:

```typescript
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
export const prisma = new PrismaClient({ adapter });
```

This configuration eliminates IDE schema deprecation warnings, supports native server connection pooling, and ensures zero deprecation warnings across local and CI/CD environments.

## Database Models

### 1. `administrators`

System accounts for editors and administrators:

- `id` (UUID, PK)
- `email` (VarChar 255, Unique)
- `password_hash` (VarChar 255)
- `name` (VarChar 255)
- `role` (AdminRole enum: SUPERADMIN, ADMIN, EDITOR)
- `is_active` (Boolean, default true)
- `last_login_at` (DateTime, Nullable)
- `created_at`, `updated_at` (DateTime)

### 2. `settings`

Global system configuration key/value pairs:

- `id` (UUID, PK)
- `key` (VarChar 100, Unique)
- `value` (Text)
- `type` (VarChar 50, default 'string')
- `created_at`, `updated_at` (DateTime)

### 3. `sections`

Logical structural sections on a page (e.g. Hero, Features, Gallery, Booking):

- `id` (UUID, PK)
- `name` (VarChar 100)
- `identifier` (VarChar 100, Unique)
- `description` (Text, Nullable)
- `sort_order` (Integer, default 0)
- `created_at`, `updated_at` (DateTime)

### 4. `pages`

Site page hierarchy and publication status:

- `id` (UUID, PK)
- `parent_id` (UUID, FK to pages.id, Nullable for root pages)
- `slug` (VarChar 255, Unique)
- `template` (VarChar 100, default 'default')
- `is_published` (Boolean, default false)
- `sort_order` (Integer, default 0)
- `created_at`, `updated_at` (DateTime)

### 5. `page_translations`

Localized page metadata and SEO fields:

- `id` (UUID, PK)
- `page_id` (UUID, FK to pages.id)
- `language_code` (VarChar 10)
- `title` (VarChar 255)
- `meta_description` (Text, Nullable)
- Unique composite index on `[page_id, language_code]`.

### 6. `category_types`

Classification groups for categorization (e.g. "Property Type", "Region", "Season"):

- `id` (UUID, PK)
- `name` (VarChar 100)
- `identifier` (VarChar 100, Unique)
- `created_at`, `updated_at` (DateTime)

### 7. `categories`

Specific taxonomy categories assigned to a category type:

- `id` (UUID, PK)
- `type_id` (UUID, FK to category_types.id)
- `name` (VarChar 100)
- `slug` (VarChar 100)
- `description` (Text, Nullable)
- Unique composite index on `[type_id, slug]`.

### 8. `files_and_images`

Media library for uploaded photos, assets, and documents:

- `id` (UUID, PK)
- `file_name` (VarChar 255)
- `original_name` (VarChar 255)
- `mime_type` (VarChar 100)
- `file_size` (Integer)
- `storage_path` (Text)
- `alt_text` (VarChar 255, Nullable)
- `created_at`, `updated_at` (DateTime)

### 9. `navigations_and_links`

Navigation menu containers (e.g. "Main Menu", "Footer Links"):

- `id` (UUID, PK)
- `identifier` (VarChar 100, Unique)
- `name` (VarChar 100)
- `created_at`, `updated_at` (DateTime)

### 10. `navigation_links`

Menu link entries with recursive hierarchy support:

- `id` (UUID, PK)
- `navigation_id` (UUID, FK to navigations_and_links.id)
- `parent_id` (UUID, FK to navigation_links.id, Nullable)
- `label` (VarChar 100)
- `url` (VarChar 255)
- `target` (VarChar 20, default '_self')
- `sort_order` (Integer, default 0)

### 11. `objects`

Rental units or room entities (e.g. Villa Lullyhill, Guest Wing):

- `id` (UUID, PK)
- `identifier` (VarChar 100, Unique)
- `name` (VarChar 255)
- `description` (Text, Nullable)
- `base_price` (Decimal 10,2, Nullable)
- `max_guests` (Integer, Nullable)
- `is_active` (Boolean, default true)
- `created_at`, `updated_at` (DateTime)

### 12. `amenities`

Property features and amenities linked to rental objects:

- `id` (UUID, PK)
- `name` (VarChar 100)
- `icon` (VarChar 100, Nullable)
- `created_at`, `updated_at` (DateTime)

### 13. `galleries`

Image gallery collections with ordered media associations:

- `id` (UUID, PK)
- `name` (VarChar 100)
- `identifier` (VarChar 100, Unique)
- `created_at`, `updated_at` (DateTime)

### 14. `page_fields`

Dynamic content field definitions tied to pages and sections:

- `id` (UUID, PK)
- `page_id` (UUID, FK to pages.id)
- `section_id` (UUID, FK to sections.id, Nullable)
- `field_key` (VarChar 100)
- `field_type` (FieldType enum: TEXT, RICH_TEXT, IMAGE, GALLERY, NUMBER, BOOLEAN, DATE, JSON)
- `sort_order` (Integer, default 0)
- Unique composite index on `[page_id, section_id, field_key]`.

### 15. `page_field_translations`

Localized field content supporting multi-language and AI translations:

- `id` (UUID, PK)
- `field_id` (UUID, FK to page_fields.id)
- `language_code` (VarChar 10)
- `content` (Text, Nullable)
- `media_id` (UUID, FK to files_and_images.id, Nullable)
- Unique composite index on `[field_id, language_code]`.

### 16. `bookings`

Guest reservations with date ranges, status, and iCal external references:

- `id` (UUID, PK)
- `object_id` (UUID, FK to objects.id)
- `start_date` (DateTime)
- `end_date` (DateTime)
- `guest_name` (VarChar 255)
- `guest_email` (VarChar 255)
- `guest_phone` (VarChar 50, Nullable)
- `total_price` (Decimal 10,2, Nullable)
- `status` (BookingStatus enum: PENDING, CONFIRMED, CANCELLED)
- `ical_uid` (VarChar 255, Nullable, Unique)
- `source` (VarChar 50, default 'direct')
- `created_at`, `updated_at` (DateTime)

### 17. `mail_templates`

Customizable notification and booking confirmation email templates:

- `id` (UUID, PK)
- `identifier` (VarChar 100, Unique)
- `subject` (VarChar 255)
- `body_html` (Text)
- `body_text` (Text, Nullable)
- `created_at`, `updated_at` (DateTime)

## Prisma CLI Workflows

Validate schema:

```bash
npx prisma validate --schema=packages/cms-core/prisma/schema.prisma
```

Format schema:

```bash
npx prisma format --schema=packages/cms-core/prisma/schema.prisma
```

Generate Prisma Client:

```bash
npx prisma generate --schema=packages/cms-core/prisma/schema.prisma
```

Apply migrations:

```bash
npx prisma migrate dev --schema=packages/cms-core/prisma/schema.prisma
```
