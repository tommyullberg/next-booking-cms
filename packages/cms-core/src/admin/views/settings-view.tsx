"use client";

import React, { useState, useEffect, useId } from "react";
import { useTranslations } from "next-intl";
import { Globe, Languages, Check, Save, Lock, Images, LayoutGrid } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  Checkbox,
  FlagIcon,
  FormField,
  Label,
  NativeSelect,
  SegmentedControl,
  SelectableCard,
  SelectableCardGroup,
  Switch,
} from "@cms/components/ui";
import { cn } from "../../utils/cn";
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
  const t = useTranslations("settings");
  const tCommon = useTranslations("common");

  const showThumbnailsId = useId();

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
    <form onSubmit={handleSave} className="space-y-6 max-w-4xl pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            {t("title")}
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            {t("subtitle")}
          </p>
        </div>

        <Button
          type="submit"
          variant="adminPrimary"
          size="default"
          disabled={isSaving}
        >
          {savedSuccess ? (
            <>
              <Check className="w-4 h-4" />
              <span>{tCommon("saved")}</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>{isSaving ? tCommon("loading") : t("saveSettings")}</span>
            </>
          )}
        </Button>
      </div>

      {/* Card 1: Site Language Configuration */}
      <Card variant="admin" className="p-6">
        <div className="flex items-start gap-3 mb-5 pb-4 border-b border-slate-800/80">
          <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0">
            <Globe className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">
              {t("siteLanguageTitle")}
            </h2>
            <p className="mt-0.5 text-xs text-slate-400 leading-relaxed">
              {t("siteLanguageDesc")}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {AVAILABLE_LANGUAGES.map((lang) => {
            const isChecked = selectedLanguages.includes(lang.locale);
            const inputId = `site-lang-${lang.locale}`;
            return (
              <label
                key={lang.locale}
                htmlFor={inputId}
                className={cn(
                  "flex items-center justify-between gap-3 rounded-admin-card border p-3.5 transition select-none",
                  lang.locked
                    ? "border-sky-500/40 bg-sky-950/20 cursor-default"
                    : isChecked
                    ? "border-admin-accent bg-admin-surface cursor-pointer ring-1 ring-admin-accent/20"
                    : "border-admin-border bg-admin-surface-subtle cursor-pointer hover:border-admin-border-hover hover:bg-admin-surface"
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Checkbox
                    id={inputId}
                    checked={isChecked}
                    disabled={lang.locked}
                    onCheckedChange={() => toggleLanguage(lang.locale, lang.locked)}
                  />

                  <FlagIcon code={lang.locale} size="md" />

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-white">
                        {lang.name}
                      </span>
                      <Badge variant="adminMuted" size="xs" className="font-mono">
                        {lang.code}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                      {lang.subtitle}
                    </p>
                  </div>
                </div>

                {lang.locked && (
                  <Badge variant="adminAccent" size="sm">
                    <Lock className="w-2.5 h-2.5" />
                    <span>{t("defaultBadge")}</span>
                  </Badge>
                )}
              </label>
            );
          })}
        </div>
      </Card>

      {/* Card 2: Admin Language Configuration */}
      <Card variant="admin" className="p-6">
        <div className="flex items-start gap-3 mb-5 pb-4 border-b border-slate-800/80">
          <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0">
            <Languages className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">
              {t("adminLanguageTitle")}
            </h2>
            <p className="mt-0.5 text-xs text-slate-400 leading-relaxed">
              {t("adminLanguageDesc")}
            </p>
          </div>
        </div>

        <SelectableCardGroup<"en" | "sv">
          value={selectedAdminLanguage}
          onChange={setSelectedAdminLanguage}
          aria-label={t("adminLanguageTitle")}
          className="grid grid-cols-1 sm:grid-cols-2 gap-3"
        >
          {ADMIN_LANGUAGES.map((lang) => (
            <SelectableCard
              key={lang.locale}
              value={lang.locale}
              indicator="radio"
              className="p-3.5 justify-between flex-row items-center"
            >
              <div className="flex items-center gap-3 min-w-0 pr-8">
                <FlagIcon code={lang.locale} size="md" />

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-white">
                      {lang.name}
                    </span>
                    <Badge variant="adminMuted" size="xs" className="font-mono">
                      {lang.code}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">
                    {lang.subtitle}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0 pr-8">
                {lang.isDefault && (
                  <Badge variant="adminMuted" size="sm">
                    {t("defaultBadge")}
                  </Badge>
                )}
                {selectedAdminLanguage === lang.locale && (
                  <Badge variant="adminAccent" size="sm">
                    <Check className="w-2.5 h-2.5" />
                    <span>{tCommon("active")}</span>
                  </Badge>
                )}
              </div>
            </SelectableCard>
          ))}
        </SelectableCardGroup>
      </Card>

      {/* Card 3: Gallery Configuration */}
      <Card variant="admin" className="p-6">
        <div className="flex items-start gap-3 mb-5 pb-4 border-b border-slate-800/80">
          <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0">
            <Images className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">
              {t("galleryConfigTitle")}
            </h2>
            <p className="mt-0.5 text-xs text-slate-400 leading-relaxed">
              {t("galleryConfigDesc")}
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Default Gallery Layout */}
          <div>
            <span className="block text-xs font-semibold text-slate-300 mb-2">
              {t("defaultGalleryLayout")}
            </span>
            <SelectableCardGroup<"grid" | "bento" | "carousel">
              value={selectedGallerySettings.layout}
              onChange={(val) =>
                setSelectedGallerySettings((prev) => ({
                  ...prev,
                  layout: val,
                }))
              }
              aria-label={t("defaultGalleryLayout")}
              className="grid grid-cols-1 sm:grid-cols-3 gap-3"
            >
              {[
                {
                  id: "grid" as const,
                  title: "Grid",
                  desc: t("layoutGridDesc"),
                },
                {
                  id: "bento" as const,
                  title: "Hero + Grid (Bento)",
                  desc: t("layoutBentoDesc"),
                },
                {
                  id: "carousel" as const,
                  title: "Carousel / Slider",
                  desc: t("layoutCarouselDesc"),
                },
              ].map((opt) => (
                <SelectableCard
                  key={opt.id}
                  value={opt.id}
                  indicator="check"
                  className="p-3.5"
                >
                  <div className="flex items-center justify-between w-full mb-1 pr-6">
                    <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                      <LayoutGrid className="w-3.5 h-3.5 text-sky-400" />
                      {opt.title}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 leading-snug">
                    {opt.desc}
                  </span>
                </SelectableCard>
              ))}
            </SelectableCardGroup>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Grid Columns */}
            {(() => {
              const isColumnsDisabled =
                selectedGallerySettings.layout !== "grid";
              return (
                <div
                  className={cn(
                    "transition-opacity",
                    isColumnsDisabled && "opacity-40"
                  )}
                >
                  <span className="block text-xs font-semibold text-slate-300 mb-2">
                    {t("gridColumns")}
                  </span>
                  <SegmentedControl<2 | 3 | 4>
                    size="sm"
                    aria-label={t("gridColumns")}
                    disabled={isColumnsDisabled}
                    value={selectedGallerySettings.columns}
                    onChange={(cols) =>
                      setSelectedGallerySettings((prev) => ({
                        ...prev,
                        columns: cols,
                      }))
                    }
                    options={[
                      { value: 2, label: t("colsCount", { count: 2 }) },
                      { value: 3, label: t("colsCount", { count: 3 }) },
                      { value: 4, label: t("colsCount", { count: 4 }) },
                    ]}
                    className="w-full justify-between"
                  />
                  <p className="mt-1.5 text-[11px] text-slate-500">
                    {isColumnsDisabled
                      ? t("columnsDisabledHelp")
                      : t("columnsActiveHelp")}
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
                  className={cn(
                    "transition-opacity",
                    isAspectRatioDisabled && "opacity-40"
                  )}
                >
                  <span className="block text-xs font-semibold text-slate-300 mb-2">
                    {t("thumbnailAspectRatio")}
                  </span>
                  <SegmentedControl<"16/9" | "4/3" | "3/2" | "1/1">
                    size="sm"
                    aria-label={t("thumbnailAspectRatio")}
                    disabled={isAspectRatioDisabled}
                    value={selectedGallerySettings.aspectRatio}
                    onChange={(ratio) =>
                      setSelectedGallerySettings((prev) => ({
                        ...prev,
                        aspectRatio: ratio,
                      }))
                    }
                    options={[
                      { value: "16/9", label: "16:9" },
                      { value: "4/3", label: "4:3" },
                      { value: "3/2", label: "3:2" },
                      { value: "1/1", label: "1:1" },
                    ]}
                    className="w-full justify-between font-mono"
                  />
                  <p className="mt-1.5 text-[11px] text-slate-500">
                    {isAspectRatioDisabled
                      ? t("aspectRatioDisabledHelp")
                      : t("aspectRatioActiveHelp")}
                  </p>
                </div>
              );
            })()}

            {/* Caption Position */}
            <FormField
              label={t("captionVisibility")}
              labelVariant="admin"
              labelClassName="font-semibold"
              description={t("captionHelp")}
            >
              <NativeSelect
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
                size="sm"
                variant="admin"
              >
                <option value="both">{t("captionBoth")}</option>
                <option value="lightbox">{t("captionLightbox")}</option>
                <option value="hidden">{t("captionHidden")}</option>
              </NativeSelect>
            </FormField>
          </div>

          {/* Lightbox Thumbnail Strip */}
          <div className="pt-2 border-t border-slate-800/70">
            <div className="flex items-center justify-between gap-4 rounded-admin-card border border-admin-border bg-admin-surface-subtle p-3.5">
              <div>
                <Label
                  htmlFor={showThumbnailsId}
                  variant="admin"
                  className="text-xs font-semibold text-white cursor-pointer"
                >
                  {t("showThumbnailStrip")}
                </Label>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  {t("showThumbnailStripHelp")}
                </div>
              </div>
              <Switch
                id={showThumbnailsId}
                checked={selectedGallerySettings.showThumbnails}
                onCheckedChange={(checked) =>
                  setSelectedGallerySettings((prev) => ({
                    ...prev,
                    showThumbnails: checked,
                  }))
                }
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Bottom Save Action */}
      <div className="flex items-center justify-end pt-2 pb-4">
        <Button
          type="submit"
          variant="adminPrimary"
          size="default"
          disabled={isSaving}
        >
          {savedSuccess ? (
            <>
              <Check className="w-4 h-4" />
              <span>{tCommon("saved")}</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>{isSaving ? tCommon("saving") : t("saveSettings")}</span>
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
