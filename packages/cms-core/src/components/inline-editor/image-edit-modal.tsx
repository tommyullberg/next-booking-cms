"use client";

import React, { useState, useEffect } from "react";
import { useEditorStore } from "../../state/editor-store";
import { X, Check, Loader2, Upload, Image as ImageIcon } from "lucide-react";

export interface ImageEditModalProps {
  onSave?: (data: {
    pageId: string;
    nbr: number;
    imageUrl: string;
    width?: number | null;
    height?: number | null;
    maxWidth?: number | null;
    ratio?: string | null;
  }) => Promise<void> | void;
}

export function ImageEditModal({ onSave }: ImageEditModalProps) {
  const { isModalOpen, selectedField, closeModal } = useEditorStore();
  const [imageUrl, setImageUrl] = useState("");
  const [ratio, setRatio] = useState("16/9");
  const [maxWidth, setMaxWidth] = useState<number | "">("");
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (selectedField?.fieldType === "IMAGE") {
      setImageUrl(selectedField.imageUrl || "");
      setRatio(selectedField.ratio || "16/9");
      setMaxWidth(selectedField.maxWidth ?? "");
      setErrorMessage(null);
    }
  }, [selectedField]);

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
      }
    } catch {
      setErrorMessage("Could not upload image");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    if (!imageUrl.trim()) {
      setErrorMessage("Please enter an image URL or upload an image file");
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 text-white shadow-2xl">
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
            <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-slate-950 flex items-center justify-center p-2">
              <img
                src={imageUrl}
                alt="Preview"
                className="max-h-48 w-auto rounded object-cover"
                style={{ aspectRatio: ratio }}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-800 bg-slate-950 p-6 text-slate-500">
              <ImageIcon className="w-10 h-10 mb-2 opacity-50" />
              <span className="text-xs">No image selected</span>
            </div>
          )}

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

        <div className="mt-6 flex items-center justify-end gap-2 border-t border-slate-800 pt-4">
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
            disabled={isSaving || isUploading}
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
  );
}
