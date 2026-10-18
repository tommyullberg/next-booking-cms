"use client";

import React from "react";
import { useEditorStore, EditorMode } from "../../state/editor-store";
import { MousePointer, Type, Image as ImageIcon, ShieldCheck } from "lucide-react";

export interface FloatingPanelProps {
  adminUrl?: string;
  className?: string;
}

export function FloatingPanel({
  adminUrl = "/admin",
  className = "",
}: FloatingPanelProps) {
  const { mode, setMode } = useEditorStore();

  const handleAdminClick = () => {
    setMode("administration");
    if (typeof window !== "undefined") {
      window.location.href = adminUrl;
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
      label: "Normal",
      icon: <MousePointer className="w-4 h-4" />,
      onClick: () => setMode("normal"),
    },
    {
      mode: "text",
      label: "Text",
      icon: <Type className="w-4 h-4" />,
      onClick: () => setMode("text"),
    },
    {
      mode: "image",
      label: "Image",
      icon: <ImageIcon className="w-4 h-4" />,
      onClick: () => setMode("image"),
    },
    {
      mode: "administration",
      label: "Administration",
      icon: <ShieldCheck className="w-4 h-4" />,
      onClick: handleAdminClick,
    },
  ];

  return (
    <aside
      aria-label="CMS Inline Editor Toolbar"
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-1.5 rounded-full border border-slate-700/80 bg-slate-900/90 p-1.5 shadow-2xl backdrop-blur-md text-white transition-all duration-200 ${className}`}
    >
      <div className="flex items-center gap-1.5">
        {buttons.map((btn) => {
          const isActive = mode === btn.mode;
          return (
            <button
              key={btn.mode}
              type="button"
              onClick={btn.onClick}
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all duration-150 ${
                isActive
                  ? "bg-sky-500 text-white shadow-md shadow-sky-500/20"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              {btn.icon}
              <span>{btn.label}</span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
