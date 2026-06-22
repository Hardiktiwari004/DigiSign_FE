"use client";

import React, { useState, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import {
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Set pdfjs worker source
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfViewerProps {
  url: string;
  onPageLoadSuccess?: (pdfInfo: { numPages: number; pageSizes: Array<{ width: number; height: number }> }) => void;
  currentPage?: number;
  onPageChange?: (page: number) => void;
}

export function PdfViewer({ url, onPageLoadSuccess, currentPage: externalPage, onPageChange }: PdfViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [pageSizes, setPageSizes] = useState<Array<{ width: number; height: number }>>([]);
  const [loading, setLoading] = useState(true);

  // Sync with external page control if provided
  useEffect(() => {
    if (externalPage && externalPage !== pageNumber) {
      setPageNumber(externalPage);
    }
  }, [externalPage]);

  const changePage = (offset: number) => {
    const newPage = pageNumber + offset;
    if (numPages && newPage >= 1 && newPage <= numPages) {
      setPageNumber(newPage);
      onPageChange?.(newPage);
    }
  };

  const handlePageInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const val = parseInt(e.currentTarget.value);
      if (numPages && val >= 1 && val <= numPages) {
        setPageNumber(val);
        onPageChange?.(val);
      }
    }
  };

  const onDocumentLoadSuccess = async (pdf: any) => {
    setNumPages(pdf.numPages);
    setLoading(false);

    // Read sizes of all pages to pass to parent (critical for signature placement coordinate calculations)
    const sizes: Array<{ width: number; height: number }> = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 1.0 });
      sizes.push({
        width: viewport.width,
        height: viewport.height,
      });
    }
    setPageSizes(sizes);

    onPageLoadSuccess?.({
      numPages: pdf.numPages,
      pageSizes: sizes,
    });
  };

  return (
    <div className="flex flex-col items-center w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm relative">
      {/* Top Toolbar */}
      <div className="w-full flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-900 z-10">
        {/* Pagination controls */}
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => changePage(-1)}
            disabled={pageNumber <= 1 || loading}
            className="h-8 w-8 rounded-lg"
          >
            <ChevronLeft className="w-4.5 h-4.5" />
          </Button>
          <div className="flex items-center space-x-1.5 text-xs text-slate-500 font-medium">
            <Input
              type="number"
              value={pageNumber}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                if (numPages && val >= 1 && val <= numPages) {
                  setPageNumber(val);
                  onPageChange?.(val);
                }
              }}
              className="w-10 h-7 text-center p-0 font-semibold border-slate-200 dark:border-slate-800 rounded-md focus:ring-1"
              disabled={loading || !numPages}
            />
            <span>/</span>
            <span className="font-semibold">{numPages || "--"}</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => changePage(1)}
            disabled={!numPages || pageNumber >= numPages || loading}
            className="h-8 w-8 rounded-lg"
          >
            <ChevronRight className="w-4.5 h-4.5" />
          </Button>
        </div>

        {/* Zoom controls */}
        <div className="flex items-center space-x-1.5">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setScale((s) => Math.max(s - 0.15, 0.5))}
            disabled={loading}
            className="h-8 w-8 rounded-lg"
          >
            <ZoomOut className="w-4.5 h-4.5" />
          </Button>
          <span className="text-xs font-semibold text-slate-500 min-w-[45px] text-center font-mono">
            {Math.round(scale * 100)}%
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setScale((s) => Math.min(s + 0.15, 2.0))}
            disabled={loading}
            className="h-8 w-8 rounded-lg"
          >
            <ZoomIn className="w-4.5 h-4.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setScale(1.0)}
            disabled={loading}
            className="h-8 w-8 rounded-lg"
            title="Reset Zoom"
          >
            <Maximize2 className="w-4.5 h-4.5" />
          </Button>
        </div>
      </div>

      {/* Page rendering viewport wrapper */}
      <div className="w-full flex justify-center p-6 overflow-auto max-h-[70vh] min-h-[400px] relative">
        <Document
          file={url}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={
            <div className="absolute inset-0 flex flex-col justify-center items-center space-y-3 bg-slate-50 dark:bg-slate-900/60">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              <p className="text-xs text-slate-400 font-medium">Rendering PDF viewport...</p>
            </div>
          }
          error={
            <div className="absolute inset-0 flex flex-col justify-center items-center space-y-3 p-6 text-center bg-slate-50 dark:bg-slate-900/60">
              <AlertTriangle className="w-10 h-10 text-red-500" />
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Failed to load PDF</p>
              <p className="text-xs text-slate-500 max-w-xs">Verify file size or make sure the URL corresponds to a valid PDF payload.</p>
            </div>
          }
        >
          {numPages && (
            <Page
              pageNumber={pageNumber}
              scale={scale}
              renderAnnotationLayer={false}
              renderTextLayer={false}
              className="border border-slate-200 dark:border-slate-800 rounded-xl"
            />
          )}
        </Document>
      </div>
    </div>
  );
}
export default PdfViewer;
