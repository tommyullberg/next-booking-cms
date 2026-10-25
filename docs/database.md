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

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://nextbooking:nextbooking_secret@localhost:5432/nextbooking_cms?schema=public';

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
export const prisma = new PrismaClient({ adapter });
```

This configuration eliminates IDE schema deprecation warnings, supports native server connection pooling, and ensures zero deprecation warnings across local and CI/CD environments.

## Database Models (19 Models)

### 1. `administrators`

System accounts for editors and administrators:

- `id` (CUID, PK)
- `first_name` (VarChar 255)
- `last_name` (VarChar 255)
- `email` (VarChar 255, Unique)
- `mobile` (VarChar 50, Nullable)
- `password_hash` (VarChar 255)
- `role` (AdminRole enum: `SUPERADMIN`, `ADMIN`, `EDITOR`)
- `created_at`, `updated_at` (DateTime)

### 2. `settings`

Global system configuration key/value pairs:

- `id` (CUID, PK)
- `setting_key` (VarChar 100, Unique)
- `setting_value` (Text)
- `created_at`, `updated_at` (DateTime)

### 3. `sections`

Structural section grouping for CMS pages:

- `id` (CUID, PK)
- `name` (VarChar 100)
- `translations` (Json, Nullable)
- `start_page_id` (Integer, Nullable)
- `sort_order` (Integer, default 0)
- `is_visible` (Boolean, default true)
- `created_at`, `updated_at` (DateTime)

### 4. `pages`

Site page hierarchy, publication state, and template assignments:

- `id` (Integer autoincrement, PK, starting at 1001 for root startsida)
- `template_name` (VarChar 100)
- `section_id` (CUID, FK to `sections.id`, Nullable)
- `sort_order` (Integer, default 0)
- `page_title` (VarChar 255)
- `link_description` (Text, Nullable)
- `meta_title` (VarChar 255, Nullable)
- `meta_description` (Text, Nullable)
- `slug` (VarChar 255, Unique)
- `status` (PageStatus enum: `NEW`, `PUBLISHED`, `ARCHIVED`)
- `publication_start`, `publication_end` (DateTime, Nullable)
- `created_date` (DateTime, default now)
- `created_by` (VarChar 255, Nullable)

### 5. `page_translations`

Localized page metadata and SEO fields:

- `id` (CUID, PK)
- `page_id` (Integer, FK to `pages.id`)
- `locale` (VarChar 10)
- `page_title` (VarChar 255)
- `link_description` (Text, Nullable)
- `meta_title` (VarChar 255, Nullable)
- `meta_description` (Text, Nullable)
- Unique composite index on `[page_id, locale]`.

### 6. `category_types`

Classification groups for taxonomy:

- `id` (CUID, PK)
- `name` (VarChar 100)
- `is_multiple` (Boolean, default false)
- `sort_order` (Integer, default 0)

### 7. `categories`

Specific taxonomy categories assigned to a category type:

- `id` (CUID, PK)
- `category_type_id` (CUID, FK to `category_types.id`)
- `name` (VarChar 100)
- `sort_order` (Integer, default 0)

### 8. `files_and_images`

Media library for uploaded photos, assets, and documents:

- `id` (CUID, PK)
- `file_name` (VarChar 255)
- `file_url` (VarChar 1024)
- `created_date` (DateTime, default now)

### 9. `navigations_and_links`

Navigation menu containers (e.g. "Main Menu", "Footer"):

- `id` (CUID, PK)
- `name` (VarChar 100)
- `type` (VarChar 50)

### 10. `navigation_links`

Menu link entries:

- `id` (CUID, PK)
- `navigation_id` (CUID, FK to `navigations_and_links.id`)
- `link_url` (VarChar 255)
- `link_text` (VarChar 100)
- `sort_order` (Integer, default 0)

### 11. `landlords`

Property owners and rental hosts:

- `id` (CUID, PK)
- `first_name` (VarChar 100)
- `last_name` (VarChar 100)
- `address` (VarChar 255, Nullable)
- `postal_code` (VarChar 20, Nullable)
- `city` (VarChar 100, Nullable)
- `email` (VarChar 255, Nullable)
- `phone` (VarChar 50, Nullable)
- `mobile` (VarChar 50, Nullable)
- `has_swish` (Boolean, default false)
- `account_type` (VarChar 50, Nullable)
- `account_number` (VarChar 100, Nullable)
- `created_at`, `updated_at` (DateTime)

### 12. `objects` (`BookingObject`)

Rentable cabins, houses, apartments, and mobile homes:

- `id` (CUID, PK)
- `name` (VarChar 255)
- `type` (VarChar 100, Nullable)
- `description` (Text, Nullable)
- `page_id` (Integer, FK to `pages.id`, Nullable)
- `landlord_id` (CUID, FK to `landlords.id`, Nullable)
- `sort_order` (Integer, default 0)
- `is_visible` (Boolean, default true)
- `size_sqm` (Float, Nullable)
- `room_count` (Integer, default 1)
- `room_type` (VarChar 100, Nullable: ROK, ROP, WC/Shower, Room)
- `bed_count` (Integer, default 1)
- `extra_bed_count` (Integer, default 0)
- `pets_allowed` (Boolean, default false)
- `price_matrix` (Json, Nullable)
- `created_at`, `updated_at` (DateTime)

### 13. `optionals` (`BookingOptional`)

Rentable add-on services and accessories (e.g. cleaning, baby cot, high chair):

- `id` (CUID, PK)
- `name` (VarChar 255)
- `description` (Text, Nullable)
- `image_url` (VarChar 1024, Nullable)
- `object_id` (CUID, FK to `objects.id`, Nullable - `null` means applicable to all objects)
- `is_active` (Boolean, default true)
- `price_hour` (Float, default 0)
- `price_day` (Float, default 0)
- `price_sun_thu` (Float, default 0)
- `price_thu_sun` (Float, default 0)
- `price_week` (Float, default 0)
- `sort_order` (Integer, default 0)
- `created_at`, `updated_at` (DateTime)

### 14. `amenities`

Amenities and amenities tags for booking units:

- `id` (CUID, PK)
- `name` (VarChar 100, Unique)
- Implicit Many-to-Many relation with `objects`.

### 15. `galleries`

Unit photo gallery collections linked to booking objects:

- `id` (CUID, PK)
- `object_id` (CUID, FK to `objects.id`)
- `image_id` (CUID, FK to `files_and_images.id`)
- `sort_order` (Integer, default 0)
- `caption` (VarChar 255, Nullable)

### 16. `page_fields`

Dynamic content field definitions tied to pages:

- `id` (CUID, PK)
- `page_id` (Integer, FK to `pages.id`)
- `nbr` (Integer)
- `field_type` (FieldType enum: `TEXT`, `IMAGE`, `NAVIGATION`)
- `class_names` (Text, Nullable)
- `content` (Text, Nullable)
- `type` (VarChar 50, Nullable)
- `rows` (Integer, Nullable)
- `image_id` (CUID, FK to `files_and_images.id`, Nullable)
- `width`, `height`, `max_width`, `max_height` (Integer, Nullable)
- `ratio` (VarChar 20, Nullable)
- `navigation_id` (CUID, FK to `navigations_and_links.id`, Nullable)
- Unique composite index on `[page_id, nbr, field_type]`.

### 17. `page_field_translations`

Localized field content supporting multi-language:

- `id` (CUID, PK)
- `page_field_id` (CUID, FK to `page_fields.id`)
- `locale` (VarChar 10)
- `content` (Text)
- Unique composite index on `[page_field_id, locale]`.

### 18. `bookings`

Guest reservations and calendar blocks:

- `id` (CUID, PK)
- `object_id` (CUID, FK to `objects.id`)
- `start_date` (DateTime)
- `end_date` (DateTime)
- `customer_name` (VarChar 255)
- `customer_email` (VarChar 255)
- `customer_phone` (VarChar 50, Nullable)
- `guests_count` (Integer, default 1)
- `pets_count` (Integer, default 0)
- `price` (Float, Nullable)
- `status` (BookingStatus enum: `PENDING`, `APPROVED`, `REJECTED`, `IMPORTED`)
- `ical_source_id` (VarChar 255, Nullable)
- `created_at`, `updated_at` (DateTime)

### 19. `mail_templates`

Email notification templates:

- `id` (CUID, PK)
- `template_type` (MailTemplateType enum, Unique: `ADMIN_NEW_BOOKING_REQUEST`, `USER_NEW_BOOKING_REQUEST_COPY`, `USER_BOOKING_CONFIRMED`)
- `subject` (VarChar 255)
- `body` (Text)
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

Push schema directly (for development):

```bash
npx prisma db push --schema=packages/cms-core/prisma/schema.prisma
```

Seed base SuperAdmin and startsida:

```bash
npm run db:seed --workspace=@next-booking/cms-core
```

Seed base SuperAdmin and startsida:

```bash
npm run db:seed --workspace=@next-booking/cms-core
```

