"use client";

import React, { useState, useEffect, useMemo, useId } from "react";
import { useTranslations } from "next-intl";
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
import {
  Alert,
  Badge,
  Button,
  Card,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  FormField,
  Input,
  Label,
  NativeSelect,
  Switch,
  Textarea,
} from "@cms/components/ui";
import { useConfirm } from "../../components/confirm";

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
  const t = useTranslations("optionals");
  const tCommon = useTranslations("common");
  const { confirm } = useConfirm();

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

  const statusSwitchId = useId();
  const manualUrlId = useId();

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
      setErrorMsg(t("nameRequired"));
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
      setErrorMsg(err?.message || t("saveError"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (item: OptionalItem) => {
    await confirm({
      title: tCommon("delete"),
      description: t("deleteConfirm", { name: item.name }),
      variant: "destructive",
      onConfirm: async () => {
        if (onDeleteOptional) {
          const res = await onDeleteOptional(item.id);
          if (Array.isArray(res)) {
            setOptionals(res);
          } else {
            setOptionals((prev) => prev.filter((o) => o.id !== item.id));
          }
        } else {
          setOptionals((prev) => prev.filter((o) => o.id !== item.id));
        }
        setIsModalOpen(false);
      },
    });
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
            <span>{t("title")}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {t("subtitle")}
          </p>
        </div>

        <Button
          type="button"
          variant="adminPrimary"
          onClick={openCreateModal}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>{t("createBtn")}</span>
        </Button>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
            <Input
              type="text"
              variant="admin"
              size="sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("searchPlaceholder")}
              aria-label={t("searchPlaceholder")}
              className="pl-9"
            />
          </div>

          {/* Object Filter Dropdown */}
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <NativeSelect
              variant="admin"
              size="sm"
              value={selectedObjectFilter}
              onChange={(e) => setSelectedObjectFilter(e.target.value)}
              aria-label={t("filterAll")}
            >
              <option value="ALL">{t("filterAll")}</option>
              <option value="ONLY_ALL">{t("filterOnlyAll")}</option>
              {objects.map((obj) => (
                <option key={obj.id} value={obj.id}>
                  {t("filterLocked", { name: obj.name })}
                </option>
              ))}
            </NativeSelect>
          </div>
        </div>

        <div className="text-xs text-slate-400">
          {t("showing", {
            count: filteredOptionals.length,
            plural: filteredOptionals.length === 1 ? t("optional") : t("optionals"),
          })}
        </div>
      </div>

      {/* Optionals Table */}
      <Card variant="admin" className="overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/80 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                <th className="py-3.5 px-3 w-10"></th>
                <th className="py-3.5 px-3 w-16 text-center">{t("colActive")}</th>
                <th className="py-3.5 px-5">{t("colOptional")}</th>
                <th className="py-3.5 px-4">{t("colLocked")}</th>
                <th className="py-3.5 px-3 text-right">{t("colHour")}</th>
                <th className="py-3.5 px-3 text-right">{t("colDay")}</th>
                <th className="py-3.5 px-3 text-right">{t("colSunThu")}</th>
                <th className="py-3.5 px-3 text-right">{t("colThuSun")}</th>
                <th className="py-3.5 px-3 text-right">{t("colWeek")}</th>
                <th className="py-3.5 px-5 text-right">{t("colActions")}</th>
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
                          title={t("dragToReorder")}
                          aria-label={`${t("dragToReorder")}: ${opt.name}`}
                        >
                          <GripVertical className="w-4 h-4" />
                        </span>
                      ) : null}
                    </td>

                    {/* Active Switch Toggle */}
                    <td className="py-3.5 px-3 text-center">
                      <Switch
                        checked={opt.is_active}
                        onCheckedChange={() => handleToggleActive(opt)}
                        variant="success"
                        aria-label={opt.is_active ? t("statusActiveTooltip") : t("statusHiddenTooltip")}
                        title={opt.is_active ? t("statusActiveTooltip") : t("statusHiddenTooltip")}
                      />
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
                        <Badge variant="adminAccent" className="gap-1.5 font-medium truncate max-w-[140px]">
                          <Box className="w-3 h-3 text-sky-400 shrink-0" />
                          <span className="truncate">{targetObject.name}</span>
                        </Badge>
                      ) : (
                        <Badge variant="adminMuted" className="text-[10px] font-semibold">
                          {t("allObjects")}
                        </Badge>
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
                      <Button
                        type="button"
                        variant="adminSecondary"
                        size="sm"
                        onClick={() => openEditModal(opt)}
                        className="gap-1.5"
                        title={t("editOptionalTooltip")}
                        aria-label={`${tCommon("edit")} ${opt.name}`}
                      >
                        <Edit3 className="w-3 h-3 text-sky-400" />
                        <span>{tCommon("edit")}</span>
                      </Button>
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
                    {t("noOptionalsFound")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create / Edit Optional Dialog */}
      <Dialog
        open={isModalOpen}
        onOpenChange={(open) => {
          if (!open && isSaving) return;
          setIsModalOpen(open);
        }}
      >
        <DialogContent
          variant="admin"
          size="lg"
          className="space-y-5 max-h-[92vh]"
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => {
            if (isSaving) {
              e.preventDefault();
              return;
            }
            if (isMediaPickerOpen) {
              e.preventDefault();
              setIsMediaPickerOpen(false);
            }
          }}
        >
          {/* Modal Header */}
          <DialogHeader className="border-b border-slate-800 pb-4 mb-0">
            <DialogTitle variant="admin" size="sm" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <span>
                  {editingOptional ? t("modalEditTitle", { name: editingOptional.name }) : t("modalCreateTitle")}
                </span>
                <DialogDescription className="text-[11px] text-slate-400 font-normal">
                  {t("modalSubtitle")}
                </DialogDescription>
              </div>
            </DialogTitle>
          </DialogHeader>

          {errorMsg && (
            <Alert variant="destructive" className="mb-4">
              {errorMsg}
            </Alert>
          )}

              {/* Form */}
              <form onSubmit={handleSave} className="space-y-4 text-xs">
                {/* Name & Active Switch */}
                <div className="space-y-3">
                  <FormField label={t("name")} required labelVariant="admin" labelSize="sm" labelClassName="font-semibold">
                    <Input
                      type="text"
                      variant="admin"
                      size="sm"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={t("namePlaceholder")}
                    />
                  </FormField>

                  {/* Description */}
                  <FormField label={t("description")} labelVariant="admin" labelSize="sm" labelClassName="font-semibold">
                    <Textarea
                      variant="admin"
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder={t("descriptionPlaceholder")}
                    />
                  </FormField>
                </div>

                {/* Locked to Object & Active Switch */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Locked to Object */}
                  <FormField label={t("colLocked")} labelVariant="admin" labelSize="sm" labelClassName="font-semibold">
                    <NativeSelect
                      variant="admin"
                      size="sm"
                      value={objectId}
                      onChange={(e) => setObjectId(e.target.value)}
                    >
                      <option value="">-- {t("allObjects")} --</option>
                      {objects.map((obj) => (
                        <option key={obj.id} value={obj.id}>
                          {obj.name}
                        </option>
                      ))}
                    </NativeSelect>
                  </FormField>

                  {/* Active / Hidden Switch */}
                  <div className="space-y-1.5">
                    <Label htmlFor={statusSwitchId} variant="admin" size="sm" className="font-semibold">
                      {t("status")}
                    </Label>
                    <div className="rounded-admin-button border border-admin-border bg-admin-field px-3 py-1.5 flex items-center justify-between h-[38px]">
                      <span className="text-[0.6875rem] text-slate-300">
                        {isActive ? t("statusActive") : t("statusHidden")}
                      </span>
                      <Switch
                        id={statusSwitchId}
                        checked={isActive}
                        onCheckedChange={setIsActive}
                        variant="success"
                        aria-label={t("status")}
                      />
                    </div>
                  </div>
                </div>

                {/* Image */}
                <div className="space-y-2 pt-1 border-t border-slate-800/80">
                  <div className="flex items-center justify-between">
                    <Label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
                      <span>{t("image")}</span>
                    </Label>
                    <button
                      type="button"
                      onClick={() => setShowManualUrl(!showManualUrl)}
                      className="text-[10px] text-sky-400 hover:text-sky-300 transition underline underline-offset-2"
                    >
                      {showManualUrl ? t("hideManualUrl") : t("enterManualUrl")}
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
                      <Button
                        type="button"
                        variant="adminGhost"
                        size="xs"
                        onClick={() => setImageUrl("")}
                        className="text-slate-400 hover:text-rose-400 shrink-0"
                        title={t("removeImage")}
                        aria-label={t("removeImage")}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-xl border border-dashed border-slate-800 bg-slate-900/40 text-center">
                      <span className="text-[11px] text-slate-400">
                        {t("noImageSelected")}
                      </span>
                    </div>
                  )}

                  {/* Media Picker Trigger */}
                  <div className="relative">
                    <Button
                      type="button"
                      variant="adminSecondary"
                      size="sm"
                      onClick={() => setIsMediaPickerOpen(!isMediaPickerOpen)}
                      className="w-full justify-between font-normal text-xs"
                      aria-expanded={isMediaPickerOpen}
                    >
                      <span className="flex items-center gap-2 text-slate-200">
                        <ImageIcon className="w-4 h-4 text-sky-400 shrink-0" />
                        <span>
                          {imageUrl ? t("changeImage") : t("chooseImage")}
                        </span>
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 text-slate-400 transition-transform ${
                          isMediaPickerOpen ? "rotate-180" : ""
                        }`}
                      />
                    </Button>

                    {/* Media Picker List */}
                    {isMediaPickerOpen && (
                      <div className="mt-2 rounded-xl border border-slate-800 bg-slate-900 p-2 shadow-xl space-y-2 z-10">
                        {/* Search */}
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                          <Input
                            type="text"
                            variant="admin"
                            size="sm"
                            value={mediaSearchQuery}
                            onChange={(e) => setMediaSearchQuery(e.target.value)}
                            placeholder={t("searchImages")}
                            aria-label={t("searchImages")}
                            className="pl-8"
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
                              <span>{t("removeImage")}</span>
                            </button>
                          )}

                          {filteredMedia.length === 0 ? (
                            <div className="p-3 text-center text-[11px] text-slate-400">
                              {imageMedia.length === 0
                                ? t("noImages")
                                : t("noMatchingImages")}
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
                      <Label htmlFor={manualUrlId} className="text-[10px] text-slate-400 font-normal">
                        {t("manualUrlLabel")}
                      </Label>
                      <Input
                        id={manualUrlId}
                        type="text"
                        variant="admin"
                        size="sm"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        placeholder="e.g. /images/bad_1.jpg or https://..."
                        className="font-mono text-xs"
                      />
                      {/^https?:\/\//i.test(imageUrl.trim()) && (
                        <p className="text-[11px] text-sky-400/90 pt-0.5">
                          {t("externalImageNotice")}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Pricing Breakdown */}
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <Label variant="admin" size="sm" className="font-semibold block">
                    {t("pricingTitle")}
                  </Label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                    <FormField label={t("hourlyRate")} labelVariant="muted" labelSize="xs">
                      <Input
                        type="number"
                        variant="admin"
                        size="sm"
                        min={0}
                        value={priceHour}
                        onChange={(e) => setPriceHour(Number(e.target.value))}
                        className="text-center font-mono"
                      />
                    </FormField>

                    <FormField label={t("dailyRate")} labelVariant="muted" labelSize="xs">
                      <Input
                        type="number"
                        variant="admin"
                        size="sm"
                        min={0}
                        value={priceDay}
                        onChange={(e) => setPriceDay(Number(e.target.value))}
                        className="text-center font-mono"
                      />
                    </FormField>

                    <FormField label={t("sunThuRate")} labelVariant="muted" labelSize="xs">
                      <Input
                        type="number"
                        variant="admin"
                        size="sm"
                        min={0}
                        value={priceSunThu}
                        onChange={(e) => setPriceSunThu(Number(e.target.value))}
                        className="text-center font-mono"
                      />
                    </FormField>

                    <FormField label={t("thuSunRate")} labelVariant="muted" labelSize="xs">
                      <Input
                        type="number"
                        variant="admin"
                        size="sm"
                        min={0}
                        value={priceThuSun}
                        onChange={(e) => setPriceThuSun(Number(e.target.value))}
                        className="text-center font-mono"
                      />
                    </FormField>

                    <FormField
                      label={t("weeklyRate")}
                      labelVariant="muted"
                      labelSize="xs"
                      labelClassName="text-sky-400 font-semibold"
                      className="sm:col-span-1 col-span-2"
                    >
                      <Input
                        type="number"
                        variant="admin"
                        size="sm"
                        min={0}
                        value={priceWeek}
                        onChange={(e) => setPriceWeek(Number(e.target.value))}
                        className="text-center font-mono font-bold border-sky-500/40"
                      />
                    </FormField>
                  </div>
                </div>

                {/* Modal Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                  {editingOptional ? (
                    <Button
                      type="button"
                      variant="adminGhost"
                      size="sm"
                      onClick={() => handleDelete(editingOptional)}
                      className="text-rose-400 hover:text-rose-300 gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{t("deleteBtn")}</span>
                    </Button>
                  ) : (
                    <div />
                  )}

                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      variant="adminSecondary"
                      size="sm"
                      disabled={isSaving}
                      onClick={() => setIsModalOpen(false)}
                    >
                      {tCommon("cancel")}
                    </Button>
                    <Button
                      type="submit"
                      variant="adminPrimary"
                      size="sm"
                      disabled={isSaving}
                      className="gap-2"
                    >
                      {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      <span>{editingOptional ? t("updateBtn") : t("saveBtn")}</span>
                    </Button>
                  </div>
                </div>
              </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

