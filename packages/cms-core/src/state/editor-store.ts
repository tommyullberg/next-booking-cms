import { create } from "zustand";

export type EditorMode = "normal" | "text" | "image" | "administration";

export interface SelectedFieldData {
  fieldId?: string;
  pageId: number | string;
  nbr: number;
  fieldType: "TEXT" | "IMAGE" | "NAVIGATION";
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
}

export interface EditorState {
  mode: EditorMode;
  selectedField: SelectedFieldData | null;
  isModalOpen: boolean;
  activeLocale: string;
  setMode: (mode: EditorMode) => void;
  setSelectedField: (field: SelectedFieldData | null) => void;
  openModal: () => void;
  closeModal: () => void;
  setActiveLocale: (locale: string) => void;
  reset: () => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  mode: "normal",
  selectedField: null,
  isModalOpen: false,
  activeLocale: "sv",
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
  reset: () =>
    set({
      mode: "normal",
      selectedField: null,
      isModalOpen: false,
      activeLocale: "sv",
    }),
}));
