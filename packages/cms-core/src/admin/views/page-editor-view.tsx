"use client";

import React, { useState } from "react";
import { ArrowLeft, Save, Sparkles, Loader2, Check } from "lucide-react";
import { CMSPageField } from "../../components/fields/types";

export interface PageEditorData {
  id: string;
  template_name: string;
  section_id?: string | null;
  page_title: string;
  link_description?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  slug: string;
  status: "NEW" | "PUBLISHED" | "ARCHIVED";
  page_fields: CMSPageField[];
  translations?: Array<{
    locale: string;
    page_title: string;
    link_description?: string | null;
    meta_title?: string | null;
    meta_description?: string | null;
  }>;
}

export interface PageEditorViewProps {
  page: PageEditorData;
  onBack: () => void;
  onSave: (data: any) => Promise<void>;
}

export function PageEditorView({ page, onBack, onSave }: PageEditorViewProps) {
  const [activeLocale, setActiveLocale] = useState<"en" | "de">("en");
  const [status, setStatus] = useState(page.status);

  // Swedish values
  const [svTitle, setSvTitle] = useState(page.page_title);
  const [svLinkDesc, setSvLinkDesc] = useState(page.link_description || "");
  const [svMetaTitle, setSvMetaTitle] = useState(page.meta_title || "");
  const [svMetaDesc, setSvMetaDesc] = useState(page.meta_description || "");

  // Active language values
  const currentTranslation = page.translations?.find((t) => t.locale === activeLocale);
  const [targetTitle, setTargetTitle] = useState(currentTranslation?.page_title || "");
  const [targetLinkDesc, setTargetLinkDesc] = useState(currentTranslation?.link_description || "");
  const [targetMetaTitle, setTargetMetaTitle] = useState(currentTranslation?.meta_title || "");
  const [targetMetaDesc, setTargetMetaDesc] = useState(currentTranslation?.meta_description || "");

  // Text fields state: map of fieldId/nbr to { sv: string, target: string }
  const textFields = page.page_fields.filter((f) => f.field_type === "TEXT");
  const [fieldValues, setFieldValues] = useState<
    Record<number, { sv: string; target: string; id: string }>
  >(() => {
    const initial: Record<number, { sv: string; target: string; id: string }> = {};
    for (const f of textFields) {
      const trans = f.translations?.find((t) => t.locale === activeLocale);
      initial[f.nbr] = {
        id: f.id,
        sv: f.content || "",
        target: trans?.content || "",
      };
    }
    return initial;
  });

  const [isTranslating, setIsTranslating] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const translateField = async (fieldKey: string, sourceText: string, onResult: (res: string) => void) => {
    if (!sourceText.trim()) return;
    setIsTranslating(fieldKey);
    try {
      const response = await fetch("/api/cms/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: sourceText,
          sourceLang: "sv",
          targetLang: activeLocale,
        }),
      });
      const data = await response.json();
      if (data.translatedText) {
        onResult(data.translatedText);
      }
    } catch {
      // Graceful error fallback
    } finally {
      setIsTranslating(null);
    }
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await onSave({
        id: page.id,
        templateName: page.template_name,
        sectionId: page.section_id,
        slug: page.slug,
        status,
        pageTitle: svTitle,
        linkDescription: svLinkDesc,
        metaTitle: svMetaTitle,
        metaDescription: svMetaDesc,
        translations: [
          {
            locale: activeLocale,
            pageTitle: targetTitle,
            linkDescription: targetLinkDesc,
            metaTitle: targetMetaTitle,
            metaDescription: targetMetaDesc,
          },
        ],
        fieldUpdates: Object.entries(fieldValues).map(([nbrStr, val]) => ({
          nbr: Number(nbrStr),
          fieldId: val.id,
          svContent: val.sv,
          targetContent: val.target,
          locale: activeLocale,
        })),
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Top action bar */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <span>Redigera: {page.page_title}</span>
              <span className="text-xs font-mono text-slate-500">/{page.slug}</span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Active target language switcher */}
          <div className="flex items-center rounded-xl border border-slate-800 bg-slate-900 p-1">
            <button
              type="button"
              onClick={() => setActiveLocale("en")}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition ${
                activeLocale === "en"
                  ? "bg-sky-500 text-white font-semibold shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Engelska (en)
            </button>
            <button
              type="button"
              onClick={() => setActiveLocale("de")}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition ${
                activeLocale === "de"
                  ? "bg-sky-500 text-white font-semibold shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Tyska (de)
            </button>
          </div>

          <select
            value={status}
            onChange={(e: any) => setStatus(e.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white focus:outline-none"
          >
            <option value="NEW">Utkast (NEW)</option>
            <option value="PUBLISHED">Publicerad (PUBLISHED)</option>
            <option value="ARCHIVED">Arkiverad (ARCHIVED)</option>
          </select>

          <button
            type="button"
            onClick={handleSaveAll}
            disabled={isSaving}
            className="flex items-center gap-1.5 rounded-xl bg-sky-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-sky-600/20 hover:bg-sky-500 transition disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : saveSuccess ? (
              <Check className="w-4 h-4 text-emerald-300" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{saveSuccess ? "Sparat!" : "Spara ändringar"}</span>
          </button>
        </div>
      </div>

      {/* Side-by-side editing notice */}
      <div className="grid grid-cols-2 gap-6 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800/80 pb-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
          <span>Svenska (Original)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block" />
          <span>
            {activeLocale === "en" ? "Engelska" : "Tyska"} (Aktiv översättning)
          </span>
        </div>
      </div>

      {/* Page Title Row */}
      <div className="grid grid-cols-2 gap-6 bg-slate-900/40 p-4 rounded-2xl border border-slate-800/60">
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            Sidetitel (sv)
          </label>
          <input
            type="text"
            value={svTitle}
            onChange={(e) => setSvTitle(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white focus:outline-none"
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-medium text-slate-300">
              Sidetitel ({activeLocale})
            </label>
            <button
              type="button"
              onClick={() => translateField("page_title", svTitle, setTargetTitle)}
              disabled={isTranslating === "page_title"}
              className="flex items-center gap-1 text-[11px] text-sky-400 hover:text-sky-300"
            >
              <Sparkles className="w-3 h-3" />
              <span>Översätt med AI</span>
            </button>
          </div>
          <input
            type="text"
            value={targetTitle}
            onChange={(e) => setTargetTitle(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white focus:outline-none"
          />
        </div>
      </div>

      {/* Link Description Row */}
      <div className="grid grid-cols-2 gap-6 bg-slate-900/40 p-4 rounded-2xl border border-slate-800/60">
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            Länkbeskrivning (sv)
          </label>
          <input
            type="text"
            value={svLinkDesc}
            onChange={(e) => setSvLinkDesc(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white focus:outline-none"
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-medium text-slate-300">
              Länkbeskrivning ({activeLocale})
            </label>
            <button
              type="button"
              onClick={() => translateField("link_desc", svLinkDesc, setTargetLinkDesc)}
              disabled={isTranslating === "link_desc"}
              className="flex items-center gap-1 text-[11px] text-sky-400 hover:text-sky-300"
            >
              <Sparkles className="w-3 h-3" />
              <span>Översätt med AI</span>
            </button>
          </div>
          <input
            type="text"
            value={targetLinkDesc}
            onChange={(e) => setTargetLinkDesc(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white focus:outline-none"
          />
        </div>
      </div>

      {/* Meta Description Row */}
      <div className="grid grid-cols-2 gap-6 bg-slate-900/40 p-4 rounded-2xl border border-slate-800/60">
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            Meta Description (sv)
          </label>
          <textarea
            rows={2}
            value={svMetaDesc}
            onChange={(e) => setSvMetaDesc(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white focus:outline-none"
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-medium text-slate-300">
              Meta Description ({activeLocale})
            </label>
            <button
              type="button"
              onClick={() => translateField("meta_desc", svMetaDesc, setTargetMetaDesc)}
              disabled={isTranslating === "meta_desc"}
              className="flex items-center gap-1 text-[11px] text-sky-400 hover:text-sky-300"
            >
              <Sparkles className="w-3 h-3" />
              <span>Översätt med AI</span>
            </button>
          </div>
          <textarea
            rows={2}
            value={targetMetaDesc}
            onChange={(e) => setTargetMetaDesc(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white focus:outline-none"
          />
        </div>
      </div>

      {/* Innehållsfält (Page Fields) */}
      <div className="space-y-4 pt-4">
        <h2 className="text-sm font-semibold text-white">
          Innehållsfält (Mall: {page.template_name})
        </h2>

        {textFields.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 text-center text-xs text-slate-500">
            Inga textfält definierade för denna sida ännu.
          </div>
        ) : (
          textFields.map((field) => {
            const current = fieldValues[field.nbr] || { sv: "", target: "", id: field.id };
            return (
              <div
                key={field.nbr}
                className="grid grid-cols-2 gap-6 bg-slate-900/40 p-4 rounded-2xl border border-slate-800/60"
              >
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Textfält #{field.nbr} (sv)
                  </label>
                  <textarea
                    rows={field.rows || 3}
                    value={current.sv}
                    onChange={(e) =>
                      setFieldValues((prev) => ({
                        ...prev,
                        [field.nbr]: { ...current, sv: e.target.value },
                      }))
                    }
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white focus:outline-none"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-medium text-slate-300">
                      Textfält #{field.nbr} ({activeLocale})
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        translateField(`field_${field.nbr}`, current.sv, (res) =>
                          setFieldValues((prev) => ({
                            ...prev,
                            [field.nbr]: { ...current, target: res },
                          }))
                        )
                      }
                      disabled={isTranslating === `field_${field.nbr}`}
                      className="flex items-center gap-1 text-[11px] text-sky-400 hover:text-sky-300"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Översätt med AI</span>
                    </button>
                  </div>
                  <textarea
                    rows={field.rows || 3}
                    value={current.target}
                    onChange={(e) =>
                      setFieldValues((prev) => ({
                        ...prev,
                        [field.nbr]: { ...current, target: e.target.value },
                      }))
                    }
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
