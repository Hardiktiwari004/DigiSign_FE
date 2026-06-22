import { useQuery } from "@tanstack/react-query";
import { verificationService } from "@/services/verification.service";

export function useVerification(verificationCode: string) {
  return useQuery({
    queryKey: ["verification", verificationCode],
    queryFn: () => verificationService.verifyDocument(verificationCode),
    enabled: !!verificationCode,
  });
}
export default useVerification;
