"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { ThemeSwitch } from "./ThemeSwitch";
import { FileSignature, User } from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const isAdmin = user?.role === "ADMIN";
  const getPageTitle = () => {
    if (pathname.startsWith("/dashboard")) return "Overview";
    if (pathname.startsWith("/documents/upload")) return "Upload PDF";
    if (pathname.startsWith("/documents/")) {
      if (pathname.endsWith("/sign")) return "Sign Document";
      return "Document Details";
    }
    if (pathname.startsWith("/documents")) return isAdmin ? "All Documents" : "My Documents";
    if (pathname.startsWith("/signatures")) return "Signature Library";
    if (pathname.startsWith("/verify")) return "Document Authentication";
    if (pathname.startsWith("/admin/audit-logs")) return "Audit Logs";
    return "DigiSign";
  };

  return (
    <header className="hidden md:flex items-center justify-between h-16 px-6 lg:px-8 border-b border-slate-200 bg-white/80 dark:bg-slate-950/80 dark:border-slate-800/80 backdrop-blur-md sticky top-0 z-30">
      <div>
        <h1 className="text-base font-semibold text-slate-800 dark:text-slate-100 tracking-tight">
          {getPageTitle() === "Signature Library" ? (
            <span className="inline-flex items-center gap-2">
              <FileSignature className="h-4 w-4 text-blue-500" />
              {getPageTitle()}
            </span>
          ) : (
            getPageTitle()
          )}
        </h1>
      </div>

      <div className="flex items-center space-x-4">
        {/* Quick status indicator */}
        <div className="flex items-center space-x-2 text-xs text-slate-500 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 bg-slate-50 dark:bg-slate-900/60">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
          <span>API Connected</span>
        </div>

        {/* User initials pill */}
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-blue-600/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-semibold">
            {user?.name ? user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : <User className="w-3.5 h-3.5" />}
          </div>
        </div>
      </div>
    </header>
  );
}
export default Navbar;
