# System Architecture & Monorepo

NextBooking CMS is structured as a modern TypeScript monorepo powered by Turborepo and npm workspaces. The architecture decouples shared business logic, administrative dashboards, and CMS components into a unified core package (`packages/cms-core`), while individual tenant websites operate as autonomous Next.js App Router applications under `apps/`.

## Monorepo Directory Layout

```text
next-booking-cms/
├── apps/
│   ├── demo/                  # Reference application with WCAG-compliant design (Port 3000)
│   └── lullyhill/             # Production template for Villa Lullyhill (Port 3001)
├── packages/
│   ├── cms-core/              # Core package: Prisma, Auth, Storage, Components, Admin, iCal, AI
│   ├── config-tailwind/       # Shared Tailwind CSS presets and color tokens
│   └── config-typescript/     # Strict base TypeScript configurations
├── docs/                      # Technical system documentation
├── docker-compose.yml         # Development infrastructure (PostgreSQL 16 & MinIO S3)
├── turbo.json                 # Turborepo task pipeline and caching rules
└── package.json               # Monorepo root workspace configuration
```

## Packages and Modules

### 1. `@next-booking/config-typescript`

Provides shared `tsconfig.json` configurations for strict type safety:

- `base.json`: Universal strict settings (`strict: true`, `target: ES2022`, `moduleResolution: Bundler`).
- `nextjs.json`: Tailored for Next.js App Router and JSX transformations.
- `react-library.json`: Configured for reusable React component libraries.

### 2. `@next-booking/config-tailwind`

Provides shared Tailwind CSS presets:

- Extends default palettes with custom design tokens (`navy`, `accent`, `sand`, `slate`).
- Configures dark mode using CSS class strategy (`darkMode: 'class'`).
- Bundles official Tailwind plugins for forms and typography.

### 3. `@next-booking/cms-core`

The central package encapsulating all CMS capabilities. To guarantee clean separation between client-side bundles and server-only runtime logic, the package provides three distinct entry points:

- `@next-booking/cms-core`: Universal client and template components (`CMSField`, `CMSPageProvider`, `useEditorStore`, `FloatingPanel`, editing modals, administrative views, TanStack Query calendar). Contains no Node.js built-ins (`fs`, `path`, native database drivers).
- `@next-booking/cms-core/server`: Server-only infrastructure and actions (Prisma ORM singleton, Storage Adapters, NextAuth configuration, Server Actions, iCal synchronization, and email dispatchers).
- `@next-booking/cms-core/middleware`: Centralized NextAuth route protection middleware imported by customer applications.

### 4. `apps/demo` and `apps/lullyhill`

Both applications utilize Next.js 16 App Router with React 19 and mount the core CMS:

- Root page (`/`): Renders public website content using `CMSPageProvider` and dynamic fields (`CMSField.Text`, `CMSField.Image`, `CMSField.Navigation`).
- Admin panel (`/admin`): Mounts the administrative dashboard via `<AdminApp />`, populated server-side with `loadAdminInitialData()`.
- Authentication (`/admin/login` and `/api/auth/[...nextauth]`): NextAuth Credentials-based authentication.
- CMS API (`/api/cms/[...slug]`): REST endpoints for media streaming, iCal calendar export, booking workflows, and page data.

## Client and Server Boundary Isolation (Webpack and Turbopack)

Next.js App Router enforces strict isolation between client and server code. The codebase follows these core architectural principles:

- Components requiring user interaction, state, or animations (`Framer Motion`, `Zustand`) are marked with `"use client"`.
- Database queries, file writes, and secret API keys (such as Gemini API, SendGrid, Resend) are restricted to Server Actions and API route handlers imported from `@next-booking/cms-core/server`.
- This architecture prevents accidental leakage of Node.js modules or sensitive credentials into browser bundles.

## Turborepo Build and Cache Pipeline

Defined in `turbo.json`:

- `build`: Builds applications and packages in topological order with output caching (`.next/**`, `dist/**`).
- `check-types`: Runs `tsc --noEmit` concurrently across all workspaces for instant type checking.
- `lint`: Runs static code analysis.
- `dev`: Starts development servers in persistent, non-cached mode (`cache: false`, `persistent: true`).

## Multi-Tenant Isolation & Role-Based Access Control

The platform enforces database-level and application-level isolation:

- **Database-Per-Customer Isolation**: Each customer deployment targets its own dedicated PostgreSQL schema or database instance (configured via `DATABASE_URL`), ensuring zero cross-tenant data contamination or shared state.
- **Role-Based Access Control (RBAC)**: Accounts are assigned roles (`SUPERADMIN`, `ADMIN`, `EDITOR`). System privileges enforce that regular `ADMIN` accounts cannot modify or delete `SUPERADMIN` credentials.
- **Initial Account Seeding**: SuperAdmin accounts are provisioned via environment variables (`SUPERADMIN_EMAIL`, `SUPERADMIN_PASSWORD`, `SUPERADMIN_FIRSTNAME`, `SUPERADMIN_LASTNAME`) using idempotent Prisma upserts.
