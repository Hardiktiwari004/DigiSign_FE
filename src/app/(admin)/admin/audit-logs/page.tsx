"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { adminService, AuditLogsParams } from "@/services/admin.service";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Calendar,
  History,
  Info,
  RefreshCw,
  Loader2,
  AlertCircle,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { EntityReference } from "@/types/api";

function getReferenceId(value?: EntityReference | null) {
  if (!value) return null;
  return typeof value === "string" ? value : value._id;
}

function getUserLabel(userId?: EntityReference | null, userEmail?: string | null) {
  if (typeof userId === "object" && userId) {
    return userId.email || userId.name || userId._id;
  }
  return userEmail || "Anonymous";
}

export default function AuditLogsPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  
  // Filters
  const [action, setAction] = useState<string>("ALL");
  const [userId, setUserId] = useState("");
  const [debouncedUserId, setDebouncedUserId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Debounce User ID filter
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedUserId(userId);
      setPage(1);
    }, 450);
    return () => clearTimeout(handler);
  }, [userId]);

  // Construct query arguments
  const queryParams = useMemo((): AuditLogsParams => {
    const params: AuditLogsParams = {
      page,
      limit,
    };
    if (action !== "ALL") params.action = action as any;
    if (debouncedUserId) params.userId = debouncedUserId;
    if (startDate) params.startDate = new Date(startDate).toISOString();
    if (endDate) params.endDate = new Date(endDate).toISOString();
    return params;
  }, [page, limit, action, debouncedUserId, startDate, endDate]);

  // Query audit logs list
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["audit-logs", queryParams],
    queryFn: () => adminService.getAuditLogs(queryParams),
  });

  const handleClearFilters = () => {
    setAction("ALL");
    setUserId("");
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  const formatLogDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM d, yyyy h:mm: a");
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header breadcrumb */}
      <div className="flex items-center justify-between">
        <Link href="/admin" className="flex items-center text-xs font-semibold text-slate-500 hover:text-slate-200">
          <ChevronLeft className="w-4 h-4 mr-1.5" />
          Back to Admin Overview
        </Link>
      </div>

      {/* Main Table Card */}
      <Card className="border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 shadow-sm overflow-hidden">
        <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-800/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center">
              <History className="w-5 h-5 mr-2 text-indigo-500" />
              Cryptographic Audit Trails
            </CardTitle>
            <CardDescription className="text-slate-500 dark:text-slate-400 text-xs">
              System ledger tracking registrations, login footprints, signing coordinates, and verifications
            </CardDescription>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={() => refetch()} className="h-8 text-xs rounded-lg dark:border-slate-800">
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              Refresh
            </Button>
          </div>
        </CardHeader>

        {/* Filter controls segment */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/30 flex flex-wrap gap-4 items-center">
          {/* Action Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Action type</label>
            <Select value={action} onValueChange={(val) => { setAction(val ?? "ALL"); setPage(1); }}>
              <SelectTrigger className="w-[180px] h-8 text-xs border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl">
                <SelectValue placeholder="Action type" />
              </SelectTrigger>
              <SelectContent className="dark:bg-slate-900 border-slate-800">
                <SelectItem value="ALL">All Actions</SelectItem>
                <SelectItem value="USER_REGISTERED">User Registered</SelectItem>
                <SelectItem value="USER_LOGIN">User Login</SelectItem>
                <SelectItem value="DOCUMENT_UPLOADED">Document Uploaded</SelectItem>
                <SelectItem value="DOCUMENT_SIGNED">Document Signed</SelectItem>
                <SelectItem value="DOCUMENT_DOWNLOADED">Document Downloaded</SelectItem>
                <SelectItem value="DOCUMENT_DELETED">Document Deleted</SelectItem>
                <SelectItem value="DOCUMENT_VERIFIED">Document Verified</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* User ID search */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">User ID</label>
            <div className="relative w-[180px]">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
              <Input
                placeholder="Query User ID..."
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="pl-8 h-8 text-xs border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl placeholder:text-slate-600"
              />
            </div>
          </div>

          {/* Start Date */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Start Date</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
              className="h-8 text-xs border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl max-w-[130px]"
            />
          </div>

          {/* End Date */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">End Date</label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
              className="h-8 text-xs border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl max-w-[130px]"
            />
          </div>

          {/* Reset Filters button */}
          <div className="self-end pt-1">
            <Button onClick={handleClearFilters} variant="ghost" size="sm" className="h-8 text-xs hover:bg-slate-800 rounded-lg">
              Clear Filters
            </Button>
          </div>
        </div>

        {/* Content body */}
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex gap-4 items-center">
                  <Skeleton className="h-5 w-[15%] bg-slate-200 dark:bg-slate-800" />
                  <Skeleton className="h-5 w-[20%] bg-slate-200 dark:bg-slate-800" />
                  <Skeleton className="h-5 w-[25%] bg-slate-200 dark:bg-slate-800" />
                  <Skeleton className="h-5 w-[15%] bg-slate-200 dark:bg-slate-800" />
                  <Skeleton className="h-5 w-[15%] bg-slate-200 dark:bg-slate-800" />
                  <Skeleton className="h-5 w-[5%] bg-slate-200 dark:bg-slate-800 ml-auto" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
              <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Failed to query audit trail</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                Ensure user session corresponds to an authorized Administrator role.
              </p>
            </div>
          ) : !data || data.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-16 text-center">
              <History className="w-12 h-12 text-slate-500/40 mb-3" />
              <h4 className="text-sm font-semibold text-slate-850 dark:text-slate-250">No events found</h4>
              <p className="text-xs text-slate-500 max-w-[260px] mt-1">
                No system action logs match your filter options.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/50 dark:bg-slate-900/30">
                  <TableRow>
                    <TableHead className="font-semibold text-xs tracking-wider uppercase text-slate-500 dark:text-slate-400 py-3.5">Date</TableHead>
                    <TableHead className="font-semibold text-xs tracking-wider uppercase text-slate-500 dark:text-slate-400 py-3.5">Action</TableHead>
                    <TableHead className="font-semibold text-xs tracking-wider uppercase text-slate-500 dark:text-slate-400 py-3.5">User Details</TableHead>
                    <TableHead className="font-semibold text-xs tracking-wider uppercase text-slate-500 dark:text-slate-400 py-3.5">Document Details</TableHead>
                    <TableHead className="font-semibold text-xs tracking-wider uppercase text-slate-500 dark:text-slate-400 py-3.5">IP Address</TableHead>
                    <TableHead className="w-[80px] text-right"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.map((log) => {
                    const userIdText = getReferenceId(log.userId);
                    const documentIdText = getReferenceId(log.documentId);

                    return (
                      <TableRow key={log._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/20 group border-b border-slate-100 dark:border-slate-800/60">
                        <TableCell className="py-4 text-xs font-medium text-slate-500">
                          {formatLogDate(log.createdAt)}
                        </TableCell>
                        <TableCell className="py-4">
                          <span className="px-2 py-0.5 rounded-md font-mono text-[9px] font-bold bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                            {log.action}
                          </span>
                        </TableCell>
                        <TableCell className="py-4 text-xs">
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              {getUserLabel(log.userId, log.userEmail)}
                            </span>
                            {userIdText && (
                              <span className="text-[9px] text-slate-500 font-mono mt-0.5 truncate max-w-[120px]" title={userIdText}>
                                ID: {userIdText}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="py-4 text-xs">
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              {log.documentTitle || "-"}
                            </span>
                            {documentIdText && (
                              <span className="text-[9px] text-slate-500 font-mono mt-0.5 truncate max-w-[120px]" title={documentIdText}>
                                ID: {documentIdText}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="py-4 text-xs font-mono text-slate-400">
                          {log.ipAddress}
                        </TableCell>
                        <TableCell className="py-4 text-right">
                          {/* Details popup Modal */}
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-slate-400 hover:text-slate-200">
                                <Info className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="dark:bg-slate-950 dark:border-slate-900 text-slate-100 max-w-md">
                              <DialogHeader>
                                <DialogTitle className="text-base font-bold flex items-center">
                                  <Clock className="w-4.5 h-4.5 mr-2 text-indigo-500" />
                                  Action Metadata Log
                                </DialogTitle>
                                <DialogDescription className="text-xs text-slate-500 font-medium">
                                  Cryptographic footprints of event ID {log._id}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 pt-3">
                                {/* Event types */}
                                <div className="space-y-1">
                                  <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-500 block">Browser User Agent</span>
                                  <p className="text-xs bg-slate-900 border dark:border-slate-850 p-2.5 rounded-lg leading-relaxed text-slate-300 font-mono break-all">
                                    {log.userAgent}
                                  </p>
                                </div>

                                {/* Custom metadata objects */}
                                {log.metadata && Object.keys(log.metadata).length > 0 && (
                                  <div className="space-y-1">
                                    <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-500 block">Payload Metadata</span>
                                    <pre className="text-[10px] bg-slate-900 border dark:border-slate-850 p-2.5 rounded-lg overflow-x-auto text-slate-300 font-mono">
                                      {JSON.stringify(log.metadata, null, 2)}
                                    </pre>
                                  </div>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    );
                  })}
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
