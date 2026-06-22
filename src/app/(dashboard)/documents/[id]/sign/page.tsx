"use client";

import React, { useState, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Document, Page, pdfjs } from "react-pdf";
import confetti from "canvas-confetti";
import { documentsService } from "@/services/documents.service";
import { toast } from "sonner";
import {
  ChevronLeft,
  ChevronRight,
  Upload,
  RotateCcw,
  FileSignature,
  Maximize2,
  Minimize2,
  Move,
  Loader2,
  AlertCircle,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

// Set pdfjs worker source
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface OverlayPosition {
  left: number; // in pixels relative to page element
  top: number; // in pixels relative to page element
  width: number; // in pixels
  height: number; // in pixels
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

export default function SignDocumentPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  // React state
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);
  const [signatureAspectRatio, setSignatureAspectRatio] = useState<number>(DEFAULT_SIGNATURE_ASPECT_RATIO);
  const [isPlacementActive, setIsPlacementActive] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // PDF Page state
  const [pageDimensions, setPageDimensions] = useState<PageDimensions | null>(null);
  const [scale, setScale] = useState<number>(1.2);

  // Draggable overlay state
  const [overlayPos, setOverlayPos] = useState<OverlayPosition>({
    left: 40,
    top: 40,
    width: DEFAULT_OVERLAY_WIDTH,
    height: Math.round(DEFAULT_OVERLAY_WIDTH / DEFAULT_SIGNATURE_ASPECT_RATIO),
  });

  // Drag/Resize references
  const pageContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isDraggingRef = useRef(false);
  const isResizingRef = useRef<string | null>(null); // "se" | "sw" | "ne" | "nw"
  const startDragRef = useRef({ x: 0, y: 0, overlayLeft: 0, overlayTop: 0 });
  const startResizeRef = useRef({ x: 0, y: 0, width: 0, height: 0, left: 0, top: 0 });

  // Query doc details
  const { data: document, isLoading, error } = useQuery({
    queryKey: ["document", id],
    queryFn: () => documentsService.getDocument(id),
    enabled: !!id,
  });

  // Verify document isn't already signed
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


  const applySignatureAsset = (dataUrl: string, aspectRatio: number) => {
    const normalizedAspectRatio =
      Number.isFinite(aspectRatio) && aspectRatio > 0 ? aspectRatio : DEFAULT_SIGNATURE_ASPECT_RATIO;

    setSignaturePreview(dataUrl);
    setSignatureAspectRatio(normalizedAspectRatio);
    setOverlayPos((current) => {
      const candidateWidth = current.width || DEFAULT_OVERLAY_WIDTH;
      const maxWidthFromPage =
        pageDimensions != null
          ? Math.min(
              pageDimensions.renderedWidth - current.left,
              (pageDimensions.renderedHeight - current.top) * normalizedAspectRatio
            )
          : candidateWidth;
      const width = Math.max(MIN_OVERLAY_WIDTH, Math.min(candidateWidth, maxWidthFromPage));
      const height = Math.max(24, Math.round(width / normalizedAspectRatio));
      return { ...current, width, height };
    });
    setIsPlacementActive(true);
  };

  const resizeOverlayToWidth = (nextWidth: number) => {
    if (!pageDimensions) return;
    if (!Number.isFinite(nextWidth)) return;

    const normalizedAspectRatio =
      Number.isFinite(signatureAspectRatio) && signatureAspectRatio > 0
        ? signatureAspectRatio
        : DEFAULT_SIGNATURE_ASPECT_RATIO;

    const constrainedWidth = Math.max(
      MIN_OVERLAY_WIDTH,
      Math.min(
        nextWidth,
        pageDimensions.renderedWidth - overlayPos.left,
        (pageDimensions.renderedHeight - overlayPos.top) * normalizedAspectRatio
      )
    );

    setOverlayPos((current) => ({
      ...current,
      width: constrainedWidth,
      height: Math.max(24, Math.round(constrainedWidth / normalizedAspectRatio)),
    }));
  };


  // Process uploaded file
  const handleFileUploadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      const validTypes = ["image/png", "image/jpeg", "image/jpg"];
      if (!validTypes.includes(file.type)) {
        toast.error("Invalid image format", {
          description: "Please upload a PNG, JPG, or JPEG file.",
        });
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
        const dataUrl = reader.result as string;
        const img = new Image();
        img.onload = () => {
          applySignatureAsset(dataUrl, img.naturalWidth / img.naturalHeight);
          toast.success("Signature uploaded! Position it on the document.");
        };
        img.onerror = () => toast.error("Could not read the uploaded image.");
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
    }
    e.target.value = "";
  };

  const clearSignature = () => {
    setSignatureFile(null);
    setSignaturePreview(null);
    setSignatureAspectRatio(DEFAULT_SIGNATURE_ASPECT_RATIO);
    setIsPlacementActive(false);
    setOverlayPos({
      left: 40,
      top: 40,
      width: DEFAULT_OVERLAY_WIDTH,
      height: Math.round(DEFAULT_OVERLAY_WIDTH / DEFAULT_SIGNATURE_ASPECT_RATIO),
    });
    if (sigCanvasRef.current) {
      sigCanvasRef.current.clear();
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Drag and Resize Handlers
  const handleMouseDown = (e: React.MouseEvent, type: "drag" | "resize", handle?: string) => {
    e.preventDefault();
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
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingRef.current && pageDimensions) {
        const deltaX = e.clientX - startDragRef.current.x;
        const deltaY = e.clientY - startDragRef.current.y;
        const currentHeight = overlayPos.height;
        
        const newLeft = Math.max(
          0,
          Math.min(startDragRef.current.overlayLeft + deltaX, pageDimensions.renderedWidth - overlayPos.width)
        );
        const newTop = Math.max(
          0,
          Math.min(startDragRef.current.overlayTop + deltaY, pageDimensions.renderedHeight - currentHeight)
        );

        setOverlayPos((pos) => ({ ...pos, left: newLeft, top: newTop }));
      } else if (isResizingRef.current && pageDimensions) {
        const handle = isResizingRef.current;
        const deltaX = e.clientX - startResizeRef.current.x;
        const deltaY = e.clientY - startResizeRef.current.y;
        const normalizedAspectRatio =
          Number.isFinite(signatureAspectRatio) && signatureAspectRatio > 0
            ? signatureAspectRatio
            : DEFAULT_SIGNATURE_ASPECT_RATIO;

        let newWidth = startResizeRef.current.width;
        const newLeft = startResizeRef.current.left;
        const newTop = startResizeRef.current.top;

        if (handle === "se") {
          const widthFromX = startResizeRef.current.width + deltaX;
          const widthFromY = startResizeRef.current.width + deltaY * normalizedAspectRatio;
          newWidth = Math.max(MIN_OVERLAY_WIDTH, widthFromX, widthFromY);

          const maxWidthByRightEdge = pageDimensions.renderedWidth - newLeft;
          const maxWidthByBottomEdge = (pageDimensions.renderedHeight - newTop) * normalizedAspectRatio;
          newWidth = Math.min(newWidth, maxWidthByRightEdge, maxWidthByBottomEdge);
        }

        setOverlayPos({
          left: newLeft,
          top: newTop,
          width: newWidth,
          height: Math.max(24, Math.round(newWidth / normalizedAspectRatio)),
        });
      }
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      isResizingRef.current = null;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [overlayPos, pageDimensions, signatureAspectRatio]);

  // Coordinate Conversion & Submit
  const handleSignDocument = async () => {
    if (!signatureFile || !pageDimensions || !document) return;

    setIsSubmitting(true);
    const toastId = toast.loading("Cryptographically locking signature coordinates...");

    try {
      // Coordinate transformation from browser coordinates (top-left) to PDF points (bottom-left)
      // The page is rendered with a uniform scale, so one factor keeps the signature ratio intact.
      const scaleFactor = pageDimensions.pdfWidth / pageDimensions.renderedWidth;

      const pdfPoints = {
        x: overlayPos.left * scaleFactor,
        y: pageDimensions.pdfHeight - (overlayPos.top + overlayPos.height) * scaleFactor,
        width: overlayPos.width * scaleFactor,
        height: overlayPos.height * scaleFactor,
      };

      // Validations
      if (pdfPoints.x < 0 || pdfPoints.y < 0 || pdfPoints.width <= 0 || pdfPoints.height <= 0) {
        throw new Error("Invalid coordinate boundary translation.");
      }

      await documentsService.signDocument({
        documentId: document._id,
        page: pageNumber,
        x: Math.round(pdfPoints.x),
        y: Math.round(pdfPoints.y),
        width: Math.round(pdfPoints.width),
        height: Math.round(pdfPoints.height),
        signatureImage: signatureFile,
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
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Unable to load signature workspace</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm">
          Please check the document ID or your workspace access permissions.
        </p>
        <Link href="/documents" className="mt-6">
          <Button variant="outline" className="rounded-lg">Return to Documents</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header breadcrumb */}
      <div className="flex items-center justify-between">
        <Link href={`/documents/${id}`} className="flex items-center text-xs font-semibold text-slate-500 hover:text-slate-200">
          <ChevronLeft className="w-4 h-4 mr-1.5" />
          Cancel and Return
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-4 items-start">
        {/* Left Column: PDF Renderer Canvas (Takes 3 cols on desktop) */}
        <div className="md:col-span-3 space-y-4">
          <Card className="border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 p-4 shadow-sm overflow-hidden flex flex-col items-center">
            
            {/* Viewport Scale & Page Nav */}
            <div className="w-full flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60 pb-3 mb-4">
              <div className="flex items-center space-x-2">
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

              <div className="flex items-center space-x-2">
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

            {/* Document Render Zone with absolute placement overlay container */}
            <div className="w-full flex justify-center overflow-auto max-h-[75vh] p-4 relative bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
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

                {/* Draggable & Resizable overlay of signature preview */}
                {isPlacementActive && signaturePreview && pageDimensions && (
                  <div
                    style={{
                      position: "absolute",
                      left: `${overlayPos.left}px`,
                      top: `${overlayPos.top}px`,
                      width: `${overlayPos.width}px`,
                      height: `${overlayPos.height}px`,
                    }}
                    className="group flex cursor-move select-none items-center justify-center rounded-2xl border border-blue-500 bg-blue-500/10 p-1 shadow-md shadow-blue-500/15 backdrop-blur-[2px] active:border-blue-600 dark:bg-blue-600/5"
                    onMouseDown={(e) => handleMouseDown(e, "drag")}
                  >
                    {/* Drag Handle Indicator */}
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center rounded bg-blue-600 px-1.5 py-0.5 text-[8px] font-extrabold uppercase tracking-wider text-white opacity-0 transition-opacity group-hover:opacity-100">
                      <Move className="w-2.5 h-2.5 mr-1" /> Move
                    </div>

                    {/* Resize handle (Bottom-Right corner) */}
                    <div
                      className="absolute -right-1 -bottom-1 flex h-3 w-3 cursor-se-resize items-center justify-center rounded-full border border-white bg-blue-600 hover:bg-blue-700"
                      onMouseDown={(e) => handleMouseDown(e, "resize", "se")}
                    />

                    {/* Preview rendering */}
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

        {/* Right Column: Signature Creation pad */}
        <div className="space-y-6">
          <Card className="border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 shadow-sm overflow-hidden">
            <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-800/60">
              <CardTitle className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Create Signature
              </CardTitle>
              <CardDescription className="text-[10px] text-slate-500">
                Choose a signature generation method
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-4 space-y-4">
              <div className="space-y-4">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="group relative flex min-h-[180px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-slate-200 bg-gradient-to-b from-slate-50 to-white p-6 text-center transition hover:border-blue-300 hover:bg-blue-50/40 dark:border-slate-800 dark:from-slate-950 dark:to-slate-900 dark:hover:border-blue-500/60 dark:hover:bg-blue-950/20"
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
              </div>
            </CardContent>
          </Card>

          {/* Setup / Action Details */}
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
                    <p className="text-xs text-slate-400">Resize with one locked width control.</p>
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
                </div>
              </div>

              <div className="flex items-center space-x-3.5 pt-2">
                <Button
                  onClick={clearSignature}
                  variant="outline"
                  className="flex-1 rounded-xl text-xs py-5 h-auto dark:border-slate-800"
                >
                  Reset
                </Button>
                <Button
                  onClick={handleSignDocument}
                  disabled={isSubmitting}
                  className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs py-5 h-auto font-semibold flex items-center justify-center"
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
