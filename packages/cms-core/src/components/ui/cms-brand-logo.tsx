"use client";

import React from "react";

export const CMS_BRAND_LOGO_DARK_URL =
  "/api/cms/assets/nextbooking-logo-dark.png";
export const CMS_BRAND_LOGO_LIGHT_URL =
  "/api/cms/assets/nextbooking-logo-light.png";

export interface CmsBrandLogoProps {
  /**
   * "dark"  = light text logo for dark backgrounds (e.g. Admin header)
   * "light" = dark navy text logo for light backgrounds
   * "auto"  = automatically switches between light and dark PNG based on Tailwind .dark class
   */
  variant?: "auto" | "dark" | "light";
  heightClassName?: string;
  className?: string;
  alt?: string;
}

export function CmsBrandLogo({
  variant = "auto",
  heightClassName = "h-8",
  className = "",
  alt = "NextBooking CMS",
}: CmsBrandLogoProps) {
  if (variant === "dark") {
    return (
      <img
        src={CMS_BRAND_LOGO_DARK_URL}
        alt={alt}
        className={`${heightClassName} min-w-[190px] w-auto object-contain select-none ${className}`}
      />
    );
  }

  if (variant === "light") {
    return (
      <img
        src={CMS_BRAND_LOGO_LIGHT_URL}
        alt={alt}
        className={`${heightClassName} min-w-[190px] w-auto object-contain select-none ${className}`}
      />
    );
  }

  return (
    <span className={`inline-flex items-center min-w-[190px] ${className}`}>
      <img
        src={CMS_BRAND_LOGO_LIGHT_URL}
        alt={alt}
        className={`${heightClassName} min-w-[190px] w-auto object-contain select-none block dark:hidden`}
      />
      <img
        src={CMS_BRAND_LOGO_DARK_URL}
        alt={alt}
        className={`${heightClassName} min-w-[190px] w-auto object-contain select-none hidden dark:block`}
      />
    </span>
  );
}

