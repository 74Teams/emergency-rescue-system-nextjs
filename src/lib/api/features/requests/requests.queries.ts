import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { requestsApi } from "./requests.api";
import { PaginationQuery } from "../../common/common.types";
import { CreateRequestInput, UpdateRequestInput, ChangeRequestStatusInput } from "./requests.types";

export const requestKeys = {
  all: ["requests"] as const,
  lists: () => [...requestKeys.all, "list"] as const,
  list: (params: Record<string, any>) => [...requestKeys.lists(), params] as const,
  details: () => [...requestKeys.all, "detail"] as const,
  detail: (id: string) => [...requestKeys.details(), id] as const,
  history: (id: string) => [...requestKeys.detail(id), "history"] as const,
};

export function useRequests(params: PaginationQuery & { status?: string; priority?: string; emergencyType?: string } = {}) {
  return useQuery({
    queryKey: requestKeys.list(params),
    queryFn: async () => {
      const res = await requestsApi.list(params);
      return res.data;
    },
    staleTime: 30 * 1000,
  });
}

export function useRequestDetail(requestId: string) {
  return useQuery({
    queryKey: requestKeys.detail(requestId),
    queryFn: async () => {
      const res = await requestsApi.detail(requestId);
      return res.data;
    },
    enabled: !!requestId,
  });
}

export function useCreateRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateRequestInput) => requestsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: requestKeys.lists() });
    },
  });
}

export function useChangeRequestStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ requestId, payload }: { requestId: string; payload: ChangeRequestStatusInput }) => 
      requestsApi.changeStatus(requestId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: requestKeys.lists() });
      queryClient.invalidateQueries({ queryKey: requestKeys.detail(variables.requestId) });
      queryClient.invalidateQueries({ queryKey: requestKeys.history(variables.requestId) });
    },
  });
}
