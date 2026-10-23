"use client";

import React, { useState } from "react";
import { Plus, Edit3, Trash2, Search, Lock } from "lucide-react";

export const HOMEPAGE_ID = 1001;

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

export interface PagesViewProps {
  pages: PageListItem[];
  sections: Array<{ id: string; name: string; start_page_id?: number | string | null }>;
  onEditPage: (pageId: number | string) => void;
  onCreatePage: (data: {
    pageTitle: string;
    slug: string;
    templateName: string;
    sectionId?: string | null;
  }) => Promise<void>;
  onDeletePage: (pageId: number | string) => Promise<void>;
}

const TEMPLATE_LABELS: Record<string, string> = {
  startpage: "Startpage",
  Startpage: "Startpage",
  "Booking unit": "Booking unit",
  booking: "Booking unit",
  Article: "Article",
  article: "Article",
  "Entire page": "Entire page",
  landing: "Entire page",
  Default: "Default",
  standard: "Default",
};

export function PagesView({
  pages,
  sections,
  onEditPage,
  onCreatePage,
  onDeletePage,
}: PagesViewProps) {
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newTemplate, setNewTemplate] = useState("Default");
  const [newSectionId, setNewSectionId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filtered = pages.filter(
    (p) =>
      p.page_title.toLowerCase().includes(search.toLowerCase()) ||
      p.slug.toLowerCase().includes(search.toLowerCase()) ||
      String(p.id).includes(search.trim())
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setIsSubmitting(true);
    try {
      await onCreatePage({
        pageTitle: newTitle.trim(),
        slug: newSlug.trim(),
        templateName: newTemplate,
        sectionId: newSectionId || null,
      });
      setIsModalOpen(false);
      setNewTitle("");
      setNewSlug("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatSlugDisplay = (page: PageListItem) => {
    if (Number(page.id) === HOMEPAGE_ID || !page.slug || page.slug === "/") {
      return "/";
    }
    return page.slug.startsWith("/") ? page.slug : `/${page.slug}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Pages</h1>
          <p className="mt-1 text-xs text-slate-400">
            Create and organize site pages, document metadata, and multi-language
            titles.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-sky-600/20 hover:bg-sky-500 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Create Page</span>
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search pages by title, ID, or slug..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-800 bg-slate-900/60 pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Pages Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-800/90 bg-slate-900/40">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-800 bg-slate-900/80 text-slate-400 font-medium">
            <tr>
              <th className="py-3 px-4 w-20">ID</th>
              <th className="py-3 px-4">Title & URL</th>
              <th className="py-3 px-4">Section</th>
              <th className="py-3 px-4">Template</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Languages</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-500">
                  No pages found.
                </td>
              </tr>
            ) : (
              filtered.map((page) => {
                const isHomepage = Number(page.id) === HOMEPAGE_ID;
                return (
                  <tr
                    key={page.id}
                    onClick={() => onEditPage(page.id)}
                    className="hover:bg-slate-900/70 transition cursor-pointer"
                  >
                    <td className="py-3 px-4 font-mono text-slate-400">
                      #{page.id}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">
                          {page.page_title}
                        </span>
                        {isHomepage && (
                          <span className="inline-flex items-center gap-1 rounded-md border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 text-[10px] font-medium text-sky-300">
                            <Lock className="w-2.5 h-2.5" />
                            <span>Startpage</span>
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {formatSlugDisplay(page)}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {page.section?.name || (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {isHomepage
                        ? "startpage"
                        : TEMPLATE_LABELS[page.template_name] ||
                          page.template_name}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase ${
                          page.status === "PUBLISHED"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : page.status === "NEW"
                            ? "bg-sky-500/10 text-sky-400 border border-sky-500/20"
                            : "bg-slate-500/10 text-slate-400 border border-slate-500/20"
                        }`}
                      >
                        {page.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono text-slate-300 uppercase">
                          SE
                        </span>
                        {page.translations?.map((t) => (
                          <span
                            key={t.locale}
                            className="rounded bg-sky-500/10 border border-sky-500/20 px-1.5 py-0.5 text-[10px] font-mono text-sky-400 uppercase"
                          >
                            {t.locale === "en" ? "GB" : t.locale}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td
                      className="py-3 px-4 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => onEditPage(page.id)}
                          className="px-2.5 py-1 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:text-white hover:border-slate-700 transition inline-flex items-center gap-1.5 text-xs"
                          title="Edit page metadata"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                        {!isHomepage && (
                          <button
                            type="button"
                            onClick={() => {
                              if (
                                confirm(`Delete page "${page.page_title}"?`)
                              ) {
                                onDeletePage(page.id);
                              }
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition"
                            title="Delete page"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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

      {/* Create Page Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 text-white shadow-2xl">
            <h2 className="text-base font-semibold mb-4">Create New Page</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Page Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. About Us, Cottages"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  URL Slug (Optional — defaults to numeric Page ID)
                </label>
                <div className="flex items-center rounded-xl border border-slate-800 bg-slate-950 overflow-hidden focus-within:border-sky-500">
                  <span className="px-3 py-2.5 text-xs font-mono text-slate-500 bg-slate-900/80 border-r border-slate-800">
                    /
                  </span>
                  <input
                    type="text"
                    placeholder="leave empty for numeric ID or enter slug"
                    value={newSlug}
                    onChange={(e) =>
                      setNewSlug(e.target.value.replace(/^\/+/, ""))
                    }
                    className="w-full bg-transparent p-2.5 text-xs text-white font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Section
                </label>
                <select
                  value={newSectionId}
                  onChange={(e) => setNewSectionId(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white focus:border-sky-500 focus:outline-none"
                >
                  <option value="">No section (standalone page)</option>
                  {sections
                    .filter((s) => Number(s.start_page_id) !== HOMEPAGE_ID)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Page Template
                </label>
                <select
                  value={newTemplate}
                  onChange={(e) => setNewTemplate(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white focus:border-sky-500 focus:outline-none"
                >
                  <option value="Booking unit">Booking unit</option>
                  <option value="Article">Article</option>
                  <option value="Entire page">Entire page</option>
                  <option value="Default">Default</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-sky-600 text-white hover:bg-sky-500"
                >
                  {isSubmitting ? "Creating..." : "Create Page"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
