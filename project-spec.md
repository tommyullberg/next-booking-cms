# PROJECT SPECIFICATION NEXTBOOKING CMS

## ARCHITECTURE AND MONOREPO SETUP

The system is built as a Monorepo using Turborepo to separate the core CMS engine from client-specific implementations. The repository is named next-booking-cms and is divided into apps and packages.

packages/cms-core contains the core engine, Prisma schema, database connections, authentication, backend admin interface, and the reusable Field components for templates.

apps/demo contains a generic starter site. The design is neutral, professional, and features automatic Light/Dark mode based on user system preferences with Light mode as default. It must strictly adhere to WCAG standards regarding contrast, interactive flows, and aria tags.

apps/lullyhill contains the specific frontend for Villa Lullyhill.

Production builds use Turborepo filters to isolate the specific app, ensuring no cross-contamination of code or assets between clients.

## TECH STACK

Frontend uses Next.js App Router.

Monorepo management uses Turborepo.

Styling is handled with Tailwind CSS.

UI components are fetched from shadcn/ui.

Animations in the admin interface use Framer Motion.

State Management uses Zustand for client state and TanStack Query for server state.

Authentication uses NextAuth.

Backend and Database use PostgreSQL.

ORM is Prisma.

Storage uses a Storage Adapter Pattern, local disk for development and AWS S3 in production.

Email handling uses Resend or SendGrid.

AI Translation uses a free AI API.

Deployment is done via Docker.

## DESIGN AND AESTHETICS

Frontend Client Theme Lullyhill: The style is called 'Gotlandic Luxury'. Minimalist, clean, and nature-inspired. Background is limestone white 'bg-slate-50'. Primary text is slate grey 'text-slate-900'. Accent color is coastal blue 'bg-sky-700'.

Backend Admin Theme: Visually separated from the frontend. Hyper-modern, tech-focused design with Dark Mode as default, toggleable to Light Mode. Utilizes Framer Motion for fluid transitions. The admin panel header and dashboard must clearly display the 'NextBooking CMS' branding.

## DATABASE MODEL AND PRISMA

All database fields and code must be written in English. Naming convention for the database is snake_case.

administrators: id, first_name, last_name, email, mobile, password_hash.

settings: id, setting_key, setting_value. Used for global configuration like the iCal URL.

sections: id, name, start_page_id, sort_order, is_visible.

pages: id, template_name, section_id, page_title, link_description, meta_title, meta_description, slug, status, publication_start, publication_end, created_date, created_by. Slug is validated against a blacklist. Fallback is id-based path. Status enum: NEW, PUBLISHED, ARCHIVED.

category_types: id, name, is_multiple.

categories: id, category_type_id, name.

files_and_images: id, file_name, file_url, created_date.

navigations_and_links: id, name, type.

navigation_links: id, navigation_id, link_url, link_text, sort_order.

objects: id, name, description, page_id, size_sqm, bed_count, extra_bed_count, pets_allowed, price_matrix.

amenities: id, name. Many-to-many relation to objects.

galleries: id, object_id, image_id, sort_order, caption.

page_fields: Text fields: nbr, type, rows, class_names. Image fields: nbr, width, height, max_width, max_height, ratio, class_names. Navigation fields: nbr, class_names, navigation_id.

bookings: id, object_id, start_date, end_date, customer_name, customer_email, customer_phone, guests_count, pets_count, price, status, ical_source_id. Status enum: PENDING, APPROVED, REJECTED, IMPORTED.

mail_templates: id, template_type, subject, body. template_type is an enum like ADMIN_NEW_BOOKING_REQUEST, USER_NEW_BOOKING_REQUEST_COPY, USER_BOOKING_CONFIRMED.

## TEMPLATE ARCHITECTURE AND COMPONENTS

The system uses Compound Components and Render Props to separate data logic from HTML presentation. The core CMS engine provides abstract components that are styled directly in the client apps.

Text and Image Fields: A parent component handles data fetching from React Context. If data is empty, it returns null. The child component renders the content. This allows the Next.js template to freely wrap fields in custom HTML tags without hardcoding layouts in the CMS core.

Navigation Fields: Uses the Render Props pattern. The core component provides the array of links via a function as a child. The client template defines the loop HTML, such as rendering ul/li lists or interactive cards, utilizing a React Fragment to handle the key automatically.

## MULTILINGUAL SUPPORT

Admin UI supports Swedish and English.

Public content supports Swedish, English, and German. Languages can be activated globally and per page.

Editing interface displays Swedish on the left and the active language on the right.

An AI agent API translates text via a button click.

## BOOKING LOGIC AND ICAL SYNCHRONIZATION

The booking page uses a specific template with CMS content at the top and the TanStack Query calendar in the middle.

A background process checks the settings table for an iCal URL and downloads ics files from Booking.com, saving them as IMPORTED.

Web requests are saved as PENDING and block the calendar.

Automated emails with deeplinks are sent upon new requests and status changes.

Guests can search with flexible dates plus or minus X days, specifying persons and pets. Results are divided into exact matches and alternative suggestions.

## ADMINISTRATION AND BACKEND

CMS Admin sidebar is divided into CMS and Bookings sections.

Mail Templates admin view includes a persistent, expandable help section triggered by a question mark icon. This lists dynamic placeholder tags. Clicking a tag copies it to the clipboard.

Inline Editing: A floating panel on the frontend with buttons Normal, Text, Image, and Administration. State managed globally with Zustand. Clicking fields opens editing modals.

## DOCUMENTATION FOLDER

The project must include a docs folder in the root directory. It contains a Markdown guide explaining the CMS engine, Turborepo architecture, and how styling is applied for new clients.

## AGENT INSTRUCTIONS

Use this specification as the primary architecture document. Implement Turborepo for workspace management. Implement the Storage Adapter Pattern. Always use English for all code and enforce snake_case for database fields.
