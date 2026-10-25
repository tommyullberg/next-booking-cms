"use client";

import React, { useState, useEffect, useMemo } from "react";
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
      setErrorMsg("First name and last name are required.");
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
      setErrorMsg(err?.message || "Could not save landlord.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (item: LandlordItem) => {
    const fullName = `${item.first_name} ${item.last_name}`.trim();
    if (!confirm(`Are you sure you want to remove landlord "${fullName}"?`)) {
      return;
    }

    setLandlords((prev) => prev.filter((l) => l.id !== item.id));
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
            <span>Landlords</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage property owners, payout details, and mobile Swish payment methods for bookings.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-sky-600/20 hover:bg-sky-500 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Create Landlord</span>
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
            placeholder="Search landlords by name, city, email..."
            className="w-full bg-slate-900/60 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition"
          />
        </div>

        <div className="text-xs text-slate-400">
          Showing <span className="font-semibold text-white">{filteredLandlords.length}</span>{" "}
          {filteredLandlords.length === 1 ? "landlord" : "landlords"}
        </div>
      </div>

      {/* Landlords Table */}
      <div className="rounded-2xl border border-slate-800/90 bg-slate-900/40 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/80 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                <th className="py-3.5 px-5">Landlord</th>
                <th className="py-3.5 px-4">Address</th>
                <th className="py-3.5 px-4">Postal Code / City</th>
                <th className="py-3.5 px-4">Email</th>
                <th className="py-3.5 px-4">Phone / Mobile</th>
                <th className="py-3.5 px-4">Payout Account</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredLandlords.map((landlord) => {
                const fullName =
                  `${landlord.first_name} ${landlord.last_name}`.trim() || "Unnamed Landlord";
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
                      <div className="inline-flex items-center gap-1 opacity-90 group-hover:opacity-100 transition">
                        <button
                          type="button"
                          onClick={() => openEditModal(landlord)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                          title="Edit landlord"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(landlord)}
                          className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition"
                          title="Delete landlord"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
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
                    No landlords found. Click "+ Create Landlord" to add one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Landlord Modal */}
      {isModalOpen && (
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
                    {editingLandlord ? "Edit Landlord" : "Create New Landlord"}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Configure contact, address, and payout information.
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
                    First Name <span className="text-rose-400">*</span>
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
                    Last Name <span className="text-rose-400">*</span>
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
                  Address
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
                    Postal Code
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
                    City
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
                  Email
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. jan.ullberg@lullyhill.se"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8.5 pr-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition"
                  />
                </div>
              </div>

              {/* Phone & Mobile */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-300">
                    Phone (Tel)
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. 0498-21 10 87"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8.5 pr-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-300">
                    Mobile
                  </label>
                  <div className="relative">
                    <Smartphone className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      placeholder="e.g. 070-620 96 11"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8.5 pr-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition"
                    />
                  </div>
                </div>
              </div>

              {/* Swish Payment Switch */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-white">
                      Swish Payment Support
                    </span>
                    {hasSwish && (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.2 rounded">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Enable Swish as a payment method for booking guests using this mobile number.
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
                      Account Type
                    </label>
                    <select
                      value={selectedAccountType}
                      onChange={(e) => setSelectedAccountType(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500 transition"
                    >
                      {COMMON_ACCOUNT_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedAccountType === "Other" ? (
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-slate-300">
                        Specify Account Type
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
                      Account Number
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
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-sky-600/20 hover:bg-sky-500 transition disabled:opacity-50"
                >
                  {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingLandlord ? "Update Landlord" : "Save Landlord"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

