import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../utils/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all duration-200 outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-xl shadow-lg shadow-sky-600/20 active:scale-[0.98]",
        primary:
          "bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-xl shadow-lg shadow-sky-600/20 active:scale-[0.98]",
        secondary:
          "bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-xl border border-slate-700 active:scale-[0.98]",
        destructive:
          "bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-xl shadow-lg shadow-rose-600/20 active:scale-[0.98]",
        outline:
          "border border-slate-800 hover:border-slate-700 bg-transparent hover:bg-slate-800/60 text-slate-200 rounded-xl",
        ghost:
          "hover:bg-slate-800/70 text-slate-400 hover:text-slate-100 rounded-lg",
        table:
          "p-2 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg transition-colors",
        tableDestructive:
          "p-2 hover:bg-rose-500/10 text-rose-400 hover:text-rose-300 rounded-lg transition-colors",
        link: "text-sky-400 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2.5 text-sm",
        sm: "h-8 px-3 text-xs rounded-lg",
        lg: "h-12 px-6 text-base rounded-xl",
        icon: "h-9 w-9 p-0 rounded-lg",
        tableIcon: "h-8 w-8 p-1.5 rounded-lg",
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
