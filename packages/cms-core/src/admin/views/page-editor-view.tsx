"use client";

import React, { useState, useId } from "react";
import { useTranslations } from "next-intl";
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
  Globe,
} from "lucide-react";
import { CMSPageField } from "@cms/components/fields/types";
import {
  Badge,
  Button,
  Card,
  DatePicker,
  FlagIcon,
  FormField,
  Input,
  Label,
  NativeSelect,
  Textarea,
} from "@cms/components/ui";
import { CategoryTypeItem } from "./categories-view";
import {
  BookingObjectDetails,
  formatBookingObjectType,
} from "@cms/booking/types";
import {
  cleanSlugInput,
  validateSlugInput,
  isDefaultIdOrRootSlug,
} from "@cms/utils/slug";
import {
  CMSTemplateOption,
  DEFAULT_CMS_TEMPLATES,
  resolveTemplateOption,
} from "@cms/templates/types";
import {
  LANGUAGE_META,
  getLanguageMeta,
  AdminLanguage,
} from "@cms/constants/languages";
import { formatDateInput } from "@cms/constants/dates";
import { PageStatus } from "@cms/types/admin";

export type { PageStatus };

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
  status: PageStatus;
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
  availableTemplates?: CMSTemplateOption[];
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
  adminLanguage?: AdminLanguage;
  onBack: () => void;
  onSave: (data: any) => Promise<void>;
}

function getTemplateIcon(templateId: string) {
  switch (templateId.toLowerCase()) {
    case "startpage":
      return LayoutTemplate;
    case "booking-unit":
    case "booking":
      return Box;
    case "booking-overview":
      return Maximize2;
    case "contact":
      return CircleDot;
    case "article":
    default:
      return FileText;
  }
}

function CharacterCounter({ current, limit }: { current: number; limit: number }) {
  const isOver = current > limit;
  return (
    <span
      className={`text-[10px] font-mono ${
        isOver
          ? "text-amber-400 font-semibold"
          : current > limit * 0.85
          ? "text-sky-400"
          : "text-slate-500"
      }`}
    >
      {current} / {limit}
    </span>
  );
}

