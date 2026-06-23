"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Document, Page, pdfjs } from "react-pdf";
import confetti from "canvas-confetti";
import { toast } from "sonner";
import { documentsService } from "@/services/documents.service";
import { signaturesService } from "@/services/signatures.service";
import { ReusableSignature } from "@/types/api";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  FileSignature,
  Info,
  Loader2,
  Maximize2,
  Minimize2,
  Move,
  PackagePlus,
  Palette,
  RotateCcw,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

// Set pdfjs worker source
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface OverlayPosition {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface PageDimensions {
  renderedWidth: number;
  renderedHeight: number;
  pdfWidth: number;
  pdfHeight: number;
}

interface PdfPageLike {
  getViewport: (options: { scale: number }) => { width: number; height: number };
}

const DEFAULT_SIGNATURE_ASPECT_RATIO = 2.4;
const DEFAULT_OVERLAY_WIDTH = 180;
const MIN_OVERLAY_WIDTH = 96;

function getAspectRatio(signature?: Pick<ReusableSignature, "defaultWidth" | "defaultHeight"> | null) {
  if (!signature || !signature.defaultWidth || !signature.defaultHeight) {
    return DEFAULT_SIGNATURE_ASPECT_RATIO;
  }

  const ratio = signature.defaultWidth / signature.defaultHeight;
  return Number.isFinite(ratio) && ratio > 0 ? ratio : DEFAULT_SIGNATURE_ASPECT_RATIO;
}

export default function SignDocumentPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [pageNumber, setPageNumber] = useState(1);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageDimensions, setPageDimensions] = useState<PageDimensions | null>(null);
  const [scale, setScale] = useState(() => {
    if (typeof window === "undefined") {
      return 1.2;
    }

    return window.innerWidth < 640 ? 0.62 : 1.2;
  });

  const [signatureMode, setSignatureMode] = useState<"upload" | "library">("upload");
  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);
  const [signatureAspectRatio, setSignatureAspectRatio] = useState(DEFAULT_SIGNATURE_ASPECT_RATIO);
  const [selectedReusableSignatureId, setSelectedReusableSignatureId] = useState<string | null>(null);
  const [isReusableSizeOverridden, setIsReusableSizeOverridden] = useState(false);
  const [isPlacementActive, setIsPlacementActive] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [overlayPos, setOverlayPos] = useState<OverlayPosition>({
    left: 40,
    top: 40,
    width: DEFAULT_OVERLAY_WIDTH,
    height: Math.round(DEFAULT_OVERLAY_WIDTH / DEFAULT_SIGNATURE_ASPECT_RATIO),
  });

  const pageContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isDraggingRef = useRef(false);
  const isResizingRef = useRef<string | null>(null);
  const activePointerRef = useRef<number | null>(null);
  const startDragRef = useRef({ x: 0, y: 0, overlayLeft: 0, overlayTop: 0 });
  const startResizeRef = useRef({ x: 0, y: 0, width: 0, height: 0, left: 0, top: 0 });

  const { data: document, isLoading, error } = useQuery({
    queryKey: ["document", id],
    queryFn: () => documentsService.getDocument(id),
    enabled: !!id,
  });

  const { data: reusableSignatures = [], isLoading: isReusableLoading } = useQuery({
    queryKey: ["reusable-signatures"],
    queryFn: () => signaturesService.listReusableSignatures(),
  });

  const selectedReusableSignature =
    reusableSignatures.find((signature) => signature._id === selectedReusableSignatureId) ?? null;

  useEffect(() => {
    if (document && document.status === "SIGNED") {
      toast.error("Document is already signed");
      router.push(`/documents/${id}`);
    }
  }, [document, id, router]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPageNumber(1);
  };

  const onPageLoadSuccess = (page: PdfPageLike) => {
    const viewport = page.getViewport({ scale });
    const originalViewport = page.getViewport({ scale: 1.0 });

    setPageDimensions({
      renderedWidth: viewport.width,
      renderedHeight: viewport.height,
      pdfWidth: originalViewport.width,
      pdfHeight: originalViewport.height,
    });
  };

  const clampOverlayToPage = (nextWidth: number, aspectRatio: number) => {
    const normalizedAspectRatio =
      Number.isFinite(aspectRatio) && aspectRatio > 0 ? aspectRatio : DEFAULT_SIGNATURE_ASPECT_RATIO;

    const width = Math.max(MIN_OVERLAY_WIDTH, nextWidth);
    const height = Math.max(24, Math.round(width / normalizedAspectRatio));

    if (!pageDimensions) {
      return { width, height, left: overlayPos.left, top: overlayPos.top };
    }

    const maxLeft = Math.max(0, pageDimensions.renderedWidth - width);
    const maxTop = Math.max(0, pageDimensions.renderedHeight - height);

    return {
      width: Math.min(width, pageDimensions.renderedWidth),
      height: Math.min(height, pageDimensions.renderedHeight),
      left: Math.min(overlayPos.left, maxLeft),
      top: Math.min(overlayPos.top, maxTop),
    };
  };

  const activateSignatureAsset = (
    previewUrl: string,
    aspectRatio: number,
    preferredPdfWidth?: number,
    preferredPdfHeight?: number
  ) => {
    const normalizedAspectRatio = getAspectRatio(
      preferredPdfWidth && preferredPdfHeight
        ? { defaultWidth: preferredPdfWidth, defaultHeight: preferredPdfHeight }
        : null
    );

    setSignaturePreview(previewUrl);
    setSignatureAspectRatio(Number.isFinite(aspectRatio) && aspectRatio > 0 ? aspectRatio : normalizedAspectRatio);
    setIsPlacementActive(true);
    setOverlayPos((current) => {
      const scaleFactor =
        pageDimensions && pageDimensions.pdfWidth > 0
          ? pageDimensions.renderedWidth / pageDimensions.pdfWidth
          : null;

      const preferredWidth =
        preferredPdfWidth && scaleFactor ? preferredPdfWidth * scaleFactor : current.width || DEFAULT_OVERLAY_WIDTH;
      const nextSize = clampOverlayToPage(preferredWidth, aspectRatio);

      return {
        left: nextSize.left,
        top: nextSize.top,
        width: nextSize.width,
        height: nextSize.height,
      };
    });
  };

  const applyReusableSignature = (signature: ReusableSignature) => {
    setSelectedReusableSignatureId(signature._id);
    setSignatureMode("library");
    setSignatureFile(null);
    setIsReusableSizeOverridden(false);
    activateSignatureAsset(
      signature.signatureImageUrl,
      getAspectRatio(signature),
      signature.defaultWidth,
      signature.defaultHeight
    );
  };

  useEffect(() => {
    if (signatureMode !== "library" || !selectedReusableSignature) {
      return;
    }

    if (isReusableSizeOverridden) {
      return;
    }

    activateSignatureAsset(
      selectedReusableSignature.signatureImageUrl,
      getAspectRatio(selectedReusableSignature),
      selectedReusableSignature.defaultWidth,
      selectedReusableSignature.defaultHeight
    );
    // Re-sync to the visible page size whenever the page is loaded or zoomed.
    // This keeps the saved PDF-point defaults aligned with the rendered canvas.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    pageDimensions?.renderedWidth,
    pageDimensions?.renderedHeight,
    signatureMode,
    selectedReusableSignatureId,
    isReusableSizeOverridden,
  ]);

  const resizeOverlayToWidth = (nextWidth: number) => {
    if (!Number.isFinite(nextWidth)) return;

    const nextSize = clampOverlayToPage(nextWidth, signatureAspectRatio);
    setOverlayPos(nextSize);

    if (signatureMode === "library") {
      setIsReusableSizeOverridden(true);
    }
  };

  const clearSignature = () => {
    setSignatureFile(null);
    setSignaturePreview(null);
    setSignatureAspectRatio(DEFAULT_SIGNATURE_ASPECT_RATIO);
    setSignatureMode("upload");
    setSelectedReusableSignatureId(null);
    setIsReusableSizeOverridden(false);
    setIsPlacementActive(false);
    setOverlayPos({
      left: 40,
      top: 40,
      width: DEFAULT_OVERLAY_WIDTH,
      height: Math.round(DEFAULT_OVERLAY_WIDTH / DEFAULT_SIGNATURE_ASPECT_RATIO),
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileUploadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
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

      setSignatureMode("upload");
      setSelectedReusableSignatureId(null);
      setIsReusableSizeOverridden(false);
      setSignatureFile(file);

      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const img = new Image();
        img.onload = () => {
          activateSignatureAsset(dataUrl, img.naturalWidth / img.naturalHeight);
          toast.success("Signature uploaded! Position it on the document.");
        };
        img.onerror = () => toast.error("Could not read the uploaded image.");
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
    }

    e.target.value = "";
  };

  const handlePointerDown = (e: React.PointerEvent, type: "drag" | "resize", handle?: string) => {
    e.preventDefault();
    e.stopPropagation();
    activePointerRef.current = e.pointerId;

    if (type === "drag") {
      isDraggingRef.current = true;
      startDragRef.current = {
        x: e.clientX,
        y: e.clientY,
        overlayLeft: overlayPos.left,
        overlayTop: overlayPos.top,
      };
    } else if (type === "resize" && handle) {
      isResizingRef.current = handle;
      startResizeRef.current = {
        x: e.clientX,
        y: e.clientY,
        width: overlayPos.width,
        height: overlayPos.height,
        left: overlayPos.left,
        top: overlayPos.top,
      };
    }
  };

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (activePointerRef.current !== e.pointerId) {
        return;
      }

      if (isDraggingRef.current && pageDimensions) {
        const deltaX = e.clientX - startDragRef.current.x;
        const deltaY = e.clientY - startDragRef.current.y;

        const nextLeft = Math.max(
          0,
          Math.min(startDragRef.current.overlayLeft + deltaX, pageDimensions.renderedWidth - overlayPos.width)
        );
        const nextTop = Math.max(
          0,
          Math.min(startDragRef.current.overlayTop + deltaY, pageDimensions.renderedHeight - overlayPos.height)
        );

        setOverlayPos((current) => ({ ...current, left: nextLeft, top: nextTop }));
      } else if (isResizingRef.current && pageDimensions) {
        const handle = isResizingRef.current;
        const deltaX = e.clientX - startResizeRef.current.x;
        const deltaY = e.clientY - startResizeRef.current.y;
        const normalizedAspectRatio =
          Number.isFinite(signatureAspectRatio) && signatureAspectRatio > 0
            ? signatureAspectRatio
            : DEFAULT_SIGNATURE_ASPECT_RATIO;

        let nextWidth = startResizeRef.current.width;
        const nextLeft = startResizeRef.current.left;
        const nextTop = startResizeRef.current.top;

        if (handle === "se") {
          const widthFromX = startResizeRef.current.width + deltaX;
          const widthFromY = startResizeRef.current.width + deltaY * normalizedAspectRatio;
          nextWidth = Math.max(MIN_OVERLAY_WIDTH, widthFromX, widthFromY);

          const maxWidthByRightEdge = pageDimensions.renderedWidth - nextLeft;
          const maxWidthByBottomEdge = (pageDimensions.renderedHeight - nextTop) * normalizedAspectRatio;
          nextWidth = Math.min(nextWidth, maxWidthByRightEdge, maxWidthByBottomEdge);
        }

        setOverlayPos({
          left: nextLeft,
          top: nextTop,
          width: nextWidth,
          height: Math.max(24, Math.round(nextWidth / normalizedAspectRatio)),
        });

        if (signatureMode === "library") {
          setIsReusableSizeOverridden(true);
        }
      }
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (activePointerRef.current !== e.pointerId) {
        return;
      }

      isDraggingRef.current = false;
      isResizingRef.current = null;
      activePointerRef.current = null;
    };

    const handlePointerCancel = (e: PointerEvent) => {
      if (activePointerRef.current !== e.pointerId) {
        return;
      }

      isDraggingRef.current = false;
      isResizingRef.current = null;
      activePointerRef.current = null;
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerCancel);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerCancel);
    };
  }, [overlayPos.height, overlayPos.width, pageDimensions, signatureAspectRatio, signatureMode]);

  const handleSignDocument = async () => {
    if (!pageDimensions || !document || !signaturePreview) return;

    const hasReusableSelection = signatureMode === "library" && !!selectedReusableSignatureId;
    if (signatureMode === "upload" && !signatureFile) return;
    if (signatureMode === "library" && !hasReusableSelection) return;

    setIsSubmitting(true);
    const toastId = toast.loading("Cryptographically locking signature coordinates...");

    try {
      const scaleFactor = pageDimensions.pdfWidth / pageDimensions.renderedWidth;

      const pdfPoints = {
        x: overlayPos.left * scaleFactor,
        y: pageDimensions.pdfHeight - (overlayPos.top + overlayPos.height) * scaleFactor,
        width: overlayPos.width * scaleFactor,
        height: overlayPos.height * scaleFactor,
      };

      if (pdfPoints.x < 0 || pdfPoints.y < 0 || pdfPoints.width <= 0 || pdfPoints.height <= 0) {
        throw new Error("Invalid coordinate boundary translation.");
      }

      await documentsService.signDocument({
        documentId: document._id,
        page: pageNumber,
        x: Math.round(pdfPoints.x),
        y: Math.round(pdfPoints.y),
        ...(signatureMode === "upload" || isReusableSizeOverridden
          ? {
              width: Math.round(pdfPoints.width),
              height: Math.round(pdfPoints.height),
            }
          : {}),
        ...(signatureMode === "upload"
          ? {
              signatureImage: signatureFile ?? undefined,
            }
          : {
              reusableSignatureId: selectedReusableSignatureId ?? undefined,
            }),
      });

      toast.dismiss(toastId);
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
      });
      toast.success("Document signed successfully!", {
        description: "Your cryptographically bound document is locked and verified.",
      });
      router.push(`/documents/${id}`);
    } catch (err: unknown) {
      console.error(err);
      toast.dismiss(toastId);
      toast.error(err instanceof Error ? err.message : "Failed to submit document signature.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[500px] flex items-center justify-center flex-col space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <p className="text-sm text-slate-400 font-medium">Loading layout canvas...</p>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-center min-h-[400px]">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">
          Unable to load signature workspace
        </h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm">
          Please check the document ID or your workspace access permissions.
        </p>
        <Link href="/documents" className="mt-6">
          <Button variant="outline" className="rounded-lg">
            Return to Documents
          </Button>
        </Link>
      </div>
    );
  }

  const canSubmit =
    !!signaturePreview &&
    !!pageDimensions &&
    (signatureMode === "upload" ? !!signatureFile : !!selectedReusableSignatureId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href={`/documents/${id}`}
          className="flex items-center text-xs font-semibold text-slate-500 hover:text-slate-200"
        >
          <ChevronLeft className="w-4 h-4 mr-1.5" />
          Cancel and Return
        </Link>

        <Link href="/signatures" className="text-xs font-semibold text-blue-500 hover:text-blue-400">
          Manage reusable signatures
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-4 items-start">
        <div className="lg:col-span-3 space-y-4">
          <Card className="border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 p-4 shadow-sm overflow-hidden flex flex-col items-center">
            <div className="w-full flex flex-col gap-3 border-b border-slate-100 dark:border-slate-800/60 pb-3 mb-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center justify-between gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setPageNumber((p) => Math.max(p - 1, 1))}
                  disabled={pageNumber <= 1}
                  className="h-8 w-8 rounded-lg"
                >
                  <ChevronLeft className="w-4.5 h-4.5" />
                </Button>
                <span className="text-xs text-slate-500 font-semibold">
                  Page {pageNumber} of {numPages || "--"}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setPageNumber((p) => Math.min(p + 1, numPages || 1))}
                  disabled={!numPages || pageNumber >= numPages}
                  className="h-8 w-8 rounded-lg"
                >
                  <ChevronRight className="w-4.5 h-4.5" />
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setScale((s) => Math.max(s - 0.1, 0.6))}
                  className="h-8 text-xs rounded-lg"
                >
                  <Minimize2 className="w-4 h-4 mr-1.5" /> Out
                </Button>
                <span className="text-xs font-mono text-slate-500 font-semibold px-2">
                  {Math.round(scale * 100)}%
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setScale((s) => Math.min(s + 0.1, 1.8))}
                  className="h-8 text-xs rounded-lg"
                >
                  <Maximize2 className="w-4 h-4 mr-1.5" /> In
                </Button>
              </div>
            </div>

            <div className="w-full flex justify-center overflow-auto max-h-[60vh] sm:max-h-[75vh] p-2 sm:p-4 relative bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
              <div
                ref={pageContainerRef}
                className="relative select-none"
                style={{
                  width: pageDimensions?.renderedWidth || "auto",
                  height: pageDimensions?.renderedHeight || "auto",
                }}
              >
                <Document
                  file={document.originalPdfUrl}
                  onLoadSuccess={onDocumentLoadSuccess}
                  loading={
                    <div className="p-12 flex flex-col justify-center items-center space-y-2">
                      <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                      <p className="text-xs text-slate-400 font-medium">Mounting engine...</p>
                    </div>
                  }
                >
                  <Page
                    pageNumber={pageNumber}
                    scale={scale}
                    renderAnnotationLayer={false}
                    renderTextLayer={false}
                    onLoadSuccess={onPageLoadSuccess}
                    className="border shadow-lg"
                  />
                </Document>

                {isPlacementActive && signaturePreview && pageDimensions && (
                  <div
                    style={{
                      position: "absolute",
                      left: `${overlayPos.left}px`,
                      top: `${overlayPos.top}px`,
                      width: `${overlayPos.width}px`,
                      height: `${overlayPos.height}px`,
                      touchAction: "none",
                    }}
                    className="group flex cursor-grab select-none items-center justify-center rounded-2xl border border-blue-500 bg-blue-500/10 p-1 shadow-md shadow-blue-500/15 backdrop-blur-[2px] active:cursor-grabbing active:border-blue-600 dark:bg-blue-600/5 touch-none"
                    onPointerDown={(e) => handlePointerDown(e, "drag")}
                  >
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center rounded bg-blue-600 px-1.5 py-0.5 text-[8px] font-extrabold uppercase tracking-wider text-white opacity-0 transition-opacity group-hover:opacity-100 sm:group-hover:opacity-100">
                      <Move className="w-2.5 h-2.5 mr-1" /> Move
                    </div>

                    <div
                      className="absolute -right-1 -bottom-1 flex h-4 w-4 cursor-se-resize items-center justify-center rounded-full border border-white bg-blue-600 hover:bg-blue-700 touch-none"
                      onPointerDown={(e) => handlePointerDown(e, "resize", "se")}
                      style={{ touchAction: "none" }}
                    />

                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={signaturePreview}
                      alt="Signature overlay"
                      className="pointer-events-none block h-full w-full object-contain"
                    />
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6 lg:sticky lg:top-6">
          <Card className="border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 shadow-sm overflow-hidden">
            <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-800/60">
              <CardTitle className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Signature Source
              </CardTitle>
              <CardDescription className="text-[10px] text-slate-500">
                Upload a new signature or pick from your library
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-4 space-y-4">
              <div className="grid grid-cols-1 gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-1 sm:grid-cols-2 dark:border-slate-800 dark:bg-slate-950">
                <Button
                  type="button"
                  variant={signatureMode === "upload" ? "default" : "ghost"}
                  className="rounded-xl text-xs"
                  onClick={clearSignature}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Upload
                </Button>
                <Button
                  type="button"
                  variant={signatureMode === "library" ? "default" : "ghost"}
                  className="rounded-xl text-xs"
                  onClick={() => {
                    setSignatureMode("library");
                    setSignatureFile(null);
                    setSignaturePreview(null);
                    setIsPlacementActive(false);
                    setIsReusableSizeOverridden(false);
                  }}
                >
                  <Palette className="mr-2 h-4 w-4" />
                  Library
                </Button>
              </div>

              {signatureMode === "upload" ? (
                <div className="space-y-4">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="group relative flex min-h-[160px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-slate-200 bg-gradient-to-b from-slate-50 to-white p-4 text-center transition hover:border-blue-300 hover:bg-blue-50/40 sm:min-h-[180px] sm:p-6 dark:border-slate-800 dark:from-slate-950 dark:to-slate-900 dark:hover:border-blue-500/60 dark:hover:bg-blue-950/20"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".png,.jpg,.jpeg"
                      className="hidden"
                      onChange={handleFileUploadChange}
                    />
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 transition group-hover:scale-105 dark:bg-slate-900 dark:ring-slate-800">
                      <Upload className="h-5 w-5 text-blue-600" />
                    </div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      Drop a signature image here
                    </p>
                    <p className="mt-1 max-w-[220px] text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                      PNG or JPG works best. We keep the image ratio locked when you place it on the page.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      className="mt-4 rounded-xl border-slate-200 bg-white text-xs shadow-sm dark:border-slate-800 dark:bg-slate-950"
                      onClick={(event) => {
                        event.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                    >
                      Choose file
                    </Button>
                    <p className="mt-3 text-[10px] font-medium uppercase tracking-wider text-slate-400">
                      Max file size 5MB
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-slate-500">
                    <span className="font-semibold">Saved signatures</span>
                    <Link href="/signatures" className="text-blue-500 hover:text-blue-400 normal-case">
                      Open library
                    </Link>
                  </div>

                  {isReusableLoading ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-500 dark:border-slate-800">
                      Loading your saved signatures...
                    </div>
                  ) : reusableSignatures.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-500 dark:border-slate-800">
                      <PackagePlus className="mx-auto mb-2 h-5 w-5 text-slate-400" />
                      No reusable signatures yet. Create one in the library first.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[320px] overflow-auto pr-1 sm:max-h-[360px]">
                      {reusableSignatures.map((signature) => {
                        const isActive = signature._id === selectedReusableSignatureId;
                        return (
                          <button
                            key={signature._id}
                            type="button"
                            onClick={() => applyReusableSignature(signature)}
                            className={[
                              "w-full rounded-2xl border p-3 text-left transition",
                              isActive
                                ? "border-blue-500 bg-blue-500/5 shadow-sm"
                                : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-900",
                            ].join(" ")}
                          >
                            <div className="flex gap-3">
                              <div className="h-14 w-20 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-slate-800 dark:bg-slate-900">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={signature.signatureImageUrl}
                                  alt={signature.name}
                                  className="h-full w-full object-contain"
                                />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                                      {signature.name}
                                    </p>
                                    <p className="text-[11px] text-slate-500">
                                      {signature.defaultWidth} x {signature.defaultHeight} pt
                                    </p>
                                  </div>
                                  {isActive && (
                                    <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-semibold text-white">
                                      Selected
                                    </span>
                                  )}
                                </div>
                                <p className="mt-2 text-[11px] text-slate-400">
                                  Click to prefill the signer with this reusable asset.
                                </p>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {signaturePreview && signatureFile && (
                <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        Uploaded preview
                      </p>
                      <p className="text-xs text-slate-400">{signatureFile.name}</p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={clearSignature}
                      className="h-8 rounded-lg text-xs"
                    >
                      Remove
                    </Button>
                  </div>
                  <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-2 dark:border-slate-800 dark:bg-slate-900">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={signaturePreview} alt="Uploaded signature preview" className="h-28 w-full object-contain" />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {isPlacementActive && signaturePreview && (
            <Card className="border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 shadow-sm p-4 space-y-4">
              <div className="flex items-center space-x-2 text-xs text-blue-500 font-semibold uppercase tracking-wider">
                <Info className="w-4 h-4" />
                <span>Placement Helper</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Drag the signature on top of the document to position it. You can resize it by pulling the handle at the bottom-right corner.
              </p>

              <div className="rounded-2xl border border-slate-200/70 bg-gradient-to-b from-slate-50 to-white p-4 shadow-sm dark:border-slate-800 dark:from-slate-950 dark:to-slate-900/60">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Placement size</p>
                    <p className="text-xs text-slate-400">
                      {signatureMode === "library" && !isReusableSizeOverridden
                        ? "Using the reusable signature defaults."
                        : "Resize with the width control."}
                    </p>
                  </div>
                  <div className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-200 dark:ring-slate-800">
                    {overlayPos.width}px
                  </div>
                </div>
                <Input
                  type="range"
                  min={MIN_OVERLAY_WIDTH}
                  max={pageDimensions ? Math.max(MIN_OVERLAY_WIDTH, pageDimensions.renderedWidth) : 600}
                  step="1"
                  value={overlayPos.width}
                  onChange={(e) => resizeOverlayToWidth(Number(e.target.value))}
                  className="h-2 cursor-pointer accent-blue-600"
                />
                <div className="mt-3 flex flex-wrap gap-2 text-[10px] text-slate-400">
                  <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 dark:border-slate-800 dark:bg-slate-950">
                    Drag on document to move
                  </span>
                  <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 dark:border-slate-800 dark:bg-slate-950">
                    Corner handle keeps ratio fixed
                  </span>
                  {signatureMode === "library" && (
                    <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 dark:border-slate-800 dark:bg-slate-950">
                      Uses reusable signature defaults when untouched
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:space-x-3.5 sm:gap-0">
                <Button
                  onClick={clearSignature}
                  variant="outline"
                  className="w-full rounded-xl text-xs py-5 h-auto dark:border-slate-800 sm:flex-1"
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Reset
                </Button>
                <Button
                  onClick={handleSignDocument}
                  disabled={!canSubmit || isSubmitting}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs py-5 h-auto font-semibold flex items-center justify-center sm:flex-[2]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Signing...
                    </>
                  ) : (
                    <>
                      <FileSignature className="w-4 h-4 mr-2" />
                      Sign Document
                    </>
                  )}
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
