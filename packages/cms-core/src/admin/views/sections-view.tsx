"use client";

import React, { useState, useId } from "react";
import { useTranslations } from "next-intl";
import { Plus, Trash2, Pencil, Check, GripVertical, Lock } from "lucide-react";
import { FlagIcon } from "../../components/ui/flag-icon";
import { Button } from "../../components/ui/button";
import { useConfirm } from "../../components/confirm";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { FormField } from "../../components/ui/form-field";
import { NativeSelect } from "../../components/ui/select";
import { Card } from "../../components/ui/card";
import { cn } from "../../utils/cn";
import { HOMEPAGE_ID } from "../../utils/slug";
import { LANGUAGE_META } from "../../constants/languages";

export interface SectionItem {
  id: string;
  name: string;
  translations?: Record<string, string> | any;
  start_page_id?: number | string | null;
  sort_order: number;
  is_visible: boolean;
  pages?: Array<{ id: number | string; page_title: string; slug?: string }>;
}

export interface SectionPageOption {
  id: number | string;
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
    startPageId: number | string | null;
    sortOrder: number;
    isVisible: boolean;
  }) => Promise<SectionItem | void>;
  onCreateSection?: (data: {
    name: string;
    translations?: Record<string, string>;
    startPageId?: number | string | null;
    sortOrder: number;
    isVisible: boolean;
  }) => Promise<void>;
  onDeleteSection: (id: string) => Promise<void>;
  onReorderSections?: (orderedIds: string[]) => Promise<void>;
  onToggleVisibility?: (id: string, current: boolean) => Promise<void>;
}

