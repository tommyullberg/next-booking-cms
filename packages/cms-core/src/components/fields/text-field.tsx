"use client";

import React from "react";
import { useSession } from "next-auth/react";
import { useCMSPage } from "./provider";
import { useEditorStore } from "../../state/editor-store";
import { CMSPageField } from "./types";

export interface CMSTextFieldProps {
  nbr: number;
  as?: React.ElementType;
  className?: string;
  children?: (content: string, field: CMSPageField) => React.ReactNode;
}

export function CMSTextField({
  nbr,
  as: Component = "div",
  className = "",
  children,
}: CMSTextFieldProps) {
  const { data: session } = useSession();
  const isAdmin = Boolean(session?.user);
  const { page, locale, getField, getLocalizedContent } = useCMSPage();
  const { mode, setSelectedField, openModal } = useEditorStore();

  const field = getField(nbr, "TEXT");
  const content = getLocalizedContent(field);

  const isEditing = isAdmin && mode === "text";

  // If data is empty and not editing, return null per specification
  if (!content && !isEditing) {
    return null;
  }

  const handleClick = (e: React.MouseEvent) => {
    if (isEditing) {
      e.preventDefault();
      e.stopPropagation();
      const transMap: Record<string, string> = {};
      if (field?.translations && Array.isArray(field.translations)) {
        field.translations.forEach((t) => {
          if (t.locale) {
            transMap[t.locale] = t.content || "";
          }
        });
      }
      setSelectedField({
        fieldId: field?.id,
        pageId: page.id,
        nbr,
        fieldType: "TEXT",
        content: field?.content ?? content ?? "",
        translations: transMap,
        textType: field?.type ?? "plain",
        rows: field?.rows ?? 3,
        classNames: field?.class_names ?? "",
        locale,
      });
      openModal();
    }
  };

  const displayContent = content || (isEditing ? `[Empty text field #${nbr}]` : "");

  if (typeof children === "function" && field) {
    return (
      <div
        onClick={isEditing ? handleClick : undefined}
        className={
          isEditing
            ? "cursor-pointer outline-dashed outline-2 outline-sky-500 rounded p-1 hover:bg-sky-50/20"
            : undefined
        }
      >
        {children(displayContent, field)}
      </div>
    );
  }

  const combinedClasses = [
    field?.class_names,
    className,
    isEditing
      ? "cursor-pointer outline-dashed outline-2 outline-sky-500 rounded p-1 hover:bg-sky-50/20"
      : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Component
      onClick={isEditing ? handleClick : undefined}
      className={combinedClasses || undefined}
    >
      {displayContent}
    </Component>
  );
}
