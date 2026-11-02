"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import {
  Plus,
  Edit3,
  Trash2,
  Box,
  Eye,
  EyeOff,
  UserCheck,
  FileText,
  Home,
  CheckCircle2,
  XCircle,
  X,
  Loader2,
  Search,
  ExternalLink,
  ChevronDown,
  Tag,
  Check,
  Calendar,
  HelpCircle,
  Info,
  GripVertical,
  Sliders,
  Globe,
  Lock,
  Clock,
  CalendarDays,
} from "lucide-react";
import {
  BookingObjectDetails,
  BOOKING_OBJECT_TYPES,
  formatBookingObjectType,
  BOOKING_ROOM_TYPES,
  formatBookingRoomType,
  formatBookingRoomTypeShort,
  AmenityItem,
} from "../../booking/types";
import { LandlordItem } from "./landlords-view";
import { PageListItem } from "./pages-view";
import { ModalPortal } from "../../components/ui/modal-portal";
import { useBookingSettingsQuery } from "../../booking/hooks";

export type BookingObjectItem = BookingObjectDetails;

export interface BookingObjectsViewProps {
  objects?: BookingObjectItem[];
  landlords?: LandlordItem[];
  pages?: PageListItem[];
  amenities?: AmenityItem[];
  onSaveObject?: (data: {
    id?: string;
    name: string;
    type?: string;
    description?: string;
    page_id?: number | null;
    landlord_id?: string | null;
    sort_order?: number;
    is_visible?: boolean;
    size_sqm?: number | null;
    room_count?: number | null;
    room_type?: string | null;
    bed_count?: number;
    extra_bed_count?: number;
    pets_allowed?: boolean;
    ical_url?: string | null;
    price_matrix?: Record<string, any> | null;
    amenity_ids?: string[];
  }) => Promise<BookingObjectItem[] | void>;
  onDeleteObject?: (id: string) => Promise<BookingObjectItem[] | void>;
  onReorderObjects?: (orderedIds: string[]) => Promise<BookingObjectItem[] | void>;
}


