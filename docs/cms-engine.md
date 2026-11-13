# CMS Engine & Inline Editing

The CMS engine in `packages/cms-core` empowers developers with complete layout and styling freedom while providing content editors with an intuitive, real-time inline editing experience directly on the website frontend.

## Template Architecture & Compound Components

Dynamic content fields are declared in frontend templates using Compound Components and the Render Props pattern. This approach cleanly decouples content fetching and editing state from visual presentation, allowing components to be styled freely with Tailwind CSS without enforcing rigid DOM structures.

All page fields and galleries are synchronously provided in-memory through `CMSPageProvider` and React Context (`useCMSPage`), ensuring zero redundant network fetches when fields render or evaluate visibility.

### 1. `CMSField.Text`

Used for headlines, subtitles, and body text.

- Props: `nbr` (number), `as` (e.g. `'h1'`, `'h2'`, `'p'`, `'div'`, `'span'`), `className`, `fallbackToPageTitle` (boolean), `children` (optional render prop function).
- Inline editing integration: When text edit mode is active, the field displays an interactive dashed outline (`outline-dashed outline-2 outline-sky-500`) with hover highlight and opens `TextEditModal`.
- Multi-language support: Content is automatically localized based on active locale, falling back to Swedish base content.

Example:

```tsx
<CMSField.Text
  nbr={1}
  as="h1"
  fallbackToPageTitle
  className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight text-slate-900 dark:text-foreground"
/>
```

### 2. `CMSField.Image`

Used for hero imagery, presentation photos, and banner images.

- Props: `nbr` (number), `alt` (string), `className`, `wrapperClassName`, `aspectRatio`, `maxWidth`, `children` (optional render prop function).
- Inline editing integration: When image edit mode is active, clicking the image or its placeholder triggers `ImageEditModal` with Media Library folder navigation, image upload, and alt text configuration.

Example:

```tsx
<CMSField.Image
  nbr={1}
  alt={page.page_title}
  wrapperClassName="overflow-hidden rounded-3xl border border-neutral-300 dark:border-border bg-neutral-100 dark:card p-2 shadow-2xl"
  className="w-full h-auto object-cover rounded-2xl max-h-[480px]"
/>
```

### 3. `CMSField.Gallery`

Used for multi-image photo galleries with lightbox viewing and reordering.

- Props: `nbr` (number), `layout` (`"grid"` | `"bento"` | `"carousel"`), `columns` (2 | 3 | 4), `aspectRatio` (`"16/9"` | `"4/3"` | `"3/2"` | `"1/1"`), `captionPosition` (`"lightbox"` | `"both"` | `"hidden"`), `showThumbnails` (boolean), `className`.
- Global settings fallback: Resolves layout, columns, aspect ratio, caption position, and thumbnail strip options from global CMS settings in `settings-view.tsx` if not explicitly overridden by template props.
- Inline editing integration: In image edit mode, clicking the gallery or its configuration placeholder opens `GalleryEditModal` featuring multi-file dropzone upload, 2-level folder filtering, drag-and-drop sortable thumbnail reordering, per-image localized captions with AI translation buttons, and modal maximize/restore sizing.
- Lightbox: Built-in Fancybox-style fullscreen overlay with zoom toggle, thumbnails bar, keyboard navigation (Escape, Left/Right arrows), and touch support.

Example:

```tsx
<CMSField.Gallery nbr={1} />
```

### 4. `CMSField.Group` (or `CMSField.FieldGroup`)

A smart conditional rendering container that eliminates empty container boxes, leftover borders, margins, or paddings when specified CMS fields are empty.

Supported properties:

- `texts`: Array of text field numbers to monitor, e.g. `[3, 4]`.
- `images`: Array of image field numbers to monitor, e.g. `[1]`.
- `galleries`: Array of gallery field numbers to monitor, e.g. `[1]`.
- `match`: `"any"` (default — visible if at least one field has content) or `"all"` (visible only if all specified fields have content).
- `as`: Optional DOM element type, e.g. `'section'`, `'div'`, `'article'`. If omitted and `className` is present, defaults to `'div'`; if both are omitted, acts as a pure React Fragment wrapper.
- `className`: Optional CSS classes applied to the container.

Behavior and visibility rules:

- Visitor behavior: Returns `null` when monitored fields have no content, ensuring zero leftover markup, borders, shadows, or spacing gaps in the DOM.
- Editor behavior: Automatically stays visible in edit mode (`isAdmin && mode !== "normal"`) so content editors can always see and click empty field placeholders to add content.

Example as a `<section>` replacement:

