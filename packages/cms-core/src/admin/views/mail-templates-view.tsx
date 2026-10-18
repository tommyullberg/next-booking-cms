"use client";

import React, { useState } from "react";
import { Mail, HelpCircle, Copy, Check, Save, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { MAIL_PLACEHOLDERS } from "../../mail/types";

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

export function MailTemplatesView({ templates, onSaveTemplate }: MailTemplatesViewProps) {
  const [showHelp, setShowHelp] = useState(true);
  const [copiedTag, setCopiedTag] = useState<string | null>(null);
  const [savingType, setSavingType] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const templateConfigs = [
    {
      type: "ADMIN_NEW_BOOKING_REQUEST" as const,
      title: "Ny bokningsförfrågan (till administratör)",
      description: "Skickas automatiskt till admin när en kund skickar en ny bokningsförfrågan via webbplatsen.",
      defaultSubject: "Ny bokningsförfrågan mottagen - {{object_name}}",
      defaultBody:
        "<h1>Ny bokningsförfrågan mottagen</h1>\n<p><strong>Gäst:</strong> {{customer_name}} ({{customer_email}}, {{customer_phone}})</p>\n<p><strong>Period:</strong> {{start_date}} till {{end_date}}</p>\n<p><strong>Gäster:</strong> {{guests_count}} vuxna, {{pets_count}} husdjur</p>\n<p><a href='{{deeplink}}'>Klicka här för att hantera bokningen i admin</a></p>",
    },
    {
      type: "USER_NEW_BOOKING_REQUEST_COPY" as const,
      title: "Bekräftelse på mottagen förfrågan (till gäst)",
      description: "Skickas som kopia till gästen med information om att förfrågan behandlas.",
      defaultSubject: "Tack för din bokningsförfrågan för {{object_name}}",
      defaultBody:
        "<h1>Tack för din bokningsförfrågan, {{customer_name}}!</h1>\n<p>Vi har tagit emot din förfrågan för <strong>{{object_name}}</strong> mellan <strong>{{start_date}}</strong> och <strong>{{end_date}}</strong>.</p>\n<p>Vi återkommer så snart vi har granskat tillgängligheten.</p>",
    },
    {
      type: "USER_BOOKING_CONFIRMED" as const,
      title: "Bokningsbekräftelse (till gäst)",
      description: "Skickas till gästen när administratören godkänner bokningsförfrågan.",
      defaultSubject: "Bokningsbekräftelse för {{object_name}}",
      defaultBody:
        "<h1>Din bokning är bekräftad!</h1>\n<p>Hej {{customer_name}},</p>\n<p>Din bokning av <strong>{{object_name}}</strong> är nu godkänd för perioden <strong>{{start_date}}</strong> till <strong>{{end_date}}</strong>.</p>\n<p><strong>Totalpris:</strong> {{price}}</p>\n<p>Varmt välkommen till oss!</p>",
    },
  ];

  const [formState, setFormState] = useState<
    Record<string, { subject: string; body: string }>
  >(() => {
    const initial: Record<string, { subject: string; body: string }> = {};
    for (const c of templateConfigs) {
      const existing = templates.find((t) => t.template_type === c.type);
      initial[c.type] = {
        subject: existing?.subject || c.defaultSubject,
        body: existing?.body || c.defaultBody,
      };
    }
    return initial;
  });

  const handleCopyTag = (tag: string) => {
    navigator.clipboard.writeText(tag);
    setCopiedTag(tag);
    setTimeout(() => setCopiedTag(null), 2000);
  };

  const handleSave = async (type: "ADMIN_NEW_BOOKING_REQUEST" | "USER_NEW_BOOKING_REQUEST_COPY" | "USER_BOOKING_CONFIRMED") => {
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
          <h1 className="text-2xl font-bold tracking-tight text-white">E-postmallar</h1>
          <p className="mt-1 text-sm text-slate-400">
            Konfigurera automatiska e-postmeddelanden för bokningsförfrågningar och bekräftelser.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowHelp((prev) => !prev)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition ${
            showHelp
              ? "bg-sky-500/10 border-sky-500/30 text-sky-400 shadow-sm"
              : "border-slate-800 bg-slate-900 text-slate-400 hover:text-white"
          }`}
          title="Visa dynamiska platshållartaggar"
        >
          <HelpCircle className="w-4 h-4 text-sky-400" />
          <span>Platshållare</span>
          {showHelp ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Persistent expandable help section */}
      {showHelp && (
        <div className="rounded-2xl border border-sky-500/20 bg-sky-950/20 p-5 text-white backdrop-blur">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded bg-sky-500/20 text-sky-400">
                <HelpCircle className="w-4 h-4" />
              </span>
              <h2 className="text-xs font-bold uppercase tracking-wider text-sky-300">
                Dynamiska platshållare (klicka för att kopiera)
              </h2>
            </div>
            <span className="text-[11px] text-slate-400">
              Dessa taggar ersätts automatiskt med data vid utskick.
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {MAIL_PLACEHOLDERS.map((p) => {
              const isCopied = copiedTag === p.tag;
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
                  title={`${p.label} (exempel: ${p.example})`}
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

      {/* Templates List */}
      <div className="space-y-6">
        {templateConfigs.map((cfg) => {
          const state = formState[cfg.type];
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
                  <span>{isSuccess ? "Sparat!" : "Spara mall"}</span>
                </button>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Ämnesrad (Subject)
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
                  Meddelandetext (HTML & Text)
                </label>
                <textarea
                  rows={6}
                  value={state.body}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      [cfg.type]: { ...state, body: e.target.value },
                    }))
                  }
                  className="w-full font-mono rounded-xl border border-slate-700 bg-slate-950 p-3 text-xs text-slate-200 focus:outline-none focus:border-sky-500 leading-relaxed"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
