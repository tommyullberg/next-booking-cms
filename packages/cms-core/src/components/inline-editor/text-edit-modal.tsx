"use client";

import React, { useState, useEffect } from "react";
import { useEditorStore } from "../../state/editor-store";
import { Sparkles, X, Check, Loader2 } from "lucide-react";

export interface TextEditModalProps {
  onSave?: (data: {
    pageId: string;
    nbr: number;
    content: string;
    locale: string;
  }) => Promise<void> | void;
}

export function TextEditModal({ onSave }: TextEditModalProps) {
  const { isModalOpen, selectedField, closeModal } = useEditorStore();
  const [content, setContent] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    if (selectedField?.fieldType === "TEXT") {
      setContent(selectedField.content || "");
      setStatusMessage(null);
    }
  }, [selectedField]);

  if (!isModalOpen || selectedField?.fieldType !== "TEXT") {
    return null;
  }

  const handleTranslate = async () => {
    if (!content.trim()) return;

    setIsTranslating(true);
    setStatusMessage(null);

    try {
      const targetLang = selectedField.locale || "en";
      const response = await fetch("/api/cms/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: content,
          sourceLang: "sv",
          targetLang,
        }),
      });

      if (!response.ok) {
        throw new Error("Translation request failed");
      }

      const data = await response.json();
      if (data.translatedText) {
        setContent(data.translatedText);
        setStatusMessage(`Översatt med ${data.provider}`);
      }
    } catch (err: any) {
      setStatusMessage("Kunde inte översätta automatiskt");
    } finally {
      setIsTranslating(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (onSave) {
        await onSave({
          pageId: selectedField.pageId,
          nbr: selectedField.nbr,
          content,
          locale: selectedField.locale || "sv",
        });
      } else {
        const res = await fetch("/api/cms/fields/text", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pageId: selectedField.pageId,
            nbr: selectedField.nbr,
            content,
            locale: selectedField.locale || "sv",
            classNames: selectedField.classNames,
            textType: selectedField.textType,
            rows: selectedField.rows,
          }),
        });

        if (!res.ok) {
          throw new Error("Failed to save field");
        }
      }
      closeModal();
      if (typeof window !== "undefined") {
        window.location.reload();
      }
    } catch (err: any) {
      setStatusMessage("Kunde inte spara texten");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 text-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">
              Redigera textfält #{selectedField.nbr}
            </h2>
            <span className="rounded bg-sky-500/20 px-2 py-0.5 text-xs font-medium text-sky-400 uppercase">
              {selectedField.locale || "sv"}
            </span>
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
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Innehåll
            </label>
            <textarea
              rows={selectedField.rows || 4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm text-slate-100 placeholder-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              placeholder="Skriv text här..."
            />
          </div>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handleTranslate}
              disabled={isTranslating || !content.trim()}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-sky-300 hover:bg-slate-700 disabled:opacity-50"
            >
              {isTranslating ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              )}
              <span>Översätt med AI</span>
            </button>

            {statusMessage && (
              <span className="text-xs text-slate-400">{statusMessage}</span>
            )}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2 border-t border-slate-800 pt-4">
          <button
            type="button"
            onClick={closeModal}
            className="rounded-lg px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800"
          >
            Avbryt
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-1.5 rounded-lg bg-sky-600 px-4 py-2 text-xs font-medium text-white shadow-lg shadow-sky-600/20 hover:bg-sky-500 disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Check className="w-3.5 h-3.5" />
            )}
            <span>Spara</span>
          </button>
        </div>
      </div>
    </div>
  );
}
