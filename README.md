# NEXTBOOKING CMS

NextBooking is a modular CMS and booking engine, built from the ground up in a Next.js environment as a decoupled system designed for our specific monorepo architecture.

The project uses a centralized core, packages/cms-core, which handles all backend logic, database access, security, authentication, and the administration interface itself.

Each unique client, such as apps/demo or apps/lullyhill, has its own frontend app within the same monorepo. These apps use the core as their engine but can customize their public design and override default configurations through unique seed scripts and environment variables.

The technologies powering the platform are Next.js, React, TypeScript, PostgreSQL 18, Prisma 7, and NextAuth. Security is managed via Role-Based Access Control (RBAC) and centralized middleware that protects all administration panels from unauthenticated visitors.

## Project Status

Work in Progress.

The foundational architecture with the database, security, and automatic seeding of initial content is in place. Current development focuses on the public frontend experience for guests, editing tools within the admin panel, and integration for synchronizing bookings via iCal.