export function BookingObjectsView({
  objects: initialObjects = [],
  landlords = [],
  pages = [],
  amenities = [],
  onSaveObject,
  onDeleteObject,
  onReorderObjects,
}: BookingObjectsViewProps) {
  const t = useTranslations("bookingObjects");
  const tCommon = useTranslations("common");

  const [objects, setObjects] = useState<BookingObjectItem[]>(initialObjects);

  useEffect(() => {
    setObjects(initialObjects);
  }, [initialObjects]);

  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingObject, setEditingObject] = useState<BookingObjectItem | null>(null);

  // Drag and drop states
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [type, setType] = useState(BOOKING_OBJECT_TYPES[0].label);
  const [landlordId, setLandlordId] = useState("");
  const [pageId, setPageId] = useState<string>("");
  const [isVisible, setIsVisible] = useState(true);
  const [sortOrder, setSortOrder] = useState(10);
  const [description, setDescription] = useState("");
  const [sizeSqm, setSizeSqm] = useState<string>("");
  const [roomCount, setRoomCount] = useState<number>(1);
  const [roomType, setRoomType] = useState("rum och kök");
  const [bedCount, setBedCount] = useState<number>(2);
  const [extraBedCount, setExtraBedCount] = useState<number>(0);
  const [petsAllowed, setPetsAllowed] = useState(false);
  const [selectedAmenityIds, setSelectedAmenityIds] = useState<string[]>([]);
  const [icalUrl, setIcalUrl] = useState<string>("");
  const [showIcalHelp, setShowIcalHelp] = useState(false);

  // Per-object booking settings overrides
  const { data: bookingSettings } = useBookingSettingsQuery();
  const [objTurnoverDay, setObjTurnoverDay] = useState<string>("");
  const [objCheckInTime, setObjCheckInTime] = useState<string>("");
  const [objCheckOutTime, setObjCheckOutTime] = useState<string>("");
  const [objAllowedPeriods, setObjAllowedPeriods] = useState<string>("");

  const hasAnyCustomizableSettings = Boolean(
    bookingSettings?.turnoverDayScope === "PER_OBJECT" ||
    bookingSettings?.checkTimesScope === "PER_OBJECT" ||
    bookingSettings?.customDaysScope === "PER_OBJECT"
  );
  const globalTurnoverLabel =
    bookingSettings?.defaultTurnoverDay === "SATURDAY" ? "Lördag" : "Söndag";
  const globalAllowedPeriods =
    bookingSettings?.allowedBookingPeriods ||
    (bookingSettings?.allowCustomDays === false
      ? "PERIODS_AND_WEEKS"
      : "ALL");

  const globalCustomDaysLabel =
    globalAllowedPeriods === "ALL"
      ? "Valfritt antal dygn (1-6 dgr)"
      : globalAllowedPeriods === "PERIODS_AND_WEEKS"
      ? "Endast 3/4d eller helveckor"
      : "Endast hela veckor (från bytesdag)";

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const openCreateModal = () => {
    setEditingObject(null);
    setName("");
    setType(BOOKING_OBJECT_TYPES[0].label);
    setLandlordId(landlords.length > 0 ? landlords[0].id : "");
    setPageId("");
    setIsVisible(true);
    setSortOrder((objects.length + 1) * 10);
    setDescription("");
    setSizeSqm("");
    setRoomCount(1);
    setRoomType(BOOKING_ROOM_TYPES[0].label);
    setBedCount(2);
    setExtraBedCount(0);
    setPetsAllowed(false);
    setSelectedAmenityIds([]);
    setIcalUrl("");
    setShowIcalHelp(false);
    setObjTurnoverDay("");
    setObjCheckInTime("");
    setObjCheckOutTime("");
    setObjAllowedPeriods("");
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const openEditModal = (item: BookingObjectItem) => {
    setEditingObject(item);
    setName(item.name || "");
    setType(formatBookingObjectType(item.type));
    setLandlordId(item.landlord_id || (landlords.length > 0 ? landlords[0].id : ""));
    setPageId(item.page_id ? String(item.page_id) : "");
    setIsVisible(item.is_visible !== undefined ? item.is_visible : true);
    setSortOrder(item.sort_order ?? 0);
    setDescription(item.description || "");
    setSizeSqm(item.size_sqm !== undefined && item.size_sqm !== null ? String(item.size_sqm) : "");
    setRoomCount(item.room_count ?? 1);
    setRoomType(formatBookingRoomType(item.room_type));
    setBedCount(item.bed_count ?? 2);
    setExtraBedCount(item.extra_bed_count ?? 0);
    setPetsAllowed(Boolean(item.pets_allowed));
    setSelectedAmenityIds((item.amenities || []).map((a) => a.id));
    setIcalUrl(item.ical_url || "");
    setShowIcalHelp(false);
    const objSettings = (item.price_matrix as any)?.booking_settings || {};
    setObjTurnoverDay(objSettings.defaultTurnoverDay || "");
    setObjCheckInTime(objSettings.checkInTime || "");
    setObjCheckOutTime(objSettings.checkOutTime || "");
    setObjAllowedPeriods(
      objSettings.allowedBookingPeriods ||
        (objSettings.allowCustomDays === true
          ? "ALL"
          : objSettings.allowCustomDays === false
          ? "PERIODS_AND_WEEKS"
          : "")
    );
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
      if (onSaveObject) {
        const customObjSettings: Record<string, any> = {
          ...((editingObject?.price_matrix as any)?.booking_settings || {}),
        };
        if (bookingSettings?.turnoverDayScope === "PER_OBJECT") {
          if (objTurnoverDay) {
            customObjSettings.defaultTurnoverDay = objTurnoverDay;
          } else {
            delete customObjSettings.defaultTurnoverDay;
          }
        }
        if (bookingSettings?.checkTimesScope === "PER_OBJECT") {
          if (objCheckInTime) {
            customObjSettings.checkInTime = objCheckInTime;
          } else {
            delete customObjSettings.checkInTime;
          }
          if (objCheckOutTime) {
            customObjSettings.checkOutTime = objCheckOutTime;
          } else {
            delete customObjSettings.checkOutTime;
          }
        }
        if (bookingSettings?.customDaysScope === "PER_OBJECT") {
          if (objAllowedPeriods !== "") {
            customObjSettings.allowedBookingPeriods = objAllowedPeriods;
            customObjSettings.allowCustomDays = objAllowedPeriods === "ALL";
          } else {
            delete customObjSettings.allowedBookingPeriods;
            delete customObjSettings.allowCustomDays;
          }
        }

        const updatedPriceMatrix = {
          ...((editingObject?.price_matrix as any) || {}),
          ...(Object.keys(customObjSettings).length > 0
            ? { booking_settings: customObjSettings }
            : {}),
        };
        if (Object.keys(customObjSettings).length === 0 && updatedPriceMatrix.booking_settings) {
          delete updatedPriceMatrix.booking_settings;
        }

        const res = await onSaveObject({
          ...(editingObject ? { id: editingObject.id } : {}),
          name: name.trim(),
          type: type.trim() || undefined,
          description: description.trim() || undefined,
          page_id: pageId ? Number(pageId) : null,
          landlord_id: landlordId || null,
          sort_order: Number(sortOrder) || 0,
          is_visible: isVisible,
          size_sqm: sizeSqm ? parseFloat(sizeSqm) : null,
          room_count: Number(roomCount) || 1,
          room_type: roomType.trim() || undefined,
          bed_count: Number(bedCount) || 1,
          extra_bed_count: Number(extraBedCount) || 0,
          pets_allowed: petsAllowed,
          ical_url: icalUrl.trim() || null,
          price_matrix: updatedPriceMatrix,
          amenity_ids: selectedAmenityIds,
        });

        if (Array.isArray(res)) {
          setObjects(res);
        }
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setErrorMsg(err?.message || t("saveError"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (item: BookingObjectItem) => {
    if (!confirm(t("deleteConfirm", { name: item.name }))) {
      return;
    }

    setObjects((prev) => prev.filter((o) => o.id !== item.id));
    setIsModalOpen(false);
    if (onDeleteObject) {
      const res = await onDeleteObject(item.id);
      if (Array.isArray(res)) {
        setObjects(res);
      }
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

    const currentList = [...objects];
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
    setObjects(currentList);

    if (onReorderObjects) {
      const res = await onReorderObjects(currentList.map((o) => o.id));
      if (Array.isArray(res)) {
        setObjects(res);
      }
    }
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverId(null);
  };

  const filteredObjects = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return objects;
    return objects.filter((o) => {
      const nameMatch = (o.name || "").toLowerCase().includes(q);
      const typeMatch = (o.type || "").toLowerCase().includes(q);
      const descMatch = (o.description || "").toLowerCase().includes(q);
      const landlordMatch = o.landlord
        ? `${o.landlord.first_name} ${o.landlord.last_name}`.toLowerCase().includes(q)
        : false;
      const pageMatch = o.page ? o.page.page_title.toLowerCase().includes(q) : false;
      return nameMatch || typeMatch || descMatch || landlordMatch || pageMatch;
    });
  }, [objects, searchQuery]);

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Box className="w-6 h-6 text-sky-400" />
            <span>{t("title")}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {t("subtitle")}
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-sky-600/20 hover:bg-sky-500 transition"
        >
          <Plus className="w-4 h-4" />
          <span>{t("createBtn")}</span>
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="w-full bg-slate-900/60 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition"
          />
        </div>

        <div className="text-xs text-slate-400">
          {t("showing", {
            count: filteredObjects.length,
            plural: filteredObjects.length === 1 ? t("object") : t("objects"),
          })}
        </div>
      </div>

      {/* Objects Table */}
      <div className="rounded-2xl border border-slate-800/90 bg-slate-900/40 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/80 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                <th className="py-3.5 px-3 w-10 text-center" />
                <th className="py-3.5 px-3 w-16 text-center">{t("colStatus")}</th>
                <th className="py-3.5 px-5">{t("colObject")}</th>
                <th className="py-3.5 px-4">{t("colLinkedPage")}</th>
                <th className="py-3.5 px-4">{t("colTypeCapacity")}</th>
                <th className="py-3.5 px-4">{t("colLandlord")}</th>
                <th className="py-3.5 px-5 text-right">{t("colActions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredObjects.map((obj) => {
                const isDragging = draggedId === obj.id;
                const isDragOver = dragOverId === obj.id;
                const landlordName = obj.landlord
                  ? `${obj.landlord.first_name} ${obj.landlord.last_name}`.trim()
                  : t("noneAssigned");

                // Resolve linked page title
                const linkedPage =
                  obj.page || pages.find((p) => p.id === obj.page_id);

                return (
                  <tr
                    key={obj.id}
                    draggable={!searchQuery}
                    onDragStart={(e) => handleDragStart(e, obj.id)}
                    onDragOver={(e) => handleDragOver(e, obj.id)}
                    onDragLeave={() => dragOverId === obj.id && setDragOverId(null)}
                    onDrop={(e) => handleDrop(e, obj.id)}
                    onDragEnd={handleDragEnd}
                    className={`transition group ${
                      isDragging
                        ? "opacity-30 bg-slate-800/20"
                        : isDragOver
                        ? "bg-sky-500/15 border-t-2 border-sky-400"
                        : "hover:bg-slate-900/60"
                    }`}
                  >
                    {/* Drag Handle */}
                    <td className="py-3.5 px-3 text-slate-500 text-center">
                      {!searchQuery && (
                        <span
                          className="cursor-grab active:cursor-grabbing inline-flex p-1 rounded hover:text-slate-300 hover:bg-slate-800/60 transition"
                          title="Drag to reorder booking object"
                        >
                          <GripVertical className="w-4 h-4" />
                        </span>
                      )}
                    </td>

                    {/* Status / Visibility */}
                    <td className="py-3.5 px-3 text-center">
                      {obj.is_visible ? (
                        <span className="inline-flex items-center justify-center p-1 rounded-md text-emerald-400 bg-emerald-500/10" title="Visible / Active">
                          <Eye className="w-4 h-4" />
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center p-1 rounded-md text-slate-500 bg-slate-800" title="Hidden / Inactive">
                          <EyeOff className="w-4 h-4" />
                        </span>
                      )}
                    </td>

                    {/* Object Name & Description */}
                    <td className="py-3.5 px-5">
                      <div className="space-y-1">
                        <span className="font-semibold text-white block">
                          {obj.name}
                        </span>
                        {obj.description && (
                          <p className="text-[11px] text-slate-400 line-clamp-1 max-w-xs">
                            {obj.description.split("\n")[0]}
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Linked CMS Page */}
                    <td className="py-3.5 px-4">
                      {linkedPage ? (
                        <div className="inline-flex items-center gap-1.5 rounded-lg border border-sky-500/20 bg-sky-500/10 px-2 py-1 text-[11px] text-sky-300">
                          <FileText className="w-3 h-3 text-sky-400" />
                          <span className="font-medium truncate max-w-[140px]">
                            {linkedPage.page_title}
                          </span>
                          <span className="text-[10px] text-sky-400/80 font-mono">
                            #{obj.page_id}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-600 italic text-[11px]">
                          {t("notConnected")}
                        </span>
                      )}
                    </td>

                    {/* Type & Capacity */}
                    <td className="py-3.5 px-4 text-slate-300">
                      <div className="space-y-0.5 text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-white">{formatBookingObjectType(obj.type)}</span>
                          {obj.size_sqm ? (
                            <span className="text-slate-400">· {obj.size_sqm} m²</span>
                          ) : null}
                        </div>
                        <div className="text-slate-400 text-[10px] flex items-center gap-2 flex-wrap">
                          <span>
                            {obj.room_count ? `${obj.room_count} ${formatBookingRoomTypeShort(obj.room_type)}, ` : ""}
                            {obj.bed_count} {obj.extra_bed_count ? `+ ${obj.extra_bed_count}` : ""} {t("beds")}
                            {obj.pets_allowed ? ` · ${t("petsAllowed")}` : ""}
                          </span>
                          {obj.amenities && obj.amenities.length > 0 && (
                            <span className="inline-flex items-center gap-1 text-sky-400 font-medium" title={`${obj.amenities.length} active amenities`}>
                              <Tag className="w-2.5 h-2.5" />
                              <span>{obj.amenities.length}</span>
                            </span>
                          )}
                          {obj.ical_url && (
                            <span className="inline-flex items-center gap-1 text-emerald-400 font-medium" title={`iCal linked: ${obj.ical_url}`}>
                              <Calendar className="w-2.5 h-2.5" />
                              <span>iCal</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Landlord */}
                    <td className="py-3.5 px-4">
                      {obj.landlord_id ? (
                        <div className="inline-flex items-center gap-1.5 text-slate-200 text-[11px]">
                          <UserCheck className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                          <span>{landlordName}</span>
                        </div>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-5 text-right">
                      <button
                        type="button"
                        onClick={() => openEditModal(obj)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 transition shadow-sm"
                        title="Edit booking object"
                      >
                        <Edit3 className="w-3 h-3 text-sky-400" />
                        <span>{tCommon("edit")}</span>
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredObjects.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="py-12 text-center text-slate-500 text-xs"
                  >
                    {t("noObjectsFound")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Booking Object Modal */}
      {isModalOpen && (
        <ModalPortal>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center">
                  <Box className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {editingObject
                      ? t("modalEditTitle", { name: editingObject.name })
                      : t("modalCreateTitle")}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {t("modalSubtitle")}
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
              {/* Landlord & Visibility */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-sky-400" />
                    <span>{t("activeLandlord")}</span>
                  </label>
                  <select
                    value={landlordId}
                    onChange={(e) => setLandlordId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500 transition"
                  >
                    <option value="">{t("noLandlordSelected")}</option>
                    {landlords.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.first_name} {l.last_name} ({l.city || l.address || l.email || "Landlord"})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-300">
                    {t("visible")}
                  </label>
                  <div className="flex items-center gap-3 pt-1.5">
                    <label className="inline-flex items-center gap-1.5 cursor-pointer text-slate-300">
                      <input
                        type="radio"
                        name="is_visible"
                        checked={isVisible}
                        onChange={() => setIsVisible(true)}
                        className="text-sky-500 focus:ring-0"
                      />
                      <span>{tCommon("yes")}</span>
                    </label>
                    <label className="inline-flex items-center gap-1.5 cursor-pointer text-slate-300">
                      <input
                        type="radio"
                        name="is_visible"
                        checked={!isVisible}
                        onChange={() => setIsVisible(false)}
                        className="text-sky-500 focus:ring-0"
                      />
                      <span>{tCommon("no")}</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Object Name & Page in CMS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-300">
                    {t("objectName")} <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder='e.g. Stuga "Storstugan"'
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-300 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-sky-400" />
                      <span>{t("pageInCms")}</span>
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {t("pageInCmsDesc")}
                    </span>
                  </label>
                  <select
                    value={pageId}
                    onChange={(e) => setPageId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500 transition"
                  >
                    <option value="">{t("noPageConnected")}</option>
                    {pages.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.page_title} (ID: {p.id})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Short Description */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-300">
                  {t("shortDescription")}
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t("shortDescriptionPlaceholder")}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition"
                />
              </div>

              {/* Type & Size */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-300">
                    {t("type")}
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500 transition"
                  >
                    {BOOKING_OBJECT_TYPES.map((tItem) => (
                      <option key={tItem.id} value={tItem.label}>
                        {tItem.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-300">
                    {t("size")}
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={sizeSqm}
                    onChange={(e) => setSizeSqm(e.target.value)}
                    placeholder="e.g. 66"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition font-mono"
                  />
                </div>
              </div>

              {/* Rooms & Bed Counts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-300">
                    {t("rooms")}
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="number"
                      min={1}
                      value={roomCount}
                      onChange={(e) => setRoomCount(Number(e.target.value))}
                      className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500 transition font-mono text-center"
                    />
                    <select
                      value={formatBookingRoomType(roomType)}
                      onChange={(e) => setRoomType(e.target.value)}
                      className="col-span-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500 transition"
                    >
                      {BOOKING_ROOM_TYPES.map((rt) => (
                        <option key={rt.id} value={rt.label}>
                          {rt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-300">
                    {t("bedsAndExtraBeds")}
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 flex items-center gap-1.5">
                      <input
                        type="number"
                        min={1}
                        value={bedCount}
                        onChange={(e) => setBedCount(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500 transition font-mono text-center"
                      />
                      <span className="text-[11px] text-slate-400">{t("beds")}</span>
                    </div>
                    <span className="text-slate-500">+</span>
                    <div className="flex-1 flex items-center gap-1.5">
                      <input
                        type="number"
                        min={0}
                        value={extraBedCount}
                        onChange={(e) => setExtraBedCount(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500 transition font-mono text-center"
                      />
                      <span className="text-[11px] text-slate-400">{t("extra")}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pets Allowed */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-white block">
                    {t("petsAllowed")}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {t("petsAllowedDesc")}
                  </span>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={petsAllowed}
                  onClick={() => setPetsAllowed(!petsAllowed)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    petsAllowed ? "bg-sky-500" : "bg-slate-700"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      petsAllowed ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Active Amenities */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <label className="text-[11px] font-semibold text-slate-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-sky-400" />
                    <span>{t("amenities")}</span>
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {t("activeAmenitiesCount", {
                      count: selectedAmenityIds.length,
                      total: amenities.length,
                    })}
                  </span>
                </label>
                {amenities.length === 0 ? (
                  <p className="text-[11px] text-slate-500">
                    {t("noAmenities")}
                  </p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-48 overflow-y-auto p-2 rounded-xl border border-slate-800 bg-slate-900/60">
                    {amenities.map((amenity) => {
                      const isSelected = selectedAmenityIds.includes(amenity.id);
                      return (
                        <button
                          key={amenity.id}
                          type="button"
                          onClick={() => {
                            setSelectedAmenityIds((prev) =>
                              prev.includes(amenity.id)
                                ? prev.filter((id) => id !== amenity.id)
                                : [...prev, amenity.id]
                            );
                          }}
                          className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left text-xs transition border ${
                            isSelected
                              ? "bg-sky-500/20 text-sky-200 border-sky-500/40 font-medium"
                              : "bg-slate-950/60 text-slate-400 border-slate-800/80 hover:border-slate-700 hover:text-slate-200"
                          }`}
                        >
                          <div
                            className={`w-3.5 h-3.5 rounded flex items-center justify-center shrink-0 border ${
                              isSelected
                                ? "bg-sky-500 border-sky-400 text-white"
                                : "border-slate-700 bg-slate-900"
                            }`}
                          >
                            {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                          </div>
                          <span className="truncate">{amenity.name}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* iCal Import URL with Help / Info Box */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-sky-400" />
                    <span>{t("icalUrl")}</span>
                    <button
                      type="button"
                      onClick={() => setShowIcalHelp(!showIcalHelp)}
                      className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-slate-800 hover:bg-sky-500/20 text-slate-400 hover:text-sky-300 border border-slate-700 transition ml-1"
                      title="Click for information about iCal sync"
                    >
                      <HelpCircle className="w-3 h-3" />
                    </button>
                  </label>
                  {icalUrl && (
                    <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      {t("activeIcalSync")}
                    </span>
                  )}
                </div>

                {/* Collapsible Info / Help Box */}
                {showIcalHelp && (
                  <div className="p-3.5 rounded-xl border border-sky-500/30 bg-sky-950/30 text-sky-200 text-xs space-y-2 animate-in fade-in duration-150">
                    <div className="font-semibold text-sky-100 flex items-center gap-1.5">
                      <Info className="w-4 h-4 text-sky-400 shrink-0" />
                      <span>{t("icalHelpTitle")}</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-slate-300">
                      In the Booking.com Extranet, each unit is managed individually. Under 'Prices & Availability' → 'Sync calendars', you will find the 'Export calendar' link for this specific unit.
                    </p>
                    <p className="text-[11px] leading-relaxed text-slate-300">
                      Paste the URL here. The system automatically fetches and caches busy dates (at least every 60 minutes) and blocks those dates in the calendar to prevent double bookings.
                    </p>
                    <p className="text-[11px] leading-relaxed text-slate-300">
                      If Booking.com is temporarily unavailable, previous dates are kept persistent so reservations stay protected. Checkout dates remain available for same-day check-in.
                    </p>
                  </div>
                )}

                <div className="relative">
                  <input
                    type="text"
                    value={icalUrl}
                    onChange={(e) => setIcalUrl(e.target.value)}
                    placeholder="https://ical.booking.com/v1/export?t=... or /mock-ical/..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition font-mono text-xs"
                  />
                </div>
              </div>

              {/* Per-Object Booking Settings (Compressed Format) */}
              <div className="space-y-2.5 pt-3 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-amber-400" />
                    <span>Bokningsinställningar för detta objekt</span>
                  </label>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {hasAnyCustomizableSettings ? "Objektanpassning möjlig" : "Följer centrala inställningar"}
                  </span>
                </div>

                {/* If all groups are locked globally */}
                {!hasAnyCustomizableSettings && (
                  <div className="p-3 rounded-xl border border-slate-800 bg-slate-950/40 text-[11px] text-slate-400 space-y-1">
                    <div className="flex items-center gap-1.5 text-slate-300 font-medium">
                      <Lock className="w-3 h-3 text-slate-400" />
                      <span>Alla bokningsinställningar styrs centralt</span>
                    </div>
                    <div className="text-[10px] text-slate-500 leading-relaxed">
                      Bytesdag: {globalTurnoverLabel} • Tider: In {bookingSettings?.checkInTime || "15:00"} / Ut {bookingSettings?.checkOutTime || "11:00"} • Enstaka dygn: {globalCustomDaysLabel}. Dessa kan låsas upp under Bokning → Inställningar om de ska tillåtas per objekt.
                    </div>
                  </div>
                )}

                {/* If at least one group can be customized per object */}
                {hasAnyCustomizableSettings && (
                  <div className="p-3 rounded-xl border border-slate-800 bg-slate-950/40 space-y-2.5">
                    {/* Turnover day row */}
                    {bookingSettings?.turnoverDayScope === "PER_OBJECT" ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-center">
                        <div>
                          <label className="text-[10px] font-medium text-slate-300 flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-sky-400" />
                            <span>Default bytesdag</span>
                          </label>
                          <span className="text-[9px] text-slate-500">Gäller för veckouthyrning</span>
                        </div>
                        <select
                          value={objTurnoverDay}
                          onChange={(e) => setObjTurnoverDay(e.target.value)}
                          className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-white text-xs focus:outline-none focus:border-sky-500"
                        >
                          <option value="">Följ global standard ({globalTurnoverLabel})</option>
                          <option value="SUNDAY">Söndag</option>
                          <option value="SATURDAY">Lördag</option>
                        </select>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between py-1 border-b border-slate-800/50 text-[10px] text-slate-500">
                        <span className="flex items-center gap-1"><Lock className="w-2.5 h-2.5 text-slate-500" /> Bytesdag (låst centralt):</span>
                        <span className="font-medium text-slate-400">{globalTurnoverLabel}</span>
                      </div>
                    )}

                    {/* Check-in / check-out times row */}
                    {bookingSettings?.checkTimesScope === "PER_OBJECT" ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-center pt-1 border-t border-slate-800/50">
                        <div>
                          <label className="text-[10px] font-medium text-slate-300 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-emerald-400" />
                            <span>In- / Utcheckningstider</span>
                          </label>
                          <span className="text-[9px] text-slate-500">Globalt: In {bookingSettings?.checkInTime || "15:00"} / Ut {bookingSettings?.checkOutTime || "11:00"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="time"
                            value={objCheckInTime}
                            onChange={(e) => setObjCheckInTime(e.target.value)}
                            placeholder={bookingSettings?.checkInTime || "15:00"}
                            className="w-1/2 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white text-xs font-mono focus:outline-none focus:border-sky-500"
                            title="Incheckningstid (lämna tomt för global standard)"
                          />
                          <span className="text-slate-600 text-xs">/</span>
                          <input
                            type="time"
                            value={objCheckOutTime}
                            onChange={(e) => setObjCheckOutTime(e.target.value)}
                            placeholder={bookingSettings?.checkOutTime || "11:00"}
                            className="w-1/2 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white text-xs font-mono focus:outline-none focus:border-sky-500"
                            title="Utcheckningstid (lämna tomt för global standard)"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between py-1 border-b border-slate-800/50 text-[10px] text-slate-500">
                        <span className="flex items-center gap-1"><Lock className="w-2.5 h-2.5 text-slate-500" /> Tider (låst centralt):</span>
                        <span className="font-medium text-slate-400">In {bookingSettings?.checkInTime || "15:00"} / Ut {bookingSettings?.checkOutTime || "11:00"}</span>
                      </div>
                    )}

                    {/* Allowed booking periods row */}
                    {bookingSettings?.customDaysScope === "PER_OBJECT" ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-center pt-1 border-t border-slate-800/50">
                        <div>
                          <label className="text-[10px] font-medium text-slate-300 flex items-center gap-1">
                            <CalendarDays className="w-3 h-3 text-purple-400" />
                            <span>Tillåtna bokningsperioder</span>
                          </label>
                          <span className="text-[9px] text-slate-500">Valfria dygn, 3/4-delveckor eller endast helveckor</span>
                        </div>
                        <select
                          value={objAllowedPeriods}
                          onChange={(e) => setObjAllowedPeriods(e.target.value)}
                          className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-white text-xs focus:outline-none focus:border-sky-500"
                        >
                          <option value="">Följ global standard ({globalCustomDaysLabel})</option>
                          <option value="ALL">Valfritt antal dygn (1-6 dgr & helvecka)</option>
                          <option value="PERIODS_AND_WEEKS">Endast 3/4d perioder eller hela veckor</option>
                          <option value="FULL_WEEKS_ONLY">Endast hela veckor (från bytesdag)</option>
                        </select>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between py-1 text-[10px] text-slate-500">
                        <span className="flex items-center gap-1"><Lock className="w-2.5 h-2.5 text-slate-500" /> Bokningsperioder (låst centralt):</span>
                        <span className="font-medium text-slate-400">{globalCustomDaysLabel}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                {editingObject ? (
                  <button
                    type="button"
                    onClick={() => handleDelete(editingObject)}
                    className="inline-flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{t("deleteBtn")}</span>
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
                    {tCommon("cancel")}
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-sky-600/20 hover:bg-sky-500 transition disabled:opacity-50"
                  >
                    {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>{editingObject ? t("updateBtn") : t("saveBtn")}</span>
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

