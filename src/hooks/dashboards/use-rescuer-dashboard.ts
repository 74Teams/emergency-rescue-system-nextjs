import { useQuery } from "@tanstack/react-query";
import { fetchRescuerDashboardData } from "@/lib/api/features/missions/rescuer-dashboard.queries";
import { apiQueryKeys } from "@/lib/api/query-keys";
import { getStoredAccessToken } from "@/lib/api/storage";

export function useRescuerDashboard() {
  return useQuery({
    queryKey: apiQueryKeys.dashboards.rescuer(),
    queryFn: fetchRescuerDashboardData,
    enabled: !!getStoredAccessToken(),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    refetchInterval: 1000 * 30,
  });
}

/** @deprecated Use `useRescuerDashboard` */
export const useMemberDashboard = useRescuerDashboard;
