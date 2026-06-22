import { useMutation, useQueryClient } from "@tanstack/react-query";
import { documentsService, SignDocumentParams } from "@/services/documents.service";

export function useSignDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: SignDocumentParams) => documentsService.signDocument(params),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      queryClient.invalidateQueries({ queryKey: ["document", variables.documentId] });
    },
  });
}
export default useSignDocument;
