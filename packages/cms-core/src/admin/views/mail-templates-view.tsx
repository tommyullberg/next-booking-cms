"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Mail, HelpCircle, Copy, Check, Save, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { MAIL_PLACEHOLDERS } from "../../mail/types";
import { useAdminIntl } from "../../i18n";
import { getDefaultMailTemplate, DEFAULT_MAIL_TEMPLATES_EN, DEFAULT_MAIL_TEMPLATES_SV } from "../../constants/mail-templates";

export interface MailTemplateItem {
  id: string;
  template_type: "ADMIN_NEW_BOOKING_REQUEST" | "USER_NEW_BOOKING_REQUEST_COPY" | "USER_BOOKING_CONFIRMED";
  subject: string;
  body: string;
}

export interface MailTemplatesViewProps {
  templates: MailTemplateItem[];
  onSaveTemplate: (
    type: "ADMIN_NEW_BOOKING_REQUEST" | "USER_NEW_BOOKING_REQUEST_COPY" | "USER_BOOKING_CONFIRMED",
    subject: string,
    body: string
  ) => Promise<void>;
}

function cleanLegacyHtml(html?: string): string {
  if (!html) return "";
  // If it contains legacy HTML boilerplate like <h1> or <p>, convert to clean Markdown
  if (/<(h[1-6]|p|strong|a)[\s>]/i.test(html)) {
    return html
      .replace(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi, "# $1\n\n")
      .replace(/<p[^>]*><strong[^>]*>(.*?):?<\/strong>\s*(.*?)<\/p>/gi, "$1: $2\n")
      .replace(/<p[^>]*><a\s+href=['"](.*?)['"][^>]*>(.*?)<\/a><\/p>/gi, "[$2]($1)\n")
      .replace(/<p[^>]*>(.*?)<\/p>/gi, "$1\n\n")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/?(strong|b)>/gi, "**")
      .replace(/<[^>]+>/g, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }
  return html;
}

export function MailTemplatesView({ templates = [], onSaveTemplate }: MailTemplatesViewProps) {
  const t = useTranslations("mailTemplates");
  const tCommon = useTranslations("common");
  const { locale } = useAdminIntl();

  const [showHelp, setShowHelp] = useState(true);
  const [copiedTag, setCopiedTag] = useState<string | null>(null);
  const [savingType, setSavingType] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const templateConfigs = useMemo(
    () => [
      {
        type: "ADMIN_NEW_BOOKING_REQUEST" as const,
        title: t("adminNewBookingTitle"),
        description: t("adminNewBookingDesc"),
        defaultSubject: getDefaultMailTemplate("ADMIN_NEW_BOOKING_REQUEST", locale).subject,
        defaultBody: getDefaultMailTemplate("ADMIN_NEW_BOOKING_REQUEST", locale).body,
      },
      {
        type: "USER_NEW_BOOKING_REQUEST_COPY" as const,
        title: t("userNewBookingTitle"),
        description: t("userNewBookingDesc"),
        defaultSubject: getDefaultMailTemplate("USER_NEW_BOOKING_REQUEST_COPY", locale).subject,
        defaultBody: getDefaultMailTemplate("USER_NEW_BOOKING_REQUEST_COPY", locale).body,
      },
      {
        type: "USER_BOOKING_CONFIRMED" as const,
        title: t("userConfirmedTitle"),
        description: t("userConfirmedDesc"),
        defaultSubject: getDefaultMailTemplate("USER_BOOKING_CONFIRMED", locale).subject,
        defaultBody: getDefaultMailTemplate("USER_BOOKING_CONFIRMED", locale).body,
      },
    ],
    [t, locale]
  );

  const isDefaultTemplate = (type: any, subject?: string, body?: string) => {
    if (!subject) return true;
    const sv = DEFAULT_MAIL_TEMPLATES_SV[type as keyof typeof DEFAULT_MAIL_TEMPLATES_SV];
    const en = DEFAULT_MAIL_TEMPLATES_EN[type as keyof typeof DEFAULT_MAIL_TEMPLATES_EN];
    const cleanBody = cleanLegacyHtml(body);
    const isSubjectDefault = subject === sv?.subject || subject === en?.subject;
    const isBodyDefault = !body || cleanBody === sv?.body || cleanBody === en?.body;
    return isSubjectDefault && isBodyDefault;
  };

  const [formState, setFormState] = useState<Record<string, { subject: string; body: string }>>(() => {
    const initial: Record<string, { subject: string; body: string }> = {};
    for (const c of templateConfigs) {
      const existing = templates.find((t) => t.template_type === c.type);
      if (!existing || isDefaultTemplate(c.type, existing.subject, existing.body)) {
        initial[c.type] = {
          subject: c.defaultSubject,
          body: c.defaultBody,
        };
      } else {
        initial[c.type] = {
          subject: existing.subject,
          body: cleanLegacyHtml(existing.body),
        };
      }
    }
    return initial;
  });

  // Keep formState in sync when switching language if templates were not customized in DB
  useEffect(() => {
    setFormState((prev) => {
      const updated = { ...prev };
      for (const c of templateConfigs) {
        const existing = templates.find((item) => item.template_type === c.type);
        if (!existing || isDefaultTemplate(c.type, existing.subject, existing.body)) {
          updated[c.type] = {
            subject: c.defaultSubject,
            body: c.defaultBody,
          };
        } else {
          updated[c.type] = {
            subject: existing.subject,
            body: cleanLegacyHtml(existing.body),
          };
        }
      }
      return updated;
    });
  }, [locale, templates, templateConfigs]);

  const handleCopyTag = (tag: string) => {
    navigator.clipboard.writeText(tag);
    setCopiedTag(tag);
    setTimeout(() => setCopiedTag(null), 2000);
  };

  const handleSave = async (
    type: "ADMIN_NEW_BOOKING_REQUEST" | "USER_NEW_BOOKING_REQUEST_COPY" | "USER_BOOKING_CONFIRMED"
  ) => {
    setSavingType(type);
    setSaveSuccess(null);
    try {
      const data = formState[type];
      await onSaveTemplate(type, data.subject, data.body);
      setSaveSuccess(type);
      setTimeout(() => setSaveSuccess(null), 3000);
    } finally {
      setSavingType(null);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">{t("title")}</h1>
          <p className="mt-1 text-xs text-slate-400">{t("subtitle")}</p>
        </div>

        <button
          type="button"
          onClick={() => setShowHelp((prev) => !prev)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition ${
            showHelp
              ? "bg-sky-500/10 border-sky-500/30 text-sky-400 shadow-sm"
              : "border-slate-800 bg-slate-900 text-slate-400 hover:text-white"
          }`}
          title="Toggle dynamic placeholder tags"
        >
          <HelpCircle className="w-4 h-4 text-sky-400" />
          <span>{t("placeholdersBtn")}</span>
          {showHelp ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {showHelp && (
        <div className="rounded-2xl border border-sky-500/20 bg-sky-950/20 p-5 text-white backdrop-blur">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded bg-sky-500/20 text-sky-400">
                <HelpCircle className="w-4 h-4" />
              </span>
              <h2 className="text-xs font-bold uppercase tracking-wider text-sky-300">
                {t("dynamicPlaceholdersTitle")}
              </h2>
            </div>
            <span className="text-[11px] text-slate-400">
              {t("dynamicPlaceholdersDesc")}
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {MAIL_PLACEHOLDERS.map((p) => {
              const isCopied = copiedTag === p.tag;
              const tooltipLabel = locale === "sv" ? p.label : p.tag.replace(/[{}]/g, "").replace(/_/g, " ");
              const examplePrefix = locale === "sv" ? "t.ex." : "e.g.";

              return (
                <button
                  key={p.tag}
                  type="button"
                  onClick={() => handleCopyTag(p.tag)}
                  className={`group flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-mono transition ${
                    isCopied
                      ? "border-emerald-500 bg-emerald-950/40 text-emerald-300"
                      : "border-slate-700 bg-slate-900/80 text-sky-300 hover:border-sky-500 hover:bg-slate-800"
                  }`}
                  title={`${tooltipLabel} (${examplePrefix} ${p.example})`}
                >
                  <span>{p.tag}</span>
                  {isCopied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3 h-3 text-slate-500 opacity-60 group-hover:opacity-100" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="space-y-6">
        {templateConfigs.map((cfg) => {
          const state = formState[cfg.type] || { subject: cfg.defaultSubject, body: cfg.defaultBody };
          const isSaving = savingType === cfg.type;
          const isSuccess = saveSuccess === cfg.type;

          return (
            <div
              key={cfg.type}
              className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-slate-800 text-sky-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-white">{cfg.title}</h2>
                    <p className="text-xs text-slate-400">{cfg.description}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleSave(cfg.type)}
                  disabled={isSaving}
                  className="flex items-center gap-1.5 rounded-xl bg-sky-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-sky-600/20 hover:bg-sky-500 transition disabled:opacity-50"
                >
                  {isSaving ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : isSuccess ? (
                    <Check className="w-3.5 h-3.5 text-emerald-300" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  <span>{isSuccess ? tCommon("saved") : t("saveTemplate")}</span>
                </button>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  {t("subject")}
                </label>
                <input
                  type="text"
                  value={state.subject}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      [cfg.type]: { ...state, subject: e.target.value },
                    }))
                  }
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  {t("body")}
                </label>
                <textarea
                  rows={7}
                  value={state.body}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      [cfg.type]: { ...state, body: e.target.value },
                    }))
                  }
                  className="w-full font-sans rounded-xl border border-slate-700 bg-slate-950 p-3 text-xs text-slate-200 focus:outline-none focus:border-sky-500 leading-relaxed"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

