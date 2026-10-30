"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Edit3,
  Trash2,
  Sparkles,
  Search,
  CheckCircle2,
  XCircle,
  X,
  Loader2,
  Image as ImageIcon,
  Box,
  Layers,
  Filter,
  ChevronDown,
  Check,
  GripVertical,
} from "lucide-react";
import { BookingOptionalItem } from "../../booking/types";
import { BookingObjectItem } from "./booking-objects-view";
import { MediaItem } from "./media-view";
import { ModalPortal } from "../../components/ui/modal-portal";

export type OptionalItem = BookingOptionalItem;

export interface OptionalsViewProps {
  optionals?: OptionalItem[];
  objects?: BookingObjectItem[];
  media?: MediaItem[];
  onSaveOptional?: (data: {
    id?: string;
    name: string;
    description?: string;
    image_url?: string;
    object_id?: string | null;
    is_active?: boolean;
    price_hour?: number;
    price_day?: number;
    price_sun_thu?: number;
    price_thu_sun?: number;
    price_week?: number;
    sort_order?: number;
  }) => Promise<OptionalItem[] | void>;
  onDeleteOptional?: (id: string) => Promise<OptionalItem[] | void>;
  onReorderOptionals?: (orderedIds: string[]) => Promise<OptionalItem[] | void>;
}

