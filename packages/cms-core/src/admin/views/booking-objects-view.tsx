"use client";

import React, { useState, useEffect, useMemo } from "react";
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
    amenity_ids?: string[];
  }) => Promise<BookingObjectItem[] | void>;
  onDeleteObject?: (id: string) => Promise<BookingObjectItem[] | void>;
}


export function BookingObjectsView({
  objects: initialObjects = [],
  landlords = [],
  pages = [],
  amenities = [],
  onSaveObject,
  onDeleteObject,
}: BookingObjectsViewProps) {
  const [objects, setObjects] = useState<BookingObjectItem[]>(initialObjects);

  useEffect(() => {
    setObjects(initialObjects);
  }, [initialObjects]);

  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingObject, setEditingObject] = useState<BookingObjectItem | null>(null);

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
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim()) {
      setErrorMsg("Object name is required.");
      return;
    }

    setIsSaving(true);
    try {
      if (onSaveObject) {
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
          amenity_ids: selectedAmenityIds,
        });

        if (Array.isArray(res)) {
          setObjects(res);
        }
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setErrorMsg(err?.message || "Could not save booking object.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (item: BookingObjectItem) => {
    if (!confirm(`Are you sure you want to remove booking object "${item.name}"?`)) {
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
            <span>Booking Objects</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage rentable units, assign landlords, and connect booking units to CMS pages.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-sky-600/20 hover:bg-sky-500 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Create Booking Object</span>
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
            placeholder="Search booking objects by name, type, landlord..."
            className="w-full bg-slate-900/60 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition"
          />
        </div>

        <div className="text-xs text-slate-400">
          Showing <span className="font-semibold text-white">{filteredObjects.length}</span>{" "}
          {filteredObjects.length === 1 ? "object" : "objects"}
        </div>
      </div>

      {/* Objects Table */}
      <div className="rounded-2xl border border-slate-800/90 bg-slate-900/40 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/80 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                <th className="py-3.5 px-4 w-16">Sort</th>
                <th className="py-3.5 px-3 w-16 text-center">Status</th>
                <th className="py-3.5 px-5">Object</th>
                <th className="py-3.5 px-4">Linked CMS Page</th>
                <th className="py-3.5 px-4">Type & Capacity</th>
                <th className="py-3.5 px-4">Landlord</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredObjects.map((obj) => {
                const landlordName = obj.landlord
                  ? `${obj.landlord.first_name} ${obj.landlord.last_name}`.trim()
                  : "None assigned";

                // Resolve linked page title
                const linkedPage =
                  obj.page || pages.find((p) => p.id === obj.page_id);

                return (
                  <tr
                    key={obj.id}
                    className="hover:bg-slate-900/60 transition group"
                  >
                    {/* Sort Order */}
                    <td className="py-3.5 px-4 font-mono text-slate-400">
                      {obj.sort_order ?? 0}
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
                          Not connected
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
                            {obj.bed_count} {obj.extra_bed_count ? `+ ${obj.extra_bed_count}` : ""} beds
                            {obj.pets_allowed ? " · Pets allowed" : ""}
                          </span>
                          {obj.amenities && obj.amenities.length > 0 && (
                            <span className="inline-flex items-center gap-1 text-sky-400 font-medium" title={`${obj.amenities.length} active amenities`}>
                              <Tag className="w-2.5 h-2.5" />
                              <span>{obj.amenities.length}</span>
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
                        <span>Edit</span>
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
                    No booking objects found. Click "+ Create Booking Object" to add one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Booking Object Modal */}
      {isModalOpen && (
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
                    {editingObject ? `Edit Object "${editingObject.name}"` : "Create Booking Object"}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Configure unit details, active landlord, and linked CMS page.
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
                    <span>Active Landlord (Hyresvärd)</span>
                  </label>
                  <select
                    value={landlordId}
                    onChange={(e) => setLandlordId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500 transition"
                  >
                    <option value="">-- No landlord selected --</option>
                    {landlords.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.first_name} {l.last_name} ({l.city || l.address || l.email || "Landlord"})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-300">
                    Visible (Synlig)
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
                      <span>Yes</span>
                    </label>
                    <label className="inline-flex items-center gap-1.5 cursor-pointer text-slate-300">
                      <input
                        type="radio"
                        name="is_visible"
                        checked={!isVisible}
                        onChange={() => setIsVisible(false)}
                        className="text-sky-500 focus:ring-0"
                      />
                      <span>No</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Name & Sort Order */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="space-y-1.5 sm:col-span-3">
                  <label className="text-[11px] font-semibold text-slate-300">
                    Object Name (Namn) <span className="text-rose-400">*</span>
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
                  <label className="text-[11px] font-semibold text-slate-300">
                    Sort Order (Sortering)
                  </label>
                  <input
                    type="number"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500 transition font-mono"
                  />
                </div>
              </div>

              {/* Page in CMS (Sida i systemet) */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-sky-400" />
                    <span>Page in CMS (Sida i systemet)</span>
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Connects unit data to the selected template page
                  </span>
                </label>
                <select
                  value={pageId}
                  onChange={(e) => setPageId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500 transition"
                >
                  <option value="">-- No page connected --</option>
                  {pages.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.page_title} (ID: {p.id}, /{p.slug})
                    </option>
                  ))}
                </select>
              </div>

              {/* Short Description (Kort beskrivning bokningskalendern) */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-300">
                  Short Description (Kort beskrivning - bokningskalendern)
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter short description shown in booking calendar and preview cards..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition"
                />
              </div>

              {/* Type & Size */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-300">
                    Type (Typ)
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500 transition"
                  >
                    {BOOKING_OBJECT_TYPES.map((t) => (
                      <option key={t.id} value={t.label}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-300">
                    Size / Yta (m²)
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
                    Rooms (Rum)
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
                    Beds (Bäddar + Extrabäddar)
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
                      <span className="text-[11px] text-slate-400">bäddar</span>
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
                      <span className="text-[11px] text-slate-400">extra</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pets Allowed */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-white block">
                    Pets Allowed (Husdjur tillåtna)
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Allows guests with pets to filter and book this unit
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

              {/* Active Amenities (Aktiva förnödenheter) */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <label className="text-[11px] font-semibold text-slate-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-sky-400" />
                    <span>Amenities (Förnödenheter för objektet)</span>
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {selectedAmenityIds.length} of {amenities.length} active
                  </span>
                </label>
                {amenities.length === 0 ? (
                  <p className="text-[11px] text-slate-500">
                    No amenities registered yet. Create them under Bookings → Amenities.
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

              {/* Modal Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                {editingObject ? (
                  <button
                    type="button"
                    onClick={() => handleDelete(editingObject)}
                    className="inline-flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Object</span>
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
                    <span>{editingObject ? "Update Object" : "Save Object"}</span>
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

