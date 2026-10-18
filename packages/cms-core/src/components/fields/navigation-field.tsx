"use client";

import React from "react";
import { useCMSPage } from "./provider";
import { CMSNavigation, CMSNavigationLink } from "./types";

export interface CMSNavigationFieldProps {
  nbr: number;
  children: (
    links: CMSNavigationLink[],
    navigation?: CMSNavigation | null
  ) => React.ReactNode;
}

export function CMSNavigationField({
  nbr,
  children,
}: CMSNavigationFieldProps) {
  const { getField } = useCMSPage();

  const field = getField(nbr, "NAVIGATION");
  const rawLinks = field?.navigation?.navigation_links || [];

  if (!rawLinks.length) {
    return null;
  }

  const sortedLinks = [...rawLinks].sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
  );

  return <React.Fragment>{children(sortedLinks, field?.navigation)}</React.Fragment>;
}
