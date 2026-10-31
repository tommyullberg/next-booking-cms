# NextBooking CMS - Technical Documentation

Welcome to the technical documentation for NextBooking CMS. This documentation provides a comprehensive overview of the system architecture, database design, core CMS functionality, booking and calendar integration, local development workflows, and production deployment guidelines.

## Documentation Index

1. [Architecture & Monorepo](architecture.md) - Overview of the monorepo structure, Turborepo pipelines, workspace boundaries, client/server module separation, brand asset handling, and application routing.
2. [Database Schema & Prisma 7](database.md) - Detailed specification of the PostgreSQL database, Prisma 7 configuration with driver adapters (`@prisma/adapter-pg` and `prisma.config.ts`), and documentation of all 21 database models and relationships (including Landlords, Booking Objects, Optionals, Object Price Periods, Media Folders, Galleries, and Mail Templates).
3. [CMS Engine & Inline Editing](cms-engine.md) - Deep dive into the Compound Component architecture, Render Props pattern, Zustand state management, inline editing floating panel, smart conditional wrappers (`CMSField.Group`), multi-image galleries (`CMSField.Gallery`), brand logos, and AI translation cascade.
4. [Booking Engine & iCal Synchronization](booking-ical.md) - Documentation of the TanStack Query booking calendar with half-day visual split indicators, multi-unit color coding, flexible availability search with animated scanning loaders (`Loader`), RFC 5545 iCal parser/generator, automated synchronization, and email notification templates.
5. [Local Development](local-development.md) - Step-by-step developer guide for setting up Docker infrastructure (PostgreSQL and MinIO), configuring environment variables, running database migrations, media asset setup, and executing applications locally.
6. [Deployment & Operations](deployment.md) - Production deployment guidelines, cloud storage configuration (S3/MinIO), database connection pooling, environment variables checklist, and security recommendations.
