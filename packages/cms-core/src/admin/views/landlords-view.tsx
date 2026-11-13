"use client";

import React, { useState, useEffect, useMemo, useId } from "react";
import { useTranslations } from "next-intl";
import {
  Plus,
  Edit3,
  Trash2,
  Mail,
  Phone,
  Smartphone,
  MapPin,
  CheckCircle2,
  Loader2,
  Search,
  Building,
} from "lucide-react";
import { LandlordDto } from "@cms/actions/landlords";
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
  NativeSelect,
  Switch,
} from "@cms/components/ui";
import { useConfirm } from "@cms/components/confirm";

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
  const formId = useId();
  const t = useTranslations("landlords");
  const tCommon = useTranslations("common");
  const { confirm } = useConfirm();

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
    await confirm({
      title: tCommon("delete"),
      description: t("deleteConfirm", { name: fullName }),
      variant: "destructive",
      onConfirm: async () => {
        if (onDeleteLandlord) {
          const res = await onDeleteLandlord(item.id);
          if (Array.isArray(res)) {
            setLandlords(res);
          } else {
            setLandlords((prev) => prev.filter((l) => l.id !== item.id));
          }
        } else {
          setLandlords((prev) => prev.filter((l) => l.id !== item.id));
        }
        setIsModalOpen(false);
      },
    });
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

        <Button
          type="button"
          variant="adminPrimary"
          size="sm"
          onClick={openCreateModal}
        >
          <Plus className="w-4 h-4" />
          <span>{t("createBtn")}</span>
        </Button>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <Input
            variant="admin"
            size="sm"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("searchPlaceholder")}
            aria-label={t("searchPlaceholder")}
            className="pl-9"
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
              <tr className="cms-table-header">
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
                          <MapPin className="cms-icon-sm text-slate-500" />
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
                        <div className="inline-flex items-center gap-1.5 cms-text-code text-slate-300">
                          <Mail className="cms-icon-sm text-slate-500" />
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
                          <div className="inline-flex items-center gap-1.5 cms-text-meta">
                            <Phone className="cms-icon-xs text-slate-500" />
                            <span>{landlord.phone}</span>
                          </div>
                        )}
                        {landlord.mobile ? (
                          <div className="flex items-center gap-2">
                            <div className="inline-flex items-center gap-1.5 cms-text-meta text-slate-200">
                              <Smartphone className="cms-icon-sm text-slate-400" />
                              <span>{landlord.mobile}</span>
                            </div>
                            {landlord.has_swish && (
                              <Badge variant="adminSuccess" size="xs" title="Accepts Swish payments">
                                <CheckCircle2 className="w-2.5 h-2.5" />
                                <span>Swish</span>
                              </Badge>
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
                            <span className="inline-flex items-center rounded bg-slate-800 border border-slate-700 px-1.5 py-0.5 cms-text-caption font-medium text-slate-300">
                              {landlord.account_type}
                            </span>
                          )}
                          <span className="cms-text-code text-slate-200">
                            {landlord.account_number}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-5 text-right">
                      <Button
                        type="button"
                        variant="adminSecondary"
                        size="xs"
                        onClick={() => openEditModal(landlord)}
                        title="Edit landlord"
                      >
                        <Edit3 className="w-3 h-3 text-sky-400" />
                        <span>{tCommon("edit")}</span>
                      </Button>
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

      {/* Create / Edit Landlord Dialog */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent variant="admin" size="lg" className="space-y-5">
          <DialogHeader className="border-b border-slate-800 pb-4 mb-0">
            <DialogTitle variant="admin" size="sm" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center">
                <Building className="cms-icon-md" />
              </div>
              <div>
                <span>
                  {editingLandlord ? t("modalEditTitle") : t("modalCreateTitle")}
                </span>
                <p className="cms-text-meta font-normal">
                  {t("modalSubtitle")}
                </p>
              </div>
            </DialogTitle>
          </DialogHeader>

          {errorMsg && (
            <Alert variant="destructive" className="mb-4">
              {errorMsg}
            </Alert>
          )}

          {/* Modal Form */}
          <form onSubmit={handleSave} autoComplete="off" className="space-y-4 text-xs">
            {/* Names */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField label={t("firstName")} required labelVariant="admin" labelSize="sm">
                <Input
                  variant="admin"
                  size="sm"
                  type="text"
                  autoComplete="off"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder={t("firstNamePlaceholder")}
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
                  placeholder={t("lastNamePlaceholder")}
                />
              </FormField>
            </div>

            {/* Address */}
            <FormField label={t("address")} labelVariant="admin" labelSize="sm">
              <Input
                variant="admin"
                size="sm"
                type="text"
                autoComplete="off"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder={t("addressPlaceholder")}
              />
            </FormField>

            {/* Postal code & City */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField label={t("postalCode")} labelVariant="admin" labelSize="sm">
                <Input
                  variant="admin"
                  size="sm"
                  type="text"
                  autoComplete="off"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder={t("postalCodePlaceholder")}
                />
              </FormField>
              <FormField label={t("city")} labelVariant="admin" labelSize="sm">
                <Input
                  variant="admin"
                  size="sm"
                  type="text"
                  autoComplete="off"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder={t("cityPlaceholder")}
                />
              </FormField>
            </div>

            {/* Email */}
            <FormField label={t("email")} labelVariant="admin" labelSize="sm">
              {(control) => (
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <Input
                    {...control}
                    variant="admin"
                    size="sm"
                    type="email"
                    autoComplete="off"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t("emailPlaceholder")}
                    className="pl-9"
                  />
                </div>
              )}
            </FormField>

            {/* Phone & Mobile */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField label={t("phone")} labelVariant="admin" labelSize="sm">
                {(control) => (
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <Input
                      {...control}
                      variant="admin"
                      size="sm"
                      type="tel"
                      autoComplete="off"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder={t("phonePlaceholder")}
                      className="pl-9"
                    />
                  </div>
                )}
              </FormField>

              <FormField label={t("mobile")} labelVariant="admin" labelSize="sm">
                {(control) => (
                  <div className="relative">
                    <Smartphone className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <Input
                      {...control}
                      variant="admin"
                      size="sm"
                      type="tel"
                      autoComplete="off"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      placeholder={t("mobilePlaceholder")}
                      className="pl-9"
                    />
                  </div>
                )}
              </FormField>
            </div>

            {/* Swish Payment Switch */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Label
                    htmlFor={`${formId}-swish`}
                    className="text-[11px] font-semibold text-white cursor-pointer select-none"
                  >
                    {t("swishSupport")}
                  </Label>
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

              <Switch
                id={`${formId}-swish`}
                variant="success"
                checked={hasSwish}
                onCheckedChange={setHasSwish}
                aria-label={t("swishSupport")}
              />
            </div>

            {/* Account Type & Account Number */}
            <div className="space-y-3 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField label={t("accountType")} labelVariant="admin" labelSize="sm">
                  <NativeSelect
                    variant="admin"
                    size="sm"
                    value={selectedAccountType}
                    onChange={(e) => setSelectedAccountType(e.target.value)}
                  >
                    {COMMON_ACCOUNT_TYPES.map((tItem) => (
                      <option key={tItem} value={tItem}>
                        {tItem}
                      </option>
                    ))}
                  </NativeSelect>
                </FormField>

                {selectedAccountType === "Other" ? (
                  <FormField label={t("specifyAccountType")} labelVariant="admin" labelSize="sm">
                    <Input
                      variant="admin"
                      size="sm"
                      type="text"
                      autoComplete="off"
                      value={customAccountType}
                      onChange={(e) => setCustomAccountType(e.target.value)}
                      placeholder={t("bankNamePlaceholder")}
                    />
                  </FormField>
                ) : null}

                <FormField
                  label={t("accountNumber")}
                  labelVariant="admin"
                  labelSize="sm"
                  className={selectedAccountType !== "Other" ? "" : "sm:col-span-2"}
                >
                  <Input
                    variant="admin"
                    size="sm"
                    type="text"
                    autoComplete="off"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder={t("accountNumberPlaceholder")}
                    className="font-mono"
                  />
                </FormField>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              {editingLandlord ? (
                <Button
                  type="button"
                  variant="adminGhostDestructive"
                  size="sm"
                  onClick={() => handleDelete(editingLandlord)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{t("deleteBtn")}</span>
                </Button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="adminSecondary"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                >
                  {tCommon("cancel")}
                </Button>
                <Button
                  type="submit"
                  variant="adminPrimary"
                  size="sm"
                  disabled={isSaving}
                >
                  {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingLandlord ? t("updateBtn") : t("saveBtn")}</span>
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
