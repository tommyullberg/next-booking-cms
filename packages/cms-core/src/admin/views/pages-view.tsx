"use client";

import React, { useState, useMemo, useId } from "react";
import { useTranslations } from "next-intl";
import { Plus, Edit3, Trash2, Search, Lock, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { HOMEPAGE_ID, cleanSlugInput, validateSlugInput } from "../../utils/slug";
import { CMSTemplateOption, DEFAULT_CMS_TEMPLATES, formatTemplateLabel } from "../../templates/types";
import { FlagIcon } from "../../components/ui/flag-icon";
import { LANGUAGE_META } from "../../constants/languages";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { FormField } from "../../components/ui/form-field";
import { NativeSelect } from "../../components/ui/select";
import { Badge } from "../../components/ui/badge";
import { useConfirm } from "../../components/confirm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";

export interface PageListItem {
  id: number | string;
  page_title: string;
  slug: string;
  template_name: string;
  status: "NEW" | "PUBLISHED" | "ARCHIVED";
  created_date: string | Date;
  section?: { id: string; name: string } | null;
  translations?: Array<{ locale: string; page_title?: string }>;
  _count?: { page_fields: number };
}

export type PageSortField = "id" | "title" | "slug" | "section" | "template" | "status";
export type SortDirection = "asc" | "desc";

export interface PagesViewProps {
  pages: PageListItem[];
  sections: Array<{ id: string; name: string; start_page_id?: number | string | null }>;
  availableTemplates?: CMSTemplateOption[];
  activeLanguages?: string[];
  activeLocales?: string[];
  onEditPage: (pageId: number | string) => void;
  onCreatePage: (data: {
    pageTitle: string;
    slug: string;
    templateName: string;
    sectionId?: string | null;
    translations?: Array<{ locale: string; pageTitle: string }>;
  }) => Promise<void>;
  onDeletePage: (pageId: number | string) => Promise<void>;
}

export function PagesView({
  pages,
  sections,
  availableTemplates = DEFAULT_CMS_TEMPLATES,
  activeLanguages,
  activeLocales,
  onEditPage,
  onCreatePage,
  onDeletePage,
}: PagesViewProps) {
  const t = useTranslations("pages");
  const tCommon = useTranslations("common");
  const { confirm } = useConfirm();

  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitleSv, setNewTitleSv] = useState("");
  const [newTranslations, setNewTranslations] = useState<Record<string, string>>({});
  const [newSlug, setNewSlug] = useState("");
  const [newTemplate, setNewTemplate] = useState("article");
  const [newSectionId, setNewSectionId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createTitleId = useId();

  const [sortField, setSortField] = useState<PageSortField>("id");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const effectiveLocales = activeLocales || activeLanguages || ["sv", "en"];
  const secondaryLocales = effectiveLocales.filter((l) => l !== "sv");

  const nextIdPreview = pages.reduce((max, p) => Math.max(max, Number(p.id) || 1001), 1001) + 1;

  const newSlugValidation = validateSlugInput(newSlug, {
    existingPages: pages,
  });

  const handleToggleSort = (field: PageSortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const renderSortIcon = (field: PageSortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className='w-3 h-3 text-slate-500 opacity-60' />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp className='w-3 h-3 text-sky-400 font-bold' />
    ) : (
      <ArrowDown className='w-3 h-3 text-sky-400 font-bold' />
    );
  };

  const formatSlugDisplay = (page: PageListItem) => {
    if (Number(page.id) === HOMEPAGE_ID || !page.slug || page.slug === "/") {
      return "/";
    }
    return page.slug.startsWith("/") ? page.slug : `/${page.slug}`;
  };

  const sortedAndFilteredPages = useMemo(() => {
    const list = pages.filter(
      (p) =>
        p.page_title.toLowerCase().includes(search.toLowerCase()) ||
        p.slug.toLowerCase().includes(search.toLowerCase()) ||
        String(p.id).includes(search.trim()),
    );

    return [...list].sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "id": {
          const numA = Number(a.id);
          const numB = Number(b.id);
          if (!isNaN(numA) && !isNaN(numB)) {
            cmp = numA - numB;
          } else {
            cmp = String(a.id).localeCompare(String(b.id));
          }
          break;
        }
        case "title": {
          cmp = a.page_title.localeCompare(b.page_title, "sv", { sensitivity: "base" });
          break;
        }
        case "slug": {
          cmp = formatSlugDisplay(a).localeCompare(formatSlugDisplay(b), "sv", { sensitivity: "base" });
          break;
        }
        case "section": {
          const secA = a.section?.name || "";
          const secB = b.section?.name || "";
          cmp = secA.localeCompare(secB, "sv", { sensitivity: "base" });
          break;
        }
        case "template": {
          const labelA =
            Number(a.id) === HOMEPAGE_ID ? "Startpage" : formatTemplateLabel(a.template_name, availableTemplates);
          const labelB =
            Number(b.id) === HOMEPAGE_ID ? "Startpage" : formatTemplateLabel(b.template_name, availableTemplates);
          cmp = labelA.localeCompare(labelB, "sv", { sensitivity: "base" });
          break;
        }
        case "status": {
          cmp = a.status.localeCompare(b.status);
          break;
        }
        default:
          cmp = 0;
      }

      if (cmp === 0) {
        const numA = Number(a.id);
        const numB = Number(b.id);
        if (!isNaN(numA) && !isNaN(numB)) {
          return numA - numB;
        }
        return String(a.id).localeCompare(String(b.id));
      }

      return sortDirection === "asc" ? cmp : -cmp;
    });
  }, [pages, search, sortField, sortDirection, availableTemplates]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitleSv.trim()) return;
    const cleanedSlug = cleanSlugInput(newSlug, false);
    const check = validateSlugInput(cleanedSlug, { existingPages: pages });
    if (!check.isValid) return;

    setIsSubmitting(true);
    try {
      const translationPayload = secondaryLocales.map((loc) => ({
        locale: loc,
        pageTitle: (newTranslations[loc] || "").trim() || newTitleSv.trim(),
      }));

      await onCreatePage({
        pageTitle: newTitleSv.trim(),
        slug: cleanedSlug,
        templateName: newTemplate,
        sectionId: newSectionId || null,
        translations: translationPayload,
      });
      setIsModalOpen(false);
      setNewTitleSv("");
      setNewTranslations({});
      setNewSlug("");
      setNewSectionId("");
      setNewTemplate("article");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className='space-y-6'>
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight text-white'>{t("title")}</h1>
          <p className='mt-1 text-xs text-slate-400'>{t("subtitle")}</p>
        </div>

        <Button
          type='button'
          variant='adminPrimary'
          size='sm'
          onClick={() => setIsModalOpen(true)}>
          <Plus className='w-4 h-4' />
          <span>{t("createPage")}</span>
        </Button>
      </div>

      <div className='flex items-center gap-3'>
        <div className='relative flex-1 max-w-md'>
          <Search className='w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none' />
          <Input
            type='text'
            variant='admin'
            size='sm'
            placeholder={t("searchPlaceholder")}
            aria-label={t("searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='pl-10'
          />
        </div>
      </div>

      {/* Pages Table */}
      <div className='overflow-hidden rounded-2xl border border-slate-800/90 bg-slate-900/40'>
        <table className='w-full text-left text-xs'>
          <thead className='border-b border-slate-800 bg-slate-900/80 text-slate-400 font-medium'>
            <tr>
              <th
                onClick={() => handleToggleSort("id")}
                className={`py-3 px-4 w-20 cursor-pointer transition select-none ${
                  sortField === "id" ? "text-white font-semibold" : "hover:text-white"
                }`}>
                <div className='flex items-center gap-1.5'>
                  <span>ID</span>
                  {renderSortIcon("id")}
                </div>
              </th>
              <th className='py-3 px-4 select-none'>
                <div className='flex items-center gap-1.5'>
                  <button
                    type='button'
                    onClick={() => handleToggleSort("title")}
                    className={`flex items-center gap-1 transition cursor-pointer text-left ${
                      sortField === "title" ? "text-white font-semibold" : "text-slate-400 hover:text-white"
                    }`}
                    title='Sort by Title'
                    aria-label='Sort by Title'>
                    <span>{t("table.title")}</span>
                    {renderSortIcon("title")}
                  </button>
                  <span className='text-slate-600 font-normal'>/</span>
                  <button
                    type='button'
                    onClick={() => handleToggleSort("slug")}
                    className={`flex items-center gap-1 transition cursor-pointer text-left ${
                      sortField === "slug" ? "text-white font-semibold" : "text-slate-400 hover:text-white"
                    }`}
                    title='Sort by URL / Slug'
                    aria-label='Sort by URL / Slug'>
                    <span>{t("table.slug")}</span>
                    {renderSortIcon("slug")}
                  </button>
                </div>
              </th>
              <th
                onClick={() => handleToggleSort("section")}
                className={`py-3 px-4 cursor-pointer transition select-none ${
                  sortField === "section" ? "text-white font-semibold" : "hover:text-white"
                }`}>
                <div className='flex items-center gap-1.5'>
                  <span>{t("table.section")}</span>
                  {renderSortIcon("section")}
                </div>
              </th>
              <th
                onClick={() => handleToggleSort("template")}
                className={`py-3 px-4 cursor-pointer transition select-none ${
                  sortField === "template" ? "text-white font-semibold" : "hover:text-white"
                }`}>
                <div className='flex items-center gap-1.5'>
                  <span>{t("table.template")}</span>
                  {renderSortIcon("template")}
                </div>
              </th>
              <th
                onClick={() => handleToggleSort("status")}
                className={`py-3 px-4 cursor-pointer transition select-none ${
                  sortField === "status" ? "text-white font-semibold" : "hover:text-white"
                }`}>
                <div className='flex items-center gap-1.5'>
                  <span>{t("table.status")}</span>
                  {renderSortIcon("status")}
                </div>
              </th>
              <th className='py-3 px-4'>{t("table.languages")}</th>
              <th className='py-3 px-4 text-right'>{t("table.actions")}</th>
            </tr>
          </thead>
          <tbody className='divide-y divide-slate-800/60'>
            {sortedAndFilteredPages.length === 0 ? (
              <tr>
                <td colSpan={7} className='py-8 text-center text-slate-500'>
                  {tCommon("noResults")}
                </td>
              </tr>
            ) : (
              sortedAndFilteredPages.map((page) => {
                const isHomepage = Number(page.id) === HOMEPAGE_ID;
                return (
                  <tr
                    key={page.id}
                    onClick={() => onEditPage(page.id)}
                    className='hover:bg-slate-900/70 transition cursor-pointer'>
                    <td className='py-3 px-4 font-mono text-slate-400'>{page.id}</td>
                    <td className='py-3 px-4'>
                      <div className='flex items-center gap-2'>
                        <span className='font-semibold text-white'>{page.page_title}</span>
                        {isHomepage && (
                          <Badge variant='adminAccent' size='xs'>
                            <Lock className='w-2.5 h-2.5' />
                            <span>Startpage</span>
                          </Badge>
                        )}
                      </div>
                      <div className='text-[11px] text-slate-500 font-mono'>{formatSlugDisplay(page)}</div>
                    </td>
                    <td className='py-3 px-4 text-slate-300'>
                      {page.section?.name || <span className='text-slate-600'>—</span>}
                    </td>
                    <td className='py-3 px-4 text-slate-400'>
                      {isHomepage ? "Startpage" : formatTemplateLabel(page.template_name, availableTemplates)}
                    </td>
                    <td className='py-3 px-4'>
                      <Badge
                        variant={
                          page.status === "PUBLISHED"
                            ? "adminSuccess"
                            : page.status === "NEW"
                              ? "adminWarning"
                              : "adminDanger"
                        }
                        size='xs'
                        className='uppercase'>
                        {page.status}
                      </Badge>
                    </td>
                    <td className='py-3 px-4'>
                      <div className='flex items-center gap-1'>
                        <span className='rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono text-slate-300 uppercase'>
                          SE
                        </span>
                        {page.translations?.map((t) => (
                          <span
                            key={t.locale}
                            className='rounded bg-sky-500/10 border border-sky-500/20 px-1.5 py-0.5 text-[10px] font-mono text-sky-400 uppercase'>
                            {t.locale === "en" ? "GB" : t.locale}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className='py-3 px-4 text-right' onClick={(e) => e.stopPropagation()}>
                      <div className='flex items-center justify-end gap-1'>
                        <Button
                          type='button'
                          variant='adminSecondary'
                          size='sm'
                          onClick={() => onEditPage(page.id)}
                          title={tCommon("edit")}
                          aria-label={`${tCommon("edit")} ${page.page_title}`}>
                          <Edit3 className='w-3.5 h-3.5' />
                          <span>{tCommon("edit")}</span>
                        </Button>
                        {!isHomepage && (
                          <Button
                            type='button'
                            variant='adminGhost'
                            size='iconSm'
                            onClick={async () => {
                              await confirm({
                                title: tCommon("delete"),
                                description: t("modal.deleteConfirm", { title: page.page_title }),
                                variant: "destructive",
                                onConfirm: async () => {
                                  await onDeletePage(page.id);
                                },
                              });
                            }}
                            className='text-slate-400 hover:text-red-400 hover:bg-slate-800/80'
                            title={tCommon("delete")}
                            aria-label={`${tCommon("delete")} ${page.page_title}`}>
                            <Trash2 className='w-4 h-4' />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Create Page Dialog */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent variant='admin' size='sm'>
          <DialogHeader>
            <DialogTitle>{t("modal.createTitle")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className='space-y-4'>
            <div>
              <Label htmlFor={createTitleId} className='block text-xs font-medium text-slate-300 mb-1.5'>
                {t("modal.titleLabel")}
              </Label>
              <div className='space-y-2'>
                {/* Primary Language (SE) */}
                <div className='flex items-center rounded-xl border border-admin-border bg-admin-field overflow-hidden focus-within:border-admin-accent transition'>
                  <span className='flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-400 bg-admin-surface-subtle border-r border-admin-border shrink-0 w-20'>
                    <FlagIcon code='sv' size='sm' />
                    <span className='font-mono text-[11px]'>{LANGUAGE_META.sv?.code || "SE"}</span>
                  </span>
                  <input
                    id={createTitleId}
                    type='text'
                    required
                    placeholder='Sidrubrik...'
                    value={newTitleSv}
                    onChange={(e) => setNewTitleSv(e.target.value)}
                    className='w-full bg-transparent px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none'
                  />
                </div>

                {/* Secondary Active Languages */}
                {secondaryLocales.map((loc) => {
                  const meta = LANGUAGE_META[loc] || {
                    code: loc.toUpperCase(),
                    flag: "",
                    label: loc,
                  };
                  const subTitleId = `${createTitleId}-${loc}`;
                  return (
                    <div
                      key={loc}
                      className='flex items-center rounded-xl border border-admin-border/80 bg-admin-field/80 overflow-hidden focus-within:border-admin-accent transition'>
                      <span className='flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-400 bg-admin-surface-subtle border-r border-admin-border/80 shrink-0 w-20'>
                        <FlagIcon code={loc} size='sm' />
                        <span className='font-mono text-[11px]'>{meta.code}</span>
                      </span>
                      <input
                        id={subTitleId}
                        type='text'
                        aria-label={`Page title in ${meta.label}`}
                        value={newTranslations[loc] || ""}
                        onChange={(e) =>
                          setNewTranslations((prev) => ({
                            ...prev,
                            [loc]: e.target.value,
                          }))
                        }
                        placeholder={`Page title in ${meta.label}...`}
                        className='w-full bg-transparent px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none'
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            <FormField
              label={t("modal.slugLabel")}
              labelVariant='admin'
              error={!newSlugValidation.isValid ? newSlugValidation.error : undefined}>
              {(control) => (
                <div
                  className={`flex items-center rounded-xl border bg-admin-field overflow-hidden transition ${
                    !newSlugValidation.isValid
                      ? "border-red-500 ring-1 ring-red-500/30"
                      : "border-admin-border focus-within:border-admin-accent"
                  }`}>
                  <span className='px-3 py-2.5 text-xs font-mono text-slate-500 bg-admin-surface-subtle border-r border-admin-border'>
                    /
                  </span>
                  <input
                    {...control}
                    type='text'
                    placeholder={`${nextIdPreview}`}
                    value={newSlug}
                    onChange={(e) => setNewSlug(cleanSlugInput(e.target.value, true))}
                    onBlur={() => setNewSlug((prev) => cleanSlugInput(prev, false))}
                    className='w-full bg-transparent p-2.5 text-xs text-white font-mono placeholder-slate-500 focus:outline-none'
                  />
                </div>
              )}
            </FormField>

            <FormField
              label={t("modal.sectionLabel")}
              labelVariant='admin'>
              <NativeSelect
                variant='admin'
                size='sm'
                value={newSectionId}
                onChange={(e) => setNewSectionId(e.target.value)}>
                <option value=''>{t("modal.noSectionOption")}</option>
                {sections
                  .filter((s) => Number(s.start_page_id) !== HOMEPAGE_ID)
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
              </NativeSelect>
            </FormField>

            <FormField
              label={t("modal.templateLabel")}
              labelVariant='admin'>
              <NativeSelect
                variant='admin'
                size='sm'
                value={newTemplate}
                onChange={(e) => setNewTemplate(e.target.value)}>
                {availableTemplates
                  .filter((t) => !t.isProtected)
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
              </NativeSelect>
            </FormField>

            <div className='flex items-center justify-end gap-2 pt-2'>
              <Button
                type='button'
                variant='adminSecondary'
                size='sm'
                onClick={() => setIsModalOpen(false)}>
                {tCommon("cancel")}
              </Button>
              <Button
                type='submit'
                variant='adminPrimary'
                size='sm'
                disabled={isSubmitting || !newSlugValidation.isValid}>
                {isSubmitting ? tCommon("loading") : t("createPage")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
