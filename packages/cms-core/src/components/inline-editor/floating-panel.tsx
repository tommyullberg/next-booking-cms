"use client";

import React from "react";
import { useEditorStore, EditorMode } from "../../state/editor-store";
import { MousePointer, Type, Image as ImageIcon, ShieldCheck, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

export interface FloatingPanelProps {
  adminUrl?: string;
  className?: string;
}

export function FloatingPanel({
  className = "",
}: FloatingPanelProps) {
  const { mode, setMode } = useEditorStore();

  const handleAdminClick = () => {
    setMode("administration");
  };

  const handleSignOut = () => {
    setMode("normal");
    signOut({ callbackUrl: "/" });
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

  if (mode === "administration") {
    return null;
  }

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

        <button
          type="button"
          onClick={handleSignOut}
          title="Sign out administrator"
          className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-all duration-150 ml-1 border-l border-slate-700/60 pl-2.5"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}
