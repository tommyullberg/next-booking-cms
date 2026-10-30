"use client";

import React, { useState, useEffect } from "react";
import { useEditorStore } from "../../state/editor-store";
import { ModalPortal } from "../ui/modal-portal";
import { FlagIcon } from "../ui/flag-icon";
import { LANGUAGE_META } from "../../constants/languages";
import {
  X,
  Check,
  Loader2,
  Upload,
  Images,
  FolderOpen,
  Trash2,
  GripVertical,
  Plus,
  Sparkles,
  ArrowUp,
  ArrowDown,
  FolderPlus,
  Maximize2,
  Minimize2,
} from "lucide-react";

interface MediaFolderOption {
  id: string;
  name: string;
  slug: string;
  parent_id?: string | null;
}

interface MediaFileOption {
  id: string;
  file_name: string;
  file_url: string;
  folder_id?: string | null;
}

export interface EditableGalleryItem {
  uid: string;
  imageId: string;
  imageUrl: string;
  fileName: string;
  caption: string;
  translations: Record<string, string>;
}

export interface GalleryEditModalProps {
  onSave?: (data: {
    pageId: number | string;
    nbr: number;
    items: Array<{
      imageId: string;
      imageUrl: string;
      caption: string;
      translations: Record<string, string>;
      sortOrder: number;
    }>;
  }) => Promise<void> | void;
}

