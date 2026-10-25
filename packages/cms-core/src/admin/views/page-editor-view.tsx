"use client";

import React, { useState } from "react";
import {
  ArrowLeft,
  Save,
  Loader2,
  Check,
  Calendar,
  Info,
  ExternalLink,
  ChevronDown,
  LayoutTemplate,
  FileText,
  Maximize2,
  CircleDot,
  CheckSquare,
  FolderTree,
  Layers,
  Box,
  AlertTriangle,
  UserCheck,
} from "lucide-react";
import { CMSPageField } from "../../components/fields/types";
import { FlagIcon } from "../../components/ui/flag-icon";
import { CategoryTypeItem } from "./categories-view";
import {
  BookingObjectDetails,
  formatBookingObjectType,
} from "../../booking/types";
import {
  cleanSlugInput,
  validateSlugInput,
  isDefaultIdOrRootSlug,
} from "../../utils/slug";

export interface PageEditorData {
  id: number | string;
  template_name: string;
  section_id?: string | null;
  categories?: Array<{ id: string; name: string; category_type_id: string }>;
  page_title: string;
  link_description?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  slug: string;
  status: "NEW" | "PUBLISHED" | "ARCHIVED";
  publication_start?: string | Date | null;
  publication_end?: string | Date | null;
  created_date?: string | Date;
  page_fields?: CMSPageField[];
  translations?: Array<{
    locale: string;
    page_title: string;
    link_description?: string | null;
    meta_title?: string | null;
    meta_description?: string | null;
  }>;
}

export interface PageEditorViewProps {
  page: PageEditorData;
  existingPages?: Array<{
    id: number | string;
    slug: string;
    page_title?: string;
  }>;
  sections?: Array<{ id: string; name: string }>;
  categoryTypes?: CategoryTypeItem[];
  bookingObjects?: BookingObjectDetails[];
  activeLanguages?: string[];
  activeLocales?: string[];
  onBack: () => void;
  onSave: (data: any) => Promise<void>;
}

const LANGUAGE_META: Record<string, { code: string; flag: string; label: string }> = {
  sv: { code: "SE", flag: "🇸🇪", label: "Swedish" },
  en: { code: "GB", flag: "🇬🇧", label: "English" },
  de: { code: "DE", flag: "🇩🇪", label: "German" },
  fi: { code: "FI", flag: "🇫🇮", label: "Finnish" },
  no: { code: "NO", flag: "🇳🇴", label: "Norwegian" },
  da: { code: "DA", flag: "🇩🇰", label: "Danish" },
};

const TEMPLATE_OPTIONS = [
  {
    value: "startpage",
    label: "Startpage",
    icon: LayoutTemplate,
  },
  {
    value: "booking-unit",
    label: "Booking unit",
    icon: LayoutTemplate,
  },
  {
    value: "booking-overview",
    label: "Booking overview",
    icon: Maximize2,
  },
  {
    value: "article",
    label: "Article",
    icon: FileText,
  },
  {
    value: "contact",
    label: "Contact",
    icon: CircleDot,
  },
];

function normalizeTemplateValue(raw: string, isHomepage?: boolean): string {
  if (isHomepage || raw === "startpage" || raw === "Startpage") return "startpage";
  if (raw === "booking-unit" || raw === "booking" || raw === "Booking unit") {
    return "booking-unit";
  }
  if (raw === "booking-overview" || raw === "Booking overview") {
    return "booking-overview";
  }
  if (raw === "contact" || raw === "Contact") {
    return "contact";
  }
  return "article";
}

function formatDateInput(val?: string | Date | null): string {
  if (!val) return "";
  const d = typeof val === "string" ? new Date(val) : val;
  if (isNaN(d.getTime())) return "";
  return d.toISOString().split("T")[0];
}

