import { api } from "@/lib/client";
import { ApiSuccess, EntityReference } from "@/types/api";

export interface VerificationResult {
  valid: boolean;
  documentName?: string;
  signedBy?: EntityReference;
  uploadedAt?: string;
  signedAt?: string;
}

export const verificationService = {
  async verifyDocument(verificationCode: string) {
    const res = await api.get<ApiSuccess<VerificationResult>>(
      `/api/verify/${encodeURIComponent(verificationCode)}`
    );
    return res.data.data;
  },
};
export default verificationService;
