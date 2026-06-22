"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { verificationService } from "@/services/verification.service";
import ThemeSwitch from "@/components/layout/ThemeSwitch";
import {
  ShieldCheck,
  ShieldAlert,
  Calendar,
  User,
  FileText,
  ArrowLeft,
  Search,
  CheckCircle2,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { format } from "date-fns";
import { EntityReference } from "@/types/api";

function formatEntityReference(value?: EntityReference) {
  if (!value) return "-";
  return typeof value === "string" ? value : value.name || value.email || value._id;
}

export default function VerifyCodePage() {
  const params = useParams();
  const router = useRouter();
  const [retryCode, setRetryCode] = useState("");
  
  const code = params.code as string;

  // Run public unauthenticated query
  const { data: result, isLoading, error, refetch } = useQuery({
    queryKey: ["verification", code],
    queryFn: () => verificationService.verifyDocument(code),
    enabled: !!code,
  });

  const handleRetryVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!retryCode.trim()) return;
    router.push(`/verify/${encodeURIComponent(retryCode.trim())}`);
  };

  const formatVerifyDate = (dateString?: string) => {
    if (!dateString) return "-";
    try {
      return format(new Date(dateString), "MMMM d, yyyy 'at' h:mm a");
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-950 text-slate-100 font-sans relative overflow-hidden">
      {/* Glow backgrounds */}
      {result?.valid ? (
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-emerald-500/5 blur-3xl animate-pulse"></div>
      ) : (
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-red-500/5 blur-3xl animate-pulse"></div>
      )}

      {/* Floating logo/theme header */}
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

      {/* Main Container */}
      <main className="flex-grow flex items-center justify-center p-6 z-10">
        <div className="w-full max-w-xl space-y-6">
          <div className="flex justify-between items-center">
            <Link href="/verify" className="inline-flex items-center text-xs font-semibold text-slate-400 hover:text-slate-200">
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              Search another code
            </Link>
          </div>

          {isLoading ? (
            <Card className="border-slate-800 bg-slate-900/60 p-12 text-center flex flex-col justify-center items-center space-y-4">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              <p className="text-sm text-slate-400 font-semibold">Retrieving cryptographic ledger...</p>
            </Card>
          ) : error ? (
            <Card className="border-slate-800 bg-slate-900/60 p-12 text-center space-y-4">
              <AlertTriangle className="w-10 h-10 text-red-500 mx-auto" />
              <h3 className="text-lg font-bold text-white">Authentication query failed</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Unable to query secure verification ledger. Please verify your internet connection.
              </p>
              <Button onClick={() => refetch()} className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg">Retry</Button>
            </Card>
          ) : result?.valid ? (
            /* Success state: Document Verified */
            <Card className="border-emerald-500/20 bg-slate-900/40 backdrop-blur-md shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-[3px] bg-emerald-500"></div>

              <CardHeader className="text-center space-y-2 pb-6 pt-8">
                <div className="mx-auto w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-2">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <CardTitle className="text-xl font-bold tracking-tight text-white">
                  Document Verified
                </CardTitle>
                <CardDescription className="text-[10px] uppercase font-bold tracking-wider text-emerald-400">
                  Cryptographic Authenticity Confirmed
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4 px-8 pb-8">
                {/* Document details box */}
                <div className="p-5 bg-slate-950/70 border border-emerald-500/5 rounded-xl space-y-4">
                  {/* File title */}
                  <div className="flex items-start space-x-3 text-xs">
                    <FileText className="w-4.5 h-4.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-slate-500 font-semibold">Document Title</p>
                      <p className="text-slate-200 mt-1 text-sm font-semibold">{result.documentName}</p>
                    </div>
                  </div>

                  {/* Signer */}
                  <div className="flex items-start space-x-3 text-xs border-t border-slate-900 pt-3">
                    <User className="w-4.5 h-4.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-slate-500 font-semibold">Signer Authority</p>
                      <p className="text-slate-200 mt-1 text-sm font-semibold">{formatEntityReference(result.signedBy)}</p>
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-2 gap-4 border-t border-slate-900 pt-3 text-xs">
                    <div>
                      <span className="text-slate-500 font-semibold block">Uploaded Date</span>
                      <span className="text-slate-300 block mt-1 font-mono text-[10px]">
                        {formatVerifyDate(result.uploadedAt)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-semibold block">Signed Date</span>
                      <span className="text-slate-300 block mt-1 font-mono text-[10px]">
                        {formatVerifyDate(result.signedAt)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-emerald-500/5 rounded-lg border border-emerald-500/10 text-center text-[10px] text-slate-400">
                  Code: <span className="font-mono font-bold text-emerald-400 uppercase">{code}</span>
                </div>
              </CardContent>
            </Card>
          ) : (
            /* Invalid state: Code not found */
            <Card className="border-slate-800 bg-slate-900/60 backdrop-blur-md shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-[3px] bg-slate-700"></div>

              <CardHeader className="text-center space-y-2 pb-6 pt-8">
                <div className="mx-auto w-12 h-12 rounded-full bg-slate-800 border border-slate-700/50 flex items-center justify-center text-slate-400 mb-2">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <CardTitle className="text-xl font-bold tracking-tight text-white">
                  Invalid Verification Code
                </CardTitle>
                <CardDescription className="text-slate-400 text-xs max-w-xs mx-auto">
                  No registered signature logs match the code <span className="font-mono text-slate-300 font-semibold uppercase">{code}</span>.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6 px-8 pb-8">
                <div className="text-xs text-slate-500 text-center leading-relaxed">
                  This document may be unsigned, modified, or registered in a different ledger environment. Please verify the code and query again.
                </div>

                {/* Retrying inputs */}
                <form onSubmit={handleRetryVerify} className="space-y-3 pt-3 border-t border-slate-900">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-[18px] w-[18px] text-slate-500" />
                    <Input
                      placeholder="Enter verification code..."
                      value={retryCode}
                      onChange={(e) => setRetryCode(e.target.value)}
                      className="pl-10 h-10 bg-slate-950 border-slate-800 focus:border-blue-500 text-white rounded-xl placeholder:text-slate-600 text-xs font-mono uppercase"
                    />
                  </div>
                  <Button type="submit" size="sm" className="w-full bg-slate-800 hover:bg-slate-750 text-white rounded-xl">
                    Verify Code
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* Footer footer */}
      <footer className="w-full text-center py-6 text-slate-700 text-[10px] border-t border-slate-900 bg-slate-950/20 z-10">
        © {new Date().getFullYear()} DigiSign Cryptographic Platform. Certified Document Standard.
      </footer>
    </div>
  );
}
