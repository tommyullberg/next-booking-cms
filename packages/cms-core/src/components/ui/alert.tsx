import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import {
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Info,
  HelpCircle,
  X,
} from "lucide-react";
import { cn } from "../../utils/cn";

const alertVariants = cva(
  "relative w-full rounded-admin-card p-4 text-xs transition-all flex items-start gap-3 border border-admin-border border-l-4 shadow-sm",
  {
    variants: {
      variant: {
        destructive:
          "border-l-rose-500 bg-rose-500/[0.04] text-rose-200 shadow-[-4px_0_16px_-4px_rgba(244,63,94,0.35)]",
        success:
          "border-l-emerald-500 bg-emerald-500/[0.04] text-emerald-200 shadow-[-4px_0_16px_-4px_rgba(16,185,129,0.35)]",
        warning:
          "border-l-amber-500 bg-amber-500/[0.04] text-amber-200 shadow-[-4px_0_16px_-4px_rgba(245,158,11,0.35)]",
        info:
          "border-l-sky-500 bg-sky-500/[0.04] text-sky-200 shadow-[-4px_0_16px_-4px_rgba(14,165,233,0.35)]",
        neutral:
          "border-l-slate-400 bg-slate-400/[0.04] text-slate-200 shadow-[-4px_0_16px_-4px_rgba(148,163,184,0.25)]",
      },
    },
    defaultVariants: {
      variant: "info",
    },
  }
);

const DEFAULT_ICONS = {
  destructive: AlertCircle,
  success: CheckCircle2,
  warning: AlertTriangle,
  info: Info,
  neutral: HelpCircle,
} as const;

const ICON_COLOR_CLASSES = {
  destructive: "text-rose-400",
  success: "text-emerald-400",
  warning: "text-amber-400",
  info: "text-sky-400",
  neutral: "text-slate-400",
} as const;

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  icon?: React.ReactNode | false;
  onClose?: () => void;
  closeLabel?: string;
  action?: React.ReactNode;
  announce?: "assertive" | "polite" | "off";
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  (
    {
      className,
      variant = "info",
      icon,
      onClose,
      closeLabel = "Close",
      action,
      announce,
      children,
      role,
      "aria-live": ariaLiveProp,
      ...props
    },
    ref
  ) => {
    const activeVariant = variant ?? "info";

    const computedAriaLive =
      ariaLiveProp !== undefined
        ? ariaLiveProp
        : announce !== undefined
        ? announce
        : activeVariant === "destructive"
        ? "assertive"
        : activeVariant === "success"
        ? "polite"
        : undefined;

    const hasInteractiveAction = Boolean(action);

    const computedRole =
      role !== undefined
        ? role
        : announce === "off"
        ? undefined
        : activeVariant === "destructive"
        ? hasInteractiveAction || announce === "polite"
          ? undefined
          : "alert"
        : activeVariant === "success"
        ? "status"
        : undefined;

    const renderIcon = () => {
      if (icon === false) {
        return null;
      }
      if (icon !== undefined) {
        return (
          <span className={cn("shrink-0 mt-0.5", ICON_COLOR_CLASSES[activeVariant])}>
            {icon}
          </span>
        );
      }
      const DefaultIcon = DEFAULT_ICONS[activeVariant];
      return (
        <DefaultIcon
          className={cn("w-4 h-4 shrink-0 mt-0.5", ICON_COLOR_CLASSES[activeVariant])}
          aria-hidden="true"
        />
      );
    };

    return (
      <div
        ref={ref}
        role={computedRole}
        aria-live={computedAriaLive}
        className={cn(alertVariants({ variant: activeVariant }), className)}
        {...props}
      >
        {renderIcon()}
        <div className="flex-1 min-w-0 space-y-1">{children}</div>
        {action && <div className="shrink-0 ml-2 self-center">{action}</div>}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label={closeLabel}
            className="shrink-0 p-1 rounded-admin-compact text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    );
  }
);
Alert.displayName = "Alert";

const AlertTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("font-semibold leading-none tracking-tight text-white text-xs", className)}
    {...props}
  />
));
AlertTitle.displayName = "AlertTitle";

const AlertDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-xs leading-relaxed opacity-90", className)}
    {...props}
  />
));
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertTitle, AlertDescription, alertVariants };
