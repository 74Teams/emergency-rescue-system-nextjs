import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { rescueTeamsApi } from "../services";
import { commanderApi } from "../services";
import type {
  ApiResponse,
  RescueTeamSummary,
  TeamStatus,
  RescueTeamQueryParams,
  AccountQueryParams,
  UserWithPendingCheck,
} from "../types";
import { apiQueryKeys } from "../query-keys";
import { apiRequest } from "../client";
import { apiRouteBuilders } from "../endpoints";

type RescueTeamsResponse = ApiResponse<RescueTeamSummary[]>;

/**
 * Hook để fetch danh sách Rescue Teams với filter và sort
 *
 * NHIỆM VỤ CỦA FILE:
 * - Cung cấp các React Query hooks để fetch và mutate data cho Command Center
 * - Tự động cache data để tối ưu performance
 * - Hỗ trợ realtime updates thông qua invalidation
 * - Cung cấp type-safe API cho components
 *
 * DATA FLOW:
 * 1. Component gọi hook với filter params
 * 2. Hook gọi rescueTeamsApi.list() qua axios
 * 3. Axios gửi request đến backend API
 * 4. Backend query SQL Server với ORDER BY CreatedAt DESC
 * 5. Response trả về qua axios → React Query cache → Component
 *
 * CƠ CHẾ REALTIME:
 * - Khi có mutation (update status), hook tự động invalidates query
 * - React Query sẽ refetch data từ backend
 * - Component tự động re-render với data mới
 * - Có thể mở rộng thêm WebSocket listener để push updates
 */
// export function useRescueTeams(params?: RescueTeamQueryParams) {
//   const queryClient = useQueryClient();

//   const query = useQuery({
//     queryKey: apiQueryKeys.rescueTeams.list(params),
//     queryFn: async () => {
//       const response = await rescueTeamsApi.list({
//         ...params,
//         sortBy: "CreatedAt",
//       });
//       return response;
//     },
//     refetchInterval: 30000,
//     refetchOnWindowFocus: true,
//     staleTime: 5 * 60 * 1000,
//   });

//   return {
//     data: query.data?.data ?? [],
//     isLoading: query.isLoading,
//     isError: query.isError,
//     error: query.error,
//     refetch: query.refetch,
//   };
// }
export function useRescueTeams(params?: {
  status?: TeamStatus | "ALL" | string;
}) {
  const queryParams = params?.status === "ALL" ? undefined : params;
  return useQuery({
    queryKey: apiQueryKeys.rescueTeams.list(queryParams),
    queryFn: async () => {
      const res = await rescueTeamsApi.list(queryParams);
      return res.data ?? []; // Trả về mảng RescueTeamSummary[]
    },
  });
}
export function useRescueTeamMembers(teamId: string | null) {
  return useQuery({
    queryKey: ["rescue-teams", teamId, "members"],
    queryFn: async () => {
      const res = await rescueTeamsApi.members(teamId!);
      return res.data ?? [];
    },
    enabled: !!teamId,
  });
}
/**
 * Hook để fetch Rescue Teams với location (cho bản đồ)
 *
 * NHIỆM VỤ:
 * - Fetch teams kèm theo thông tin baseLocation
 * - Dùng riêng cho map component vì cần thêm location data
 *
 * DATA FLOW:
 * Tương tự useRescueTeams nhưng endpoint khác trả về location
 */
export function useUpdateTeamStatus() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({
      teamId,
      newStatus,
    }: {
      teamId: string;
      newStatus: TeamStatus;
    }) => {
      return await rescueTeamsApi.updateStatus(teamId, newStatus);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: apiQueryKeys.rescueTeams.all,
      });
    },
    onError: (error) => {
      console.error("Failed to update team status:", error);
    },
  });

  return {
    mutate: mutation.mutate,
    mutateAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
}

/**
 * Hook để fetch chi tiết một Rescue Team cụ thể
 */
