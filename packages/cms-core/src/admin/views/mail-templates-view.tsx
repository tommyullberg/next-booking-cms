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
      title: "New Booking Request (Admin Notification)",
      description: "Automatically dispatched to administrators when a guest submits a new booking request.",
      defaultSubject: "New booking request received - {{object_name}}",
      defaultBody:
        "<h1>New booking request received</h1>\n<p><strong>Guest:</strong> {{customer_name}} ({{customer_email}}, {{customer_phone}})</p>\n<p><strong>Dates:</strong> {{start_date}} to {{end_date}}</p>\n<p><strong>Guests:</strong> {{guests_count}} adults, {{pets_count}} pets</p>\n<p><a href='{{deeplink}}'>Click here to review and manage this booking in Admin</a></p>",
    },
    {
      type: "USER_NEW_BOOKING_REQUEST_COPY" as const,
      title: "Booking Request Received Copy (Guest)",
      description: "Sent as a confirmation receipt to the guest while their request is pending review.",
      defaultSubject: "Thank you for your booking request for {{object_name}}",
      defaultBody:
        "<h1>Thank you for your booking request, {{customer_name}}!</h1>\n<p>We have received your request for <strong>{{object_name}}</strong> from <strong>{{start_date}}</strong> to <strong>{{end_date}}</strong>.</p>\n<p>We will get back to you shortly once we have reviewed availability.</p>",
    },
    {
      type: "USER_BOOKING_CONFIRMED" as const,
      title: "Booking Confirmed (Guest)",
      description: "Dispatched to the guest when an administrator approves the booking request.",
      defaultSubject: "Booking Confirmation for {{object_name}}",
      defaultBody:
        "<h1>Your booking is confirmed!</h1>\n<p>Hello {{customer_name}},</p>\n<p>Your reservation for <strong>{{object_name}}</strong> is now confirmed for <strong>{{start_date}}</strong> to <strong>{{end_date}}</strong>.</p>\n<p><strong>Total Price:</strong> {{price}}</p>\n<p>We look forward to welcoming you!</p>",
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
          <h1 className="text-2xl font-bold tracking-tight text-white">Mail Templates</h1>
          <p className="mt-1 text-xs text-slate-400">
            Configure automated transactional email templates for booking requests and confirmations.
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
          title="Toggle dynamic placeholder tags"
        >
          <HelpCircle className="w-4 h-4 text-sky-400" />
          <span>Placeholders</span>
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
                Dynamic Placeholders (Click to copy)
              </h2>
            </div>
            <span className="text-[11px] text-slate-400">
              Replaced automatically with live booking values on dispatch.
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
                  title={`${p.label} (e.g. ${p.example})`}
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
                  <span>{isSuccess ? "Saved!" : "Save Template"}</span>
                </button>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Subject Line
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
                  Message Body (HTML & Text)
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
