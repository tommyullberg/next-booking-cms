"use client";

import React, { useState } from "react";
import { Upload, Trash2, Copy, Check, Image as ImageIcon, Loader2 } from "lucide-react";

export interface MediaItem {
  id: string;
  file_name: string;
  file_url: string;
  created_date: string | Date;
}

export interface MediaViewProps {
  media: MediaItem[];
  onUpload: (file: File) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function MediaView({ media, onUpload, onDelete }: MediaViewProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      await onUpload(file);
    } finally {
      setIsUploading(false);
    }
  };

  const copyUrl = (id: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Mediebibliotek</h1>
          <p className="mt-1 text-sm text-slate-400">
            Ladda upp och hantera bilder och dokument sparade via Storage Adapter.
          </p>
        </div>

        <label className="flex items-center gap-2 cursor-pointer rounded-xl bg-sky-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-sky-600/20 hover:bg-sky-500 transition">
          {isUploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Upload className="w-4 h-4" />
          )}
          <span>{isUploading ? "Laddar upp..." : "Ladda upp bild"}</span>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={isUploading}
            className="hidden"
          />
        </label>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {media.length === 0 ? (
          <div className="col-span-full py-12 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 text-slate-500 text-xs">
            Inga mediefiler uppladdade ännu.
          </div>
        ) : (
          media.map((item) => (
            <div
              key={item.id}
              className="group relative rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden flex flex-col hover:border-slate-700 transition shadow-sm"
            >
              <div className="aspect-video bg-slate-950 flex items-center justify-center overflow-hidden">
                <img
                  src={item.file_url}
                  alt={item.file_name}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                />
              </div>

              <div className="p-3 flex items-center justify-between gap-2 border-t border-slate-800/80 bg-slate-900/90">
                <div className="truncate text-xs font-medium text-slate-200" title={item.file_name}>
                  {item.file_name}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => copyUrl(item.id, item.file_url)}
                    className="p-1 rounded text-slate-400 hover:text-sky-400 hover:bg-slate-800 transition"
                    title="Kopiera bild-URL"
                  >
                    {copiedId === item.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Radera "${item.file_name}"?`)) {
                        onDelete(item.id);
                      }
                    }}
                    className="p-1 rounded text-slate-400 hover:text-red-400 hover:bg-slate-800 transition"
                    title="Radera fil"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
