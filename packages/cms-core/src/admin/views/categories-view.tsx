"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  Plus,
  GripVertical,
  Trash2,
  Edit2,
  Check,
  X,
  Layers,
  Tag,
  CircleDot,
  CheckSquare,
  Loader2,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  IconButton,
  Input,
  SegmentedControl,
} from "@cms/components/ui";
import { cn } from "@cms/utils/cn";

export interface CategoryItem {
  id: string;
  category_type_id: string;
  name: string;
  sort_order: number;
}

export interface CategoryTypeItem {
  id: string;
  name: string;
  is_multiple: boolean;
  sort_order: number;
  categories?: CategoryItem[];
}

export interface CategoriesViewProps {
  categoryTypes: CategoryTypeItem[];
  onSaveCategoryType?: (data: {
    id?: string;
    name: string;
    isMultiple: boolean;
    sortOrder?: number;
  }) => Promise<CategoryTypeItem[] | void>;
  onDeleteCategoryType?: (id: string) => Promise<CategoryTypeItem[] | void>;
  onReorderCategoryTypes?: (orderedIds: string[]) => Promise<CategoryTypeItem[] | void>;
  onSaveCategory?: (data: {
    id?: string;
    categoryTypeId: string;
    name: string;
    sortOrder?: number;
  }) => Promise<CategoryTypeItem[] | void>;
  onDeleteCategory?: (id: string) => Promise<CategoryTypeItem[] | void>;
  onReorderCategories?: (
    items: Array<{
      id: string;
      categoryTypeId: string;
      sortOrder: number;
    }>,
  ) => Promise<CategoryTypeItem[] | void>;
}

