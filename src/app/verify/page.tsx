"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ThemeSwitch from "@/components/layout/ThemeSwitch";
import { ShieldCheck, Search, FileText, CheckCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export default function VerifyPage() {
  const router = useRouter();
  const [code, setCode] = useState("");

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    router.push(`/verify/${encodeURIComponent(code.trim())}`);
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-950 text-slate-100 font-sans relative overflow-hidden">
      {/* Glow backgrounds */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full bg-blue-600/10 blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1/4 left-1/3 w-80 h-80 rounded-full bg-emerald-500/5 blur-3xl animate-pulse delay-75"></div>

      {/* Floating theme/logo toolbar */}
      <header className="w-full flex items-center justify-between px-6 py-4 border-b border-slate-900 bg-slate-950/40 backdrop-blur-md z-10">
        <Link href="/login" className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <span className="font-bold text-white text-base">D</span>
          </div>
          <span className="font-bold text-base tracking-tight text-white">DigiSign</span>
        </Link>
        <div className="flex items-center space-x-4">
          <Link href="/login" className="text-xs text-slate-400 hover:text-white font-semibold">
            Dashboard Sign In
          </Link>
          <ThemeSwitch />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow flex items-center justify-center p-6 z-10">
        <div className="w-full max-w-lg space-y-6">
          <div className="text-center space-y-2">
            <div className="mx-auto w-12 h-12 rounded-full bg-blue-600/15 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-3">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Document Authenticator
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm max-w-md mx-auto leading-relaxed">
              Verify the authenticity and signature logs of any document locked with the DigiSign cryptographic platform.
            </p>
          </div>

          <Card className="border-slate-800 bg-slate-900/60 backdrop-blur-md shadow-2xl relative">
            <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-blue-500 via-sky-400 to-emerald-500"></div>
            
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-bold text-white">Verification Code Lookup</CardTitle>
              <CardDescription className="text-slate-400 text-xs">
                Enter the unique verification code printed on the audit logs or document footer.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleVerify} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="verification-code" className="text-slate-300 text-xs font-semibold uppercase tracking-wider">
                    Verification Code
                  </Label>
                  <div className="relative">
                    <Search className="absolute left-3.5 top-3 h-[18px] w-[18px] text-slate-500" />
                    <Input
                      id="verification-code"
                      placeholder="e.g. DOC-12345678"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      className="pl-10 py-6 bg-slate-950 border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-white rounded-xl placeholder:text-slate-600 font-mono tracking-wider text-sm uppercase"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={!code.trim()}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-6 font-semibold flex items-center justify-center shadow-lg shadow-blue-600/20"
                >
                  Verify Authenticity
                  <ArrowRight className="w-4.5 h-4.5 ml-2" />
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer footer */}
      <footer className="w-full text-center py-6 text-slate-700 text-[10px] border-t border-slate-900 bg-slate-950/20 z-10">
        © {new Date().getFullYear()} DigiSign Cryptographic Platform. Certified Document Standard.
      </footer>
    </div>
  );
}
