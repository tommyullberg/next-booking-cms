import * as React from "react";

export interface WeekNumberButtonProps {
  weekNumber: number;
  title: string;
  ariaLabel: string;
  onClick: () => void;
}

export function WeekNumberButton({
  weekNumber,
  title,
  ariaLabel,
  onClick,
}: WeekNumberButtonProps) {
  return (
    <button
      type='button'
      title={title}
      aria-label={ariaLabel}
      onClick={onClick}
      className='calendar-week-number'>
      {weekNumber}
    </button>
  );
}
