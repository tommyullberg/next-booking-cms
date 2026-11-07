"use client";

import React, { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { useEditorStore, EditorMode } from "../../state/editor-store";
import {
  Eye,
  Type,
  Image as ImageIcon,
  ShieldCheck,
  Settings,
  LogOut,
  X,
  Sliders,
  Check,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { Button, IconButton, Switch } from "@cms/components/ui";

export type PanelOrientation = "horizontal" | "vertical";

export type HorizontalPlacement =
  | "top-left"
  | "top-center"
  | "top-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

export type VerticalPlacement =
  | "left-top"
  | "left-middle"
  | "left-bottom"
  | "right-top"
  | "right-middle"
  | "right-bottom";

export interface FloatingPanelProps {
  adminUrl?: string;
  className?: string;
}

const STORAGE_KEY = "cms_toolbar_placement_config";

interface ToolbarConfig {
  orientation: PanelOrientation;
  horizontalPlacement: HorizontalPlacement;
  verticalPlacement: VerticalPlacement;
  alwaysExpanded: boolean;
}

const defaultConfig: ToolbarConfig = {
  orientation: "horizontal",
  horizontalPlacement: "bottom-right",
  verticalPlacement: "right-bottom",
  alwaysExpanded: false,
};

export function FloatingPanel({ className = "" }: FloatingPanelProps) {
  const t = useTranslations("inlineEditor.panel");
  const tCommon = useTranslations("common");
  const { mode, setMode } = useEditorStore();
  const [config, setConfig] = useState<ToolbarConfig>(defaultConfig);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setConfig({
          orientation: parsed.orientation || "horizontal",
          horizontalPlacement: parsed.horizontalPlacement || "bottom-right",
          verticalPlacement: parsed.verticalPlacement || "right-bottom",
          alwaysExpanded: Boolean(parsed.alwaysExpanded),
        });
      }
    } catch {
      // Ignore parse error and keep default
    }
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        settingsRef.current &&
        !settingsRef.current.contains(event.target as Node)
      ) {
        setIsSettingsOpen(false);
      }
    };

    if (isSettingsOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isSettingsOpen]);

  const updateConfig = (partial: Partial<ToolbarConfig>) => {
    setConfig((prev) => {
      const next = { ...prev, ...partial };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Ignore storage errors
      }
      return next;
    });
  };

  const handleAdminClick = () => {
    setMode("administration");
  };

  const handleSignOut = () => {
    setMode("normal");
    signOut({ callbackUrl: "/" });
  };

  if (mode === "administration") {
    return null;
  }

  const isVertical = config.orientation === "vertical";
  const isFullyExpanded = isVertical && config.alwaysExpanded;
  // Hover expansion only active when vertical, not always expanded, and settings popup is closed
  const canHoverExpand = isVertical && !config.alwaysExpanded && !isSettingsOpen;

  // Calculate fixed positioning class for toolbar
  const getPositionClasses = () => {
    if (!isVertical) {
      switch (config.horizontalPlacement) {
        case "top-left":
          return "top-6 left-6";
        case "top-center":
          return "top-6 left-1/2 -translate-x-1/2";
        case "top-right":
          return "top-6 right-6";
        case "bottom-left":
          return "bottom-6 left-6";
        case "bottom-center":
          return "bottom-6 left-1/2 -translate-x-1/2";
        case "bottom-right":
        default:
          return "bottom-6 right-6";
      }
    } else {
      switch (config.verticalPlacement) {
        case "left-top":
          return "top-6 left-6";
        case "left-middle":
          return "top-1/2 left-6 -translate-y-1/2";
        case "left-bottom":
          return "bottom-6 left-6";
        case "right-top":
          return "top-6 right-6";
        case "right-middle":
          return "top-1/2 right-6 -translate-y-1/2";
        case "right-bottom":
        default:
          return "bottom-6 right-6";
      }
    }
  };

  // Calculate popover positioning relative to toolbar
  const getPopoverPositionClasses = () => {
    if (!isVertical) {
      const isTop = config.horizontalPlacement.startsWith("top-");
      const isCenter = config.horizontalPlacement.endsWith("-center");
      const isLeft = config.horizontalPlacement.endsWith("-left");

      const verticalPos = isTop ? "top-full mt-3" : "bottom-full mb-3";
      let horizontalPos = "right-0";
      if (isLeft) horizontalPos = "left-0";
      if (isCenter) horizontalPos = "left-1/2 -translate-x-1/2";

      return `${verticalPos} ${horizontalPos}`;
    } else {
      const isLeft = config.verticalPlacement.startsWith("left-");
      const isMiddle = config.verticalPlacement.endsWith("-middle");
      const isTop = config.verticalPlacement.endsWith("-top");

      const horizontalPos = isLeft ? "left-full ml-3" : "right-full mr-3";
      let verticalPos = "bottom-0";
      if (isTop) verticalPos = "top-0";
      if (isMiddle) verticalPos = "top-1/2 -translate-y-1/2";

      return `${horizontalPos} ${verticalPos}`;
    }
  };

  const buttons: Array<{
    mode: EditorMode;
    label: string;
    icon: React.ReactNode;
    onClick: () => void;
  }> = [
    {
      mode: "normal",
      label: t("normal"),
      icon: <Eye className="w-4 h-4 shrink-0" />,
      onClick: () => setMode("normal"),
    },
    {
      mode: "text",
      label: t("text"),
      icon: <Type className="w-4 h-4 shrink-0" />,
      onClick: () => setMode("text"),
    },
    {
      mode: "image",
      label: t("image"),
      icon: <ImageIcon className="w-4 h-4 shrink-0" />,
      onClick: () => setMode("image"),
    },
    {
      mode: "administration",
      label: t("administration"),
      icon: <ShieldCheck className="w-4 h-4 shrink-0" />,
      onClick: handleAdminClick,
    },
  ];

  return (
    <aside
      ref={settingsRef}
      aria-label="CMS Inline Editor Toolbar"
      className={`fixed ${getPositionClasses()} z-50 transition-all duration-300 ${className}`}
    >
      <div
        className={`relative flex items-center border border-slate-700/80 bg-slate-900/95 p-1.5 shadow-2xl backdrop-blur-md text-white transition-all duration-200 ${
          canHoverExpand ? "group" : ""
        } ${
          isVertical
            ? "flex-col rounded-2xl gap-1.5"
            : "flex-row rounded-full gap-1.5"
        }`}
      >
        {/* Editor mode buttons */}
        <div
          className={`flex items-center ${
            isVertical ? "flex-col gap-1.5 w-full" : "flex-row gap-1.5"
          }`}
        >
          {buttons.map((btn) => {
            const isActive = mode === btn.mode;
            return (
              <button
                key={btn.mode}
                type="button"
                onClick={btn.onClick}
                title={btn.label}
                className={`flex items-center text-xs font-medium transition-all duration-150 ${
                  isVertical
                    ? isFullyExpanded
                      ? `w-full justify-start rounded-xl px-3 py-1.5 gap-2 ${
                          isActive
                            ? "bg-sky-500 text-white shadow-md shadow-sky-500/20"
                            : "text-slate-300 hover:bg-slate-800 hover:text-white"
                        }`
                      : `p-2 rounded-xl ${
                          canHoverExpand
                            ? "group-hover:px-3 group-hover:py-1.5 group-hover:gap-2 group-hover:w-full group-hover:justify-start"
                            : ""
                        } ${
                          isActive
                            ? "bg-sky-500 text-white shadow-md shadow-sky-500/20"
                            : "text-slate-300 hover:bg-slate-800 hover:text-white"
                        }`
                    : `rounded-full px-3.5 py-1.5 gap-1.5 ${
                        isActive
                          ? "bg-sky-500 text-white shadow-md shadow-sky-500/20"
                          : "text-slate-300 hover:bg-slate-800 hover:text-white"
                      }`
                }`}
              >
                {btn.icon}
                {isVertical ? (
                  isFullyExpanded ? (
                    <span className="whitespace-nowrap">{btn.label}</span>
                  ) : canHoverExpand ? (
                    <span className="max-w-0 opacity-0 overflow-hidden whitespace-nowrap group-hover:max-w-[120px] group-hover:opacity-100 transition-all duration-200">
                      {btn.label}
                    </span>
                  ) : null
                ) : (
                  <span>{btn.label}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Separator between modes and settings */}
        <div
          className={
            isVertical
              ? "w-full h-px bg-slate-700/60 my-0.5"
              : "h-4 w-px bg-slate-700/60 mx-0.5"
          }
        />

        {/* Settings button */}
        <button
          type="button"
          onClick={() => setIsSettingsOpen((prev) => !prev)}
          title={t("settingsTooltip")}
          className={`flex items-center text-xs font-medium transition-all duration-150 ${
            isSettingsOpen
              ? "bg-slate-800 text-sky-400 ring-1 ring-sky-400/50"
              : "text-slate-300 hover:bg-slate-800 hover:text-white"
          } ${
            isVertical
              ? isFullyExpanded
                ? "w-full justify-start rounded-xl px-3 py-1.5 gap-2"
                : `p-2 rounded-xl ${
                    canHoverExpand
                      ? "group-hover:px-3 group-hover:py-1.5 group-hover:gap-2 group-hover:w-full group-hover:justify-start"
                      : ""
                  }`
              : "rounded-full px-3 py-1.5 gap-1.5"
          }`}
        >
          <Settings
            className={`w-4 h-4 shrink-0 transition-transform duration-300 ${
              isSettingsOpen ? "rotate-90 text-sky-400" : ""
            }`}
          />
          {isVertical ? (
            isFullyExpanded ? (
              <span className="whitespace-nowrap">{t("settings")}</span>
            ) : canHoverExpand ? (
              <span className="max-w-0 opacity-0 overflow-hidden whitespace-nowrap group-hover:max-w-[120px] group-hover:opacity-100 transition-all duration-200">
                {t("settings")}
              </span>
            ) : null
          ) : (
            <span className="hidden sm:inline">{t("settings")}</span>
          )}
        </button>

        {/* Sign out button */}
        <button
          type="button"
          onClick={handleSignOut}
          title={t("signOutTooltip")}
          className={`flex items-center text-xs font-medium text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-all duration-150 ${
            isVertical
              ? isFullyExpanded
                ? "w-full justify-start rounded-xl px-3 py-1.5 gap-2"
                : `p-2 rounded-xl ${
                    canHoverExpand
                      ? "group-hover:px-3 group-hover:py-1.5 group-hover:gap-2 group-hover:w-full group-hover:justify-start"
                      : ""
                  }`
              : "rounded-full px-3 py-1.5 gap-1.5"
          }`}
        >
          <LogOut className="w-3.5 h-3.5 shrink-0" />
          {isVertical ? (
            isFullyExpanded ? (
              <span className="whitespace-nowrap">{t("signOut")}</span>
            ) : canHoverExpand ? (
              <span className="max-w-0 opacity-0 overflow-hidden whitespace-nowrap group-hover:max-w-[120px] group-hover:opacity-100 transition-all duration-200">
                {t("signOut")}
              </span>
            ) : null
          ) : (
            <span className="hidden sm:inline">{t("signOut")}</span>
          )}
        </button>

        {/* Settings Popover */}
        {isSettingsOpen && (
          <div
            className={`absolute ${getPopoverPositionClasses()} z-50 w-72 rounded-2xl border border-slate-700/90 bg-slate-900/95 p-4 text-slate-100 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150`}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-sky-400" />
                <span className="text-xs font-semibold text-white">
                  {t("popoverTitle")}
                </span>
              </div>
              <IconButton
                type="button"
                size="xs"
                variant="ghost"
                aria-label={tCommon("cancel")}
                onClick={() => setIsSettingsOpen(false)}
                className="text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="w-4 h-4" />
              </IconButton>
            </div>

            {/* Orientation choice */}
            <div className="space-y-1.5 mb-3">
              <label className="text-[11px] font-medium text-slate-400">
                {t("orientation")}
              </label>
              <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-slate-950/80 border border-slate-800">
                <button
                  type="button"
                  onClick={() => updateConfig({ orientation: "horizontal" })}
                  className={`flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium transition ${
                    !isVertical
                      ? "bg-sky-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <span className="w-3.5 h-1.5 rounded-full bg-current opacity-80" />
                  <span>{t("horizontal")}</span>
                </button>
                <button
                  type="button"
                  onClick={() => updateConfig({ orientation: "vertical" })}
                  className={`flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium transition ${
                    isVertical
                      ? "bg-sky-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <span className="w-1.5 h-3.5 rounded-full bg-current opacity-80" />
                  <span>{t("vertical")}</span>
                </button>
              </div>
            </div>

            {/* Always expanded switch for vertical panel */}
            {isVertical && (
              <div className="flex items-center justify-between py-2 border-t border-slate-800/80 mb-3">
                <div className="space-y-0.5">
                  <div className="text-[11px] font-medium text-slate-200">
                    {t("alwaysExpanded")}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {t("alwaysExpandedDesc")}
                  </div>
                </div>
                <Switch
                  checked={config.alwaysExpanded}
                  onCheckedChange={(checked) =>
                    updateConfig({ alwaysExpanded: checked })
                  }
                  aria-label={t("alwaysExpanded")}
                />
              </div>
            )}

            {/* Interactive screen preview map */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-medium text-slate-400">
                  {t("placementOnScreen")}
                </label>
                <span className="text-[10px] text-sky-400">
                  {isVertical ? config.verticalPlacement : config.horizontalPlacement}
                </span>
              </div>

              {/* Screen wireframe box */}
              <div className="relative aspect-video w-full rounded-xl border border-slate-800 bg-slate-950 p-2 flex flex-col justify-between overflow-hidden shadow-inner">
                {!isVertical ? (
                  <>
                    {/* Top Row Targets */}
                    <div className="flex items-center justify-between w-full">
                      <button
                        type="button"
                        onClick={() =>
                          updateConfig({ horizontalPlacement: "top-left" })
                        }
                        title={t("posTopLeft")}
                        className={`w-7 h-4 rounded-full border transition flex items-center justify-center text-[8px] ${
                          config.horizontalPlacement === "top-left"
                            ? "bg-sky-500 border-sky-400 shadow-md shadow-sky-500/40 text-white"
                            : "bg-slate-800/80 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-white"
                        }`}
                      >
                        TL
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          updateConfig({ horizontalPlacement: "top-center" })
                        }
                        title={t("posTopCenter")}
                        className={`w-9 h-4 rounded-full border transition flex items-center justify-center text-[8px] ${
                          config.horizontalPlacement === "top-center"
                            ? "bg-sky-500 border-sky-400 shadow-md shadow-sky-500/40 text-white"
                            : "bg-slate-800/80 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-white"
                        }`}
                      >
                        TC
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          updateConfig({ horizontalPlacement: "top-right" })
                        }
                        title={t("posTopRight")}
                        className={`w-7 h-4 rounded-full border transition flex items-center justify-center text-[8px] ${
                          config.horizontalPlacement === "top-right"
                            ? "bg-sky-500 border-sky-400 shadow-md shadow-sky-500/40 text-white"
                            : "bg-slate-800/80 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-white"
                        }`}
                      >
                        TR
                      </button>
                    </div>

                    <div className="text-center text-[9px] text-slate-600 font-mono select-none">
                      {t("horizontalPanel")}
                    </div>

                    {/* Bottom Row Targets */}
                    <div className="flex items-center justify-between w-full">
                      <button
                        type="button"
                        onClick={() =>
                          updateConfig({ horizontalPlacement: "bottom-left" })
                        }
                        title={t("posBottomLeft")}
                        className={`w-7 h-4 rounded-full border transition flex items-center justify-center text-[8px] ${
                          config.horizontalPlacement === "bottom-left"
                            ? "bg-sky-500 border-sky-400 shadow-md shadow-sky-500/40 text-white"
                            : "bg-slate-800/80 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-white"
                        }`}
                      >
                        BL
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          updateConfig({ horizontalPlacement: "bottom-center" })
                        }
                        title={t("posBottomCenter")}
                        className={`w-9 h-4 rounded-full border transition flex items-center justify-center text-[8px] ${
                          config.horizontalPlacement === "bottom-center"
                            ? "bg-sky-500 border-sky-400 shadow-md shadow-sky-500/40 text-white"
                            : "bg-slate-800/80 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-white"
                        }`}
                      >
                        BC
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          updateConfig({ horizontalPlacement: "bottom-right" })
                        }
                        title={t("posBottomRight")}
                        className={`w-7 h-4 rounded-full border transition flex items-center justify-center text-[8px] ${
                          config.horizontalPlacement === "bottom-right"
                            ? "bg-sky-500 border-sky-400 shadow-md shadow-sky-500/40 text-white"
                            : "bg-slate-800/80 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-white"
                        }`}
                      >
                        BR
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Vertical placement preview */}
                    <div className="flex justify-between items-stretch h-full w-full">
                      {/* Left Edge */}
                      <div className="flex flex-col justify-between py-0.5">
                        <button
                          type="button"
                          onClick={() =>
                            updateConfig({ verticalPlacement: "left-top" })
                          }
                          title={t("posLeftTop")}
                          className={`w-4 h-6 rounded-full border transition flex items-center justify-center text-[7px] ${
                            config.verticalPlacement === "left-top"
                              ? "bg-sky-500 border-sky-400 shadow-md shadow-sky-500/40 text-white"
                              : "bg-slate-800/80 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-white"
                          }`}
                        >
                          LT
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            updateConfig({ verticalPlacement: "left-middle" })
                          }
                          title={t("posLeftMiddle")}
                          className={`w-4 h-7 rounded-full border transition flex items-center justify-center text-[7px] ${
                            config.verticalPlacement === "left-middle"
                              ? "bg-sky-500 border-sky-400 shadow-md shadow-sky-500/40 text-white"
                              : "bg-slate-800/80 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-white"
                          }`}
                        >
                          LM
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            updateConfig({ verticalPlacement: "left-bottom" })
                          }
                          title={t("posLeftBottom")}
                          className={`w-4 h-6 rounded-full border transition flex items-center justify-center text-[7px] ${
                            config.verticalPlacement === "left-bottom"
                              ? "bg-sky-500 border-sky-400 shadow-md shadow-sky-500/40 text-white"
                              : "bg-slate-800/80 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-white"
                          }`}
                        >
                          LB
                        </button>
                      </div>

                      <div className="flex items-center justify-center text-[9px] text-slate-600 font-mono select-none">
                        {t("verticalPanel")}
                      </div>

                      {/* Right Edge */}
                      <div className="flex flex-col justify-between py-0.5">
                        <button
                          type="button"
                          onClick={() =>
                            updateConfig({ verticalPlacement: "right-top" })
                          }
                          title={t("posRightTop")}
                          className={`w-4 h-6 rounded-full border transition flex items-center justify-center text-[7px] ${
                            config.verticalPlacement === "right-top"
                              ? "bg-sky-500 border-sky-400 shadow-md shadow-sky-500/40 text-white"
                              : "bg-slate-800/80 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-white"
                          }`}
                        >
                          RT
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            updateConfig({ verticalPlacement: "right-middle" })
                          }
                          title={t("posRightMiddle")}
                          className={`w-4 h-7 rounded-full border transition flex items-center justify-center text-[7px] ${
                            config.verticalPlacement === "right-middle"
                              ? "bg-sky-500 border-sky-400 shadow-md shadow-sky-500/40 text-white"
                              : "bg-slate-800/80 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-white"
                          }`}
                        >
                          RM
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            updateConfig({ verticalPlacement: "right-bottom" })
                          }
                          title={t("posRightBottom")}
                          className={`w-4 h-6 rounded-full border transition flex items-center justify-center text-[7px] ${
                            config.verticalPlacement === "right-bottom"
                              ? "bg-sky-500 border-sky-400 shadow-md shadow-sky-500/40 text-white"
                              : "bg-slate-800/80 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-white"
                          }`}
                        >
                          RB
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="mt-3.5 pt-2.5 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
              <span>{t("savedInBrowser")}</span>
              <Button
                type="button"
                size="xs"
                variant="adminPrimary"
                onClick={() => setIsSettingsOpen(false)}
              >
                <Check className="w-3.5 h-3.5" />
                <span>{t("done")}</span>
              </Button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
