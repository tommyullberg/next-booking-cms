import * as React from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, ChevronUp } from "lucide-react";

export interface CalendarLegendProps {
  showYearCalendar: boolean;
  onToggleShow: () => void;
}

export function CalendarLegend({
  showYearCalendar,
  onToggleShow,
}: CalendarLegendProps) {
  const t = useTranslations("pricesAvailability");

  return (
    <div className='flex flex-wrap items-center gap-3 text-xs'>
      <div className='flex items-center gap-1.5 text-slate-300'>
        <span className='w-2.5 h-2.5 rounded-sm bg-emerald-500 border border-emerald-400' />
        <span>{t("legend.activePricing")}</span>
      </div>
      <div className='flex items-center gap-1.5 text-slate-300'>
        <span className='w-2.5 h-2.5 rounded-sm bg-rose-600 border border-rose-500' />
        <span>{t("legend.blocked")}</span>
      </div>
      <div className='flex items-center gap-1.5 text-slate-400'>
        <span className='w-2.5 h-2.5 rounded-sm bg-slate-900 border border-slate-700' />
        <span>{t("legend.closed")}</span>
      </div>
      <div className='flex items-center gap-1.5 text-sky-300/90'>
        <span className='w-3.5 h-3.5 rounded-sm bg-sky-950/30 border border-sky-500/10 text-[9px] font-mono text-sky-400/70 flex items-center justify-center'>
          w
        </span>
        <span>{t("weekNumberLabel")}</span>
      </div>

      <button
        type='button'
        aria-expanded={showYearCalendar}
        onClick={onToggleShow}
        className='ml-2 flex items-center gap-1 text-slate-400 hover:text-white transition outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded'>
        {showYearCalendar ? (
          <>
            <span>{t("hideCalendar")}</span>
            <ChevronUp className='w-4 h-4' />
          </>
        ) : (
          <>
            <span>{t("showCalendar")}</span>
            <ChevronDown className='w-4 h-4' />
          </>
        )}
      </button>
    </div>
  );
}
