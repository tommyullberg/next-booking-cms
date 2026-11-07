import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@cms/utils/cn";

const cardVariants = cva(
  "text-card-foreground transition-all",
  {
    variants: {
      variant: {
        default: "rounded-lg border border-border bg-card shadow-sm text-card-foreground",
        solid: "rounded-lg border border-border bg-card text-card-foreground",
        subtle: "rounded-lg border border-border/80 bg-card/60 backdrop-blur-sm",
        glass: "rounded-lg border border-border/60 bg-card/40 backdrop-blur-md",
        interactive:
          "rounded-lg border border-border bg-card hover:border-accent cursor-pointer shadow-sm",

        // Admin Console specialized variants mapped to centralized admin tokens
        admin:
          "rounded-admin-card border border-admin-border bg-admin-surface text-slate-100 shadow-admin-card",
        adminSubtle:
          "rounded-admin-card border border-admin-border bg-admin-surface-subtle text-slate-100 backdrop-blur-sm",
        adminGlass:
          "rounded-admin-card border border-admin-border/60 bg-admin-canvas/60 text-slate-100 backdrop-blur-md",
        adminInteractive:
          "rounded-admin-card border border-admin-border bg-admin-surface text-slate-100 hover:border-admin-border-hover cursor-pointer shadow-admin-card",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant }), className)}
      {...props}
    />
  )
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
  cardVariants,
};
