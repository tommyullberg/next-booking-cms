"use client";

import React, { useState, useEffect } from "react";
import { useEditorStore } from "../../state/editor-store";
import { ModalPortal } from "../ui/modal-portal";
import {
  X,
  Check,
  Loader2,
  Upload,
  Image as ImageIcon,
  FolderOpen,
  Trash2,
} from "lucide-react";

interface MediaFileOption {
  id: string;
  file_name: string;
  file_url: string;
}

export interface ImageEditModalProps {
  onSave?: (data: {
    pageId: number | string;
    nbr: number;
    imageUrl: string;
    width?: number | null;
    height?: number | null;
    maxWidth?: number | null;
    ratio?: string | null;
  }) => Promise<void> | void;
  onDelete?: (data: {
    pageId: number | string;
    nbr: number;
  }) => Promise<void> | void;
}

export function ImageEditModal({ onSave, onDelete }: ImageEditModalProps) {
  const { isModalOpen, selectedField, closeModal } = useEditorStore();
  const [imageUrl, setImageUrl] = useState("");
  const [ratio, setRatio] = useState("16/9");
  const [maxWidth, setMaxWidth] = useState<number | "">("");
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [mediaFiles, setMediaFiles] = useState<MediaFileOption[]>([]);
  const [isLoadingMedia, setIsLoadingMedia] = useState(false);

  useEffect(() => {
    if (isModalOpen && selectedField?.fieldType === "IMAGE") {
      setImageUrl(selectedField.imageUrl || "");
      setRatio(selectedField.ratio || "16/9");
      setMaxWidth(selectedField.maxWidth ?? "");
      setErrorMessage(null);

      setIsLoadingMedia(true);
      fetch("/api/cms/media")
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => {
          if (Array.isArray(data)) {
            const imagesOnly = data.filter(
              (item: MediaFileOption) =>
                item.file_url &&
                !item.file_url.toLowerCase().endsWith(".pdf")
            );
            setMediaFiles(imagesOnly);
          }
        })
        .catch(() => {
          // Ignore fetch error and fall back to empty list
        })
        .finally(() => {
          setIsLoadingMedia(false);
        });
    }
  }, [isModalOpen, selectedField]);

  if (!isModalOpen || selectedField?.fieldType !== "IMAGE") {
    return null;
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setErrorMessage(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/cms/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = await response.json();
      if (data.fileUrl) {
        setImageUrl(data.fileUrl);
        setMediaFiles((prev) => {
          if (prev.some((m) => m.file_url === data.fileUrl)) {
            return prev;
          }
          return [
            {
              id: data.id || String(Date.now()),
              file_name: data.fileName || file.name,
              file_url: data.fileUrl,
            },
            ...prev,
          ];
        });
      }
    } catch {
      setErrorMessage("Could not upload image");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        "Vill du tömma detta bildfält? Bilden tas inte bort från Media & Files."
      )
    ) {
      return;
    }

    setIsDeleting(true);
    setErrorMessage(null);
    try {
      if (onDelete) {
        await onDelete({
          pageId: selectedField.pageId,
          nbr: selectedField.nbr,
        });
      } else {
        const res = await fetch("/api/cms/fields/image", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pageId: selectedField.pageId,
            nbr: selectedField.nbr,
          }),
        });

        if (!res.ok) {
          throw new Error("Failed to delete image field");
        }
      }
      closeModal();
      if (typeof window !== "undefined") {
        window.location.reload();
      }
    } catch {
      setErrorMessage("Could not clear image field");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSave = async () => {
    if (!imageUrl.trim()) {
      if (selectedField.imageUrl) {
        return handleDelete();
      }
      setErrorMessage("Please enter an image URL or choose an image");
      return;
    }

    setIsSaving(true);
    try {
      if (onSave) {
        await onSave({
          pageId: selectedField.pageId,
          nbr: selectedField.nbr,
          imageUrl,
          ratio: ratio || null,
          maxWidth: typeof maxWidth === "number" ? maxWidth : null,
        });
      } else {
        const res = await fetch("/api/cms/fields/image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pageId: selectedField.pageId,
            nbr: selectedField.nbr,
            imageUrl,
            ratio: ratio || null,
            maxWidth: typeof maxWidth === "number" ? maxWidth : null,
            classNames: selectedField.classNames,
          }),
        });

        if (!res.ok) {
          throw new Error("Failed to save image field");
        }
      }
      closeModal();
      if (typeof window !== "undefined") {
        window.location.reload();
      }
    } catch {
      setErrorMessage("Could not save image field");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-6 text-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">
              Edit Image Field #{selectedField.nbr}
            </h2>
          </div>
          <button
            type="button"
            onClick={closeModal}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          {imageUrl ? (
            <div className="group relative overflow-hidden rounded-xl border border-slate-800 bg-slate-950 flex items-center justify-center p-2">
              <img
                src={imageUrl}
                alt="Preview"
                className="max-h-48 w-auto rounded object-cover"
                style={{ aspectRatio: ratio }}
              />
              <button
                type="button"
                onClick={() => setImageUrl("")}
                className="absolute top-3 right-3 flex items-center gap-1.5 rounded-lg bg-slate-900/90 border border-slate-700/80 px-2.5 py-1 text-xs text-slate-300 hover:border-red-500/60 hover:bg-red-600 hover:text-white transition shadow-lg backdrop-blur-sm"
                title="Rensa valt bildval"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Rensa</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-800 bg-slate-950 p-6 text-slate-500">
              <ImageIcon className="w-10 h-10 mb-2 opacity-50" />
              <span className="text-xs">No image selected</span>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="flex items-center gap-1.5 text-xs font-medium text-slate-300">
                <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
                <span>Select from Media & Files</span>
              </label>
              <span className="text-[11px] text-slate-400">
                {mediaFiles.length} {mediaFiles.length === 1 ? "image" : "images"}
              </span>
            </div>

            {isLoadingMedia ? (
              <div className="flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-950 py-6 text-xs text-slate-400">
                <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                <span>Loading Media & Files...</span>
              </div>
            ) : mediaFiles.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-800 bg-slate-950/60 py-4 text-center text-xs text-slate-500">
                No uploaded images found in Media & Files yet.
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-44 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950 p-2">
                <button
                  type="button"
                  onClick={() => setImageUrl("")}
                  className={`group relative flex flex-col items-center justify-center overflow-hidden rounded-lg border border-dashed text-left transition p-2 min-h-[72px] ${
                    !imageUrl
                      ? "border-amber-500/80 bg-amber-500/10 text-amber-300 ring-2 ring-amber-500/40"
                      : "border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-600 hover:text-slate-200"
                  }`}
                  title="Ingen bild / Töm bildfält"
                >
                  <Trash2 className="w-5 h-5 mb-1 opacity-70 group-hover:opacity-100" />
                  <span className="text-[10px] text-center font-medium">Ingen bild</span>
                  {!imageUrl && (
                    <div className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-slate-950 shadow">
                      <Check className="h-3 w-3 stroke-[3]" />
                    </div>
                  )}
                </button>
                {mediaFiles.map((item) => {
                  const isSelected = imageUrl === item.file_url;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setImageUrl(item.file_url)}
                      className={`group relative flex flex-col overflow-hidden rounded-lg border text-left transition ${
                        isSelected
                          ? "border-amber-500 ring-2 ring-amber-500/40 bg-slate-900"
                          : "border-slate-800 bg-slate-900/60 hover:border-slate-600"
                      }`}
                      title={item.file_name}
                    >
                      <div className="aspect-video w-full bg-slate-950 overflow-hidden">
                        <img
                          src={item.file_url}
                          alt={item.file_name}
                          className="h-full w-full object-cover group-hover:scale-105 transition duration-200"
                        />
                      </div>
                      <div className="truncate px-1.5 py-1 text-[10px] text-slate-300">
                        {item.file_name}
                      </div>
                      {isSelected && (
                        <div className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-slate-950 shadow">
                          <Check className="h-3 w-3 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Image URL
            </label>
            <input
              type="text"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-slate-100 placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              placeholder="https://... or /uploads/..."
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Or upload local file
            </label>
            <label className="flex items-center justify-center gap-2 cursor-pointer rounded-xl border border-slate-700 bg-slate-800 p-2.5 text-xs font-medium text-slate-200 hover:bg-slate-700">
              {isUploading ? (
                <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
              ) : (
                <Upload className="w-4 h-4 text-amber-400" />
              )}
              <span>
                {isUploading ? "Uploading..." : "Choose image file from computer"}
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={isUploading}
                className="hidden"
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Aspect Ratio
              </label>
              <select
                value={ratio}
                onChange={(e) => setRatio(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2 text-xs text-slate-100 focus:border-amber-500 focus:outline-none"
              >
                <option value="16/9">16:9 (Widescreen)</option>
                <option value="4/3">4:3 (Classic)</option>
                <option value="1/1">1:1 (Square)</option>
                <option value="3/2">3:2 (Photo)</option>
                <option value="auto">Auto</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Max Width (px)
              </label>
              <input
                type="number"
                value={maxWidth}
                onChange={(e) =>
                  setMaxWidth(e.target.value ? Number(e.target.value) : "")
                }
                placeholder="Optional e.g. 800"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2 text-xs text-slate-100 focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          {errorMessage && (
            <p className="text-xs text-red-400">{errorMessage}</p>
          )}
        </div>

        <div className="mt-6 flex items-center justify-between border-t border-slate-800 pt-4">
          <div>
            {selectedField.imageUrl ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting || isSaving || isUploading}
                className="flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-3.5 py-2 text-xs font-medium text-red-400 hover:border-red-500/60 hover:bg-red-600 hover:text-white transition disabled:opacity-50"
                title="Töm bildfältet utan att ta bort filen från Media & Files"
              >
                {isDeleting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                <span>Ta bort bild</span>
              </button>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={closeModal}
              className="rounded-lg px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || isUploading || isDeleting}
              className="flex items-center gap-1.5 rounded-lg bg-amber-600 px-4 py-2 text-xs font-medium text-white shadow-lg shadow-amber-600/20 hover:bg-amber-500 disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
              <span>Save Changes</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </ModalPortal>
);
}
