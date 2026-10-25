# NextBooking CMS - Technical Documentation

Welcome to the technical documentation for NextBooking CMS. This documentation provides a comprehensive overview of the system architecture, database design, core CMS functionality, booking and calendar integration, local development workflows, and production deployment guidelines.

## Documentation Index

1. [Architecture & Monorepo](architecture.md) - Overview of the monorepo structure, Turborepo pipelines, workspace boundaries, client/server module separation, and application routing.
2. [Database Schema & Prisma 7](database.md) - Detailed specification of the PostgreSQL database, Prisma 7 configuration with driver adapters (`@prisma/adapter-pg` and `prisma.config.ts`), and documentation of all 19 database models and relationships (including Landlords, Booking Objects, Optionals, and Mail Templates).
3. [CMS Engine & Inline Editing](cms-engine.md) - Deep dive into the Compound Component architecture, Render Props pattern, Zustand state management, inline editing floating panel, and AI translation cascade.
4. [Booking Engine & iCal Synchronization](booking-ical.md) - Documentation of the TanStack Query booking calendar, flexible availability search algorithm, RFC 5545 iCal parser/generator, automated synchronization, and email notification templates.
5. [Local Development](local-development.md) - Step-by-step developer guide for setting up Docker infrastructure (PostgreSQL and MinIO), configuring environment variables, running database migrations, and executing applications locally.
6. [Deployment & Operations](deployment.md) - Production deployment guidelines, cloud storage configuration (S3/MinIO), database connection pooling, environment variables checklist, and security recommendations.
