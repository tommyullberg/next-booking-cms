"use client";

import React, { createContext, useContext, useState } from "react";

export type AdminTheme = "dark" | "light";

export interface ThemeContextType {
  theme: AdminTheme;
  toggleTheme: () => void;
  isThemeLocked: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "dark",
  toggleTheme: () => {},
  isThemeLocked: true,
});

export interface AdminThemeProviderProps {
  children: React.ReactNode;
  enableThemeSwitch?: boolean;
}

export function AdminThemeProvider({
  children,
  enableThemeSwitch = false,
}: AdminThemeProviderProps) {
  const [theme, setTheme] = useState<AdminTheme>("dark");

  const toggleTheme = () => {
    if (!enableThemeSwitch) {
      return;
    }
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return (
    <ThemeContext.Provider
      value={{
        theme: enableThemeSwitch ? theme : "dark",
        toggleTheme,
        isThemeLocked: !enableThemeSwitch,
      }}
    >
      <div className="dark bg-slate-950 text-slate-100 antialiased selection:bg-sky-500/20 selection:text-sky-200">
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useAdminTheme() {
  return useContext(ThemeContext);
}
