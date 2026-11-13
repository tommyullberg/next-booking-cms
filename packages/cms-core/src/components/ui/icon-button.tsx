import * as React from "react";
import { Button, type ButtonProps } from "./button";
import { cn } from "@cms/utils/cn";

export interface IconButtonProps extends Omit<ButtonProps, "size"> {
  "aria-label": string;
  size?: "default" | "sm" | "xs";
  tooltip?: string;
  children: React.ReactNode;
}

const sizeMap = {
  default: "icon",
  sm: "iconSm",
  xs: "tableIcon",
} as const;

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      "aria-label": ariaLabel,
      size = "default",
      tooltip,
      children,
      className,
      ...props
    },
    ref
  ) => {
    return (
      <Button
        ref={ref}
        size={sizeMap[size]}
        aria-label={ariaLabel}
        title={tooltip || ariaLabel}
        className={cn("shrink-0", className)}
        {...props}
      >
        {children}
      </Button>
    );
  }
);
IconButton.displayName = "IconButton";

export { IconButton };
