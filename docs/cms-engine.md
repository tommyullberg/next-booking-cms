# CMS Engine & Inline Editing

The CMS engine in `packages/cms-core` empowers developers with complete layout and styling freedom while providing content editors with an intuitive, real-time inline editing experience directly on the website frontend.

## Template Architecture & Compound Components

Dynamic content fields are declared in frontend templates using Compound Components and the Render Props pattern. This approach cleanly decouples content fetching and editing state from visual presentation, allowing components to be styled freely with Tailwind CSS without enforcing rigid DOM structures.

### 1. `CMSField.Text`

Used for headlines, subtitles, and body text.

- Props: `fieldKey`, `sectionIdentifier`, `defaultValue`, `as` (e.g. 'h1', 'h2', 'p', 'span').
- Inline editing integration: When edit mode is active, the field displays an interactive accent border and an edit pencil icon to trigger the text editor modal.

Example:

```tsx
<CMSField.Text
  fieldKey="hero_title"
  sectionIdentifier="hero"
  defaultValue="Exclusive Villa Accommodation"
  as="h1"
  className="text-4xl md:text-6xl font-bold tracking-tight text-slate-900"
/>
```

### 2. `CMSField.Image`

Used for hero imagery, gallery highlights, and branding logos.

- Props: `fieldKey`, `sectionIdentifier`, `defaultSrc`, `defaultAlt`, `aspectRatio`.
- Inline editing integration: Opens the image modal where editors can choose existing media from the library, input new image URLs, or update alt text.

Example:

```tsx
<CMSField.Image
  fieldKey="hero_background"
  sectionIdentifier="hero"
  defaultSrc="/images/hero-gotland.jpg"
  defaultAlt="Gotland sunrise over the sea"
  className="h-[500px] w-full rounded-2xl object-cover shadow-xl"
/>
```

### 3. `CMSField.Navigation` and Render Props

Provides full template control over navigation menu markup and accessibility semantics.

Example:

```tsx
<CMSField.Navigation
  navigationIdentifier="main-menu"
  defaultLinks={[
    { id: '1', label: 'Home', url: '/' },
    { id: '2', label: 'Book Now', url: '#booking' }
  ]}
>
  {(links) => (
    <ul className="flex items-center gap-6">
      {links.map((link) => (
        <li key={link.id}>
          <a href={link.url} className="text-sm font-medium hover:text-sky-600">
            {link.label}
          </a>
        </li>
      ))}
    </ul>
  )}
</CMSField.Navigation>
```

## State Management and Inline Editor

Inline editing state is centrally managed via a Zustand store (`useEditorStore`):

- `mode`: `'NORMAL'`, `'TEXT'`, `'IMAGE'`, or `'ADMIN'`.
- `activeField`: Currently selected field identifier.
- `language`: Active editing language code (e.g. `'sv'`, `'en'`, `'de'`).
- `isDirty`: Tracks unsaved modifications.

### Floating Toolbar (`FloatingPanel`)

When an administrator is authenticated, a floating dock appears at the bottom of the viewport:

- Toggles between browse mode and editing modes.
- Switches language context with instant live preview.
- Provides a one-click shortcut to the full `/admin` dashboard.

### Editor Modals

Dedicated modal dialogs handle rich interactions:

- `TextEditModal`: Offers rich text and markdown editing with built-in AI translation buttons.
- `ImageEditModal`: Provides media asset selection, image URL entry, preview rendering, and alt text editing.

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
Connects to a self-hosted or public LibreTranslate instance. Suitable for offline or data-privacy workflows.

Tier 3: Hugging Face Inference (Second Fallback)
Utilizes open-source translation models (e.g. `Helsinki-NLP/opus-mt`) as an extra safety tier if external cloud services encounter outages.
