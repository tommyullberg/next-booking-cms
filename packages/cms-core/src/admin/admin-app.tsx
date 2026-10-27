"use client";

import React, { useState, useEffect } from "react";
import { signOut } from "next-auth/react";
import { AdminThemeProvider } from "./theme-context";
import { AdminLayout } from "./admin-layout";
import { DashboardView } from "./views/dashboard-view";
import { PagesView, PageListItem } from "./views/pages-view";
import { PageEditorView, PageEditorData } from "./views/page-editor-view";
import { SectionsView, SectionItem } from "./views/sections-view";
import { CategoriesView, CategoryTypeItem } from "./views/categories-view";
import { AdministratorsView, AdministratorItem } from "./views/administrators-view";
import { LandlordsView, LandlordItem } from "./views/landlords-view";
import { BookingObjectsView, BookingObjectItem } from "./views/booking-objects-view";
import { ObjectPricesView } from "./views/object-prices-view";
import { OptionalsView, OptionalItem } from "./views/optionals-view";
import { AmenitiesView } from "./views/amenities-view";
import { BookingsDashboardView } from "./views/bookings-dashboard-view";
import { BookingsCalendarView } from "./views/bookings-calendar-view";
import { NavigationMenusView } from "./views/navigation-menus-view";
import { MediaView, MediaItem } from "./views/media-view";
import { MailTemplatesView, MailTemplateItem } from "./views/mail-templates-view";
import { SettingsView } from "./views/settings-view";
import { CMSTemplateOption } from "../templates/types";
import { AmenityItem } from "../booking/types";
import { AdminTab } from "../types/admin";
import { CmsSettingsData } from "../types/settings";
import { AdminLanguage, DEFAULT_ACTIVE_LANGUAGES, DEFAULT_ADMIN_LANGUAGE } from "../constants/languages";

export interface AdminAppProps {
  initialPages?: PageListItem[];
  initialSections?: SectionItem[];
  initialCategoryTypes?: CategoryTypeItem[];
  initialAdministrators?: AdministratorItem[];
  initialLandlords?: LandlordItem[];
  initialBookingObjects?: BookingObjectItem[];
  initialOptionals?: OptionalItem[];
  initialAmenities?: AmenityItem[];
  initialMedia?: MediaItem[];
  initialMailTemplates?: MailTemplateItem[];
  initialSettings?: Partial<CmsSettingsData>;
  availableTemplates?: CMSTemplateOption[];
  adminName?: string;
  frontendUrl?: string;
  isOverlay?: boolean;
  onHideAdmin?: () => void;
  onSavePage?: (data: any) => Promise<void>;
  onCreatePage?: (data: any) => Promise<void>;
  onDeletePage?: (id: number | string) => Promise<void>;
  onCreateSection?: (data: any) => Promise<void>;
  onDeleteSection?: (id: string) => Promise<void>;
  onToggleSectionVisibility?: (id: string, current: boolean) => Promise<void>;
  onUploadMedia?: (file: File) => Promise<void>;
  onDeleteMedia?: (id: string) => Promise<void>;
  onSaveMailTemplate?: (type: any, subject: string, body: string) => Promise<void>;
}

