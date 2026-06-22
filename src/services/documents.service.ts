import { api } from "@/lib/client";
import { ApiSuccess, DocumentItem, PaginatedResult, Signature } from "@/types/api";

export interface ListDocumentsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: "UPLOADED" | "IN_PROGRESS" | "SIGNED";
  sortBy?: "uploadedAt" | "title" | "status" | "signedAt";
  sortOrder?: "asc" | "desc";
}

export interface SignDocumentParams {
  documentId: string;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  signatureImage: File;
}

export const documentsService = {
  async uploadDocument(file: File) {
    const formData = new FormData();
    formData.append("pdf", file);

    const res = await api.post<ApiSuccess<{ document: DocumentItem }>>("/api/documents/upload", formData, {
      headers: {
        // Axios will set the boundary header automatically when passing FormData
        "Content-Type": "multipart/form-data",
      },
    });
    return res.data.data;
  },

  async listDocuments(params: ListDocumentsParams = {}) {
    const res = await api.get<ApiSuccess<PaginatedResult<DocumentItem>>>("/api/documents", {
      params,
    });
    return res.data.data;
  },

  async listAllDocuments(params: ListDocumentsParams = {}) {
    const res = await api.get<ApiSuccess<PaginatedResult<DocumentItem>>>("/api/documents/admin/all", {
      params,
    });
    return res.data.data;
  },

  async getDocument(id: string) {
    const res = await api.get<ApiSuccess<{ document: DocumentItem }>>(`/api/documents/${id}`);
    return res.data.data.document;
  },

  async deleteDocument(id: string) {
    const res = await api.delete<ApiSuccess<void>>(`/api/documents/${id}`);
    return res.data;
  },

  async downloadSignedDocument(id: string) {
    const res = await api.get<ApiSuccess<{ downloadUrl: string }>>(`/api/documents/${id}/download`);
    return res.data.data;
  },

  async signDocument(params: SignDocumentParams) {
    const formData = new FormData();
    formData.append("page", String(params.page));
    formData.append("x", String(params.x));
    formData.append("y", String(params.y));
    formData.append("width", String(params.width));
    formData.append("height", String(params.height));
    formData.append("signatureImage", params.signatureImage);

    const res = await api.post<ApiSuccess<{ signature: Signature }>>(
      `/api/documents/${params.documentId}/sign`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return res.data.data;
  },
};
export default documentsService;
