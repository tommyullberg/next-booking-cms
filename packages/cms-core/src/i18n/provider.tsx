"use client";

import React, { createContext, useContext, useState, useEffect, useTransition } from "react";
import { NextIntlClientProvider } from "next-intl";
import { useRouter } from "next/navigation";
import { AdminLocale, AdminMessages } from "./types";
import { getAdminMessages } from "./get-messages";
import { useEditorStore } from "@cms/state/editor-store";

interface AdminIntlContextValue {
  locale: AdminLocale;
  setLocale: (newLocale: AdminLocale) => Promise<void>;
  isPending: boolean;
}

const AdminIntlContext = createContext<AdminIntlContextValue | null>(null);

export function useAdminIntl(): AdminIntlContextValue {
  const ctx = useContext(AdminIntlContext);
  if (!ctx) {
    throw new Error("useAdminIntl must be used within an AdminIntlProvider");
  }
  return ctx;
}

export interface AdminIntlProviderProps {
  initialLocale?: string | null;
  initialMessages?: AdminMessages;
  onLocaleChange?: (locale: AdminLocale) => void;
  children: React.ReactNode;
}

export function AdminIntlProvider({
  initialLocale,
  initialMessages,
  onLocaleChange,
  children,
}: AdminIntlProviderProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [currentLocale, setCurrentLocale] = useState<AdminLocale>(() => {
    if (initialLocale === "sv" || initialLocale === "en") return initialLocale;
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("cms_admin_locale");
      if (stored === "sv" || stored === "en") return stored as AdminLocale;
      const match = document.cookie.match(/(?:^|;\s*)cms_admin_locale=(sv|en)(?:;|$)/);
      if (match && (match[1] === "sv" || match[1] === "en")) return match[1] as AdminLocale;
    }
    return "en";
  });
  const [messages, setMessages] = useState<AdminMessages>(() => {
    if (initialMessages && initialLocale === currentLocale) return initialMessages;
    return getAdminMessages(currentLocale);
  });

  useEffect(() => {
    if ((initialLocale === "sv" || initialLocale === "en") && initialLocale !== currentLocale) {
      setCurrentLocale(initialLocale);
      setMessages(getAdminMessages(initialLocale));
      if (typeof window !== "undefined") {
        localStorage.setItem("cms_admin_locale", initialLocale);
        document.cookie = `cms_admin_locale=${initialLocale}; path=/; max-age=31536000; SameSite=Lax`;
      }
    }
  }, [initialLocale]);

  const handleSetLocale = async (newLocale: AdminLocale) => {
    if (newLocale === currentLocale) return;

    // Optimistically update client translations immediately
    setCurrentLocale(newLocale);
    setMessages(getAdminMessages(newLocale));

    if (typeof window !== "undefined") {
      localStorage.setItem("cms_admin_locale", newLocale);
      document.cookie = `cms_admin_locale=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
    }

    onLocaleChange?.(newLocale);

    try {
      useEditorStore.getState().setAdminLanguage(newLocale);
    } catch {
      // Editor store might not be available in standalone context
    }

    // Persist to database profile via API
    try {
      await fetch("/api/cms/administrators/locale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale: newLocale }),
      });
    } catch (err) {
      console.error("[cms-core] Failed to persist administrator locale:", err);
    }

    // Refresh server components
    startTransition(() => {
      try {
        router.refresh();
      } catch {
        // Router may not be available in isolated test environments
      }
    });
  };

  return (
    <AdminIntlContext.Provider
      value={{
        locale: currentLocale,
        setLocale: handleSetLocale,
        isPending,
      }}
    >
      <NextIntlClientProvider locale={currentLocale} messages={messages}>
        {children}
      </NextIntlClientProvider>
    </AdminIntlContext.Provider>
  );
}