export function AdminApp({
  initialPages = [],
  initialSections = [],
  initialCategoryTypes = [],
  initialAdministrators = [],
  initialLandlords = [],
  initialBookingObjects = [],
  initialOptionals = [],
  initialAmenities = [],
  initialMedia = [],
  initialMailTemplates = [],
  initialSettings,
  availableTemplates,
  adminName = "Super Admin",
  frontendUrl = "/",
  isOverlay = false,
  onHideAdmin,
  onSavePage,
  onCreatePage,
  onDeletePage,
  onCreateSection,
  onDeleteSection,
  onToggleSectionVisibility,
  onUploadMedia,
  onDeleteMedia,
  onSaveMailTemplate,
}: AdminAppProps) {
  const [currentTab, setCurrentTab] = useState<AdminTab>("dashboard");
  const [pages, setPages] = useState<PageListItem[]>(initialPages);
  const [sections, setSections] = useState<SectionItem[]>(initialSections);
  const [categoryTypes, setCategoryTypes] = useState<CategoryTypeItem[]>(
    initialCategoryTypes
  );
  const [administrators, setAdministrators] = useState<AdministratorItem[]>(
    initialAdministrators
  );
  const [landlords, setLandlords] = useState<LandlordItem[]>(initialLandlords);
  const [bookingObjects, setBookingObjects] = useState<BookingObjectItem[]>(
    initialBookingObjects
  );
  const [optionals, setOptionals] = useState<OptionalItem[]>(initialOptionals);
  const [amenities, setAmenities] = useState<AmenityItem[]>(initialAmenities);
  const [media, setMedia] = useState<MediaItem[]>(initialMedia);
  const [mailTemplates, setMailTemplates] = useState<MailTemplateItem[]>(initialMailTemplates);
  const [activeLanguages, setActiveLanguages] = useState<string[]>(
    initialSettings?.activeLanguages || [...DEFAULT_ACTIVE_LANGUAGES]
  );
  const [adminLanguage, setAdminLanguage] = useState<AdminLanguage>(
    initialSettings?.adminLanguage || DEFAULT_ADMIN_LANGUAGE
  );
  const [editingPage, setEditingPage] = useState<PageEditorData | null>(null);

  useEffect(() => {
    if (isOverlay && initialPages.length === 0) {
      fetch("/api/cms/admin-init")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data) {
            if (Array.isArray(data.pages)) setPages(data.pages);
            if (Array.isArray(data.sections)) setSections(data.sections);
            if (Array.isArray(data.categoryTypes)) {
              setCategoryTypes(data.categoryTypes);
            }
            if (Array.isArray(data.administrators)) {
              setAdministrators(data.administrators);
            }
            if (Array.isArray(data.landlords)) {
              setLandlords(data.landlords);
            }
            if (Array.isArray(data.bookingObjects)) {
              setBookingObjects(data.bookingObjects);
            }
            if (Array.isArray(data.optionals)) {
              setOptionals(data.optionals);
            }
            if (Array.isArray(data.amenities)) {
              setAmenities(data.amenities);
            }
            if (Array.isArray(data.media)) setMedia(data.media);
            if (Array.isArray(data.mailTemplates)) setMailTemplates(data.mailTemplates);
            if (data.settings) {
              if (Array.isArray(data.settings.activeLanguages)) {
                setActiveLanguages(data.settings.activeLanguages);
              }
              if (data.settings.adminLanguage === "sv" || data.settings.adminLanguage === "en") {
                setAdminLanguage(data.settings.adminLanguage);
              }
            }
          }
        })
        .catch(() => {
          // Graceful fallback if offline
        });
    } else if (!initialSettings) {
      fetch("/api/cms/settings")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data) {
            if (Array.isArray(data.activeLanguages)) {
              setActiveLanguages(data.activeLanguages);
            }
            if (data.adminLanguage === "sv" || data.adminLanguage === "en") {
              setAdminLanguage(data.adminLanguage);
            }
          }
        })
        .catch(() => {});
    }
  }, [isOverlay, initialPages.length, initialSettings]);

  useEffect(() => {
    setLandlords(initialLandlords);
  }, [initialLandlords]);

  useEffect(() => {
    setBookingObjects(initialBookingObjects);
  }, [initialBookingObjects]);

  useEffect(() => {
    setOptionals(initialOptionals);
  }, [initialOptionals]);

  useEffect(() => {
    setAmenities(initialAmenities);
  }, [initialAmenities]);

  // Synchronize live booking and amenity data on tab switches without manual reload
  useEffect(() => {
    if (currentTab === "amenities" || currentTab === "objects") {
      fetch("/api/cms/amenities", { cache: "no-store" })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (Array.isArray(data)) setAmenities(data);
        })
        .catch(() => {});

      fetch("/api/cms/booking-objects", { cache: "no-store" })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (Array.isArray(data)) setBookingObjects(data);
        })
        .catch(() => {});
    }

    if (currentTab === "optionals" || currentTab === "media") {
      fetch("/api/cms/media", { cache: "no-store" })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (Array.isArray(data)) setMedia(data);
        })
        .catch(() => {});
    }
  }, [currentTab]);

  const handleEditPage = async (pageId: number | string) => {
    try {
      const res = await fetch(`/api/cms/pages/${pageId}`);
      if (res.ok) {
        const fullPage = await res.json();
        setEditingPage(fullPage);
        setCurrentTab("page-editor");
        return;
      }
    } catch {
      // Fallback
    }
    const found = pages.find((p) => String(p.id) === String(pageId));
    if (found) {
      setEditingPage({
        id: found.id,
        template_name: found.template_name,
        section_id: found.section?.id || null,
        page_title: found.page_title,
        slug: found.slug,
        status: found.status,
        page_fields: [],
      });
      setCurrentTab("page-editor");
    }
  };

  const handleSavePageInternal = async (data: any) => {
    let savedPage: any = null;
    if (onSavePage) {
      await onSavePage(data);
    } else {
      const res = await fetch(`/api/cms/pages/${data.id || ""}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        savedPage = await res.json();
      }
    }

    setPages((prev) =>
      prev.map((p) =>
        String(p.id) === String(data.id)
          ? {
              ...p,
              page_title: data.pageTitle,
              slug: data.slug,
              template_name: data.templateName || p.template_name,
              status: data.status,
              section: sections.find((s) => s.id === data.sectionId) || null,
            }
          : p
      )
    );
    setEditingPage((prev) =>
      prev && String(prev.id) === String(data.id)
        ? {
            ...prev,
            ...(savedPage ? { categories: savedPage.categories } : {}),
            page_title: data.pageTitle,
            menu_title: data.menuTitle,
            slug: data.slug,
            template_name: data.templateName || prev.template_name,
            section_id: data.sectionId || null,
            status: data.status,
            publication_start: data.publicationStart,
            publication_end: data.publicationEnd,
            modified_date: new Date(),
          }
        : prev
    );
  };

  const handleCreatePageInternal = async (data: any) => {
    if (onCreatePage) {
      await onCreatePage(data);
    } else {
      const res = await fetch("/api/cms/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const created = await res.json();
        setPages((prev) => [...prev, created]);
        return;
      }
    }
    const nextId =
      pages.reduce((max, p) => Math.max(max, Number(p.id) || 1001), 1001) + 1;
    setPages((prev) => [
      ...prev,
      {
        id: nextId,
        page_title: data.pageTitle,
        slug: data.slug || String(nextId),
        template_name: data.templateName,
        status: "NEW",
        created_date: new Date(),
        section: sections.find((s) => s.id === data.sectionId) || null,
      },
    ]);
  };

  const handleDeletePageInternal = async (pageId: number | string) => {
    if (Number(pageId) === 1001) return;
    if (onDeletePage) {
      await onDeletePage(pageId);
    } else {
      await fetch(`/api/cms/pages/${pageId}`, { method: "DELETE" });
    }
    setPages((prev) => prev.filter((p) => String(p.id) !== String(pageId)));
  };

  const handleSaveSectionInternal = async (data: any) => {
    const res = await fetch("/api/cms/sections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const saved = await res.json();
      setSections((prev) => {
        const exists = prev.some((s) => s.id === saved.id);
        if (exists) {
          return prev.map((s) => (s.id === saved.id ? saved : s));
        }
        return [...prev, saved];
      });
      return saved;
    }
    if (data.id) {
      setSections((prev) =>
        prev.map((s) =>
          s.id === data.id
            ? {
                ...s,
                name: data.name,
                translations: data.translations,
                start_page_id: data.startPageId,
                sort_order: data.sortOrder,
                is_visible: data.isVisible,
              }
            : s
        )
      );
    } else {
      setSections((prev) => [
        ...prev,
        {
          id: `sec-${Date.now()}`,
          name: data.name,
          translations: data.translations,
          start_page_id: data.startPageId,
          sort_order: data.sortOrder,
          is_visible: data.isVisible,
        },
      ]);
    }
  };

  const handleReorderSectionsInternal = async (orderedIds: string[]) => {
    setSections((prev) => {
      const map = new Map(prev.map((s) => [s.id, s]));
      return orderedIds
        .map((id, idx) => {
          const item = map.get(id);
          return item ? { ...item, sort_order: idx + 1 } : null;
        })
        .filter(Boolean) as SectionItem[];
    });

    try {
      const res = await fetch("/api/cms/sections/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds }),
      });
      if (res.ok) {
        const updated = await res.json();
        if (Array.isArray(updated)) {
          setSections(updated);
        }
      }
    } catch {
      // Optimistic state kept on failure
    }
  };

  const handleCreateSectionInternal = async (data: any) => {
    if (onCreateSection) {
      await onCreateSection(data);
    } else {
      await handleSaveSectionInternal(data);
    }
  };

  const handleDeleteSectionInternal = async (id: string) => {
    if (onDeleteSection) {
      await onDeleteSection(id);
    } else {
      await fetch(`/api/cms/sections/${id}`, { method: "DELETE" });
    }
    setSections((prev) => prev.filter((s) => s.id !== id));
  };

  const handleUpdateMenuItemInternal = async (params: {
    previousPageId?: number | string | null;
    targetPageId: number | string;
    sectionId: string | null;
    menuTitle?: string;
    sortOrder?: number;
  }) => {
    const targetSec = params.sectionId
      ? sections.find((s) => s.id === params.sectionId) || null
      : null;

    setPages((prev) =>
      prev.map((p) => {
        if (
          params.previousPageId != null &&
          String(p.id) === String(params.previousPageId) &&
          String(params.previousPageId) !== String(params.targetPageId)
        ) {
          return { ...p, section: null, section_id: null } as any;
        }
        if (String(p.id) === String(params.targetPageId)) {
          return {
            ...p,
            section: targetSec,
            section_id: params.sectionId,
            ...(params.menuTitle !== undefined
              ? { link_description: params.menuTitle }
              : {}),
            ...(params.sortOrder !== undefined
              ? { sort_order: params.sortOrder }
              : {}),
          } as any;
        }
        return p;
      })
    );

    try {
      const res = await fetch("/api/cms/navigation-menus/item", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      if (res.ok) {
        const updatedSections = await res.json();
        if (Array.isArray(updatedSections)) {
          setSections(updatedSections);
        }
      }
    } catch {
      // Keep optimistic state
    }
  };

  const handleReorderMenuItemsInternal = async (
    items: Array<{
      pageId: number | string;
      sectionId: string | null;
      sortOrder: number;
    }>
  ) => {
    const updateMap = new Map(items.map((i) => [String(i.pageId), i]));

    setPages((prev) =>
      prev.map((p) => {
        const upd = updateMap.get(String(p.id));
        if (!upd) return p;
        const targetSec = upd.sectionId
          ? sections.find((s) => s.id === upd.sectionId) || null
          : null;
        return {
          ...p,
          section: targetSec,
          section_id: upd.sectionId,
          sort_order: upd.sortOrder,
        } as any;
      })
    );

    try {
      const res = await fetch("/api/cms/navigation-menus/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      if (res.ok) {
        const updatedSections = await res.json();
        if (Array.isArray(updatedSections)) {
          setSections(updatedSections);
        }
      }
    } catch {
      // Keep optimistic state
    }
  };

  const handleToggleSectionVisibilityInternal = async (
    id: string,
    current: boolean
  ) => {
    if (onToggleSectionVisibility) {
      await onToggleSectionVisibility(id, current);
    } else {
      const target = sections.find((s) => s.id === id);
      if (target) {
        await fetch("/api/cms/sections", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: target.id,
            name: target.name,
            startPageId: target.start_page_id,
            sortOrder: target.sort_order,
            isVisible: !current,
          }),
        });
      }
    }
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, is_visible: !current } : s))
    );
  };

  const handleUploadMediaInternal = async (file: File) => {
    if (onUploadMedia) {
      await onUploadMedia(file);
    } else {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/cms/upload", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        setMedia((prev) => [
          {
            id: data.id || `m-${Date.now()}`,
            file_name: data.fileName || file.name,
            file_url: data.fileUrl,
            created_date: new Date(),
          },
          ...prev,
        ]);
      }
    }
  };

  const handleDeleteMediaInternal = async (id: string) => {
    if (onDeleteMedia) {
      await onDeleteMedia(id);
    } else {
      await fetch(`/api/cms/media/${id}`, { method: "DELETE" });
    }
    setMedia((prev) => prev.filter((m) => m.id !== id));
  };

  const handleSaveMailTemplateInternal = async (
    type: any,
    subject: string,
    body: string
  ) => {
    if (onSaveMailTemplate) {
      await onSaveMailTemplate(type, subject, body);
    } else {
      await fetch("/api/cms/mail-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateType: type, subject, body }),
      });
    }
    setMailTemplates((prev) => {
      const exists = prev.some((t) => t.template_type === type);
      if (exists) {
        return prev.map((t) =>
          t.template_type === type ? { ...t, subject, body } : t
        );
      }
      return [
        ...prev,
        { id: `mt-${Date.now()}`, template_type: type, subject, body },
      ];
    });
  };

  return (
    <AdminThemeProvider>
      <AdminLayout
        adminLanguage={adminLanguage}
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        adminName={adminName}
        frontendUrl={frontendUrl}
        isOverlay={isOverlay}
        onHideAdmin={onHideAdmin}
        onLogout={() => signOut({ callbackUrl: "/admin/login" })}
      >
        {currentTab === "dashboard" && (
          <DashboardView
            totalPages={pages.length}
            publishedPages={pages.filter((p) => p.status === "PUBLISHED").length}
            totalSections={sections.length}
            totalMedia={media.length}
            onNavigate={setCurrentTab}
          />
        )}

        {currentTab === "pages" && (
          <PagesView
            pages={pages}
            sections={sections}
            availableTemplates={availableTemplates}
            activeLanguages={activeLanguages}
            onEditPage={handleEditPage}
            onCreatePage={handleCreatePageInternal}
            onDeletePage={handleDeletePageInternal}
          />
        )}

        {currentTab === "page-editor" && editingPage && (
          <PageEditorView
            page={editingPage}
            existingPages={pages}
            sections={sections}
            categoryTypes={categoryTypes}
            bookingObjects={bookingObjects}
            activeLanguages={activeLanguages}
            adminLanguage={adminLanguage}
            availableTemplates={availableTemplates}
            onBack={() => setCurrentTab("pages")}
            onSave={handleSavePageInternal}
          />
        )}

        {currentTab === "sections" && (
          <SectionsView
            sections={sections}
            pages={pages}
            activeLanguages={activeLanguages}
            onSaveSection={handleSaveSectionInternal}
            onCreateSection={handleCreateSectionInternal}
            onDeleteSection={handleDeleteSectionInternal}
            onReorderSections={handleReorderSectionsInternal}
            onToggleVisibility={handleToggleSectionVisibilityInternal}
          />
        )}

        {currentTab === "media" && (
          <MediaView
            media={media}
            onUpload={handleUploadMediaInternal}
            onDelete={handleDeleteMediaInternal}
          />
        )}

        {currentTab === "mail-templates" && (
          <MailTemplatesView
            templates={mailTemplates}
            onSaveTemplate={handleSaveMailTemplateInternal}
          />
        )}

        {currentTab === "navigation-menus" && (
          <NavigationMenusView
            sections={sections}
            pages={pages}
            onNavigateToSections={() => setCurrentTab("sections")}
            onUpdateMenuItem={handleUpdateMenuItemInternal}
            onReorderMenuItems={handleReorderMenuItemsInternal}
          />
        )}

        {currentTab === "categories" && (
          <CategoriesView
            categoryTypes={categoryTypes}
            onSaveCategoryType={async (data) => {
              const res = await fetch("/api/cms/categories/types", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
              });
              if (res.ok) {
                const updated = await res.json();
                if (Array.isArray(updated)) {
                  setCategoryTypes(updated);
                  return updated;
                }
              }
            }}
            onDeleteCategoryType={async (id) => {
              const res = await fetch(`/api/cms/categories/types/${id}`, {
                method: "DELETE",
              });
              if (res.ok) {
                const updated = await res.json();
                if (Array.isArray(updated)) {
                  setCategoryTypes(updated);
                  return updated;
                }
              }
            }}
            onReorderCategoryTypes={async (orderedIds) => {
              const res = await fetch("/api/cms/categories/types/reorder", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderedIds }),
              });
              if (res.ok) {
                const updated = await res.json();
                if (Array.isArray(updated)) {
                  setCategoryTypes(updated);
                  return updated;
                }
              }
            }}
            onSaveCategory={async (data) => {
              const res = await fetch("/api/cms/categories/items", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
              });
              if (res.ok) {
                const updated = await res.json();
                if (Array.isArray(updated)) {
                  setCategoryTypes(updated);
                  return updated;
                }
              }
            }}
            onDeleteCategory={async (id) => {
              const res = await fetch(`/api/cms/categories/items/${id}`, {
                method: "DELETE",
              });
              if (res.ok) {
                const updated = await res.json();
                if (Array.isArray(updated)) {
                  setCategoryTypes(updated);
                  return updated;
                }
              }
            }}
            onReorderCategories={async (items) => {
              const res = await fetch("/api/cms/categories/items/reorder", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ items }),
              });
              if (res.ok) {
                const updated = await res.json();
                if (Array.isArray(updated)) {
                  setCategoryTypes(updated);
                  return updated;
                }
              }
            }}
          />
        )}

        {currentTab === "administrators" && (
          <AdministratorsView
            administrators={administrators}
            onSaveAdministrator={async (data) => {
              const res = await fetch("/api/cms/administrators", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
              });
              const payload = await res.json();
              if (!res.ok) {
                throw new Error(payload?.error || "Failed to save administrator");
              }
              if (Array.isArray(payload)) {
                setAdministrators(payload);
                return payload;
              }
            }}
            onDeleteAdministrator={async (id) => {
              const res = await fetch(`/api/cms/administrators/${id}`, {
                method: "DELETE",
              });
              const payload = await res.json();
              if (res.ok && Array.isArray(payload)) {
                setAdministrators(payload);
                return payload;
              }
            }}
          />
        )}

        {currentTab === "settings" && (
          <SettingsView
            activeLanguages={activeLanguages}
            adminLanguage={adminLanguage}
            onSaveSettings={async (newSettings) => {
              setActiveLanguages(newSettings.activeLanguages);
              if (newSettings.adminLanguage) {
                setAdminLanguage(newSettings.adminLanguage);
              }
              try {
                const res = await fetch("/api/cms/settings", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(newSettings),
                });
                if (res.ok) {
                  const saved = await res.json();
                  if (Array.isArray(saved.activeLanguages)) {
                    setActiveLanguages(saved.activeLanguages);
                  }
                  if (saved.adminLanguage === "sv" || saved.adminLanguage === "en") {
                    setAdminLanguage(saved.adminLanguage);
                  }
                }
              } catch {
                // Optimistic state kept
              }
            }}
          />
        )}

        {currentTab === "bookings-dashboard" && (
          <BookingsDashboardView />
        )}

        {currentTab === "bookings" && (
          <BookingsCalendarView objects={bookingObjects} />
        )}

        {currentTab === "objects" && (
          <BookingObjectsView
            objects={bookingObjects}
            landlords={landlords}
            pages={pages}
            amenities={amenities}
            onSaveObject={async (data) => {
              const res = await fetch("/api/cms/booking-objects", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
              });
              const payload = await res.json();
              if (!res.ok) {
                throw new Error(payload?.error || "Failed to save booking object");
              }
              if (Array.isArray(payload)) {
                setBookingObjects(payload);
                // Immediately refresh amenities so Connected Objects counts are live
                const amRes = await fetch("/api/cms/amenities", { cache: "no-store" });
                if (amRes.ok) {
                  const amData = await amRes.json();
                  if (Array.isArray(amData)) setAmenities(amData);
                }
                return payload;
              }
            }}
            onDeleteObject={async (id) => {
              const res = await fetch(`/api/cms/booking-objects/${id}`, {
                method: "DELETE",
              });
              const payload = await res.json();
              if (res.ok && Array.isArray(payload)) {
                setBookingObjects(payload);
                const amRes = await fetch("/api/cms/amenities", { cache: "no-store" });
                if (amRes.ok) {
                  const amData = await amRes.json();
                  if (Array.isArray(amData)) setAmenities(amData);
                }
                return payload;
              }
            }}
          />
        )}

        {currentTab === "object-prices" && (
          <ObjectPricesView objects={bookingObjects} />
        )}

        {currentTab === "landlords" && (
          <LandlordsView
            landlords={landlords}
            onSaveLandlord={async (data) => {
              const res = await fetch("/api/cms/landlords", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
              });
              const payload = await res.json();
              if (!res.ok) {
                throw new Error(payload?.error || "Failed to save landlord");
              }
              if (Array.isArray(payload)) {
                setLandlords(payload);
                return payload;
              }
            }}
            onDeleteLandlord={async (id) => {
              const res = await fetch(`/api/cms/landlords/${id}`, {
                method: "DELETE",
              });
              const payload = await res.json();
              if (res.ok && Array.isArray(payload)) {
                setLandlords(payload);
                return payload;
              }
            }}
          />
        )}

        {currentTab === "optionals" && (
          <OptionalsView
            optionals={optionals}
            objects={bookingObjects}
            media={media}
            onSaveOptional={async (data) => {
              const res = await fetch("/api/cms/optionals", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
              });
              const payload = await res.json();
              if (!res.ok) {
                throw new Error(payload?.error || "Failed to save optional");
              }
              if (Array.isArray(payload)) {
                setOptionals(payload);
                return payload;
              }
            }}
            onDeleteOptional={async (id) => {
              const res = await fetch(`/api/cms/optionals/${id}`, {
                method: "DELETE",
              });
              const payload = await res.json();
              if (res.ok && Array.isArray(payload)) {
                setOptionals(payload);
                return payload;
              }
            }}
          />
        )}

        {currentTab === "amenities" && (
          <AmenitiesView
            amenities={amenities}
            onSaveAmenity={async (data) => {
              const res = await fetch("/api/cms/amenities", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
              });
              const payload = await res.json();
              if (!res.ok) {
                throw new Error(payload?.error || "Failed to save amenity");
              }
              if (Array.isArray(payload)) {
                setAmenities(payload);
                const objRes = await fetch("/api/cms/booking-objects", { cache: "no-store" });
                if (objRes.ok) {
                  const objData = await objRes.json();
                  if (Array.isArray(objData)) setBookingObjects(objData);
                }
                return payload;
              }
            }}
            onDeleteAmenity={async (id) => {
              const res = await fetch(`/api/cms/amenities/${id}`, {
                method: "DELETE",
              });
              const payload = await res.json();
              if (!res.ok) {
                throw new Error(payload?.error || "Failed to delete amenity");
              }
              if (Array.isArray(payload)) {
                setAmenities(payload);
                const objRes = await fetch("/api/cms/booking-objects", { cache: "no-store" });
                if (objRes.ok) {
                  const objData = await objRes.json();
                  if (Array.isArray(objData)) setBookingObjects(objData);
                }
                return payload;
              }
            }}
            onReorderAmenities={async (orderedIds) => {
              const res = await fetch("/api/cms/amenities/reorder", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderedIds }),
              });
              const payload = await res.json();
              if (!res.ok) {
                throw new Error(payload?.error || "Failed to reorder amenities");
              }
              if (Array.isArray(payload)) {
                setAmenities(payload);
                const objRes = await fetch("/api/cms/booking-objects", { cache: "no-store" });
                if (objRes.ok) {
                  const objData = await objRes.json();
                  if (Array.isArray(objData)) setBookingObjects(objData);
                }
                return payload;
              }
            }}
          />
        )}
      </AdminLayout>
    </AdminThemeProvider>
  );
}
