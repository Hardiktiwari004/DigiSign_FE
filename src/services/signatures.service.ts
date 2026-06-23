import { api } from "@/lib/client";
import { ApiSuccess, ReusableSignature } from "@/types/api";

export interface CreateReusableSignatureParams {
  file: File;
  name: string;
  defaultWidth: number;
  defaultHeight: number;
}

export interface DeleteReusableSignatureResult {
  success: boolean;
  message: string;
}

export const signaturesService = {
  async listReusableSignatures() {
    const res = await api.get<ApiSuccess<{ reusableSignatures: ReusableSignature[] }>>(
      "/api/signatures/reusable"
    );
    const payload = res.data.data as unknown as
      | ReusableSignature[]
      | { reusableSignatures?: ReusableSignature[]; signatures?: ReusableSignature[]; items?: ReusableSignature[] };

    if (Array.isArray(payload)) {
      return payload;
    }

    return payload.reusableSignatures ?? payload.signatures ?? payload.items ?? [];
  },

  async createReusableSignature(params: CreateReusableSignatureParams) {
    const formData = new FormData();
    formData.append("name", params.name);
    formData.append("defaultWidth", String(params.defaultWidth));
    formData.append("defaultHeight", String(params.defaultHeight));
    formData.append("signatureImage", params.file);

    const res = await api.post<ApiSuccess<{ reusableSignature: ReusableSignature }>>(
      "/api/signatures/reusable",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    const payload = res.data.data as unknown as { reusableSignature?: ReusableSignature; signature?: ReusableSignature } | ReusableSignature;
    if ("_id" in payload) {
      return payload;
    }
    return payload.reusableSignature ?? payload.signature!;
  },

  async deleteReusableSignature(id: string) {
    const res = await api.delete<ApiSuccess<DeleteReusableSignatureResult>>(
      `/api/signatures/reusable/${id}`
    );
    return res.data.data as DeleteReusableSignatureResult;
  },
};

export default signaturesService;
