import * as React from "react";

export interface WeekdayHeaderProps {
  isSv: boolean;
  weekdayInitials: readonly string[];
}

export function WeekdayHeader({ isSv, weekdayInitials }: WeekdayHeaderProps) {
  return (
    <div className='calendar-weekday-grid'>
      <div className='text-sky-400/70 font-mono font-bold text-[9px] flex items-center justify-center'>
        {isSv ? "V." : "Wk"}
      </div>
      {weekdayInitials.map((w, idx) => (
        <div key={idx} className='text-slate-500'>
          {w}
        </div>
      ))}
    </div>
  );
}
