"use client";

import * as React from "react";
import type { VariantProps } from "class-variance-authority";
import { cn } from "@cms/utils/cn";
import { Input } from "./input";
import { DatePicker } from "./date-picker";
import { Label, labelVariants } from "./label";
import { NativeSelect } from "./select";
import { Textarea } from "./textarea";

export interface FormFieldControlProps {
  id: string;
  "aria-describedby"?: string;
  "aria-invalid"?: true;
  required?: boolean;
}

export interface FormFieldProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  label: React.ReactNode;
  description?: React.ReactNode;
  error?: React.ReactNode;
  /** Defaults to the control's own `required` prop when children is a single element. */
  required?: boolean;
  labelVariant?: VariantProps<typeof labelVariants>["variant"];
  labelSize?: VariantProps<typeof labelVariants>["size"];
  labelClassName?: string;
  /**
   * A single control element receives id, aria-describedby, aria-invalid and
   * (for native controls) required automatically. Use a function for composite
   * controls (icon wrappers, Radix Select, ...) and spread the props yourself.
   */
  children:
    | React.ReactElement<Record<string, unknown>>
    | ((control: FormFieldControlProps) => React.ReactNode);
}

// Controls that accept a `required` prop and forward it to a native element.
const NATIVE_REQUIRED_TYPES = new Set<unknown>([
  Input,
  Textarea,
  NativeSelect,
  DatePicker,
  "input",
  "textarea",
  "select",
]);

const hasContent = (node: React.ReactNode) =>
  node !== undefined && node !== null && node !== false && node !== "";

function FormField({
  label,
  description,
  error,
  required,
  labelVariant,
  labelSize,
  labelClassName,
  className,
  children,
  ...props
}: FormFieldProps) {
  const generatedId = React.useId();
  const descriptionId = `${generatedId}-description`;
  const errorId = `${generatedId}-error`;

  const hasDescription = hasContent(description);
  const hasError = hasContent(error);
  const isElementChild = typeof children !== "function";
  const childProps = isElementChild ? children.props : undefined;

  const controlId = (childProps?.id as string | undefined) ?? generatedId;
  const isRequired = required ?? Boolean(childProps?.required);
  const describedBy =
    [
      childProps?.["aria-describedby"] as string | undefined,
      hasDescription ? descriptionId : undefined,
      hasError ? errorId : undefined,
    ]
      .filter(Boolean)
      .join(" ") || undefined;

  let control: React.ReactNode;
  if (typeof children === "function") {
    control = children({
      id: controlId,
      "aria-describedby": describedBy,
      "aria-invalid": hasError ? true : undefined,
      required: isRequired || undefined,
    });
  } else {
    const injected: Record<string, unknown> = {
      id: controlId,
      "aria-describedby": describedBy,
    };
    if (hasError) injected["aria-invalid"] = true;
    if (isRequired && NATIVE_REQUIRED_TYPES.has(children.type)) {
      injected.required = true;
    }
    control = React.cloneElement(children, injected);
  }

  return (
    <div className={className} {...props}>
      <Label
        htmlFor={controlId}
        variant={labelVariant}
        size={labelSize}
        className={cn("mb-1.5 block", labelClassName)}
      >
        {label}
        {isRequired && (
          <>
            {" "}
            <span aria-hidden="true" className="text-rose-400">
              *
            </span>
          </>
        )}
      </Label>
      {control}
      {hasDescription && (
        <p
          id={descriptionId}
          className="mt-1.5 text-[0.6875rem] text-slate-500"
        >
          {description}
        </p>
      )}
      {/* Always mounted so that screen readers announce errors when they appear */}
      <p
        id={errorId}
        aria-live="polite"
        aria-atomic="true"
        className={cn(
          hasError && "mt-1.5 text-[0.6875rem] font-medium text-red-400"
        )}
      >
        {hasError ? error : null}
      </p>
    </div>
  );
}

export { FormField };