export function SectionsView({
  sections,
  pages = [],
  activeLanguages = ["sv", "en", "de"],
  onSaveSection,
  onCreateSection,
  onDeleteSection,
  onReorderSections,
}: SectionsViewProps) {
  const t = useTranslations("sections");
  const tCommon = useTranslations("common");
  const { confirm } = useConfirm();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editNameSv, setEditNameSv] = useState("");
  const [editTranslations, setEditTranslations] = useState<Record<string, string>>({});
  const [editStartPageId, setEditStartPageId] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const baseFieldId = useId();

  const secondaryLocales = activeLanguages.filter((l) => l !== "sv");

  // Always keep the root section (start_page_id === 1001) at index 0
  const orderedSections = [...sections].sort((a, b) => {
    const aRoot = Number(a.start_page_id) === HOMEPAGE_ID ? 0 : 1;
    const bRoot = Number(b.start_page_id) === HOMEPAGE_ID ? 0 : 1;
    if (aRoot !== bRoot) return aRoot - bRoot;
    return a.sort_order - b.sort_order;
  });

  const nonHomepagePages = pages.filter((p) => Number(p.id) !== HOMEPAGE_ID);

  const startEdit = (sec: SectionItem) => {
    setIsAddingNew(false);
    setEditingId(sec.id);
    setEditNameSv(sec.name);
    const trans: Record<string, string> = {};
    secondaryLocales.forEach((loc) => {
      trans[loc] = (sec.translations && sec.translations[loc]) || "";
    });
    setEditTranslations(trans);
    setEditStartPageId(sec.start_page_id != null ? String(sec.start_page_id) : "");
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
    setEditStartPageId(
      nonHomepagePages[0]?.id != null ? String(nonHomepagePages[0].id) : ""
    );
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setIsAddingNew(false);
  };

  const handleSave = async (sec?: SectionItem) => {
    if (!editNameSv.trim()) return;
    setIsSaving(true);
    try {
      const isRoot = sec && Number(sec.start_page_id) === HOMEPAGE_ID;
      const startPageIdVal = isRoot
        ? HOMEPAGE_ID
        : editStartPageId
        ? Number(editStartPageId)
        : null;

      if (isAddingNew || !sec) {
        if (onSaveSection) {
          await onSaveSection({
            name: editNameSv.trim(),
            translations: editTranslations,
            startPageId: startPageIdVal,
            sortOrder: orderedSections.length + 1,
            isVisible: true,
          });
        } else if (onCreateSection) {
          await onCreateSection({
            name: editNameSv.trim(),
            translations: editTranslations,
            startPageId: startPageIdVal,
            sortOrder: orderedSections.length + 1,
            isVisible: true,
          });
        }
      } else {
        if (onSaveSection) {
          await onSaveSection({
            id: sec.id,
            name: editNameSv.trim(),
            translations: editTranslations,
            startPageId: startPageIdVal,
            sortOrder: isRoot ? 0 : sec.sort_order,
            isVisible: isRoot ? true : sec.is_visible,
          });
        }
      }
      setEditingId(null);
      setIsAddingNew(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDragStart = (e: React.DragEvent, sec: SectionItem) => {
    if (Number(sec.start_page_id) === HOMEPAGE_ID) {
      e.preventDefault();
      return;
    }
    setDraggedId(sec.id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", sec.id);
  };

  const handleDragOver = (e: React.DragEvent, sec: SectionItem) => {
    // Do not allow dropping onto or above the locked root section (page 1001)
    if (Number(sec.start_page_id) === HOMEPAGE_ID) {
      return;
    }
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (sec.id !== dragOverId) {
      setDragOverId(sec.id);
    }
  };

  const handleDrop = async (e: React.DragEvent, targetSec: SectionItem) => {
    e.preventDefault();
    setDragOverId(null);
    if (
      !draggedId ||
      draggedId === targetSec.id ||
      Number(targetSec.start_page_id) === HOMEPAGE_ID
    ) {
      setDraggedId(null);
      return;
    }

    const currentOrder = [...orderedSections];
    const fromIndex = currentOrder.findIndex((s) => s.id === draggedId);
    const toIndex = currentOrder.findIndex((s) => s.id === targetSec.id);
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
    if (Number(sec.start_page_id) === HOMEPAGE_ID) {
      const home = pages.find((p) => Number(p.id) === HOMEPAGE_ID);
      return home
        ? `${home.page_title} (Homepage #1001)`
        : "Startsida (Homepage #1001)";
    }
    if (sec.start_page_id != null && sec.start_page_id !== "") {
      const found =
        pages.find((p) => Number(p.id) === Number(sec.start_page_id)) ||
        sec.pages?.find((p) => Number(p.id) === Number(sec.start_page_id));
      if (found) return `${found.page_title} (#${found.id})`;
    }
    return t("noStartPageAssigned");
  };

  const getDisplayHeading = (
    nameSv: string,
    translations?: Record<string, string> | null
  ) => {
    const enName = translations?.en;
    if (
      enName &&
      enName.trim() &&
      enName.trim().toLowerCase() !== nameSv.trim().toLowerCase()
    ) {
      return `${nameSv} (${enName})`;
    }
    return nameSv;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            {t("title")}
          </h1>
          <p className="mt-1 text-xs text-slate-400 max-w-2xl leading-relaxed">
            {t("subtitle")}
          </p>
        </div>

        <Button
          type="button"
          variant="adminPrimary"
          size="sm"
          onClick={handleStartAddSection}
        >
          <Plus className="w-4 h-4" />
          <span>{t("addSection")}</span>
        </Button>
      </div>

      {/* Sections List */}
      <div className="space-y-3.5">
        {orderedSections.length === 0 && !isAddingNew ? (
          <Card variant="adminSubtle" className="py-12 text-center text-xs text-slate-500">
            No sections created yet. Click &quot;+ Add Section&quot; to create
            your first section.
          </Card>
        ) : (
          orderedSections.map((sec) => {
            const isRootSection = Number(sec.start_page_id) === HOMEPAGE_ID;
            const isEditing = editingId === sec.id;
            const isDragOver =
              !isRootSection && dragOverId === sec.id && draggedId !== sec.id;

            if (isEditing) {
              const editNameId = `${baseFieldId}-${sec.id}-name`;
              const editStartPageSelectId = `${baseFieldId}-${sec.id}-startpage`;

              return (
                <Card
                  key={sec.id}
                  variant="admin"
                  className="p-5 border-sky-500/70 bg-slate-900/95 shadow-[0_0_25px_rgba(14,165,233,0.18)] transition-all"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                    {/* Column 1: Handle/Lock + Section Title */}
                    <div className="lg:col-span-3 flex items-center gap-3.5">
                      {isRootSection ? (
                        <span
                          className="text-sky-400"
                          title="Root section (Page #1001) is locked at the top"
                          aria-label="Root section is locked at top"
                        >
                          <Lock className="w-4 h-4" />
                        </span>
                      ) : (
                        <span
                          className="text-slate-500 cursor-grab"
                          title="Drag to reorder section"
                          aria-label={`Drag to reorder section ${sec.name}`}
                        >
                          <GripVertical className="w-5 h-5" />
                        </span>
                      )}
                      <span className="text-base font-medium text-white truncate">
                        {getDisplayHeading(
                          editNameSv || sec.name,
                          editTranslations
                        )}
                      </span>
                    </div>

                    {/* Column 2: Stacked Multi-language Inputs */}
                    <div className="lg:col-span-3 space-y-2">
                      <div className="flex items-center gap-2.5">
                        <Label htmlFor={editNameId} className="inline-flex items-center gap-2 w-12 text-[11px] font-semibold text-slate-300 shrink-0 cursor-pointer">
                          <FlagIcon code="sv" size="sm" />
                          <span>{LANGUAGE_META.sv.code}</span>
                        </Label>
                        <Input
                          id={editNameId}
                          type="text"
                          variant="admin"
                          size="sm"
                          value={editNameSv}
                          onChange={(e) => setEditNameSv(e.target.value)}
                        />
                      </div>
                      {secondaryLocales.map((loc) => {
                        const meta = LANGUAGE_META[loc] || {
                          code: loc.toUpperCase(),
                          flag: "",
                          label: loc,
                        };
                        const transFieldId = `${baseFieldId}-${sec.id}-${loc}`;
                        return (
                          <div key={loc} className="flex items-center gap-2.5">
                            <Label htmlFor={transFieldId} className="inline-flex items-center gap-2 w-12 text-[11px] font-semibold text-slate-400 shrink-0 cursor-pointer">
                              <FlagIcon code={loc} size="sm" />
                              <span>{meta.code}</span>
                            </Label>
                            <Input
                              id={transFieldId}
                              type="text"
                              variant="admin"
                              size="sm"
                              value={editTranslations[loc] || ""}
                              onChange={(e) =>
                                setEditTranslations((prev) => ({
                                  ...prev,
                                  [loc]: e.target.value,
                                }))
                              }
                              placeholder="—"
                            />
                          </div>
                        );
                      })}
                    </div>

                    {/* Column 3: Section start page dropdown (Locked for Root Section 1001) */}
                    <div className="lg:col-span-3">
                      <Label htmlFor={editStartPageSelectId} className="block text-[11px] font-medium text-slate-400 mb-1.5">
                        {t("sectionStartPage")}
                      </Label>
                      {isRootSection ? (
                        <div className="flex items-center gap-2 rounded-lg border border-admin-border bg-slate-950/60 px-3 py-2 text-xs text-slate-400">
                          <Lock className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                          <span className="truncate">
                            {getStartPageLabel(sec)}
                          </span>
                        </div>
                      ) : (
                        <NativeSelect
                          id={editStartPageSelectId}
                          variant="admin"
                          size="sm"
                          value={editStartPageId}
                          onChange={(e) => setEditStartPageId(e.target.value)}
                        >
                          <option value="">{t("noStartPageAssigned")}</option>
                          {nonHomepagePages.map((p) => (
                            <option key={p.id} value={String(p.id)}>
                              {p.page_title} (#{p.id})
                            </option>
                          ))}
                        </NativeSelect>
                      )}
                    </div>

                    {/* Column 4: Delete Section (hidden on Root Section) + Save Changes / Cancel */}
                    <div className="lg:col-span-3 flex flex-col items-end justify-center gap-2.5">
                      {!isRootSection && (
                        <Button
                          type="button"
                          variant="adminGhost"
                          size="sm"
                          onClick={async () => {
                            await confirm({
                              title: tCommon("delete"),
                              description: t("deleteConfirm"),
                              variant: "destructive",
                              onConfirm: async () => {
                                await onDeleteSection(sec.id);
                                setEditingId(null);
                              },
                            });
                          }}
                          className="text-rose-400 hover:text-rose-300 hover:bg-rose-950/20"
                          aria-label={`${tCommon("delete")} ${sec.name}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>{tCommon("delete")}</span>
                        </Button>
                      )}

                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="adminPrimary"
                          size="sm"
                          disabled={isSaving || !editNameSv.trim()}
                          onClick={() => handleSave(sec)}
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>{isSaving ? tCommon("loading") : tCommon("save")}</span>
                        </Button>
                        <Button
                          type="button"
                          variant="adminSecondary"
                          size="sm"
                          onClick={handleCancelEdit}
                        >
                          {tCommon("cancel")}
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            }

            return (
              <Card
                key={sec.id}
                variant="admin"
                draggable={!isRootSection}
                onDragStart={(e) => handleDragStart(e, sec)}
                onDragOver={(e) => handleDragOver(e, sec)}
                onDragLeave={() => setDragOverId(null)}
                onDrop={(e) => handleDrop(e, sec)}
                className={cn(
                  "p-5 transition-all",
                  isDragOver
                    ? "border-sky-500/60 bg-slate-900/90"
                    : "hover:border-slate-700/80 hover:bg-slate-900/65"
                )}
              >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                  {/* Column 1: Drag Handle / Lock + Heading */}
                  <div className="lg:col-span-3 flex items-center gap-3.5">
                    {isRootSection ? (
                      <span
                        className="text-sky-400/80 p-0.5"
                        title="Root section (Page #1001) cannot be reordered or deleted"
                        aria-label="Root section is locked at top"
                      >
                        <Lock className="w-4 h-4" />
                      </span>
                    ) : (
                      <span
                        className="text-slate-500 hover:text-slate-300 cursor-grab active:cursor-grabbing transition"
                        title="Drag to reorder section"
                        aria-label={`Drag to reorder section ${sec.name}`}
                      >
                        <GripVertical className="w-5 h-5" />
                      </span>
                    )}
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
                      const val =
                        (sec.translations && sec.translations[loc]) || "—";
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
                      {t("startPage")}:
                    </span>
                    <span className="text-xs text-slate-200">
                      {getStartPageLabel(sec)}
                    </span>
                  </div>

                  {/* Column 4: Edit Button */}
                  <div className="lg:col-span-2 flex items-center justify-end">
                    <Button
                      type="button"
                      variant="adminSecondary"
                      size="sm"
                      onClick={() => startEdit(sec)}
                      aria-label={`${tCommon("edit")} ${sec.name}`}
                    >
                      <Pencil className="w-3.5 h-3.5 text-slate-400" />
                      <span>{tCommon("edit")}</span>
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })
        )}

        {/* Inline Add New Section Row (placed below existing sections) */}
        {isAddingNew && editingId === "new-section" && (
          <Card variant="admin" className="p-5 border-sky-500/70 bg-slate-900/95 shadow-[0_0_25px_rgba(14,165,233,0.18)] transition-all">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              <div className="lg:col-span-3 flex items-center gap-3.5">
                <span
                  className="text-slate-600 cursor-grab"
                  aria-label="New section cannot be reordered until saved"
                >
                  <GripVertical className="w-5 h-5" />
                </span>
                <span className="text-base font-medium text-white truncate">
                  {editNameSv.trim()
                    ? getDisplayHeading(editNameSv, editTranslations)
                    : "New Section"}
                </span>
              </div>

              <div className="lg:col-span-3 space-y-2">
                <div className="flex items-center gap-2.5">
                  <Label htmlFor={`${baseFieldId}-new-name`} className="inline-flex items-center gap-2 w-12 text-[11px] font-semibold text-slate-300 shrink-0 cursor-pointer">
                    <FlagIcon code="sv" size="sm" />
                    <span>{LANGUAGE_META.sv.code}</span>
                  </Label>
                  <Input
                    id={`${baseFieldId}-new-name`}
                    type="text"
                    variant="admin"
                    size="sm"
                    value={editNameSv}
                    onChange={(e) => setEditNameSv(e.target.value)}
                    placeholder="Section name (SE)"
                    autoFocus
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
                      <Label htmlFor={`${baseFieldId}-new-${loc}`} className="inline-flex items-center gap-2 w-12 text-[11px] font-semibold text-slate-400 shrink-0 cursor-pointer">
                        <FlagIcon code={loc} size="sm" />
                        <span>{meta.code}</span>
                      </Label>
                      <Input
                        id={`${baseFieldId}-new-${loc}`}
                        type="text"
                        variant="admin"
                        size="sm"
                        value={editTranslations[loc] || ""}
                        onChange={(e) =>
                          setEditTranslations((prev) => ({
                            ...prev,
                            [loc]: e.target.value,
                          }))
                        }
                        placeholder={`Section name (${meta.code})`}
                      />
                    </div>
                  );
                })}
              </div>

              <FormField
                label={t("sectionStartPage")}
                labelVariant="muted"
                labelSize="sm"
                labelClassName="font-medium"
                className="lg:col-span-3"
              >
                <NativeSelect
                  variant="admin"
                  size="sm"
                  value={editStartPageId}
                  onChange={(e) => setEditStartPageId(e.target.value)}
                >
                  <option value="">{t("noStartPageAssigned")}</option>
                  {nonHomepagePages.map((p) => (
                    <option key={p.id} value={String(p.id)}>
                      {p.page_title} (#{p.id})
                    </option>
                  ))}
                </NativeSelect>
              </FormField>

              <div className="lg:col-span-3 flex flex-col items-end justify-center gap-2.5">
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="adminPrimary"
                    size="sm"
                    disabled={isSaving || !editNameSv.trim()}
                    onClick={() => handleSave()}
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{isSaving ? tCommon("loading") : tCommon("save")}</span>
                  </Button>
                  <Button
                    type="button"
                    variant="adminSecondary"
                    size="sm"
                    onClick={handleCancelEdit}
                  >
                    {tCommon("cancel")}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
