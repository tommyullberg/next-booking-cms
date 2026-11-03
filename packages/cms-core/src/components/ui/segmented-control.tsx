import * as React from "react";
import { cn } from "../../utils/cn";

export interface SegmentedControlOption<T extends string = string> {
  value: T;
  label: React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface SegmentedControlProps<T extends string = string> {
  options: SegmentedControlOption<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: "sm" | "default";
  className?: string;
  disabled?: boolean;
}

export function SegmentedControl<T extends string = string>({
  options,
  value,
  onChange,
  size = "default",
  className,
  disabled = false,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="radiogroup"
      className={cn(
        "inline-flex items-center rounded-xl bg-slate-950/80 border border-slate-800 p-1 gap-1 text-slate-400 select-none",
        size === "sm" ? "h-8" : "h-10",
        disabled && "opacity-50 pointer-events-none",
        className
      )}
    >
      {options.map((option) => {
        const isSelected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            disabled={disabled || option.disabled}
            onClick={() => onChange(option.value)}
            className={cn(
              "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg font-medium transition-all outline-none focus-visible:ring-2 focus-visible:ring-sky-500",
              size === "sm"
                ? "px-2.5 py-1 text-xs"
                : "px-3.5 py-1.5 text-xs font-semibold",
              isSelected
                ? "bg-sky-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
            )}
          >
            {option.icon && (
              <span className="shrink-0">{option.icon}</span>
            )}
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