export function OptionalsView({
  optionals: initialOptionals = [],
  objects = [],
  media = [],
  onSaveOptional,
  onDeleteOptional,
  onReorderOptionals,
}: OptionalsViewProps) {
  const [optionals, setOptionals] = useState<OptionalItem[]>(initialOptionals);

  useEffect(() => {
    setOptionals(initialOptionals);
  }, [initialOptionals]);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedObjectFilter, setSelectedObjectFilter] = useState<string>("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOptional, setEditingOptional] = useState<OptionalItem | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [objectId, setObjectId] = useState<string>("");
  const [isActive, setIsActive] = useState(true);
  const [priceHour, setPriceHour] = useState<number>(0);
  const [priceDay, setPriceDay] = useState<number>(0);
  const [priceSunThu, setPriceSunThu] = useState<number>(0);
  const [priceThuSun, setPriceThuSun] = useState<number>(0);
  const [priceWeek, setPriceWeek] = useState<number>(0);

  // Drag and drop states
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  // Media picker states
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [mediaSearchQuery, setMediaSearchQuery] = useState("");
  const [showManualUrl, setShowManualUrl] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

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

    const currentList = [...optionals];
    const fromIndex = currentList.findIndex((o) => o.id === draggedId);
    const toIndex = currentList.findIndex((o) => o.id === targetId);
    if (fromIndex === -1 || toIndex === -1) {
      setDraggedId(null);
      return;
    }

    const [moved] = currentList.splice(fromIndex, 1);
    currentList.splice(toIndex, 0, moved);
    setDraggedId(null);

    // Optimistically update
    setOptionals(currentList);

    if (onReorderOptionals) {
      const res = await onReorderOptionals(currentList.map((o) => o.id));
      if (Array.isArray(res)) {
        setOptionals(res);
      }
    }
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverId(null);
  };

  // Filter media files that are images (excluding documents)
  const imageMedia = useMemo(() => {
    return (media || []).filter((item) => {
      const fn = (item.file_name || "").toLowerCase();
      const url = (item.file_url || "").toLowerCase();
      return (
        !fn.endsWith(".pdf") &&
        !url.endsWith(".pdf") &&
        !fn.endsWith(".doc") &&
        !url.endsWith(".docx")
      );
    });
  }, [media]);

  const filteredMedia = useMemo(() => {
    const q = mediaSearchQuery.toLowerCase().trim();
    if (!q) return imageMedia;
    return imageMedia.filter((m) =>
      (m.file_name || "").toLowerCase().includes(q)
    );
  }, [imageMedia, mediaSearchQuery]);

  const selectedMediaItem = useMemo(() => {
    if (!imageUrl) return null;
    return (media || []).find((m) => m.file_url === imageUrl);
  }, [media, imageUrl]);

  const openCreateModal = () => {
    setEditingOptional(null);
    setName("");
    setDescription("");
    setImageUrl("");
    setObjectId("");
    setIsActive(true);
    setPriceHour(0);
    setPriceDay(0);
    setPriceSunThu(0);
    setPriceThuSun(0);
    setPriceWeek(0);
    setIsMediaPickerOpen(false);
    setMediaSearchQuery("");
    setShowManualUrl(false);
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const openEditModal = (item: OptionalItem) => {
    setEditingOptional(item);
    setName(item.name || "");
    setDescription(item.description || "");
    const img = item.image_url || "";
    setImageUrl(img);
    setObjectId(item.object_id || "");
    setIsActive(item.is_active !== undefined ? item.is_active : true);
    setPriceHour(item.price_hour ?? 0);
    setPriceDay(item.price_day ?? 0);
    setPriceSunThu(item.price_sun_thu ?? 0);
    setPriceThuSun(item.price_thu_sun ?? 0);
    setPriceWeek(item.price_week ?? 0);
    setIsMediaPickerOpen(false);
    setMediaSearchQuery("");
    // If image exists and does not match a media item, open manual URL field
    const matchesMedia = (media || []).some((m) => m.file_url === img);
    setShowManualUrl(Boolean(img && !matchesMedia));
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim()) {
      setErrorMsg("Name is required.");
      return;
    }

    setIsSaving(true);
    try {
      if (onSaveOptional) {
        const res = await onSaveOptional({
          ...(editingOptional ? { id: editingOptional.id, sort_order: editingOptional.sort_order } : {}),
          name: name.trim(),
          description: description.trim() || undefined,
          image_url: imageUrl.trim() || undefined,
          object_id: objectId ? objectId.trim() : null,
          is_active: isActive,
          price_hour: Number(priceHour) || 0,
          price_day: Number(priceDay) || 0,
          price_sun_thu: Number(priceSunThu) || 0,
          price_thu_sun: Number(priceThuSun) || 0,
          price_week: Number(priceWeek) || 0,
        });

        if (Array.isArray(res)) {
          setOptionals(res);
        }
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setErrorMsg(err?.message || "Could not save optional.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (item: OptionalItem) => {
    if (!confirm(`Are you sure you want to remove optional "${item.name}"?`)) {
      return;
    }

    setOptionals((prev) => prev.filter((o) => o.id !== item.id));
    setIsModalOpen(false);
    if (onDeleteOptional) {
      const res = await onDeleteOptional(item.id);
      if (Array.isArray(res)) {
        setOptionals(res);
      }
    }
  };

  const handleToggleActive = async (item: OptionalItem) => {
    const updatedStatus = !item.is_active;
    setOptionals((prev) =>
      prev.map((o) => (o.id === item.id ? { ...o, is_active: updatedStatus } : o))
    );

    if (onSaveOptional) {
      const res = await onSaveOptional({
        id: item.id,
        name: item.name,
        is_active: updatedStatus,
      });
      if (Array.isArray(res)) {
        setOptionals(res);
      }
    }
  };

  const filteredOptionals = useMemo(() => {
    return optionals.filter((opt) => {
      // Search query filter
      const q = searchQuery.toLowerCase().trim();
      const nameMatch = (opt.name || "").toLowerCase().includes(q);
      const descMatch = (opt.description || "").toLowerCase().includes(q);
      const matchesSearch = !q || nameMatch || descMatch;

      // Object filter
      let matchesObject = true;
      if (selectedObjectFilter === "ONLY_ALL") {
        matchesObject = opt.object_id === null || opt.object_id === "";
      } else if (selectedObjectFilter !== "ALL") {
        matchesObject = opt.object_id === selectedObjectFilter;
      }

      return matchesSearch && matchesObject;
    });
  }, [optionals, searchQuery, selectedObjectFilter]);

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Sparkles className="w-6 h-6 text-sky-400" />
            <span>Optionals (Tillval)</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage rentable add-ons, extra services, cleaning options, and object locks for customer bookings. Drag and drop to sort order.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-sky-600/20 hover:bg-sky-500 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Create Optional</span>
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search optionals by name, description..."
              className="w-full bg-slate-900/60 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition"
            />
          </div>

          {/* Object Filter Dropdown */}
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={selectedObjectFilter}
              onChange={(e) => setSelectedObjectFilter(e.target.value)}
              className="bg-slate-900/60 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500 transition"
            >
              <option value="ALL">All Optionals (No filter)</option>
              <option value="ONLY_ALL">All Objects only (General add-ons)</option>
              {objects.map((obj) => (
                <option key={obj.id} value={obj.id}>
                  Locked to: {obj.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="text-xs text-slate-400">
          Showing <span className="font-semibold text-white">{filteredOptionals.length}</span>{" "}
          {filteredOptionals.length === 1 ? "optional" : "optionals"}
        </div>
      </div>

      {/* Optionals Table */}
      <div className="rounded-2xl border border-slate-800/90 bg-slate-900/40 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/80 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                <th className="py-3.5 px-3 w-10"></th>
                <th className="py-3.5 px-3 w-16 text-center">Active</th>
                <th className="py-3.5 px-5">Optional</th>
                <th className="py-3.5 px-4">Locked to Object</th>
                <th className="py-3.5 px-3 text-right">Kr/Hour</th>
                <th className="py-3.5 px-3 text-right">Kr/Day</th>
                <th className="py-3.5 px-3 text-right">Kr/Sun-Thu</th>
                <th className="py-3.5 px-3 text-right">Kr/Thu-Sun</th>
                <th className="py-3.5 px-3 text-right">Kr/Week</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredOptionals.map((opt) => {
                // Resolve locked object name
                const targetObject =
                  opt.object || objects.find((o) => o.id === opt.object_id);
                const isDraggable = !searchQuery && selectedObjectFilter === "ALL";
                const isDragging = draggedId === opt.id;
                const isDragOver = dragOverId === opt.id;

                return (
                  <tr
                    key={opt.id}
                    draggable={isDraggable}
                    onDragStart={(e) => isDraggable && handleDragStart(e, opt.id)}
                    onDragOver={(e) => isDraggable && handleDragOver(e, opt.id)}
                    onDragLeave={() => dragOverId === opt.id && setDragOverId(null)}
                    onDrop={(e) => isDraggable && handleDrop(e, opt.id)}
                    onDragEnd={handleDragEnd}
                    className={`transition group ${
                      !opt.is_active ? "opacity-60 " : ""
                    }${
                      isDragging
                        ? "opacity-30 bg-slate-800/20"
                        : isDragOver
                        ? "bg-sky-500/15 border-t-2 border-sky-400"
                        : "hover:bg-slate-900/60"
                    }`}
                  >
                    {/* Drag Handle */}
                    <td className="py-3.5 px-3 text-slate-500">
                      {isDraggable ? (
                        <span
                          className="cursor-grab active:cursor-grabbing inline-flex p-1 rounded hover:text-slate-300 hover:bg-slate-800/60 transition"
                          title="Dra för att ändra ordning"
                        >
                          <GripVertical className="w-4 h-4" />
                        </span>
                      ) : null}
                    </td>

                    {/* Active Switch Toggle */}
                    <td className="py-3.5 px-3 text-center">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={opt.is_active}
                        onClick={() => handleToggleActive(opt)}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          opt.is_active ? "bg-emerald-500" : "bg-slate-700"
                        }`}
                        title={opt.is_active ? "Active (click to hide)" : "Hidden (click to activate)"}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                            opt.is_active ? "translate-x-4" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </td>

                    {/* Optional Name, Description & Image */}
                    <td className="py-3.5 px-5">
                      <div className="flex items-start gap-3">
                        {opt.image_url ? (
                          <div className="w-9 h-9 rounded-lg overflow-hidden border border-slate-800 shrink-0 bg-slate-950">
                            <img
                              src={opt.image_url}
                              alt={opt.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : null}
                        <div className="space-y-0.5">
                          <span className="font-semibold text-white block">
                            {opt.name}
                          </span>
                          {opt.description && (
                            <p className="text-[11px] text-slate-400 line-clamp-1 max-w-xs">
                              {opt.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Locked to Object */}
                    <td className="py-3.5 px-4">
                      {targetObject ? (
                        <div className="inline-flex items-center gap-1.5 rounded-lg border border-sky-500/20 bg-sky-500/10 px-2 py-1 text-[11px] text-sky-300 font-medium">
                          <Box className="w-3 h-3 text-sky-400" />
                          <span className="truncate max-w-[130px]">
                            {targetObject.name}
                          </span>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-md border border-slate-700 bg-slate-800/80 px-2 py-0.5 text-[10px] font-semibold text-slate-300">
                          All Objects
                        </span>
                      )}
                    </td>

                    {/* Pricing Breakdown */}
                    <td className="py-3.5 px-3 text-right font-mono text-[11px] text-slate-300">
                      {opt.price_hour ? `${opt.price_hour} kr` : "0"}
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono text-[11px] text-slate-300">
                      {opt.price_day ? `${opt.price_day} kr` : "0"}
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono text-[11px] text-slate-300">
                      {opt.price_sun_thu ? `${opt.price_sun_thu} kr` : "0"}
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono text-[11px] text-slate-300">
                      {opt.price_thu_sun ? `${opt.price_thu_sun} kr` : "0"}
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono text-[11px] font-semibold text-sky-300">
                      {opt.price_week ? `${opt.price_week} kr` : "0"}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-5 text-right">
                      <button
                        type="button"
                        onClick={() => openEditModal(opt)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 transition shadow-sm"
                        title="Edit optional"
                      >
                        <Edit3 className="w-3 h-3 text-sky-400" />
                        <span>Edit</span>
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredOptionals.length === 0 && (
                <tr>
                  <td
                    colSpan={10}
                    className="py-12 text-center text-slate-500 text-xs"
                  >
                    No optionals found. Click "+ Create Optional" to add one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Optional Modal */}
      {isModalOpen && (
        <ModalPortal>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="w-full max-w-xl rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {editingOptional ? `Edit Optional "${editingOptional.name}"` : "Create Optional (Tillval)"}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Configure optional details, object lock, active status, and price tiers.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                {errorMsg}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSave} className="space-y-4 text-xs">
              {/* Name & Active Switch */}
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-300">
                    Name (Namn) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Barnstol, Resesäng, Slutstäd..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-300">
                    Description (Beskrivning)
                  </label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter description shown to customer when selecting this optional..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition"
                  />
                </div>
              </div>

              {/* Locked to Object & Active Switch */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Låst till objekt */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-300 flex items-center justify-between">
                    <span>Locked to Object (Låst till objekt)</span>
                  </label>
                  <select
                    value={objectId}
                    onChange={(e) => setObjectId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500 transition"
                  >
                    <option value="">-- All Objects (Till alla stugor) --</option>
                    {objects.map((obj) => (
                      <option key={obj.id} value={obj.id}>
                        {obj.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Active / Hidden Switch */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-300">
                    Status (Aktiv / Dold)
                  </label>
                  <div className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 flex items-center justify-between h-[38px]">
                    <span className="text-[11px] text-slate-300">
                      {isActive ? "Active (visible to customers)" : "Hidden (temporarily disabled)"}
                    </span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={isActive}
                      onClick={() => setIsActive(!isActive)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        isActive ? "bg-emerald-500" : "bg-slate-700"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                          isActive ? "translate-x-4" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Image (Bild) */}
              <div className="space-y-2 pt-1 border-t border-slate-800/80">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
                    <span>Image (Bild)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowManualUrl(!showManualUrl)}
                    className="text-[10px] text-sky-400 hover:text-sky-300 transition underline underline-offset-2"
                  >
                    {showManualUrl ? "Hide manual URL" : "Enter manual URL / Sökväg"}
                  </button>
                </div>

                {/* Selected Image Preview Card */}
                {imageUrl ? (
                  <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-800 bg-slate-900/90 gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-700 bg-slate-950 shrink-0">
                        <img
                          src={imageUrl}
                          alt="Preview"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.currentTarget as HTMLElement).style.display = "none";
                          }}
                        />
                      </div>
                      <div className="min-w-0 space-y-0.5">
                        <span className="text-xs font-medium text-white truncate block">
                          {selectedMediaItem?.file_name || imageUrl.split("/").pop() || imageUrl}
                        </span>
                        <span className="text-[10px] text-slate-400 truncate block font-mono">
                          {imageUrl}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setImageUrl("")}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition shrink-0"
                      title="Remove image"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-xl border border-dashed border-slate-800 bg-slate-900/40 text-center">
                    <span className="text-[11px] text-slate-400">
                      No image selected (Ingen bild vald)
                    </span>
                  </div>
                )}

                {/* Media Picker Trigger */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsMediaPickerOpen(!isMediaPickerOpen)}
                    className="w-full flex items-center justify-between bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500 transition"
                  >
                    <span className="flex items-center gap-2 text-slate-300">
                      <ImageIcon className="w-4 h-4 text-sky-400" />
                      <span>
                        {imageUrl ? "Change image from Media & Files" : "Choose image from Media & Files"}
                      </span>
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 transition-transform ${
                        isMediaPickerOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {/* Media Picker List */}
                  {isMediaPickerOpen && (
                    <div className="mt-2 rounded-xl border border-slate-800 bg-slate-900 p-2 shadow-xl space-y-2 z-10">
                      {/* Search */}
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          value={mediaSearchQuery}
                          onChange={(e) => setMediaSearchQuery(e.target.value)}
                          placeholder="Search images in Media & Files..."
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                        />
                      </div>

                      {/* Image List */}
                      <div className="max-h-52 overflow-y-auto space-y-1 divide-y divide-slate-800/40">
                        {imageUrl && (
                          <button
                            type="button"
                            onClick={() => {
                              setImageUrl("");
                              setIsMediaPickerOpen(false);
                            }}
                            className="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-left rounded-lg text-rose-300 hover:bg-rose-500/10 text-xs transition"
                          >
                            <X className="w-4 h-4 text-rose-400 shrink-0" />
                            <span>Remove image / Ingen bild</span>
                          </button>
                        )}

                        {filteredMedia.length === 0 ? (
                          <div className="p-3 text-center text-[11px] text-slate-400">
                            {imageMedia.length === 0
                              ? "No images found in Media & Files."
                              : "No matching images found."}
                          </div>
                        ) : (
                          filteredMedia.map((m) => {
                            const isSelected = imageUrl === m.file_url;
                            return (
                              <button
                                key={m.id}
                                type="button"
                                onClick={() => {
                                  setImageUrl(m.file_url);
                                  setIsMediaPickerOpen(false);
                                }}
                                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 text-left rounded-lg transition ${
                                  isSelected
                                    ? "bg-sky-500/20 text-sky-200 border border-sky-500/30"
                                    : "text-slate-300 hover:bg-slate-800"
                                }`}
                              >
                                <div className="w-8 h-8 rounded-md overflow-hidden bg-slate-950 border border-slate-800 shrink-0">
                                  <img
                                    src={m.file_url}
                                    alt={m.file_name}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <span className="text-xs truncate flex-1">{m.file_name}</span>
                                {isSelected && (
                                  <Check className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                                )}
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Optional manual URL input */}
                {showManualUrl && (
                  <div className="space-y-1 pt-1">
                    <span className="text-[10px] text-slate-400">Manual URL or path</span>
                    <input
                      type="text"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="e.g. /images/bad_1.jpg or https://..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition font-mono text-xs"
                    />
                    {/^https?:\/\//i.test(imageUrl.trim()) && (
                      <p className="text-[11px] text-sky-400/90 pt-0.5">
                        External image URL detected — when you save, the image will be automatically downloaded and stored as a physical file in Media & Files.
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Pricing Breakdown (Kr/Tim, Kr/Dag, Kr/sön-tor, Kr/tor-sön, Kr/vecka) */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <label className="text-[11px] font-semibold text-slate-300 block">
                  Pricing (Prissättning i SEK)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400">Pris timme</span>
                    <input
                      type="number"
                      min={0}
                      value={priceHour}
                      onChange={(e) => setPriceHour(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-white font-mono text-center focus:outline-none focus:border-sky-500 transition"
                    />
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400">Pris dag</span>
                    <input
                      type="number"
                      min={0}
                      value={priceDay}
                      onChange={(e) => setPriceDay(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-white font-mono text-center focus:outline-none focus:border-sky-500 transition"
                    />
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400">Pris sön-tor</span>
                    <input
                      type="number"
                      min={0}
                      value={priceSunThu}
                      onChange={(e) => setPriceSunThu(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-white font-mono text-center focus:outline-none focus:border-sky-500 transition"
                    />
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400">Pris tor-sön</span>
                    <input
                      type="number"
                      min={0}
                      value={priceThuSun}
                      onChange={(e) => setPriceThuSun(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-white font-mono text-center focus:outline-none focus:border-sky-500 transition"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-1 col-span-2">
                    <span className="text-[10px] text-sky-400 font-semibold">Pris vecka</span>
                    <input
                      type="number"
                      min={0}
                      value={priceWeek}
                      onChange={(e) => setPriceWeek(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-sky-500/40 rounded-xl px-2.5 py-1.5 text-white font-mono text-center focus:outline-none focus:border-sky-500 transition font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                {editingOptional ? (
                  <button
                    type="button"
                    onClick={() => handleDelete(editingOptional)}
                    className="inline-flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Optional</span>
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-sky-600/20 hover:bg-sky-500 transition disabled:opacity-50"
                  >
                    {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>{editingOptional ? "Update Optional" : "Save Optional"}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </ModalPortal>
    )}
  </div>
);
}

