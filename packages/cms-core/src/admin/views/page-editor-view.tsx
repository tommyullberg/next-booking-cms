"use client";

import React, { useState, useId } from "react";
import { useTranslations } from "next-intl";
import { Card } from "@cms/components/ui";
import { cleanSlugInput, validateSlugInput } from "@cms/utils/slug";
import {
  DEFAULT_CMS_TEMPLATES,
  resolveTemplateOption,
} from "@cms/templates/types";
import {
  DEFAULT_SITE_LANGUAGE,
  DEFAULT_LANGUAGE_URL_PREFIX,
  SupportedLocale,
} from "@cms/constants/languages";
import { DefaultLanguageUrlPrefix } from "@cms/types/settings";
import { formatDateInput } from "@cms/constants/dates";
import {
  PageEditorData,
  PageEditorViewProps,
  PageStatus,
} from "./page-editor/types";
import {
  usePageEditorLanguages,
  usePageEditorSlugs,
  usePageEditorTranslations,
} from "./page-editor/hooks";
import {
  PageEditorHeader,
  ActiveLanguagesSection,
  PageMetadataSection,
  SlugEditor,
  SeoSection,
  TemplateSelector,
  SectionSelector,
  CategoriesSection,
  PublicationSection,
  PageStatusSidebar,
} from "./page-editor/components";

export type { PageStatus, PageEditorData, PageEditorViewProps };

