"use client";

import React, { useEffect, useState } from "react";
import { useThemeStore, Theme } from "@/store/theme.store";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme, setTheme } = useThemeStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Read from localStorage or system preference
    const savedTheme = localStorage.getItem("theme") as Theme | null;
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    
    const initialTheme: Theme = savedTheme || (systemPrefersDark ? "dark" : "light");
    
    setTheme(initialTheme);
    
    // Apply class to HTML tag
    const root = window.document.documentElement;
    if (initialTheme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    
    setMounted(true);
  }, [setTheme]);

  // Prevent hydration flash by keeping background matching the theme during initial render
  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100" style={{ contentVisibility: "auto" }}>
        {children}
      </div>
    );
  }

  return <>{children}</>;
}
export default ThemeProvider;
