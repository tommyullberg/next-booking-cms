import { FieldType, PageStatus } from "@prisma/client";

export interface SeedLinkConfig {
  link_text: string;
  link_url: string;
  sort_order: number;
}

export interface SeedNavigationFieldConfig {
  nbr: number;
  field_type: "NAVIGATION";
  name: string;
  type: string;
  links: SeedLinkConfig[];
}

export interface SeedTextFieldConfig {
  nbr: number;
  field_type: "TEXT";
  type: string;
  content: string;
}

export interface SeedImageFieldConfig {
  nbr: number;
  field_type: "IMAGE";
  file_name: string;
  file_url: string;
  ratio?: string;
  max_width?: number;
}

export type SeedFieldConfig =
  | SeedTextFieldConfig
  | SeedImageFieldConfig
  | SeedNavigationFieldConfig;

export interface SeedSectionConfig {
  name: string;
  sort_order?: number;
  is_visible?: boolean;
}

export interface SeedPageConfig {
  page_title: string;
  slug: string;
  template_name: string;
  status?: PageStatus;
  meta_title?: string;
  meta_description?: string;
  fields: SeedFieldConfig[];
}

export interface SeedConfig {
  section: SeedSectionConfig;
  page: SeedPageConfig;
}
