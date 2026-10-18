"use client";

import React from "react";
import { useSession } from "next-auth/react";
import { FloatingPanel, FloatingPanelProps } from "./floating-panel";
import { TextEditModal, TextEditModalProps } from "./text-edit-modal";
import { ImageEditModal, ImageEditModalProps } from "./image-edit-modal";

export interface InlineEditorProps {
  adminUrl?: string;
  onSaveText?: TextEditModalProps["onSave"];
  onSaveImage?: ImageEditModalProps["onSave"];
}

export function InlineEditor({
  adminUrl,
  onSaveText,
  onSaveImage,
}: InlineEditorProps) {
  const { data: session, status } = useSession();

  // Strictly enforce that unauthenticated visitors never see or load the inline editor
  if (status !== "authenticated" || !session?.user) {
    return null;
  }

  return (
    <>
      <FloatingPanel adminUrl={adminUrl} />
      <TextEditModal onSave={onSaveText} />
      <ImageEditModal onSave={onSaveImage} />
    </>
  );
}

export { FloatingPanel, TextEditModal, ImageEditModal };
