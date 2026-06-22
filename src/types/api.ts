export type UserRole = "USER" | "ADMIN";

export type DocumentStatus = "UPLOADED" | "IN_PROGRESS" | "SIGNED";

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
  updatedAt?: string;
}

export type EntityReference = string | { _id: string; name?: string; email?: string };

export interface DocumentItem {
  _id: string;
  ownerId: EntityReference;
  title: string;
  originalPdfUrl: string;
  signedPdfUrl?: string | null;
  verificationCode: string;
  status: DocumentStatus;
  uploadedAt: string;
  signedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Signature {
  _id: string;
  documentId: string;
  userId: EntityReference;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  signatureImageUrl: string;
  createdAt: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiSuccess<T> {
  success: true;
  message: string;
  data: T;
}

export interface ApiError {
  success: false;
  message: string;
  errors: string[];
}

export type AuditAction =
  | "USER_REGISTERED"
  | "USER_LOGIN"
  | "TOKEN_REFRESH"
  | "USER_LOGOUT"
  | "PASSWORD_RESET_REQUESTED"
  | "PASSWORD_RESET_COMPLETED"
  | "DOCUMENT_UPLOADED"
  | "DOCUMENT_VIEWED"
  | "DOCUMENT_SIGNED"
  | "DOCUMENT_DOWNLOADED"
  | "DOCUMENT_DELETED"
  | "DOCUMENT_VERIFIED";

export interface AuditLogItem {
  _id: string;
  action: AuditAction;
  userId?: EntityReference | null;
  userEmail?: string | null;
  documentId?: EntityReference | null;
  documentTitle?: string | null;
  ipAddress: string;
  userAgent: string;
  metadata?: Record<string, any>;
  createdAt: string;
}
