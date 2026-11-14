import React from "react";
import {
  LayoutTemplate,
  FileText,
  Maximize2,
  CircleDot,
  Box,
} from "lucide-react";

export function getTemplateIcon(templateId: string) {
  switch (templateId.toLowerCase()) {
    case "startpage":
      return LayoutTemplate;
    case "booking-unit":
    case "booking":
      return Box;
    case "booking-overview":
      return Maximize2;
    case "contact":
      return CircleDot;
    case "article":
    default:
      return FileText;
  }
}

export function CharacterCounter({
  current,
  limit,
}: {
  current: number;
  limit: number;
}) {
  const isOver = current > limit;
  return (
    <span
      className={`text-[10px] font-mono ${
        isOver
          ? "text-amber-400 font-semibold"
          : current > limit * 0.85
          ? "text-sky-400"
          : "text-slate-500"
      }`}
    >
      {current} / {limit}
    </span>
  );
}

