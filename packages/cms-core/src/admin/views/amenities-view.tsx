"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import {
  Plus,
  Edit3,
  Trash2,
  Tag,
  Search,
  Loader2,
  GripVertical,
  Box,
} from "lucide-react";
import { AmenityItem } from "../../booking/types";
import {
  Alert,
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  FormField,
  Input,
} from "@cms/components/ui";

export interface AmenitiesViewProps {
  amenities?: AmenityItem[];
  onSaveAmenity?: (data: {
    id?: string;
    name: string;
    sort_order?: number;
  }) => Promise<AmenityItem[] | void>;
  onDeleteAmenity?: (id: string) => Promise<AmenityItem[] | void>;
  onReorderAmenities?: (orderedIds: string[]) => Promise<AmenityItem[] | void>;
}

export function AmenitiesView({
  amenities: initialAmenities = [],
  onSaveAmenity,
  onDeleteAmenity,
  onReorderAmenities,
}: AmenitiesViewProps) {
  const t = useTranslations("amenities");
  const tCommon = useTranslations("common");

  const [amenities, setAmenities] = useState<AmenityItem[]>(initialAmenities);

  useEffect(() => {
    setAmenities(initialAmenities);
  }, [initialAmenities]);

  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAmenity, setEditingAmenity] = useState<AmenityItem | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Safe delete states inside edit modal
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Drag and drop states
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const openCreateModal = () => {
    setEditingAmenity(null);
    setName("");
    setErrorMsg(null);
    setConfirmDelete(false);
    setIsModalOpen(true);
  };

  const openEditModal = (item: AmenityItem) => {
    setEditingAmenity(item);
    setName(item.name || "");
    setErrorMsg(null);
    setConfirmDelete(false);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingAmenity(null);
    setName("");
    setErrorMsg(null);
    setConfirmDelete(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg(t("nameRequired"));
      return;
    }

    setIsSaving(true);
    setErrorMsg(null);

    const calculatedSort = editingAmenity
      ? editingAmenity.sort_order
      : (amenities.length + 1) * 10;

    try {
      if (onSaveAmenity) {
        const res = await onSaveAmenity({
          id: editingAmenity?.id,
          name: name.trim(),
          sort_order: calculatedSort,
        });
        if (Array.isArray(res)) {
          setAmenities(res);
        }
      }
      closeModal();
    } catch (err: any) {
      setErrorMsg(err?.message || t("saveError"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editingAmenity) return;

    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }

    setIsDeleting(true);
    try {
      if (onDeleteAmenity) {
        const res = await onDeleteAmenity(editingAmenity.id);
        if (Array.isArray(res)) {
          setAmenities(res);
        }
      }
      closeModal();
    } catch (err: any) {
      setErrorMsg(err?.message || t("deleteError"));
    } finally {
      setIsDeleting(false);
    }
  };

  // Drag & drop handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverId !== id) {
      setDragOverId(id);
    }
  };

  const handleDrop = async (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    setDragOverId(null);
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null);
      return;
    }

    const currentList = [...amenities];
    const fromIndex = currentList.findIndex((a) => a.id === draggedId);
    const toIndex = currentList.findIndex((a) => a.id === targetId);
    if (fromIndex === -1 || toIndex === -1) {
      setDraggedId(null);
      return;
    }

    const [moved] = currentList.splice(fromIndex, 1);
    currentList.splice(toIndex, 0, moved);
    setDraggedId(null);

    // Optimistically update
    setAmenities(currentList);

    if (onReorderAmenities) {
      const res = await onReorderAmenities(currentList.map((a) => a.id));
      if (Array.isArray(res)) {
        setAmenities(res);
      }
    }
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverId(null);
  };

  const filteredAmenities = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return amenities;
    return amenities.filter((a) => (a.name || "").toLowerCase().includes(q));
  }, [amenities, searchQuery]);

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Tag className="w-6 h-6 text-sky-400" />
            <span>{t("title")}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {t("subtitle")}
          </p>
        </div>

        <Button
          type="button"
          variant="adminPrimary"
          size="sm"
          onClick={openCreateModal}
        >
          <Plus className="w-4 h-4" />
          <span>{t("newAmenity")}</span>
        </Button>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <Input
            variant="admin"
            size="sm"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("searchPlaceholder")}
            aria-label={t("searchPlaceholder")}
            className="pl-9"
          />
        </div>

        <div className="text-xs font-medium text-slate-400">
          {t("showing", { count: filteredAmenities.length, total: amenities.length })}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-medium">
                <th className="py-3 px-3 w-10"></th>
                <th className="py-3 px-4">{t("colName")}</th>
                <th className="py-3 px-4">{t("colConnected")}</th>
                <th className="py-3 px-4 text-right">{t("colActions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredAmenities.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-500">
                    <Tag className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                    {t("noAmenitiesFound")}
                  </td>
                </tr>
              ) : (
                filteredAmenities.map((item) => {
                  const isDragging = draggedId === item.id;
                  const isDragOver = dragOverId === item.id;

                  return (
                    <tr
                      key={item.id}
                      draggable={!searchQuery}
                      onDragStart={(e) => handleDragStart(e, item.id)}
                      onDragOver={(e) => handleDragOver(e, item.id)}
                      onDragLeave={() => dragOverId === item.id && setDragOverId(null)}
                      onDrop={(e) => handleDrop(e, item.id)}
                      onDragEnd={handleDragEnd}
                      className={`transition group ${
                        isDragging
                          ? "opacity-30 bg-slate-800/20"
                          : isDragOver
                          ? "bg-sky-500/15 border-t-2 border-sky-400"
                          : "hover:bg-slate-800/30"
                      }`}
                    >
                      <td className="py-3 px-3 text-slate-500">
                        {!searchQuery && (
                          <span
                            className="cursor-grab active:cursor-grabbing inline-flex p-1 rounded hover:text-slate-300 hover:bg-slate-800/60 transition"
                            title={t("dragToReorder")}
                          >
                            <GripVertical className="w-4 h-4" />
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 font-medium text-white">
                        <div className="flex items-center gap-2">
                          <Tag className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                          <span>{item.name}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-slate-300">
                        {item.object_count && item.object_count > 0 ? (
                          <Badge variant="adminSuccess" size="sm">
                            <Box className="w-3 h-3" />
                            <span>
                              {t("connectedCount", {
                                count: item.object_count,
                                plural: item.object_count === 1 ? "object" : "objects",
                              })}
                            </span>
                          </Badge>
                        ) : (
                          <span className="text-slate-500 text-[11px]">
                            {t("notActive")}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <Button
                          type="button"
                          variant="adminSecondary"
                          size="xs"
                          onClick={() => openEditModal(item)}
                        >
                          <Edit3 className="w-3.5 h-3.5 text-slate-400" />
                          <span>{tCommon("edit")}</span>
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Dialog */}
      <Dialog
        open={isModalOpen}
        onOpenChange={(open) => {
          if (!open) closeModal();
          else setIsModalOpen(true);
        }}
      >
        <DialogContent variant="admin" size="sm" className="p-0 overflow-hidden">
          <DialogHeader className="px-6 py-4 border-b border-slate-800 bg-slate-950/50 flex flex-row items-center justify-between space-y-0">
            <DialogTitle variant="admin" size="sm" className="flex items-center gap-2">
              <Tag className="w-5 h-5 text-sky-400" />
              <span>{editingAmenity ? t("modalEditTitle") : t("modalCreateTitle")}</span>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSave} className="p-6 space-y-4">
            {errorMsg && (
              <Alert variant="destructive">
                {errorMsg}
              </Alert>
            )}

            <FormField label={t("name")} required labelVariant="admin">
              <Input
                variant="admin"
                size="sm"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("namePlaceholder")}
              />
            </FormField>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
              {editingAmenity ? (
                confirmDelete ? (
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="adminDestructive"
                      size="sm"
                      disabled={isDeleting}
                      onClick={handleDelete}
                    >
                      {isDeleting && (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      )}
                      <span>{t("yesDelete")}</span>
                    </Button>
                    <Button
                      type="button"
                      variant="adminSecondary"
                      size="sm"
                      onClick={() => setConfirmDelete(false)}
                    >
                      {tCommon("cancel")}
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="adminOutlineDestructive"
                    size="sm"
                    onClick={() => setConfirmDelete(true)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{t("delete")}</span>
                  </Button>
                )
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="adminSecondary"
                  size="sm"
                  onClick={closeModal}
                >
                  {tCommon("cancel")}
                </Button>
                <Button
                  type="submit"
                  variant="adminPrimary"
                  size="sm"
                  disabled={isSaving}
                >
                  {isSaving && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  )}
                  <span>{t("save")}</span>
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
