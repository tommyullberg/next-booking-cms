export interface CMSNavigationLink {
  id: string;
  link_url: string;
  link_text: string;
  sort_order: number;
}

export interface CMSNavigation {
  id: string;
  name: string;
  type: string;
  navigation_links: CMSNavigationLink[];
}

export interface CMSImage {
  id: string;
  file_name: string;
  file_url: string;
}

export interface CMSFieldTranslation {
  locale: string;
  content: string;
}

export interface CMSPageField {
  id: string;
  page_id: number | string;
  nbr: number;
  field_type: "TEXT" | "IMAGE" | "NAVIGATION";
  class_names?: string | null;
  content?: string | null;
  type?: string | null;
  rows?: number | null;
  image_id?: string | null;
  image?: CMSImage | null;
  width?: number | null;
  height?: number | null;
  max_width?: number | null;
  max_height?: number | null;
  ratio?: string | null;
  navigation_id?: string | null;
  navigation?: CMSNavigation | null;
  translations?: CMSFieldTranslation[];
}

export interface CMSPageTranslation {
  locale: string;
  page_title: string;
  link_description?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
}

export interface CMSNavigationSectionLink {
  id: number;
  label: string;
  url: string;
  status: string;
}

export interface CMSNavigationSection {
  id: string;
  name: string;
  translations?: Record<string, string> | any;
  is_root: boolean;
  start_page_id?: number | null;
  start_page_url: string | null;
  items: CMSNavigationSectionLink[];
}

export interface CMSPageData {
  id: number | string;
  template_name: string;
  section_id?: string | null;
  section?: { id: string; name: string } | null;
  categories?: Array<{ id: string; name: string; category_type_id: string }>;
  navigation_sections?: CMSNavigationSection[];
  page_title: string;
  link_description?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  slug: string;
  status: string;
  page_fields: CMSPageField[];
  translations?: CMSPageTranslation[];
}
