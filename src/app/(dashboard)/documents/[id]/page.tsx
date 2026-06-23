"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { documentsService } from "@/services/documents.service";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { toast } from "sonner";
import {
  Download,
  Trash2,
  FileSignature,
  Copy,
  Check,
  ChevronLeft,
  Calendar,
  KeyRound,
  ExternalLink,
  ShieldCheck,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { makeSafePdfFilename } from "@/lib/pdf-filename";

// Lazy-load PDF Viewer to prevent SSR build failures (uses canvas/browser APIs)
const PdfViewer = dynamic(() => import("@/components/pdf/PdfViewer"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[500px] flex flex-col justify-center items-center space-y-3 bg-slate-100 dark:bg-slate-900 border dark:border-slate-800 rounded-2xl">
      <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      <p className="text-xs text-slate-400 font-medium">Mounting reader engine...</p>
    </div>
  ),
});

export default function DocumentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  const id = params.id as string;

  // Fetch document details
  const { data: document, isLoading, error, refetch } = useQuery({
    queryKey: ["document", id],
    queryFn: () => documentsService.getDocument(id),
    enabled: !!id,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (docId: string) => documentsService.deleteDocument(docId),
    onSuccess: () => {
      toast.success("Document deleted");
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      router.push("/documents");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to delete document.");
    },
  });

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success("Verification code copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = async () => {
    if (!document) return;
    const toastId = toast.loading("Fetching secure download link...");
    try {
      const data = await documentsService.downloadSignedDocument(document._id);
      const response = await fetch(data.downloadUrl);
      if (!response.ok) {
        throw new Error("Could not fetch the PDF for download.");
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const anchor = window.document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = makeSafePdfFilename(document.title);
      window.document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);

      toast.dismiss(toastId);
      toast.success("Download started!");
    } catch (err: any) {
      toast.dismiss(toastId);
      toast.error(err?.message || "Failed to download signed document.");
    }
  };

  const formatDocDate = (dateString?: string | null) => {
    if (!dateString) return "-";
    try {
      return format(new Date(dateString), "MMMM d, yyyy 'at' h:mm a");
    } catch (e) {
      return dateString;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <ChevronLeft className="w-5 h-5 text-slate-400" />
          <span className="h-6 w-32 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2 h-[500px] bg-slate-200 dark:bg-slate-850 rounded-2xl animate-pulse" />
          <div className="h-[400px] bg-slate-200 dark:bg-slate-850 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-center min-h-[400px]">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Failed to load document</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm">
          The requested document record does not exist or you do not have permission to view it.
        </p>
        <div className="flex gap-4 mt-6">
          <Link href="/documents">
            <Button variant="outline" className="rounded-lg">Back to Documents</Button>
          </Link>
          <Button onClick={() => refetch()} className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg">Retry</Button>
        </div>
      </div>
    );
  }

  // Determine the URL to render (original before signing, signed once signed)
  const pdfUrl = document.signedPdfUrl || document.originalPdfUrl;

  return (
    <div className="space-y-6">
      {/* Back to list navigator */}
      <div className="flex items-center justify-between">
        <Link href="/documents" className="flex items-center text-xs font-semibold text-slate-500 hover:text-slate-200">
          <ChevronLeft className="w-4 h-4 mr-1.5" />
          Back to Documents
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-3 items-start">
        {/* Left Column: PDF Viewer */}
        <div className="md:col-span-2 space-y-4">
          <Card className="border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 p-4 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-800/60 pb-3">
              <div className="min-w-0">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-md">
                  {document.title}
                </h2>
                <p className="text-[10px] text-slate-400 mt-0.5 font-mono truncate">
                  ID: {document._id}
                </p>
              </div>
              <StatusBadge status={document.status} />
            </div>

            {/* Render client-side PDF viewer */}
            <PdfViewer url={pdfUrl} />
          </Card>
        </div>

        {/* Right Column: Metadata, Verification and Actions */}
        <div className="space-y-6">
          {/* Metadata Card */}
          <Card className="border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/60">
              <CardTitle className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Document Summary</CardTitle>
              <CardDescription className="text-[10px] text-slate-500">Cryptographic audit log information</CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {/* Date uploaded */}
              <div className="flex items-start space-x-3 text-xs">
                <Calendar className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-slate-400 font-medium">Uploaded Date</p>
                  <p className="text-slate-700 dark:text-slate-200 mt-0.5 font-semibold">
                    {formatDocDate(document.uploadedAt)}
                  </p>
                </div>
              </div>

              {/* Date signed */}
              {document.status === "SIGNED" && (
                <div className="flex items-start space-x-3 text-xs border-t border-slate-100 dark:border-slate-800/60 pt-3">
                  <ShieldCheck className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-slate-400 font-medium">Signed Date</p>
                    <p className="text-slate-700 dark:text-slate-200 mt-0.5 font-semibold">
                      {formatDocDate(document.signedAt)}
                    </p>
                  </div>
                </div>
              )}

              {/* Verification Code block */}
              <div className="flex flex-col space-y-2 border-t border-slate-100 dark:border-slate-800/60 pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-medium flex items-center">
                    <KeyRound className="w-3.5 h-3.5 mr-1.5 text-blue-500" />
                    Verification Code
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleCopyCode(document.verificationCode)}
                    className="h-7 w-7 rounded-lg text-slate-400 hover:text-slate-200"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </Button>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-150 dark:border-slate-850 flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-200">
                    {document.verificationCode}
                  </span>
                </div>
              </div>

              {/* Public verification info link */}
              <div className="border-t border-slate-100 dark:border-slate-800/60 pt-3">
                <Link href={`/verify/${document.verificationCode}`} className="flex items-center text-xs font-semibold text-blue-500 hover:text-blue-400">
                  <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                  Open Public Verification Page
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Actions panel */}
          <Card className="border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 shadow-sm p-4 space-y-3">
            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2 mb-2">Available Actions</h4>
            
            {/* Sign Document (Only if status is UPLOADED or IN_PROGRESS) */}
            {(document.status === "UPLOADED" || document.status === "IN_PROGRESS") && (
              <Link href={`/documents/${document._id}/sign`} className="block">
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-5 font-semibold flex items-center justify-center space-x-2">
                  <FileSignature className="w-4.5 h-4.5 mr-2" />
                  Sign Document
                </Button>
              </Link>
            )}

            {/* Download PDF (Only if status is SIGNED) */}
            {document.status === "SIGNED" ? (
              <Button
                onClick={handleDownload}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-5 font-semibold flex items-center justify-center space-x-2"
              >
                <Download className="w-4.5 h-4.5 mr-2" />
                Download Signed PDF
              </Button>
            ) : (
              <Button
                disabled
                className="w-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-xl py-5 font-semibold flex items-center justify-center space-x-2 border dark:border-slate-750"
              >
                <Download className="w-4.5 h-4.5 mr-2" />
                Download PDF (Signed only)
              </Button>
            )}

            {/* Delete Document */}
            <Button
              onClick={() => {
                if (confirm("Are you sure you want to delete this document? This soft-deletes the file and it will disappear from your dashboard.")) {
                  deleteMutation.mutate(document._id);
                }
              }}
              variant="ghost"
              disabled={deleteMutation.isPending}
              className="w-full justify-center text-red-500 hover:text-red-400 hover:bg-red-500/5 rounded-xl py-5 h-auto border border-dashed border-red-500/10 hover:border-red-500/20"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Document
                </>
              )}
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
