"use client";

import React, { useState, useEffect } from "react";
import { Globe, Check, Save, Lock } from "lucide-react";
import { FlagIcon } from "../../components/ui/flag-icon";

export interface SettingsViewProps {
  activeLanguages: string[];
  bookingIcalUrl?: string;
  onSaveSettings: (data: {
    activeLanguages: string[];
    bookingIcalUrl?: string;
  }) => Promise<void>;
}

const AVAILABLE_LANGUAGES = [
  {
    locale: "sv",
    code: "SE",
    flag: "🇸🇪",
    name: "Swedish",
    subtitle: "Primary system & content language (Locked)",
    locked: true,
  },
  {
    locale: "en",
    code: "GB",
    flag: "🇬🇧",
    name: "English",
    subtitle: "International translations & English visitors",
    locked: false,
  },
  {
    locale: "de",
    code: "DE",
    flag: "🇩🇪",
    name: "German",
    subtitle: "German translations for DACH market guests",
    locked: false,
  },
  {
    locale: "fi",
    code: "FI",
    flag: "🇫🇮",
    name: "Finnish",
    subtitle: "Finnish translations for Nordic visitors",
    locked: false,
  },
  {
    locale: "no",
    code: "NO",
    flag: "🇳🇴",
    name: "Norwegian",
    subtitle: "Norwegian translations for Nordic visitors",
    locked: false,
  },
  {
    locale: "da",
    code: "DK",
    flag: "🇩🇰",
    name: "Danish",
    subtitle: "Danish translations for Nordic visitors",
    locked: false,
  },
];

export function SettingsView({
  activeLanguages,
  bookingIcalUrl,
  onSaveSettings,
}: SettingsViewProps) {
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(
    Array.from(new Set(["sv", ...activeLanguages]))
  );
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    setSelectedLanguages(Array.from(new Set(["sv", ...activeLanguages])));
  }, [activeLanguages]);

  const toggleLanguage = (locale: string, locked: boolean) => {
    if (locked) return;
    setSelectedLanguages((prev) =>
      prev.includes(locale)
        ? prev.filter((l) => l !== locale)
        : [...prev, locale]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSavedSuccess(false);
    try {
      await onSaveSettings({
        activeLanguages: Array.from(new Set(["sv", ...selectedLanguages])),
        bookingIcalUrl: bookingIcalUrl || "",
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Settings
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Configure active site languages for multi-language content across the CMS.
          </p>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-sky-600/25 hover:bg-sky-500 disabled:opacity-50 transition shrink-0 cursor-pointer"
        >
          {savedSuccess ? (
            <>
              <Check className="w-4 h-4" />
              <span>Saved!</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>{isSaving ? "Saving..." : "Save Settings"}</span>
            </>
          )}
        </button>
      </div>

      {/* Card 1: Language Configuration */}
      <div className="rounded-2xl border border-slate-800/90 bg-slate-900/50 p-6 shadow-xl">
        <div className="flex items-start gap-3 mb-5 pb-4 border-b border-slate-800/80">
          <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0">
            <Globe className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">
              Language Configuration
            </h2>
            <p className="mt-0.5 text-xs text-slate-400 leading-relaxed">
              Select which languages are active across the CMS. Active languages
              automatically appear in Page Editor, Sections, and Inline Text
              Translation modals.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {AVAILABLE_LANGUAGES.map((lang) => {
            const isChecked = selectedLanguages.includes(lang.locale);
            return (
              <label
                key={lang.locale}
                onClick={() => toggleLanguage(lang.locale, lang.locked)}
                className={`flex items-center justify-between gap-3 rounded-xl border p-3.5 transition select-none ${
                  lang.locked
                    ? "border-sky-500/40 bg-sky-950/20 cursor-default"
                    : isChecked
                    ? "border-sky-500/60 bg-slate-900/95 cursor-pointer hover:border-sky-400"
                    : "border-slate-800 bg-slate-950/50 cursor-pointer hover:border-slate-700 hover:bg-slate-900/60"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Custom Styled Checkbox */}
                  <div
                    className={`w-4 h-4 rounded flex items-center justify-center border transition shrink-0 ${
                      isChecked
                        ? "bg-sky-600 border-sky-500 text-white"
                        : "bg-slate-950 border-slate-700 text-transparent"
                    }`}
                  >
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>

                  <FlagIcon code={lang.locale} size="md" />

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-white">
                        {lang.name}
                      </span>
                      <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono font-semibold text-slate-300">
                        {lang.code}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                      {lang.subtitle}
                    </p>
                  </div>
                </div>

                {lang.locked && (
                  <span className="inline-flex items-center gap-1 rounded-md border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 text-[10px] font-medium text-sky-300 shrink-0">
                    <Lock className="w-2.5 h-2.5" />
                    <span>Default</span>
                  </span>
                )}
              </label>
            );
          })}
        </div>
      </div>
    </form>
  );
}
