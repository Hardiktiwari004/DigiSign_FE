"use client";

import React from "react";
import { useThemeStore } from "@/store/theme.store";
import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThemeSwitch() {
  const { theme, toggleTheme } = useThemeStore();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="relative w-9 h-9 rounded-full bg-slate-900/10 hover:bg-slate-900/20 dark:bg-slate-100/10 dark:hover:bg-slate-100/20 text-slate-700 dark:text-slate-200 transition-all border border-slate-900/5 dark:border-slate-100/5"
      aria-label="Toggle visual theme"
    >
      <div className="absolute inset-0 flex items-center justify-center">
        {theme === "light" ? (
          <Moon className="w-[18px] h-[18px] transition-transform duration-300 rotate-0 scale-100" />
        ) : (
          <Sun className="w-[18px] h-[18px] transition-transform duration-300 rotate-0 scale-100 text-amber-400" />
        )}
      </div>
    </Button>
  );
}
export default ThemeSwitch;
