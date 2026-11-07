"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import {
  Plus,
  Shield,
  ShieldCheck,
  Lock,
  Mail,
  Phone,
  Trash2,
  Edit3,
  Loader2,
  UserCheck,
} from "lucide-react";
import {
  Alert,
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  FormField,
  Input,
  Label,
} from "@cms/components/ui";
import { useConfirm } from "../../components/confirm";

export interface AdministratorItem {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  mobile?: string | null;
  role: "SUPERADMIN" | "ADMIN" | "EDITOR" | string;
  created_at?: string | Date;
}

export interface AdministratorsViewProps {
  administrators: AdministratorItem[];
  onSaveAdministrator?: (data: {
    id?: string;
    first_name: string;
    last_name: string;
    email: string;
    mobile?: string;
    password?: string;
  }) => Promise<AdministratorItem[] | void>;
  onDeleteAdministrator?: (id: string) => Promise<AdministratorItem[] | void>;
}

const DEFAULT_SUPERADMIN_FALLBACK: AdministratorItem = {
  id: "default-superadmin",
  first_name: "Super",
  last_name: "Admin",
  email: "admin@nextbooking.local",
  mobile: null,
  role: "SUPERADMIN",
};

export function AdministratorsView({
  administrators: initialAdmins,
  onSaveAdministrator,
  onDeleteAdministrator,
}: AdministratorsViewProps) {
  const t = useTranslations("administrators");
  const tCommon = useTranslations("common");
  const { confirm } = useConfirm();

  const [admins, setAdmins] = useState<AdministratorItem[]>(initialAdmins);

  useEffect(() => {
    setAdmins(initialAdmins);
  }, [initialAdmins]);

  // Ensure default SuperAdmin is always visible at the top and locked
  const normalizedAdmins: AdministratorItem[] = useMemo(() => {
    const hasSuper = admins.some((a) => a.role === "SUPERADMIN");
    const list = hasSuper ? [...admins] : [DEFAULT_SUPERADMIN_FALLBACK, ...admins];
    return list.sort((a, b) => {
      const aSuper = a.role === "SUPERADMIN" ? 0 : 1;
      const bSuper = b.role === "SUPERADMIN" ? 0 : 1;
      return aSuper - bSuper;
    });
  }, [admins]);

  // Modal state for adding or editing an Administrator
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdministratorItem | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const openCreateModal = () => {
    setEditingAdmin(null);
    setFirstName("");
    setLastName("");
    setEmail("");
    setMobile("");
    setPassword("");
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const openEditModal = (admin: AdministratorItem) => {
    if (admin.role === "SUPERADMIN") return;
    setEditingAdmin(admin);
    setFirstName(admin.first_name);
    setLastName(admin.last_name);
    setEmail(admin.email);
    setMobile(admin.mobile || "");
    setPassword("");
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      setErrorMsg(t("namesRequired"));
      return;
    }

    if (!editingAdmin && password.trim().length < 6) {
      setErrorMsg(t("passwordMin"));
      return;
    }

    setIsSaving(true);
    try {
      if (onSaveAdministrator) {
        const res = await onSaveAdministrator({
          ...(editingAdmin ? { id: editingAdmin.id } : {}),
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          email: email.trim(),
          mobile: mobile.trim() || undefined,
          ...(password.trim() ? { password: password.trim() } : {}),
        });
        if (Array.isArray(res)) {
          setAdmins(res);
        }
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setErrorMsg(err?.message || t("saveError"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (admin: AdministratorItem) => {
    if (admin.role === "SUPERADMIN") return;
    await confirm({
      title: tCommon("delete"),
      description: t("deleteConfirm", {
        name: `${admin.first_name} ${admin.last_name}`,
        email: admin.email,
      }),
      variant: "destructive",
      onConfirm: async () => {
        if (onDeleteAdministrator) {
          const res = await onDeleteAdministrator(admin.id);
          if (Array.isArray(res)) {
            setAdmins(res);
            return;
          }
        }
        setAdmins((prev) => prev.filter((a) => a.id !== admin.id));
      },
    });
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            {t("title")}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {t("subtitle")}
          </p>
        </div>

        <Button
          type="button"
          variant="adminPrimary"
          size="sm"
          onClick={openCreateModal}
        >
          <Plus className="w-4 h-4" />
          <span>{t("addBtn")}</span>
        </Button>
      </div>

      {/* Visible System Roles (Read-only overview) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-amber-500/25 bg-slate-900/50 p-4 flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white">{t("superAdminTitle")}</span>
              <Badge variant="adminWarning" size="sm">
                <Lock className="w-2.5 h-2.5" />
                <span>{t("systemRole")}</span>
              </Badge>
            </div>
            <p className="text-[11px] text-slate-400">
              {t("superAdminDesc")}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-sky-500/25 bg-slate-900/50 p-4 flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 shrink-0">
            <Shield className="w-4 h-4" />
          </div>
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white">{t("adminTitle")}</span>
              <Badge variant="adminAccent" size="sm">
                <UserCheck className="w-2.5 h-2.5" />
                <span>{t("assignableRole")}</span>
              </Badge>
            </div>
            <p className="text-[11px] text-slate-400">
              {t("adminDesc")}
            </p>
          </div>
        </div>
      </div>

      {/* Administrators Table */}
      <div className="rounded-2xl border border-slate-800/90 bg-slate-900/40 overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/80 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              <th className="py-3.5 px-5">{t("colAdmin")}</th>
              <th className="py-3.5 px-4">{t("colEmail")}</th>
              <th className="py-3.5 px-4">{t("colMobile")}</th>
              <th className="py-3.5 px-4">{t("colRole")}</th>
              <th className="py-3.5 px-5 text-right">{t("colActions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {normalizedAdmins.map((admin) => {
              const isSuperAdmin = admin.role === "SUPERADMIN";
              const fullName =
                `${admin.first_name} ${admin.last_name}`.trim() || "Super Admin";
              const initials =
                fullName
                  .split(" ")
                  .filter(Boolean)
                  .map((p) => p[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase() || "SA";

              return (
                <tr
                  key={admin.id}
                  className={`transition ${
                    isSuperAdmin
                      ? "bg-slate-900/60"
                      : "hover:bg-slate-900/40"
                  }`}
                >
                  <td className="py-3.5 px-5">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold border shrink-0 ${
                          isSuperAdmin
                            ? "bg-amber-500/15 border-amber-500/30 text-amber-300"
                            : "bg-sky-500/15 border-sky-500/30 text-sky-300"
                        }`}
                      >
                        {initials}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white">
                            {fullName}
                          </span>
                          {isSuperAdmin && (
                            <span className="inline-flex items-center gap-1 rounded-md border border-slate-700 bg-slate-800/90 px-2 py-0.5 text-[10px] font-medium text-slate-300">
                              <Lock className="w-2.5 h-2.5 text-amber-400" />
                              <span>{t("defaultBadge")}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="inline-flex items-center gap-1.5 text-slate-300 font-mono text-[11px]">
                      <Mail className="w-3.5 h-3.5 text-slate-500" />
                      <span>{admin.email}</span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 text-slate-400">
                    {admin.mobile ? (
                      <div className="inline-flex items-center gap-1.5 text-slate-300 text-[11px]">
                        <Phone className="w-3.5 h-3.5 text-slate-500" />
                        <span>{admin.mobile}</span>
                      </div>
                    ) : (
                      <span className="text-slate-600">—</span>
                    )}
                  </td>

                  <td className="py-3.5 px-4">
                    {isSuperAdmin ? (
                      <Badge variant="adminWarning" size="sm">
                        <ShieldCheck className="w-3 h-3" />
                        <span>SuperAdmin</span>
                      </Badge>
                    ) : (
                      <Badge variant="adminAccent" size="sm">
                        <Shield className="w-3 h-3" />
                        <span>{t("adminTitle")}</span>
                      </Badge>
                    )}
                  </td>

                  <td className="py-3.5 px-5 text-right">
                    {isSuperAdmin ? (
                      <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-500 select-none">
                        <Lock className="w-3.5 h-3.5 text-slate-500" />
                        <span>{t("locked")}</span>
                      </span>
                    ) : (
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          type="button"
                          variant="adminSecondary"
                          size="xs"
                          onClick={() => openEditModal(admin)}
                          title={t("editAdminTooltip")}
                        >
                          <Edit3 className="w-3.5 h-3.5 text-slate-400" />
                          <span>{tCommon("edit")}</span>
                        </Button>
                        <Button
                          type="button"
                          variant="tableDestructive"
                          size="tableIcon"
                          onClick={() => handleDelete(admin)}
                          title={t("deleteAdminTooltip")}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Administrator Dialog */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent variant="admin" size="sm" className="space-y-5">
          <DialogHeader className="border-b border-slate-800 pb-3 mb-0">
            <DialogTitle variant="admin">
              {editingAdmin ? t("modalEditTitle") : t("modalCreateTitle")}
            </DialogTitle>
          </DialogHeader>

          {errorMsg && (
            <Alert variant="destructive" className="mb-4">
              {errorMsg}
            </Alert>
          )}

          <form onSubmit={handleSubmit} autoComplete="off" className="space-y-4">
            {/* Role Display (Read-only: Administrator) */}
            <div>
              <Label variant="admin" className="mb-1">
                {t("assignedRole")}
              </Label>
              <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/70 px-3.5 py-2.5 text-xs">
                <span className="inline-flex items-center gap-2 font-semibold text-sky-400">
                  <Shield className="w-4 h-4" />
                  <span>{t("adminTitle")}</span>
                </span>
                <span className="text-[11px] text-slate-500">{t("defaultRole")}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField label={t("firstName")} required labelVariant="admin" labelSize="sm">
                <Input
                  variant="admin"
                  size="sm"
                  type="text"
                  autoComplete="off"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Anna"
                />
              </FormField>
              <FormField label={t("lastName")} required labelVariant="admin" labelSize="sm">
                <Input
                  variant="admin"
                  size="sm"
                  type="text"
                  autoComplete="off"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Andersson"
                />
              </FormField>
            </div>

            <FormField label={t("email")} required labelVariant="admin" labelSize="sm">
              <Input
                variant="admin"
                size="sm"
                type="email"
                autoComplete="off"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="anna@example.com"
              />
            </FormField>

            <FormField label={t("mobile")} labelVariant="admin" labelSize="sm">
              <Input
                variant="admin"
                size="sm"
                type="tel"
                autoComplete="off"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="+46 70 123 45 67"
              />
            </FormField>

            <FormField
              label={editingAdmin ? t("newPassword") : t("password")}
              required={!editingAdmin}
              labelVariant="admin"
              labelSize="sm"
            >
              <Input
                variant="admin"
                size="sm"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={
                  editingAdmin ? "••••••••" : t("passwordMinPlaceholder")
                }
              />
            </FormField>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="adminSecondary"
                size="sm"
                type="button"
                onClick={() => setIsModalOpen(false)}
              >
                {tCommon("cancel")}
              </Button>
              <Button
                variant="adminPrimary"
                size="sm"
                type="submit"
                disabled={isSaving}
              >
                {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>
                  {editingAdmin ? t("saveChanges") : t("createAdmin")}
                </span>
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
