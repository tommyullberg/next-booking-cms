"use client";

import React, { useState, useEffect } from "react";
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
  X,
  UserCheck,
} from "lucide-react";
import { ModalPortal } from "../../components/ui/modal-portal";

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
  const [admins, setAdmins] = useState<AdministratorItem[]>(initialAdmins);

  useEffect(() => {
    setAdmins(initialAdmins);
  }, [initialAdmins]);

  // Ensure default SuperAdmin is always visible at the top and locked
  const normalizedAdmins: AdministratorItem[] = React.useMemo(() => {
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
  const [editingAdmin, setEditingAdmin] = useState<AdministratorItem | null>(
    null
  );
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
      setErrorMsg("First name, last name, and email are required.");
      return;
    }

    if (!editingAdmin && password.trim().length < 6) {
      setErrorMsg("Password must be at least 6 characters.");
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
      setErrorMsg(err?.message || "Could not save administrator.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (admin: AdministratorItem) => {
    if (admin.role === "SUPERADMIN") return;
    if (
      !confirm(
        `Remove administrator "${admin.first_name} ${admin.last_name}" (${admin.email})?`
      )
    ) {
      return;
    }

    setAdmins((prev) => prev.filter((a) => a.id !== admin.id));
    if (onDeleteAdministrator) {
      const res = await onDeleteAdministrator(admin.id);
      if (Array.isArray(res)) {
        setAdmins(res);
      }
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Administrators
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            View the locked default Super Admin account and add or manage Administrator accounts.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-sky-600/20 hover:bg-sky-500 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add Administrator</span>
        </button>
      </div>

      {/* Visible System Roles (Read-only overview) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-amber-500/25 bg-slate-900/50 p-4 flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white">SuperAdmin</span>
              <span className="inline-flex items-center gap-1 rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
                <Lock className="w-2.5 h-2.5" />
                <span>System Role</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Primary system owner account with full unrestricted access. Protected and locked from deletion.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-sky-500/25 bg-slate-900/50 p-4 flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 shrink-0">
            <Shield className="w-4 h-4" />
          </div>
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white">Administrator</span>
              <span className="inline-flex items-center gap-1 rounded-md border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 text-[10px] font-semibold text-sky-300">
                <UserCheck className="w-2.5 h-2.5" />
                <span>Assignable Role</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Standard administrator role assigned to all added administrators for managing CMS content and bookings.
            </p>
          </div>
        </div>
      </div>

      {/* Administrators Table */}
      <div className="rounded-2xl border border-slate-800/90 bg-slate-900/40 overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/80 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              <th className="py-3.5 px-5">Administrator</th>
              <th className="py-3.5 px-4">Email</th>
              <th className="py-3.5 px-4">Mobile</th>
              <th className="py-3.5 px-4">Role</th>
              <th className="py-3.5 px-5 text-right">Actions</th>
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
                              <span>Default</span>
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
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/15 px-2.5 py-0.5 text-[10px] font-bold text-amber-300">
                        <ShieldCheck className="w-3 h-3" />
                        <span>SuperAdmin</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-500/30 bg-sky-500/15 px-2.5 py-0.5 text-[10px] font-bold text-sky-300">
                        <Shield className="w-3 h-3" />
                        <span>Administrator</span>
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 px-5 text-right">
                    {isSuperAdmin ? (
                      <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-500 select-none">
                        <Lock className="w-3.5 h-3.5 text-slate-500" />
                        <span>Locked</span>
                      </span>
                    ) : (
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditModal(admin)}
                          className="px-2.5 py-1 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:text-white hover:border-slate-700 transition inline-flex items-center gap-1.5 text-xs"
                          title="Edit administrator"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(admin)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition"
                          title="Remove administrator"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Administrator Modal */}
      {isModalOpen && (
        <ModalPortal>
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 text-white shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">
                {editingAdmin ? "Edit Administrator" : "Add New Administrator"}
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMsg && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-xs text-red-300">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Role Display (Read-only: Administrator) */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Assigned Role
                </label>
                <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/70 px-3.5 py-2.5 text-xs">
                  <span className="inline-flex items-center gap-2 font-semibold text-sky-400">
                    <Shield className="w-4 h-4" />
                    <span>Administrator</span>
                  </span>
                  <span className="text-[11px] text-slate-500">Default role</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Anna"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white focus:border-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Andersson"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white focus:border-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="anna@example.com"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Mobile Phone (Optional)
                </label>
                <input
                  type="text"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="+46 70 123 45 67"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {editingAdmin
                    ? "New Password (leave empty to keep current)"
                    : "Password"}
                </label>
                <input
                  type="password"
                  required={!editingAdmin}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={
                    editingAdmin ? "••••••••" : "Minimum 6 characters"
                  }
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-sky-600 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-500 transition disabled:opacity-50"
                >
                  {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>
                    {editingAdmin ? "Save Changes" : "Create Administrator"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </ModalPortal>
    )}
  </div>
);
}
