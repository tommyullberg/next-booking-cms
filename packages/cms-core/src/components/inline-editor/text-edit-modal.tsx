"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useEditorStore } from "../../state/editor-store";
import { Sparkles, X, Check, Loader2 } from "lucide-react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  FlagIcon,
  IconButton,
} from "@cms/components/ui";
import { LANGUAGE_META } from "../../constants/languages";

export interface TextEditModalProps {
  activeLanguages?: string[];
  onSave?: (data: {
    pageId: number | string;
    nbr: number;
    content: string;
    locale: string;
    translations?: Record<string, string>;
  }) => Promise<void> | void;
}

export function TextEditModal({
  activeLanguages: propLanguages,
  onSave,
}: TextEditModalProps) {
  const t = useTranslations("inlineEditor.textModal");
  const tCommon = useTranslations("common");
  const { isModalOpen, selectedField, closeModal } = useEditorStore();
  const [languages, setLanguages] = useState<string[]>(
    propLanguages || ["sv", "en", "de"]
  );
  const [valuesByLocale, setValuesByLocale] = useState<Record<string, string>>({
    sv: "",
  });
  const [translatingLocale, setTranslatingLocale] = useState<string | null>(
    null
  );
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    if (propLanguages && propLanguages.length > 0) {
      setLanguages(Array.from(new Set(["sv", ...propLanguages])));
      return;
    }
    if (isModalOpen && selectedField?.fieldType === "TEXT") {
      fetch("/api/cms/settings")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && Array.isArray(data.activeLanguages)) {
            setLanguages(Array.from(new Set(["sv", ...data.activeLanguages])));
          }
        })
        .catch(() => {});
    }
  }, [isModalOpen, selectedField?.fieldType, propLanguages]);

  useEffect(() => {
    if (selectedField?.fieldType === "TEXT") {
      const initial: Record<string, string> = {
        sv: selectedField.content || "",
        ...(selectedField.translations || {}),
      };
      setValuesByLocale(initial);
      setStatusMessage(null);
    }
  }, [selectedField]);

  if (!isModalOpen || selectedField?.fieldType !== "TEXT") {
    return null;
  }

  const handleTranslateLocale = async (targetLocale: string) => {
    const sourceText = valuesByLocale.sv || "";
    if (!sourceText.trim()) return;

    setTranslatingLocale(targetLocale);
    setStatusMessage(null);

    try {
      const response = await fetch("/api/cms/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: sourceText,
          sourceLang: "sv",
          targetLang: targetLocale,
        }),
      });

      if (!response.ok) {
        throw new Error("Translation request failed");
      }

      const data = await response.json();
      if (data.translatedText) {
        setValuesByLocale((prev) => ({
          ...prev,
          [targetLocale]: data.translatedText,
        }));
        setStatusMessage(
          t("translatedSingle", {
            locale: targetLocale.toUpperCase(),
            provider: data.provider || "AI",
          })
        );
      }
    } catch {
      setStatusMessage(t("translationFailed"));
    } finally {
      setTranslatingLocale(null);
    }
  };

  const handleTranslateAll = async () => {
    const sourceText = valuesByLocale.sv || "";
    if (!sourceText.trim()) return;
    const secondary = languages.filter((l) => l !== "sv");
    if (secondary.length === 0) return;

    setTranslatingLocale("all");
    setStatusMessage(null);
    try {
      for (const loc of secondary) {
        const response = await fetch("/api/cms/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: sourceText,
            sourceLang: "sv",
            targetLang: loc,
          }),
        });
        if (response.ok) {
          const data = await response.json();
          if (data.translatedText) {
            setValuesByLocale((prev) => ({
              ...prev,
              [loc]: data.translatedText,
            }));
          }
        }
      }
      setStatusMessage(t("translatedAll"));
    } catch {
      setStatusMessage(t("translationFailed"));
    } finally {
      setTranslatingLocale(null);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const primaryContent = valuesByLocale.sv || "";
      const secondaryTranslations: Record<string, string> = {};
      languages.forEach((loc) => {
        if (loc !== "sv") {
          secondaryTranslations[loc] = valuesByLocale[loc] || "";
        }
      });

      if (onSave) {
        await onSave({
          pageId: selectedField.pageId,
          nbr: selectedField.nbr,
          content: primaryContent,
          locale: "sv",
          translations: secondaryTranslations,
        });
      } else {
        const res = await fetch("/api/cms/fields/text", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pageId: selectedField.pageId,
            nbr: selectedField.nbr,
            content: primaryContent,
            locale: "sv",
            translations: secondaryTranslations,
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
    } catch {
      setStatusMessage(t("saveFailed"));
    } finally {
      setIsSaving(false);
    }
  };

  const gridColsClass =
    languages.length === 1
      ? "grid-cols-1"
      : languages.length === 2
      ? "grid-cols-1 md:grid-cols-2"
      : "grid-cols-1 md:grid-cols-2 xl:grid-cols-3";

  return (
    <Dialog
      open={isModalOpen}
      onOpenChange={(open) => {
        if (!open) closeModal();
      }}
    >
      <DialogContent
        variant="admin"
        size="full"
        className="border-slate-700/90 bg-slate-900 p-6 text-white shadow-2xl"
        hideCloseButton
      >
        <DialogDescription className="sr-only">
          {t("subtitle")}
        </DialogDescription>

        {/* Modal Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <DialogTitle className="text-lg font-semibold text-white">
              {t("title", { nbr: selectedField.nbr })}
            </DialogTitle>
            <span className="rounded-md border border-sky-500/30 bg-sky-500/15 px-2.5 py-0.5 text-[11px] font-medium text-sky-300">
              {languages.length === 1
                ? t("activeLanguage", { count: 1 })
                : t("activeLanguages", { count: languages.length })}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {languages.length > 1 && (
              <Button
                type="button"
                variant="adminSecondary"
                size="xs"
                onClick={handleTranslateAll}
                disabled={
                  translatingLocale !== null || !(valuesByLocale.sv || "").trim()
                }
                loading={translatingLocale === "all"}
                loadingText={t("translatingAll")}
                className="text-sky-300 hover:text-sky-200"
              >
                <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                <span>{t("translateAll")}</span>
              </Button>
            )}

            <IconButton
              type="button"
              variant="ghost"
              size="xs"
              aria-label={tCommon("cancel")}
              onClick={closeModal}
              className="text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              <X className="w-4 h-4" />
            </IconButton>
          </div>
        </div>

        {/* Horizontal Side-by-Side Language Columns */}
        <div className={`mt-5 grid ${gridColsClass} gap-4`}>
          {languages.map((loc) => {
            const meta = LANGUAGE_META[loc] || {
              code: loc.toUpperCase(),
              flag: "🌐",
              label: loc.toUpperCase(),
            };
            const isPrimary = loc === "sv";
            const isThisTranslating =
              translatingLocale === loc || translatingLocale === "all";

            return (
              <div
                key={loc}
                className={`flex flex-col rounded-xl border p-3.5 ${
                  isPrimary
                    ? "border-sky-500/40 bg-slate-950/80"
                    : "border-slate-800 bg-slate-950/50"
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                    <FlagIcon code={loc} size="sm" />
                    <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono text-slate-300">
                      {meta.code}
                    </span>
                    <span>{meta.label}</span>
                  </label>

                  {!isPrimary && (
                    <Button
                      type="button"
                      variant="adminSecondary"
                      size="xs"
                      onClick={() => handleTranslateLocale(loc)}
                      disabled={
                        translatingLocale !== null ||
                        !(valuesByLocale.sv || "").trim()
                      }
                      loading={isThisTranslating}
                      className="h-6 px-2 text-[10px] text-sky-300 hover:text-sky-200"
                      title={t("translateSingleTooltip", { language: meta.label })}
                    >
                      <Sparkles className="w-3 h-3 text-sky-400" />
                      <span>{t("aiTranslate")}</span>
                    </Button>
                  )}
                </div>

                <textarea
                  rows={selectedField.rows ? Math.max(selectedField.rows, 5) : 6}
                  value={valuesByLocale[loc] || ""}
                  onChange={(e) =>
                    setValuesByLocale((prev) => ({
                      ...prev,
                      [loc]: e.target.value,
                    }))
                  }
                  placeholder={t("enterTextPlaceholder", { language: meta.label })}
                  className="w-full flex-1 rounded-lg border border-slate-800 bg-slate-900/90 p-3 text-xs leading-relaxed text-slate-100 placeholder-slate-500 focus:border-sky-500 focus:outline-none"
                />
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-800 pt-4">
          <div className="text-xs text-slate-400">
            {statusMessage || t("subtitle")}
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="adminSecondary"
              size="sm"
              onClick={closeModal}
            >
              {tCommon("cancel")}
            </Button>
            <Button
              type="button"
              variant="adminPrimary"
              size="sm"
              onClick={handleSave}
              loading={isSaving}
              loadingText={tCommon("loading")}
            >
              <Check className="w-3.5 h-3.5" />
              <span>{tCommon("save")}</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
