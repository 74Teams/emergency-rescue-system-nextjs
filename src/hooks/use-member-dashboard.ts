import { useQuery } from "@tanstack/react-query";
import { rescueTeamsApi } from "@/lib/api/services";
import { apiQueryKeys } from "@/lib/api/query-keys";
import { MemberDashboardData } from "@/types/rescue-team/member";

export function useMemberDashboard() {
  return useQuery({
    queryKey: apiQueryKeys.rescueTeams.memberDashboard(),
    queryFn: async () => {
      const response = await rescueTeamsApi.memberDashboard();
      return response.data as MemberDashboardData;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    refetchInterval: 1000 * 30, // refetch every 30 seconds for live updates
  });
}
