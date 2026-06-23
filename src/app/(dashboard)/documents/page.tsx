"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth.store";
import { documentsService, ListDocumentsParams } from "@/services/documents.service";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EntityReference } from "@/types/api";
import { toast } from "sonner";
import {
  FileText,
  UploadCloud,
  Search,
  ChevronDown,
  Trash2,
  Download,
  Eye,
  FileSignature,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  FileUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { makeSafePdfFilename } from "@/lib/pdf-filename";

function getReferenceId(value?: EntityReference | null) {
  if (!value) return null;
  return typeof value === "string" ? value : value._id;
}

export default function DocumentsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isAdmin = user?.role === "ADMIN";

  const [scope, setScope] = useState<"all" | "mine">("mine");

  React.useEffect(() => {
    if (user?.role === "ADMIN") {
      setScope("all");
    } else {
      setScope("mine");
    }
  }, [user]);

  // Search & Filter State
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<string>("uploadedAt");
  const [sortOrder, setSortOrder] = useState<string>("desc");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Drag and Drop Upload State
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Debounce search input
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // reset to page 1 on new search
    }, 450);
    return () => clearTimeout(handler);
  }, [search]);

  // Fetch Documents
  const queryParams = useMemo((): ListDocumentsParams => {
    const params: ListDocumentsParams = {
      page,
      limit,
      sortBy: sortBy as any,
      sortOrder: sortOrder as any,
    };
    if (debouncedSearch) params.search = debouncedSearch;
    if (status !== "ALL") params.status = status as any;
    return params;
  }, [page, limit, debouncedSearch, status, sortBy, sortOrder]);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["documents", user?.role, scope, queryParams],
    queryFn: () =>
      user?.role === "ADMIN" && scope === "all"
        ? documentsService.listAllDocuments(queryParams)
        : documentsService.listDocuments(queryParams),
    enabled: !!user,
  });

  // Upload Mutation
  const uploadMutation = useMutation({
    mutationFn: (file: File) => documentsService.uploadDocument(file),
    onSuccess: (data) => {
      toast.success("Document uploaded successfully!", {
        description: `${data.document.title} is ready to be signed.`,
      });
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
    onError: (err: any) => {
      console.error(err);
      toast.error(err?.message || "Failed to upload document.");
    },
    onSettled: () => {
      setIsUploading(false);
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => documentsService.deleteDocument(id),
    onSuccess: () => {
      toast.success("Document deleted");
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to delete document.");
    },
  });

  // Download Handler
  const handleDownload = async (id: string, title: string) => {
    const toastId = toast.loading("Preparing secure download link...");
    try {
      const data = await documentsService.downloadSignedDocument(id);
      const response = await fetch(data.downloadUrl);
      if (!response.ok) {
        throw new Error("Could not fetch the PDF for download.");
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = makeSafePdfFilename(title);
      document.body.appendChild(anchor);
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

  // Drag and Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const processFile = (file: File) => {
    if (file.type !== "application/pdf" && !file.name.endsWith(".pdf")) {
      toast.error("Invalid file type", {
        description: "Only PDF documents are allowed.",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File too large", {
        description: "Maximum allowed file size is 10MB.",
      });
      return;
    }

    setIsUploading(true);
    uploadMutation.mutate(file);
  };

  // Formatting dates safely
  const formatDocDate = (dateString?: string | null) => {
    if (!dateString) return "-";
    try {
      return format(new Date(dateString), "MMM d, yyyy h:mm a");
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {scope === "all" ? "All Documents" : "My Documents"}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            {scope === "all"
              ? "Manage, sign, download, and review documents across the platform"
              : "Manage, sign, download, and review your cryptographically locked documents"}
          </p>
        </div>
        
        {isAdmin && (
          <Tabs
            value={scope}
            onValueChange={(val) => {
              setScope(val as any);
              setPage(1);
            }}
            className="w-auto"
          >
            <TabsList className="grid w-52 grid-cols-2 rounded-2xl border border-slate-200 bg-slate-100/80 p-1 shadow-sm dark:border-slate-800 dark:bg-slate-950 h-9">
              <TabsTrigger
                value="all"
                className="rounded-xl text-xs font-semibold text-slate-500 dark:text-slate-400 data-[active]:bg-white data-[active]:text-slate-900 data-[active]:shadow-sm dark:data-[active]:bg-slate-900 dark:data-[active]:text-white transition-all h-7"
              >
                All Docs
              </TabsTrigger>
              <TabsTrigger
                value="mine"
                className="rounded-xl text-xs font-semibold text-slate-500 dark:text-slate-400 data-[active]:bg-white data-[active]:text-slate-900 data-[active]:shadow-sm dark:data-[active]:bg-slate-900 dark:data-[active]:text-white transition-all h-7"
              >
                My Docs
              </TabsTrigger>
            </TabsList>
          </Tabs>
        )}
      </div>

      {/* Upload Zone Panel - Only visible for personal uploads */}
      {scope === "mine" && (
        <Card className="border-dashed border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 shadow-sm relative overflow-hidden transition-all duration-200">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className="flex flex-col items-center justify-center p-8 text-center min-h-[160px] cursor-pointer"
            onClick={() => document.getElementById("fileInput")?.click()}
          >
            <input
              id="fileInput"
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={handleFileChange}
              disabled={isUploading}
            />
            
            <AnimatePresence mode="wait">
              {isUploading ? (
                <motion.div
                  key="uploading"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center space-y-3"
                >
                  <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Uploading Document...</p>
                    <p className="text-xs text-slate-400">Verifying signature requirements & formatting</p>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center space-y-3"
                >
                  <div className="w-12 h-12 rounded-full bg-blue-500/10 dark:bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-inner">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      Drag and drop your PDF here, or <span className="text-blue-500 hover:text-blue-400">browse files</span>
                    </p>
                    <p className="text-xs text-slate-500">
                      PDF files only • Maximum size 10MB
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Card>
      )}

      {/* Main Table Card */}
      <Card className="border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 shadow-sm overflow-hidden">
        <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-800/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-500">
              Document Ledger
            </CardTitle>
          </div>
          
          {/* Controls Bar */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative w-full sm:w-[220px]">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Search title or code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-xs border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 rounded-xl placeholder:text-slate-500"
              />
            </div>

            {/* Status Select */}
            <Select value={status} onValueChange={(val) => { setStatus(val ?? "ALL"); setPage(1); }}>
              <SelectTrigger className="w-[130px] h-9 text-xs border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 rounded-xl">
                <SelectValue placeholder="Status Filter" />
              </SelectTrigger>
              <SelectContent className="dark:bg-slate-900 border-slate-800">
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="UPLOADED">Uploaded</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="SIGNED">Signed</SelectItem>
              </SelectContent>
            </Select>

            {/* Sorting Select */}
            <Select value={`${sortBy}-${sortOrder}`} onValueChange={(val) => {
              if (!val) return;
              const [by, order] = val.split("-");
              setSortBy(by);
              setSortOrder(order);
              setPage(1);
            }}>
              <SelectTrigger className="w-[160px] h-9 text-xs border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 rounded-xl">
                <SelectValue placeholder="Sort order" />
              </SelectTrigger>
              <SelectContent className="dark:bg-slate-900 border-slate-800">
                <SelectItem value="uploadedAt-desc">Newest Uploads</SelectItem>
                <SelectItem value="uploadedAt-asc">Oldest Uploads</SelectItem>
                <SelectItem value="title-asc">Title: A to Z</SelectItem>
                <SelectItem value="title-desc">Title: Z to A</SelectItem>
                <SelectItem value="signedAt-desc">Recently Signed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            // Skeleton table states
            <div className="p-6 space-y-4">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="flex gap-4 items-center">
                  <Skeleton className="h-6 w-[35%] bg-slate-200 dark:bg-slate-800" />
                  <Skeleton className="h-6 w-[15%] bg-slate-200 dark:bg-slate-800" />
                  <Skeleton className="h-6 w-[20%] bg-slate-200 dark:bg-slate-800" />
                  <Skeleton className="h-6 w-[20%] bg-slate-200 dark:bg-slate-800" />
                  <Skeleton className="h-6 w-[10%] bg-slate-200 dark:bg-slate-800 ml-auto" />
                </div>
              ))}
            </div>
          ) : error ? (
            // Error panel
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
              <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Workspace fetch failure</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                We couldn't connect to your documents records. Check your internet connection or reload.
              </p>
              <Button size="sm" onClick={() => refetch()} className="mt-4 bg-slate-850 dark:bg-slate-800 rounded-lg">
                Retry Connection
              </Button>
            </div>
          ) : !data || data.items.length === 0 ? (
            // Empty state
            <div className="flex flex-col items-center justify-center p-16 text-center">
              <FileText className="w-12 h-12 text-slate-400/50 mb-3" />
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">No documents found</h4>
              <p className="text-xs text-slate-500 max-w-[280px] mt-1">
                {debouncedSearch || status !== "ALL"
                  ? "No files matching your search criteria. Try modifying filters."
                  : "Upload your first PDF document to get started."}
              </p>
              {(debouncedSearch || status !== "ALL") && (
                <Button variant="outline" size="sm" onClick={() => { setSearch(""); setStatus("ALL"); }} className="mt-4 rounded-lg">
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            // Table content
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/50 dark:bg-slate-900/30">
                  <TableRow>
                    <TableHead className="font-semibold text-xs tracking-wider uppercase text-slate-500 dark:text-slate-400 py-3.5">Document</TableHead>
                    <TableHead className="font-semibold text-xs tracking-wider uppercase text-slate-500 dark:text-slate-400 py-3.5">Status</TableHead>
                    <TableHead className="font-semibold text-xs tracking-wider uppercase text-slate-500 dark:text-slate-400 py-3.5">Verification Code</TableHead>
                    <TableHead className="font-semibold text-xs tracking-wider uppercase text-slate-500 dark:text-slate-400 py-3.5">Uploaded</TableHead>
                    <TableHead className="font-semibold text-xs tracking-wider uppercase text-slate-500 dark:text-slate-400 py-3.5">Signed Date</TableHead>
                    <TableHead className="w-[80px] text-right"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.map((doc) => (
                    <TableRow key={doc._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/20 group border-b border-slate-100 dark:border-slate-800/60">
                      <TableCell className="py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center flex-shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <Link href={`/documents/${doc._id}`} className="text-xs font-semibold text-slate-900 dark:text-slate-200 hover:text-blue-500 truncate block max-w-[200px] sm:max-w-sm">
                              {doc.title}
                            </Link>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <StatusBadge status={doc.status} />
                      </TableCell>
                      <TableCell className="py-4 font-mono text-xs font-semibold text-slate-600 dark:text-slate-300">
                        {doc.verificationCode}
                      </TableCell>
                      <TableCell className="py-4 text-xs text-slate-500">
                        {formatDocDate(doc.uploadedAt)}
                      </TableCell>
                      <TableCell className="py-4 text-xs text-slate-500">
                        {formatDocDate(doc.signedAt)}
                      </TableCell>
                      <TableCell className="py-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0 rounded-lg text-slate-400 hover:text-slate-100">
                              <MoreVertical className="h-4.5 w-4.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="dark:bg-slate-950 dark:border-slate-850">
                            <DropdownMenuGroup>
                              <DropdownMenuLabel className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Options</DropdownMenuLabel>
                              <DropdownMenuSeparator className="dark:bg-slate-850" />
                              <DropdownMenuItem asChild>
                                <Link href={`/documents/${doc._id}`} className="cursor-pointer text-xs flex items-center">
                                  <Eye className="w-4 h-4 mr-2 text-slate-400" />
                                  View Details
                                </Link>
                              </DropdownMenuItem>
                              {(doc.status === "UPLOADED" || doc.status === "IN_PROGRESS") && (
                                <DropdownMenuItem asChild>
                                  <Link href={`/documents/${doc._id}/sign`} className="cursor-pointer text-xs flex items-center text-blue-400 hover:text-blue-300">
                                    <FileSignature className="w-4 h-4 mr-2" />
                                    Sign Document
                                  </Link>
                                </DropdownMenuItem>
                              )}
                              {doc.status === "SIGNED" && (
                                <DropdownMenuItem onClick={() => handleDownload(doc._id, doc.title)} className="cursor-pointer text-xs flex items-center text-emerald-400">
                                  <Download className="w-4 h-4 mr-2" />
                                  Download PDF
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuGroup>
                            
                            {/* Delete - only allowed for owner */}
                            {user?._id === getReferenceId(doc.ownerId) && (
                              <>
                                <DropdownMenuSeparator className="dark:bg-slate-850" />
                                <DropdownMenuItem
                                  onClick={() => {
                                    if (confirm("Are you sure you want to delete this document?")) {
                                      deleteMutation.mutate(doc._id);
                                    }
                                  }}
                                  className="cursor-pointer text-xs flex items-center text-red-500 hover:text-red-400 hover:bg-red-500/5 focus:bg-red-500/5 focus:text-red-400"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>

        {/* Pagination footer */}
        {!isLoading && !error && data && data.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/60 px-6 py-4 bg-slate-50/50 dark:bg-slate-900/30">
            <div className="text-xs text-slate-500">
              Showing page <span className="font-semibold text-slate-900 dark:text-white">{page}</span> of{" "}
              <span className="font-semibold text-slate-900 dark:text-white">{data.totalPages}</span> ({data.total} total)
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page === 1}
                className="h-8 w-8 p-0 rounded-lg dark:border-slate-800"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(p + 1, data.totalPages))}
                disabled={page === data.totalPages}
                className="h-8 w-8 p-0 rounded-lg dark:border-slate-800"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