```tsx
<CMSField.Group
  as="section"
  texts={[3, 4]}
  className="space-y-3 max-w-3xl rounded-3xl border border-neutral-300 dark:border-border bg-neutral-100 dark:bg-card/60 p-6 sm:p-8 shadow-md border-l-4 border-l-sky-600 dark:border-l-sky-500"
>
  <CMSField.Text
    nbr={3}
    as="h2"
    className="text-xl font-bold tracking-tight text-slate-900 dark:text-foreground"
  />
  <CMSField.Text
    nbr={4}
    as="div"
    className="text-sm text-slate-700 dark:text-muted-foreground leading-relaxed"
  />
</CMSField.Group>
```

Example wrapping a gallery:

```tsx
<CMSField.Group as="section" galleries={[1]} className="space-y-4">
  <CMSField.Gallery nbr={1} />
</CMSField.Group>
```

### 5. `CMSField.Navigation` and Render Props

Provides full template control over navigation menu markup and accessibility semantics.

Example:

```tsx
<CMSField.Navigation nbr={1}>
  {(links) => (
    <nav aria-label="Footer links">
      <ul className="flex items-center gap-6">
        {links.map((link) => (
          <li key={link.id}>
            <a href={link.link_url} className="text-sm font-medium hover:text-sky-600">
              {link.link_text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )}
</CMSField.Navigation>
```

### 6. Page Template Registry (`CMS_PAGE_TEMPLATES`)

Each frontend application (`apps/lullyhill`, `apps/demo`, or future tenant templates) defines its available page templates in `src/templates/index.tsx` exporting:

- `CMS_PAGE_TEMPLATES`: An array of `ProjectTemplateDefinition` mapping each template ID to its React component, display label, and optional description.
- `CMS_PAGE_TEMPLATE_OPTIONS`: Plain serializable metadata passed to `<AdminApp availableTemplates={CMS_PAGE_TEMPLATE_OPTIONS} />` in `src/app/admin/page.tsx`.

Adding a new custom template requires only two steps:

1. Create the React template component in `src/templates/`.
2. Register it in `CMS_PAGE_TEMPLATES` in `src/templates/index.tsx`.

The template is then immediately selectable in `/admin` when creating or editing pages, and resolves seamlessly on the frontend without changing any core CMS packages or database schemas.

## State Management and Inline Editor

Inline editing state is centrally managed via a Zustand store (`useEditorStore`):

- `mode`: `'normal'`, `'text'`, `'image'`, or `'administration'`.
- `selectedField`: Currently selected field metadata and active values.
- `activeLocale`: Active editing language code (e.g. `'sv'`, `'en'`, `'de'`).
- `isModalOpen`: Controls dialog visibility.

### Floating Toolbar (`InlineEditor`)

When an administrator is authenticated, a floating dock appears at the bottom of the viewport:

- Toggles between browse mode (`normal`), text edit mode (`text`), image/gallery edit mode (`image`), and admin mode (`administration`).
- Switches language context with instant live preview.
- Provides a one-click shortcut to the full `/admin` dashboard.

### Editor Modals

Dedicated modal dialogs handle rich interactions using shared Radix UI `Dialog` components, standard `FormField` containers, and `ConfirmProvider`:

- `TextEditModal`: Offers rich text and plain text editing with built-in AI translation buttons.
- `ImageEditModal`: Provides Media Library folder navigation, image uploads, external URL inputs, and alt text configuration.
- `GalleryEditModal`: Provides multi-image upload dropzone, 2-level folder filtering, drag-and-drop sorting, localized captions, and modal maximize/restore sizing.

## AI Translation Module with Cascading Fallback

To streamline multi-language operations, `packages/cms-core/src/ai/` implements a three-tier resilient translation engine:

```text
[Client / Editor triggers translation]
                  │
                  ▼
   ┌─────────────────────────────┐
   │ 1. Google Gemini 1.5 Flash  │───(Success)───► Completed
   └─────────────────────────────┘
                  │ (Error or missing API key)
                  ▼
   ┌─────────────────────────────┐
   │ 2. LibreTranslate (Local)   │───(Success)───► Completed
   └─────────────────────────────┘
                  │ (Error or unreachable host)
                  ▼
   ┌─────────────────────────────┐
   │ 3. Hugging Face Inference   │───(Success)───► Completed
   └─────────────────────────────┘
                  │ (All providers failed)
                  ▼
       [Throws Structured Error]
```

Tier 1: Google Gemini 1.5 Flash (Primary)
High-quality, context-aware translations preserving HTML/Markdown markup structures and tone.

Tier 2: LibreTranslate (First Fallback)
Open-source self-hostable translation server fallback.

Tier 3: Hugging Face Inference (Second Fallback)
Public inference API using models like Helsinki-NLP/opus-mt.
