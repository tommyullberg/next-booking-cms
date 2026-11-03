"use client";

import * as React from "react";
import { cn } from "../../utils/cn";

export interface SegmentedControlOption<T extends string | number = string | number> {
  value: T;
  label: React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface SegmentedControlProps<T extends string | number = string | number> {
  options: SegmentedControlOption<T>[];
  value?: T;
  defaultValue?: T;
  onChange?: (value: T) => void;
  size?: "sm" | "default";
  className?: string;
  disabled?: boolean;
  "aria-label"?: string;
  "aria-labelledby"?: string;
}

export function SegmentedControl<T extends string | number = string | number>({
  options,
  value: valueProp,
  defaultValue,
  onChange,
  size = "default",
  className,
  disabled = false,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
}: SegmentedControlProps<T>) {
  const isControlled = valueProp !== undefined;
  const [uncontrolledValue, setUncontrolledValue] = React.useState<T | undefined>(
    defaultValue ?? options.find((o) => !o.disabled)?.value ?? options[0]?.value
  );

  const activeValue = isControlled ? valueProp : uncontrolledValue;

  const buttonRefs = React.useRef<(HTMLButtonElement | null)[]>([]);

  // Update buttonRefs length when options change
  React.useEffect(() => {
    buttonRefs.current = buttonRefs.current.slice(0, options.length);
  }, [options.length]);

  const handleSelect = (nextValue: T, focusIndex?: number) => {
    if (!isControlled) {
      setUncontrolledValue(nextValue);
    }
    onChange?.(nextValue);
    if (focusIndex !== undefined) {
      buttonRefs.current[focusIndex]?.focus();
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLButtonElement>,
    currentIndex: number
  ) => {
    if (disabled) return;

    const enabledOptions = options.filter((o) => !o.disabled);
    if (enabledOptions.length <= 1) return;

    let targetIndex = -1;

    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      for (let i = 1; i <= options.length; i++) {
        const nextIdx = (currentIndex + i) % options.length;
        if (!options[nextIdx].disabled) {
          targetIndex = nextIdx;
          break;
        }
      }
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      for (let i = 1; i <= options.length; i++) {
        const prevIdx = (currentIndex - i + options.length) % options.length;
        if (!options[prevIdx].disabled) {
          targetIndex = prevIdx;
          break;
        }
      }
    } else if (e.key === "Home") {
      e.preventDefault();
      targetIndex = options.findIndex((o) => !o.disabled);
    } else if (e.key === "End") {
      e.preventDefault();
      for (let i = options.length - 1; i >= 0; i--) {
        if (!options[i].disabled) {
          targetIndex = i;
          break;
        }
      }
    }

    if (targetIndex !== -1 && targetIndex !== currentIndex) {
      handleSelect(options[targetIndex].value, targetIndex);
    }
  };

  // Determine focusable index for roving tabindex
  const selectedIndex = options.findIndex((o) => o.value === activeValue && !o.disabled);
  const firstEnabledIndex = options.findIndex((o) => !o.disabled);
  const focusableIndex = selectedIndex !== -1 ? selectedIndex : firstEnabledIndex;

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      className={cn(
        "inline-flex items-center rounded-admin-button bg-admin-field border border-admin-border p-1 gap-1 text-slate-400 select-none",
        size === "sm" ? "h-8" : "h-10",
        disabled && "opacity-50 pointer-events-none",
        className
      )}
    >
      {options.map((option, idx) => {
        const isSelected = option.value === activeValue;
        const isOptionDisabled = disabled || Boolean(option.disabled);
        const isFocusable = idx === focusableIndex && !isOptionDisabled;

        return (
          <button
            key={option.value}
            ref={(el) => {
              buttonRefs.current[idx] = el;
            }}
            type="button"
            role="radio"
            aria-checked={isSelected}
            tabIndex={isFocusable ? 0 : -1}
            disabled={isOptionDisabled}
            onClick={() => handleSelect(option.value, idx)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            className={cn(
              "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-admin-compact font-medium transition-all outline-none focus-visible:ring-2 focus-visible:ring-admin-accent",
              size === "sm"
                ? "px-2.5 py-1 text-xs"
                : "px-3.5 py-1.5 text-xs font-semibold",
              isSelected
                ? "bg-admin-accent text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-admin-surface",
              isOptionDisabled && "opacity-50 cursor-not-allowed"
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
