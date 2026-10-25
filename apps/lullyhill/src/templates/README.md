# Page Templates

This directory contains the page layout templates available for Villa Lullyhill.

Templates are modular React components that define how CMS pages are rendered on the frontend. They can contain custom layouts, Tailwind styling, and dynamic inline-editable fields via Compound Components (`CMSField.Text`, `CMSField.Image`, etc.).

## How to Create and Register a New Template

### 1. Create the Template Component

Create a new component file in this directory (e.g. `todo-on-gotland.tsx`):

```tsx
"use client";

import React from "react";
import { CMSPageData, CMSField } from "@next-booking/cms-core";

export function TodoOnGotlandTemplate({ page }: { page: CMSPageData }) {
  return (
    <main className="max-w-5xl mx-auto px-4 py-12">
      <header className="mb-8">
        <CMSField.Text
          fieldKey="headline"
          sectionIdentifier="todo_header"
          defaultValue={page.page_title || "Activities & Tips"}
          as="h1"
          className="text-4xl font-extrabold text-slate-900"
        />
      </header>
      <section className="prose lg:prose-lg max-w-none">
        <CMSField.Text
          fieldKey="intro"
          sectionIdentifier="todo_content"
          defaultValue="Explore the finest spots and activities around Gotland."
          as="p"
          className="text-lg text-slate-700"
        />
      </section>
    </main>
  );
}
```

### 2. Register the Template in `index.tsx`

Import your component and add it to `CMS_PAGE_TEMPLATES` in `apps/lullyhill/src/templates/index.tsx`:

```tsx
import { TodoOnGotlandTemplate } from "./todo-on-gotland";

export const CMS_PAGE_TEMPLATES: ProjectTemplateDefinition[] = [
  // ... existing templates
  {
    id: "todo-on-gotland",
    label: "Todo on Gotland",
    description: "Gotland tips, guide articles, and local attractions",
    component: TodoOnGotlandTemplate,
  },
];
```

### 3. Immediate Availability in Admin

Once registered in `CMS_PAGE_TEMPLATES`:

- The template appears dynamically in the template selector when creating new pages in `/admin`.
- The template appears in the Page Editor template dropdown.
- No changes are needed in `@next-booking/cms-core` or database migrations.
