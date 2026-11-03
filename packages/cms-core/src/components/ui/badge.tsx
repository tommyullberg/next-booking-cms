import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../utils/cn";

const badgeVariants = cva(
  "inline-flex items-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        // Standard semantic shadcn variants
        default:
          "rounded-full border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "rounded-full border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "rounded-full border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "rounded-full text-foreground border border-border",

        // Admin Console specialized variants mapped to centralized admin tokens
        adminSuccess:
          "rounded-admin-compact border border-admin-success-border bg-admin-success-subtle text-emerald-400 font-semibold",
        adminDanger:
          "rounded-admin-compact border border-admin-danger-border bg-admin-danger-subtle text-rose-400 font-semibold",
        adminWarning:
          "rounded-admin-compact border border-admin-warning-border bg-admin-warning-subtle text-amber-300 font-semibold",
        adminAccent:
          "rounded-admin-compact border border-admin-accent-border bg-admin-accent-subtle text-sky-300 font-semibold",
        adminMuted:
          "rounded-admin-compact border border-admin-border bg-admin-surface text-slate-300 font-medium",

        // Aliases for convenience
        success:
          "rounded-admin-compact border border-admin-success-border bg-admin-success-subtle text-emerald-400 font-semibold",
        warning:
          "rounded-admin-compact border border-admin-warning-border bg-admin-warning-subtle text-amber-300 font-semibold",
        primary:
          "rounded-admin-compact border border-admin-accent-border bg-admin-accent-subtle text-sky-300 font-semibold",
        muted:
          "rounded-admin-compact border border-admin-border bg-admin-surface text-slate-300 font-medium",
      },
      size: {
        default: "px-2.5 py-0.5 text-xs gap-1.5",
        sm: "px-2 py-0.5 text-[10px] gap-1",
        xs: "px-1.5 py-0.2 text-[10px] gap-1",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
