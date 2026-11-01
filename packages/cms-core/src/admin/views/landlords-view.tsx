"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import {
  Plus,
  Edit3,
  Trash2,
  Mail,
  Phone,
  Smartphone,
  MapPin,
  Landmark,
  CreditCard,
  CheckCircle2,
  XCircle,
  X,
  Loader2,
  Search,
  Building,
} from "lucide-react";
import { LandlordDto } from "../../actions/landlords";
import { ModalPortal } from "../../components/ui/modal-portal";

export type LandlordItem = LandlordDto;

export interface LandlordsViewProps {
  landlords?: LandlordItem[];
  onSaveLandlord?: (data: {
    id?: string;
    first_name: string;
    last_name: string;
    address?: string;
    postal_code?: string;
    city?: string;
    email?: string;
    phone?: string;
    mobile?: string;
    has_swish?: boolean;
    account_type?: string;
    account_number?: string;
  }) => Promise<LandlordItem[] | void>;
  onDeleteLandlord?: (id: string) => Promise<LandlordItem[] | void>;
}

const COMMON_ACCOUNT_TYPES = [
  "Bankgiro",
  "Plusgiro",
  "Swedbank",
  "Nordea",
  "Handelsbanken",
  "SEB",
  "Other",
];

export function LandlordsView({
  landlords: initialLandlords = [],
  onSaveLandlord,
  onDeleteLandlord,
}: LandlordsViewProps) {
  const t = useTranslations("landlords");
  const tCommon = useTranslations("common");

  const [landlords, setLandlords] = useState<LandlordItem[]>(initialLandlords);

  useEffect(() => {
    setLandlords(initialLandlords);
  }, [initialLandlords]);

  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLandlord, setEditingLandlord] = useState<LandlordItem | null>(null);

  // Form states
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [address, setAddress] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [mobile, setMobile] = useState("");
  const [hasSwish, setHasSwish] = useState(false);
  const [selectedAccountType, setSelectedAccountType] = useState("Bankgiro");
  const [customAccountType, setCustomAccountType] = useState("");
  const [accountNumber, setAccountNumber] = useState("");

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const openCreateModal = () => {
    setEditingLandlord(null);
    setFirstName("");
    setLastName("");
    setAddress("");
    setPostalCode("");
    setCity("");
    setEmail("");
    setPhone("");
    setMobile("");
    setHasSwish(false);
    setSelectedAccountType("Bankgiro");
    setCustomAccountType("");
    setAccountNumber("");
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const openEditModal = (item: LandlordItem) => {
    setEditingLandlord(item);
    setFirstName(item.first_name || "");
    setLastName(item.last_name || "");
    setAddress(item.address || "");
    setPostalCode(item.postal_code || "");
    setCity(item.city || "");
    setEmail(item.email || "");
    setPhone(item.phone || "");
    setMobile(item.mobile || "");
    setHasSwish(Boolean(item.has_swish));

    if (item.account_type && COMMON_ACCOUNT_TYPES.includes(item.account_type)) {
      setSelectedAccountType(item.account_type);
      setCustomAccountType("");
    } else if (item.account_type) {
      setSelectedAccountType("Other");
      setCustomAccountType(item.account_type);
    } else {
      setSelectedAccountType("Bankgiro");
      setCustomAccountType("");
    }

    setAccountNumber(item.account_number || "");
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!firstName.trim() || !lastName.trim()) {
      setErrorMsg(t("namesRequired"));
      return;
    }

    const resolvedAccountType =
      selectedAccountType === "Other"
        ? customAccountType.trim() || "Other"
        : selectedAccountType;

    setIsSaving(true);
    try {
      if (onSaveLandlord) {
        const res = await onSaveLandlord({
          ...(editingLandlord ? { id: editingLandlord.id } : {}),
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          address: address.trim() || undefined,
          postal_code: postalCode.trim() || undefined,
          city: city.trim() || undefined,
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          mobile: mobile.trim() || undefined,
          has_swish: hasSwish,
          account_type: resolvedAccountType || undefined,
          account_number: accountNumber.trim() || undefined,
        });

        if (Array.isArray(res)) {
          setLandlords(res);
        }
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setErrorMsg(err?.message || t("saveError"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (item: LandlordItem) => {
    const fullName = `${item.first_name} ${item.last_name}`.trim();
    if (!confirm(t("deleteConfirm", { name: fullName }))) {
      return;
    }

    setLandlords((prev) => prev.filter((l) => l.id !== item.id));
    setIsModalOpen(false);
    if (onDeleteLandlord) {
      const res = await onDeleteLandlord(item.id);
      if (Array.isArray(res)) {
        setLandlords(res);
      }
    }
  };

  const filteredLandlords = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return landlords;
    return landlords.filter((l) => {
      const fullName = `${l.first_name} ${l.last_name}`.toLowerCase();
      const cityMatch = (l.city || "").toLowerCase().includes(q);
      const emailMatch = (l.email || "").toLowerCase().includes(q);
      const phoneMatch = (l.phone || "").toLowerCase().includes(q);
      const mobileMatch = (l.mobile || "").toLowerCase().includes(q);
      const accountMatch = (l.account_number || "").toLowerCase().includes(q);
      return (
        fullName.includes(q) ||
        cityMatch ||
        emailMatch ||
        phoneMatch ||
        mobileMatch ||
        accountMatch
      );
    });
  }, [landlords, searchQuery]);

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Building className="w-6 h-6 text-sky-400" />
            <span>{t("title")}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {t("subtitle")}
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-sky-600/20 hover:bg-sky-500 transition"
        >
          <Plus className="w-4 h-4" />
          <span>{t("createBtn")}</span>
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="w-full bg-slate-900/60 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition"
          />
        </div>

        <div className="text-xs text-slate-400">
          {t("showing", {
            count: filteredLandlords.length,
            plural: filteredLandlords.length === 1 ? t("landlord") : t("landlords"),
          })}
        </div>
      </div>

      {/* Landlords Table */}
      <div className="rounded-2xl border border-slate-800/90 bg-slate-900/40 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/80 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                <th className="py-3.5 px-5">{t("colLandlord")}</th>
                <th className="py-3.5 px-4">{t("colAddress")}</th>
                <th className="py-3.5 px-4">{t("colPostalCity")}</th>
                <th className="py-3.5 px-4">{t("colEmail")}</th>
                <th className="py-3.5 px-4">{t("colPhone")}</th>
                <th className="py-3.5 px-4">{t("colPayout")}</th>
                <th className="py-3.5 px-5 text-right">{t("colActions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredLandlords.map((landlord) => {
                const fullName =
                  `${landlord.first_name} ${landlord.last_name}`.trim() || t("unnamed");
                const initials =
                  fullName
                    .split(" ")
                    .filter(Boolean)
                    .map((p) => p[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase() || "LL";

                return (
                  <tr
                    key={landlord.id}
                    className="hover:bg-slate-900/60 transition group"
                  >
                    {/* Name + Avatar */}
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold border border-sky-500/30 bg-sky-500/15 text-sky-300 shrink-0">
                          {initials}
                        </div>
                        <span className="font-semibold text-white">{fullName}</span>
                      </div>
                    </td>

                    {/* Address */}
                    <td className="py-3.5 px-4 text-slate-300">
                      {landlord.address ? (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span>{landlord.address}</span>
                        </div>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>

                    {/* Postal Code & City */}
                    <td className="py-3.5 px-4 text-slate-300">
                      {landlord.postal_code || landlord.city ? (
                        <span>
                          {[landlord.postal_code, landlord.city]
                            .filter(Boolean)
                            .join(" ")}
                        </span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>

                    {/* Email */}
                    <td className="py-3.5 px-4">
                      {landlord.email ? (
                        <div className="inline-flex items-center gap-1.5 text-slate-300 font-mono text-[11px]">
                          <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span>{landlord.email}</span>
                        </div>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>

                    {/* Phone & Mobile with Swish */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        {landlord.phone && (
                          <div className="inline-flex items-center gap-1.5 text-slate-400 text-[11px]">
                            <Phone className="w-3 h-3 text-slate-500 shrink-0" />
                            <span>{landlord.phone}</span>
                          </div>
                        )}
                        {landlord.mobile ? (
                          <div className="flex items-center gap-2">
                            <div className="inline-flex items-center gap-1.5 text-slate-200 text-[11px]">
                              <Smartphone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>{landlord.mobile}</span>
                            </div>
                            {landlord.has_swish && (
                              <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.2 text-[10px] font-semibold text-emerald-400" title="Accepts Swish payments">
                                <CheckCircle2 className="w-2.5 h-2.5" />
                                <span>Swish</span>
                              </span>
                            )}
                          </div>
                        ) : (
                          !landlord.phone && <span className="text-slate-600">—</span>
                        )}
                      </div>
                    </td>

                    {/* Payout Account */}
                    <td className="py-3.5 px-4 text-slate-300">
                      {landlord.account_number ? (
                        <div className="flex items-center gap-2">
                          {landlord.account_type && (
                            <span className="inline-flex items-center rounded bg-slate-800 border border-slate-700 px-1.5 py-0.5 text-[10px] font-medium text-slate-300">
                              {landlord.account_type}
                            </span>
                          )}
                          <span className="font-mono text-[11px] text-slate-200">
                            {landlord.account_number}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-5 text-right">
                      <button
                        type="button"
                        onClick={() => openEditModal(landlord)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 transition shadow-sm"
                        title="Edit landlord"
                      >
                        <Edit3 className="w-3 h-3 text-sky-400" />
                        <span>{tCommon("edit")}</span>
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredLandlords.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="py-12 text-center text-slate-500 text-xs"
                  >
                    {t("noLandlordsFound")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Landlord Modal */}
      {isModalOpen && (
        <ModalPortal>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-xl rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center">
                  <Building className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {editingLandlord ? t("modalEditTitle") : t("modalCreateTitle")}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {t("modalSubtitle")}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                {errorMsg}
              </div>
            )}

            {/* Modal Form */}
            <form onSubmit={handleSave} className="space-y-4 text-xs">
              {/* Names */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-300">
                    {t("firstName")} <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="e.g. Jan"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-300">
                    {t("lastName")} <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="e.g. Ullberg"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition"
                  />
                </div>
              </div>

              {/* Address */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-300">
                  {t("address")}
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street address or property name (e.g. Lullyhill)"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition"
                />
              </div>

              {/* Postal code & City (Split postadress) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-300">
                    {t("postalCode")}
                  </label>
                  <input
                    type="text"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    placeholder="e.g. 621 41"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-300">
                    {t("city")}
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. VISBY"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition"
                  />
                </div>
              </div>

              {/* Email (moved up after postal code / city) */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-300">
                  {t("email")}
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. jan.ullberg@lullyhill.se"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition"
                  />
                </div>
              </div>

              {/* Phone & Mobile */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-300">
                    {t("phone")}
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. 0498-21 10 87"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-300">
                    {t("mobile")}
                  </label>
                  <div className="relative">
                    <Smartphone className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      placeholder="e.g. 070-620 96 11"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition"
                    />
                  </div>
                </div>
              </div>

              {/* Swish Payment Switch */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-white">
                      {t("swishSupport")}
                    </span>
                    {hasSwish && (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.2 rounded">
                        {t("swishActive")}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400">
                    {t("swishDesc")}
                  </p>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={hasSwish}
                  onClick={() => setHasSwish(!hasSwish)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    hasSwish ? "bg-emerald-500" : "bg-slate-700"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      hasSwish ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Account Type & Account Number */}
              <div className="space-y-3 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-slate-300">
                      {t("accountType")}
                    </label>
                    <select
                      value={selectedAccountType}
                      onChange={(e) => setSelectedAccountType(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500 transition"
                    >
                      {COMMON_ACCOUNT_TYPES.map((tItem) => (
                        <option key={tItem} value={tItem}>
                          {tItem}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedAccountType === "Other" ? (
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-slate-300">
                        {t("specifyAccountType")}
                      </label>
                      <input
                        type="text"
                        value={customAccountType}
                        onChange={(e) => setCustomAccountType(e.target.value)}
                        placeholder="e.g. Länsförsäkringar"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition"
                      />
                    </div>
                  ) : null}

                  <div className={`space-y-1.5 ${selectedAccountType !== "Other" ? "" : "sm:col-span-2"}`}>
                    <label className="text-[11px] font-semibold text-slate-300">
                      {t("accountNumber")}
                    </label>
                    <input
                      type="text"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      placeholder="e.g. 8480-6, 123.654.789-0 or 5402-6018"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                {editingLandlord ? (
                  <button
                    type="button"
                    onClick={() => handleDelete(editingLandlord)}
                    className="inline-flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{t("deleteBtn")}</span>
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition"
                  >
                    {tCommon("cancel")}
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-sky-600/20 hover:bg-sky-500 transition disabled:opacity-50"
                  >
                    {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>{editingLandlord ? t("updateBtn") : t("saveBtn")}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </ModalPortal>
    )}
  </div>
);
}

