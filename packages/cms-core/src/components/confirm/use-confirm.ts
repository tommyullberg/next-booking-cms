"use client";

import * as React from "react";
import { ConfirmContext } from "./confirm-context";
import { ConfirmContextValue } from "./confirm-types";

export function useConfirm(): ConfirmContextValue {
  const context = React.useContext(ConfirmContext);
  if (!context) {
    if (typeof window !== "undefined") {
      console.warn("useConfirm was called outside a ConfirmProvider. Falling back to native browser dialogs.");
      return {
        confirm: async (options) => {
          const text = typeof options.description === "string"
            ? options.description
            : typeof options.title === "string"
            ? options.title
            : "";
          const res = window.confirm(text);
          if (res && options.onConfirm) {
            await options.onConfirm();
          }
          return res;
        },
        inform: async (options) => {
          const text = typeof options.description === "string"
            ? options.description
            : typeof options.title === "string"
            ? options.title
            : "";
          window.alert(text);
        },
      };
    }
    return {
      confirm: async () => false,
      inform: async () => {},
    };
  }
  return context;
}