export function PageEditorView({
  page,
  existingPages = [],
  sections = [],
  categoryTypes = [],
  bookingObjects = [],
  activeLanguages,
  activeLocales = ["sv", "en", "de"],
  onBack,
  onSave,
}: PageEditorViewProps) {
  const effectiveLocales = activeLanguages || activeLocales;
  const secondaryLocales = effectiveLocales.filter((loc) => loc !== "sv");

  const isHomepage = Number(page.id) === 1001;

  const linkedBookingObject = React.useMemo(() => {
    if (!bookingObjects || !page.id) return null;
    return (
      bookingObjects.find((o) => Number(o.page_id) === Number(page.id)) || null
    );
  }, [bookingObjects, page.id]);
  const [savedStatus, setSavedStatus] = useState<"NEW" | "PUBLISHED" | "ARCHIVED">(page.status || "NEW");
  const [status, setStatus] = useState<"NEW" | "PUBLISHED" | "ARCHIVED">(page.status || "NEW");
  const [templateName, setTemplateName] = useState<string>(
    normalizeTemplateValue(page.template_name, isHomepage)
  );
  const [isTemplateOpen, setIsTemplateOpen] = useState(false);
  const [sectionId, setSectionId] = useState<string>(page.section_id || "");
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(() =>
    Array.isArray(page.categories) ? page.categories.map((c) => c.id) : []
  );
  const [slug, setSlug] = useState<string>(() => {
    if (isHomepage || isDefaultIdOrRootSlug(page.slug, page.id)) {
      return "";
    }
    return page.slug.replace(/^\/+/, "");
  });

  const slugValidation = isHomepage
    ? { isValid: true, error: null }
    : validateSlugInput(slug, {
        currentPageId: page.id,
        existingPages,
      });

  // Primary Swedish values
  const [svTitle, setSvTitle] = useState(page.page_title || "");
  const [svLinkTitle, setSvLinkTitle] = useState(page.link_description || page.page_title || "");
  const [svMetaTitle, setSvMetaTitle] = useState(page.meta_title || "");
  const [svMetaDesc, setSvMetaDesc] = useState(page.meta_description || "");

  // Secondary language translations map
  const [translations, setTranslations] = useState<
    Record<
      string,
      {
        pageTitle: string;
        linkDescription: string;
        metaTitle: string;
        metaDescription: string;
      }
    >
  >(() => {
    const map: Record<
      string,
      {
        pageTitle: string;
        linkDescription: string;
        metaTitle: string;
        metaDescription: string;
      }
    > = {};
    for (const loc of secondaryLocales) {
      const existing = page.translations?.find((t) => t.locale === loc);
      map[loc] = {
        pageTitle: existing?.page_title || "",
        linkDescription: existing?.link_description || "",
        metaTitle: existing?.meta_title || "",
        metaDescription: existing?.meta_description || "",
      };
    }
    return map;
  });

  // Toggle states for hiding translations
  const [useSamePageTitle, setUseSamePageTitle] = useState(false);
  const [useSameLinkTitle, setUseSameLinkTitle] = useState(false);

  // Date fields
  const [publicationStart, setPublicationStart] = useState<string>(formatDateInput(page.publication_start));
  const [publicationEnd, setPublicationEnd] = useState<string>(formatDateInput(page.publication_end));
  const [activeTooltip, setActiveTooltip] = useState<"pubStart" | "pubEnd" | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [lastSavedText, setLastSavedText] = useState("2 minutes ago by Super Admin (SU)");

  const updateTranslation = (
    locale: string,
    field: "pageTitle" | "linkDescription" | "metaTitle" | "metaDescription",
    value: string,
  ) => {
    setTranslations((prev) => ({
      ...prev,
      [locale]: {
        ...(prev[locale] || {
          pageTitle: "",
          linkDescription: "",
          metaTitle: "",
          metaDescription: "",
        }),
        [field]: value,
      },
    }));
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const finalCleanSlug = isHomepage ? "" : cleanSlugInput(slug, false);
    const check = isHomepage
      ? { isValid: true, error: null }
      : validateSlugInput(finalCleanSlug, {
          currentPageId: page.id,
          existingPages,
        });
    if (!check.isValid) {
      return;
    }

    setSlug(finalCleanSlug);
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const translationPayload = secondaryLocales.map((loc) => {
        const current = translations[loc] || {
          pageTitle: "",
          linkDescription: "",
          metaTitle: "",
          metaDescription: "",
        };
        return {
          locale: loc,
          pageTitle: useSamePageTitle ? svTitle : current.pageTitle || svTitle,
          linkDescription: useSameLinkTitle ? svLinkTitle : current.linkDescription || svLinkTitle,
          metaTitle: current.metaTitle || svMetaTitle,
          metaDescription: current.metaDescription || svMetaDesc,
        };
      });

      await onSave({
        id: page.id,
        templateName: isHomepage ? "startpage" : templateName,
        sectionId: sectionId || null,
        categoryIds: selectedCategoryIds,
        pageTitle: svTitle,
        linkDescription: svLinkTitle,
        metaTitle: svMetaTitle,
        metaDescription: svMetaDesc,
        slug: isHomepage
          ? "/"
          : finalCleanSlug || String(page.id),
        status,
        publicationStart: publicationStart ? new Date(publicationStart).toISOString() : null,
        publicationEnd: publicationEnd ? new Date(publicationEnd).toISOString() : null,
        translations: translationPayload,
      });

      setSavedStatus(status);
      setSaveSuccess(true);
      setLastSavedText("Just now by Super Admin (SU)");
      setTimeout(() => setSaveSuccess(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const currentTemplateOption = TEMPLATE_OPTIONS.find((t) => t.value === templateName) || TEMPLATE_OPTIONS[3];
  const SelectedTemplateIcon = currentTemplateOption.icon;

  const createdDateFormatted = page.created_date
    ? new Date(page.created_date).toISOString().split("T")[0]
    : "2026-10-15";
  const todayFormatted = new Date().toISOString().split("T")[0];

  const cleanActiveSlug = cleanSlugInput(slug, false);
  const publicUrlPath = isHomepage
    ? "/"
    : `/${cleanActiveSlug || page.id}`;

  return (
    <div className='space-y-6 max-w-6xl'>
      {/* Top Bar */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
        <h1 className='text-2xl font-bold tracking-tight text-white'>
          Edit Page: {translations.en?.pageTitle || svTitle || "Untitled"}
        </h1>

        <div className='flex items-center gap-2.5'>
          <button
            type='button'
            onClick={onBack}
            className='flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition'>
            <ArrowLeft className='w-3.5 h-3.5' />
            <span>Back</span>
          </button>

          <div
            title='Current saved status'
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider select-none ${
              savedStatus === "PUBLISHED"
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                : savedStatus === "NEW"
                  ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
                  : "border-red-500/30 bg-red-500/10 text-red-400"
            }`}>
            <span
              className={`w-2 h-2 rounded-full ${
                savedStatus === "PUBLISHED" ? "bg-emerald-400" : savedStatus === "NEW" ? "bg-amber-400" : "bg-red-400"
              }`}
            />
            <span>{savedStatus}</span>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 items-start'>
        {/* Left Column: Document Info & Metadata */}
        <div className='lg:col-span-2 space-y-3'>
          <h2 className='text-sm font-semibold text-slate-200'>Document Info & Metadata</h2>

          <form onSubmit={handleSave} className='rounded-2xl border border-slate-800/90 bg-slate-900/40 p-6 space-y-6'>
            {/* 1. Page Title (Multi-language stacked) */}
            <div className='space-y-2.5'>
              <label className='block text-xs font-medium text-slate-200'>Page Title</label>

              {/* Primary Language (SE) */}
              <div className='flex items-center rounded-xl border border-slate-800 bg-slate-950/90 overflow-hidden focus-within:border-sky-500 transition'>
                <span className='flex items-center gap-2 px-3 py-2.5 text-xs font-medium text-slate-400 bg-slate-900/70 border-r border-slate-800 shrink-0 w-20'>
                  <FlagIcon code='sv' size='sm' />
                  <span className='font-mono text-[11px]'>{LANGUAGE_META.sv.code}</span>
                </span>
                <input
                  type='text'
                  required
                  value={svTitle}
                  onChange={(e) => setSvTitle(e.target.value)}
                  placeholder='Sidrubrik på svenska...'
                  className='w-full bg-transparent px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none'
                />
              </div>

              {/* Secondary Active Languages (Tightly stacked underneath, one per row) */}
              {!useSamePageTitle &&
                secondaryLocales.map((loc) => {
                  const meta = LANGUAGE_META[loc] || {
                    code: loc.toUpperCase(),
                    flag: "",
                    label: loc,
                  };
                  return (
                    <div
                      key={loc}
                      className='flex items-center rounded-xl border border-slate-800/80 bg-slate-950/60 overflow-hidden focus-within:border-sky-500 transition'>
                      <span className='flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-400 bg-slate-900/50 border-r border-slate-800/80 shrink-0 w-20'>
                        <FlagIcon code={loc} size='sm' />
                        <span className='font-mono text-[11px]'>{meta.code}</span>
                      </span>
                      <input
                        type='text'
                        value={translations[loc]?.pageTitle || ""}
                        onChange={(e) => updateTranslation(loc, "pageTitle", e.target.value)}
                        placeholder={`Page title in ${meta.label}...`}
                        className='w-full bg-transparent px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none'
                      />
                    </div>
                  );
                })}

              {/* Hide translations toggle */}
              <div className='pt-0.5 flex items-center justify-between'>
                <label className='inline-flex items-center gap-2 cursor-pointer text-xs text-slate-400 hover:text-slate-300 select-none'>
                  <input
                    type='checkbox'
                    checked={useSamePageTitle}
                    onChange={(e) => setUseSamePageTitle(e.target.checked)}
                    className='h-3.5 w-3.5 rounded border-slate-700 bg-slate-900 text-sky-500 focus:ring-sky-500 focus:ring-offset-slate-950'
                  />
                  <span>Use same title for all languages (Hide translations)</span>
                </label>

                {useSamePageTitle && (
                  <span className='text-[11px] text-sky-400 bg-sky-500/10 border border-sky-500/20 rounded-md px-2 py-0.5'>
                    Fallback: SE used for all languages
                  </span>
                )}
              </div>
            </div>

            {/* 2. Link Title (Menu text) */}
            <div className='space-y-2.5'>
              <label className='block text-xs font-medium text-slate-200'>Link Title (Menu text)</label>

              {/* Primary Language (SE) */}
              <div className='flex items-center rounded-xl border border-slate-800 bg-slate-950/90 overflow-hidden focus-within:border-sky-500 transition'>
                <span className='flex items-center gap-2 px-3 py-2.5 text-xs font-medium text-slate-400 bg-slate-900/70 border-r border-slate-800 shrink-0 w-20'>
                  <FlagIcon code='sv' size='sm' />
                  <span className='font-mono text-[11px]'>{LANGUAGE_META.sv.code}</span>
                </span>
                <input
                  type='text'
                  value={svLinkDescOrTitle(svLinkTitle)}
                  onChange={(e) => setSvLinkTitle(e.target.value)}
                  placeholder='Menytext på svenska...'
                  className='w-full bg-transparent px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none'
                />
              </div>

              {/* Secondary Active Languages (Tightly stacked underneath, one per row) */}
              {!useSameLinkTitle &&
                secondaryLocales.map((loc) => {
                  const meta = LANGUAGE_META[loc] || {
                    code: loc.toUpperCase(),
                    flag: "",
                    label: loc,
                  };
                  return (
                    <div
                      key={loc}
                      className='flex items-center rounded-xl border border-slate-800/80 bg-slate-950/60 overflow-hidden focus-within:border-sky-500 transition'>
                      <span className='flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-400 bg-slate-900/50 border-r border-slate-800/80 shrink-0 w-20'>
                        <FlagIcon code={loc} size='sm' />
                        <span className='font-mono text-[11px]'>{meta.code}</span>
                      </span>
                      <input
                        type='text'
                        value={translations[loc]?.linkDescription || ""}
                        onChange={(e) => updateTranslation(loc, "linkDescription", e.target.value)}
                        placeholder={`Menu link text in ${meta.label}...`}
                        className='w-full bg-transparent px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none'
                      />
                    </div>
                  );
                })}

              {/* Hide translations toggle */}
              <div className='pt-0.5 flex items-center justify-between'>
                <label className='inline-flex items-center gap-2 cursor-pointer text-xs text-slate-400 hover:text-slate-300 select-none'>
                  <input
                    type='checkbox'
                    checked={useSameLinkTitle}
                    onChange={(e) => setUseSameLinkTitle(e.target.checked)}
                    className='h-3.5 w-3.5 rounded border-slate-700 bg-slate-900 text-sky-500 focus:ring-sky-500 focus:ring-offset-slate-950'
                  />
                  <span>Use same title for all languages (Hide translations)</span>
                </label>

                {useSameLinkTitle && (
                  <span className='text-[11px] text-sky-400 bg-sky-500/10 border border-sky-500/20 rounded-md px-2 py-0.5'>
                    Fallback: SE used for all languages
                  </span>
                )}
              </div>
            </div>

            {/* 3. URL Slug */}
            <div className='space-y-1.5'>
              <label className='block text-xs font-medium text-slate-200'>URL Slug</label>
              <div
                className={`flex items-center rounded-xl border bg-slate-950/90 overflow-hidden transition ${
                  !slugValidation.isValid
                    ? "border-red-500 ring-1 ring-red-500/30"
                    : "border-slate-800 focus-within:border-sky-500"
                }`}>
                <span className='px-3 py-2.5 text-xs font-mono text-slate-400 bg-slate-900/70 border-r border-slate-800 shrink-0'>
                  /
                </span>
                <input
                  type='text'
                  value={isHomepage ? "" : slug}
                  readOnly={isHomepage}
                  onChange={(e) => {
                    if (!isHomepage) {
                      setSlug(cleanSlugInput(e.target.value, true));
                    }
                  }}
                  onBlur={() => {
                    if (!isHomepage) {
                      setSlug((prev) => cleanSlugInput(prev, false));
                    }
                  }}
                  placeholder={isHomepage ? "" : `${page.id}`}
                  className='w-full bg-transparent px-3.5 py-2.5 text-xs text-white font-mono placeholder-slate-500 focus:outline-none'
                />
              </div>
              {!slugValidation.isValid && slugValidation.error ? (
                <p className='text-[11px] font-medium text-red-400'>
                  {slugValidation.error}
                </p>
              ) : (
                <p className='text-[11px] text-slate-500'>
                  {isHomepage
                    ? "Startpage (#1001) is always served at the root path (/)."
                    : `The URL path for this page, eg: my-readable-link or my-readable/link (defaults to /${page.id}).`}
                </p>
              )}
            </div>

            {/* 4. Page Template (Styled Select Dropdown) */}
            <div className='space-y-1.5 relative'>
              <label className='block text-xs font-medium text-slate-200'>Page Template</label>

              <button
                type='button'
                onClick={() => setIsTemplateOpen((prev) => !prev)}
                className={`w-full flex items-center justify-between rounded-xl border px-3.5 py-2.5 text-xs text-white bg-slate-950/90 transition ${
                  isTemplateOpen ? "border-sky-500 ring-1 ring-sky-500/30" : "border-slate-800 hover:border-slate-700"
                }`}>
                <span className='flex items-center gap-2.5'>
                  <SelectedTemplateIcon className='w-4 h-4 text-slate-400' />
                  <span>{currentTemplateOption.label}</span>
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform ${isTemplateOpen ? "rotate-180" : ""}`}
                />
              </button>

              {isTemplateOpen && (
                <div className='mt-1 w-full rounded-xl border border-slate-800 bg-slate-900/95 shadow-xl overflow-hidden divide-y divide-slate-800/60'>
                  {TEMPLATE_OPTIONS.map((opt) => {
                    const Icon = opt.icon;
                    const isSelected = opt.value === templateName;
                    return (
                      <button
                        key={opt.value}
                        type='button'
                        onClick={() => {
                          setTemplateName(opt.value);
                          setIsTemplateOpen(false);
                        }}
                        className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-left transition ${
                          isSelected
                            ? "bg-sky-500/15 text-sky-300 font-medium"
                            : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                        }`}>
                        <Icon className='w-4 h-4 text-slate-400' />
                        <span>{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Informative connection banner for Booking Objects */}
              {(templateName === "booking-unit" || linkedBookingObject) && (
                <div
                  className={`mt-2 rounded-xl border p-3 text-xs transition ${
                    linkedBookingObject
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                      : "border-amber-500/30 bg-amber-500/10 text-amber-300"
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    {linkedBookingObject ? (
                      <Box className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">
                          {linkedBookingObject
                            ? `Connected Booking Object: ${linkedBookingObject.name}`
                            : "No Booking Object connected yet"}
                        </span>
                        {linkedBookingObject && (
                          <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold uppercase text-emerald-300">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] opacity-90">
                        {linkedBookingObject
                          ? `${formatBookingObjectType(linkedBookingObject.type)} · ${linkedBookingObject.size_sqm ? `${linkedBookingObject.size_sqm} m² · ` : ""}${linkedBookingObject.bed_count} beds · Landlord: ${linkedBookingObject.landlord ? `${linkedBookingObject.landlord.first_name} ${linkedBookingObject.landlord.last_name}` : "None"}`
                          : "This page uses the 'Booking unit' template. To connect live rental calendar, capacity, and pricing data, select this page in Bookings -> Booking Objects under 'Page in CMS'."}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 5. Section Assignment */}
            <div className='space-y-1.5'>
              <label className='block text-xs font-medium text-slate-200'>Section</label>
              <div className='flex items-center rounded-xl border border-slate-800 bg-slate-950/90 overflow-hidden focus-within:border-sky-500 transition'>
                <span className='px-3 py-2.5 text-slate-400 bg-slate-900/70 border-r border-slate-800 shrink-0'>
                  <FolderTree className='w-4 h-4' />
                </span>
                <select
                  value={sectionId}
                  onChange={(e) => setSectionId(e.target.value)}
                  className='w-full bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:outline-none'>
                  <option value=''>No section (standalone page)</option>
                  {sections.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 6. Categories & Types Assignment (Right before dates at the bottom) */}
            {categoryTypes.length > 0 && (
              <div className='space-y-3 pt-1'>
                <div className='flex items-center gap-2'>
                  <Layers className='w-4 h-4 text-sky-400' />
                  <label className='block text-xs font-medium text-slate-200'>
                    Categories &amp; Types
                  </label>
                </div>

                <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                  {categoryTypes.map((ct) => {
                    const cats = ct.categories || [];
                    const isMulti = Boolean(ct.is_multiple);
                    const typeCatIds = new Set(cats.map((c) => c.id));
                    const selectedInThisType = selectedCategoryIds.filter((id) =>
                      typeCatIds.has(id)
                    );

                    const handleSelectSingle = (catId: string | null) => {
                      setSelectedCategoryIds((prev) => {
                        const withoutThisType = prev.filter(
                          (id) => !typeCatIds.has(id)
                        );
                        return catId
                          ? [...withoutThisType, catId]
                          : withoutThisType;
                      });
                    };

                    const handleToggleMulti = (catId: string) => {
                      setSelectedCategoryIds((prev) =>
                        prev.includes(catId)
                          ? prev.filter((id) => id !== catId)
                          : [...prev, catId]
                      );
                    };

                    return (
                      <div
                        key={ct.id}
                        className='rounded-xl border border-slate-800/90 bg-slate-950/70 p-3.5 space-y-2.5'
                      >
                        <div className='flex items-center justify-between gap-2 border-b border-slate-800/70 pb-2'>
                          <span className='text-xs font-semibold text-slate-200'>
                            {ct.name}
                          </span>
                          <span className='inline-flex items-center gap-1 text-[10px] font-medium text-slate-400 bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5'>
                            {isMulti ? (
                              <>
                                <CheckSquare className='w-2.5 h-2.5 text-sky-400' />
                                <span>Multi</span>
                              </>
                            ) : (
                              <>
                                <CircleDot className='w-2.5 h-2.5 text-sky-400' />
                                <span>Single</span>
                              </>
                            )}
                          </span>
                        </div>

                        {cats.length === 0 ? (
                          <div className='text-[11px] text-slate-500 italic'>
                            No categories in this group.
                          </div>
                        ) : isMulti ? (
                          <div className='space-y-1.5'>
                            {cats.map((cat) => {
                              const checked = selectedCategoryIds.includes(
                                cat.id
                              );
                              return (
                                <label
                                  key={cat.id}
                                  className={`flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs cursor-pointer transition select-none ${
                                    checked
                                      ? "bg-sky-500/15 text-sky-300 border border-sky-500/30 font-medium"
                                      : "text-slate-300 hover:bg-slate-900 border border-transparent"
                                  }`}
                                >
                                  <input
                                    type='checkbox'
                                    checked={checked}
                                    onChange={() => handleToggleMulti(cat.id)}
                                    className='h-3.5 w-3.5 rounded border-slate-700 bg-slate-900 text-sky-500 focus:ring-sky-500 focus:ring-offset-slate-950'
                                  />
                                  <span>{cat.name}</span>
                                </label>
                              );
                            })}
                          </div>
                        ) : (
                          <div className='space-y-1.5'>
                            <label
                              className={`flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs cursor-pointer transition select-none ${
                                selectedInThisType.length === 0
                                  ? "bg-slate-900 text-slate-300 border border-slate-800 font-medium"
                                  : "text-slate-500 hover:bg-slate-900/60 border border-transparent"
                              }`}
                            >
                              <input
                                type='radio'
                                name={`cat-type-${ct.id}`}
                                checked={selectedInThisType.length === 0}
                                onChange={() => handleSelectSingle(null)}
                                className='h-3.5 w-3.5 border-slate-700 bg-slate-900 text-sky-500 focus:ring-sky-500 focus:ring-offset-slate-950'
                              />
                              <span>None</span>
                            </label>
                            {cats.map((cat) => {
                              const checked = selectedCategoryIds.includes(
                                cat.id
                              );
                              return (
                                <label
                                  key={cat.id}
                                  className={`flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs cursor-pointer transition select-none ${
                                    checked
                                      ? "bg-sky-500/15 text-sky-300 border border-sky-500/30 font-medium"
                                      : "text-slate-300 hover:bg-slate-900 border border-transparent"
                                  }`}
                                >
                                  <input
                                    type='radio'
                                    name={`cat-type-${ct.id}`}
                                    checked={checked}
                                    onChange={() => handleSelectSingle(cat.id)}
                                    className='h-3.5 w-3.5 border-slate-700 bg-slate-900 text-sky-500 focus:ring-sky-500 focus:ring-offset-slate-950'
                                  />
                                  <span>{cat.name}</span>
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 7. Published At (Scheduled Publication Start) */}
            <div className='space-y-1.5'>
              <div className='flex items-center gap-1.5'>
                <label className='block text-xs font-medium text-slate-200'>Published At</label>
                <button
                  type='button'
                  onClick={() => setActiveTooltip((prev) => (prev === "pubStart" ? null : "pubStart"))}
                  className='text-slate-400 hover:text-sky-400 transition'
                  title='Publishing schedule info'>
                  <Info className='w-3.5 h-3.5' />
                </button>
              </div>

              {activeTooltip === "pubStart" && (
                <div className='rounded-lg border border-sky-500/20 bg-sky-950/30 px-3 py-2 text-[11px] text-sky-200'>
                  Setting a future date schedules automatic publication when that date is reached. Leave empty to
                  publish immediately when status is PUBLISHED.
                </div>
              )}

              <div className='flex items-center rounded-xl border border-slate-800 bg-slate-950/90 overflow-hidden focus-within:border-sky-500 transition'>
                <span className='px-3 py-2.5 text-slate-400 bg-slate-900/70 border-r border-slate-800 shrink-0'>
                  <Calendar className='w-4 h-4' />
                </span>
                <input
                  type='date'
                  value={publicationStart}
                  onChange={(e) => setPublicationStart(e.target.value)}
                  className='w-full bg-transparent px-3.5 py-2.5 text-xs text-white focus:outline-none'
                />
              </div>
            </div>

            {/* 7. Unpublish Date */}
            <div className='space-y-1.5'>
              <div className='flex items-center gap-1.5'>
                <label className='block text-xs font-medium text-slate-200'>Unpublish Date</label>
                <button
                  type='button'
                  onClick={() => setActiveTooltip((prev) => (prev === "pubEnd" ? null : "pubEnd"))}
                  className='text-slate-400 hover:text-sky-400 transition'
                  title='Unpublish date info'>
                  <Info className='w-3.5 h-3.5' />
                </button>
              </div>

              {activeTooltip === "pubEnd" && (
                <div className='rounded-lg border border-sky-500/20 bg-sky-950/30 px-3 py-2 text-[11px] text-sky-200'>
                  When an unpublish date is reached, the page automatically change to{" "}
                  <span className='text-red-400 font-semibold'>ARCHIVED</span> status and is hidden from public
                  navigation. Leave empty for Never.
                </div>
              )}

              <div className='flex items-center gap-2'>
                <div className='flex-1 flex items-center rounded-xl border border-slate-800 bg-slate-950/90 overflow-hidden focus-within:border-sky-500 transition'>
                  <span className='px-3 py-2.5 text-slate-400 bg-slate-900/70 border-r border-slate-800 shrink-0'>
                    <Calendar className='w-4 h-4' />
                  </span>
                  <input
                    type='date'
                    value={publicationEnd}
                    onChange={(e) => setPublicationEnd(e.target.value)}
                    placeholder='Never'
                    className='w-full bg-transparent px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none'
                  />
                </div>
                <button
                  type='button'
                  onClick={() => setActiveTooltip((prev) => (prev === "pubEnd" ? null : "pubEnd"))}
                  className='p-2 text-slate-500 hover:text-slate-300 transition'
                  title='How unpublish dates work'>
                  <Info className='w-4 h-4' />
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Right Column: Document Status & Activity */}
        <div className='lg:col-span-1 space-y-3'>
          <h2 className='text-sm font-semibold text-slate-200'>Document Status & Activity</h2>

          <div className='rounded-2xl border border-slate-800/90 bg-slate-900/40 p-6 space-y-5'>
            {/* Status */}
            <div className='space-y-2'>
              <div className='text-xs font-medium text-slate-400'>Status</div>
              <div className='grid grid-cols-3 gap-1.5 bg-slate-950/90 border border-slate-800 rounded-xl p-1'>
                {(["NEW", "PUBLISHED", "ARCHIVED"] as const).map((st) => {
                  const active = status === st;
                  return (
                    <button
                      key={st}
                      type='button'
                      onClick={() => setStatus(st)}
                      className={`py-1.5 px-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition ${
                        active
                          ? st === "PUBLISHED"
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : st === "NEW"
                              ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                              : "bg-red-500/20 text-red-400 border border-red-500/30"
                          : "text-slate-500 hover:text-slate-300 border border-transparent"
                      }`}
                    >
                      {st}
                    </button>
                  );
                })}
              </div>
              <p className='text-[11px] text-slate-500'>
                {status === "PUBLISHED"
                  ? "Visible publicly to all visitors."
                  : "Visible only to administrators (hidden from public visitors)."}
              </p>
            </div>

            {/* Page Template */}
            <div className='space-y-1'>
              <div className='text-xs font-medium text-slate-400'>Page Template</div>
              <div className='text-xs text-slate-200 font-medium'>{currentTemplateOption.label}</div>
            </div>

            {/* Linked Booking Object */}
            <div className='space-y-1.5 pt-1 border-t border-slate-800/80'>
              <div className='text-xs font-medium text-slate-400 flex items-center gap-1.5'>
                <Box className='w-3.5 h-3.5 text-sky-400' />
                <span>Connected Booking Object</span>
              </div>
              {linkedBookingObject ? (
                <div className='rounded-xl border border-slate-800 bg-slate-950/80 p-2.5 space-y-1 text-xs'>
                  <div className='font-semibold text-white flex items-center justify-between'>
                    <span>{linkedBookingObject.name}</span>
                    <span className='text-[10px] text-emerald-400 font-medium bg-emerald-500/10 px-1.5 py-0.2 rounded'>
                      Active
                    </span>
                  </div>
                  <div className='text-[11px] text-slate-400'>
                    {formatBookingObjectType(linkedBookingObject.type)}
                    {linkedBookingObject.size_sqm ? ` · ${linkedBookingObject.size_sqm} m²` : ""}
                    {` · ${linkedBookingObject.bed_count} beds`}
                  </div>
                  {linkedBookingObject.landlord && (
                    <div className='text-[10px] text-slate-400 flex items-center gap-1 pt-0.5'>
                      <UserCheck className='w-3 h-3 text-sky-400' />
                      <span>{linkedBookingObject.landlord.first_name} {linkedBookingObject.landlord.last_name}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className='rounded-xl border border-slate-800/80 bg-slate-950/40 p-2.5 text-[11px] text-slate-500'>
                  {templateName === "booking-unit" ? (
                    <span className='text-amber-400/90 font-medium'>
                      No object connected. Connect this page under Bookings → Booking Objects.
                    </span>
                  ) : (
                    <span>Not connected (optional for this template)</span>
                  )}
                </div>
              )}
            </div>

            {/* Public Link */}
            <div className='space-y-1'>
              <div className='text-xs font-medium text-slate-400'>Public Link</div>
              <a
                href={publicUrlPath}
                target='_blank'
                rel='noreferrer'
                className='inline-flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300 underline underline-offset-4 break-all'>
                <ExternalLink className='w-3.5 h-3.5 shrink-0' />
                <span>
                  {typeof window !== "undefined"
                    ? `${window.location.origin}${publicUrlPath}`
                    : `http://localhost:3000${publicUrlPath}`}
                </span>
              </a>
            </div>

            {/* Last Saved */}
            <div className='space-y-1'>
              <div className='text-xs font-medium text-slate-400'>Last Saved</div>
              <div className='text-xs text-slate-300'>{lastSavedText}</div>
            </div>

            {/* Original Author */}
            <div className='space-y-1'>
              <div className='text-xs font-medium text-slate-400'>Original Author</div>
              <div className='text-xs text-slate-300'>Super Admin (SU) on {createdDateFormatted}</div>
            </div>

            {/* Revisions */}
            <div className='space-y-1'>
              <div className='text-xs font-medium text-slate-400'>Revisions</div>
              <div className='text-xs text-slate-300'>4 versions</div>
            </div>

            {/* Activity timestamps */}
            <div className='border-t border-slate-800/80 pt-4 space-y-1 text-[11px] text-slate-500'>
              <div>Published on {createdDateFormatted} by SU</div>
              <div>Metadata updated {todayFormatted} by SU</div>
            </div>

            {/* Save Button */}
            <div className='pt-2'>
              <button
                type='button'
                onClick={() => handleSave()}
                disabled={isSaving || !slugValidation.isValid}
                className='w-full flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-sky-600/20 hover:bg-sky-500 transition disabled:opacity-50'>
                {isSaving ? (
                  <Loader2 className='w-4 h-4 animate-spin' />
                ) : saveSuccess ? (
                  <Check className='w-4 h-4 text-emerald-300' />
                ) : (
                  <Save className='w-4 h-4' />
                )}
                <span>{saveSuccess ? "Changes Saved" : "Save Changes"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function svLinkDescOrTitle(val: string): string {
  return val;
}
