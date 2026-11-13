import * as React from "react";
import { useTranslations } from "next-intl";
import { MousePointerClick, Plus, Ban, X } from "lucide-react";
import { Button } from "@cms/components/ui";
import type { EffectiveRange } from "./types";

export interface CalendarRangeActionBarProps {
  effectiveRange: EffectiveRange;
  onCreatePricePeriod: (startStr: string, endStr: string) => void;
  onCreateBlockedPeriod: (startStr: string, endStr: string) => void;
  onClearSelection: () => void;
  formatWeekSpan: (
    startWeek?: number | null,
    startYear?: number | null,
    endWeek?: number | null,
    endYear?: number | null
  ) => string;
}

export function CalendarRangeActionBar({
  effectiveRange,
  onCreatePricePeriod,
  onCreateBlockedPeriod,
  onClearSelection,
  formatWeekSpan,
}: CalendarRangeActionBarProps) {
  const t = useTranslations("pricesAvailability");
  const tCommon = useTranslations("common");

  return (
    <div className='mx-4 mt-4 p-3 rounded-xl border border-amber-500/40 bg-amber-500/10 backdrop-blur flex flex-wrap items-center justify-between gap-3 animate-in fade-in'>
      <div className='flex items-center gap-2.5'>
        <div className='h-8 w-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0'>
          <MousePointerClick className='w-4 h-4' />
        </div>
        <div>
          <div className='text-xs font-bold text-white flex items-center gap-2'>
            <span>{t("selectedRangeLabel")}</span>
            <span className='font-mono text-amber-300'>
              {effectiveRange.startStr} – {effectiveRange.endStr}
            </span>
            <span className='text-[11px] font-normal text-slate-400'>
              ({effectiveRange.daysCount} {effectiveRange.daysCount === 1 ? t("daySingle") : t("dayPlural")},{" "}
              {formatWeekSpan(
                effectiveRange.startIso.week,
                effectiveRange.startIso.year,
                effectiveRange.endIso.week,
                effectiveRange.endIso.year
              )})
            </span>
          </div>
          <div className='text-[11px] text-amber-200/80 pt-0.5'>
            {!effectiveRange.isFinalized
              ? t("rangeSelectHelpClick")
              : t("rangeSelectedHelpAction")}
          </div>
        </div>
      </div>

      <div className='flex items-center gap-2'>
        <Button
          type='button'
          onClick={() => onCreatePricePeriod(effectiveRange.startStr, effectiveRange.endStr)}
          className='h-auto rounded-xl bg-amber-500 px-3.5 py-1.5 text-xs font-semibold text-slate-950 shadow-md shadow-amber-500/20 hover:bg-amber-400 transition border-none'>
          <Plus className='w-3.5 h-3.5' />
          <span>{t("newSeason")}</span>
        </Button>

        <Button
          type='button'
          variant='outline'
          onClick={() => onCreateBlockedPeriod(effectiveRange.startStr, effectiveRange.endStr)}
          className='h-auto rounded-xl border-rose-500/40 bg-rose-500/20 px-3.5 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/30 hover:text-rose-200 transition'>
          <Ban className='w-3.5 h-3.5' />
          <span>{t("newBlocked")}</span>
        </Button>

        <Button
          type='button'
          variant='ghost'
          size='icon'
          onClick={onClearSelection}
          className='h-7 w-7 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition'
          aria-label={tCommon("cancel")}
          title={tCommon("cancel")}>
          <X className='w-4 h-4' />
        </Button>
      </div>
    </div>
  );
}
