"use client";

import React, { useState, useEffect } from "react";
import { Globe, Languages, Check, Save, Lock, Images, LayoutGrid } from "lucide-react";
import { FlagIcon } from "../../components/ui/flag-icon";
import {
  AVAILABLE_LANGUAGES,
  ADMIN_LANGUAGES,
  AdminLanguage,
} from "../../constants/languages";
import {
  GallerySettings,
  DEFAULT_GALLERY_SETTINGS,
} from "../../types/settings";

export interface SettingsViewProps {
  activeLanguages: string[];
  adminLanguage?: AdminLanguage;
  gallerySettings?: GallerySettings;
  onSaveSettings: (data: {
    activeLanguages: string[];
    adminLanguage: AdminLanguage;
    gallerySettings: GallerySettings;
  }) => Promise<void>;
}

export function SettingsView({
  activeLanguages,
  adminLanguage = "en",
  gallerySettings = DEFAULT_GALLERY_SETTINGS,
  onSaveSettings,
}: SettingsViewProps) {
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(
    Array.from(new Set(["sv", ...activeLanguages]))
  );
  const [selectedAdminLanguage, setSelectedAdminLanguage] = useState<"en" | "sv">(
    adminLanguage || "en"
  );
  const [selectedGallerySettings, setSelectedGallerySettings] =
    useState<GallerySettings>({
      ...DEFAULT_GALLERY_SETTINGS,
      ...gallerySettings,
    });
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    setSelectedLanguages(Array.from(new Set(["sv", ...activeLanguages])));
  }, [activeLanguages]);

  useEffect(() => {
    if (adminLanguage) {
      setSelectedAdminLanguage(adminLanguage);
    }
  }, [adminLanguage]);

  useEffect(() => {
    if (gallerySettings) {
      setSelectedGallerySettings({
        ...DEFAULT_GALLERY_SETTINGS,
        ...gallerySettings,
      });
    }
  }, [gallerySettings]);

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
        adminLanguage: selectedAdminLanguage,
        gallerySettings: selectedGallerySettings,
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
            Configure active site languages and admin interface preferences.
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

      {/* Card 1: Site Language Configuration */}
      <div className="rounded-2xl border border-slate-800/90 bg-slate-900/50 p-6 shadow-xl">
        <div className="flex items-start gap-3 mb-5 pb-4 border-b border-slate-800/80">
          <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0">
            <Globe className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">
              Site Language Configuration
            </h2>
            <p className="mt-0.5 text-xs text-slate-400 leading-relaxed">
              Select which languages are active across public pages. Active languages
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

      {/* Card 2: Admin Language Configuration */}
      <div className="rounded-2xl border border-slate-800/90 bg-slate-900/50 p-6 shadow-xl">
        <div className="flex items-start gap-3 mb-5 pb-4 border-b border-slate-800/80">
          <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0">
            <Languages className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">
              Admin Language Configuration
            </h2>
            <p className="mt-0.5 text-xs text-slate-400 leading-relaxed">
              Select the preferred interface language for the administration dashboard and management tools. Defaults to English.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {ADMIN_LANGUAGES.map((lang) => {
            const isSelected = selectedAdminLanguage === lang.locale;
            return (
              <div
                key={lang.locale}
                role="radio"
                aria-checked={isSelected}
                tabIndex={0}
                onClick={() => setSelectedAdminLanguage(lang.locale)}
                onKeyDown={(e) => {
                  if (e.key === " " || e.key === "Enter") {
                    e.preventDefault();
                    setSelectedAdminLanguage(lang.locale);
                  }
                }}
                className={`flex items-center justify-between gap-3 rounded-xl border p-3.5 transition select-none cursor-pointer ${
                  isSelected
                    ? "border-sky-500/60 bg-slate-900/95 hover:border-sky-400 ring-1 ring-sky-500/20"
                    : "border-slate-800 bg-slate-950/50 hover:border-slate-700 hover:bg-slate-900/60"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Custom Styled Radio */}
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center border transition shrink-0 ${
                      isSelected
                        ? "bg-sky-600 border-sky-500"
                        : "bg-slate-950 border-slate-700"
                    }`}
                  >
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${
                        isSelected ? "bg-white" : "bg-transparent"
                      }`}
                    />
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

                <div className="flex items-center gap-1.5 shrink-0">
                  {lang.isDefault && (
                    <span className="inline-flex items-center gap-1 rounded-md border border-slate-700/80 bg-slate-800/60 px-2 py-0.5 text-[10px] font-medium text-slate-300">
                      Default
                    </span>
                  )}
                  {isSelected && (
                    <span className="inline-flex items-center gap-1 rounded-md border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 text-[10px] font-medium text-sky-300">
                      <Check className="w-2.5 h-2.5" />
                      <span>Active</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Card 3: Gallery Configuration */}
      <div className="rounded-2xl border border-slate-800/90 bg-slate-900/50 p-6 shadow-xl">
        <div className="flex items-start gap-3 mb-5 pb-4 border-b border-slate-800/80">
          <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0">
            <Images className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">
              Gallery Configuration
            </h2>
            <p className="mt-0.5 text-xs text-slate-400 leading-relaxed">
              Configure default visual layout, thumbnail proportions, and lightbox behavior for all CMSField.Gallery components across the site.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Default Gallery Layout */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Default Gallery Layout
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  id: "grid" as const,
                  title: "Grid",
                  desc: "Uniform multi-column image grid",
                },
                {
                  id: "bento" as const,
                  title: "Hero + Grid (Bento)",
                  desc: "1 large featured photo + up to 4 smaller photos",
                },
                {
                  id: "carousel" as const,
                  title: "Carousel / Slider",
                  desc: "Horizontal interactive photo slider",
                },
              ].map((opt) => {
                const isSelected = selectedGallerySettings.layout === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() =>
                      setSelectedGallerySettings((prev) => ({
                        ...prev,
                        layout: opt.id,
                      }))
                    }
                    className={`flex flex-col items-start text-left rounded-xl border p-3.5 transition cursor-pointer ${
                      isSelected
                        ? "border-sky-500/60 bg-slate-900/95 ring-1 ring-sky-500/20"
                        : "border-slate-800 bg-slate-950/50 hover:border-slate-700 hover:bg-slate-900/60"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                        <LayoutGrid className="w-3.5 h-3.5 text-sky-400" />
                        {opt.title}
                      </span>
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-sky-400" />
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 leading-snug">
                      {opt.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Grid Columns */}
            {(() => {
              const isColumnsDisabled =
                selectedGallerySettings.layout !== "grid";
              return (
                <div
                  className={`transition-opacity ${
                    isColumnsDisabled ? "opacity-40" : ""
                  }`}
                >
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    Grid Columns
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {([2, 3, 4] as const).map((cols) => {
                      const isSelected =
                        selectedGallerySettings.columns === cols;
                      return (
                        <button
                          key={cols}
                          type="button"
                          disabled={isColumnsDisabled}
                          onClick={() =>
                            setSelectedGallerySettings((prev) => ({
                              ...prev,
                              columns: cols,
                            }))
                          }
                          className={`rounded-xl border py-2.5 text-xs font-semibold transition ${
                            isColumnsDisabled
                              ? "border-slate-800 bg-slate-950/40 text-slate-500 cursor-not-allowed"
                              : isSelected
                              ? "border-sky-500 bg-sky-600/20 text-sky-300 cursor-pointer"
                              : "border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:text-slate-200 cursor-pointer"
                          }`}
                        >
                          {cols} Cols
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-1.5 text-[11px] text-slate-500">
                    {isColumnsDisabled
                      ? "Not active for Hero + Grid or Carousel layouts."
                      : "Applies when layout is set to Grid."}
                  </p>
                </div>
              );
            })()}

            {/* Thumbnail Aspect Ratio */}
            {(() => {
              const isAspectRatioDisabled =
                selectedGallerySettings.layout === "bento";
              return (
                <div
                  className={`transition-opacity ${
                    isAspectRatioDisabled ? "opacity-40" : ""
                  }`}
                >
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    Thumbnail Aspect Ratio
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {(["16/9", "4/3", "3/2", "1/1"] as const).map((ratio) => {
                      const isSelected =
                        selectedGallerySettings.aspectRatio === ratio;
                      return (
                        <button
                          key={ratio}
                          type="button"
                          disabled={isAspectRatioDisabled}
                          onClick={() =>
                            setSelectedGallerySettings((prev) => ({
                              ...prev,
                              aspectRatio: ratio,
                            }))
                          }
                          className={`rounded-xl border py-2.5 text-xs font-mono font-semibold transition ${
                            isAspectRatioDisabled
                              ? "border-slate-800 bg-slate-950/40 text-slate-500 cursor-not-allowed"
                              : isSelected
                              ? "border-sky-500 bg-sky-600/20 text-sky-300 cursor-pointer"
                              : "border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:text-slate-200 cursor-pointer"
                          }`}
                        >
                          {ratio.replace("/", ":")}
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-1.5 text-[11px] text-slate-500">
                    {isAspectRatioDisabled
                      ? "Not active for Hero + Grid (uses mosaic proportions)."
                      : "Proportions for Grid and Carousel cards."}
                  </p>
                </div>
              );
            })()}

            {/* Caption Position */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Caption Visibility
              </label>
              <select
                value={selectedGallerySettings.captionPosition}
                onChange={(e) =>
                  setSelectedGallerySettings((prev) => ({
                    ...prev,
                    captionPosition: e.target.value as
                      | "both"
                      | "lightbox"
                      | "hidden",
                  }))
                }
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs text-white focus:border-sky-500 focus:outline-none"
              >
                <option value="both">Show on Thumbnails & in Lightbox</option>
                <option value="lightbox">Show only in Lightbox</option>
                <option value="hidden">Hide Captions</option>
              </select>
              <p className="mt-1.5 text-[11px] text-slate-500">
                Where image descriptions are displayed.
              </p>
            </div>
          </div>

          {/* Lightbox Thumbnail Strip */}
          <div className="pt-2 border-t border-slate-800/70">
            <label
              onClick={() =>
                setSelectedGallerySettings((prev) => ({
                  ...prev,
                  showThumbnails: !prev.showThumbnails,
                }))
              }
              className="flex items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-950/50 p-3.5 cursor-pointer hover:border-slate-700 transition select-none"
            >
              <div>
                <div className="text-xs font-semibold text-white">
                  Show Thumbnail Strip in Lightbox
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Display a clickable row of preview thumbnails at the bottom of the fullscreen Fancybox lightbox.
                </div>
              </div>
              <div
                className={`w-5 h-5 rounded flex items-center justify-center border transition shrink-0 ${
                  selectedGallerySettings.showThumbnails
                    ? "bg-sky-600 border-sky-500 text-white"
                    : "bg-slate-950 border-slate-700 text-transparent"
                }`}
              >
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Bottom Save Action */}
      <div className="flex items-center justify-end pt-2 pb-4">
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
    </form>
  );
}
