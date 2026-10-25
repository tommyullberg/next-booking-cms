"use client";

import React, { useState, useEffect } from "react";
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
  onReorderCategoryTypes?: (
    orderedIds: string[]
  ) => Promise<CategoryTypeItem[] | void>;
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
    }>
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
  const [newCategoryNames, setNewCategoryNames] = useState<
    Record<string, string>
  >({});
  const [addingCategoryForType, setAddingCategoryForType] = useState<
    string | null
  >(null);

  // Edit existing Category state
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(
    null
  );
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
      prev.map((item) =>
        item.id === t.id
          ? { ...item, name: trimmed, is_multiple: editTypeIsMultiple }
          : item
      )
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

  const handleToggleTypeMode = async (
    t: CategoryTypeItem,
    isMultiple: boolean
  ) => {
    setTypes((prev) =>
      prev.map((item) =>
        item.id === t.id ? { ...item, is_multiple: isMultiple } : item
      )
    );
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
  const handleAddCategory = async (
    e: React.FormEvent,
    categoryTypeId: string
  ) => {
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
              categories: (t.categories || []).map((c) =>
                c.id === cat.id ? { ...c, name: trimmed } : c
              ),
            }
          : t
      )
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
          : t
      )
    );

    if (onDeleteCategory) {
      const res = await onDeleteCategory(cat.id);
      if (Array.isArray(res)) {
        setTypes(res);
      }
    }
  };

  // Drag & drop Category items (within same type or across types)
  const handleCategoryDragStart = (
    e: React.DragEvent,
    cat: CategoryItem
  ) => {
    e.stopPropagation();
    setDraggedCat({ id: cat.id, categoryTypeId: cat.category_type_id });
    e.dataTransfer.effectAllowed = "move";
  };

  const handleCategoryDragOver = (
    e: React.DragEvent,
    targetCatId: string
  ) => {
    e.preventDefault();
    e.stopPropagation();
    if (!draggedCat || draggedCat.id === targetCatId) return;
    setDragOverCatId(targetCatId);
  };

  const handleCategoryDropOnItem = async (
    e: React.DragEvent,
    targetType: CategoryTypeItem,
    targetCat: CategoryItem
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverCatId(null);

    if (!draggedCat || draggedCat.id === targetCat.id) {
      setDraggedCat(null);
      return;
    }

    const sourceType = types.find((t) => t.id === draggedCat.categoryTypeId);
    const movingCat = sourceType?.categories?.find(
      (c) => c.id === draggedCat.id
    );
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
        }))
      );
      const res = await onReorderCategories(payload);
      if (Array.isArray(res)) {
        setTypes(res);
      }
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Categories &amp; Types
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Create and sort Category Types and Categories for pages. Configure each Category Type as single-choice (radio) or multi-choice (checkbox).
          </p>
        </div>
      </div>

      {/* Create New Category Type Bar */}
      <form
        onSubmit={handleCreateCategoryType}
        className="rounded-2xl border border-slate-800/90 bg-slate-900/50 p-5 space-y-4"
      >
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
          <Layers className="w-4 h-4 text-sky-400" />
          <span>Add New Category Type</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          <div className="md:col-span-6">
            <input
              type="text"
              value={newTypeName}
              onChange={(e) => setNewTypeName(e.target.value)}
              placeholder="Category Type name (e.g. Page Topic, Accommodation Style, Season)..."
              className="w-full rounded-xl border border-slate-800 bg-slate-950/90 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none"
            />
          </div>

          {/* Selection Mode Toggle: Radio vs Checkbox */}
          <div className="md:col-span-4 flex items-center gap-2 bg-slate-950/90 border border-slate-800 rounded-xl p-1">
            <button
              type="button"
              onClick={() => setNewTypeIsMultiple(false)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg text-xs font-medium transition ${
                !newTypeIsMultiple
                  ? "bg-sky-500/15 text-sky-400 border border-sky-500/30"
                  : "text-slate-400 hover:text-slate-200 border border-transparent"
              }`}
            >
              <CircleDot className="w-3.5 h-3.5" />
              <span>Single (Radio)</span>
            </button>
            <button
              type="button"
              onClick={() => setNewTypeIsMultiple(true)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg text-xs font-medium transition ${
                newTypeIsMultiple
                  ? "bg-sky-500/15 text-sky-400 border border-sky-500/30"
                  : "text-slate-400 hover:text-slate-200 border border-transparent"
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>Multiple (Checkbox)</span>
            </button>
          </div>

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={isCreatingType || !newTypeName.trim()}
              className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-sky-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-sky-600/20 hover:bg-sky-500 transition disabled:opacity-50"
            >
              {isCreatingType ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              <span>Add Type</span>
            </button>
          </div>
        </div>
      </form>

      {/* List of Category Types */}
      {types.length === 0 ? (
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/30 p-10 text-center space-y-2">
          <Layers className="w-8 h-8 text-slate-600 mx-auto" />
          <div className="text-sm font-semibold text-slate-300">
            No Category Types created yet
          </div>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Create your first Category Type above, then add Categories underneath it to assign them to pages.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {types.map((typeItem) => {
            const categories = typeItem.categories || [];
            const isEditingThisType = editingTypeId === typeItem.id;
            const isDragOverThisType = dragOverTypeId === typeItem.id;

            return (
              <div
                key={typeItem.id}
                draggable={!isEditingThisType && !editingCategoryId}
                onDragStart={(e) => handleTypeDragStart(e, typeItem.id)}
                onDragOver={(e) => handleTypeDragOver(e, typeItem.id)}
                onDrop={(e) => handleTypeDrop(e, typeItem.id)}
                onDragEnd={() => {
                  setDraggedTypeId(null);
                  setDragOverTypeId(null);
                }}
                className={`rounded-2xl border bg-slate-900/40 overflow-hidden transition ${
                  isDragOverThisType
                    ? "border-sky-500 ring-1 ring-sky-500/30"
                    : "border-slate-800/90"
                }`}
              >
                {/* Category Type Header */}
                <div className="px-5 py-3.5 bg-slate-900/80 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span
                      className="cursor-grab active:cursor-grabbing text-slate-500 hover:text-slate-300"
                      title="Drag to reorder Category Type"
                    >
                      <GripVertical className="w-4 h-4" />
                    </span>

                    {isEditingThisType ? (
                      <div className="flex flex-wrap items-center gap-2 flex-1">
                        <input
                          type="text"
                          value={editTypeName}
                          onChange={(e) => setEditTypeName(e.target.value)}
                          className="rounded-lg border border-sky-500 bg-slate-950 px-3 py-1.5 text-xs text-white focus:outline-none"
                          autoFocus
                        />
                        <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg p-0.5">
                          <button
                            type="button"
                            onClick={() => setEditTypeIsMultiple(false)}
                            className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition ${
                              !editTypeIsMultiple
                                ? "bg-sky-500/20 text-sky-400"
                                : "text-slate-400 hover:text-white"
                            }`}
                          >
                            <CircleDot className="w-3 h-3" />
                            <span>Radio</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditTypeIsMultiple(true)}
                            className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition ${
                              editTypeIsMultiple
                                ? "bg-sky-500/20 text-sky-400"
                                : "text-slate-400 hover:text-white"
                            }`}
                          >
                            <CheckSquare className="w-3 h-3" />
                            <span>Checkbox</span>
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleSaveEditType(typeItem)}
                          className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 transition"
                          title="Save"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingTypeId(null)}
                          className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition"
                          title="Cancel"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-sm font-semibold text-white">
                          {typeItem.name}
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono">
                          ({categories.length}{" "}
                          {categories.length === 1 ? "category" : "categories"})
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Quick Mode Selector & Actions */}
                  {!isEditingThisType && (
                    <div className="flex items-center gap-2.5">
                      <div className="flex items-center bg-slate-950/90 border border-slate-800 rounded-lg p-0.5">
                        <button
                          type="button"
                          onClick={() => handleToggleTypeMode(typeItem, false)}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition ${
                            !typeItem.is_multiple
                              ? "bg-sky-500/15 text-sky-400 border border-sky-500/30"
                              : "text-slate-400 hover:text-slate-200 border border-transparent"
                          }`}
                          title="Single selection (Radio buttons)"
                        >
                          <CircleDot className="w-3 h-3" />
                          <span>Single (Radio)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleTypeMode(typeItem, true)}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition ${
                            typeItem.is_multiple
                              ? "bg-sky-500/15 text-sky-400 border border-sky-500/30"
                              : "text-slate-400 hover:text-slate-200 border border-transparent"
                          }`}
                          title="Multiple selection (Checkboxes)"
                        >
                          <CheckSquare className="w-3 h-3" />
                          <span>Multiple (Checkbox)</span>
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => startEditingType(typeItem)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                        title="Rename Category Type"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteType(typeItem.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition"
                        title="Delete Category Type"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Categories List inside this CategoryType */}
                <div className="p-4 space-y-3">
                  {categories.length === 0 ? (
                    <div className="text-xs text-slate-500 italic px-2 py-1">
                      No categories under this type yet. Add one below.
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {categories.map((cat) => {
                        const isEditingThisCat = editingCategoryId === cat.id;
                        const isDragOverCat = dragOverCatId === cat.id;

                        return (
                          <div
                            key={cat.id}
                            draggable={!isEditingThisCat}
                            onDragStart={(e) =>
                              handleCategoryDragStart(e, cat)
                            }
                            onDragOver={(e) =>
                              handleCategoryDragOver(e, cat.id)
                            }
                            onDrop={(e) =>
                              handleCategoryDropOnItem(e, typeItem, cat)
                            }
                            onDragEnd={() => {
                              setDraggedCat(null);
                              setDragOverCatId(null);
                            }}
                            className={`flex items-center justify-between gap-3 rounded-xl border px-3.5 py-2 text-xs transition ${
                              isDragOverCat
                                ? "border-sky-500 bg-sky-500/10"
                                : "border-slate-800/80 bg-slate-950/60 hover:border-slate-700/80"
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              <span
                                className="cursor-grab active:cursor-grabbing text-slate-500 hover:text-slate-300"
                                title="Drag to reorder category"
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
                                  <input
                                    type="text"
                                    value={editCategoryName}
                                    onChange={(e) =>
                                      setEditCategoryName(e.target.value)
                                    }
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        e.preventDefault();
                                        handleSaveEditCategory(cat);
                                      } else if (e.key === "Escape") {
                                        setEditingCategoryId(null);
                                      }
                                    }}
                                    className="flex-1 rounded-lg border border-sky-500 bg-slate-900 px-2.5 py-1 text-xs text-white focus:outline-none"
                                    autoFocus
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleSaveEditCategory(cat)}
                                    className="p-1 rounded bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingCategoryId(null)}
                                    className="p-1 rounded bg-slate-800 text-slate-400 hover:text-white"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <span className="text-slate-200 font-medium truncate">
                                  {cat.name}
                                </span>
                              )}
                            </div>

                            {!isEditingThisCat && (
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => startEditingCategory(cat)}
                                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                                  title="Rename category"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteCategoryItem(cat)}
                                  className="p-1 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition"
                                  title="Delete category"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Add Category Input Row */}
                  <form
                    onSubmit={(e) => handleAddCategory(e, typeItem.id)}
                    className="flex items-center gap-2 pt-1"
                  >
                    <div className="relative flex-1">
                      <Tag className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={newCategoryNames[typeItem.id] || ""}
                        onChange={(e) =>
                          setNewCategoryNames((prev) => ({
                            ...prev,
                            [typeItem.id]: e.target.value,
                          }))
                        }
                        placeholder={`Add category to "${typeItem.name}"...`}
                        className="w-full rounded-xl border border-slate-800 bg-slate-950/80 pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={
                        addingCategoryForType === typeItem.id ||
                        !(newCategoryNames[typeItem.id] || "").trim()
                      }
                      className="flex items-center gap-1.5 rounded-xl border border-sky-500/30 bg-sky-500/10 hover:bg-sky-500/20 px-3.5 py-2 text-xs font-medium text-sky-400 transition disabled:opacity-40"
                    >
                      {addingCategoryForType === typeItem.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Plus className="w-3.5 h-3.5" />
                      )}
                      <span>Add Category</span>
                    </button>
                  </form>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
