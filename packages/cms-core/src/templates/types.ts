export interface CMSTemplateOption {
  id: string;
  label: string;
  description?: string;
  isProtected?: boolean;
}

export const DEFAULT_CMS_TEMPLATES: CMSTemplateOption[] = [
  {
    id: "startpage",
    label: "Startpage",
    description: "Main website landing page",
    isProtected: true,
  },
  {
    id: "booking-unit",
    label: "Booking unit",
    description: "Detailed unit presentation linked to a booking object and calendar",
  },
  {
    id: "booking-overview",
    label: "Booking overview",
    description: "Overview grid of rentable units and cottages",
  },
  {
    id: "article",
    label: "Article",
    description: "Standard editorial content page",
  },
  {
    id: "contact",
    label: "Contact",
    description: "Contact information and inquiries",
  },
];

export function resolveTemplateOption(
  rawId?: string | null,
  templates: CMSTemplateOption[] = DEFAULT_CMS_TEMPLATES
): CMSTemplateOption {
  if (!rawId) {
    return templates.find((t) => t.id === "article") || templates[0];
  }

  const cleaned = rawId.toLowerCase().trim();

  // 1. Direct case-insensitive match
  const match = templates.find((t) => t.id.toLowerCase() === cleaned);
  if (match) {
    return match;
  }

  // 2. Safe backward compatibility for legacy imports without duplicate tables
  if (cleaned === "startpage") {
    return templates.find((t) => t.id === "startpage") || templates[0];
  }
  if (cleaned === "booking" || cleaned === "booking-unit" || cleaned === "booking unit") {
    return templates.find((t) => t.id === "booking-unit") || templates[1] || templates[0];
  }
  if (cleaned === "booking-overview" || cleaned === "booking overview") {
    return templates.find((t) => t.id === "booking-overview") || templates[2] || templates[0];
  }
  if (cleaned === "contact") {
    return templates.find((t) => t.id === "contact") || templates[4] || templates[0];
  }
  if (
    cleaned === "article" ||
    cleaned === "entire page" ||
    cleaned === "default" ||
    cleaned === "standard" ||
    cleaned === "landing"
  ) {
    return templates.find((t) => t.id === "article") || templates[3] || templates[0];
  }

  // 3. Fallback for custom or project-specific template names
  return {
    id: rawId,
    label: rawId.charAt(0).toUpperCase() + rawId.slice(1).replace(/-/g, " "),
  };
}

export function formatTemplateLabel(
  rawId?: string | null,
  templates: CMSTemplateOption[] = DEFAULT_CMS_TEMPLATES
): string {
  return resolveTemplateOption(rawId, templates).label;
}

