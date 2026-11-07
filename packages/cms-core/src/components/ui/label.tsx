import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../utils/cn";

const labelVariants = cva(
  "leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 select-none",
  {
    variants: {
      variant: {
        default:
          "block text-xs font-semibold text-slate-400 uppercase tracking-wider",
        admin: "block text-xs font-medium text-slate-300",
        booking: "block text-xs font-medium text-slate-700 dark:text-slate-300",
        inline: "text-sm font-medium text-slate-300",
        muted: "block text-xs font-normal text-slate-400",
      },
      size: {
        default: "",
        sm: "text-[0.6875rem]",
        xs: "text-[0.625rem]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
    VariantProps<typeof labelVariants>
>(({ className, variant, size, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(labelVariants({ variant, size }), className)}
    {...props}
  />
));
Label.displayName = LabelPrimitive.Root.displayName;

export { Label, labelVariants };