export function GalleryEditModal({ onSave }: GalleryEditModalProps) {
  const { isModalOpen, selectedField, closeModal } = useEditorStore();

  const [items, setItems] = useState<EditableGalleryItem[]>([]);
  const [languages, setLanguages] = useState<string[]>(["sv", "en", "de"]);
  const [activeCaptionLocale, setActiveCaptionLocale] = useState<string>("sv");
  const [translatingKey, setTranslatingKey] = useState<string | null>(null);

  const [mediaFiles, setMediaFiles] = useState<MediaFileOption[]>([]);
  const [folders, setFolders] = useState<MediaFolderOption[]>([]);
  const [selectedFolderFilter, setSelectedFolderFilter] =
    useState<string>("ALL");
  const [isLoadingMedia, setIsLoadingMedia] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOverUpload, setIsDragOverUpload] = useState(false);

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isModalOpen && selectedField?.fieldType === "GALLERY") {
      const initialItems: EditableGalleryItem[] = (
        selectedField.galleryItems || []
      )
        .filter((g) => g.image?.file_url)
        .map((g, idx) => ({
          uid: g.id || `${g.image_id}-${idx}-${Date.now()}`,
          imageId: g.image_id,
          imageUrl: g.image?.file_url || "",
          fileName: g.image?.file_name || `Image ${idx + 1}`,
          caption: g.caption || "",
          translations:
            g.translations && typeof g.translations === "object"
              ? { ...g.translations }
              : {},
        }));

      setItems(initialItems);
      setActiveCaptionLocale("sv");
      setErrorMessage(null);
      setStatusMessage(null);

      // Load active languages
      fetch("/api/cms/settings")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && Array.isArray(data.activeLanguages)) {
            setLanguages(Array.from(new Set(["sv", ...data.activeLanguages])));
          }
        })
        .catch(() => {});

      // Load media files & folders
      setIsLoadingMedia(true);
      Promise.all([
        fetch("/api/cms/media").then((r) => (r.ok ? r.json() : [])),
        fetch("/api/cms/media/folders").then((r) => (r.ok ? r.json() : [])),
      ])
        .then(([mediaData, folderData]) => {
          if (Array.isArray(mediaData)) {
            const imagesOnly = mediaData.filter(
              (m: MediaFileOption) =>
                m.file_url && !m.file_url.toLowerCase().endsWith(".pdf")
            );
            setMediaFiles(imagesOnly);
          }
          if (Array.isArray(folderData)) {
            setFolders(folderData);
          }
        })
        .catch(() => {})
        .finally(() => {
          setIsLoadingMedia(false);
        });
    }
  }, [isModalOpen, selectedField]);

  if (!isModalOpen || selectedField?.fieldType !== "GALLERY") {
    return null;
  }

  const getFolderDisplayLabel = (folder: MediaFolderOption): string => {
    if (!folder.parent_id) return folder.name;
    const parent = folders.find((f) => f.id === folder.parent_id);
    return parent ? `${parent.name} / ${folder.name}` : folder.name;
  };

  // Ordered hierarchical folders for dropdown
  const orderedFolders: MediaFolderOption[] = [];
  const rootFolders = folders.filter((f) => !f.parent_id);
  for (const root of rootFolders) {
    orderedFolders.push(root);
    const children = folders.filter((c) => c.parent_id === root.id);
    for (const child of children) {
      orderedFolders.push(child);
    }
  }

  const filteredMediaFiles = mediaFiles.filter((file) => {
    if (selectedFolderFilter === "ALL") return true;
    if (selectedFolderFilter === "UNCATEGORIZED") return !file.folder_id;
    return file.folder_id === selectedFolderFilter;
  });

  const handleAddMediaFile = (file: MediaFileOption) => {
    setItems((prev) => [
      ...prev,
      {
        uid: `${file.id}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        imageId: file.id,
        imageUrl: file.file_url,
        fileName: file.file_name,
        caption: "",
        translations: {},
      },
    ]);
  };

  const handleAddAllInCurrentView = () => {
    const existingIds = new Set(items.map((i) => i.imageId));
    const toAdd = filteredMediaFiles.filter((f) => !existingIds.has(f.id));
    if (toAdd.length === 0) return;

    setItems((prev) => [
      ...prev,
      ...toAdd.map((file) => ({
        uid: `${file.id}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        imageId: file.id,
        imageUrl: file.file_url,
        fileName: file.file_name,
        caption: "",
        translations: {},
      })),
    ]);
  };

  const handleRemoveItem = (uid: string) => {
    setItems((prev) => prev.filter((item) => item.uid !== uid));
  };

  const handleMoveItem = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= items.length) return;
    setItems((prev) => {
      const next = [...prev];
      const [moved] = next.splice(index, 1);
      next.splice(targetIndex, 0, moved);
      return next;
    });
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }
    setItems((prev) => {
      const next = [...prev];
      const [moved] = next.splice(draggedIndex, 1);
      next.splice(dropIndex, 0, moved);
      return next;
    });
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleCaptionChange = (uid: string, value: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.uid !== uid) return item;
        if (activeCaptionLocale === "sv") {
          return { ...item, caption: value };
        }
        return {
          ...item,
          translations: {
            ...item.translations,
            [activeCaptionLocale]: value,
          },
        };
      })
    );
  };

  const handleTranslateSingleItem = async (item: EditableGalleryItem) => {
    const sourceText = item.caption.trim();
    if (!sourceText) return;

    const targetLocales =
      activeCaptionLocale !== "sv"
        ? [activeCaptionLocale]
        : languages.filter((l) => l !== "sv");

    if (targetLocales.length === 0) return;

    setTranslatingKey(item.uid);
    setStatusMessage(null);

    try {
      const updatedTranslations = { ...item.translations };
      for (const loc of targetLocales) {
        const res = await fetch("/api/cms/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: sourceText,
            sourceLang: "sv",
            targetLang: loc,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.translatedText) {
            updatedTranslations[loc] = data.translatedText;
          }
        }
      }
      setItems((prev) =>
        prev.map((it) =>
          it.uid === item.uid
            ? { ...it, translations: updatedTranslations }
            : it
        )
      );
      setStatusMessage(
        `Translated caption into ${targetLocales
          .map((l) => l.toUpperCase())
          .join(", ")}`
      );
    } catch {
      setErrorMessage("Could not translate caption automatically");
    } finally {
      setTranslatingKey(null);
    }
  };

  const handleTranslateAllCaptions = async () => {
    const secondaryLocales =
      activeCaptionLocale !== "sv"
        ? [activeCaptionLocale]
        : languages.filter((l) => l !== "sv");

    if (secondaryLocales.length === 0) return;
    const itemsWithCaption = items.filter((it) => it.caption.trim().length > 0);
    if (itemsWithCaption.length === 0) return;

    setTranslatingKey("ALL");
    setStatusMessage(null);

    try {
      const nextItems = [...items];
      for (let i = 0; i < nextItems.length; i++) {
        const item = nextItems[i];
        if (!item.caption.trim()) continue;
        const updatedTranslations = { ...item.translations };
        for (const loc of secondaryLocales) {
          const res = await fetch("/api/cms/translate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              text: item.caption.trim(),
              sourceLang: "sv",
              targetLang: loc,
            }),
          });
          if (res.ok) {
            const data = await res.json();
            if (data.translatedText) {
              updatedTranslations[loc] = data.translatedText;
            }
          }
        }
        nextItems[i] = { ...item, translations: updatedTranslations };
      }
      setItems(nextItems);
      setStatusMessage(
        `Translated all captions into ${secondaryLocales
          .map((l) => l.toUpperCase())
          .join(", ")}`
      );
    } catch {
      setErrorMessage("Could not translate captions automatically");
    } finally {
      setTranslatingKey(null);
    }
  };

  const uploadFilesToGallery = async (fileList: File[]) => {
    if (fileList.length === 0) return;
    setIsUploading(true);
    setErrorMessage(null);

    const targetFolderId =
      selectedFolderFilter !== "ALL" && selectedFolderFilter !== "UNCATEGORIZED"
        ? selectedFolderFilter
        : null;

    try {
      const newlyUploaded: MediaFileOption[] = [];
      for (const file of fileList) {
        const formData = new FormData();
        formData.append("file", file);
        if (targetFolderId) {
          formData.append("folderId", targetFolderId);
        }

        const res = await fetch("/api/cms/upload", {
          method: "POST",
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          if (data.fileUrl && data.id) {
            const uploadedItem: MediaFileOption = {
              id: data.id,
              file_name: data.fileName || file.name,
              file_url: data.fileUrl,
              folder_id: data.folderId || targetFolderId,
            };
            newlyUploaded.push(uploadedItem);
          }
        }
      }

      if (newlyUploaded.length > 0) {
        setMediaFiles((prev) => [...newlyUploaded, ...prev]);
        setItems((prev) => [
          ...prev,
          ...newlyUploaded.map((f) => ({
            uid: `${f.id}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            imageId: f.id,
            imageUrl: f.file_url,
            fileName: f.file_name,
            caption: "",
            translations: {},
          })),
        ]);
      }
    } catch {
      setErrorMessage("Could not upload one or more files");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage(null);

    const payload = {
      pageId: selectedField.pageId,
      nbr: selectedField.nbr,
      items: items.map((item, idx) => ({
        imageId: item.imageId,
        imageUrl: item.imageUrl,
        caption: item.caption.trim(),
        translations: item.translations,
        sortOrder: idx,
      })),
    };

    try {
      if (onSave) {
        await onSave(payload);
      } else {
        const res = await fetch("/api/cms/fields/gallery", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          throw new Error("Failed to save gallery");
        }
      }
      closeModal();
      window.location.reload();
    } catch {
      setErrorMessage("Could not save gallery changes");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto">
        <div
          className={`rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-6 text-slate-100 shadow-2xl my-auto flex flex-col transition-all duration-200 ${
            isMaximized
              ? "w-[98vw] max-w-[98vw] h-[95vh] max-h-[95vh]"
              : "w-full max-w-5xl max-h-[92vh]"
          }`}
        >
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Images className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400">
                  Gallery Field #{selectedField.nbr}
                </span>
                <h3 className="text-lg font-semibold text-white">
                  Manage Gallery Images & Captions ({items.length})
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setIsMaximized((prev) => !prev)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer"
                title={isMaximized ? "Restore modal size" : "Maximize modal"}
                aria-label={isMaximized ? "Restore modal size" : "Maximize modal"}
              >
                {isMaximized ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </button>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer"
                title="Close modal"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Main Split Content */}
          <form
            onSubmit={handleSave}
            className="flex-1 min-h-0 flex flex-col justify-between overflow-hidden mt-4"
          >
            <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-y-auto lg:overflow-hidden pr-1">
              {/* LEFT COLUMN (7 cols): Sortable Gallery List & Captions */}
              <div className="lg:col-span-7 flex flex-col min-h-0">
                {/* Language Switcher for Captions */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3 bg-slate-950/70 border border-slate-800/90 rounded-xl p-2.5 shrink-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-semibold text-slate-400 mr-1">
                      Caption Language:
                    </span>
                    {languages.map((loc) => {
                      const meta = LANGUAGE_META[loc];
                      const isActive = activeCaptionLocale === loc;
                      return (
                        <button
                          key={loc}
                          type="button"
                          onClick={() => setActiveCaptionLocale(loc)}
                          className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition cursor-pointer ${
                            isActive
                              ? "bg-sky-600 text-white shadow"
                              : "bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                          }`}
                        >
                          <FlagIcon code={loc} size="sm" />
                          <span>{meta ? meta.code : loc.toUpperCase()}</span>
                        </button>
                      );
                    })}
                  </div>

                  {languages.length > 1 && items.some((i) => i.caption.trim()) && (
                    <button
                      type="button"
                      disabled={translatingKey !== null}
                      onClick={handleTranslateAllCaptions}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold text-amber-300 hover:bg-amber-500/20 disabled:opacity-50 transition cursor-pointer"
                      title="Translate Swedish captions into secondary languages"
                    >
                      {translatingKey === "ALL" ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5" />
                      )}
                      <span>AI Translate All</span>
                    </button>
                  )}
                </div>

                {statusMessage && (
                  <div className="mb-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-300 shrink-0">
                    {statusMessage}
                  </div>
                )}

                {/* Gallery Items List */}
                <div
                  className={`flex-1 min-h-0 overflow-y-auto space-y-2.5 pr-1 ${
                    isMaximized ? "" : "max-h-[460px]"
                  }`}
                >
                  {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-800 bg-slate-950/40 p-10 text-center">
                      <Images className="w-10 h-10 text-slate-600 mb-2" />
                      <p className="text-sm font-medium text-slate-300">
                        This gallery has no images yet
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Click images in the Media Library on the right or drop files to add photos.
                      </p>
                    </div>
                  ) : (
                    items.map((item, idx) => {
                      const currentCaptionValue =
                        activeCaptionLocale === "sv"
                          ? item.caption
                          : item.translations[activeCaptionLocale] || "";

                      return (
                        <div
                          key={item.uid}
                          draggable
                          onDragStart={() => handleDragStart(idx)}
                          onDragOver={(e) => handleDragOver(e, idx)}
                          onDrop={(e) => handleDrop(e, idx)}
                          onDragEnd={() => {
                            setDraggedIndex(null);
                            setDragOverIndex(null);
                          }}
                          className={`flex items-center gap-3 rounded-xl border p-2.5 transition ${
                            dragOverIndex === idx
                              ? "border-amber-400 bg-amber-500/10"
                              : "border-slate-800 bg-slate-950/70 hover:border-slate-700"
                          }`}
                        >
                          {/* Drag Handle & Order Controls */}
                          <div className="flex flex-col items-center gap-0.5 text-slate-500 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleMoveItem(idx, -1)}
                              disabled={idx === 0}
                              className="p-0.5 hover:text-slate-200 disabled:opacity-25 cursor-pointer"
                              title="Move up"
                            >
                              <ArrowUp className="w-3 h-3" />
                            </button>
                            <div
                              className="cursor-grab active:cursor-grabbing p-0.5 text-slate-400 hover:text-white"
                              title="Drag to reorder"
                            >
                              <GripVertical className="w-4 h-4" />
                            </div>
                            <button
                              type="button"
                              onClick={() => handleMoveItem(idx, 1)}
                              disabled={idx === items.length - 1}
                              className="p-0.5 hover:text-slate-200 disabled:opacity-25 cursor-pointer"
                              title="Move down"
                            >
                              <ArrowDown className="w-3 h-3" />
                            </button>
                          </div>

                          {/* Thumbnail */}
                          <div className="relative h-16 w-24 rounded-lg overflow-hidden bg-slate-900 border border-slate-800 shrink-0">
                            <img
                              src={item.imageUrl}
                              alt={item.fileName}
                              className="h-full w-full object-cover"
                            />
                            <span className="absolute top-1 left-1 rounded bg-black/75 px-1.5 py-0.5 text-[10px] font-mono font-bold text-amber-400">
                              #{idx + 1}
                            </span>
                          </div>

                          {/* Caption Input */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span className="text-[11px] text-slate-400 truncate">
                                {item.fileName}
                              </span>
                              {activeCaptionLocale !== "sv" && item.caption && (
                                <span className="text-[10px] text-slate-500 truncate max-w-[180px]">
                                  SV: {item.caption}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <input
                                type="text"
                                value={currentCaptionValue}
                                onChange={(e) =>
                                  handleCaptionChange(item.uid, e.target.value)
                                }
                                placeholder={
                                  activeCaptionLocale === "sv"
                                    ? "Write image caption (optional)..."
                                    : `Caption in ${activeCaptionLocale.toUpperCase()}...`
                                }
                                className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none"
                              />
                              {languages.length > 1 && item.caption.trim() && (
                                <button
                                  type="button"
                                  disabled={translatingKey !== null}
                                  onClick={() => handleTranslateSingleItem(item)}
                                  className="rounded-lg border border-slate-700 bg-slate-800 p-1.5 text-amber-400 hover:bg-slate-700 disabled:opacity-50 shrink-0 cursor-pointer"
                                  title="AI Translate this caption"
                                >
                                  {translatingKey === item.uid ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <Sparkles className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Remove from gallery */}
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.uid)}
                            className="rounded-lg p-2 text-slate-400 hover:bg-rose-500/15 hover:text-rose-400 transition shrink-0 cursor-pointer"
                            title="Remove from gallery (does not delete file)"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* RIGHT COLUMN (5 cols): Media Picker & Multi-Upload Dropzone */}
              <div className="lg:col-span-5 flex flex-col min-h-0 border-t lg:border-t-0 lg:border-l border-slate-800 pt-4 lg:pt-0 lg:pl-6">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                    <FolderOpen className="w-4 h-4 text-sky-400" />
                    <span>Add from Media & Files</span>
                  </div>
                  {filteredMediaFiles.length > 0 && (
                    <button
                      type="button"
                      onClick={handleAddAllInCurrentView}
                      className="inline-flex items-center gap-1 rounded-lg border border-sky-500/30 bg-sky-500/10 px-2.5 py-1 text-[11px] font-semibold text-sky-300 hover:bg-sky-500/20 transition cursor-pointer"
                    >
                      <FolderPlus className="w-3.5 h-3.5" />
                      <span>Add all in folder</span>
                    </button>
                  )}
                </div>

                {/* Folder Filter Select */}
                <div className="mb-3">
                  <select
                    value={selectedFolderFilter}
                    onChange={(e) => setSelectedFolderFilter(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-sky-500 focus:outline-none"
                  >
                    <option value="ALL">All Files ({mediaFiles.length})</option>
                    <option value="UNCATEGORIZED">Mediafolder (Root)</option>
                    {orderedFolders.map((f) => (
                      <option key={f.id} value={f.id}>
                        {getFolderDisplayLabel(f)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Dropzone for direct multi-file upload */}
                <label
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (!isDragOverUpload) setIsDragOverUpload(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDragOverUpload(false);
                  }}
                  onDrop={async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDragOverUpload(false);
                    const droppedFiles = Array.from(
                      e.dataTransfer?.files || []
                    );
                    await uploadFilesToGallery(droppedFiles);
                  }}
                  className={`mb-3 flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-3.5 text-center transition cursor-pointer ${
                    isDragOverUpload
                      ? "border-sky-400 bg-sky-500/10"
                      : "border-slate-800 bg-slate-950/50 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-2 text-xs font-semibold text-sky-400">
                    {isUploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Uploading to gallery...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        <span>Drop files here or click to upload</span>
                      </>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-500 mt-0.5">
                    Uploaded images are added directly to this gallery
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    disabled={isUploading}
                    onChange={async (e) => {
                      const selected = Array.from(e.target.files || []);
                      await uploadFilesToGallery(selected);
                      e.target.value = "";
                    }}
                    className="hidden"
                  />
                </label>

                {/* Media Grid */}
                <div
                  className={`flex-1 min-h-0 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950/60 p-2.5 ${
                    isMaximized ? "" : "max-h-[320px]"
                  }`}
                >
                  {isLoadingMedia ? (
                    <div className="flex items-center justify-center py-8 text-xs text-slate-400 gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Loading images...</span>
                    </div>
                  ) : filteredMediaFiles.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-500">
                      No images in this folder.
                    </div>
                  ) : (
                    <div
                      className={`grid gap-2 ${
                        isMaximized
                          ? "grid-cols-3 xl:grid-cols-4"
                          : "grid-cols-3"
                      }`}
                    >
                      {filteredMediaFiles.map((file) => {
                        const countInGallery = items.filter(
                          (i) => i.imageId === file.id
                        ).length;

                        return (
                          <button
                            key={file.id}
                            type="button"
                            onClick={() => handleAddMediaFile(file)}
                            className={`group relative aspect-video rounded-lg overflow-hidden border text-left transition cursor-pointer ${
                              countInGallery > 0
                                ? "border-emerald-500/70 ring-1 ring-emerald-500/30"
                                : "border-slate-800 hover:border-sky-400"
                            }`}
                            title={`Click to add ${file.file_name}`}
                          >
                            <img
                              src={file.file_url}
                              alt={file.file_name}
                              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                              <div className="rounded-full bg-sky-600 p-1 text-white shadow">
                                <Plus className="w-3.5 h-3.5" />
                              </div>
                            </div>
                            {countInGallery > 0 && (
                              <span className="absolute top-1 right-1 rounded bg-emerald-600/95 px-1.5 py-0.5 text-[9px] font-bold text-white shadow">
                                Added
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {errorMessage && (
              <div className="mt-3 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
                {errorMessage}
              </div>
            )}

            {/* Footer */}
            <div className="mt-5 flex items-center justify-between gap-2 border-t border-slate-800 pt-4 shrink-0">
              <div>
                {items.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (
                        confirm(
                          "Remove all images from this gallery? The files will remain in Media & Files."
                        )
                      ) {
                        setItems([]);
                      }
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Clear Gallery</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving || isUploading}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-5 py-2 text-xs font-semibold text-white hover:bg-sky-500 disabled:opacity-50 cursor-pointer"
                >
                  {isSaving ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Check className="h-3.5 w-3.5" />
                  )}
                  <span>Save Gallery</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </ModalPortal>
  );
}

