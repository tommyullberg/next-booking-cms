import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../utils/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all duration-200 outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // Standard semantic shadcn variants
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm rounded-md focus-visible:ring-ring",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-md focus-visible:ring-ring",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm rounded-md focus-visible:ring-destructive",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md focus-visible:ring-ring",
        ghost:
          "hover:bg-accent hover:text-accent-foreground rounded-md focus-visible:ring-ring",
        link: "text-primary underline-offset-4 hover:underline",

        // Admin Console specialized variants mapped to centralized admin tokens
        primary:
          "bg-admin-accent hover:bg-admin-accent-hover text-white font-semibold rounded-admin-button shadow-admin-button active:scale-[0.98] focus-visible:ring-admin-accent focus-visible:ring-offset-slate-950",
        adminPrimary:
          "bg-admin-accent hover:bg-admin-accent-hover text-white font-semibold rounded-admin-button shadow-admin-button active:scale-[0.98] focus-visible:ring-admin-accent focus-visible:ring-offset-slate-950",
        adminSecondary:
          "bg-admin-surface hover:bg-admin-border text-slate-200 font-medium rounded-admin-button border border-admin-border active:scale-[0.98] focus-visible:ring-slate-400 focus-visible:ring-offset-slate-950",
        adminDestructive:
          "bg-admin-danger hover:bg-admin-danger-hover text-white font-semibold rounded-admin-button shadow-admin-danger active:scale-[0.98] focus-visible:ring-admin-danger focus-visible:ring-offset-slate-950",
        adminOutline:
          "border border-admin-border hover:border-admin-border-hover bg-transparent hover:bg-admin-surface-subtle text-slate-200 rounded-admin-button focus-visible:ring-slate-400 focus-visible:ring-offset-slate-950",
        adminOutlineDestructive:
          "border border-admin-danger-border hover:border-admin-danger text-rose-400 hover:text-rose-300 bg-transparent hover:bg-admin-danger-subtle rounded-admin-button focus-visible:ring-admin-danger focus-visible:ring-offset-slate-950",
        adminGhost:
          "hover:bg-admin-surface text-slate-400 hover:text-slate-100 rounded-admin-compact focus-visible:ring-slate-400 focus-visible:ring-offset-slate-950",
        adminGhostDestructive:
          "hover:bg-admin-danger-subtle text-rose-400 hover:text-rose-300 rounded-admin-compact focus-visible:ring-admin-danger focus-visible:ring-offset-slate-950",
        table:
          "bg-admin-surface hover:bg-admin-border text-slate-300 hover:text-white rounded-admin-compact border border-admin-border transition-colors focus-visible:ring-admin-accent focus-visible:ring-offset-slate-950",
        tableDestructive:
          "hover:bg-admin-danger-subtle text-rose-400 hover:text-rose-300 rounded-admin-compact transition-colors focus-visible:ring-admin-danger focus-visible:ring-offset-slate-950",
      },
      size: {
        default: "h-10 px-4 py-2.5 text-sm",
        sm: "h-8 px-3 text-xs gap-1.5",
        xs: "h-7 px-2.5 text-xs font-medium gap-1.5 rounded-admin-compact",
        lg: "h-12 px-6 text-base",
        icon: "h-9 w-9 p-0",
        iconSm: "h-7 w-7 p-1 text-xs rounded-admin-compact",
        tableIcon: "h-7 w-7 p-1 rounded-admin-compact",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
