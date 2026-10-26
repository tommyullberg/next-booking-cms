"use client";

import React, { useState } from "react";
import { useBookingsQuery, useCreateBookingMutation } from "./hooks";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

export interface BookingCalendarProps {
  objectId: string;
  objectName?: string;
  basePrice?: number;
  className?: string;
}

export function BookingCalendar({
  objectId,
  objectName = "Boende",
  basePrice = 2500,
  className = "",
}: BookingCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);

  // Form modal state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [guestsCount, setGuestsCount] = useState(2);
  const [petsCount, setPetsCount] = useState(0);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  const { data: bookings = [], isLoading } = useBookingsQuery(objectId);
  const createMutation = useCreateBookingMutation();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    "Januari",
    "Februari",
    "Mars",
    "April",
    "Maj",
    "Juni",
    "Juli",
    "Augusti",
    "September",
    "Oktober",
    "November",
    "December",
  ];

  const firstDayOfMonth = new Date(year, month, 1);
  const startingDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7; // Monday = 0
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Filter active blocking bookings (APPROVED, PENDING or IMPORTED from Booking.com / iCal)
  const activeBookings = bookings.filter(
    (b) => b.status === "APPROVED" || b.status === "PENDING" || b.status === "IMPORTED",
  );

  // Analyze occupancy per day for half-day logic (checkout in morning, checkin in afternoon)
  const getDayBookingInfo = (dateStr: string) => {
    let isCheckOut = false; // someone departs in morning
    let isCheckIn = false; // someone arrives in afternoon
    let isStayNight = false; // middle of stay (full night occupied)

    for (const b of activeBookings) {
      if (b.endDate === dateStr) {
        isCheckOut = true;
      }
      if (b.startDate === dateStr) {
        isCheckIn = true;
      }
      if (b.startDate < dateStr && dateStr < b.endDate) {
        isStayNight = true;
      }
    }

    const morningBlocked = isStayNight || isCheckOut;
    const afternoonBlocked = isStayNight || isCheckIn;
    const isFullBlocked = morningBlocked && afternoonBlocked;
    const isHalfDay = (morningBlocked && !afternoonBlocked) || (!morningBlocked && afternoonBlocked);

    return {
      isCheckOut,
      isCheckIn,
      isStayNight,
      morningBlocked,
      afternoonBlocked,
      isFullBlocked,
      isHalfDay,
    };
  };

  // Verify that all nights strictly between start and end date are free
  const canSelectAsEndDate = (start: string, end: string): boolean => {
    if (end <= start) return false;
    let curr = new Date(start);
    const target = new Date(end);

    while (curr < target) {
      const checkStr = curr.toISOString().split("T")[0];
      const isNightOccupied = activeBookings.some((b) => {
        return checkStr >= b.startDate && checkStr < b.endDate;
      });
      if (isNightOccupied) return false;
      curr.setDate(curr.getDate() + 1);
    }
    return true;
  };

  const handleDayClick = (dayNumber: number) => {
    const dayStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNumber).padStart(2, "0")}`;
    const info = getDayBookingInfo(dayStr);

    if (info.isFullBlocked) {
      return;
    }

    // 1. Initial click or resetting selection
    if (!startDate || (startDate && endDate)) {
      if (!info.afternoonBlocked) {
        setStartDate(dayStr);
        setEndDate(null);
      }
      return;
    }

    // 2. Selecting end date
    if (startDate && !endDate) {
      if (dayStr <= startDate) {
        if (!info.afternoonBlocked) {
          setStartDate(dayStr);
          setEndDate(null);
        }
      } else {
        if (canSelectAsEndDate(startDate, dayStr)) {
          setEndDate(dayStr);
        } else {
          // If range crosses a blocked night, restart selection on clicked day if afternoon is free
          if (!info.afternoonBlocked) {
            setStartDate(dayStr);
            setEndDate(null);
          }
        }
      }
    }
  };

  const nights =
    startDate && endDate
      ? Math.max(1, Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000))
      : 0;
  const estimatedPrice = nights * totalPricePerNight();

  function totalPricePerNight(): number {
    return basePathPrice() + (petsCount > 0 ? 300 : 0);
  }

  function basePathPrice(): number {
    return totalPrice(basePrice);
  }

  function totalPrice(p: number): number {
    return p;
  }

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate) return;

    setBookingError(null);
    try {
      await createMutation.mutateAsync({
        objectId,
        startDate,
        endDate,
        customerName,
        customerEmail,
        customerPhone,
        guestsCount,
        petsCount,
      });
      setBookingSuccess(true);
      setTimeout(() => {
        setIsFormOpen(false);
        setBookingSuccess(false);
        setStartDate(null);
        setEndDate(null);
      }, 3000);
    } catch (err: any) {
      setBookingError(err.message || "Bokningsförfrågan misslyckades.");
    }
  };

  return (
    <div
      className={`rounded-3xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900 ${className}`}>
      <div className='flex items-center justify-between mb-6'>
        <div>
          <h3 className='text-lg font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2'>
            <CalendarIcon className='w-5 h-5 text-sky-600 dark:text-sky-400' />
            <span>Tillgänglighet & Bokningskalender</span>
          </h3>
          <p className='text-xs text-slate-500 dark:text-slate-400 mt-0.5'>
            Välj in- och utcheckningsdatum för {objectName}.
          </p>
        </div>

        <div className='flex items-center gap-2'>
          <button
            type='button'
            onClick={handlePrevMonth}
            className='p-2 rounded-xl border border-slate-200 hover:bg-slate-100 dark:border-slate-800 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition'>
            <ChevronLeft className='w-4 h-4' />
          </button>
          <span className='text-xs font-bold text-slate-800 dark:text-slate-200 min-w-28 text-center'>
            {monthNames[month]} {year}
          </span>
          <button
            type='button'
            onClick={handleNextMonth}
            className='p-2 rounded-xl border border-slate-200 hover:bg-slate-100 dark:border-slate-800 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition'>
            <ChevronRight className='w-4 h-4' />
          </button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className='grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-slate-400 mb-2'>
        <span>Mån</span>
        <span>Tis</span>
        <span>Ons</span>
        <span>Tor</span>
        <span>Fre</span>
        <span>Lör</span>
        <span>Sön</span>
      </div>

      {/* Days grid */}
      <div className='grid grid-cols-7 gap-1.5 text-xs'>
        {Array.from({ length: startingDayOfWeek }).map((_, i) => (
          <div key={`empty-${i}`} className='h-11' />
        ))}

        {Array.from({ length: daysInMonth }).map((_, i) => {
          const dayNumber = i + 1;
          const dayStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNumber).padStart(2, "0")}`;
          const info = getDayBookingInfo(dayStr);
          const isStart = startDate === dayStr;
          const isEnd = endDate === dayStr;
          const inRange =
            startDate && endDate && new Date(dayStr) > new Date(startDate) && new Date(dayStr) < new Date(endDate);

          // Left side: ending stay / checkout (always 50% to the left)
          let leftColor: string | null = null;
          if (isEnd) {
            leftColor = "bg-sky-600 dark:bg-sky-500";
          } else if (info.morningBlocked) {
            leftColor = "bg-rose-200/90 dark:bg-rose-950/70";
          }

          // Right side: starting stay / checkin (always calc(50% - 3px) to the right)
          let rightColor: string | null = null;
          if (isStart) {
            rightColor = "bg-sky-600 dark:bg-sky-500";
          } else if (info.afternoonBlocked) {
            rightColor = "bg-rose-200/90 dark:bg-rose-950/70";
          }

          // Text styling
          let textClass = "text-slate-700 dark:text-slate-200";
          if (isStart || isEnd) {
            textClass = "text-white font-bold drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]";
          } else if (inRange) {
            textClass = "text-sky-900 dark:text-sky-200 font-bold";
          } else if (info.isStayNight && !info.isCheckOut && !info.isCheckIn) {
            textClass = "text-rose-600/80 dark:text-rose-400/80 line-through font-medium";
          } else if (info.isFullBlocked) {
            textClass = "text-rose-700 dark:text-rose-300 font-bold drop-shadow-sm";
          } else if (info.isHalfDay) {
            textClass = "text-slate-900 dark:text-white font-bold drop-shadow-[0_1px_1px_rgba(0,0,0,0.6)]";
          }

          // Tooltip description
          let tooltipTitle = `Ledig: ${dayStr}`;
          if (info.isFullBlocked) {
            tooltipTitle = `Upptaget / Fullbokat: ${dayStr}`;
          } else if (info.isCheckOut && !info.isCheckIn) {
            tooltipTitle = `${dayStr}: Avslutande gäst lämnar kl 11:00. Ledig för ny incheckning från kl 15:00.`;
          } else if (info.isCheckIn && !info.isCheckOut) {
            tooltipTitle = `${dayStr}: Ledig för utcheckning fram till kl 11:00. Ny incheckning anländer kl 15:00.`;
          }

          const isClickable = !info.isFullBlocked;

          return (
            <button
              key={dayNumber}
              type='button'
              disabled={!isClickable}
              onClick={() => handleDayClick(dayNumber)}
              title={tooltipTitle}
              className={`relative h-11 rounded-xl overflow-hidden flex items-center justify-center transition border border-slate-200/60 dark:border-slate-800 select-none group bg-slate-50 dark:bg-slate-900 ${
                isClickable
                  ? "hover:ring-2 hover:ring-sky-500/60 hover:ring-offset-1 dark:hover:ring-offset-slate-900 cursor-pointer"
                  : "cursor-not-allowed opacity-90"
              }`}>
              {/* Case 1: In-stay range (entire day selected in-between) */}
              {inRange && <div className='absolute inset-0 bg-sky-100 dark:bg-sky-900/40 rounded-xl' />}

              {/* Case 2: Full day blocked within a continuous stay */}
              {!inRange && info.isStayNight && !info.isCheckOut && !info.isCheckIn && (
                <div className='absolute inset-0 bg-rose-200/90 dark:bg-rose-950/70 rounded-xl' />
              )}

              {/* Case 3: Split vertical representation with rounded corners on each half */}
              {!inRange && !(info.isStayNight && !info.isCheckOut && !info.isCheckIn) && (
                <>
                  {/* Avslutande halvdag (vänster halva, avrundad på insidan och utsidan) */}
                  {leftColor && (
                    <div
                      className={`absolute top-0 bottom-0 left-0 w-[calc(50%-1.5px)] ${leftColor} rounded-l-xl rounded-r-md transition-colors`}
                    />
                  )}

                  {/* Mittre 3px spalt / vertikal linje vid delning */}
                  {(leftColor || rightColor) && (
                    <div className='absolute top-0 bottom-0 left-[calc(50%-1.5px)] w-[3px] bg-slate-300 dark:bg-slate-950 pointer-events-none z-[1]' />
                  )}

                  {/* Påbörjad tid (höger halva, avrundad på insidan och utsidan) */}
                  {rightColor && (
                    <div
                      className={`absolute top-0 bottom-0 right-0 w-[calc(50%-1.5px)] ${rightColor} rounded-r-xl rounded-l-md transition-colors`}
                    />
                  )}
                </>
              )}

              <span className={`relative z-10 text-xs ${textClass}`}>{dayNumber}</span>
            </button>
          );
        })}
      </div>

      {/* Calendar Legend */}
      <div className='mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2'>
        <div className='grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-[11px] text-slate-600 dark:text-slate-400'>
          <div className='flex items-center gap-2'>
            <span className='w-4 h-4 rounded-md bg-sky-600 shadow-sm inline-block shrink-0' />
            <span>Valda datum</span>
          </div>

          <div className='flex items-center gap-2'>
            <span className='w-4 h-4 rounded-md bg-rose-200/90 dark:bg-rose-950/70 border border-rose-300/60 dark:border-rose-900 inline-block shrink-0' />
            <span>Upptaget (hel dag)</span>
          </div>

          <div className='flex items-center gap-2'>
            <span className='relative w-5 h-4 rounded-md overflow-hidden border border-slate-300 dark:border-slate-700 inline-flex shrink-0 bg-slate-50 dark:bg-slate-900'>
              <span className='w-1/2 h-full bg-rose-200/90 dark:bg-rose-950/70' />
              <span className='w-[3px] h-full bg-slate-400 dark:bg-slate-950' />
              <span className='flex-1 h-full bg-slate-50 dark:bg-slate-900' />
            </span>
            <span>Halvdag (byte möjlig)</span>
          </div>

          <div className='flex items-center gap-2'>
            <span className='w-4 h-4 rounded-md bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 inline-block shrink-0' />
            <span>Helt ledigt</span>
          </div>
        </div>

        <p className='text-[11px] text-slate-500 dark:text-slate-400 leading-normal'>
          Dagar för in- och utcheckning visas som halvdagar.
        </p>
      </div>

      {/* Selection Summary and Booking Trigger */}
      <div className='mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-slate-100 dark:border-slate-800 pt-4'>
        <div className='text-xs'>
          {startDate ? (
            <div className='flex items-center gap-2'>
              <span className='font-semibold text-slate-900 dark:text-white'>
                Valt: {startDate} {endDate ? `→ ${endDate} (${nights} nätter)` : "(Välj utcheckning)"}
              </span>
              {nights > 0 && (
                <span className='text-sky-600 dark:text-sky-400 font-bold'>
                  Ca {estimatedPrice.toLocaleString("sv-SE")} SEK
                </span>
              )}
            </div>
          ) : (
            <span className='text-slate-500'>Klicka på kalendern för att välja datum.</span>
          )}
        </div>

        {startDate && endDate && (
          <button
            type='button'
            onClick={() => setIsFormOpen(true)}
            className='rounded-xl bg-sky-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-sky-600/20 hover:bg-sky-500 transition'>
            Boka dessa datum
          </button>
        )}
      </div>

      {/* Booking Modal */}
      {isFormOpen && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4'>
          <div className='w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-white'>
            <h3 className='text-lg font-bold mb-1'>Slutför bokningsförfrågan</h3>
            <p className='text-xs text-slate-500 dark:text-slate-400 mb-4'>
              {objectName}: {startDate} till {endDate} ({nights} nätter)
            </p>

            {bookingSuccess ? (
              <div className='flex flex-col items-center justify-center p-6 text-center text-emerald-600 dark:text-emerald-400 space-y-2'>
                <CheckCircle2 className='w-12 h-12' />
                <h4 className='font-bold text-sm'>Tack för din förfrågan!</h4>
                <p className='text-xs text-slate-500'>
                  En bekräftelsekopia har skickats till din e-post. Datumen är nu reserverade preliminärt.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitBooking} className='space-y-4'>
                {bookingError && (
                  <div className='flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-600 dark:bg-rose-950/20 dark:text-rose-400'>
                    <AlertCircle className='w-4 h-4 shrink-0' />
                    <span>{bookingError}</span>
                  </div>
                )}

                <div>
                  <label className='block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1'>
                    För- och efternamn
                  </label>
                  <input
                    type='text'
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder='Anna Andersson'
                    className='w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent p-2.5 text-xs text-slate-900 dark:text-white focus:border-sky-500 focus:outline-none'
                  />
                </div>

                <div>
                  <label className='block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1'>
                    E-postadress
                  </label>
                  <input
                    type='email'
                    required
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder='anna@example.com'
                    className='w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent p-2.5 text-xs text-slate-900 dark:text-white focus:border-sky-500 focus:outline-none'
                  />
                </div>

                <div>
                  <label className='block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1'>
                    Telefonnummer
                  </label>
                  <input
                    type='tel'
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder='+46 70 123 4567'
                    className='w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent p-2.5 text-xs text-slate-900 dark:text-white focus:border-sky-500 focus:outline-none'
                  />
                </div>

                <div className='grid grid-cols-2 gap-3'>
                  <div>
                    <label className='block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1'>
                      Antal personer
                    </label>
                    <input
                      type='number'
                      min={1}
                      max={12}
                      value={guestsCount}
                      onChange={(e) => setGuestsCount(Number(e.target.value))}
                      className='w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent p-2.5 text-xs text-slate-900 dark:text-white focus:border-sky-500 focus:outline-none'
                    />
                  </div>

                  <div>
                    <label className='block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1'>
                      Antal husdjur
                    </label>
                    <input
                      type='number'
                      min={0}
                      max={4}
                      value={petsCount}
                      onChange={(e) => setPetsCount(Number(e.target.value))}
                      className='w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent p-2.5 text-xs text-slate-900 dark:text-white focus:border-sky-500 focus:outline-none'
                    />
                  </div>
                </div>

                <div className='border-t border-slate-200 dark:border-slate-800 pt-3 flex items-center justify-between'>
                  <span className='text-xs text-slate-500'>Uppskattat totalpris:</span>
                  <span className='text-sm font-bold text-sky-600 dark:text-sky-400'>
                    {estimatedPrice.toLocaleString("sv-SE")} SEK
                  </span>
                </div>

                <div className='flex items-center justify-end gap-2 pt-2'>
                  <button
                    type='button'
                    onClick={() => setIsFormOpen(false)}
                    className='px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg'>
                    Avbryt
                  </button>
                  <button
                    type='submit'
                    disabled={createMutation.isPending}
                    className='flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-sky-600 text-white hover:bg-sky-500'>
                    {createMutation.isPending && <Loader2 className='w-3.5 h-3.5 animate-spin' />}
                    <span>Skicka bokningsförfrågan</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
