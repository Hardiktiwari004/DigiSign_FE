import { useQuery } from "@tanstack/react-query";
import { documentsService, ListDocumentsParams } from "@/services/documents.service";

export function useDocuments(params: ListDocumentsParams = {}) {
  return useQuery({
    queryKey: ["documents", params],
    queryFn: () => documentsService.listDocuments(params),
  });
}

export function useDocumentDetails(id: string) {
  return useQuery({
    queryKey: ["document", id],
    queryFn: () => documentsService.getDocument(id),
    enabled: !!id,
  });
}
