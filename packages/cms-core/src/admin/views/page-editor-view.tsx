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
  FolderTree,
} from "lucide-react";
import { CMSPageField } from "../../components/fields/types";
import { FlagIcon } from "../../components/ui/flag-icon";

export interface PageEditorData {
  id: number | string;
  template_name: string;
  section_id?: string | null;
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
  sections?: Array<{ id: string; name: string }>;
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
    value: "Booking unit",
    label: "Booking unit",
    icon: LayoutTemplate,
  },
  {
    value: "Article",
    label: "Article",
    icon: FileText,
  },
  {
    value: "Entire page",
    label: "Entire page",
    icon: Maximize2,
  },
  {
    value: "Default",
    label: "Default",
    icon: CircleDot,
  },
];

function normalizeTemplateValue(raw: string, isHomepage?: boolean): string {
  if (isHomepage || raw === "startpage" || raw === "Startpage") return "startpage";
  if (raw === "booking" || raw === "Booking unit") return "Booking unit";
  if (raw === "article" || raw === "Article") return "Article";
  if (raw === "landing" || raw === "Entire page") return "Entire page";
  return "Default";
}

function formatDateInput(val?: string | Date | null): string {
  if (!val) return "";
  const d = typeof val === "string" ? new Date(val) : val;
  if (isNaN(d.getTime())) return "";
  return d.toISOString().split("T")[0];
}

export function PageEditorView({
  page,
  sections = [],
  activeLanguages,
  activeLocales = ["sv", "en", "de"],
  onBack,
  onSave,
}: PageEditorViewProps) {
  const effectiveLocales = activeLanguages || activeLocales;
  const secondaryLocales = effectiveLocales.filter((loc) => loc !== "sv");

  const isHomepage = Number(page.id) === 1001;
  const [status, setStatus] = useState<"NEW" | "PUBLISHED" | "ARCHIVED">(page.status);
  const [templateName, setTemplateName] = useState<string>(
    normalizeTemplateValue(page.template_name, isHomepage)
  );
  const [isTemplateOpen, setIsTemplateOpen] = useState(false);
  const [sectionId, setSectionId] = useState<string>(page.section_id || "");
  const [slug, setSlug] = useState<string>(
    isHomepage || page.slug === "/" ? "" : page.slug.replace(/^\/+/, "")
  );

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
        pageTitle: svTitle,
        linkDescription: svLinkTitle,
        metaTitle: svMetaTitle,
        metaDescription: svMetaDesc,
        slug: isHomepage
          ? "/"
          : slug.replace(/^\/+/, "").trim() || String(page.id),
        status,
        publicationStart: publicationStart ? new Date(publicationStart).toISOString() : null,
        publicationEnd: publicationEnd ? new Date(publicationEnd).toISOString() : null,
        translations: translationPayload,
      });

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

  const publicUrlPath = slug === "/" || slug === "" ? "/" : `/${slug.replace(/^\/+/, "")}`;

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

          <button
            type='button'
            onClick={() =>
              setStatus((prev) => (prev === "PUBLISHED" ? "NEW" : prev === "NEW" ? "ARCHIVED" : "PUBLISHED"))
            }
            title='Click to cycle page status'
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider transition ${
              status === "PUBLISHED"
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                : status === "NEW"
                  ? "border-sky-500/30 bg-sky-500/10 text-sky-400"
                  : "border-slate-700 bg-slate-800/80 text-slate-400"
            }`}>
            <span
              className={`w-2 h-2 rounded-full ${
                status === "PUBLISHED" ? "bg-emerald-400" : status === "NEW" ? "bg-sky-400" : "bg-slate-400"
              }`}
            />
            <span>{status}</span>
          </button>
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
              <div className='flex items-center rounded-xl border border-slate-800 bg-slate-950/90 overflow-hidden focus-within:border-sky-500 transition'>
                <span className='px-3 py-2.5 text-xs font-mono text-slate-400 bg-slate-900/70 border-r border-slate-800 shrink-0'>
                  /
                </span>
                <input
                  type='text'
                  value={isHomepage ? "" : slug}
                  readOnly={isHomepage}
                  onChange={(e) => {
                    if (!isHomepage) {
                      setSlug(e.target.value.replace(/^\/+/, ""));
                    }
                  }}
                  placeholder={isHomepage ? "" : `${page.id}`}
                  className='w-full bg-transparent px-3.5 py-2.5 text-xs text-white font-mono placeholder-slate-500 focus:outline-none'
                />
              </div>
              <p className='text-[11px] text-slate-500'>
                {isHomepage
                  ? "Startpage (#1001) is always served at the root path (/)."
                  : `The URL path for this page, eg: my-readable-link or my-readable/link (defaults to /${page.id}).`}
              </p>
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

            {/* 6. Published At (Scheduled Publication Start) */}
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
                  When an unpublish date is reached, the page automatically reverts to draft/archived status and is
                  hidden from public navigation. Leave empty for Never.
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
            <div className='space-y-1.5'>
              <div className='text-xs font-medium text-slate-400'>Status</div>
              <div>
                <span
                  className={`inline-flex items-center rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                    status === "PUBLISHED"
                      ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                      : status === "NEW"
                        ? "bg-sky-500/15 text-sky-400 border border-sky-500/30"
                        : "bg-slate-800 text-slate-400 border border-slate-700"
                  }`}>
                  {status}
                </span>
              </div>
            </div>

            {/* Page Template */}
            <div className='space-y-1'>
              <div className='text-xs font-medium text-slate-400'>Page Template</div>
              <div className='text-xs text-slate-200 font-medium'>{currentTemplateOption.label}</div>
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
                disabled={isSaving}
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
