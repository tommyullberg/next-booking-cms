"use client";

import React, { useState } from "react";
import { Plus, Trash2, Pencil, Check, GripVertical, ChevronDown } from "lucide-react";
import { FlagIcon } from "../../components/ui/flag-icon";

export interface SectionItem {
  id: string;
  name: string;
  translations?: Record<string, string> | null;
  start_page_id?: string | null;
  sort_order: number;
  is_visible: boolean;
  pages?: Array<{ id: string; page_title: string; slug?: string }>;
}

export interface SectionPageOption {
  id: string;
  page_title: string;
  slug: string;
}

export interface SectionsViewProps {
  sections: SectionItem[];
  pages?: SectionPageOption[];
  activeLanguages?: string[];
  onSaveSection?: (data: {
    id?: string;
    name: string;
    translations: Record<string, string>;
    startPageId: string | null;
    sortOrder: number;
    isVisible: boolean;
  }) => Promise<SectionItem | void>;
  onCreateSection?: (data: {
    name: string;
    translations?: Record<string, string>;
    startPageId?: string | null;
    sortOrder: number;
    isVisible: boolean;
  }) => Promise<void>;
  onDeleteSection: (id: string) => Promise<void>;
  onReorderSections?: (orderedIds: string[]) => Promise<void>;
  onToggleVisibility?: (id: string, current: boolean) => Promise<void>;
}

const LANGUAGE_META: Record<string, { code: string; flag: string; label: string }> = {
  sv: { code: "SE", flag: "🇸🇪", label: "Swedish" },
  en: { code: "GB", flag: "🇬🇧", label: "English" },
  de: { code: "DE", flag: "🇩🇪", label: "German" },
  fi: { code: "FI", flag: "🇫🇮", label: "Finnish" },
  no: { code: "NO", flag: "🇳🇴", label: "Norwegian" },
  da: { code: "DK", flag: "🇩🇰", label: "Danish" },
};

