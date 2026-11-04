"use client";

import * as React from "react";
import { ConfirmContext } from "./confirm-context";
import { ConfirmContextValue } from "./confirm-types";

export function useConfirm(): ConfirmContextValue {
  const context = React.useContext(ConfirmContext);
  if (!context) {
    throw new Error("useConfirm must be used within a ConfirmProvider");
  }
  return context;
}
