"use client";

import React from "react";
import { useSession } from "next-auth/react";
import { useEditorStore } from "../../state/editor-store";
import { FloatingPanel, FloatingPanelProps } from "./floating-panel";
import { TextEditModal, TextEditModalProps } from "./text-edit-modal";
import { ImageEditModal, ImageEditModalProps } from "./image-edit-modal";
import { AdminApp } from "../../admin/admin-app";

export interface InlineEditorProps {
  adminUrl?: string;
  onSaveText?: TextEditModalProps["onSave"];
  onSaveImage?: ImageEditModalProps["onSave"];
  onDeleteImage?: ImageEditModalProps["onDelete"];
}

export function InlineEditor({
  adminUrl,
  onSaveText,
  onSaveImage,
  onDeleteImage,
}: InlineEditorProps) {
  const { data: session, status } = useSession();
  const { mode, setMode } = useEditorStore();

  // Strictly enforce that unauthenticated visitors never see or load the inline editor
  if (status !== "authenticated" || !session?.user) {
    return null;
  }

  return (
    <>
      <FloatingPanel adminUrl={adminUrl} />
      <TextEditModal onSave={onSaveText} />
      <ImageEditModal onSave={onSaveImage} onDelete={onDeleteImage} />
      {mode === "administration" && (
        <AdminApp
          isOverlay={true}
          onHideAdmin={() => setMode("normal")}
          adminName={session.user.name || session.user.email || "Super Admin"}
        />
      )}
    </>
  );
}

export { FloatingPanel, TextEditModal, ImageEditModal };
