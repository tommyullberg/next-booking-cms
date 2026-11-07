"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@cms/utils/cn";

interface CardRegistryItem {
  value: string;
  element: HTMLButtonElement | null;
  disabled: boolean;
}

interface SelectableCardGroupContextValue {
  value?: string;
  onSelect: (value: string) => void;
  registerCard: (value: string, element: HTMLButtonElement | null, disabled: boolean) => void;
  unregisterCard: (value: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLButtonElement>, currentValue: string) => void;
  focusableValue?: string;
  groupDisabled: boolean;
}

const SelectableCardGroupContext =
  React.createContext<SelectableCardGroupContextValue | null>(null);

export interface SelectableCardGroupProps<T extends string = string>
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue"> {
  value?: T;
  defaultValue?: T;
  onChange?: (value: T) => void;
  disabled?: boolean;
  "aria-label"?: string;
  "aria-labelledby"?: string;
}

export function SelectableCardGroup<T extends string = string>({
  value: valueProp,
  defaultValue,
  onChange,
  disabled = false,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  className,
  children,
  ...props
}: SelectableCardGroupProps<T>) {
  const isControlled = valueProp !== undefined;
  const [uncontrolledValue, setUncontrolledValue] = React.useState<T | undefined>(
    defaultValue
  );
  const activeValue = isControlled ? valueProp : uncontrolledValue;

  const cardRegistryRef = React.useRef<CardRegistryItem[]>([]);

  const registerCard = React.useCallback(
    (val: string, element: HTMLButtonElement | null, cardDisabled: boolean) => {
      const current = cardRegistryRef.current;
      const index = current.findIndex((item) => item.value === val);
      if (index !== -1) {
        current[index] = { value: val, element, disabled: cardDisabled };
      } else {
        current.push({ value: val, element, disabled: cardDisabled });
      }
    },
    []
  );

  const unregisterCard = React.useCallback((val: string) => {
    cardRegistryRef.current = cardRegistryRef.current.filter(
      (item) => item.value !== val
    );
  }, []);

  const handleSelect = React.useCallback(
    (nextValue: string, focus = false) => {
      if (!isControlled) {
        setUncontrolledValue(nextValue as T);
      }
      onChange?.(nextValue as T);

      if (focus) {
        const target = cardRegistryRef.current.find(
          (item) => item.value === nextValue
        );
        target?.element?.focus();
      }
    },
    [isControlled, onChange]
  );

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>, currentValue: string) => {
      if (disabled) return;

      const items = cardRegistryRef.current;
      const enabledItems = items.filter((item) => !item.disabled);
      if (enabledItems.length <= 1) return;

      const currentIndex = items.findIndex((item) => item.value === currentValue);
      if (currentIndex === -1) return;

      let targetIndex = -1;

      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        for (let i = 1; i <= items.length; i++) {
          const nextIdx = (currentIndex + i) % items.length;
          if (!items[nextIdx].disabled) {
            targetIndex = nextIdx;
            break;
          }
        }
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        for (let i = 1; i <= items.length; i++) {
          const prevIdx = (currentIndex - i + items.length) % items.length;
          if (!items[prevIdx].disabled) {
            targetIndex = prevIdx;
            break;
          }
        }
      } else if (e.key === "Home") {
        e.preventDefault();
        targetIndex = items.findIndex((item) => !item.disabled);
      } else if (e.key === "End") {
        e.preventDefault();
        for (let i = items.length - 1; i >= 0; i--) {
          if (!items[i].disabled) {
            targetIndex = i;
            break;
          }
        }
      }

      if (targetIndex !== -1 && targetIndex !== currentIndex) {
        handleSelect(items[targetIndex].value, true);
      }
    },
    [disabled, handleSelect]
  );

  // Determine roving focusable card value
  const selectedEnabled = cardRegistryRef.current.find(
    (item) => item.value === activeValue && !item.disabled
  );
  const firstEnabled = cardRegistryRef.current.find((item) => !item.disabled);
  const focusableValue = selectedEnabled?.value ?? firstEnabled?.value;

  const contextValue = React.useMemo<SelectableCardGroupContextValue>(
    () => ({
      value: activeValue,
      onSelect: (v) => handleSelect(v, false),
      registerCard,
      unregisterCard,
      onKeyDown: handleKeyDown,
      focusableValue,
      groupDisabled: disabled,
    }),
    [activeValue, handleSelect, registerCard, unregisterCard, handleKeyDown, focusableValue, disabled]
  );

  return (
    <SelectableCardGroupContext.Provider value={contextValue}>
      <div
        role="radiogroup"
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        className={className}
        {...props}
      >
        {children}
      </div>
    </SelectableCardGroupContext.Provider>
  );
}

