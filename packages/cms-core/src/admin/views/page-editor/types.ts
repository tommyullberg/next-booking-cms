import { CMSPageField } from "@cms/components/fields/types";
import { CategoryTypeItem } from "../categories-view";
import { BookingObjectDetails } from "@cms/booking/types";
import { CMSTemplateOption } from "@cms/templates/types";
import { AdminLanguage, SupportedLocale } from "@cms/constants/languages";
import { DefaultLanguageUrlPrefix } from "@cms/types/settings";
import { PageStatus } from "@cms/types/admin";

export type { PageStatus };

export interface PageEditorData {
  id: number | string;
  template_name: string;
  section_id?: string | null;
  categories?: Array<{ id: string; name: string; category_type_id: string }>;
  page_title: string;
  link_description?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  slug: string;
  slug_mode?: "same" | "separate" | string;
  active_languages?: string[] | null | unknown;
  status: PageStatus;
  publication_start?: string | Date | null;
  publication_end?: string | Date | null;
  created_date?: string | Date;
  page_fields?: CMSPageField[];
  translations?: Array<{
    locale: string;
    page_title: string;
    link_description?: string | null;
    linkDescription?: string | null;
    meta_title?: string | null;
    metaTitle?: string | null;
    meta_description?: string | null;
    metaDescription?: string | null;
    slug?: string | null;
  }>;
}

export interface PageEditorViewProps {
  page: PageEditorData;
  availableTemplates?: CMSTemplateOption[];
  existingPages?: Array<{
    id: number | string;
    slug: string;
    page_title?: string;
  }>;
  sections?: Array<{ id: string; name: string }>;
  categoryTypes?: CategoryTypeItem[];
  bookingObjects?: BookingObjectDetails[];
  activeLanguages?: string[];
  activeLocales?: string[];
  defaultLanguage?: SupportedLocale;
  defaultLanguageUrlPrefix?: DefaultLanguageUrlPrefix;
  adminLanguage?: AdminLanguage;
  onBack: () => void;
  onSave: (data: any) => Promise<void>;
}

export interface LocaleTranslationData {
  pageTitle: string;
  linkDescription: string;
  metaTitle: string;
  metaDescription: string;
}

export type LocaleTranslationMap = Record<string, LocaleTranslationData>;
