"use client";

import React, { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useEditorStore } from "../../state/editor-store";
import { FloatingPanel, FloatingPanelProps } from "./floating-panel";
import { TextEditModal, TextEditModalProps } from "./text-edit-modal";
import { ImageEditModal, ImageEditModalProps } from "./image-edit-modal";
import { GalleryEditModal, GalleryEditModalProps } from "./gallery-edit-modal";
import { AdminApp } from "../../admin/admin-app";
import { AdminIntlProvider } from "../../i18n/provider";

export interface InlineEditorProps {
  adminUrl?: string;
  onSaveText?: TextEditModalProps["onSave"];
  onSaveImage?: ImageEditModalProps["onSave"];
  onDeleteImage?: ImageEditModalProps["onDelete"];
  onSaveGallery?: GalleryEditModalProps["onSave"];
}

export function InlineEditor({
  adminUrl,
  onSaveText,
  onSaveImage,
  onDeleteImage,
  onSaveGallery,
}: InlineEditorProps) {
  const { data: session, status } = useSession();
  const { mode, setMode, adminLanguage, setAdminLanguage } = useEditorStore();

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/cms/administrators/locale")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && (data.locale === "sv" || data.locale === "en")) {
            setAdminLanguage(data.locale);
          } else {
            // Fallback to settings if user profile has no locale yet
            fetch("/api/cms/settings")
              .then((res) => (res.ok ? res.json() : null))
              .then((settings) => {
                if (settings && (settings.adminLanguage === "sv" || settings.adminLanguage === "en")) {
                  setAdminLanguage(settings.adminLanguage);
                }
              })
              .catch(() => {});
          }
        })
        .catch(() => {});
    }
  }, [status, setAdminLanguage]);

  // Strictly enforce that unauthenticated visitors never see or load the inline editor
  if (status !== "authenticated" || !session?.user) {
    return null;
  }

  return (
    <AdminIntlProvider initialLocale={adminLanguage} onLocaleChange={setAdminLanguage}>
      <FloatingPanel adminUrl={adminUrl} />
      <TextEditModal onSave={onSaveText} />
      <ImageEditModal onSave={onSaveImage} onDelete={onDeleteImage} />
      <GalleryEditModal onSave={onSaveGallery} />
      {mode === "administration" && (
        <AdminApp
          isOverlay={true}
          onHideAdmin={() => setMode("normal")}
          adminName={session.user.name || session.user.email || "Super Admin"}
        />
      )}
    </AdminIntlProvider>
  );
}

export { FloatingPanel, TextEditModal, ImageEditModal, GalleryEditModal };
