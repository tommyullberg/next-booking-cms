"use client";

import React from "react";

export type FlagSize = "xs" | "sm" | "md" | "lg";

export interface FlagIconProps {
  /** Locale or country code (e.g. "sv", "SE", "en", "GB", "de", "DE", "fi", "FI", "no", "NO", "da", "DK") */
  code: string;
  size?: FlagSize;
  className?: string;
  title?: string;
}

const SIZE_CLASSES: Record<FlagSize, string> = {
  xs: "w-3.5 h-[10.5px]",
  sm: "w-4 h-3",
  md: "w-5 h-[15px]",
  lg: "w-6 h-[18px]",
};

function normalizeCountryCode(raw: string): string {
  const lower = (raw || "").trim().toLowerCase();
  if (lower === "sv" || lower === "se") return "se";
  if (lower === "en" || lower === "gb" || lower === "uk") return "gb";
  if (lower === "de") return "de";
  if (lower === "fi") return "fi";
  if (lower === "no" || lower === "nb" || lower === "nn") return "no";
  if (lower === "da" || lower === "dk") return "dk";
  return lower;
}

export function FlagIcon({
  code,
  size = "sm",
  className = "",
  title,
}: FlagIconProps) {
  const normalized = normalizeCountryCode(code);
  const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.sm;
  const combinedClass = `inline-block shrink-0 overflow-hidden rounded-[2px] ring-1 ring-white/15 shadow-sm select-none ${sizeClass} ${className}`.trim();

  switch (normalized) {
    case "se":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 640 480"
          className={combinedClass}
          role="img"
          aria-label={title || "Sweden"}
        >
          <path fill="#005293" d="M0 0h640v480H0z" />
          <path
            fill="#fecb00"
            d="M176 0v192H0v96h176v192h96V288h368v-96H272V0z"
          />
        </svg>
      );

    case "gb":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 640 480"
          className={combinedClass}
          role="img"
          aria-label={title || "United Kingdom"}
        >
          <path fill="#012169" d="M0 0h640v480H0z" />
          <path
            fill="#FFF"
            d="m75 0 244 181L562 0h78v62L400 241l240 178v61h-80L320 301 81 480H0v-60l239-178L0 64V0h75z"
          />
          <path
            fill="#C8102E"
            d="m424 281 216 159v40L369 281h55zm-184 20 6 35L54 480H0l240-179zM640 0v3L391 191l2-44L590 0h50zM0 0l239 176h-60L0 42V0z"
          />
          <path fill="#FFF" d="M241 0v480h160V0H241zM0 160v160h640V160H0z" />
          <path
            fill="#C8102E"
            d="M0 193v96h640v-96H0zM273 0v480h96V0h-96z"
          />
        </svg>
      );

    case "de":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 640 480"
          className={combinedClass}
          role="img"
          aria-label={title || "Germany"}
        >
          <path fill="#ffce00" d="M0 320h640v160H0z" />
          <path fill="#000" d="M0 0h640v160H0z" />
          <path fill="#d00" d="M0 160h640v160H0z" />
        </svg>
      );

    case "fi":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 640 480"
          className={combinedClass}
          role="img"
          aria-label={title || "Finland"}
        >
          <path fill="#fff" d="M0 0h640v480H0z" />
          <path fill="#002f6c" d="M0 174.5h640v131H0z" />
          <path fill="#002f6c" d="M175.5 0h130.9v480h-131z" />
        </svg>
      );

    case "no":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 640 480"
          className={combinedClass}
          role="img"
          aria-label={title || "Norway"}
        >
          <path fill="#ed2939" d="M0 0h640v480H0z" />
          <path fill="#fff" d="M180 0h120v480H180z" />
          <path fill="#fff" d="M0 180h640v120H0z" />
          <path fill="#002664" d="M210 0h60v480h-60z" />
          <path fill="#002664" d="M0 210h640v60H0z" />
        </svg>
      );

    case "dk":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 640 480"
          className={combinedClass}
          role="img"
          aria-label={title || "Denmark"}
        >
          <path fill="#c8102e" d="M0 0h640v480H0z" />
          <path fill="#fff" d="M205.7 0h68.6v480h-68.6z" />
          <path fill="#fff" d="M0 205.7h640v68.6H0z" />
        </svg>
      );

    default:
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 640 480"
          className={combinedClass}
          role="img"
          aria-label={title || code}
        >
          <rect width="640" height="480" fill="#1e293b" />
          <text
            x="320"
            y="300"
            textAnchor="middle"
            fill="#94a3b8"
            fontSize="220"
            fontFamily="monospace"
            fontWeight="bold"
          >
            {code.slice(0, 2).toUpperCase()}
          </text>
        </svg>
      );
  }
}
