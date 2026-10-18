"use client";

import React from "react";
import { SessionProvider, SessionProviderProps } from "next-auth/react";

export interface CMSAuthProviderProps {
  children: React.ReactNode;
  session?: SessionProviderProps["session"];
}

export function CMSAuthProvider({ children, session }: CMSAuthProviderProps) {
  return <SessionProvider session={session}>{children}</SessionProvider>;
}
