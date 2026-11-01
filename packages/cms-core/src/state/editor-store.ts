import { create } from "zustand";
import { CMSGalleryItem } from "../components/fields/types";
import { AdminLanguage } from "../constants/languages";

export type EditorMode = "normal" | "text" | "image" | "administration";

export interface SelectedFieldData {
  fieldId?: string;
  pageId: number | string;
  nbr: number;
  fieldType: "TEXT" | "IMAGE" | "NAVIGATION" | "GALLERY";
  content?: string | null;
  translations?: Record<string, string>;
  textType?: string | null;
  rows?: number | null;
  imageUrl?: string | null;
  imageId?: string | null;
  width?: number | null;
  height?: number | null;
  maxWidth?: number | null;
  maxHeight?: number | null;
  ratio?: string | null;
  classNames?: string | null;
  navigationId?: string | null;
  locale?: string;
  galleryItems?: CMSGalleryItem[];
}

export interface EditorState {
  mode: EditorMode;
  selectedField: SelectedFieldData | null;
  isModalOpen: boolean;
  activeLocale: string;
  adminLanguage: AdminLanguage;
  setMode: (mode: EditorMode) => void;
  setSelectedField: (field: SelectedFieldData | null) => void;
  openModal: () => void;
  closeModal: () => void;
  setActiveLocale: (locale: string) => void;
  setAdminLanguage: (lang: AdminLanguage) => void;
  reset: () => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  mode: "normal",
  selectedField: null,
  isModalOpen: false,
  activeLocale: "sv",
  adminLanguage: (() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("cms_admin_locale");
      if (stored === "sv" || stored === "en") return stored as AdminLanguage;
      const match = document.cookie.match(/(?:^|;\s*)cms_admin_locale=(sv|en)(?:;|$)/);
      if (match && (match[1] === "sv" || match[1] === "en")) return match[1] as AdminLanguage;
    }
    return "en";
  })(),
  setMode: (mode) =>
    set({
      mode,
      // If switching out of edit modes, close modal
      isModalOpen: mode === "normal" ? false : undefined,
    }),
  setSelectedField: (field) => set({ selectedField: field }),
  openModal: () => set({ isModalOpen: true }),
  closeModal: () => set({ isModalOpen: false, selectedField: null }),
  setActiveLocale: (locale) => set({ activeLocale: locale }),
  setAdminLanguage: (lang) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("cms_admin_locale", lang);
      document.cookie = `cms_admin_locale=${lang}; path=/; max-age=31536000; SameSite=Lax`;
    }
    set({ adminLanguage: lang });
  },
  reset: () =>
    set({
      mode: "normal",
      selectedField: null,
      isModalOpen: false,
      activeLocale: "sv",
    }),
}));
