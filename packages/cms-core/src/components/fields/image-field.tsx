"use client";

import React from "react";
import { useSession } from "next-auth/react";
import { useCMSPage } from "./provider";
import { useEditorStore } from "../../state/editor-store";
import { CMSPageField } from "./types";

export interface CMSImageFieldProps {
  nbr: number;
  alt?: string;
  className?: string;
  wrapperClassName?: string;
  children?: (
    imageUrl: string,
    field: CMSPageField,
    altText: string
  ) => React.ReactNode;
}

export function CMSImageField({
  nbr,
  alt = "",
  className = "",
  wrapperClassName = "",
  children,
}: CMSImageFieldProps) {
  const { data: session } = useSession();
  const isAdmin = Boolean(session?.user);
  const { page, locale, getField } = useCMSPage();
  const { mode, setSelectedField, openModal } = useEditorStore();

  const field = getField(nbr, "IMAGE");
  const imageUrl = field?.image?.file_url;
  const isEditing = isAdmin && mode === "image";

  // If data is empty and not editing, return null per specification
  if (!imageUrl && !isEditing) {
    return null;
  }

  const handleClick = (e: React.MouseEvent) => {
    if (isEditing) {
      e.preventDefault();
      e.stopPropagation();
      setSelectedField({
        fieldId: field?.id,
        pageId: page.id,
        nbr,
        fieldType: "IMAGE",
        imageUrl: imageUrl ?? null,
        imageId: field?.image_id ?? null,
        width: field?.width ?? null,
        height: field?.height ?? null,
        maxWidth: field?.max_width ?? null,
        maxHeight: field?.max_height ?? null,
        ratio: field?.ratio ?? null,
        classNames: field?.class_names ?? "",
        locale,
      });
      openModal();
    }
  };

  if (typeof children === "function" && field && imageUrl) {
    return (
      <div
        onClick={isEditing ? handleClick : undefined}
        className={
          isEditing
            ? "cursor-pointer outline-dashed outline-2 outline-amber-500 rounded p-1 hover:bg-amber-500/10"
            : undefined
        }
      >
        {children(imageUrl, field, alt || field.image?.file_name || "")}
      </div>
    );
  }

  const combinedClasses = [
    field?.class_names,
    className,
    isEditing
      ? "cursor-pointer outline-dashed outline-2 outline-amber-500 rounded p-1 hover:bg-amber-500/10"
      : "",
  ]
    .filter(Boolean)
    .join(" ");

  if (!imageUrl && isEditing) {
    return (
      <div
        onClick={handleClick}
        className={`flex items-center justify-center rounded-2xl border-2 border-dashed border-amber-500/60 dark:border-amber-400/50 bg-amber-500/10 hover:bg-amber-500/15 p-8 text-amber-900 dark:text-amber-300 text-sm font-semibold transition ${combinedClasses}`}
        style={{
          aspectRatio: field?.ratio || "16/9",
        }}
      >
        Click to select Image #{nbr}
      </div>
    );
  }

  const imageStyle: React.CSSProperties = {
    maxWidth: field?.max_width ? `${field.max_width}px` : undefined,
    maxHeight: field?.max_height ? `${field.max_height}px` : undefined,
    aspectRatio: field?.ratio || undefined,
  };

  const imgElement = (
    <img
      src={imageUrl}
      alt={alt || field?.image?.file_name || `Bild ${nbr}`}
      width={field?.width || undefined}
      height={field?.height || undefined}
      style={imageStyle}
      onClick={isEditing ? handleClick : undefined}
      className={combinedClasses || undefined}
    />
  );

  if (wrapperClassName) {
    return <div className={wrapperClassName}>{imgElement}</div>;
  }

  return imgElement;
}
