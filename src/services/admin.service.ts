import { api } from "@/lib/client";
import { ApiSuccess, AuditAction, AuditLogItem, PaginatedResult } from "@/types/api";

export interface AdminStats {
  users: number;
  documents: number;
  signedDocuments: number;
  auditLogs: number;
}

export interface AuditLogsParams {
  page?: number;
  limit?: number;
  action?: AuditAction;
  userId?: string;
  startDate?: string;
  endDate?: string;
}

export const adminService = {
  async getStats() {
    const res = await api.get<ApiSuccess<AdminStats>>("/api/admin/stats");
    return res.data.data;
  },

  async getAuditLogs(params: AuditLogsParams = {}) {
    const res = await api.get<ApiSuccess<PaginatedResult<AuditLogItem>>>("/api/admin/audit-logs", {
      params,
    });
    return res.data.data;
  },
};
export default adminService;
