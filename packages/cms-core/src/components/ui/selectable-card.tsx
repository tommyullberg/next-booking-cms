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
          "relative flex flex-col rounded-2xl border p-5 text-left transition-all duration-200 outline-none select-none",
          disabled
            ? "cursor-not-allowed opacity-50 border-slate-800/50 bg-slate-950/30"
            : "cursor-pointer focus-visible:ring-2 focus-visible:ring-sky-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950",
          selected
            ? "border-sky-500/60 bg-slate-900/95 ring-1 ring-sky-500/20 shadow-lg shadow-sky-500/10 text-white"
            : "border-slate-800 bg-slate-950/50 hover:border-slate-700 hover:bg-slate-900/40 text-slate-300",
          className
        )}
        {...props}
      >
        {indicator === "check" && (
          <div
            className={cn(
              "absolute right-4 top-4 flex h-5 w-5 items-center justify-center rounded-md border text-xs transition-colors",
              selected
                ? "border-sky-500 bg-sky-600 text-white"
                : "border-slate-700 bg-slate-900/80 text-transparent"
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
                ? "border-sky-500 bg-sky-600/20"
                : "border-slate-700 bg-slate-900/80"
            )}
          >
            {selected && <div className="h-2 w-2 rounded-full bg-sky-400" />}
          </div>
        )}
        {children}
      </div>
    );
  }
);
SelectableCard.displayName = "SelectableCard";

export { SelectableCard };