export interface SelectableCardProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value?: string;
  selected?: boolean;
  disabled?: boolean;
  indicator?: "check" | "radio" | "none";
}

const SelectableCard = React.forwardRef<HTMLButtonElement, SelectableCardProps>(
  (
    {
      className,
      value,
      selected: selectedProp = false,
      disabled: disabledProp = false,
      indicator = "none",
      type = "button",
      role,
      children,
      onClick,
      onKeyDown,
      ...props
    },
    forwardedRef
  ) => {
    const internalRef = React.useRef<HTMLButtonElement | null>(null);

    const group = React.useContext(SelectableCardGroupContext);
    const isInsideGroup = group !== null;

    const isCardDisabled = disabledProp || Boolean(group?.groupDisabled);
    const isSelected = isInsideGroup
      ? Boolean(value && group.value === value)
      : selectedProp;

    const isRadio = isInsideGroup || role === "radio" || indicator === "radio";
    const computedRole = role || (isRadio ? "radio" : "button");

    React.useEffect(() => {
      if (isInsideGroup && value) {
        group.registerCard(value, internalRef.current, isCardDisabled);
        return () => {
          group.unregisterCard(value);
        };
      }
    }, [isInsideGroup, value, isCardDisabled, group]);

    const isFocusable = isInsideGroup
      ? value !== undefined && group.focusableValue === value && !isCardDisabled
      : !isCardDisabled;

    const computedTabIndex = isInsideGroup
      ? isFocusable
        ? 0
        : -1
      : props.tabIndex;

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (isCardDisabled) return;
      if (isInsideGroup && value) {
        group.onSelect(value);
      }
      onClick?.(e);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
      if (isInsideGroup && value) {
        group.onKeyDown(e, value);
      }
      onKeyDown?.(e);
    };

    return (
      <button
        ref={(el) => {
          internalRef.current = el;
          if (typeof forwardedRef === "function") {
            forwardedRef(el);
          } else if (forwardedRef) {
            forwardedRef.current = el;
          }
        }}
        type={type}
        role={computedRole}
        aria-checked={isRadio ? isSelected : undefined}
        aria-pressed={!isRadio ? isSelected : undefined}
        tabIndex={computedTabIndex}
        disabled={isCardDisabled}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className={cn(
          "relative flex flex-col rounded-admin-card border p-5 text-left transition-all duration-200 outline-none select-none",
          isCardDisabled
            ? "cursor-not-allowed opacity-50 border-admin-border/50 bg-admin-canvas/30"
            : "cursor-pointer focus-visible:ring-2 focus-visible:ring-admin-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950",
          isSelected
            ? "border-admin-accent bg-admin-surface ring-1 ring-admin-accent/20 shadow-admin-glow text-white"
            : "border-admin-border bg-admin-surface-subtle hover:border-admin-border-hover hover:bg-admin-surface text-slate-300",
          className
        )}
        {...props}
      >
        {indicator === "check" && (
          <div
            className={cn(
              "absolute right-4 top-4 flex h-5 w-5 items-center justify-center rounded-md border text-xs transition-colors",
              isSelected
                ? "border-admin-accent bg-admin-accent text-white"
                : "border-admin-border bg-admin-surface text-transparent"
            )}
          >
            <Check className="h-3.5 w-3.5 stroke-[2.5]" />
          </div>
        )}

        {indicator === "radio" && (
          <div
            className={cn(
              "absolute right-4 top-4 flex h-5 w-5 items-center justify-center rounded-full border transition-colors",
              isSelected
                ? "border-admin-accent bg-transparent"
                : "border-admin-border bg-admin-surface"
            )}
          >
            {isSelected && (
              <span className="h-2.5 w-2.5 rounded-full bg-admin-accent" />
            )}
          </div>
        )}

        {children}
      </button>
    );
  }
);
SelectableCard.displayName = "SelectableCard";

export { SelectableCard };
