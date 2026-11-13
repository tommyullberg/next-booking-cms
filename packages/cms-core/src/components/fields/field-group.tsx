"use client";

import React from "react";
import { useSession } from "next-auth/react";
import { useCMSPage } from "./provider";
import { useEditorStore } from "@cms/state/editor-store";

export interface CMSFieldGroupProps {
  texts?: number[];
  images?: number[];
  galleries?: number[];
  match?: "any" | "all";
  as?: React.ElementType;
  className?: string;
  children: React.ReactNode;
}

export function CMSFieldGroup({
  texts,
  images,
  galleries,
  match = "any",
  as: Component,
  className = "",
  children,
}: CMSFieldGroupProps) {
  const { data: session } = useSession();
  const isAdmin = Boolean(session?.user);
  const { mode } = useEditorStore();
  const { getField, getGalleryItems, getLocalizedContent } = useCMSPage();

  const isEditing = isAdmin && (mode === "text" || mode === "image");

  const hasTextContent = (nbr: number): boolean => {
    const field = getField(nbr, "TEXT");
    const content = getLocalizedContent(field);
    return Boolean(content && content.trim().length > 0);
  };

  const hasImageContent = (nbr: number): boolean => {
    const field = getField(nbr, "IMAGE");
    return Boolean(
      field?.image?.file_url ||
        field?.image_id ||
        (field?.content && field.content.trim().length > 0)
    );
  };

  const hasGalleryContent = (nbr: number): boolean => {
    const items = getGalleryItems(nbr).filter((item) => item.image?.file_url);
    return Boolean(items && items.length > 0);
  };

  const checks: boolean[] = [];

  if (texts && texts.length > 0) {
    texts.forEach((nbr) => checks.push(hasTextContent(nbr)));
  }
  if (images && images.length > 0) {
    images.forEach((nbr) => checks.push(hasImageContent(nbr)));
  }
  if (galleries && galleries.length > 0) {
    galleries.forEach((nbr) => checks.push(hasGalleryContent(nbr)));
  }

  const isVisible =
    checks.length === 0 ||
    (match === "all" ? checks.every(Boolean) : checks.some(Boolean));

  if (!isVisible && !isEditing) {
    return null;
  }

  if (Component) {
    return <Component className={className || undefined}>{children}</Component>;
  }

  if (className) {
    return <div className={className}>{children}</div>;
  }

  return <>{children}</>;
}