export function PageEditorView({
  page,
  availableTemplates = DEFAULT_CMS_TEMPLATES,
  existingPages = [],
  sections = [],
  categoryTypes = [],
  bookingObjects = [],
  activeLanguages,
  activeLocales = ["sv", "en", "de"],
  adminLanguage = "en",
  onBack,
  onSave,
}: PageEditorViewProps) {
  const t = useTranslations("pageEditor");
  const tCommon = useTranslations("common");

  const svTitleId = useId();
  const svLinkId = useId();
  const pubStartId = useId();
  const pubEndId = useId();
  const svMetaTitleId = useId();
  const svMetaDescId = useId();
  const templateLabelId = useId();
  const templateTriggerId = useId();
  const templateListboxId = useId();
  const statusLabelId = useId();

  const effectiveLocales = activeLanguages || activeLocales;
  const secondaryLocales = effectiveLocales.filter((loc) => loc !== "sv");

  const isHomepage = Number(page.id) === 1001;
  const initialResolved = resolveTemplateOption(page.template_name, availableTemplates);

  const linkedBookingObject = React.useMemo(() => {
    if (!bookingObjects || !page.id) return null;
    return (
      bookingObjects.find((o) => Number(o.page_id) === Number(page.id)) || null
    );
  }, [bookingObjects, page.id]);
  const [savedStatus, setSavedStatus] = useState<"NEW" | "PUBLISHED" | "ARCHIVED">(page.status || "NEW");
  const [status, setStatus] = useState<"NEW" | "PUBLISHED" | "ARCHIVED">(page.status || "NEW");
  const [templateName, setTemplateName] = useState<string>(
    isHomepage ? "startpage" : initialResolved.id
  );
  const [isTemplateOpen, setIsTemplateOpen] = useState(false);
  const templateTriggerRef = React.useRef<HTMLButtonElement | null>(null);
  const templateOptionsRefs = React.useRef<(HTMLButtonElement | null)[]>([]);
  const statusButtonRefs = React.useRef<(HTMLButtonElement | null)[]>([]);
  const selectableTemplates = React.useMemo(
    () => availableTemplates.filter((opt) => !opt.isProtected),
    [availableTemplates]
  );

  React.useEffect(() => {
    if (isTemplateOpen) {
      const selectedIdx = selectableTemplates.findIndex(
        (opt) => opt.id.toLowerCase() === templateName.toLowerCase()
      );
      const targetIdx = selectedIdx >= 0 ? selectedIdx : 0;
      setTimeout(() => {
        templateOptionsRefs.current[targetIdx]?.focus();
      }, 0);
    }
  }, [isTemplateOpen, selectableTemplates, templateName]);

  const statusOptions: Array<"NEW" | "PUBLISHED" | "ARCHIVED"> = ["NEW", "PUBLISHED", "ARCHIVED"];
  const handleStatusKeyDown = (
    e: React.KeyboardEvent,
    currentStatus: "NEW" | "PUBLISHED" | "ARCHIVED"
  ) => {
    const currentIndex = statusOptions.indexOf(currentStatus);
    let targetIndex = -1;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      targetIndex = (currentIndex + 1) % statusOptions.length;
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      targetIndex =
        (currentIndex - 1 + statusOptions.length) % statusOptions.length;
    } else if (e.key === "Home") {
      e.preventDefault();
      targetIndex = 0;
    } else if (e.key === "End") {
      e.preventDefault();
      targetIndex = statusOptions.length - 1;
    }
    if (targetIndex !== -1) {
      const next = statusOptions[targetIndex];
      setStatus(next);
      statusButtonRefs.current[targetIndex]?.focus();
    }
  };
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
  const [svLinkTitle, setSvLinkTitle] = useState(() => {
    if (page.link_description && page.link_description.trim() !== (page.page_title || "").trim()) {
      return page.link_description;
    }
    return "";
  });
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
      const existingTitle = existing?.page_title || "";
      const existingLink = existing?.link_description || "";
      const customLink =
        existingLink && existingLink.trim() !== existingTitle.trim()
          ? existingLink
          : "";
      map[loc] = {
        pageTitle: existingTitle,
        linkDescription: customLink,
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
  const [lastSavedText, setLastSavedText] = useState(() =>
    t("minutesAgoBy", { author: "Super Admin (SU)" })
  );

  const getTemplateLabel = (optId: string, fallbackLabel: string) => {
    switch (optId.toLowerCase()) {
      case "startpage":
        return t("templateStartpage");
      case "booking-unit":
      case "booking":
        return t("templateBookingUnit");
      case "booking-overview":
        return t("templateBookingOverview");
      case "article":
        return t("templateArticle");
      case "contact":
        return t("templateContact");
      default:
        return fallbackLabel;
    }
  };

  const getStatusLabel = (st: "NEW" | "PUBLISHED" | "ARCHIVED") => {
    if (st === "PUBLISHED") return t("published");
    if (st === "NEW") return t("new");
    return t("archived");
  };

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
        const effPageTitle = useSamePageTitle ? svTitle : current.pageTitle || svTitle;
        const rawLink = useSameLinkTitle ? svLinkTitle : current.linkDescription;
        const effLink = rawLink && rawLink.trim() ? rawLink.trim() : null;

        return {
          locale: loc,
          pageTitle: effPageTitle,
          linkDescription: effLink,
          metaTitle: current.metaTitle ? current.metaTitle : null,
          metaDescription: current.metaDescription ? current.metaDescription : null,
        };
      });

      await onSave({
        id: page.id,
        templateName: isHomepage ? "startpage" : templateName,
        sectionId: sectionId || null,
        categoryIds: selectedCategoryIds,
        pageTitle: svTitle,
        linkDescription: svLinkTitle.trim() || null,
        metaTitle: svMetaTitle ? svMetaTitle : null,
        metaDescription: svMetaDesc ? svMetaDesc : null,
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
      setLastSavedText(t("justNowBy", { author: "Super Admin (SU)" }));
      setTimeout(() => setSaveSuccess(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const currentTemplateOption = resolveTemplateOption(templateName, availableTemplates);
  const SelectedTemplateIcon = getTemplateIcon(currentTemplateOption.id);

  const createdDateFormatted = page.created_date
    ? new Date(page.created_date).toISOString().split("T")[0]
    : "2026-10-15";
  const todayFormatted = new Date().toISOString().split("T")[0];

  const cleanActiveSlug = cleanSlugInput(slug, false);
  const publicUrlPath = isHomepage
    ? "/"
    : `/${cleanActiveSlug || page.id}`;
  const systemUrlPath = isHomepage ? "/" : `/${page.id}`;

  return (
    <div className='space-y-6 max-w-6xl'>
      {/* Top Bar */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
        <h1 className='text-2xl font-bold tracking-tight text-white'>
          {t("editPageTitle", { title: translations.en?.pageTitle || svTitle || "Untitled" })}
        </h1>

        <div className='flex items-center gap-2.5'>
          <Button
            type='button'
            variant='outline'
            size='sm'
            onClick={onBack}
            className='h-8 text-xs font-medium gap-1.5'
          >
            <ArrowLeft className='w-3.5 h-3.5' />
            <span>{tCommon("back")}</span>
          </Button>

          <Badge
            title='Current saved status'
            className={`uppercase tracking-wider select-none text-[11px] font-semibold px-2.5 py-1 ${
              savedStatus === "PUBLISHED"
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                : savedStatus === "NEW"
                  ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
                  : "border-red-500/30 bg-red-500/10 text-red-400"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full mr-1.5 ${
                savedStatus === "PUBLISHED" ? "bg-emerald-400" : savedStatus === "NEW" ? "bg-amber-400" : "bg-red-400"
              }`}
            />
            <span>{getStatusLabel(savedStatus)}</span>
          </Badge>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 items-start'>
        {/* Left Column: Document Info & Metadata */}
        <div className='lg:col-span-2 space-y-3'>
          <h2 className='text-sm font-semibold text-slate-200'>{t("docInfoTitle")}</h2>

          <Card variant="admin" className='p-6'>
            <form onSubmit={handleSave} className='space-y-6'>
            {/* 1. Page Title (Multi-language stacked) */}
            <div className='space-y-2.5'>
              <Label htmlFor={svTitleId} className='block text-xs font-medium text-slate-200'>
                {t("pageTitle")}
              </Label>

              {/* Primary Language (SE) */}
              <div className='flex items-center rounded-xl border border-slate-800 bg-slate-950/90 overflow-hidden focus-within:border-sky-500 transition'>
                <span className='flex items-center gap-2 px-3 py-2.5 text-xs font-medium text-slate-400 bg-slate-900/70 border-r border-slate-800 shrink-0 w-20'>
                  <FlagIcon code='sv' size='sm' />
                  <span className='font-mono text-[11px]'>{LANGUAGE_META.sv.code}</span>
                </span>
                <Input
                  id={svTitleId}
                  type='text'
                  required
                  value={svTitle}
                  onChange={(e) => setSvTitle(e.target.value)}
                  placeholder={t("svTitlePlaceholder")}
                  className='h-auto border-0 bg-transparent px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus-visible:ring-0 focus-visible:ring-offset-0'
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
                      <Input
                        type='text'
                        value={translations[loc]?.pageTitle || ""}
                        onChange={(e) => updateTranslation(loc, "pageTitle", e.target.value)}
                        placeholder={t("translationsTitlePlaceholder", { language: meta.label })}
                        className='h-auto border-0 bg-transparent px-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus-visible:ring-0 focus-visible:ring-offset-0'
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
                  <span>{t("useSameTitle")}</span>
                </label>

                {useSamePageTitle && (
                  <Badge variant='outline' className='text-[11px] text-sky-400 bg-sky-500/10 border-sky-500/20 font-normal py-0.5 px-2'>
                    {t("sameTitleFallback")}
                  </Badge>
                )}
              </div>
            </div>

            {/* 2. Link text (if other) */}
            <div className='space-y-2.5'>
              <Label htmlFor={svLinkId} className='block text-xs font-medium text-slate-200'>
                {t("linkText")}
              </Label>

              {/* Primary Language (SE) */}
              <div className='flex items-center rounded-xl border border-slate-800 bg-slate-950/90 overflow-hidden focus-within:border-sky-500 transition'>
                <span className='flex items-center gap-2 px-3 py-2.5 text-xs font-medium text-slate-400 bg-slate-900/70 border-r border-slate-800 shrink-0 w-20'>
                  <FlagIcon code='sv' size='sm' />
                  <span className='font-mono text-[11px]'>{LANGUAGE_META.sv.code}</span>
                </span>
                <Input
                  id={svLinkId}
                  type='text'
                  value={svLinkTitle}
                  onChange={(e) => setSvLinkTitle(e.target.value)}
                  placeholder={svTitle.trim() || t("svLinkPlaceholder")}
                  className='h-auto border-0 bg-transparent px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus-visible:ring-0 focus-visible:ring-offset-0'
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
                  const locPageTitle =
                    translations[loc]?.pageTitle?.trim() ||
                    (useSamePageTitle ? svTitle.trim() : "");
                  const locPlaceholder = locPageTitle || t("translationsLinkPlaceholder", { language: meta.label });

                  return (
                    <div
                      key={loc}
                      className='flex items-center rounded-xl border border-slate-800/80 bg-slate-950/60 overflow-hidden focus-within:border-sky-500 transition'>
                      <span className='flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-400 bg-slate-900/50 border-r border-slate-800/80 shrink-0 w-20'>
                        <FlagIcon code={loc} size='sm' />
                        <span className='font-mono text-[11px]'>{meta.code}</span>
                      </span>
                      <Input
                        type='text'
                        value={translations[loc]?.linkDescription || ""}
                        onChange={(e) => updateTranslation(loc, "linkDescription", e.target.value)}
                        placeholder={locPlaceholder}
                        className='h-auto border-0 bg-transparent px-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus-visible:ring-0 focus-visible:ring-offset-0'
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
                  <span>{t("useSameLinkText")}</span>
                </label>

                {useSameLinkTitle && (
                  <Badge variant='outline' className='text-[11px] text-sky-400 bg-sky-500/10 border-sky-500/20 font-normal py-0.5 px-2'>
                    {t("sameLinkFallback")}
                  </Badge>
                )}
              </div>
            </div>

            {/* 3. URL Slug */}
            <FormField
              label={t("urlSlug")}
              labelClassName='font-medium text-slate-200'
              description={
                isHomepage
                  ? t("startpageSlugHelp")
                  : t("slugHelp", { id: String(page.id) })
              }
              error={!slugValidation.isValid ? slugValidation.error : undefined}>
              {(control) => (
                <div
                  className={`flex items-center rounded-xl border bg-slate-950/90 overflow-hidden transition ${
                    !slugValidation.isValid
                      ? "border-red-500 ring-1 ring-red-500/30"
                      : "border-slate-800 focus-within:border-sky-500"
                  }`}>
                  <span className='px-3 py-2.5 text-xs font-mono text-slate-400 bg-slate-900/70 border-r border-slate-800 shrink-0'>
                    /
                  </span>
                  <Input
                    {...control}
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
                    className='h-auto border-0 bg-transparent px-3.5 py-2.5 text-xs text-white font-mono placeholder:text-slate-500 focus-visible:ring-0 focus-visible:ring-offset-0'
                  />
                </div>
              )}
            </FormField>

            {/* 3b. SEO & Social Sharing */}
            <div className='space-y-4 pt-2 border-t border-slate-800/70'>
              <div className='flex items-center gap-2'>
                <Globe className='w-4 h-4 text-sky-400' />
                <h3 className='text-xs font-semibold text-slate-200'>
                  {t("seoSettings")}
                </h3>
              </div>

              {/* Meta-titel */}
              <div className='space-y-2.5'>
                <div className='flex items-center justify-between'>
                  <Label htmlFor={svMetaTitleId} className='block text-xs font-medium text-slate-300'>
                    {adminLanguage === "sv" ? "Meta-titel" : "Meta Title"}
                  </Label>
                  <CharacterCounter current={svMetaTitle.length} limit={60} />
                </div>

                {/* Primary Swedish Meta Title */}
                <div className='flex items-center rounded-xl border border-slate-800 bg-slate-950/90 overflow-hidden focus-within:border-sky-500 transition'>
                  <span className='flex items-center gap-2 px-3 py-2.5 text-xs font-medium text-slate-400 bg-slate-900/70 border-r border-slate-800 shrink-0 w-20'>
                    <FlagIcon code='sv' size='sm' />
                    <span className='font-mono text-[11px]'>{LANGUAGE_META.sv.code}</span>
                  </span>
                  <Input
                    id={svMetaTitleId}
                    type='text'
                    value={svMetaTitle}
                    aria-label={`${adminLanguage === "sv" ? "Meta-titel" : "Meta Title"} – ${LANGUAGE_META.sv.label}`}
                    onChange={(e) => setSvMetaTitle(e.target.value)}
                    placeholder={
                      adminLanguage === "sv"
                        ? "Titel för sökmotorer och delning på svenska..."
                        : "Search engine title in Swedish..."
                    }
                    className='h-auto border-0 bg-transparent px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus-visible:ring-0 focus-visible:ring-offset-0'
                  />
                </div>

                {/* Secondary Active Languages Meta Title */}
                {secondaryLocales.map((loc) => {
                  const meta = LANGUAGE_META[loc] || {
                    code: loc.toUpperCase(),
                    flag: "",
                    label: loc,
                  };
                  const val = translations[loc]?.metaTitle || "";
                  return (
                    <div key={loc} className='space-y-1'>
                      <div className='flex items-center justify-end pr-1'>
                        <CharacterCounter current={val.length} limit={60} />
                      </div>
                      <div className='flex items-center rounded-xl border border-slate-800/80 bg-slate-950/60 overflow-hidden focus-within:border-sky-500 transition'>
                        <span className='flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-400 bg-slate-900/50 border-r border-slate-800/80 shrink-0 w-20'>
                          <FlagIcon code={loc} size='sm' />
                          <span className='font-mono text-[11px]'>{meta.code}</span>
                        </span>
                        <Input
                          type='text'
                          value={val}
                          aria-label={`${adminLanguage === "sv" ? "Meta-titel" : "Meta Title"} – ${meta.label}`}
                          onChange={(e) => updateTranslation(loc, "metaTitle", e.target.value)}
                          placeholder={
                            adminLanguage === "sv"
                              ? `Titel för sökmotorer på ${meta.label}...`
                              : `Search engine title in ${meta.label}...`
                          }
                          className='h-auto border-0 bg-transparent px-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus-visible:ring-0 focus-visible:ring-offset-0'
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Meta-beskrivning */}
              <div className='space-y-2.5 pt-2'>
                <div className='flex items-center justify-between'>
                  <Label htmlFor={svMetaDescId} className='block text-xs font-medium text-slate-300'>
                    {adminLanguage === "sv" ? "Meta-beskrivning" : "Meta Description"}
                  </Label>
                  <CharacterCounter current={svMetaDesc.length} limit={160} />
                </div>

                {/* Primary Swedish Meta Description */}
                <div className='flex items-start rounded-xl border border-slate-800 bg-slate-950/90 overflow-hidden focus-within:border-sky-500 transition'>
                  <span className='flex items-center gap-2 px-3 py-2.5 text-xs font-medium text-slate-400 bg-slate-900/70 border-r border-slate-800 shrink-0 w-20 self-stretch'>
                    <FlagIcon code='sv' size='sm' />
                    <span className='font-mono text-[11px]'>{LANGUAGE_META.sv.code}</span>
                  </span>
                  <Textarea
                    id={svMetaDescId}
                    rows={2}
                    value={svMetaDesc}
                    aria-label={`${adminLanguage === "sv" ? "Meta-beskrivning" : "Meta Description"} – ${LANGUAGE_META.sv.label}`}
                    onChange={(e) => setSvMetaDesc(e.target.value)}
                    placeholder={
                      adminLanguage === "sv"
                        ? "Kort sammanfattning för sökmotorer och delning på svenska..."
                        : "Short summary for search engines and social sharing in Swedish..."
                    }
                    className='min-h-[56px] border-0 bg-transparent px-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus-visible:ring-0 focus-visible:ring-offset-0 resize-y'
                  />
                </div>

                {/* Secondary Active Languages Meta Description */}
                {secondaryLocales.map((loc) => {
                  const meta = LANGUAGE_META[loc] || {
                    code: loc.toUpperCase(),
                    flag: "",
                    label: loc,
                  };
                  const val = translations[loc]?.metaDescription || "";
                  return (
                    <div key={loc} className='space-y-1'>
                      <div className='flex items-center justify-end pr-1'>
                        <CharacterCounter current={val.length} limit={160} />
                      </div>
                      <div className='flex items-start rounded-xl border border-slate-800/80 bg-slate-950/60 overflow-hidden focus-within:border-sky-500 transition'>
                        <span className='flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-400 bg-slate-900/50 border-r border-slate-800/80 shrink-0 w-20 self-stretch'>
                          <FlagIcon code={loc} size='sm' />
                          <span className='font-mono text-[11px]'>{meta.code}</span>
                        </span>
                        <Textarea
                          rows={2}
                          value={val}
                          aria-label={`${adminLanguage === "sv" ? "Meta-beskrivning" : "Meta Description"} – ${meta.label}`}
                          onChange={(e) => updateTranslation(loc, "metaDescription", e.target.value)}
                          placeholder={
                            adminLanguage === "sv"
                              ? `Sammanfattning på ${meta.label}...`
                              : `Summary in ${meta.label}...`
                          }
                          className='min-h-[52px] border-0 bg-transparent px-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus-visible:ring-0 focus-visible:ring-offset-0 resize-y'
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 4. Page Template (Styled Select Dropdown) */}
            <div className='space-y-1.5 relative'>
              <Label id={templateLabelId} className='block text-xs font-medium text-slate-200'>{t("pageTemplate")}</Label>

              <button
                ref={templateTriggerRef}
                id={templateTriggerId}
                type='button'
                disabled={isHomepage}
                aria-haspopup="listbox"
                aria-expanded={isTemplateOpen}
                aria-controls={templateListboxId}
                aria-labelledby={templateLabelId}
                onClick={() => !isHomepage && setIsTemplateOpen((prev) => !prev)}
                onKeyDown={(e) => {
                  if (isHomepage) return;
                  if (
                    e.key === "ArrowDown" ||
                    e.key === "ArrowUp" ||
                    e.key === "Enter" ||
                    e.key === " "
                  ) {
                    e.preventDefault();
                    setIsTemplateOpen(true);
                  } else if (e.key === "Escape") {
                    setIsTemplateOpen(false);
                  }
                }}
                className={`w-full flex items-center justify-between rounded-xl border px-3.5 py-2.5 text-xs text-white bg-slate-950/90 transition ${
                  isHomepage
                    ? "opacity-60 cursor-not-allowed border-slate-800"
                    : isTemplateOpen
                    ? "border-sky-500 ring-1 ring-sky-500/30"
                    : "border-slate-800 hover:border-slate-700"
                }`}>
                <span className='flex items-center gap-2.5'>
                  <SelectedTemplateIcon className='w-4 h-4 text-slate-400' />
                  <span>{getTemplateLabel(currentTemplateOption.id, currentTemplateOption.label)}</span>
                </span>
                {!isHomepage && (
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform ${isTemplateOpen ? "rotate-180" : ""}`}
                  />
                )}
              </button>

              {isTemplateOpen && !isHomepage && (
                <div
                  id={templateListboxId}
                  role="listbox"
                  aria-labelledby={templateTriggerId}
                  className='mt-1 w-full rounded-xl border border-slate-800 bg-slate-900/95 shadow-xl overflow-hidden divide-y divide-slate-800/60'
                >
                  {selectableTemplates.map((opt, idx) => {
                    const Icon = getTemplateIcon(opt.id);
                    const isSelected = opt.id.toLowerCase() === templateName.toLowerCase();
                    return (
                      <button
                        key={opt.id}
                        ref={(el) => {
                          templateOptionsRefs.current[idx] = el;
                        }}
                        type='button'
                        role='option'
                        aria-selected={isSelected}
                        tabIndex={isSelected ? 0 : -1}
                        onClick={() => {
                          setTemplateName(opt.id);
                          setIsTemplateOpen(false);
                          templateTriggerRef.current?.focus();
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "ArrowDown") {
                            e.preventDefault();
                            const nextIdx = (idx + 1) % selectableTemplates.length;
                            templateOptionsRefs.current[nextIdx]?.focus();
                          } else if (e.key === "ArrowUp") {
                            e.preventDefault();
                            const prevIdx =
                              (idx - 1 + selectableTemplates.length) %
                              selectableTemplates.length;
                            templateOptionsRefs.current[prevIdx]?.focus();
                          } else if (e.key === "Home") {
                            e.preventDefault();
                            templateOptionsRefs.current[0]?.focus();
                          } else if (e.key === "End") {
                            e.preventDefault();
                            templateOptionsRefs.current[
                              selectableTemplates.length - 1
                            ]?.focus();
                          } else if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setTemplateName(opt.id);
                            setIsTemplateOpen(false);
                            templateTriggerRef.current?.focus();
                          } else if (e.key === "Escape") {
                            e.preventDefault();
                            setIsTemplateOpen(false);
                            templateTriggerRef.current?.focus();
                          } else if (e.key === "Tab") {
                            setIsTemplateOpen(false);
                          }
                        }}
                        className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-left transition ${
                          isSelected
                            ? "bg-sky-500/15 text-sky-300 font-medium"
                            : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                        }`}>
                        <Icon className='w-4 h-4 text-slate-400 shrink-0' />
                        <div className='flex flex-col'>
                          <span className='font-medium'>{getTemplateLabel(opt.id, opt.label)}</span>
                          {opt.description && (
                            <span className='text-[10px] text-slate-400'>{opt.description}</span>
                          )}
                        </div>
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
                            ? t("connectedBookingObjectPrefix", { name: linkedBookingObject.name })
                            : t("noBookingObjectConnected")}
                        </span>
                        {linkedBookingObject && (
                          <Badge variant="outline" className="bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold uppercase text-emerald-300 border-emerald-500/30">
                            {tCommon("active")}
                          </Badge>
                        )}
                      </div>
                      <p className="text-[11px] opacity-90">
                        {linkedBookingObject
                          ? `${formatBookingObjectType(linkedBookingObject.type)} · ${linkedBookingObject.size_sqm ? `${linkedBookingObject.size_sqm} m² · ` : ""}${linkedBookingObject.bed_count} ${t("beds")} · ${t("landlord")}: ${linkedBookingObject.landlord ? `${linkedBookingObject.landlord.first_name} ${linkedBookingObject.landlord.last_name}` : tCommon("none")}`
                          : t("bookingUnitHelp")}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 5. Section Assignment */}
            <FormField label={t("section")} labelClassName='font-medium text-slate-200'>
              {(control) => (
                <div className='flex items-center rounded-xl border border-slate-800 bg-slate-950/90 overflow-hidden focus-within:border-sky-500 transition'>
                  <span className='px-3 py-2.5 text-slate-400 bg-slate-900/70 border-r border-slate-800 shrink-0'>
                    <FolderTree className='w-4 h-4' />
                  </span>
                  <NativeSelect
                    {...control}
                    value={sectionId}
                    onChange={(e) => setSectionId(e.target.value)}
                    className='h-auto border-0 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus-visible:ring-0 focus-visible:ring-offset-0'
                  >
                    <option value=''>{t("noSection")}</option>
                    {sections.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </NativeSelect>
                </div>
              )}
            </FormField>

            {/* 6. Categories & Types Assignment (Right before dates at the bottom) */}
            {categoryTypes.length > 0 && (
              <div className='space-y-3 pt-1'>
                <div className='flex items-center gap-2'>
                  <Layers className='w-4 h-4 text-sky-400' />
                  <Label className='block text-xs font-medium text-slate-200'>
                    {t("categoriesAndTypes")}
                  </Label>
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
                      <Card
                        key={ct.id}
                        variant="admin"
                        className='p-3.5 space-y-2.5 bg-slate-950/70 border-slate-800/90'
                      >
                        <div className='flex items-center justify-between gap-2 border-b border-slate-800/70 pb-2'>
                          <span className='text-xs font-semibold text-slate-200'>
                            {ct.name}
                          </span>
                          <Badge variant="outline" className='text-[10px] font-medium text-slate-400 bg-slate-900 border-slate-800 px-1.5 py-0.5 gap-1'>
                            {isMulti ? (
                              <>
                                <CheckSquare className='w-2.5 h-2.5 text-sky-400' />
                                <span>{t("multi")}</span>
                              </>
                            ) : (
                              <>
                                <CircleDot className='w-2.5 h-2.5 text-sky-400' />
                                <span>{t("single")}</span>
                              </>
                            )}
                          </Badge>
                        </div>

                        {cats.length === 0 ? (
                          <div className='text-[11px] text-slate-500 italic'>
                            {t("noCategoriesInGroup")}
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
                              <span>{tCommon("none")}</span>
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
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 7. Published At (Scheduled Publication Start) */}
            <div className='space-y-1.5'>
              <div className='flex items-center gap-1.5'>
                <Label htmlFor={pubStartId} className='block text-xs font-medium text-slate-200'>{t("publishedAt")}</Label>
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
                  {t("pubStartHelp")}
                </div>
              )}

              <DatePicker
                id={pubStartId}
                value={publicationStart}
                onChange={setPublicationStart}
                locale={adminLanguage}
                openDirection="up"
                showWeekNumbers={true}
                placeholder={t("immediatelyLeaveEmpty")}
                clearLabel={t("clear")}
              />
            </div>

            {/* 8. Unpublish Date */}
            <div className='space-y-1.5'>
              <div className='flex items-center gap-1.5'>
                <Label htmlFor={pubEndId} className='block text-xs font-medium text-slate-200'>{t("unpublishDate")}</Label>
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
                  {t("pubEndHelp")}
                </div>
              )}

              <div className='flex items-center gap-2'>
                <div className='flex-1'>
                  <DatePicker
                    id={pubEndId}
                    value={publicationEnd}
                    onChange={setPublicationEnd}
                    locale={adminLanguage}
                    openDirection="up"
                    showWeekNumbers={true}
                    placeholder={t("neverLeaveEmpty")}
                    clearLabel={t("clear")}
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
          </Card>
        </div>

        {/* Right Column: Document Status & Activity */}
        <div className='lg:col-span-1 space-y-3'>
          <h2 className='text-sm font-semibold text-slate-200'>{t("docStatusTitle")}</h2>

          <Card variant="admin" className='p-6 space-y-5'>
            {/* Status */}
            <div className='space-y-2'>
              <div id={statusLabelId} className='text-xs font-medium text-slate-400'>
                {tCommon("status")}
              </div>
              <div
                role="radiogroup"
                aria-labelledby={statusLabelId}
                className='grid grid-cols-3 gap-1.5 bg-slate-950/90 border border-slate-800 rounded-xl p-1'
              >
                {statusOptions.map((st, idx) => {
                  const active = status === st;
                  return (
                    <button
                      key={st}
                      ref={(el) => {
                        statusButtonRefs.current[idx] = el;
                      }}
                      type='button'
                      role='radio'
                      aria-checked={active}
                      tabIndex={active ? 0 : -1}
                      onClick={() => setStatus(st)}
                      onKeyDown={(e) => handleStatusKeyDown(e, st)}
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
                      {getStatusLabel(st)}
                    </button>
                  );
                })}
              </div>
              <p className='text-[11px] text-slate-500'>
                {status === "PUBLISHED"
                  ? t("visiblePublicly")
                  : t("visibleAdminsOnly")}
              </p>
            </div>

            {/* Page ID & Page Template */}
            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-1'>
                <div className='text-xs font-medium text-slate-400'>{t("pageId")}</div>
                <div className='text-xs text-slate-200 font-medium font-mono'>{page.id}</div>
              </div>
              <div className='space-y-1'>
                <div className='text-xs font-medium text-slate-400'>{t("pageTemplate")}</div>
                <div className='text-xs text-slate-200 font-medium'>{getTemplateLabel(currentTemplateOption.id, currentTemplateOption.label)}</div>
              </div>
            </div>

            {/* Linked Booking Object */}
            <div className='space-y-1.5 pt-1 border-t border-slate-800/80'>
              <div className='text-xs font-medium text-slate-400 flex items-center gap-1.5'>
                <Box className='w-3.5 h-3.5 text-sky-400' />
                <span>{t("connectedBookingObject")}</span>
              </div>
              {linkedBookingObject ? (
                <div className='rounded-xl border border-slate-800 bg-slate-950/80 p-2.5 space-y-1 text-xs'>
                  <div className='font-semibold text-white flex items-center justify-between'>
                    <span>{linkedBookingObject.name}</span>
                    <Badge variant="outline" className='text-[10px] text-emerald-400 font-medium bg-emerald-500/10 border-emerald-500/20 px-1.5 py-0.5'>
                      {tCommon("active")}
                    </Badge>
                  </div>
                  <div className='text-[11px] text-slate-400'>
                    {formatBookingObjectType(linkedBookingObject.type)}
                    {linkedBookingObject.size_sqm ? ` · ${linkedBookingObject.size_sqm} m²` : ""}
                    {` · ${linkedBookingObject.bed_count} ${t("beds")}`}
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
                      {t("noObjectConnectedHelp")}
                    </span>
                  ) : (
                    <span>{t("notConnectedOptional")}</span>
                  )}
                </div>
              )}
            </div>

            {/* Public Link */}
            <div className='space-y-1'>
              <div className='text-xs font-medium text-slate-400'>{t("publicLink")}</div>
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

            {/* System Link */}
            <div className='space-y-1'>
              <div className='text-xs font-medium text-slate-400'>{t("systemLink")}</div>
              <a
                href={systemUrlPath}
                target='_blank'
                rel='noreferrer'
                className='inline-flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300 underline underline-offset-4 break-all'>
                <ExternalLink className='w-3.5 h-3.5 shrink-0' />
                <span>
                  {typeof window !== "undefined"
                    ? `${window.location.origin}${systemUrlPath}`
                    : `http://localhost:3000${systemUrlPath}`}
                </span>
              </a>
            </div>

            {/* Last Saved */}
            <div className='space-y-1'>
              <div className='text-xs font-medium text-slate-400'>{t("lastSaved")}</div>
              <div className='text-xs text-slate-300'>{lastSavedText}</div>
            </div>

            {/* Original Author */}
            <div className='space-y-1'>
              <div className='text-xs font-medium text-slate-400'>{t("originalAuthor")}</div>
              <div className='text-xs text-slate-300'>{t("originalAuthorBy", { author: "Super Admin (SU)", date: createdDateFormatted })}</div>
            </div>

            {/* Revisions */}
            <div className='space-y-1'>
              <div className='text-xs font-medium text-slate-400'>{t("revisions")}</div>
              <div className='text-xs text-slate-300'>{t("revisionsCount", { count: 4 })}</div>
            </div>

            {/* Activity timestamps */}
            <div className='border-t border-slate-800/80 pt-4 space-y-1 text-[11px] text-slate-500'>
              <div>{t("publishedOnBy", { date: createdDateFormatted, author: "SU" })}</div>
              <div>{t("metadataUpdatedOnBy", { date: todayFormatted, author: "SU" })}</div>
            </div>

            {/* Save Button */}
            <div className='pt-2'>
              <Button
                type='button'
                variant='adminPrimary'
                onClick={() => handleSave()}
                disabled={isSaving || !slugValidation.isValid}
                className='w-full h-10 font-semibold text-xs'
              >
                {isSaving ? (
                  <Loader2 className='w-4 h-4 animate-spin' />
                ) : saveSuccess ? (
                  <Check className='w-4 h-4 text-emerald-300' />
                ) : (
                  <Save className='w-4 h-4' />
                )}
                <span>{saveSuccess ? tCommon("saved") : t("saveChanges")}</span>
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
