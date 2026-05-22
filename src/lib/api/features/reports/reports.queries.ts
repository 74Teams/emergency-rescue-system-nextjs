import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { reportsApi } from "./reports.api";
import { PaginationQuery } from "../../common/common.types";
import { CreateReportInput } from "./reports.types";

export const reportKeys = {
  all: ["reports"] as const,
  lists: () => [...reportKeys.all, "list"] as const,
  list: (params: Record<string, any>) => [...reportKeys.lists(), params] as const,
  details: () => [...reportKeys.all, "detail"] as const,
  detail: (id: string) => [...reportKeys.details(), id] as const,
  byMission: (missionId: string) => [...reportKeys.all, "mission", missionId] as const,
};

export function useReports(params: PaginationQuery & { type?: string; outcome?: string } = {}) {
  return useQuery({
    queryKey: reportKeys.list(params),
    queryFn: async () => {
      const res = await reportsApi.list(params);
      return res.data;
    },
    staleTime: 60 * 1000,
  });
}

export function useReportDetail(reportId: string) {
  return useQuery({
    queryKey: reportKeys.detail(reportId),
    queryFn: async () => {
      const res = await reportsApi.detail(reportId);
      return res.data;
    },
    enabled: !!reportId,
  });
}

export function useCreateReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateReportInput) => reportsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reportKeys.lists() });
    },
  });
}
