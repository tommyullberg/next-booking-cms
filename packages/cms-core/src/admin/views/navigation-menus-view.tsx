"use client";

import React, { useState } from "react";
import { Plus, GripVertical, Trash2, ChevronDown } from "lucide-react";
import { SectionItem } from "./sections-view";
import { PageListItem, HOMEPAGE_ID } from "./pages-view";

export interface NavigationMenusViewProps {
  sections: SectionItem[];
  pages: PageListItem[];
  onNavigateToSections?: () => void;
  onUpdateMenuItem: (params: {
    previousPageId?: number | string | null;
    targetPageId: number | string;
    sectionId: string | null;
    menuTitle?: string;
    sortOrder?: number;
  }) => Promise<void>;
  onReorderMenuItems: (
    items: Array<{
      pageId: number | string;
      sectionId: string | null;
      sortOrder: number;
    }>
  ) => Promise<void>;
}

export function NavigationMenusView({
  sections,
  pages,
  onNavigateToSections,
  onUpdateMenuItem,
  onReorderMenuItems,
}: NavigationMenusViewProps) {
  const [editingItemKey, setEditingItemKey] = useState<string | null>(null);
  const [addingToSectionId, setAddingToSectionId] = useState<string | null>(
    null
  );
  const [selectedPageId, setSelectedPageId] = useState<string>("");
  const [editMenuTitle, setEditMenuTitle] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  const [draggedPageId, setDraggedPageId] = useState<string | null>(null);
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);

  // Level 1: Root Section (the section whose start_page_id === 1001)
  const rootSection = sections.find(
    (s) => Number(s.start_page_id) === HOMEPAGE_ID
  );

  const rootTitle = rootSection
    ? rootSection.translations?.en
      ? `${rootSection.name} (${rootSection.translations.en})`
      : rootSection.name
    : "Hem (Home)";

  // Level 2: All other sections in the exact sort_order from Sections
  const level2Sections = [...sections]
    .filter((s) => Number(s.start_page_id) !== HOMEPAGE_ID)
    .sort((a, b) => a.sort_order - b.sort_order);

  // Pages eligible for Level 3 menu items (all pages except Homepage 1001)
  const subPages = pages.filter((p) => Number(p.id) !== HOMEPAGE_ID);

  const getSectionMenuItems = (sec: SectionItem): PageListItem[] => {
    const items = subPages.filter((p) => {
      const secId = p.section?.id || (p as any).section_id;
      return secId === sec.id;
    });
    return items.sort(
      (a, b) => ((a as any).sort_order ?? 0) - ((b as any).sort_order ?? 0)
    );
  };

  const formatSlugDisplay = (slug: string, id: number | string) => {
    if (!slug || slug === "/") return `/${id}`;
    return slug.startsWith("/") ? slug : `/${slug}`;
  };

  const handleStartEditItem = (page: PageListItem) => {
    setAddingToSectionId(null);
    setEditingItemKey(String(page.id));
    setSelectedPageId(String(page.id));
    setEditMenuTitle((page as any).link_description || page.page_title);
  };

  const handleStartAddItem = (sectionId: string) => {
    setEditingItemKey(null);
    setAddingToSectionId(sectionId);
    const unassignedOrFirst =
      subPages.find((p) => !p.section || p.section.id !== sectionId) ||
      subPages[0];
    setSelectedPageId(
      unassignedOrFirst?.id != null ? String(unassignedOrFirst.id) : ""
    );
    setEditMenuTitle(
      (unassignedOrFirst as any)?.link_description ||
        unassignedOrFirst?.page_title ||
        ""
    );
  };

  const handleSaveItem = async (
    sectionId: string,
    previousPageId?: number | string | null
  ) => {
    if (!selectedPageId) return;
    setIsSaving(true);
    try {
      const sec = sections.find((s) => s.id === sectionId);
      const currentItems = sec ? getSectionMenuItems(sec) : [];
      await onUpdateMenuItem({
        previousPageId,
        targetPageId: Number(selectedPageId),
        sectionId,
        menuTitle: editMenuTitle.trim() || undefined,
        sortOrder: previousPageId ? undefined : currentItems.length + 1,
      });
      setEditingItemKey(null);
      setAddingToSectionId(null);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveFromMenu = async (pageId: number | string) => {
    setIsSaving(true);
    try {
      await onUpdateMenuItem({
        previousPageId: Number(pageId),
        targetPageId: Number(pageId),
        sectionId: null,
      });
      setEditingItemKey(null);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDragStart = (e: React.DragEvent, pageId: number | string) => {
    const idStr = String(pageId);
    setDraggedPageId(idStr);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", idStr);
  };

  const handleDropOnItem = async (
    e: React.DragEvent,
    targetSectionId: string,
    targetPageId?: number | string
  ) => {
    e.preventDefault();
    setDragOverKey(null);
    if (!draggedPageId) return;
    if (targetPageId !== undefined && draggedPageId === String(targetPageId)) {
      setDraggedPageId(null);
      return;
    }

    const targetSec = sections.find((s) => s.id === targetSectionId);
    if (!targetSec) {
      setDraggedPageId(null);
      return;
    }

    const draggedPage = subPages.find((p) => String(p.id) === draggedPageId);
    if (!draggedPage) {
      setDraggedPageId(null);
      return;
    }

    const sourceSectionId =
      draggedPage.section?.id || (draggedPage as any).section_id || null;

    const updates: Array<{
      pageId: number | string;
      sectionId: string | null;
      sortOrder: number;
    }> = [];

    if (sourceSectionId === targetSectionId) {
      const items = [...getSectionMenuItems(targetSec)];
      const fromIdx = items.findIndex((i) => String(i.id) === draggedPageId);
      const toIdx =
        targetPageId !== undefined
          ? items.findIndex((i) => String(i.id) === String(targetPageId))
          : items.length - 1;
      if (fromIdx !== -1 && toIdx !== -1) {
        const [moved] = items.splice(fromIdx, 1);
        items.splice(toIdx, 0, moved);
        items.forEach((item, idx) => {
          updates.push({
            pageId: Number(item.id),
            sectionId: targetSectionId,
            sortOrder: idx + 1,
          });
        });
      }
    } else {
      // Moving across sections
      if (sourceSectionId) {
        const sourceSec = sections.find((s) => s.id === sourceSectionId);
        if (sourceSec) {
          const remaining = getSectionMenuItems(sourceSec).filter(
            (i) => String(i.id) !== draggedPageId
          );
          remaining.forEach((item, idx) => {
            updates.push({
              pageId: Number(item.id),
              sectionId: sourceSectionId,
              sortOrder: idx + 1,
            });
          });
        }
      }

      const targetItems = [...getSectionMenuItems(targetSec)].filter(
        (i) => String(i.id) !== draggedPageId
      );
      const toIdx =
        targetPageId !== undefined
          ? targetItems.findIndex((i) => String(i.id) === String(targetPageId))
          : targetItems.length;
      const insertIdx = toIdx === -1 ? targetItems.length : toIdx;
      targetItems.splice(insertIdx, 0, draggedPage);

      targetItems.forEach((item, idx) => {
        updates.push({
          pageId: Number(item.id),
          sectionId: targetSectionId,
          sortOrder: idx + 1,
        });
      });
    }

    setDraggedPageId(null);
    if (updates.length > 0) {
      await onReorderMenuItems(updates);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Navigation Menus
          </h1>
          <p className="mt-1 text-xs text-slate-400 max-w-2xl leading-relaxed">
            Manage your multi-level navigation submenus based on active Sections.
            3rd-level menu items (pages) can be dragged and sorted between
            sections, or edited.
          </p>
        </div>

        {onNavigateToSections && (
          <button
            type="button"
            onClick={onNavigateToSections}
            className="flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-sky-600/25 hover:bg-sky-500 transition shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Section</span>
          </button>
        )}
      </div>

      {/* Left-aligned Multi-level Tree */}
      <div className="pl-2 pt-2">
        {/* Level 1: ROOT Section (Section with Page 1001 as its start page) */}
        <div className="flex items-center gap-3">
          <div className="w-3 h-px bg-slate-700" />
          <span className="text-lg font-medium text-slate-400 tracking-tight">
            {rootTitle}
          </span>
        </div>

        {/* Tree Trunk for Level 2 Sections */}
        <div className="ml-1.5 border-l border-slate-800 pl-6 pt-5 space-y-7">
          {level2Sections.length === 0 ? (
            <div className="relative py-2 text-xs text-slate-500">
              <div className="absolute -left-6 top-1/2 w-5 h-px bg-slate-800" />
              No Level 2 sections created yet. Click &quot;+ Add Section&quot; to
              create sections under {rootTitle}.
            </div>
          ) : (
            level2Sections.map((sec) => {
              const menuItems = getSectionMenuItems(sec);
              const isAddingHere = addingToSectionId === sec.id;

              return (
                <div
                  key={sec.id}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOverKey(`sec-${sec.id}`);
                  }}
                  onDragLeave={() => setDragOverKey(null)}
                  onDrop={(e) => handleDropOnItem(e, sec.id)}
                  className="relative"
                >
                  {/* Horizontal connector from Level 1 trunk to Level 2 Section */}
                  <div className="absolute -left-6 top-3.5 w-5 h-px bg-slate-800" />

                  {/* Level 2 Section Header */}
                  <div className="flex items-center gap-3 mb-3">
                    <h2 className="text-base font-semibold text-white tracking-tight">
                      {sec.name}
                    </h2>
                    <button
                      type="button"
                      onClick={() => handleStartAddItem(sec.id)}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-700/80 bg-slate-800/70 px-2.5 py-1 text-[11px] font-medium text-sky-400 hover:bg-slate-800 hover:text-sky-300 transition"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Item</span>
                    </button>
                  </div>

                  {/* Level 3 Menu Items (Pages) */}
                  <div className="ml-2 border-l border-slate-800/90 pl-5 space-y-2">
                    {menuItems.map((item) => {
                      const isEditing = editingItemKey === String(item.id);
                      const isDragOver = dragOverKey === String(item.id);
                      const menuLabel =
                        (item as any).link_description || item.page_title;

                      if (isEditing) {
                        return (
                          <div
                            key={item.id}
                            className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-3 rounded-xl border border-sky-500/80 bg-sky-950/35 px-3.5 py-2.5 shadow-[0_0_25px_rgba(14,165,233,0.2)] transition-all"
                          >
                            <div className="absolute -left-5 top-1/2 w-4 h-px bg-slate-800" />

                            <div className="flex items-center gap-2.5">
                              <span className="text-slate-400 cursor-grab">
                                <GripVertical className="w-4 h-4" />
                              </span>
                              <input
                                type="text"
                                value={editMenuTitle}
                                onChange={(e) => setEditMenuTitle(e.target.value)}
                                className="w-60 rounded-lg border border-sky-500/60 bg-slate-950/90 px-3.5 py-1.5 text-xs font-medium text-white focus:outline-none"
                              />
                            </div>

                            <div className="flex flex-wrap items-center gap-2.5">
                              <div className="relative min-w-[240px]">
                                <select
                                  value={selectedPageId}
                                  onChange={(e) => {
                                    const nextId = e.target.value;
                                    setSelectedPageId(nextId);
                                    const nextPage = subPages.find(
                                      (p) => String(p.id) === nextId
                                    );
                                    if (nextPage) {
                                      setEditMenuTitle(
                                        (nextPage as any).link_description ||
                                          nextPage.page_title
                                      );
                                    }
                                  }}
                                  className="w-full appearance-none rounded-lg border border-sky-500/50 bg-slate-900/95 pl-3 pr-8 py-1.5 text-xs text-slate-200 focus:border-sky-400 focus:outline-none"
                                >
                                  {subPages.map((p) => (
                                    <option key={p.id} value={String(p.id)}>
                                      Select Page...  {p.page_title} (#{p.id})
                                    </option>
                                  ))}
                                </select>
                                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                              </div>

                              <button
                                type="button"
                                disabled={isSaving}
                                onClick={() => handleSaveItem(sec.id, item.id)}
                                className="rounded-lg bg-sky-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-md shadow-sky-600/25 hover:bg-sky-500 disabled:opacity-50 transition"
                              >
                                {isSaving ? "Saving..." : "Save Changes"}
                              </button>

                              <button
                                type="button"
                                disabled={isSaving}
                                onClick={() => handleRemoveFromMenu(item.id)}
                                title="Remove item from navigation menu"
                                className="rounded-lg bg-red-600/90 p-1.5 text-white hover:bg-red-500 transition"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={item.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, item.id)}
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setDragOverKey(String(item.id));
                          }}
                          onDragLeave={() => setDragOverKey(null)}
                          onDrop={(e) => {
                            e.stopPropagation();
                            handleDropOnItem(e, sec.id, item.id);
                          }}
                          className={`relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl px-2 py-1 transition-all ${
                            isDragOver
                              ? "bg-sky-950/30 ring-1 ring-sky-500/50"
                              : "hover:bg-slate-900/40"
                          }`}
                        >
                          <div className="absolute -left-5 top-1/2 w-4 h-px bg-slate-800" />

                          <div className="flex items-center gap-2.5">
                            <span
                              className="text-slate-500 hover:text-slate-300 cursor-grab active:cursor-grabbing transition"
                              title="Drag to sort or move to another section"
                            >
                              <GripVertical className="w-4 h-4" />
                            </span>
                            <div className="w-60 rounded-lg border border-slate-800/90 bg-slate-900/75 px-3.5 py-1.5 text-xs font-medium text-slate-200 truncate">
                              {menuLabel}
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-8 pl-7 sm:pl-0">
                            <span className="text-xs text-slate-400 font-mono min-w-[180px]">
                              Link: {formatSlugDisplay(item.slug, item.id)}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleStartEditItem(item)}
                              className="rounded-lg border border-slate-700/80 bg-slate-800/75 px-4 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-800 hover:text-white transition"
                            >
                              Edit
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {/* Inline Add Item Row */}
                    {isAddingHere && (
                      <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-3 rounded-xl border border-sky-500/80 bg-sky-950/35 px-3.5 py-2.5 shadow-[0_0_25px_rgba(14,165,233,0.2)] transition-all">
                        <div className="absolute -left-5 top-1/2 w-4 h-px bg-slate-800" />

                        <div className="flex items-center gap-2.5">
                          <span className="text-slate-400">
                            <GripVertical className="w-4 h-4" />
                          </span>
                          <input
                            type="text"
                            value={editMenuTitle}
                            onChange={(e) => setEditMenuTitle(e.target.value)}
                            placeholder="Menu item label"
                            className="w-60 rounded-lg border border-sky-500/60 bg-slate-950/90 px-3.5 py-1.5 text-xs font-medium text-white focus:outline-none"
                          />
                        </div>

                        <div className="flex flex-wrap items-center gap-2.5">
                          <div className="relative min-w-[240px]">
                            <select
                              value={selectedPageId}
                              onChange={(e) => {
                                const nextId = e.target.value;
                                setSelectedPageId(nextId);
                                const nextPage = subPages.find(
                                  (p) => String(p.id) === nextId
                                );
                                if (nextPage) {
                                  setEditMenuTitle(
                                    (nextPage as any).link_description ||
                                      nextPage.page_title
                                  );
                                }
                              }}
                              className="w-full appearance-none rounded-lg border border-sky-500/50 bg-slate-900/95 pl-3 pr-8 py-1.5 text-xs text-slate-200 focus:border-sky-400 focus:outline-none"
                            >
                              {subPages.length === 0 ? (
                                <option value="">
                                  No subpages available — create a page first
                                </option>
                              ) : (
                                subPages.map((p) => (
                                  <option key={p.id} value={String(p.id)}>
                                    Select Page...  {p.page_title} (#{p.id})
                                  </option>
                                ))
                              )}
                            </select>
                            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          </div>

                          <button
                            type="button"
                            disabled={isSaving || !selectedPageId}
                            onClick={() => handleSaveItem(sec.id, null)}
                            className="rounded-lg bg-sky-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-md shadow-sky-600/25 hover:bg-sky-500 disabled:opacity-50 transition"
                          >
                            {isSaving ? "Saving..." : "Save Changes"}
                          </button>

                          <button
                            type="button"
                            onClick={() => setAddingToSectionId(null)}
                            title="Cancel"
                            className="rounded-lg bg-red-600/90 p-1.5 text-white hover:bg-red-500 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}

                    {menuItems.length === 0 && !isAddingHere && (
                      <div className="relative py-1.5 text-xs text-slate-500 italic">
                        <div className="absolute -left-5 top-1/2 w-4 h-px bg-slate-800" />
                        No menu items in this section yet. Click &quot;+ Add
                        Item&quot; or drag a page here.
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