export function useRescueTeamDetail(teamId: string) {
  const query = useQuery({
    queryKey: apiQueryKeys.rescueTeams.detail(teamId),
    queryFn: async () => {
      return await rescueTeamsApi.detail(teamId);
    },
    enabled: !!teamId,
    staleTime: 2 * 60 * 1000,
  });

  return {
    data: query.data?.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
  };
}

/**
 * Hook để fetch missions của một Rescue Team
 */
export function useTeamMissions(teamId: string) {
  const query = useQuery({
    queryKey: apiQueryKeys.rescueTeams.missions(teamId),
    queryFn: async () => {
      return await rescueTeamsApi.missions(teamId);
    },
    enabled: !!teamId,
    refetchInterval: 30000,
    staleTime: 2 * 60 * 1000,
  });

  return {
    data: query.data?.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
  };
}

//COMMANDER HOOKS
//  Hook lấy danh sách tài khoản chờ duyệt
export function usePendingApprovals() {
  return useQuery({
    queryKey: ["commander", "pending"],
    queryFn: async () => {
      const res = await apiRequest<ApiResponse<UserWithPendingCheck[]>>({
        method: "GET",
        url: apiRouteBuilders.commander.approvals.pending,
      });
      return res.data ?? [];
    },
    refetchInterval: 30000,
  });
}

//  Hook lấy danh sách toàn bộ tài khoản (có hỗ trợ Filter)
export function useSystemUsers(params?: { search?: string; role?: string }) {
  return useQuery({
    queryKey: ["commander", "users", params],
    queryFn: async () => {
      const res = await apiRequest<ApiResponse<UserWithPendingCheck[]>>({
        method: "GET",
        url: apiRouteBuilders.commander.users.list,
        params,
      });
      return res.data ?? [];
    },
  });
}

// Hook Duyệt tài khoản
export function useApproveUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) =>
      apiRequest({
        method: "POST",
        url: apiRouteBuilders.commander.approvals.approve(userId),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commander"] });
    },
  });
}

// Hook Từ chối tài khoản
export function useRejectUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) =>
      apiRequest({
        method: "POST",
        url: apiRouteBuilders.commander.approvals.reject(userId),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commander"] });
    },
  });
}

// 5. Hook Khóa / Mở khóa tài khoản
export function useToggleUserStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, isActive }: { userId: string; isActive: boolean }) =>
      apiRequest({
        method: "PUT",
        url: apiRouteBuilders.commander.users.toggleStatus(userId),
        data: { isActive },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commander", "users"] });
    },
  });
}

export function useCreateRescueTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      teamName,
      description,
      teamLeaderId,
      baseLocationId,
      memberIds,
    }: {
      teamName: string;
      description: string;
      teamLeaderId: string;
      baseLocationId: string;
      memberIds: string[];
    }) => {
      const response = await rescueTeamsApi.create({
        teamName,
        teamLeaderId,
        description,
        baseLocationId,
        memberIds,
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rescue-teams"] });
    },
  });
}
export function useDeleteRescueTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (teamId: string) => rescueTeamsApi.delete(teamId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rescue-teams"] });
    },
  });
}

export function useAddTeamMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ teamId, memberId }: { teamId: string; memberId: string }) =>
      apiRequest({
        method: "POST",
        url: apiRouteBuilders.rescueTeams.member(teamId, memberId),
      }),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["rescue-teams"] });
      qc.invalidateQueries({
        queryKey: ["rescue-teams", variables.teamId, "members"],
      });
    },
  });
}

export function useRemoveTeamMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ teamId, memberId }: { teamId: string; memberId: string }) =>
      apiRequest({
        method: "DELETE",
        url: apiRouteBuilders.rescueTeams.member(teamId, memberId),
      }),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["rescue-teams"] });
      qc.invalidateQueries({
        queryKey: ["rescue-teams", variables.teamId, "members"],
      });
    },
  });
}
