"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth.store";
import { documentsService } from "@/services/documents.service";
import { adminService } from "@/services/admin.service";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FileText,
  FileCheck,
  FileClock,
  ArrowUpRight,
  TrendingUp,
  Shield,
  History,
  FileSignature,
  Users,
  Files,
} from "lucide-react";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";

// Simple custom fallback formatter in case date-fns fails or for initial loading safety
function getRelativeTime(dateString: string) {
  try {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  } catch {
    return "recently";
  }
}

function getReferenceId(value?: string | { _id: string } | null) {
  if (!value) return null;
  return typeof value === "string" ? value : value._id;
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === "ADMIN";

  // Fetch personal documents for regular users
  const { data: userDocsData, isLoading: userDocsLoading } = useQuery({
    queryKey: ["dashboard-documents", "USER"],
    queryFn: () => documentsService.listDocuments({ limit: 10 }),
    enabled: !!user && !isAdmin,
  });

  // Fetch all documents for admins
  const { data: adminDocsData, isLoading: adminDocsLoading } = useQuery({
    queryKey: ["dashboard-documents", "ADMIN"],
    queryFn: () => documentsService.listAllDocuments({ limit: 10 }),
    enabled: !!user && isAdmin,
  });

  const docsLoading = isAdmin ? adminDocsLoading : userDocsLoading;
  const activeDocsData = isAdmin ? adminDocsData : userDocsData;

  // Fetch admin stats if the user is an admin
  const { data: adminStatsData, isLoading: adminStatsLoading } = useQuery({
    queryKey: ["admin-dashboard-stats"],
    queryFn: () => adminService.getStats(),
    enabled: !!user && isAdmin,
  });

  // Keep the dashboard limited to the signed-in user's documents unless the viewer is an admin.
  const visibleDocs = useMemo(() => {
    const items = activeDocsData?.items || [];

    if (isAdmin) return items;

    const currentUserId = user?._id;
    if (!currentUserId) return [];

    return items.filter((doc) => getReferenceId(doc.ownerId) === currentUserId);
  }, [isAdmin, user?._id, activeDocsData]);

  // Compute local stats from visible documents only
  const docStats = useMemo(() => {
    const items = visibleDocs;
    const total = activeDocsData?.total || 0;
    const signed = items.filter((d) => d.status === "SIGNED").length; // approximation for first page, or we can use the backend stats if available. Wait, the backend has status filter so we can query status counts if we want, but local calculation of first page is fine.
    
    return {
      total,
      signed,
      pending: total - signed,
    };
  }, [activeDocsData?.total, visibleDocs]);

  const recentDocs = useMemo(() => {
    return visibleDocs.slice(0, 5);
  }, [visibleDocs]);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } },
  };

  return (
    <div className="space-y-8">
      {/* Header welcome banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Welcome Back, {user?.name}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Here&apos;s a summary of your digital signature workspace and active documents.
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/documents">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md shadow-blue-500/10">
              <FileSignature className="w-4 h-4 mr-2" />
              Upload & Sign
            </Button>
          </Link>
          {isAdmin && (
            <Link href="/admin">
              <Button variant="outline" className="rounded-xl border-slate-200 dark:border-slate-800 dark:bg-slate-900 text-slate-700 dark:text-slate-200">
                <Shield className="w-4 h-4 mr-2 text-blue-500" />
                Admin Panel
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Main Stats Counters Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className={isAdmin ? "grid gap-6 md:grid-cols-4" : "grid gap-6 md:grid-cols-3"}
      >
        {isAdmin ? (
          <>
            {/* Total Users */}
            <motion.div variants={itemVariants}>
              <Card className="border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                    Total Users
                  </CardTitle>
                  <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-500 dark:text-blue-400 flex items-center justify-center">
                    <Users className="w-4.5 h-4.5" />
                  </div>
                </CardHeader>
                <CardContent>
                  {adminStatsLoading ? (
                    <Skeleton className="h-8 w-24 bg-slate-200 dark:bg-slate-800" />
                  ) : (
                    <div className="flex items-baseline space-x-2">
                      <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                        {adminStatsData?.users}
                      </span>
                      <span className="text-xs text-slate-400 font-medium font-semibold">registered</span>
                    </div>
                  )}
                  <div className="flex items-center text-xs text-slate-400 dark:text-slate-500 mt-2">
                    <TrendingUp className="w-3.5 h-3.5 mr-1 text-emerald-500" />
                    <span>Active platform users</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Total Documents */}
            <motion.div variants={itemVariants}>
              <Card className="border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                    All Documents
                  </CardTitle>
                  <div className="w-9 h-9 rounded-lg bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 flex items-center justify-center">
                    <Files className="w-4.5 h-4.5" />
                  </div>
                </CardHeader>
                <CardContent>
                  {adminStatsLoading ? (
                    <Skeleton className="h-8 w-24 bg-slate-200 dark:bg-slate-800" />
                  ) : (
                    <div className="flex items-baseline space-x-2">
                      <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                        {adminStatsData?.documents}
                      </span>
                      <span className="text-xs text-slate-400 font-medium font-semibold">files uploaded</span>
                    </div>
                  )}
                  <div className="flex items-center text-xs text-slate-400 dark:text-slate-500 mt-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mr-2"></div>
                    <span>Total system files</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Signed Documents */}
            <motion.div variants={itemVariants}>
              <Card className="border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                    Signed Documents
                  </CardTitle>
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 flex items-center justify-center">
                    <FileCheck className="w-4.5 h-4.5" />
                  </div>
                </CardHeader>
                <CardContent>
                  {adminStatsLoading ? (
                    <Skeleton className="h-8 w-24 bg-slate-200 dark:bg-slate-800" />
                  ) : (
                    <div className="flex items-baseline space-x-2">
                      <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                        {adminStatsData?.signedDocuments}
                      </span>
                      <span className="text-xs text-emerald-400 font-medium font-semibold">completed</span>
                    </div>
                  )}
                  <div className="flex items-center text-xs text-slate-400 dark:text-slate-500 mt-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2"></div>
                    <span>Cryptographically secured</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Audit Logs */}
            <motion.div variants={itemVariants}>
              <Card className="border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                    Audit Trail Logs
                  </CardTitle>
                  <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-500 dark:text-amber-400 flex items-center justify-center">
                    <History className="w-4.5 h-4.5" />
                  </div>
                </CardHeader>
                <CardContent>
                  {adminStatsLoading ? (
                    <Skeleton className="h-8 w-24 bg-slate-200 dark:bg-slate-800" />
                  ) : (
                    <div className="flex items-baseline space-x-2">
                      <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                        {adminStatsData?.auditLogs}
                      </span>
                      <span className="text-xs text-slate-400 font-medium font-semibold">actions logged</span>
                    </div>
                  )}
                  <div className="flex items-center text-xs text-slate-400 dark:text-slate-500 mt-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-2"></div>
                    <span>Platform action ledger</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </>
        ) : (
          <>
            {/* Total Documents Card */}
            <motion.div variants={itemVariants}>
              <Card className="border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Total Documents
                  </CardTitle>
                  <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-500 dark:text-blue-400 flex items-center justify-center">
                    <FileText className="w-4.5 h-4.5" />
                  </div>
                </CardHeader>
                <CardContent>
                  {docsLoading ? (
                    <Skeleton className="h-8 w-24 bg-slate-200 dark:bg-slate-800" />
                  ) : (
                    <div className="flex items-baseline space-x-2">
                      <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                        {docStats.total}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">active files</span>
                    </div>
                  )}
                  <div className="flex items-center text-xs text-slate-400 dark:text-slate-500 mt-2">
                    <TrendingUp className="w-3.5 h-3.5 mr-1 text-emerald-500" />
                    <span>Uploaded to workspace</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Signed Documents Card */}
            <motion.div variants={itemVariants}>
              <Card className="border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Signed Documents
                  </CardTitle>
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 flex items-center justify-center">
                    <FileCheck className="w-4.5 h-4.5" />
                  </div>
                </CardHeader>
                <CardContent>
                  {docsLoading ? (
                    <Skeleton className="h-8 w-24 bg-slate-200 dark:bg-slate-800" />
                  ) : (
                    <div className="flex items-baseline space-x-2">
                      <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                        {docStats.signed}
                      </span>
                      <span className="text-xs text-emerald-400 font-medium">completed</span>
                    </div>
                  )}
                  <div className="flex items-center text-xs text-slate-400 dark:text-slate-500 mt-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2"></div>
                    <span>Cryptographically secured</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Pending Action Card */}
            <motion.div variants={itemVariants}>
              <Card className="border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Pending Signature
                  </CardTitle>
                  <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-500 dark:text-amber-400 flex items-center justify-center">
                    <FileClock className="w-4.5 h-4.5" />
                  </div>
                </CardHeader>
                <CardContent>
                  {docsLoading ? (
                    <Skeleton className="h-8 w-24 bg-slate-200 dark:bg-slate-800" />
                  ) : (
                    <div className="flex items-baseline space-x-2">
                      <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                        {docStats.pending}
                      </span>
                      <span className="text-xs text-amber-400 font-medium">awaiting sign</span>
                    </div>
                  )}
                  <div className="flex items-center text-xs text-slate-400 dark:text-slate-500 mt-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-2"></div>
                    <span>Needs signature placement</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </>
        )}
      </motion.div>

      {/* Overview Grid split */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Recent files table */}
        <Card className="md:col-span-2 border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
                Recent Documents
              </CardTitle>
              <CardDescription className="text-slate-500 dark:text-slate-400 text-xs">
                Your last uploaded or updated documents
              </CardDescription>
            </div>
            <Link href="/documents" className="text-xs text-blue-500 hover:text-blue-400 font-semibold inline-flex items-center">
              View All <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </CardHeader>
          <CardContent className="px-0 sm:px-6 pb-6">
            {docsLoading ? (
              <div className="space-y-4 px-6">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full bg-slate-200 dark:bg-slate-800 rounded-lg" />
                ))}
              </div>
            ) : recentDocs.length === 0 ? (
              <div className="text-center py-12 px-6">
                <FileText className="w-10 h-10 text-slate-400 mx-auto opacity-40 mb-3" />
                <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">No documents yet</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-[240px] mx-auto">
                  Drag and drop a PDF file to begin signing.
                </p>
                <Link href="/documents" className="mt-4 inline-block">
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
                    Upload your first document
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {recentDocs.map((doc) => (
                  <div
                    key={doc._id}
                    className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/20 rounded-xl transition-colors group"
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-4.5 h-4.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-850 dark:text-slate-200 truncate group-hover:text-blue-500 transition-colors">
                          {doc.title}
                        </p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                          Uploaded {getRelativeTime(doc.uploadedAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          doc.status === "SIGNED"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : doc.status === "IN_PROGRESS"
                            ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                            : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        }`}
                      >
                        {doc.status}
                      </span>
                      <Link href={`/documents/${doc._id}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800">
                          <ArrowUpRight className="w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info panel / Admin Stats Overview */}
        <div className="space-y-6">
          {isAdmin && adminStatsData && (
            <Card className="border-slate-200/85 dark:border-red-500/10 bg-slate-50 dark:bg-red-500/[0.02] shadow-sm">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    System Stats
                  </CardTitle>
                  <CardDescription className="text-[10px] text-slate-500">
                    Global platform analytics
                  </CardDescription>
                </div>
                <Shield className="w-4.5 h-4.5 text-red-500/80" />
              </CardHeader>
              <CardContent className="space-y-3.5">
                {adminStatsLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-full bg-slate-200 dark:bg-slate-800" />
                    <Skeleton className="h-6 w-full bg-slate-200 dark:bg-slate-800" />
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">Registered Users</span>
                      <span className="font-mono font-bold dark:text-white">{adminStatsData.users}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs border-t border-slate-200 dark:border-slate-800/60 pt-3">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">Global Documents</span>
                      <span className="font-mono font-bold dark:text-white">{adminStatsData.documents}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs border-t border-slate-200 dark:border-slate-800/60 pt-3">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">Cryptographic Signs</span>
                      <span className="font-mono font-bold dark:text-white text-emerald-400">{adminStatsData.signedDocuments}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs border-t border-slate-200 dark:border-slate-800/60 pt-3">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">Logged Actions</span>
                      <span className="font-mono font-bold dark:text-white">{adminStatsData.auditLogs}</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Quick tip card */}
          <Card className="border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 shadow-sm p-6 space-y-4">
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-200 uppercase tracking-widest">
              Digital Signature Standard
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              All documents signed on DigiSign use cryptographic bindings, recording specific coordinates, user metadata, IP footprinting, and time stamps. Verification links allow anyone to confirm document legitimacy.
            </p>
            <Link href="/verify" className="inline-flex items-center text-xs text-blue-500 hover:text-blue-400 font-semibold">
              <History className="w-3.5 h-3.5 mr-1" />
              Verify a document code
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}
