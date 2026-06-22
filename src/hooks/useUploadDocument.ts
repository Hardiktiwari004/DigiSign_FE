import { useMutation, useQueryClient } from "@tanstack/react-query";
import { documentsService } from "@/services/documents.service";

export function useUploadDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => documentsService.uploadDocument(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });
}
export default useUploadDocument;