export function PageEditorView({
  page,
  availableTemplates = DEFAULT_CMS_TEMPLATES,
  existingPages = [],
  sections = [],
  categoryTypes = [],
  bookingObjects = [],
  activeLanguages,
  activeLocales = ["sv", "en", "de"],
  defaultLanguage: propDefaultLanguage = DEFAULT_SITE_LANGUAGE,
  defaultLanguageUrlPrefix: propDefaultLanguageUrlPrefix = DEFAULT_LANGUAGE_URL_PREFIX,
  adminLanguage = "en",
  onBack,
  onSave,
}: PageEditorViewProps) {
  const t = useTranslations("pageEditor");

  const defaultLanguage: SupportedLocale = propDefaultLanguage;
  const defaultLanguageUrlPrefix: DefaultLanguageUrlPrefix = propDefaultLanguageUrlPrefix;
  const isHomepage = Number(page.id) === 1001;

  // Language management
  const {
    siteLanguages,
    pageActiveLanguages,
    togglePageLanguage,
    secondaryActiveLocales,
  } = usePageEditorLanguages({
    page,
    activeLanguages,
    activeLocales,
    defaultLanguage,
  });

  // Slug management
  const {
    slugMode,
    slug,
    setSlug,
    separateSlugs,
    setSeparateSlugs,
    handleSlugModeChange,
    slugValidation,
    slugErrors,
    setSlugErrors,
  } = usePageEditorSlugs({
    page,
    isHomepage,
    defaultLanguage,
    siteLanguages,
    existingPages,
  });

  // Translations & metadata management
  const {
    primaryTitle,
    setPrimaryTitle,
    primaryLinkTitle,
    setPrimaryLinkTitle,
    primaryMetaTitle,
    setPrimaryMetaTitle,
    primaryMetaDesc,
    setPrimaryMetaDesc,
    translations,
    useSamePageTitle,
    setUseSamePageTitle,
    useSameLinkTitle,
    setUseSameLinkTitle,
    titleErrors,
    setTitleErrors,
    updateTranslation,
  } = usePageEditorTranslations({
    page,
    defaultLanguage,
    siteLanguages,
  });

  // Form field unique IDs for accessibility
  const primaryInputId = useId();
  const primaryLinkId = useId();
  const pubStartId = useId();
  const pubEndId = useId();
  const primaryMetaTitleId = useId();
  const primaryMetaDescId = useId();
  const templateLabelId = useId();
  const templateTriggerId = useId();
  const templateListboxId = useId();
  const sectionLabelId = useId();
  const sectionTriggerId = useId();
  const sectionListboxId = useId();

  // Template and category state
  const initialResolved = resolveTemplateOption(page.template_name, availableTemplates);
  const [templateName, setTemplateName] = useState<string>(
    isHomepage ? "startpage" : initialResolved.id
  );
  const [sectionId, setSectionId] = useState<string>(page.section_id || "");
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(() =>
    Array.isArray(page.categories) ? page.categories.map((c) => c.id) : []
  );

  const selectableTemplates = React.useMemo(
    () => availableTemplates.filter((opt) => !opt.isProtected),
    [availableTemplates]
  );
  const currentTemplateOption = resolveTemplateOption(templateName, availableTemplates);

  // Status and publication state
  const [savedStatus, setSavedStatus] = useState<PageStatus>(page.status || "NEW");
  const [status, setStatus] = useState<PageStatus>(page.status || "NEW");
  const [publicationStart, setPublicationStart] = useState<string>(
    formatDateInput(page.publication_start)
  );
  const [publicationEnd, setPublicationEnd] = useState<string>(
    formatDateInput(page.publication_end)
  );

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [lastSavedText, setLastSavedText] = useState(() =>
    t("minutesAgoBy", { author: "Super Admin (SU)" })
  );

  // Linked booking object
  const linkedBookingObject = React.useMemo(() => {
    if (!bookingObjects || !page.id) return null;
    return (
      bookingObjects.find((o) => Number(o.page_id) === Number(page.id)) || null
    );
  }, [bookingObjects, page.id]);

  // Status labels & options
  const statusOptions: PageStatus[] = ["NEW", "PUBLISHED", "ARCHIVED"];
  const getStatusLabel = (st: PageStatus) => {
    if (st === "PUBLISHED") return t("published");
    if (st === "NEW") return t("new");
    return t("archived");
  };

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

  // Central save handler
  const handleSave = async (e?: React.FormEvent) => {
    e?.preventDefault();

    // 1. Validate primary title and active locale titles
    const newTitleErrors: Record<string, string> = {};
    if (pageActiveLanguages.includes(defaultLanguage)) {
      if (!primaryTitle || !primaryTitle.trim()) {
        newTitleErrors[defaultLanguage] =
          adminLanguage === "sv"
            ? "Sidtitel är obligatorisk."
            : "Page title is required.";
      }
    }
    for (const loc of secondaryActiveLocales) {
      const locTitle = translations[loc]?.pageTitle;
      if (!locTitle || !locTitle.trim()) {
        newTitleErrors[loc] =
          adminLanguage === "sv"
            ? "Sidtitel är obligatorisk."
            : "Page title is required.";
      }
    }

    if (Object.keys(newTitleErrors).length > 0) {
      setTitleErrors(newTitleErrors);
      return;
    }
    setTitleErrors({});

    // 2. Validate slugs
    const newSlugErrors: Record<string, string> = {};
    if (!isHomepage) {
      if (slugMode === "same") {
        const finalCleanSlug = cleanSlugInput(slug, false);
        const check = validateSlugInput(finalCleanSlug, {
          currentPageId: page.id,
          existingPages,
        });
        if (!check.isValid) {
          newSlugErrors["common"] = check.error || "Invalid URL slug.";
        }
      } else {
        for (const loc of pageActiveLanguages) {
          const locSlug = cleanSlugInput(separateSlugs[loc] || "", false);
          if (locSlug) {
            const check = validateSlugInput(locSlug, {
              currentPageId: page.id,
              existingPages,
            });
            if (!check.isValid) {
              newSlugErrors[loc] = check.error || "Invalid URL slug.";
            }
          }
        }
      }
    }

    if (Object.keys(newSlugErrors).length > 0) {
      setSlugErrors(newSlugErrors);
      return;
    }
    setSlugErrors({});

    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const translationPayload = siteLanguages
        .filter((loc) => loc !== defaultLanguage)
        .map((loc) => {
          const current = translations[loc] || {
            pageTitle: "",
            linkDescription: "",
            metaTitle: "",
            metaDescription: "",
          };
          const effPageTitle = useSamePageTitle ? primaryTitle : current.pageTitle || primaryTitle;
          const rawLink = useSameLinkTitle ? primaryLinkTitle : current.linkDescription;
          const effLink = rawLink && rawLink.trim() ? rawLink.trim() : null;
          const locSlug =
            slugMode === "separate"
              ? (separateSlugs[loc] ? cleanSlugInput(separateSlugs[loc], false) : null)
              : null;

          return {
            locale: loc,
            pageTitle: effPageTitle,
            linkDescription: effLink,
            metaTitle: current.metaTitle ? current.metaTitle : null,
            metaDescription: current.metaDescription ? current.metaDescription : null,
            slug: locSlug,
          };
        });

      const finalDefaultSlug = isHomepage
        ? "/"
        : slugMode === "separate"
        ? cleanSlugInput(separateSlugs[defaultLanguage] || "", false) || String(page.id)
        : cleanSlugInput(slug, false) || String(page.id);

      await onSave({
        id: page.id,
        templateName: isHomepage ? "startpage" : templateName,
        sectionId: sectionId || null,
        categoryIds: selectedCategoryIds,
        pageTitle: primaryTitle,
        linkDescription: primaryLinkTitle.trim() || null,
        metaTitle: primaryMetaTitle.trim() || null,
        metaDescription: primaryMetaDesc.trim() || null,
        slug: finalDefaultSlug,
        slugMode,
        activeLanguages: pageActiveLanguages,
        status,
        publicationStart: publicationStart || null,
        publicationEnd: publicationEnd || null,
        translations: translationPayload,
      });

      setSavedStatus(status);
      setSaveSuccess(true);
      setLastSavedText(t("justNowBy", { author: "Super Admin (SU)" }));
      setTimeout(() => setSaveSuccess(false), 2500);
    } finally {
      setIsSaving(false);
    }
  };

  // URL paths and formatted dates
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
      <PageEditorHeader
        primaryTitle={primaryTitle}
        savedStatus={savedStatus}
        statusLabel={getStatusLabel(savedStatus)}
        onBack={onBack}
      />

      {/* Main Two-Column Layout */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 items-start'>
        {/* Left Column: Document Info & Metadata */}
        <div className='lg:col-span-2 space-y-3'>
          <h2 className='text-sm font-semibold text-slate-200'>
            {t("docInfoTitle")}
          </h2>

          <Card variant='admin' className='p-6'>
            <form onSubmit={handleSave} className='space-y-6'>
              {/* 0. Active Languages for Page */}
              <ActiveLanguagesSection
                siteLanguages={siteLanguages}
                pageActiveLanguages={pageActiveLanguages}
                defaultLanguage={defaultLanguage}
                adminLanguage={adminLanguage}
                onToggleLanguage={togglePageLanguage}
              />

              {/* 1. Page Title & 2. Link text */}
              <PageMetadataSection
                primaryInputId={primaryInputId}
                primaryLinkId={primaryLinkId}
                defaultLanguage={defaultLanguage}
                pageActiveLanguages={pageActiveLanguages}
                secondaryActiveLocales={secondaryActiveLocales}
                primaryTitle={primaryTitle}
                setPrimaryTitle={setPrimaryTitle}
                primaryLinkTitle={primaryLinkTitle}
                setPrimaryLinkTitle={setPrimaryLinkTitle}
                translations={translations}
                updateTranslation={updateTranslation}
                useSamePageTitle={useSamePageTitle}
                setUseSamePageTitle={setUseSamePageTitle}
                useSameLinkTitle={useSameLinkTitle}
                setUseSameLinkTitle={setUseSameLinkTitle}
                titleErrors={titleErrors}
                setTitleErrors={setTitleErrors}
              />

              {/* 3. Slughantering / Slug Mode */}
              <SlugEditor
                pageId={page.id}
                isHomepage={isHomepage}
                defaultLanguage={defaultLanguage}
                defaultLanguageUrlPrefix={defaultLanguageUrlPrefix}
                pageActiveLanguages={pageActiveLanguages}
                slugMode={slugMode}
                onSlugModeChange={handleSlugModeChange}
                slug={slug}
                onSlugChange={(val) => setSlug(cleanSlugInput(val, true))}
                onSlugBlur={() => setSlug((prev) => cleanSlugInput(prev, false))}
                separateSlugs={separateSlugs}
                onSeparateSlugChange={(loc, val) => {
                  const cleaned = cleanSlugInput(val, true);
                  setSeparateSlugs((prev) => ({ ...prev, [loc]: cleaned }));
                }}
                onSeparateSlugBlur={(loc) => {
                  setSeparateSlugs((prev) => ({
                    ...prev,
                    [loc]: cleanSlugInput(prev[loc] || "", false),
                  }));
                }}
                slugErrors={slugErrors}
                slugValidation={slugValidation}
              />

              {/* 3b. SEO & Social Sharing */}
              <SeoSection
                primaryMetaTitleId={primaryMetaTitleId}
                primaryMetaDescId={primaryMetaDescId}
                defaultLanguage={defaultLanguage}
                adminLanguage={adminLanguage}
                pageActiveLanguages={pageActiveLanguages}
                secondaryActiveLocales={secondaryActiveLocales}
                primaryMetaTitle={primaryMetaTitle}
                setPrimaryMetaTitle={setPrimaryMetaTitle}
                primaryMetaDesc={primaryMetaDesc}
                setPrimaryMetaDesc={setPrimaryMetaDesc}
                translations={translations}
                updateTranslation={updateTranslation}
              />

              {/* 4. Page Template */}
              <TemplateSelector
                templateLabelId={templateLabelId}
                templateTriggerId={templateTriggerId}
                templateListboxId={templateListboxId}
                isHomepage={isHomepage}
                templateName={templateName}
                setTemplateName={setTemplateName}
                selectableTemplates={selectableTemplates}
                currentTemplateOption={currentTemplateOption}
                getTemplateLabel={getTemplateLabel}
                linkedBookingObject={linkedBookingObject}
              />

              {/* 5. Section Assignment */}
              <SectionSelector
                sectionLabelId={sectionLabelId}
                sectionTriggerId={sectionTriggerId}
                sectionListboxId={sectionListboxId}
                sectionId={sectionId}
                setSectionId={setSectionId}
                sections={sections}
              />

              {/* 6. Categories & Types Assignment */}
              <CategoriesSection
                categoryTypes={categoryTypes}
                selectedCategoryIds={selectedCategoryIds}
                setSelectedCategoryIds={setSelectedCategoryIds}
              />

              {/* 7. Published At & 8. Unpublish Date */}
              <PublicationSection
                pubStartId={pubStartId}
                pubEndId={pubEndId}
                publicationStart={publicationStart}
                setPublicationStart={setPublicationStart}
                publicationEnd={publicationEnd}
                setPublicationEnd={setPublicationEnd}
                adminLanguage={adminLanguage}
              />
            </form>
          </Card>
        </div>

        {/* Right Column: Document Status & Activity */}
        <PageStatusSidebar
          pageId={page.id}
          status={status}
          setStatus={setStatus}
          statusOptions={statusOptions}
          getStatusLabel={getStatusLabel}
          currentTemplateLabel={getTemplateLabel(
            currentTemplateOption.id,
            currentTemplateOption.label
          )}
          templateName={templateName}
          linkedBookingObject={linkedBookingObject}
          publicUrlPath={publicUrlPath}
          systemUrlPath={systemUrlPath}
          lastSavedText={lastSavedText}
          createdDateFormatted={createdDateFormatted}
          todayFormatted={todayFormatted}
          isSaving={isSaving}
          saveSuccess={saveSuccess}
          isSlugValid={slugValidation.isValid}
          onSave={handleSave}
        />
      </div>
    </div>
  );
}