export function SectionsView({
  sections,
  pages = [],
  activeLanguages = ["sv", "en", "de"],
  onSaveSection,
  onCreateSection,
  onDeleteSection,
  onReorderSections,
}: SectionsViewProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editNameSv, setEditNameSv] = useState("");
  const [editTranslations, setEditTranslations] = useState<Record<string, string>>({});
  const [editStartPageId, setEditStartPageId] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const secondaryLocales = activeLanguages.filter((l) => l !== "sv");

  const startEdit = (sec: SectionItem) => {
    setIsAddingNew(false);
    setEditingId(sec.id);
    setEditNameSv(sec.name);
    const trans: Record<string, string> = {};
    secondaryLocales.forEach((loc) => {
      trans[loc] = (sec.translations && sec.translations[loc]) || "";
    });
    setEditTranslations(trans);
    setEditStartPageId(sec.start_page_id || "");
  };

  const handleStartAddSection = () => {
    setEditingId("new-section");
    setIsAddingNew(true);
    setEditNameSv("");
    const trans: Record<string, string> = {};
    secondaryLocales.forEach((loc) => {
      trans[loc] = "";
    });
    setEditTranslations(trans);
    setEditStartPageId(pages[0]?.id || "");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setIsAddingNew(false);
  };

  const handleSave = async (sec?: SectionItem) => {
    if (!editNameSv.trim()) return;
    setIsSaving(true);
    try {
      if (isAddingNew || !sec) {
        if (onSaveSection) {
          await onSaveSection({
            name: editNameSv.trim(),
            translations: editTranslations,
            startPageId: editStartPageId || null,
            sortOrder: sections.length + 1,
            isVisible: true,
          });
        } else if (onCreateSection) {
          await onCreateSection({
            name: editNameSv.trim(),
            translations: editTranslations,
            startPageId: editStartPageId || null,
            sortOrder: sections.length + 1,
            isVisible: true,
          });
        }
      } else {
        if (onSaveSection) {
          await onSaveSection({
            id: sec.id,
            name: editNameSv.trim(),
            translations: editTranslations,
            startPageId: editStartPageId || null,
            sortOrder: sec.sort_order,
            isVisible: sec.is_visible,
          });
        }
      }
      setEditingId(null);
      setIsAddingNew(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (id !== dragOverId) {
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

    const currentOrder = [...sections];
    const fromIndex = currentOrder.findIndex((s) => s.id === draggedId);
    const toIndex = currentOrder.findIndex((s) => s.id === targetId);
    if (fromIndex === -1 || toIndex === -1) {
      setDraggedId(null);
      return;
    }

    const [moved] = currentOrder.splice(fromIndex, 1);
    currentOrder.splice(toIndex, 0, moved);
    setDraggedId(null);

    if (onReorderSections) {
      await onReorderSections(currentOrder.map((s) => s.id));
    }
  };

  const getStartPageLabel = (sec: SectionItem) => {
    if (sec.start_page_id) {
      const found =
        pages.find((p) => p.id === sec.start_page_id) ||
        sec.pages?.find((p) => p.id === sec.start_page_id);
      if (found) return found.page_title;
    }
    if (sec.pages && sec.pages.length > 0) {
      return sec.pages[0].page_title;
    }
    return "No start page assigned";
  };

  const getDisplayHeading = (nameSv: string, translations?: Record<string, string> | null) => {
    const enName = translations?.en;
    if (enName && enName.trim() && enName.trim().toLowerCase() !== nameSv.trim().toLowerCase()) {
      return `${nameSv} (${enName})`;
    }
    return nameSv;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Sections</h1>
          <p className="mt-1 text-xs text-slate-400 max-w-2xl leading-relaxed">
            Define the top-level categories and section start pages. These form the primary branches
            of your mobile menu and map to dedicated navigation submenus.
          </p>
        </div>

        <button
          type="button"
          onClick={handleStartAddSection}
          className="flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-sky-600/25 hover:bg-sky-500 transition shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Section</span>
        </button>
      </div>

      {/* Sections List */}
      <div className="space-y-3.5">
        {isAddingNew && editingId === "new-section" && (
          <div className="rounded-2xl border border-sky-500/70 bg-slate-900/95 p-5 shadow-[0_0_25px_rgba(14,165,233,0.18)] transition-all">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              {/* Column 1: Handle + Section Title */}
              <div className="lg:col-span-3 flex items-center gap-3.5">
                <span className="text-slate-600 cursor-grab">
                  <GripVertical className="w-5 h-5" />
                </span>
                <span className="text-base font-medium text-white truncate">
                  {editNameSv.trim()
                    ? getDisplayHeading(editNameSv, editTranslations)
                    : "New Section"}
                </span>
              </div>

              {/* Column 2: Vertically Stacked Multi-language Inputs */}
              <div className="lg:col-span-3 space-y-2">
                <div className="flex items-center gap-2.5">
                  <span className="inline-flex items-center gap-2 w-12 text-[11px] font-semibold text-slate-300 shrink-0">
                    <FlagIcon code="sv" size="sm" />
                    <span>{LANGUAGE_META.sv.code}</span>
                  </span>
                  <input
                    type="text"
                    value={editNameSv}
                    onChange={(e) => setEditNameSv(e.target.value)}
                    placeholder="Section name (SE)"
                    autoFocus
                    className="w-full rounded-lg border border-slate-700 bg-slate-950/90 px-3 py-1.5 text-xs text-white focus:border-sky-500 focus:outline-none"
                  />
                </div>
                {secondaryLocales.map((loc) => {
                  const meta = LANGUAGE_META[loc] || {
                    code: loc.toUpperCase(),
                    flag: "",
                    label: loc,
                  };
                  return (
                    <div key={loc} className="flex items-center gap-2.5">
                      <span className="inline-flex items-center gap-2 w-12 text-[11px] font-semibold text-slate-400 shrink-0">
                        <FlagIcon code={loc} size="sm" />
                        <span>{meta.code}</span>
                      </span>
                      <input
                        type="text"
                        value={editTranslations[loc] || ""}
                        onChange={(e) =>
                          setEditTranslations((prev) => ({
                            ...prev,
                            [loc]: e.target.value,
                          }))
                        }
                        placeholder={`Section name (${meta.code})`}
                        className="w-full rounded-lg border border-slate-700 bg-slate-950/90 px-3 py-1.5 text-xs text-white focus:border-sky-500 focus:outline-none"
                      />
                    </div>
                  );
                })}
              </div>

              {/* Column 3: Section start page select */}
              <div className="lg:col-span-3">
                <label className="block text-[11px] font-medium text-slate-400 mb-1.5">
                  Section start page
                </label>
                <div className="relative">
                  <select
                    value={editStartPageId}
                    onChange={(e) => setEditStartPageId(e.target.value)}
                    className="w-full appearance-none rounded-lg border border-slate-700 bg-slate-950/90 pl-3 pr-8 py-2 text-xs text-white focus:border-sky-500 focus:outline-none"
                  >
                    <option value="">No start page assigned</option>
                    {pages.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.page_title} ({p.slug})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Column 4: Inline Right Controls */}
              <div className="lg:col-span-3 flex flex-col items-end justify-center gap-2.5">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isSaving || !editNameSv.trim()}
                    onClick={() => handleSave()}
                    className="flex items-center gap-1.5 rounded-lg bg-sky-600 px-3.5 py-2 text-xs font-semibold text-white shadow-md shadow-sky-600/20 hover:bg-sky-500 disabled:opacity-50 transition"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{isSaving ? "Saving..." : "Save Changes"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="rounded-lg border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {sections.length === 0 && !isAddingNew ? (
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 py-12 text-center text-xs text-slate-500">
            No sections created yet. Click &quot;+ Add Section&quot; to create your first section.
          </div>
        ) : (
          sections.map((sec) => {
            const isEditing = editingId === sec.id;
            const isDragOver = dragOverId === sec.id && draggedId !== sec.id;

            if (isEditing) {
              return (
                <div
                  key={sec.id}
                  className="rounded-2xl border border-sky-500/70 bg-slate-900/95 p-5 shadow-[0_0_25px_rgba(14,165,233,0.18)] transition-all"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                    {/* Column 1: Handle + Section Title */}
                    <div className="lg:col-span-3 flex items-center gap-3.5">
                      <span className="text-slate-500 cursor-grab">
                        <GripVertical className="w-5 h-5" />
                      </span>
                      <span className="text-base font-medium text-white truncate">
                        {getDisplayHeading(editNameSv || sec.name, editTranslations)}
                      </span>
                    </div>

                    {/* Column 2: Stacked Multi-language Inputs */}
                    <div className="lg:col-span-3 space-y-2">
                      <div className="flex items-center gap-2.5">
                        <span className="inline-flex items-center gap-2 w-12 text-[11px] font-semibold text-slate-300 shrink-0">
                          <FlagIcon code="sv" size="sm" />
                          <span>{LANGUAGE_META.sv.code}</span>
                        </span>
                        <input
                          type="text"
                          value={editNameSv}
                          onChange={(e) => setEditNameSv(e.target.value)}
                          className="w-full rounded-lg border border-slate-700 bg-slate-950/90 px-3 py-1.5 text-xs text-white focus:border-sky-500 focus:outline-none"
                        />
                      </div>
                      {secondaryLocales.map((loc) => {
                        const meta = LANGUAGE_META[loc] || {
                          code: loc.toUpperCase(),
                          flag: "",
                          label: loc,
                        };
                        return (
                          <div key={loc} className="flex items-center gap-2.5">
                            <span className="inline-flex items-center gap-2 w-12 text-[11px] font-semibold text-slate-400 shrink-0">
                              <FlagIcon code={loc} size="sm" />
                              <span>{meta.code}</span>
                            </span>
                            <input
                              type="text"
                              value={editTranslations[loc] || ""}
                              onChange={(e) =>
                                setEditTranslations((prev) => ({
                                  ...prev,
                                  [loc]: e.target.value,
                                }))
                              }
                              placeholder="—"
                              className="w-full rounded-lg border border-slate-700 bg-slate-950/90 px-3 py-1.5 text-xs text-white focus:border-sky-500 focus:outline-none"
                            />
                          </div>
                        );
                      })}
                    </div>

                    {/* Column 3: Section start page dropdown */}
                    <div className="lg:col-span-3">
                      <label className="block text-[11px] font-medium text-slate-400 mb-1.5">
                        Section start page
                      </label>
                      <div className="relative">
                        <select
                          value={editStartPageId}
                          onChange={(e) => setEditStartPageId(e.target.value)}
                          className="w-full appearance-none rounded-lg border border-slate-700 bg-slate-950/90 pl-3 pr-8 py-2 text-xs text-white focus:border-sky-500 focus:outline-none"
                        >
                          <option value="">No start page assigned</option>
                          {pages.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.page_title}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>

                    {/* Column 4: Delete Section + Save Changes / Cancel */}
                    <div className="lg:col-span-3 flex flex-col items-end justify-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Delete section "${sec.name}"?`)) {
                            onDeleteSection(sec.id);
                            setEditingId(null);
                          }
                        }}
                        className="flex items-center gap-1.5 rounded-lg bg-red-600/90 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-red-500 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Section</span>
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={isSaving || !editNameSv.trim()}
                          onClick={() => handleSave(sec)}
                          className="flex items-center gap-1.5 rounded-lg bg-sky-600 px-3.5 py-2 text-xs font-semibold text-white shadow-md shadow-sky-600/20 hover:bg-sky-500 disabled:opacity-50 transition"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>{isSaving ? "Saving..." : "Save Changes"}</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          className="rounded-lg border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={sec.id}
                draggable
                onDragStart={(e) => handleDragStart(e, sec.id)}
                onDragOver={(e) => handleDragOver(e, sec.id)}
                onDragLeave={() => setDragOverId(null)}
                onDrop={(e) => handleDrop(e, sec.id)}
                className={`rounded-2xl border p-5 transition-all ${
                  isDragOver
                    ? "border-sky-500/60 bg-slate-900/90"
                    : "border-slate-800/90 bg-slate-900/45 hover:border-slate-700/80 hover:bg-slate-900/65"
                }`}
              >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                  {/* Column 1: Drag Handle + Heading */}
                  <div className="lg:col-span-3 flex items-center gap-3.5">
                    <span
                      className="text-slate-500 hover:text-slate-300 cursor-grab active:cursor-grabbing transition"
                      title="Drag to reorder section"
                    >
                      <GripVertical className="w-5 h-5" />
                    </span>
                    <span className="text-base font-medium text-white truncate">
                      {getDisplayHeading(sec.name, sec.translations)}
                    </span>
                  </div>

                  {/* Column 2: Vertically Stacked Multi-language Values */}
                  <div className="lg:col-span-3 space-y-1.5">
                    <div className="flex items-center gap-2.5 text-xs">
                      <span className="inline-flex items-center gap-2 w-12 text-[11px] font-semibold text-slate-400 shrink-0">
                        <FlagIcon code="sv" size="sm" />
                        <span>{LANGUAGE_META.sv.code}</span>
                      </span>
                      <span className="text-slate-200 truncate">{sec.name}</span>
                    </div>
                    {secondaryLocales.map((loc) => {
                      const meta = LANGUAGE_META[loc] || {
                        code: loc.toUpperCase(),
                        flag: "",
                        label: loc,
                      };
                      const val = (sec.translations && sec.translations[loc]) || "—";
                      return (
                        <div key={loc} className="flex items-center gap-2.5 text-xs">
                          <span className="inline-flex items-center gap-2 w-12 text-[11px] font-semibold text-slate-400 shrink-0">
                            <FlagIcon code={loc} size="sm" />
                            <span>{meta.code}</span>
                          </span>
                          <span className="text-slate-300 truncate">{val}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Column 3: Start Page */}
                  <div className="lg:col-span-4">
                    <span className="block text-[11px] font-medium text-slate-400 mb-1">
                      Start Page:
                    </span>
                    <span className="text-xs text-slate-200">
                      {getStartPageLabel(sec)}
                    </span>
                  </div>

                  {/* Column 4: Edit Button */}
                  <div className="lg:col-span-2 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => startEdit(sec)}
                      className="flex items-center gap-1.5 rounded-lg border border-slate-700/80 bg-slate-800/70 px-3.5 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800 hover:text-white transition"
                    >
                      <Pencil className="w-3.5 h-3.5 text-slate-400" />
                      <span>Edit</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
