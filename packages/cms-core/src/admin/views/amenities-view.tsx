"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Edit3,
  Trash2,
  Tag,
  Search,
  CheckCircle2,
  XCircle,
  X,
  Loader2,
  GripVertical,
  Box,
} from "lucide-react";
import { AmenityItem } from "../../booking/types";

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
      setErrorMsg("Amenity name is required.");
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
      setErrorMsg(err?.message || "Failed to save amenity.");
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
      setErrorMsg(err?.message || "Failed to delete amenity.");
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
            <span>Amenities (Förnödenheter)</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage features and appliances. Drag and drop to sort order.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-sky-600/20 hover:bg-sky-500 transition"
        >
          <Plus className="w-4 h-4" />
          <span>New Amenity</span>
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search amenities..."
            className="w-full bg-slate-900/60 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition"
          />
        </div>

        <div className="text-xs font-medium text-slate-400">
          Showing {filteredAmenities.length} of {amenities.length} amenities
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-medium">
                <th className="py-3 px-3 w-10"></th>
                <th className="py-3 px-4">Amenity Name</th>
                <th className="py-3 px-4">Connected Objects</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredAmenities.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-500">
                    <Tag className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                    No amenities found matching your criteria.
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
                            title="Drag to reorder amenity"
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
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <Box className="w-3 h-3" />
                            <span>
                              {item.object_count}{" "}
                              {item.object_count === 1 ? "object" : "objects"}{" "}
                              connected
                            </span>
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[11px]">
                            Not active on any object
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => openEditModal(item)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:border-slate-600 hover:bg-slate-700 hover:text-white transition"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-slate-400" />
                          <span>Edit</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-sky-400" />
                <h2 className="text-sm font-semibold text-white">
                  {editingAmenity ? "Edit Amenity" : "New Amenity"}
                </h2>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              {errorMsg && (
                <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
                  <XCircle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-200">
                  Amenity Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Havsutsikt, Diskmaskin, Kolgrill"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
                {editingAmenity ? (
                  confirmDelete ? (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={isDeleting}
                        onClick={handleDelete}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-500 disabled:opacity-50 transition"
                      >
                        {isDeleting && (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        )}
                        <span>Yes, Delete</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(false)}
                        className="rounded-xl border border-slate-800 bg-slate-800/60 px-2.5 py-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(true)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-400 hover:bg-red-500/20 hover:text-red-300 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  )
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="rounded-xl border border-slate-800 bg-slate-800/60 px-4 py-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-sky-600/20 hover:bg-sky-500 disabled:opacity-50 transition"
                  >
                    {isSaving && (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    )}
                    <span>Save Amenity</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
