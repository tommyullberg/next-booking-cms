"use client";

import React, { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Lock, Mail, Loader2 } from "lucide-react";
import { CmsBrandLogo } from "../../components/ui/cms-brand-logo";
import { FlagIcon } from "../../components/ui/flag-icon";
import { AdminIntlProvider, useAdminIntl } from "../../i18n";

export interface LoginViewProps {
  callbackUrl?: string;
}

function LoginContent({ callbackUrl = "/admin" }: LoginViewProps) {
  const t = useTranslations("login");
  const { locale, setLocale, isPending: isLocalePending } = useAdminIntl();
  const { status } = useSession();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "authenticated") {
      window.location.href = callbackUrl;
    }
  }, [status, callbackUrl]);

  if (status === "authenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
        <div className="w-full max-w-sm rounded-3xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl backdrop-blur text-center space-y-4">
          <CmsBrandLogo variant="dark" heightClassName="h-9" />
          <Loader2 className="w-6 h-6 animate-spin text-sky-400 mx-auto" />
          <p className="text-xs text-slate-300">
            {t("alreadyLoggedIn")}
          </p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
        callbackUrl,
      });

      if (result?.error) {
        setError(t("invalidCredentials"));
      } else if (result?.ok) {
        window.location.href = callbackUrl;
      }
    } catch {
      setError(t("unexpectedError"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      <div className="w-full max-w-sm rounded-3xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl backdrop-blur relative">
        {/* Language switcher */}
        <div className="flex justify-end mb-4">
          <div className="flex items-center gap-0.5 rounded-xl border border-slate-800 bg-slate-950/80 p-0.5 text-xs">
            <button
              type="button"
              disabled={isLocalePending}
              onClick={() => setLocale("en")}
              title="English"
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                locale === "en"
                  ? "bg-sky-600 text-white shadow-sm font-semibold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <FlagIcon code="en" size="xs" />
              <span>EN</span>
            </button>
            <button
              type="button"
              disabled={isLocalePending}
              onClick={() => setLocale("sv")}
              title="Svenska"
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                locale === "sv"
                  ? "bg-sky-600 text-white shadow-sm font-semibold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <FlagIcon code="sv" size="xs" />
              <span>SV</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col items-center text-center mb-8">
          <div className="mb-3">
            <CmsBrandLogo variant="dark" heightClassName="h-9" />
          </div>
          <p className="mt-1 text-xs text-slate-400">
            {t("title")}
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              {t("email")}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                className="w-full rounded-xl border border-slate-800 bg-slate-950 pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              {t("password")}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-800 bg-slate-950 pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-sky-600 py-2.5 text-xs font-semibold text-white shadow-lg shadow-sky-600/20 hover:bg-sky-500 transition disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <span>{t("signIn")}</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export function LoginView({ callbackUrl = "/admin" }: LoginViewProps) {
  return (
    <AdminIntlProvider>
      <LoginContent callbackUrl={callbackUrl} />
    </AdminIntlProvider>
  );
}
