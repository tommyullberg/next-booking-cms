"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, GripVertical, Trash2 } from "lucide-react";
import { Button, Input, NativeSelect } from "@cms/components/ui";
import { cn } from "@cms/utils/cn";
import { SectionItem } from "./sections-view";
import { PageListItem } from "./pages-view";
import { HOMEPAGE_ID } from "@cms/utils/slug";

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
  const t = useTranslations("menus");
  const tCommon = useTranslations("common");
  const tSections = useTranslations("sections");

  const [editingItemKey, setEditingItemKey] = useState<string | null>(null);
  const [addingToSectionId, setAddingToSectionId] = useState<string | null>(
    null
  );
  const [selectedPageId, setSelectedPageId] = useState<string>("");
  const [editMenuTitle, setEditMenuTitle] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  const [draggedPageId, setDraggedPageId] = useState<string | null>(null);
  const [draggedSourceSectionId, setDraggedSourceSectionId] = useState<string | null>(null);
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
    if ((sec as any).menu_items && Array.isArray((sec as any).menu_items)) {
      return (sec as any).menu_items;
    }
    return [];
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
    setSelectedPageId("");
    setEditMenuTitle("");
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

  const handleDragStart = (
    e: React.DragEvent,
    pageId: number | string,
    sourceSectionId: string
  ) => {
    const idStr = String(pageId);
    setDraggedPageId(idStr);
    setDraggedSourceSectionId(sourceSectionId);
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
      setDraggedSourceSectionId(null);
      return;
    }

    const targetSec = sections.find((s) => s.id === targetSectionId);
    if (!targetSec) {
      setDraggedPageId(null);
      setDraggedSourceSectionId(null);
      return;
    }

    const draggedPage = subPages.find((p) => String(p.id) === draggedPageId);
    if (!draggedPage) {
      setDraggedPageId(null);
      setDraggedSourceSectionId(null);
      return;
    }

    const sourceSectionId = draggedSourceSectionId || targetSectionId;

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
    setDraggedSourceSectionId(null);
    if (updates.length > 0) {
      await onReorderMenuItems(updates);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            {t("title")}
          </h1>
          <p className="mt-1 text-xs text-slate-400 max-w-2xl leading-relaxed">
            {t("subtitle")}
          </p>
        </div>

        {onNavigateToSections && (
          <Button
            type="button"
            variant="adminPrimary"
            size="sm"
            onClick={onNavigateToSections}
          >
            <Plus className="cms-icon-md" />
            <span>{tSections("addSection")}</span>
          </Button>
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
                    <Button
                      type="button"
                      variant="adminSecondary"
                      size="xs"
                      aria-label={`${t("addItem")} - ${sec.name}`}
                      onClick={() => handleStartAddItem(sec.id)}
                    >
                      <Plus className="cms-icon-xs" />
                      <span>{t("addItem")}</span>
                    </Button>
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
                            className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-3 rounded-admin-card border border-admin-accent bg-admin-surface p-3.5 shadow-admin-glow transition-all"
                          >
                            <div className="absolute -left-5 top-1/2 w-4 h-px bg-slate-800" />

                            <div className="flex items-center gap-2.5">
                              <span
                                className="text-slate-400 cursor-grab"
                                title="Drag handle"
                                aria-label="Drag handle"
                              >
                                <GripVertical className="cms-icon-md" />
                              </span>
                              <Input
                                type="text"
                                value={editMenuTitle}
                                onChange={(e) => setEditMenuTitle(e.target.value)}
                                size="sm"
                                variant="admin"
                                className="w-60"
                                aria-label={tCommon("title")}
                              />
                            </div>

                            <div className="flex flex-wrap items-center gap-2.5">
                              <div className="min-w-[240px]">
                                <NativeSelect
                                  value={selectedPageId}
                                  onChange={(e) => {
                                    const nextId = e.target.value;
                                    setSelectedPageId(nextId);
                                    const nextPage = subPages.find(
                                      (p) => String(p.id) === nextId
                                    );
                                    if (nextPage && !editMenuTitle.trim()) {
                                      setEditMenuTitle(
                                        (nextPage as any).link_description ||
                                          nextPage.page_title
                                      );
                                    }
                                  }}
                                  size="sm"
                                  variant="admin"
                                  aria-label={tCommon("select")}
                                >
                                  {subPages
                                    .filter((p) => Number(p.id) !== Number(sec.start_page_id))
                                    .map((p) => (
                                      <option key={p.id} value={String(p.id)}>
                                        {p.page_title} (#{p.id})
                                      </option>
                                    ))}
                                </NativeSelect>
                              </div>

                              <Button
                                type="button"
                                variant="adminPrimary"
                                size="sm"
                                disabled={isSaving}
                                onClick={() => handleSaveItem(sec.id, item.id)}
                              >
                                {isSaving ? tCommon("loading") : tCommon("save")}
                              </Button>

                              <Button
                                type="button"
                                variant="adminDestructive"
                                size="iconSm"
                                disabled={isSaving}
                                onClick={() => handleRemoveFromMenu(item.id)}
                                title={tCommon("delete")}
                                aria-label={tCommon("delete")}
                              >
                                <Trash2 className="cms-icon-md" />
                              </Button>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={item.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, item.id, sec.id)}
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
                          className={cn(
                            "relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-admin-compact px-2 py-1.5 transition-all",
                            isDragOver
                              ? "bg-sky-950/30 ring-1 ring-sky-500/50"
                              : "hover:bg-admin-surface/40"
                          )}
                        >
                          <div className="absolute -left-5 top-1/2 w-4 h-px bg-slate-800" />

                          <div className="flex items-center gap-2.5">
                            <span
                              className="text-slate-500 hover:text-slate-300 cursor-grab active:cursor-grabbing transition"
                              title="Drag to sort or move to another section"
                              aria-label="Drag to sort or move to another section"
                            >
                              <GripVertical className="cms-icon-md" />
                            </span>
                            <div className="w-60 rounded-admin-compact border border-admin-border bg-admin-surface-subtle px-3.5 py-1.5 text-xs font-medium text-slate-200 truncate">
                              {menuLabel}
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-8 pl-7 sm:pl-0">
                            <span className="cms-text-code text-slate-400 min-w-[180px]">
                              Link: {formatSlugDisplay(item.slug, item.id)}
                            </span>
                            <Button
                              type="button"
                              variant="adminSecondary"
                              size="sm"
                              aria-label={`${tCommon("edit")} ${menuLabel}`}
                              onClick={() => handleStartEditItem(item)}
                            >
                              {tCommon("edit")}
                            </Button>
                          </div>
                        </div>
                      );
                    })}

                    {/* Inline Add Item Row */}
                    {isAddingHere && (
                      <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-3 rounded-admin-card border border-admin-accent bg-admin-surface p-3.5 shadow-admin-glow transition-all">
                        <div className="absolute -left-5 top-1/2 w-4 h-px bg-slate-800" />

                        <div className="flex items-center gap-2.5">
                          <span
                            className="text-slate-400"
                            title="Drag handle"
                            aria-label="Drag handle"
                          >
                            <GripVertical className="cms-icon-md" />
                          </span>
                          <Input
                            type="text"
                            value={editMenuTitle}
                            onChange={(e) => setEditMenuTitle(e.target.value)}
                            placeholder="Menu title (optional)"
                            size="sm"
                            variant="admin"
                            className="w-60"
                            aria-label={tCommon("title")}
                          />
                        </div>

                        <div className="flex flex-wrap items-center gap-2.5">
                          <div className="min-w-[240px]">
                            <NativeSelect
                              value={selectedPageId}
                              onChange={(e) => {
                                const nextId = e.target.value;
                                setSelectedPageId(nextId);
                                const nextPage = subPages.find(
                                  (p) => String(p.id) === nextId
                                );
                                if (nextPage && !editMenuTitle.trim()) {
                                  setEditMenuTitle(
                                    (nextPage as any).link_description ||
                                      nextPage.page_title
                                  );
                                }
                              }}
                              size="sm"
                              variant="admin"
                              aria-label={tCommon("select")}
                            >
                              <option value="">{tCommon("select")}</option>
                              {subPages
                                .filter((p) => Number(p.id) !== Number(sec.start_page_id))
                                .map((p) => (
                                  <option key={p.id} value={String(p.id)}>
                                    {p.page_title} (#{p.id})
                                  </option>
                                ))}
                            </NativeSelect>
                          </div>

                          <Button
                            type="button"
                            variant="adminPrimary"
                            size="sm"
                            disabled={isSaving || !selectedPageId}
                            onClick={() => handleSaveItem(sec.id, null)}
                          >
                            {isSaving ? tCommon("loading") : tCommon("save")}
                          </Button>

                          <Button
                            type="button"
                            variant="adminDestructive"
                            size="iconSm"
                            onClick={() => setAddingToSectionId(null)}
                            title={tCommon("cancel")}
                            aria-label={tCommon("cancel")}
                          >
                            <Trash2 className="cms-icon-md" />
                          </Button>
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