export function CategoriesView({
  categoryTypes: initialTypes,
  onSaveCategoryType,
  onDeleteCategoryType,
  onReorderCategoryTypes,
  onSaveCategory,
  onDeleteCategory,
  onReorderCategories,
}: CategoriesViewProps) {
  const t = useTranslations("categories");
  const tCommon = useTranslations("common");

  const [types, setTypes] = useState<CategoryTypeItem[]>(initialTypes);

  useEffect(() => {
    setTypes(initialTypes);
  }, [initialTypes]);

  // Create new CategoryType form state
  const [newTypeName, setNewTypeName] = useState("");
  const [newTypeIsMultiple, setNewTypeIsMultiple] = useState<boolean>(false);
  const [isCreatingType, setIsCreatingType] = useState(false);

  // Edit existing CategoryType state
  const [editingTypeId, setEditingTypeId] = useState<string | null>(null);
  const [editTypeName, setEditTypeName] = useState("");
  const [editTypeIsMultiple, setEditTypeIsMultiple] = useState<boolean>(false);

  // Create new Category per CategoryType map
  const [newCategoryNames, setNewCategoryNames] = useState<Record<string, string>>({});
  const [addingCategoryForType, setAddingCategoryForType] = useState<string | null>(null);

  // Edit existing Category state
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editCategoryName, setEditCategoryName] = useState("");

  // Drag-and-drop for CategoryType cards
  const [draggedTypeId, setDraggedTypeId] = useState<string | null>(null);
  const [dragOverTypeId, setDragOverTypeId] = useState<string | null>(null);

  // Drag-and-drop for Category items
  const [draggedCat, setDraggedCat] = useState<{
    id: string;
    categoryTypeId: string;
  } | null>(null);
  const [dragOverCatId, setDragOverCatId] = useState<string | null>(null);

  const handleCreateCategoryType = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newTypeName.trim();
    if (!trimmed) return;

    setIsCreatingType(true);
    try {
      if (onSaveCategoryType) {
        const res = await onSaveCategoryType({
          name: trimmed,
          isMultiple: newTypeIsMultiple,
          sortOrder: types.length + 1,
        });
        if (Array.isArray(res)) {
          setTypes(res);
        }
      }
      setNewTypeName("");
      setNewTypeIsMultiple(false);
    } finally {
      setIsCreatingType(false);
    }
  };

  const startEditingType = (t: CategoryTypeItem) => {
    setEditingTypeId(t.id);
    setEditTypeName(t.name);
    setEditTypeIsMultiple(Boolean(t.is_multiple));
  };

  const handleSaveEditType = async (t: CategoryTypeItem) => {
    const trimmed = editTypeName.trim();
    if (!trimmed) return;

    setTypes((prev) =>
      prev.map((item) => (item.id === t.id ? { ...item, name: trimmed, is_multiple: editTypeIsMultiple } : item)),
    );
    setEditingTypeId(null);

    if (onSaveCategoryType) {
      const res = await onSaveCategoryType({
        id: t.id,
        name: trimmed,
        isMultiple: editTypeIsMultiple,
        sortOrder: t.sort_order,
      });
      if (Array.isArray(res)) {
        setTypes(res);
      }
    }
  };

  const handleToggleTypeMode = async (t: CategoryTypeItem, isMultiple: boolean) => {
    setTypes((prev) => prev.map((item) => (item.id === t.id ? { ...item, is_multiple: isMultiple } : item)));
    if (onSaveCategoryType) {
      const res = await onSaveCategoryType({
        id: t.id,
        name: t.name,
        isMultiple,
        sortOrder: t.sort_order,
      });
      if (Array.isArray(res)) {
        setTypes(res);
      }
    }
  };

  const handleDeleteType = async (id: string) => {
    setTypes((prev) => prev.filter((item) => item.id !== id));
    if (onDeleteCategoryType) {
      const res = await onDeleteCategoryType(id);
      if (Array.isArray(res)) {
        setTypes(res);
      }
    }
  };

  // Drag & drop CategoryType
  const handleTypeDragStart = (e: React.DragEvent, id: string) => {
    setDraggedTypeId(id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleTypeDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedTypeId || draggedTypeId === targetId) return;
    setDragOverTypeId(targetId);
  };

  const handleTypeDrop = async (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    setDragOverTypeId(null);
    if (!draggedTypeId || draggedTypeId === targetId) {
      setDraggedTypeId(null);
      return;
    }

    const currentList = [...types];
    const fromIndex = currentList.findIndex((t) => t.id === draggedTypeId);
    const toIndex = currentList.findIndex((t) => t.id === targetId);
    if (fromIndex === -1 || toIndex === -1) {
      setDraggedTypeId(null);
      return;
    }

    const [moved] = currentList.splice(fromIndex, 1);
    currentList.splice(toIndex, 0, moved);

    const reindexed = currentList.map((t, idx) => ({
      ...t,
      sort_order: idx + 1,
    }));

    setTypes(reindexed);
    setDraggedTypeId(null);

    if (onReorderCategoryTypes) {
      const res = await onReorderCategoryTypes(reindexed.map((t) => t.id));
      if (Array.isArray(res)) {
        setTypes(res);
      }
    }
  };

  // Category CRUD
  const handleAddCategory = async (e: React.FormEvent, categoryTypeId: string) => {
    e.preventDefault();
    const rawName = newCategoryNames[categoryTypeId] || "";
    const trimmed = rawName.trim();
    if (!trimmed) return;

    setAddingCategoryForType(categoryTypeId);
    try {
      const targetType = types.find((t) => t.id === categoryTypeId);
      const nextSort = (targetType?.categories?.length || 0) + 1;

      if (onSaveCategory) {
        const res = await onSaveCategory({
          categoryTypeId,
          name: trimmed,
          sortOrder: nextSort,
        });
        if (Array.isArray(res)) {
          setTypes(res);
        }
      }
      setNewCategoryNames((prev) => ({ ...prev, [categoryTypeId]: "" }));
    } finally {
      setAddingCategoryForType(null);
    }
  };

  const startEditingCategory = (cat: CategoryItem) => {
    setEditingCategoryId(cat.id);
    setEditCategoryName(cat.name);
  };

  const handleSaveEditCategory = async (cat: CategoryItem) => {
    const trimmed = editCategoryName.trim();
    if (!trimmed) return;

    setTypes((prev) =>
      prev.map((t) =>
        t.id === cat.category_type_id
          ? {
              ...t,
              categories: (t.categories || []).map((c) => (c.id === cat.id ? { ...c, name: trimmed } : c)),
            }
          : t,
      ),
    );
    setEditingCategoryId(null);

    if (onSaveCategory) {
      const res = await onSaveCategory({
        id: cat.id,
        categoryTypeId: cat.category_type_id,
        name: trimmed,
        sortOrder: cat.sort_order,
      });
      if (Array.isArray(res)) {
        setTypes(res);
      }
    }
  };

  const handleDeleteCategoryItem = async (cat: CategoryItem) => {
    setTypes((prev) =>
      prev.map((t) =>
        t.id === cat.category_type_id
          ? {
              ...t,
              categories: (t.categories || []).filter((c) => c.id !== cat.id),
            }
          : t,
      ),
    );

    if (onDeleteCategory) {
      const res = await onDeleteCategory(cat.id);
      if (Array.isArray(res)) {
        setTypes(res);
      }
    }
  };

  // Drag & drop Category items (within same type or across types)
  const handleCategoryDragStart = (e: React.DragEvent, cat: CategoryItem) => {
    e.stopPropagation();
    setDraggedCat({ id: cat.id, categoryTypeId: cat.category_type_id });
    e.dataTransfer.effectAllowed = "move";
  };

  const handleCategoryDragOver = (e: React.DragEvent, targetCatId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!draggedCat || draggedCat.id === targetCatId) return;
    setDragOverCatId(targetCatId);
  };

  const handleCategoryDropOnItem = async (
    e: React.DragEvent,
    targetType: CategoryTypeItem,
    targetCat: CategoryItem,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverCatId(null);

    if (!draggedCat || draggedCat.id === targetCat.id) {
      setDraggedCat(null);
      return;
    }

    const sourceType = types.find((t) => t.id === draggedCat.categoryTypeId);
    const movingCat = sourceType?.categories?.find((c) => c.id === draggedCat.id);
    if (!movingCat) {
      setDraggedCat(null);
      return;
    }

    const updatedTypes = types.map((t) => {
      let list = [...(t.categories || [])];
      if (t.id === draggedCat.categoryTypeId) {
        list = list.filter((c) => c.id !== draggedCat.id);
      }
      if (t.id === targetType.id) {
        const targetIndex = list.findIndex((c) => c.id === targetCat.id);
        const inserted: CategoryItem = {
          ...movingCat,
          category_type_id: targetType.id,
        };
        if (targetIndex === -1) {
          list.push(inserted);
        } else {
          list.splice(targetIndex, 0, inserted);
        }
      }
      return {
        ...t,
        categories: list.map((c, idx) => ({ ...c, sort_order: idx + 1 })),
      };
    });

    setTypes(updatedTypes);
    setDraggedCat(null);

    if (onReorderCategories) {
      const payload = updatedTypes.flatMap((t) =>
        (t.categories || []).map((c, idx) => ({
          id: c.id,
          categoryTypeId: t.id,
          sortOrder: idx + 1,
        })),
      );
      const res = await onReorderCategories(payload);
      if (Array.isArray(res)) {
        setTypes(res);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">{t("title")}</h1>
          <p className="text-xs text-slate-400 mt-1">{t("subtitle")}</p>
        </div>
      </div>

      {/* Create New Category Type Bar */}
      <Card variant="admin" className="p-5 space-y-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
          <Layers className="w-4 h-4 text-sky-400" />
          <span>{t("addType")}</span>
        </div>

        <form onSubmit={handleCreateCategoryType} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex-1 min-w-0">
            <Input
              type="text"
              value={newTypeName}
              onChange={(e) => setNewTypeName(e.target.value)}
              placeholder={t("typeNamePlaceholder")}
              aria-label={t("typeNamePlaceholder")}
              size="sm"
              variant="admin"
            />
          </div>

          {/* Selection Mode Toggle: Radio vs Checkbox */}
          <div className="shrink-0 flex items-center">
            <SegmentedControl
              size="sm"
              aria-label={`${t("addType")}: ${t("singleRadio")} / ${t("multipleCheckbox")}`}
              value={newTypeIsMultiple ? "multiple" : "single"}
              onChange={(val) => setNewTypeIsMultiple(val === "multiple")}
              options={[
                {
                  value: "single",
                  label: t("singleRadio"),
                  icon: <CircleDot className="w-3.5 h-3.5" />,
                },
                {
                  value: "multiple",
                  label: t("multipleCheckbox"),
                  icon: <CheckSquare className="w-3.5 h-3.5" />,
                },
              ]}
              className="w-full sm:w-auto"
            />
          </div>

          <Button
            type="submit"
            variant="adminPrimary"
            size="sm"
            disabled={isCreatingType || !newTypeName.trim()}
            className="w-full sm:w-auto shrink-0"
          >
            {isCreatingType ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            <span>{t("addType")}</span>
          </Button>
        </form>
      </Card>

      {/* List of Category Types */}
      {types.length === 0 ? (
        <Card variant="adminSubtle" className="p-10 text-center space-y-2">
          <Layers className="w-8 h-8 text-slate-600 mx-auto" />
          <div className="text-sm font-semibold text-slate-300">{t("noTypesCreated")}</div>
          <p className="text-xs text-slate-500 max-w-md mx-auto">{t("noTypesHelp")}</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {types.map((typeItem) => {
            const categories = typeItem.categories || [];
            const isEditingThisType = editingTypeId === typeItem.id;
            const isDragOverThisType = dragOverTypeId === typeItem.id;

            return (
              <Card
                key={typeItem.id}
                variant="admin"
                draggable={!isEditingThisType && !editingCategoryId}
                onDragStart={(e) => handleTypeDragStart(e, typeItem.id)}
                onDragOver={(e) => handleTypeDragOver(e, typeItem.id)}
                onDrop={(e) => handleTypeDrop(e, typeItem.id)}
                onDragEnd={() => {
                  setDraggedTypeId(null);
                  setDragOverTypeId(null);
                }}
                className={cn(
                  "overflow-hidden transition",
                  isDragOverThisType && "border-sky-500 ring-1 ring-sky-500/30"
                )}
              >
                {/* Category Type Header */}
                <div className="px-5 py-3.5 bg-slate-900/80 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span
                      className="cursor-grab active:cursor-grabbing text-slate-500 hover:text-slate-300"
                      title={t("dragReorderTypeTooltip")}
                      aria-label={t("dragReorderTypeTooltip")}
                    >
                      <GripVertical className="w-4 h-4" />
                    </span>

                    {isEditingThisType ? (
                      <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
                        <Input
                          type="text"
                          value={editTypeName}
                          onChange={(e) => setEditTypeName(e.target.value)}
                          size="sm"
                          variant="admin"
                          className="flex-1 min-w-[140px] max-w-xs"
                          aria-label="Category type name"
                          autoFocus
                        />
                        <SegmentedControl
                          size="sm"
                          aria-label={`${editTypeName || "Category type"} mode`}
                          value={editTypeIsMultiple ? "multiple" : "single"}
                          onChange={(val) => setEditTypeIsMultiple(val === "multiple")}
                          options={[
                            { value: "single", label: t("radio"), icon: <CircleDot className="w-3 h-3" /> },
                            { value: "multiple", label: t("checkbox"), icon: <CheckSquare className="w-3 h-3" /> },
                          ]}
                          className="shrink-0"
                        />
                        <div className="flex items-center gap-1.5 shrink-0">
                          <IconButton
                            type="button"
                            variant="adminPrimary"
                            size="sm"
                            onClick={() => handleSaveEditType(typeItem)}
                            title={tCommon("save")}
                            aria-label={tCommon("save")}
                          >
                            <Check className="w-3.5 h-3.5" />
                          </IconButton>
                          <IconButton
                            type="button"
                            variant="adminSecondary"
                            size="sm"
                            onClick={() => setEditingTypeId(null)}
                            title={tCommon("cancel")}
                            aria-label={tCommon("cancel")}
                          >
                            <X className="w-3.5 h-3.5" />
                          </IconButton>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 flex-wrap min-w-0">
                        <span className="text-sm font-semibold text-white truncate">{typeItem.name}</span>
                        <Badge variant="adminMuted" size="sm" className="font-mono shrink-0">
                          {categories.length} {categories.length === 1 ? t("categorySingle") : t("categoryPlural")}
                        </Badge>
                      </div>
                    )}
                  </div>

                  {/* Quick Mode Selector & Actions */}
                  {!isEditingThisType && (
                    <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
                      <SegmentedControl
                        size="sm"
                        aria-label={`${typeItem.name} ${t("singleRadio")} / ${t("multipleCheckbox")}`}
                        value={typeItem.is_multiple ? "multiple" : "single"}
                        onChange={(val) => handleToggleTypeMode(typeItem, val === "multiple")}
                        options={[
                          { value: "single", label: t("singleRadio"), icon: <CircleDot className="w-3 h-3" /> },
                          { value: "multiple", label: t("multipleCheckbox"), icon: <CheckSquare className="w-3 h-3" /> },
                        ]}
                        className="shrink-0"
                      />

                      <IconButton
                        type="button"
                        variant="adminGhost"
                        size="sm"
                        onClick={() => startEditingType(typeItem)}
                        title={t("renameTypeTooltip")}
                        aria-label={`${t("renameTypeTooltip")}: ${typeItem.name}`}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </IconButton>

                      <IconButton
                        type="button"
                        variant="adminGhostDestructive"
                        size="sm"
                        onClick={() => handleDeleteType(typeItem.id)}
                        title={t("deleteTypeTooltip")}
                        aria-label={`${t("deleteTypeTooltip")}: ${typeItem.name}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </IconButton>
                    </div>
                  )}
                </div>

                {/* Categories List inside this CategoryType */}
                <div className="p-4 space-y-3">
                  {categories.length === 0 ? (
                    <div className="text-xs text-slate-500 italic px-2 py-1">{t("noCategoriesYet")}</div>
                  ) : (
                    <div className="space-y-1.5">
                      {categories.map((cat) => {
                        const isEditingThisCat = editingCategoryId === cat.id;
                        const isDragOverCat = dragOverCatId === cat.id;

                        return (
                          <div
                            key={cat.id}
                            draggable={!isEditingThisCat}
                            onDragStart={(e) => handleCategoryDragStart(e, cat)}
                            onDragOver={(e) => handleCategoryDragOver(e, cat.id)}
                            onDrop={(e) => handleCategoryDropOnItem(e, typeItem, cat)}
                            onDragEnd={() => {
                              setDraggedCat(null);
                              setDragOverCatId(null);
                            }}
                            className={cn(
                              "flex items-center justify-between gap-3 rounded-admin-compact border px-3.5 py-2 text-xs transition",
                              isDragOverCat
                                ? "border-sky-500 bg-sky-500/10"
                                : "border-admin-border/80 bg-admin-surface-subtle hover:border-admin-border-hover"
                            )}
                          >
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              <span
                                className="cursor-grab active:cursor-grabbing text-slate-500 hover:text-slate-300"
                                title={t("dragReorderCategoryTooltip")}
                                aria-label={t("dragReorderCategoryTooltip")}
                              >
                                <GripVertical className="w-3.5 h-3.5" />
                              </span>

                              {typeItem.is_multiple ? (
                                <CheckSquare className="w-3.5 h-3.5 text-sky-400/80 shrink-0" />
                              ) : (
                                <CircleDot className="w-3.5 h-3.5 text-sky-400/80 shrink-0" />
                              )}

                              {isEditingThisCat ? (
                                <div className="flex items-center gap-2 flex-1">
                                  <Input
                                    type="text"
                                    value={editCategoryName}
                                    onChange={(e) => setEditCategoryName(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        e.preventDefault();
                                        handleSaveEditCategory(cat);
                                      } else if (e.key === "Escape") {
                                        setEditingCategoryId(null);
                                      }
                                    }}
                                    size="sm"
                                    variant="admin"
                                    className="flex-1"
                                    aria-label={t("categorySingle")}
                                    autoFocus
                                  />
                                  <Button
                                    type="button"
                                    variant="adminPrimary"
                                    size="iconSm"
                                    onClick={() => handleSaveEditCategory(cat)}
                                    title={tCommon("save")}
                                    aria-label={tCommon("save")}
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="adminSecondary"
                                    size="iconSm"
                                    onClick={() => setEditingCategoryId(null)}
                                    title={tCommon("cancel")}
                                    aria-label={tCommon("cancel")}
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
                              ) : (
                                <span className="text-slate-200 font-medium truncate">{cat.name}</span>
                              )}
                            </div>

                            {!isEditingThisCat && (
                              <div className="flex items-center gap-1">
                                <Button
                                  type="button"
                                  variant="adminGhost"
                                  size="iconSm"
                                  onClick={() => startEditingCategory(cat)}
                                  title={t("renameCategoryTooltip")}
                                  aria-label={`${t("renameCategoryTooltip")}: ${cat.name}`}
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="adminGhostDestructive"
                                  size="iconSm"
                                  onClick={() => handleDeleteCategoryItem(cat)}
                                  title={t("deleteCategoryTooltip")}
                                  aria-label={`${t("deleteCategoryTooltip")}: ${cat.name}`}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Add Category Input Row */}
                  <form onSubmit={(e) => handleAddCategory(e, typeItem.id)} className="flex items-center gap-2 pt-1">
                    <div className="relative flex-1">
                      <Tag className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <Input
                        type="text"
                        value={newCategoryNames[typeItem.id] || ""}
                        onChange={(e) =>
                          setNewCategoryNames((prev) => ({
                            ...prev,
                            [typeItem.id]: e.target.value,
                          }))
                        }
                        placeholder={t("addCategoryPlaceholder", { name: typeItem.name })}
                        aria-label={t("addCategoryPlaceholder", { name: typeItem.name })}
                        size="sm"
                        variant="admin"
                        className="pl-9"
                      />
                    </div>
                    <Button
                      type="submit"
                      variant="adminSecondary"
                      size="sm"
                      disabled={addingCategoryForType === typeItem.id || !(newCategoryNames[typeItem.id] || "").trim()}
                    >
                      {addingCategoryForType === typeItem.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Plus className="w-3.5 h-3.5" />
                      )}
                      <span>{t("addItem")}</span>
                    </Button>
                  </form>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
