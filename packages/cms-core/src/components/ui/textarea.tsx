import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../utils/cn";

const textareaVariants = cva(
  "flex w-full transition-all outline-none focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 resize-y",
  {
    variants: {
      variant: {
        default:
          "rounded-md border border-input bg-transparent text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-input",
        admin:
          "rounded-admin-field border border-admin-border bg-admin-field text-slate-100 placeholder:text-slate-500 focus:border-admin-accent focus:ring-2 focus:ring-admin-accent/50",
      },
      size: {
        default: "min-h-[100px] px-3.5 py-2.5 text-sm",
        sm: "min-h-[80px] px-3 py-2 text-xs",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    VariantProps<typeof textareaVariants> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <textarea
        className={cn(textareaVariants({ variant, size }), className)}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea, textareaVariants };
