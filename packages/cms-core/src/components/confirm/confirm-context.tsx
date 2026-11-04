"use client";

import * as React from "react";
import { ConfirmContextValue } from "./confirm-types";

export const ConfirmContext = React.createContext<ConfirmContextValue | null>(null);
