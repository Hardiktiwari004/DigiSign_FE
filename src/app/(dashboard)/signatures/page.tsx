"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  FileSignature,
  Loader2,
  PackagePlus,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { signaturesService } from "@/services/signatures.service";
import { ReusableSignature } from "@/types/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";

function formatDate(dateString?: string) {
  if (!dateString) return "-";
  try {
    return format(new Date(dateString), "MMM d, yyyy h:mm a");
  } catch {
    return dateString;
  }
}

export default function SignaturesPage() {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [defaultWidth, setDefaultWidth] = useState("180");
  const [defaultHeight, setDefaultHeight] = useState("75");
  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const { data: reusableSignatures = [], isLoading, error } = useQuery({
    queryKey: ["reusable-signatures"],
    queryFn: () => signaturesService.listReusableSignatures(),
  });

  const createMutation = useMutation({
    mutationFn: signaturesService.createReusableSignature,
    onSuccess: (signature) => {
      toast.success("Reusable signature saved", {
        description: `${signature.name} is now available in the signing flow.`,
      });
      queryClient.invalidateQueries({ queryKey: ["reusable-signatures"] });
      setName("");
      setDefaultWidth("180");
      setDefaultHeight("75");
      setSignatureFile(null);
      setSignaturePreview(null);
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to save reusable signature.");
    },
    onSettled: () => {
      setIsUploading(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => signaturesService.deleteReusableSignature(id),
    onSuccess: () => {
      toast.success("Reusable signature deleted");
      queryClient.invalidateQueries({ queryKey: ["reusable-signatures"] });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to delete reusable signature.");
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const validTypes = ["image/png", "image/jpeg", "image/jpg"];

    if (!validTypes.includes(file.type)) {
      toast.error("Invalid image format", {
        description: "Please upload a PNG, JPG, or JPEG file.",
      });
      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File too large", {
        description: "Signature image size must be under 5MB.",
      });
      e.target.value = "";
      return;
    }

    setSignatureFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setSignaturePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleCreate = () => {
    if (!signatureFile) {
      toast.error("Please upload a signature image first.");
      return;
    }

    const width = Number(defaultWidth);
    const height = Number(defaultHeight);
    if (!name.trim()) {
      toast.error("Please add a name for the signature.");
      return;
    }
    if (!Number.isFinite(width) || width <= 0 || !Number.isFinite(height) || height <= 0) {
      toast.error("Please enter valid default dimensions.");
      return;
    }

    setIsUploading(true);
    createMutation.mutate({
      file: signatureFile,
      name: name.trim(),
      defaultWidth: width,
      defaultHeight: height,
    });
  };

  const handleDelete = (signature: ReusableSignature) => {
    if (!confirm(`Delete "${signature.name}" from your reusable signature library?`)) {
      return;
    }

    deleteMutation.mutate(signature._id);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Link href="/documents" className="flex items-center text-xs font-semibold text-slate-500 hover:text-slate-200">
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back to Documents
        </Link>
        <Link href="/documents" className="text-xs font-semibold text-blue-500 hover:text-blue-400">
          Use a saved signature
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="border-slate-200/80 bg-white shadow-sm dark:border-slate-800/80 dark:bg-slate-900/60 lg:col-span-1">
          <CardHeader className="border-b border-slate-100 pb-4 dark:border-slate-800/60">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Create reusable signature
            </CardTitle>
            <CardDescription className="text-[10px] text-slate-500">
              Upload once, reuse across any document signing flow.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 pt-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Signature name</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Main signature"
                className="rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Default width
                </label>
                <Input
                  type="number"
                  min="1"
                  value={defaultWidth}
                  onChange={(e) => setDefaultWidth(e.target.value)}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Default height
                </label>
                <Input
                  type="number"
                  min="1"
                  value={defaultHeight}
                  onChange={(e) => setDefaultHeight(e.target.value)}
                  className="rounded-xl"
                />
              </div>
            </div>

            <div
              onClick={() => document.getElementById("reusableSignatureInput")?.click()}
              className="group relative flex min-h-[180px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-slate-200 bg-gradient-to-b from-slate-50 to-white p-5 text-center transition hover:border-blue-300 hover:bg-blue-50/40 dark:border-slate-800 dark:from-slate-950 dark:to-slate-900 dark:hover:border-blue-500/60 dark:hover:bg-blue-950/20"
            >
              <input
                id="reusableSignatureInput"
                type="file"
                accept=".png,.jpg,.jpeg"
                className="hidden"
                onChange={handleFileChange}
              />
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 transition group-hover:scale-105 dark:bg-slate-900 dark:ring-slate-800">
                <Upload className="h-5 w-5 text-blue-600" />
              </div>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Drop a signature image here</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                PNG or JPG only. We will reuse the stored image and your saved defaults during signing.
              </p>
              <Button
                type="button"
                variant="outline"
                className="mt-4 rounded-xl border-slate-200 bg-white text-xs shadow-sm dark:border-slate-800 dark:bg-slate-950"
                onClick={(event) => {
                  event.stopPropagation();
                  document.getElementById("reusableSignatureInput")?.click();
                }}
              >
                Choose file
              </Button>
            </div>

            {signaturePreview && (
              <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Preview</p>
                    <p className="text-xs text-slate-400">{signatureFile?.name}</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 rounded-lg text-xs"
                    onClick={() => {
                      setSignatureFile(null);
                      setSignaturePreview(null);
                    }}
                  >
                    Remove
                  </Button>
                </div>
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-2 dark:border-slate-800 dark:bg-slate-900">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={signaturePreview} alt="Reusable signature preview" className="h-28 w-full object-contain" />
                </div>
              </div>
            )}

            <Button
              onClick={handleCreate}
              disabled={isUploading || createMutation.isPending}
              className="w-full rounded-xl bg-blue-600 text-white hover:bg-blue-700"
            >
              {isUploading || createMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <FileSignature className="mr-2 h-4 w-4" />
                  Save reusable signature
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-4">
          <Card className="border-slate-200/80 bg-white shadow-sm dark:border-slate-800/80 dark:bg-slate-900/60">
            <CardHeader className="border-b border-slate-100 pb-4 dark:border-slate-800/60">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Your reusable signatures
              </CardTitle>
              <CardDescription className="text-[10px] text-slate-500">
                These signatures are available when signing documents.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-8 text-center text-sm text-slate-500">
                  <Loader2 className="mx-auto mb-3 h-5 w-5 animate-spin text-blue-500" />
                  Loading your saved signatures...
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center p-10 text-center">
                  <AlertCircle className="mb-3 h-10 w-10 text-red-500" />
                  <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    Could not load signature library
                  </h4>
                  <p className="mt-1 max-w-sm text-xs text-slate-500">
                    Check your connection or refresh the page to try again.
                  </p>
                </div>
              ) : reusableSignatures.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-center">
                  <PackagePlus className="mb-3 h-12 w-12 text-slate-400/60" />
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">No reusable signatures yet</h4>
                  <p className="mt-1 max-w-sm text-xs text-slate-500">
                    Upload your first signature and keep it ready for future documents.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 p-4 sm:grid-cols-2 xl:grid-cols-3">
                  {reusableSignatures.map((signature) => (
                    <div
                      key={signature._id}
                      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-950"
                    >
                      <div className="mb-3 flex h-28 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-2 dark:border-slate-800 dark:bg-slate-900">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={signature.signatureImageUrl}
                          alt={signature.name}
                          className="h-full w-full object-contain"
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                            {signature.name}
                          </h3>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          {signature.defaultWidth} x {signature.defaultHeight} pt
                        </p>
                        <div className="flex items-center gap-1 text-[11px] text-slate-400">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatDate(signature.createdAt)}
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between gap-2">
                        <Link href="/documents" className="text-xs font-semibold text-blue-500 hover:text-blue-400">
                          Use in signing
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 rounded-lg text-xs text-red-500 hover:text-red-400 hover:bg-red-500/5"
                          disabled={deleteMutation.isPending}
                          onClick={() => handleDelete(signature)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-slate-200/80 bg-white shadow-sm dark:border-slate-800/80 dark:bg-slate-900/60">
            <CardHeader className="border-b border-slate-100 pb-4 dark:border-slate-800/60">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Signing workflow
              </CardTitle>
              <CardDescription className="text-[10px] text-slate-500">
                How the reusable signature is used when you sign a document.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-4 text-xs text-slate-500">
              <p>1. Upload a signature image once and save it here.</p>
              <p>2. Open any document and pick your reusable signature from the signing screen.</p>
              <p>3. The backend uses the stored image and your saved width and height unless you override them.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
