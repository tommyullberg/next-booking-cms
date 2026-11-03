import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "../../utils/cn";

export interface SelectableCardProps
  extends React.HTMLAttributes<HTMLDivElement> {
  selected?: boolean;
  disabled?: boolean;
  indicator?: "check" | "radio" | "none";
}

const SelectableCard = React.forwardRef<HTMLDivElement, SelectableCardProps>(
  (
    {
      className,
      selected = false,
      disabled = false,
      indicator = "none",
      children,
      onClick,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-pressed={selected}
        aria-disabled={disabled}
        onClick={disabled ? undefined : onClick}
        onKeyDown={(e) => {
          if (disabled) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onClick?.(e as unknown as React.MouseEvent<HTMLDivElement>);
          }
        }}
        className={cn(
          "relative flex flex-col rounded-admin-card border p-5 text-left transition-all duration-200 outline-none select-none",
          disabled
            ? "cursor-not-allowed opacity-50 border-admin-border/50 bg-admin-canvas/30"
            : "cursor-pointer focus-visible:ring-2 focus-visible:ring-admin-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950",
          selected
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
              selected
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
              selected
                ? "border-admin-accent bg-transparent"
                : "border-admin-border bg-admin-surface"
            )}
          >
            {selected && (
              <span className="h-2.5 w-2.5 rounded-full bg-admin-accent" />
            )}
          </div>
        )}

        {children}
      </div>
    );
  }
);
SelectableCard.displayName = "SelectableCard";

export { SelectableCard };
