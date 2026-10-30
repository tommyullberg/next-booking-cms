"use client";

import React, { useState } from "react";
import { useAvailabilitySearchQuery, useCreateBookingMutation } from "./hooks";
import { Search, Users, Calendar, Dog, Sparkles, CheckCircle2, Loader2, ArrowRight } from "lucide-react";
import { SearchMatchItem } from "./types";
import { DatePicker } from "../components/ui/date-picker";
import { ModalPortal } from "../components/ui/modal-portal";

export interface AvailabilitySearchProps {
  onSelectBooking?: (item: SearchMatchItem) => void;
  className?: string;
}

export function AvailabilitySearch({
  onSelectBooking,
  className = "",
}: AvailabilitySearchProps) {
  // Tomorrow as default start, +3 days as default end
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const inThreeDays = new Date(tomorrow);
  inThreeDays.setDate(inThreeDays.getDate() + 3);

  const [startDate, setStartDate] = useState(tomorrow.toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(inThreeDays.toISOString().split("T")[0]);
  const [guests, setGuests] = useState(2);
  const [pets, setPets] = useState(0);
  const [flexDays, setFlexDays] = useState(2);
  const [searchTriggered, setSearchTriggered] = useState(false);

  const [bookingModalItem, setBookingModalItem] = useState<SearchMatchItem | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const createMutation = useCreateBookingMutation();

  const { data, isLoading } = useAvailabilitySearchQuery({
    startDate,
    endDate,
    guests,
    pets,
    flexDays,
    enabled: searchTriggered,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchTriggered(true);
  };

  const handleBookItem = (item: SearchMatchItem) => {
    if (onSelectBooking) {
      onSelectBooking(item);
    } else {
      setBookingModalItem(item);
    }
  };

  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingModalItem) return;

    await createMutation.mutateAsync({
      objectId: bookingModalItem.object.id,
      startDate: bookingModalItem.startDate,
      endDate: bookingModalItem.endDate,
      customerName,
      customerEmail,
      customerPhone,
      guestsCount: guests,
      petsCount: pets,
    });

    setBookingSuccess(true);
    setTimeout(() => {
      setBookingSuccess(false);
      setBookingModalItem(null);
    }, 3000);
  };

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Search Input Bar */}
      <form
        onSubmit={handleSearch}
        className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-800 dark:bg-slate-900/95 dark:shadow-2xl grid grid-cols-1 md:grid-cols-5 gap-3 items-end transition-colors"
      >
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
            <span>Incheckning</span>
          </label>
          <DatePicker
            value={startDate}
            onChange={setStartDate}
            locale="sv"
            allowClear={false}
            minDate={new Date().toISOString().split("T")[0]}
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
            <span>Utcheckning</span>
          </label>
          <DatePicker
            value={endDate}
            onChange={setEndDate}
            locale="sv"
            allowClear={false}
            minDate={startDate}
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
            <span>Personer / Djur</span>
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            <select
              value={guests}
              onChange={(e) => setGuests(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-950/70 p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-sky-500 transition-colors"
            >
              {[1, 2, 3, 4, 5, 6, 8, 10].map((n) => (
                <option key={n} value={n} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                  {n} pers
                </option>
              ))}
            </select>
            <select
              value={pets}
              onChange={(e) => setPets(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-950/70 p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-sky-500 transition-colors"
            >
              <option value={0} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Inga djur</option>
              <option value={1} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">1 husdjur</option>
              <option value={2} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">2 husdjur</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Flexibla datum</span>
          </label>
          <select
            value={flexDays}
            onChange={(e) => setFlexDays(Number(e.target.value))}
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-950/70 p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-sky-500 transition-colors"
          >
            <option value={0} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Exakta datum (+- 0 dagar)</option>
            <option value={1} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">+- 1 dag</option>
            <option value={2} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">+- 2 dagar (rekommenderas)</option>
            <option value={3} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">+- 3 dagar</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="h-10 w-full flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-sky-600/20 hover:bg-sky-500 transition disabled:opacity-50"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )}
          <span>Sök ledigt boende</span>
        </button>
      </form>

      {/* Results Presentation View */}
      {searchTriggered && (
        <div className="space-y-8">
          {/* 1. Exact Matches */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <span className="h-3 w-3 rounded-full bg-emerald-500 inline-block shadow-sm shadow-emerald-500/50" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Exakta träffar ({data?.exactMatches?.length || 0})
              </h3>
            </div>

            {data?.exactMatches?.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/40 p-6 text-center text-xs text-slate-600 dark:text-slate-400">
                Inga exakta matchningar hittades för de valda datumen. Se alternativa förslag nedan.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data?.exactMatches.map((item) => (
                  <div
                    key={`${item.object.id}-${item.startDate}`}
                    className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg dark:border-slate-800 dark:bg-slate-900/95 flex flex-col justify-between transition-colors"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          {item.object.name}
                        </h4>
                        <span className="rounded-full bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 text-[11px] font-semibold">
                          Ledig
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mb-3">
                        {item.startDate} till {item.endDate} ({item.nights} nätter) · {item.object.bed_count} bäddar · {item.object.size_sqm || 140} kvm
                      </p>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3">
                      <div>
                        <span className="text-xs text-slate-500 dark:text-slate-400">Totalpris:</span>
                        <div className="text-base font-bold text-sky-700 dark:text-sky-400 font-mono">
                          {item.totalPrice.toLocaleString("sv-SE")} SEK
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleBookItem(item)}
                        className="flex items-center gap-1.5 rounded-xl bg-sky-700 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-600 transition shadow-md shadow-sky-700/20"
                      >
                        <span>Boka nu</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 2. Alternative Suggestions (+- X days) */}
          {flexDays > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2.5">
                <span className="h-3 w-3 rounded-full bg-amber-500 inline-block shadow-sm shadow-amber-500/50" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Alternativa förslag inom +-{flexDays} dagar ({data?.alternatives?.length || 0})
                </h3>
              </div>

              {data?.alternatives?.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/40 p-6 text-center text-xs text-slate-600 dark:text-slate-400">
                  Inga alternativa datum tillgängliga inom vald tidsram.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {data?.alternatives.map((item) => (
                    <div
                      key={`alt-${item.object.id}-${item.startDate}`}
                      className="rounded-3xl border border-amber-300/40 bg-amber-50/60 p-5 shadow-lg dark:border-amber-500/30 dark:bg-slate-900/95 flex flex-col justify-between hover:border-amber-500/50 transition-colors"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                            {item.object.name}
                          </h4>
                          <span className="rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 px-2.5 py-0.5 text-[11px] font-semibold">
                            {item.offsetDays && item.offsetDays > 0 ? `+${item.offsetDays} dagar` : `${item.offsetDays} dagar`}
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 dark:text-slate-300 mb-3">
                          Föreslaget datum: <strong className="font-semibold text-slate-900 dark:text-amber-300">{item.startDate} till {item.endDate}</strong> ({item.nights} nätter)
                        </p>
                      </div>

                      <div className="flex items-center justify-between border-t border-amber-500/20 dark:border-slate-800 pt-3">
                        <div>
                          <span className="text-xs text-slate-500 dark:text-slate-400">Totalpris:</span>
                          <div className="text-base font-bold text-slate-900 dark:text-white font-mono">
                            {item.totalPrice.toLocaleString("sv-SE")} SEK
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleBookItem(item)}
                          className="flex items-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-500 transition shadow-md shadow-amber-600/20"
                        >
                          <span>Välj datum</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Booking Modal */}
      {bookingModalItem && (
        <ModalPortal>
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-white">
            <h3 className="text-lg font-bold mb-1">Bekräfta bokningsförfrågan</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              {bookingModalItem.object.name}: {bookingModalItem.startDate} till {bookingModalItem.endDate} ({bookingModalItem.nights} nätter)
            </p>

            {bookingSuccess ? (
              <div className="flex flex-col items-center justify-center p-6 text-center text-emerald-600 dark:text-emerald-400 space-y-2">
                <CheckCircle2 className="w-12 h-12" />
                <h4 className="font-bold text-sm">Bokningsförfrågan mottagen!</h4>
                <p className="text-xs text-slate-500">
                  Bekräftelse har skickats till din e-post och perioden är nu reserverad.
                </p>
              </div>
            ) : (
              <form onSubmit={handleConfirmBooking} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium mb-1 text-slate-700 dark:text-slate-300">Namn</label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="För- och efternamn"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-950/70 p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1 text-slate-700 dark:text-slate-300">E-postadress</label>
                  <input
                    type="email"
                    required
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="namn@example.com"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-950/70 p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1 text-slate-700 dark:text-slate-300">Telefon</label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="+46 70 123 4567"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-950/70 p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div className="border-t border-slate-200 dark:border-slate-800 pt-3 flex items-center justify-between">
                  <span className="text-xs text-slate-500">Totalt:</span>
                  <span className="text-sm font-bold text-sky-700 dark:text-sky-400">
                    {bookingModalItem.totalPrice.toLocaleString("sv-SE")} SEK
                  </span>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setBookingModalItem(null)}
                    className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                  >
                    Avbryt
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-sky-700 text-white hover:bg-sky-600"
                  >
                    {createMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Skicka förfrågan</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </ModalPortal>
    )}
  </div>
);
}
