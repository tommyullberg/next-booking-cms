"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Lock,
  Calendar as CalendarIcon,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Clock,
  User,
  Mail,
  Phone,
  Smartphone,
  MapPin,
  FileText,
  CreditCard,
  Globe,
  Copy,
  Check,
  Edit3,
  Save,
  Loader2,
  ShieldAlert,
} from "lucide-react";
import { BookingItem, BOOKING_STATUSES, BookingStatusType } from "./types";
import { ModalPortal } from "../components/ui/modal-portal";

export interface BookingDetailsModalProps {
  booking: BookingItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSave?: (savedBooking: BookingItem) => Promise<void> | void;
  initialMode?: "view" | "edit";
  locale?: "sv" | "en";
}

export function BookingDetailsModal({
  booking,
  isOpen,
  onClose,
  onSave,
  initialMode = "view",
  locale = "sv",
}: BookingDetailsModalProps) {
  const isBlocked = Boolean(
    booking && (
      booking.icalSourceId === "blocked_period" ||
      booking.customerEmail === "internal@blocked" ||
      (booking.status as string) === "BLOCKED" ||
      booking.customerName?.toLowerCase().includes("blockad")
    )
  );
  const isImported = Boolean(
    booking &&
      !isBlocked &&
      (booking.status === "IMPORTED" ||
        (Boolean(booking.icalSourceId) && booking.icalSourceId !== "blocked_period"))
  );

  // If imported, ALWAYS lock to "view"
  const [mode, setMode] = useState<"view" | "edit">(
    isImported ? "view" : initialMode
  );
  const [editForm, setEditForm] = useState<Partial<BookingItem>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [copiedUid, setCopiedUid] = useState(false);
  const [contractNotice, setContractNotice] = useState<string | null>(null);

  useEffect(() => {
    if (booking) {
      setEditForm({ ...booking });
      setMode(isImported ? "view" : initialMode);
      setSaveError(null);
      setSaveSuccess(false);
      setContractNotice(null);
    }
  }, [booking, isImported, initialMode]);

  if (!isOpen || !booking) return null;

  const handleCopyUid = (uid?: string | null) => {
    if (!uid) return;
    navigator.clipboard.writeText(uid);
    setCopiedUid(true);
    setTimeout(() => setCopiedUid(false), 2000);
  };

  const calculateNights = (start?: string, end?: string) => {
    if (!start || !end) return 0;
    const diff = new Date(end).getTime() - new Date(start).getTime();
    return Math.max(1, Math.round(diff / (1000 * 60 * 60 * 24)));
  };

  const currentStatusConfig = BOOKING_STATUSES.find(
    (s) => s.id === (booking.status === "CONFIRMED" ? "BOOKED" : booking.status)
  ) || BOOKING_STATUSES[0];

  const editStatusConfig = BOOKING_STATUSES.find(
    (s) => s.id === (editForm.status === "CONFIRMED" ? "BOOKED" : editForm.status)
  ) || BOOKING_STATUSES[0];

  // Compile list of missing / incomplete data for the View mode
  const missingItems: Array<{ label: string; detail: string; severity: "high" | "medium" | "low" }> = [];
  if (!isImported) {
    if (!booking.customerPhone && !booking.customerMobile) {
      missingItems.push({
        label: locale === "en" ? "Missing telephone / mobile" : "Telefon- eller mobilnummer saknas",
        detail: locale === "en" ? "No contact phone has been entered" : "Inget telefonnummer registrerat för direktkontakt",
        severity: "high",
      });
    }
    if (!booking.customerEmail) {
      missingItems.push({
        label: locale === "en" ? "Missing email address" : "E-postadress saknas",
        detail: locale === "en" ? "Cannot send automatic confirmation or contract" : "Kan inte skicka automatisk bekräftelse eller avtal",
        severity: "high",
      });
    }
    if (!booking.addressLine1 || !booking.city) {
      missingItems.push({
        label: locale === "en" ? "Incomplete postal address" : "Gatuadress eller ort saknas",
        detail: locale === "en" ? "Street address and city needed for rental agreement" : "Gatuadress och postort behövs för komplett hyreskontrakt",
        severity: "medium",
      });
    }
    if (!booking.price || booking.price <= 0) {
      missingItems.push({
        label: locale === "en" ? "Total price not set" : "Överenskommet pris ej angivet",
        detail: locale === "en" ? "Price is currently 0 SEK" : "Priset är satt till 0 kr eller ej specificerat",
        severity: "high",
      });
    }
    if (!booking.contractSentAt) {
      missingItems.push({
        label: locale === "en" ? "Contract not sent" : "Kontrakt ej skickat",
        detail: locale === "en" ? "No record of contract sent to tenant" : "Inget hyreskontrakt har skickats till gästen",
        severity: "medium",
      });
    } else if (!booking.contractReceivedAt) {
      missingItems.push({
        label: locale === "en" ? "Contract not received/signed" : "Signerat kontrakt ej mottaget",
        detail: locale === "en" ? "Contract sent but awaiting signed return copy" : "Kontrakt skickat men påskriven kopia har ännu inte inkommit",
        severity: "medium",
      });
    }
    if (!booking.depositPaidAt) {
      missingItems.push({
        label: locale === "en" ? "Deposit not paid" : "Deposition / förskott ej betald",
        detail: booking.depositDueDate
          ? `${locale === "en" ? "Due date:" : "Förfallodatum:"} ${booking.depositDueDate}`
          : locale === "en" ? "No deposit payment registered" : "Ingen depositionsinbetalning registrerad",
        severity: "high",
      });
    }
    if (!booking.finalPaymentPaidAt) {
      missingItems.push({
        label: locale === "en" ? "Final payment not paid" : "Slutbetalning ej gjord",
        detail: booking.finalPaymentDueDate
          ? `${locale === "en" ? "Due date:" : "Förfallodatum:"} ${booking.finalPaymentDueDate}`
          : locale === "en" ? "No final payment registered" : "Slutbetalning har ännu inte registrerats",
        severity: "high",
      });
    }
  }

  const handleSave = async (closeAfter: boolean = false) => {
    if (isImported) return;
    if (!editForm.id) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      if (onSave) {
        await onSave(editForm as BookingItem);
      } else {
        const res = await fetch("/api/cms/bookings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editForm),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Misslyckades att spara bokningsuppgifter");
        }
      }
      setSaveSuccess(true);
      if (closeAfter) {
        setTimeout(() => onClose(), 300);
      } else {
        setMode("view");
        setTimeout(() => setSaveSuccess(false), 2500);
      }
    } catch (err: any) {
      setSaveError(err.message || "Ett fel uppstod vid sparande");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ModalPortal>
      <div className='fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200'>
        <div className='bg-slate-900 border border-slate-800 w-full max-w-4xl max-h-[92vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto'>
          {/* Header */}
          <div className='bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between shrink-0'>
            <div className='space-y-1 min-w-0'>
              <div className='flex items-center gap-2.5 flex-wrap'>
                <h3 className='text-base font-bold text-white flex items-center gap-2 truncate'>
                  {isImported ? (
                    <Lock className='w-4 h-4 text-amber-400 shrink-0' />
                  ) : (
                    <CalendarIcon className='w-4 h-4 text-sky-400 shrink-0' />
                  )}
                  <span>
                    {isImported
                      ? `Extern bokning: ${booking.customerName || "Booking.com"}`
                      : `Bokning: ${booking.customerName || "Förfrågan"}`}
                  </span>
                </h3>

                {isImported ? (
                  <span className='inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30'>
                    <Lock className='w-3 h-3' />
                    <span>iCal / Booking.com (Låst)</span>
                  </span>
                ) : isBlocked ? (
                  <span className='inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/40'>
                    <Lock className='w-3 h-3' />
                    <span>Blockad</span>
                  </span>
                ) : (
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                      currentStatusConfig.color.badge
                    }`}>
                    {currentStatusConfig.label[locale === "en" ? "en" : "sv"]}
                  </span>
                )}

                {booking.isPreliminary && (
                  <span className='text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40'>
                    Preliminär
                  </span>
                )}
              </div>

              <div className='flex items-center gap-2 text-xs text-slate-400'>
                <span className='font-semibold text-slate-200'>{booking.objectName}</span>
                <span>•</span>
                <span className='font-mono'>
                  {booking.startDate} till {booking.endDate}
                </span>
                <span>•</span>
                <span className='text-amber-300 font-semibold'>
                  {calculateNights(booking.startDate, booking.endDate)} nätter
                </span>
              </div>
            </div>

            <div className='flex items-center gap-2 shrink-0 ml-3'>
              {!isImported && mode === "view" && (
                <button
                  type='button'
                  onClick={() => setMode("edit")}
                  className='flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-sky-600 bg-sky-950/40 hover:bg-sky-900/60 text-sky-200 text-xs font-semibold transition cursor-pointer'>
                  <Edit3 className='w-3.5 h-3.5' />
                  <span>Redigera bokning</span>
                </button>
              )}

              {!isImported && mode === "edit" && (
                <button
                  type='button'
                  onClick={() => setMode("view")}
                  className='px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition cursor-pointer'>
                  Visa-läge
                </button>
              )}

              <button
                type='button'
                onClick={onClose}
                className='p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer'>
                <X className='w-4 h-4' />
              </button>
            </div>
          </div>

          {/* Feedback messages */}
          {saveSuccess && (
            <div className='bg-emerald-950/40 border-b border-emerald-800/50 px-6 py-2.5 text-xs text-emerald-300 flex items-center gap-2'>
              <CheckCircle2 className='w-4 h-4 text-emerald-400 shrink-0' />
              <span>Bokningsuppgifterna har sparats!</span>
            </div>
          )}

          {saveError && (
            <div className='bg-rose-950/40 border-b border-rose-800/50 px-6 py-2.5 text-xs text-rose-300 flex items-center gap-2'>
              <AlertCircle className='w-4 h-4 text-rose-400 shrink-0' />
              <span>{saveError}</span>
            </div>
          )}

          {/* Body */}
          <div className='p-6 overflow-y-auto max-h-[calc(90vh-140px)] space-y-6'>
            {/* BLOCKERAD PERIOD-BANNER */}
            {isBlocked && (
              <div className='p-4 rounded-xl border border-neutral-700 bg-neutral-900/50 text-xs text-neutral-200 space-y-2'>
                <div className='flex items-center gap-2 font-semibold text-neutral-200'>
                  <Lock className='w-4 h-4 text-neutral-400 shrink-0' />
                  <span>Perioden är internt blockerad för uthyrning</span>
                </div>
                <p className='text-slate-400 leading-relaxed text-[11px]'>
                  Denna spärr är skapad manuellt i systemet (t.ex. för underhåll, egen användning eller stängd stuga). Den är inte importerad via Booking.com.
                </p>
              </div>
            )}

            {/* LÅST IMPORT-BANNER OM ICAL */}
            {isImported && (
              <div className='p-4 rounded-xl border border-amber-500/30 bg-amber-950/20 text-xs text-amber-200 space-y-2'>
                <div className='flex items-center gap-2 font-semibold text-amber-300'>
                  <Lock className='w-4 h-4 text-amber-400 shrink-0' />
                  <span>Bokningen är importerad via iCal / Booking.com och låst för redigering</span>
                </div>
                <p className='text-slate-300 leading-relaxed text-[11px]'>
                  Denna reservation styrs automatiskt av det externa bokningssystemet. Status, vistelsedatum och gästuppgifter kan inte ändras manuellt här för att undvika osynkade dubbelbokningar. Vid datumändring eller avbokning, hantera ärendet direkt i Booking.com Extranet.
                </p>
                {booking.icalSourceId && (
                  <div className='flex items-center justify-between bg-slate-950/60 border border-slate-800 rounded-lg p-2 mt-2'>
                    <div className='flex items-center gap-2 truncate'>
                      <Globe className='w-3.5 h-3.5 text-slate-400 shrink-0' />
                      <span className='font-mono text-[11px] text-slate-300 truncate'>
                        UID: {booking.icalSourceId}
                      </span>
                    </div>
                    <button
                      type='button'
                      onClick={() => handleCopyUid(booking.icalSourceId)}
                      className='flex items-center gap-1 text-[10px] text-sky-400 hover:text-sky-300 transition shrink-0 ml-2'>
                      {copiedUid ? <Check className='w-3 h-3 text-emerald-400' /> : <Copy className='w-3 h-3' />}
                      <span>{copiedUid ? "Kopierad!" : "Kopiera UID"}</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* VIEW MODE: PRESENTERAR KÄND DATA & SAKNAD DATA */}
            {mode === "view" && (
              <div className='space-y-6'>
                {/* Saknade uppgifter / To-Do checklist för icke-importerade bokningar */}
                {!isImported && (
                  <div className='p-4 rounded-xl border border-slate-800 bg-slate-950/80 space-y-3'>
                    <div className='flex items-center justify-between'>
                      <span className='text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5'>
                        <AlertTriangle className='w-4 h-4 text-amber-400' />
                        <span>Information som saknas / ej genomfört</span>
                      </span>
                      <span className='text-[10px] font-mono text-slate-400'>
                        {missingItems.length === 0
                          ? "Komplett"
                          : `${missingItems.length} punkter att åtgärda`}
                      </span>
                    </div>

                    {missingItems.length === 0 ? (
                      <div className='flex items-center gap-2 p-3 rounded-lg border border-emerald-500/30 bg-emerald-950/20 text-xs text-emerald-300'>
                        <CheckCircle2 className='w-4 h-4 text-emerald-400 shrink-0' />
                        <span>Bokningen är komplett! Alla kontaktuppgifter, priser, avtal och betalningar är registrerade.</span>
                      </div>
                    ) : (
                      <div className='grid grid-cols-1 sm:grid-cols-2 gap-2.5'>
                        {missingItems.map((item, idx) => (
                          <div
                            key={idx}
                            className={`p-2.5 rounded-lg border text-xs flex items-start gap-2.5 ${
                              item.severity === "high"
                                ? "border-amber-500/30 bg-amber-950/15 text-amber-200"
                                : "border-slate-800 bg-slate-900/60 text-slate-300"
                            }`}>
                            <AlertCircle
                              className={`w-4 h-4 shrink-0 mt-0.5 ${
                                item.severity === "high" ? "text-amber-400" : "text-slate-400"
                              }`}
                            />
                            <div className='space-y-0.5 min-w-0'>
                              <div className='font-semibold text-slate-100 text-[11px]'>{item.label}</div>
                              <div className='text-[10px] text-slate-400 leading-tight'>{item.detail}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Översikt & Delmål */}
                <div className='p-4 rounded-xl border border-slate-800 bg-slate-950/60 space-y-3'>
                  <span className='text-xs font-semibold uppercase tracking-wider text-slate-400 block'>
                    Status & Genomförda milstolpar
                  </span>
                  <div className='flex items-center gap-3 flex-wrap'>
                    <div className='flex items-center gap-2'>
                      <span className='text-xs text-slate-400'>Aktuell status:</span>
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold border ${
                          currentStatusConfig.color.badge
                        }`}>
                        {currentStatusConfig.label[locale === "en" ? "en" : "sv"]}
                      </span>
                    </div>

                    {!isImported && (
                      <div className='flex items-center gap-2 ml-auto flex-wrap'>
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${
                            booking.contractSentAt
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                              : "bg-slate-900 text-slate-500 border border-slate-800"
                          }`}>
                          <CheckCircle2
                            className={`w-3.5 h-3.5 ${
                              booking.contractSentAt ? "text-emerald-400" : "text-slate-600"
                            }`}
                          />
                          <span>Kontrakt skickat</span>
                        </span>

                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${
                            booking.depositPaidAt
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                              : "bg-slate-900 text-slate-500 border border-slate-800"
                          }`}>
                          <CheckCircle2
                            className={`w-3.5 h-3.5 ${
                              booking.depositPaidAt ? "text-emerald-400" : "text-slate-600"
                            }`}
                          />
                          <span>Deposition betald</span>
                        </span>

                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${
                            booking.finalPaymentPaidAt
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                              : "bg-slate-900 text-slate-500 border border-slate-800"
                          }`}>
                          <CheckCircle2
                            className={`w-3.5 h-3.5 ${
                              booking.finalPaymentPaidAt ? "text-emerald-400" : "text-slate-600"
                            }`}
                          />
                          <span>Slutbetald</span>
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Två kolumner: Känd data */}
                <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                  {/* Vänster: Vistelse, Avtal & Betalning */}
                  <div className='space-y-4'>
                    {/* Vistelse & Ekonomi */}
                    <div className='p-4 rounded-xl border border-slate-800 bg-slate-950/60 space-y-3'>
                      <span className='text-xs font-semibold uppercase tracking-wider text-slate-400 block'>
                        Vistelse & Ekonomi
                      </span>
                      <div className='space-y-2 text-xs'>
                        <div className='flex items-center justify-between py-1 border-b border-slate-800/60'>
                          <span className='text-slate-400'>Boendeobjekt:</span>
                          <span className='font-semibold text-slate-200'>{booking.objectName}</span>
                        </div>
                        <div className='flex items-center justify-between py-1 border-b border-slate-800/60'>
                          <span className='text-slate-400'>Ankomst (incheckning):</span>
                          <span className='font-semibold text-slate-200'>{booking.startDate} (kl 15:00)</span>
                        </div>
                        <div className='flex items-center justify-between py-1 border-b border-slate-800/60'>
                          <span className='text-slate-400'>Avresa (utcheckning):</span>
                          <span className='font-semibold text-slate-200'>{booking.endDate} (kl 11:00)</span>
                        </div>
                        <div className='flex items-center justify-between py-1 border-b border-slate-800/60'>
                          <span className='text-slate-400'>Vistelselängd:</span>
                          <span className='font-mono font-semibold text-amber-300'>
                            {calculateNights(booking.startDate, booking.endDate)} nätter
                          </span>
                        </div>
                        <div className='flex items-center justify-between py-1 border-b border-slate-800/60'>
                          <span className='text-slate-400'>Sällskap:</span>
                          <span className='text-slate-200'>
                            {booking.adultsCount ?? 1} vuxna
                            {booking.childrenCount ? `, ${booking.childrenCount} barn` : ""}
                            {booking.petsCount ? `, ${booking.petsCount} husdjur` : ""}
                          </span>
                        </div>
                        <div className='flex items-center justify-between py-1 pt-2 font-semibold text-sm'>
                          <span className='text-slate-300'>Överenskommet totalpris:</span>
                          <span className='text-sky-300 font-mono'>
                            {booking.price ? `${booking.price.toLocaleString("sv-SE")} kr` : "Ej fastställt"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Betalningar & Delmål */}
                    {!isImported && (
                      <div className='p-4 rounded-xl border border-slate-800 bg-slate-950/60 space-y-3'>
                        <span className='text-xs font-semibold uppercase tracking-wider text-slate-400 block'>
                          Betalningar & Delmål
                        </span>
                        <div className='space-y-2.5 text-xs'>
                          {/* Deposition */}
                          <div className='p-2.5 rounded-lg border border-slate-800 bg-slate-900/50 space-y-1.5'>
                            <div className='flex items-center justify-between'>
                              <span className='font-semibold text-slate-300'>Deposition / Förskott</span>
                              {booking.depositPaidAt ? (
                                <span className='text-[10px] font-semibold text-emerald-400 flex items-center gap-1'>
                                  <CheckCircle2 className='w-3 h-3' />
                                  <span>Betald: {booking.depositPaidAt}</span>
                                </span>
                              ) : (
                                <span className='text-[10px] font-semibold text-amber-400'>Ej betald</span>
                              )}
                            </div>
                            <div className='flex items-center justify-between text-[11px] text-slate-400'>
                              <span>Belopp: {booking.depositAmount ? `${booking.depositAmount.toLocaleString("sv-SE")} kr` : "Ej angivet"}</span>
                              <span>Förfallodatum: {booking.depositDueDate || "Ej satt"}</span>
                            </div>
                          </div>

                          {/* Slutbetalning */}
                          <div className='p-2.5 rounded-lg border border-slate-800 bg-slate-900/50 space-y-1.5'>
                            <div className='flex items-center justify-between'>
                              <span className='font-semibold text-slate-300'>Slutbetalning</span>
                              {booking.finalPaymentPaidAt ? (
                                <span className='text-[10px] font-semibold text-emerald-400 flex items-center gap-1'>
                                  <CheckCircle2 className='w-3 h-3' />
                                  <span>Betald: {booking.finalPaymentPaidAt}</span>
                                </span>
                              ) : (
                                <span className='text-[10px] font-semibold text-amber-400'>Ej betald</span>
                              )}
                            </div>
                            <div className='flex items-center justify-between text-[11px] text-slate-400'>
                              <span>Belopp: {booking.finalPaymentAmount ? `${booking.finalPaymentAmount.toLocaleString("sv-SE")} kr` : "Ej angivet"}</span>
                              <span>Förfallodatum: {booking.finalPaymentDueDate || "Ej satt"}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Kontrakt & Formalia */}
                    {!isImported && (
                      <div className='p-4 rounded-xl border border-slate-800 bg-slate-950/60 space-y-3'>
                        <span className='text-xs font-semibold uppercase tracking-wider text-slate-400 block'>
                          Avtal & Kontrakt
                        </span>
                        <div className='space-y-1.5 text-xs'>
                          <div className='flex items-center justify-between py-1 border-b border-slate-800/60'>
                            <span className='text-slate-400'>Kontraktsnummer:</span>
                            <span className='font-mono font-semibold text-slate-200'>
                              {booking.contractNumber || "Ej tilldelat"}
                            </span>
                          </div>
                          <div className='flex items-center justify-between py-1 border-b border-slate-800/60'>
                            <span className='text-slate-400'>Kontrakt skickat:</span>
                            <span className='text-slate-200'>{booking.contractSentAt || "Ej skickat"}</span>
                          </div>
                          <div className='flex items-center justify-between py-1'>
                            <span className='text-slate-400'>Kontrakt mottaget / signerat:</span>
                            <span className='text-slate-200'>{booking.contractReceivedAt || "Ej mottaget"}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Höger: Hyresgäst & Anteckningar */}
                  <div className='space-y-4'>
                    {/* Hyresgäst information */}
                    <div className='p-4 rounded-xl border border-slate-800 bg-slate-950/60 space-y-3'>
                      <span className='text-xs font-semibold uppercase tracking-wider text-slate-400 block'>
                        Hyresgästens uppgifter
                      </span>
                      <div className='space-y-2 text-xs'>
                        <div className='flex items-center justify-between py-1 border-b border-slate-800/60'>
                          <span className='text-slate-400'>Namn:</span>
                          <span className='font-semibold text-slate-200'>
                            {booking.customerName || "Ej angivet"}
                          </span>
                        </div>
                        <div className='flex items-center justify-between py-1 border-b border-slate-800/60'>
                          <span className='text-slate-400'>E-postadress:</span>
                          {booking.customerEmail ? (
                            <a
                              href={`mailto:${booking.customerEmail}`}
                              className='text-sky-400 hover:underline flex items-center gap-1 font-mono'>
                              <Mail className='w-3 h-3' />
                              <span>{booking.customerEmail}</span>
                            </a>
                          ) : (
                            <span className='text-slate-500'>Ej angiven</span>
                          )}
                        </div>
                        <div className='flex items-center justify-between py-1 border-b border-slate-800/60'>
                          <span className='text-slate-400'>Mobiltelefon:</span>
                          {booking.customerMobile ? (
                            <a
                              href={`tel:${booking.customerMobile}`}
                              className='text-sky-400 hover:underline flex items-center gap-1 font-mono'>
                              <Smartphone className='w-3 h-3' />
                              <span>{booking.customerMobile}</span>
                            </a>
                          ) : (
                            <span className='text-slate-500'>Ej angiven</span>
                          )}
                        </div>
                        <div className='flex items-center justify-between py-1 border-b border-slate-800/60'>
                          <span className='text-slate-400'>Fast telefon:</span>
                          {booking.customerPhone ? (
                            <a
                              href={`tel:${booking.customerPhone}`}
                              className='text-sky-400 hover:underline flex items-center gap-1 font-mono'>
                              <Phone className='w-3 h-3' />
                              <span>{booking.customerPhone}</span>
                            </a>
                          ) : (
                            <span className='text-slate-500'>Ej angiven</span>
                          )}
                        </div>
                        <div className='flex items-start justify-between py-1'>
                          <span className='text-slate-400'>Postadress:</span>
                          <div className='text-right text-slate-200'>
                            {booking.addressLine1 || booking.city ? (
                              <>
                                <div>{booking.addressLine1}</div>
                                {booking.addressLine2 && <div>{booking.addressLine2}</div>}
                                <div>
                                  {booking.postalCode} {booking.city}
                                </div>
                                <div>{booking.country || "Sverige"}</div>
                              </>
                            ) : (
                              <span className='text-slate-500'>Ej angiven</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Meddelanden och anteckningar */}
                    <div className='p-4 rounded-xl border border-slate-800 bg-slate-950/60 space-y-3'>
                      <span className='text-xs font-semibold uppercase tracking-wider text-slate-400 block'>
                        Anteckningar & Önskemål
                      </span>
                      {booking.customerNotes ? (
                        <div className='p-3 rounded-lg border border-slate-800 bg-slate-900/60 text-xs text-slate-200 space-y-1'>
                          <div className='text-[10px] font-semibold text-slate-400 uppercase tracking-wider'>
                            Gästens meddelande:
                          </div>
                          <p className='whitespace-pre-wrap leading-relaxed'>{booking.customerNotes}</p>
                        </div>
                      ) : (
                        <div className='text-xs text-slate-500 italic'>Inget meddelande från gästen.</div>
                      )}

                      {!isImported && booking.adminNotes && (
                        <div className='p-3 rounded-lg border border-slate-800 bg-slate-900/40 text-xs text-slate-300 space-y-1 mt-2'>
                          <div className='text-[10px] font-semibold text-sky-400 uppercase tracking-wider'>
                            Interna admin-anteckningar:
                          </div>
                          <p className='whitespace-pre-wrap leading-relaxed'>{booking.adminNotes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* EDIT MODE: FULL FORMULÄR FÖR ICKE-IMPORTERADE BOKNINGAR */}
            {mode === "edit" && !isImported && (
              <div className='space-y-6'>
                {/* Status bar */}
                <div className='p-4 rounded-xl border border-slate-800 bg-slate-950/60 space-y-3'>
                  <div className='flex items-center justify-between'>
                    <label className='text-xs font-semibold text-slate-400 uppercase tracking-wider'>
                      Bokningsstatus
                    </label>
                    <div className='flex items-center gap-2'>
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                          editForm.contractSentAt
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                            : "bg-slate-900 text-slate-500 border border-slate-800"
                        }`}>
                        <CheckCircle2
                          className={`w-3.5 h-3.5 ${
                            editForm.contractSentAt ? "text-emerald-400" : "text-slate-600"
                          }`}
                        />
                        <span>Kontrakt skickat</span>
                      </span>

                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                          editForm.depositPaidAt
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                            : "bg-slate-900 text-slate-500 border border-slate-800"
                        }`}>
                        <CheckCircle2
                          className={`w-3.5 h-3.5 ${
                            editForm.depositPaidAt ? "text-emerald-400" : "text-slate-600"
                          }`}
                        />
                        <span>Deposition betald</span>
                      </span>

                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                          editForm.finalPaymentPaidAt
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                            : "bg-slate-900 text-slate-500 border border-slate-800"
                        }`}>
                        <CheckCircle2
                          className={`w-3.5 h-3.5 ${
                            editForm.finalPaymentPaidAt ? "text-emerald-400" : "text-slate-600"
                          }`}
                        />
                        <span>Slutbetald</span>
                      </span>
                    </div>
                  </div>

                  <div className='grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2'>
                    {BOOKING_STATUSES.map((stOption) => {
                      const currentStatus =
                        editForm.status === "CONFIRMED" ? "BOOKED" : editForm.status || "PENDING";
                      const isSelected = currentStatus === stOption.id;
                      const isImportedOption = stOption.id === "IMPORTED";
                      return (
                        <button
                          key={stOption.id}
                          type='button'
                          disabled={isImportedOption && editForm.status !== "IMPORTED"}
                          onClick={() => setEditForm({ ...editForm, status: stOption.id })}
                          className={`flex flex-col items-center justify-center p-2 rounded-xl text-xs font-semibold border transition cursor-pointer text-center ${
                            isSelected
                              ? stOption.color.active
                              : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 hover:bg-slate-800/50"
                          } ${
                            isImportedOption && editForm.status !== "IMPORTED"
                              ? "opacity-35 cursor-not-allowed"
                              : ""
                          }`}>
                          <span className='truncate w-full'>
                            {stOption.label[locale === "en" ? "en" : "sv"]}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                  {/* Vänster kolumn */}
                  <div className='space-y-4'>
                    {/* Vistelse & Tidsperiod */}
                    <div className='p-4 rounded-xl border border-slate-800 bg-slate-950/60 space-y-3'>
                      <div className='flex items-center justify-between'>
                        <span className='text-xs font-semibold text-slate-400 uppercase tracking-wider'>
                          Vistelseperiod
                        </span>
                        <span className='text-xs font-mono text-amber-300 font-semibold'>
                          {calculateNights(editForm.startDate, editForm.endDate)} nätter
                        </span>
                      </div>

                      <div className='grid grid-cols-2 gap-3 text-xs'>
                        <div>
                          <label className='block text-[11px] text-slate-400 mb-1'>Ankomst (Incheckning)</label>
                          <input
                            type='date'
                            value={editForm.startDate || ""}
                            onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })}
                            className='w-full rounded-lg border border-slate-700 bg-slate-900 p-2 text-xs text-white focus:border-sky-500 focus:outline-none'
                          />
                        </div>
                        <div>
                          <label className='block text-[11px] text-slate-400 mb-1'>Avresa (Utcheckning)</label>
                          <input
                            type='date'
                            value={editForm.endDate || ""}
                            onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })}
                            className='w-full rounded-lg border border-slate-700 bg-slate-900 p-2 text-xs text-white focus:border-sky-500 focus:outline-none'
                          />
                        </div>
                      </div>
                    </div>

                    {/* Ekonomi och avtal */}
                    <div className='p-4 rounded-xl border border-slate-800 bg-slate-950/60 space-y-4'>
                      <span className='text-xs font-semibold text-slate-400 uppercase tracking-wider block'>
                        Kontrakt och betalning
                      </span>

                      <div>
                        <label className='block text-[11px] text-slate-400 mb-1'>
                          Överenskommet totalpris (SEK)
                        </label>
                        <div className='relative'>
                          <input
                            type='number'
                            value={editForm.price ?? ""}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                price: e.target.value ? Number(e.target.value) : null,
                              })
                            }
                            placeholder='t.ex. 13000'
                            className='w-full rounded-lg border border-slate-700 bg-slate-900 p-2 pr-12 text-xs text-white font-mono focus:border-sky-500 focus:outline-none'
                          />
                          <span className='absolute right-3 top-2 text-xs text-slate-500'>SEK</span>
                        </div>
                      </div>

                      {/* Deposition */}
                      <div className='border-t border-slate-800/80 pt-3'>
                        <div className='flex items-center justify-between mb-2'>
                          <span className='text-[11px] font-semibold text-slate-300'>
                            Deposition / Förskottsbetalning
                          </span>
                          {editForm.depositPaidAt && (
                            <span className='text-[10px] font-semibold text-emerald-400 flex items-center gap-1'>
                              <CheckCircle2 className='w-3 h-3' />
                              <span>Deposition betald</span>
                            </span>
                          )}
                        </div>
                        <div className='grid grid-cols-3 gap-2 text-xs'>
                          <div>
                            <label className='block text-[10px] text-slate-400 mb-0.5'>Belopp (kr)</label>
                            <input
                              type='number'
                              value={editForm.depositAmount ?? ""}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  depositAmount: e.target.value ? Number(e.target.value) : null,
                                })
                              }
                              placeholder='0'
                              className='w-full rounded-lg border border-slate-700 bg-slate-900 p-1.5 text-xs text-white focus:border-sky-500 focus:outline-none'
                            />
                          </div>
                          <div>
                            <label className='block text-[10px] text-slate-400 mb-0.5'>Förfallodag</label>
                            <input
                              type='date'
                              value={editForm.depositDueDate || ""}
                              onChange={(e) => setEditForm({ ...editForm, depositDueDate: e.target.value })}
                              className='w-full rounded-lg border border-slate-700 bg-slate-900 p-1.5 text-xs text-white focus:border-sky-500 focus:outline-none'
                            />
                          </div>
                          <div>
                            <div className='flex items-center justify-between mb-0.5'>
                              <label className='block text-[10px] text-slate-400'>Betald datum</label>
                              <button
                                type='button'
                                onClick={() =>
                                  setEditForm({
                                    ...editForm,
                                    depositPaidAt: new Date().toISOString().split("T")[0],
                                  })
                                }
                                className='flex items-center gap-0.5 text-[10px] font-semibold text-sky-400 hover:text-sky-300 transition cursor-pointer px-1 rounded bg-sky-950/40 hover:bg-sky-900/60 border border-sky-800/40'>
                                <Clock className='w-2.5 h-2.5' />
                                <span>Nu</span>
                              </button>
                            </div>
                            <input
                              type='date'
                              value={editForm.depositPaidAt || ""}
                              onChange={(e) => setEditForm({ ...editForm, depositPaidAt: e.target.value })}
                              className='w-full rounded-lg border border-slate-700 bg-slate-900 p-1.5 text-xs text-white focus:border-sky-500 focus:outline-none'
                            />
                          </div>
                        </div>
                      </div>

                      {/* Slutbetalning */}
                      <div className='border-t border-slate-800/80 pt-3'>
                        <div className='flex items-center justify-between mb-2'>
                          <span className='text-[11px] font-semibold text-slate-300'>Slutbetalning</span>
                          {editForm.finalPaymentPaidAt && (
                            <span className='text-[10px] font-semibold text-emerald-400 flex items-center gap-1'>
                              <CheckCircle2 className='w-3 h-3' />
                              <span>Slutbetald</span>
                            </span>
                          )}
                        </div>
                        <div className='grid grid-cols-3 gap-2 text-xs'>
                          <div>
                            <label className='block text-[10px] text-slate-400 mb-0.5'>Belopp (kr)</label>
                            <input
                              type='number'
                              value={
                                editForm.finalPaymentAmount ??
                                (editForm.price !== undefined && editForm.depositAmount !== undefined
                                  ? (editForm.price || 0) - (editForm.depositAmount || 0)
                                  : "")
                              }
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  finalPaymentAmount: e.target.value ? Number(e.target.value) : null,
                                })
                              }
                              placeholder='0'
                              className='w-full rounded-lg border border-slate-700 bg-slate-900 p-1.5 text-xs text-white focus:border-sky-500 focus:outline-none'
                            />
                          </div>
                          <div>
                            <label className='block text-[10px] text-slate-400 mb-0.5'>Förfallodag</label>
                            <input
                              type='date'
                              value={editForm.finalPaymentDueDate || ""}
                              onChange={(e) => setEditForm({ ...editForm, finalPaymentDueDate: e.target.value })}
                              className='w-full rounded-lg border border-slate-700 bg-slate-900 p-1.5 text-xs text-white focus:border-sky-500 focus:outline-none'
                            />
                          </div>
                          <div>
                            <div className='flex items-center justify-between mb-0.5'>
                              <label className='block text-[10px] text-slate-400'>Betald datum</label>
                              <button
                                type='button'
                                onClick={() =>
                                  setEditForm({
                                    ...editForm,
                                    finalPaymentPaidAt: new Date().toISOString().split("T")[0],
                                  })
                                }
                                className='flex items-center gap-0.5 text-[10px] font-semibold text-sky-400 hover:text-sky-300 transition cursor-pointer px-1 rounded bg-sky-950/40 hover:bg-sky-900/60 border border-sky-800/40'>
                                <Clock className='w-2.5 h-2.5' />
                                <span>Nu</span>
                              </button>
                            </div>
                            <input
                              type='date'
                              value={editForm.finalPaymentPaidAt || ""}
                              onChange={(e) => setEditForm({ ...editForm, finalPaymentPaidAt: e.target.value })}
                              className='w-full rounded-lg border border-slate-700 bg-slate-900 p-1.5 text-xs text-white focus:border-sky-500 focus:outline-none'
                            />
                          </div>
                        </div>
                      </div>

                      {/* Kontrakt och status */}
                      <div className='border-t border-slate-800/80 pt-3 space-y-3'>
                        <div className='grid grid-cols-2 gap-2 text-xs'>
                          <div>
                            <div className='flex items-center justify-between mb-0.5'>
                              <label className='block text-[10px] text-slate-400'>Kontrakt skickat</label>
                              <button
                                type='button'
                                onClick={() =>
                                  setEditForm({
                                    ...editForm,
                                    contractSentAt: new Date().toISOString().split("T")[0],
                                  })
                                }
                                className='flex items-center gap-0.5 text-[10px] font-semibold text-sky-400 hover:text-sky-300 transition cursor-pointer px-1 rounded bg-sky-950/40 hover:bg-sky-900/60 border border-sky-800/40'>
                                <Clock className='w-2.5 h-2.5' />
                                <span>Nu</span>
                              </button>
                            </div>
                            <input
                              type='date'
                              value={editForm.contractSentAt || ""}
                              onChange={(e) => setEditForm({ ...editForm, contractSentAt: e.target.value })}
                              className='w-full rounded-lg border border-slate-700 bg-slate-900 p-1.5 text-xs text-white focus:border-sky-500 focus:outline-none'
                            />
                          </div>
                          <div>
                            <div className='flex items-center justify-between mb-0.5'>
                              <label className='block text-[10px] text-slate-400'>Kontrakt mottaget</label>
                              <button
                                type='button'
                                onClick={() =>
                                  setEditForm({
                                    ...editForm,
                                    contractReceivedAt: new Date().toISOString().split("T")[0],
                                  })
                                }
                                className='flex items-center gap-0.5 text-[10px] font-semibold text-sky-400 hover:text-sky-300 transition cursor-pointer px-1 rounded bg-sky-950/40 hover:bg-sky-900/60 border border-sky-800/40'>
                                <Clock className='w-2.5 h-2.5' />
                                <span>Nu</span>
                              </button>
                            </div>
                            <input
                              type='date'
                              value={editForm.contractReceivedAt || ""}
                              onChange={(e) => setEditForm({ ...editForm, contractReceivedAt: e.target.value })}
                              className='w-full rounded-lg border border-slate-700 bg-slate-900 p-1.5 text-xs text-white focus:border-sky-500 focus:outline-none'
                            />
                          </div>
                        </div>

                        {/* Knappen "Skapa kontrakt" */}
                        <div className='pt-1'>
                          <button
                            type='button'
                            onClick={() =>
                              setContractNotice(
                                "Kontraktsgenerering (PDF) integreras i nästa fas. Förhandsgranskning och BankID-signering kan kopplas här."
                              )
                            }
                            className='w-full flex items-center justify-center gap-2 rounded-xl border border-sky-600/60 bg-sky-950/40 hover:bg-sky-900/50 p-2 text-xs font-semibold text-sky-200 transition cursor-pointer'>
                            <FileText className='w-3.5 h-3.5' />
                            <span>Skapa kontrakt (PDF)</span>
                          </button>
                          {contractNotice && (
                            <div className='mt-2 p-2 rounded-lg bg-sky-950/80 border border-sky-800/60 text-[11px] text-sky-300 leading-tight'>
                              {contractNotice}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Höger kolumn: Gästuppgifter och sällskap */}
                  <div className='space-y-4'>
                    {/* Hyresgäst Information */}
                    <div className='p-4 rounded-xl border border-slate-800 bg-slate-950/60 space-y-3'>
                      <span className='text-xs font-semibold text-slate-400 uppercase tracking-wider block'>
                        Hyresgäst information
                      </span>

                      <div className='space-y-2 text-xs'>
                        <div>
                          <label className='block text-[11px] text-slate-400 mb-1'>Namn</label>
                          <input
                            type='text'
                            value={editForm.customerName || ""}
                            onChange={(e) => setEditForm({ ...editForm, customerName: e.target.value })}
                            placeholder='För- och efternamn'
                            className='w-full rounded-lg border border-slate-700 bg-slate-900 p-2 text-xs text-white focus:border-sky-500 focus:outline-none'
                          />
                        </div>

                        <div>
                          <label className='block text-[11px] text-slate-400 mb-1'>Adress 1 (Gatuadress)</label>
                          <input
                            type='text'
                            value={editForm.addressLine1 || ""}
                            onChange={(e) => setEditForm({ ...editForm, addressLine1: e.target.value })}
                            placeholder='Arenanders Promenad 37'
                            className='w-full rounded-lg border border-slate-700 bg-slate-900 p-2 text-xs text-white focus:border-sky-500 focus:outline-none'
                          />
                        </div>

                        <div>
                          <label className='block text-[11px] text-slate-400 mb-1'>Adress 2 (c/o, lgh)</label>
                          <input
                            type='text'
                            value={editForm.addressLine2 || ""}
                            onChange={(e) => setEditForm({ ...editForm, addressLine2: e.target.value })}
                            placeholder='Lgh 1201'
                            className='w-full rounded-lg border border-slate-700 bg-slate-900 p-2 text-xs text-white focus:border-sky-500 focus:outline-none'
                          />
                        </div>

                        <div className='grid grid-cols-2 gap-2'>
                          <div>
                            <label className='block text-[11px] text-slate-400 mb-1'>Postnummer</label>
                            <input
                              type='text'
                              value={editForm.postalCode || ""}
                              onChange={(e) => setEditForm({ ...editForm, postalCode: e.target.value })}
                              placeholder='191 37'
                              className='w-full rounded-lg border border-slate-700 bg-slate-900 p-2 text-xs text-white focus:border-sky-500 focus:outline-none'
                            />
                          </div>
                          <div>
                            <label className='block text-[11px] text-slate-400 mb-1'>Ort</label>
                            <input
                              type='text'
                              value={editForm.city || ""}
                              onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                              placeholder='Sollentuna'
                              className='w-full rounded-lg border border-slate-700 bg-slate-900 p-2 text-xs text-white focus:border-sky-500 focus:outline-none'
                            />
                          </div>
                        </div>

                        <div>
                          <label className='block text-[11px] text-slate-400 mb-1'>Land</label>
                          <input
                            type='text'
                            value={editForm.country || ""}
                            onChange={(e) => setEditForm({ ...editForm, country: e.target.value })}
                            placeholder='Sverige'
                            className='w-full rounded-lg border border-slate-700 bg-slate-900 p-2 text-xs text-white focus:border-sky-500 focus:outline-none'
                          />
                        </div>

                        <div className='grid grid-cols-2 gap-2'>
                          <div>
                            <label className='text-[11px] text-slate-400 mb-1 block'>Fast telefon</label>
                            <input
                              type='tel'
                              value={editForm.customerPhone || ""}
                              onChange={(e) => setEditForm({ ...editForm, customerPhone: e.target.value })}
                              placeholder='08-123 45'
                              className='w-full rounded-lg border border-slate-700 bg-slate-900 p-2 text-xs text-white focus:border-sky-500 focus:outline-none'
                            />
                          </div>

                          <div>
                            <label className='text-[11px] text-slate-400 mb-1 block'>Mobiltelefon</label>
                            <input
                              type='tel'
                              value={editForm.customerMobile || ""}
                              onChange={(e) => setEditForm({ ...editForm, customerMobile: e.target.value })}
                              placeholder='070-123 45 67'
                              className='w-full rounded-lg border border-slate-700 bg-slate-900 p-2 text-xs text-white focus:border-sky-500 focus:outline-none'
                            />
                          </div>
                        </div>

                        <div>
                          <label className='text-[11px] text-slate-400 mb-1 block'>E-postadress</label>
                          <input
                            type='email'
                            value={editForm.customerEmail || ""}
                            onChange={(e) => setEditForm({ ...editForm, customerEmail: e.target.value })}
                            placeholder='namn@example.com'
                            className='w-full rounded-lg border border-slate-700 bg-slate-900 p-2 text-xs text-white focus:border-sky-500 focus:outline-none'
                          />
                        </div>
                      </div>
                    </div>

                    {/* Sällskap */}
                    <div className='p-4 rounded-xl border border-slate-800 bg-slate-950/60 space-y-2'>
                      <span className='text-xs font-semibold text-slate-400 uppercase tracking-wider block'>
                        Sällskapets sammansättning
                      </span>
                      <div className='grid grid-cols-3 gap-2 text-xs'>
                        <div>
                          <label className='block text-[10px] text-slate-400 mb-0.5'>Antal vuxna</label>
                          <input
                            type='number'
                            min={1}
                            value={editForm.adultsCount ?? 1}
                            onChange={(e) => setEditForm({ ...editForm, adultsCount: Number(e.target.value) })}
                            className='w-full rounded-lg border border-slate-700 bg-slate-900 p-1.5 text-xs text-white focus:border-sky-500 focus:outline-none'
                          />
                        </div>
                        <div>
                          <label className='block text-[10px] text-slate-400 mb-0.5'>Antal barn</label>
                          <input
                            type='number'
                            min={0}
                            value={editForm.childrenCount ?? 0}
                            onChange={(e) => setEditForm({ ...editForm, childrenCount: Number(e.target.value) })}
                            className='w-full rounded-lg border border-slate-700 bg-slate-900 p-1.5 text-xs text-white focus:border-sky-500 focus:outline-none'
                          />
                        </div>
                        <div>
                          <label className='block text-[10px] text-slate-400 mb-0.5'>Husdjur</label>
                          <input
                            type='number'
                            min={0}
                            value={editForm.petsCount ?? 0}
                            onChange={(e) => setEditForm({ ...editForm, petsCount: Number(e.target.value) })}
                            className='w-full rounded-lg border border-slate-700 bg-slate-900 p-1.5 text-xs text-white focus:border-sky-500 focus:outline-none'
                          />
                        </div>
                      </div>
                    </div>

                    {/* Gästens meddelande */}
                    <div className='p-4 rounded-xl border border-slate-800 bg-slate-950/60 space-y-2'>
                      <label className='text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5'>
                        <FileText className='w-3.5 h-3.5 text-slate-400' />
                        <span>Gästens meddelande / förfrågan</span>
                      </label>
                      <textarea
                        rows={3}
                        value={editForm.customerNotes || ""}
                        onChange={(e) => setEditForm({ ...editForm, customerNotes: e.target.value })}
                        placeholder='Gästens ursprungliga meddelande...'
                        className='w-full rounded-lg border border-slate-700 bg-slate-900 p-2 text-xs text-white focus:border-sky-500 focus:outline-none resize-none'
                      />
                    </div>

                    {/* Interna admin-anteckningar */}
                    <div className='p-4 rounded-xl border border-slate-800 bg-slate-950/60 space-y-2'>
                      <label className='text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5'>
                        <FileText className='w-3.5 h-3.5 text-sky-400' />
                        <span>Interna administratörsanteckningar</span>
                      </label>
                      <textarea
                        rows={3}
                        value={editForm.adminNotes || ""}
                        onChange={(e) => setEditForm({ ...editForm, adminNotes: e.target.value })}
                        placeholder='Noteringar om nycklar, städning, speciella önskemål...'
                        className='w-full rounded-lg border border-slate-700 bg-slate-900 p-2 text-xs text-white focus:border-sky-500 focus:outline-none resize-none'
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className='bg-slate-950 border-t border-slate-800 px-6 py-4 flex items-center justify-between gap-3 shrink-0'>
            <button
              type='button'
              onClick={onClose}
              className='rounded-xl border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition cursor-pointer'>
              Stäng
            </button>

            {/* In View Mode: If not imported, show Redigera button */}
            {mode === "view" && !isImported && (
              <button
                type='button'
                onClick={() => setMode("edit")}
                className='flex items-center gap-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-sky-600/20 transition cursor-pointer'>
                <Edit3 className='w-3.5 h-3.5' />
                <span>Redigera bokning</span>
              </button>
            )}

            {/* In Edit Mode: Save buttons */}
            {mode === "edit" && !isImported && (
              <div className='flex items-center gap-2'>
                <button
                  type='button'
                  onClick={() => setMode("view")}
                  className='rounded-xl border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition cursor-pointer'>
                  Avbryt
                </button>

                <button
                  type='button'
                  disabled={isSaving}
                  onClick={() => handleSave(false)}
                  className='flex items-center gap-1.5 rounded-xl border border-sky-600 bg-sky-950/50 hover:bg-sky-900/60 px-4 py-2 text-xs font-semibold text-sky-200 transition cursor-pointer'>
                  {isSaving && <Loader2 className='w-3.5 h-3.5 animate-spin' />}
                  <Save className='w-3.5 h-3.5' />
                  <span>Spara</span>
                </button>

                <button
                  type='button'
                  disabled={isSaving}
                  onClick={() => handleSave(true)}
                  className='flex items-center gap-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-sky-600/20 transition cursor-pointer'>
                  {isSaving && <Loader2 className='w-3.5 h-3.5 animate-spin' />}
                  <span>Spara & Stäng</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
