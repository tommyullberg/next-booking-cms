"use client";

import React, { useState } from "react";
import { signOut } from "next-auth/react";
import { AdminThemeProvider } from "./theme-context";
import { AdminLayout, AdminTab } from "./admin-layout";
import { DashboardView } from "./views/dashboard-view";
import { PagesView, PageListItem } from "./views/pages-view";
import { PageEditorView, PageEditorData } from "./views/page-editor-view";
import { SectionsView, SectionItem } from "./views/sections-view";
import { MediaView, MediaItem } from "./views/media-view";
import { MailTemplatesView, MailTemplateItem } from "./views/mail-templates-view";

export interface AdminAppProps {
  initialPages?: PageListItem[];
  initialSections?: SectionItem[];
  initialMedia?: MediaItem[];
  initialMailTemplates?: MailTemplateItem[];
  adminName?: string;
  frontendUrl?: string;
  onSavePage?: (data: any) => Promise<void>;
  onCreatePage?: (data: any) => Promise<void>;
  onDeletePage?: (id: string) => Promise<void>;
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
  initialMedia = [],
  initialMailTemplates = [],
  adminName = "Administratör",
  frontendUrl = "/",
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
  const [media, setMedia] = useState<MediaItem[]>(initialMedia);
  const [mailTemplates, setMailTemplates] = useState<MailTemplateItem[]>(initialMailTemplates);
  const [editingPage, setEditingPage] = useState<PageEditorData | null>(null);

  const handleEditPage = async (pageId: string) => {
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
    const found = pages.find((p) => p.id === pageId);
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
    if (onSavePage) {
      await onSavePage(data);
    } else {
      await fetch(`/api/cms/pages/${data.id || ""}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    }

    setPages((prev) =>
      prev.map((p) =>
        p.id === data.id
          ? {
              ...p,
              page_title: data.pageTitle,
              slug: data.slug,
              status: data.status,
            }
          : p
      )
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
        setPages((prev) => [created, ...prev]);
        return;
      }
    }
    setPages((prev) => [
      {
        id: `p-${Date.now()}`,
        page_title: data.pageTitle,
        slug: data.slug,
        template_name: data.templateName,
        status: "NEW",
        created_date: new Date(),
        section: sections.find((s) => s.id === data.sectionId) || null,
      },
      ...prev,
    ]);
  };

  const handleDeletePageInternal = async (pageId: string) => {
    if (onDeletePage) {
      await onDeletePage(pageId);
    } else {
      await fetch(`/api/cms/pages/${pageId}`, { method: "DELETE" });
    }
    setPages((prev) => prev.filter((p) => p.id !== pageId));
  };

  const handleCreateSectionInternal = async (data: any) => {
    if (onCreateSection) {
      await onCreateSection(data);
    } else {
      const res = await fetch("/api/cms/sections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const created = await res.json();
        setSections((prev) => [...prev, created]);
        return;
      }
    }
    setSections((prev) => [
      ...prev,
      {
        id: `sec-${Date.now()}`,
        name: data.name,
        sort_order: data.sortOrder,
        is_visible: data.isVisible,
      },
    ]);
  };

  const handleDeleteSectionInternal = async (id: string) => {
    if (onDeleteSection) {
      await onDeleteSection(id);
    } else {
      await fetch(`/api/cms/sections/${id}`, { method: "DELETE" });
    }
    setSections((prev) => prev.filter((s) => s.id !== id));
  };

  const handleToggleSectionVisibilityInternal = async (
    id: string,
    current: boolean
  ) => {
    if (onToggleSectionVisibility) {
      await onToggleSectionVisibility(id, current);
    } else {
      await fetch(`/api/cms/sections/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isVisible: !current }),
      });
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
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        adminName={adminName}
        frontendUrl={frontendUrl}
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
            onEditPage={handleEditPage}
            onCreatePage={handleCreatePageInternal}
            onDeletePage={handleDeletePageInternal}
          />
        )}

        {currentTab === "page-editor" && editingPage && (
          <PageEditorView
            page={editingPage}
            onBack={() => setCurrentTab("pages")}
            onSave={handleSavePageInternal}
          />
        )}

        {currentTab === "sections" && (
          <SectionsView
            sections={sections}
            onCreateSection={handleCreateSectionInternal}
            onDeleteSection={handleDeleteSectionInternal}
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

        {currentTab === "bookings" && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-8 text-center text-slate-400">
            <h2 className="text-lg font-semibold text-white mb-2">
              Bokningar & Kalender
            </h2>
            <p className="text-xs">
              Bokningskalendern synkroniseras via TanStack Query och iCal-flöden.
            </p>
          </div>
        )}

        {currentTab === "objects" && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-8 text-center text-slate-400">
            <h2 className="text-lg font-semibold text-white mb-2">Boendeobjekt</h2>
            <p className="text-xs">
              Boendeobjekt och prislistor kopplas direkt mot bokningsmotorn.
            </p>
          </div>
        )}
      </AdminLayout>
    </AdminThemeProvider>
  );
}
