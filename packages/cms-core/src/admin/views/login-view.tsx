"use client";

import React, { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Lock, Mail, Loader2 } from "lucide-react";
import {
  Alert,
  Button,
  Card,
  CmsBrandLogo,
  FlagIcon,
  FormField,
  Input,
  SegmentedControl,
} from "@cms/components/ui";
import { AdminIntlProvider, useAdminIntl } from "@cms/i18n";

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
        <Card variant="admin" className="w-full max-w-sm p-8 shadow-2xl text-center space-y-4">
          <CmsBrandLogo variant="dark" heightClassName="h-9" />
          <Loader2 className="w-6 h-6 animate-spin text-sky-400 mx-auto" />
          <p className="text-xs text-slate-300">
            {t("alreadyLoggedIn")}
          </p>
        </Card>
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
      <Card variant="admin" className="w-full max-w-sm p-8 shadow-2xl relative">
        {/* Language switcher */}
        <div className="flex justify-end mb-4">
          <SegmentedControl
            size="sm"
            aria-label={locale === "sv" ? "Välj språk" : "Select language"}
            disabled={isLocalePending}
            value={locale}
            onChange={(val) => setLocale(val as "sv" | "en")}
            options={[
              {
                value: "en",
                label: "EN",
                icon: <FlagIcon code="en" size="xs" />,
              },
              {
                value: "sv",
                label: "SV",
                icon: <FlagIcon code="sv" size="xs" />,
              },
            ]}
          />
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
          <Alert variant="destructive" className="mb-4">
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label={t("email")} labelVariant="admin">
            {(control) => (
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                <Input
                  {...control}
                  type="email"
                  variant="admin"
                  size="default"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className="pl-10 text-xs"
                />
              </div>
            )}
          </FormField>

          <FormField label={t("password")} labelVariant="admin">
            {(control) => (
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                <Input
                  {...control}
                  type="password"
                  variant="admin"
                  size="default"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-10 text-xs"
                />
              </div>
            )}
          </FormField>

          <Button
            type="submit"
            variant="adminPrimary"
            size="default"
            disabled={isLoading}
            className="w-full mt-2"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <span>{t("signIn")}</span>
            )}
          </Button>
        </form>
      </Card>
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
