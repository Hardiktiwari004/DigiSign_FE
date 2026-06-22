import React from "react";
import Link from "next/link";
import ThemeSwitch from "@/components/layout/ThemeSwitch";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-950 text-slate-100 font-sans selection:bg-blue-600/30 selection:text-blue-200">
      {/* Decorative Brand Section (Desktop Only) */}
      <div className="hidden md:flex md:w-[45%] lg:w-[40%] flex-col justify-between p-12 bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950 border-r border-slate-900 relative overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full bg-blue-600/10 blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full bg-emerald-500/5 blur-3xl animate-pulse delay-75"></div>
        
        {/* Top Logo */}
        <div className="z-10">
          <Link href="/login" className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
              <span className="font-bold text-white text-base">D</span>
            </div>
            <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              DigiSign
            </span>
          </Link>
        </div>

        {/* Brand slogan */}
        <div className="space-y-6 z-10">
          <h2 className="text-3xl font-extrabold tracking-tight text-white leading-tight lg:text-4xl">
            Securely sign & verify documents in seconds.
          </h2>
          <p className="text-slate-400 leading-relaxed text-sm max-w-sm">
            Leverage robust tokenized workflows, cryptographically bound signatures, and instant public validation.
          </p>
        </div>

        {/* Footer info */}
        <div className="text-xs text-slate-600 z-10">
          © {new Date().getFullYear()} DigiSign Inc. All rights reserved.
        </div>
      </div>

      {/* Auth Content Card Area */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-8 py-12 relative">
        {/* Theme switcher floating link */}
        <div className="absolute top-6 right-6">
          <ThemeSwitch />
        </div>
        
        <div className="mx-auto w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  );
}
