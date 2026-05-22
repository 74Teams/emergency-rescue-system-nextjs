"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiQueryKeys } from "../../query-keys";
import { missionsApi } from "../../services";
import { getStoredUser } from "../../storage";
import type { MissionStatus } from "../../types";

const missionStatusToNumber: Record<MissionStatus, number> = {
  ASSIGNED: 1,
  EN_ROUTE: 2,
  ON_SITE: 3,
  IN_PROGRESS: 4,
  COMPLETED: 5,
  ABORTED: 6,
};

export function useUpdateRescuerMissionStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      missionId,
      status,
      note,
    }: {
      missionId: string;
      status: MissionStatus;
      note?: string;
    }) => {
      const user = getStoredUser();
      if (!user?.id) throw new Error("Chưa đăng nhập");
      return missionsApi.updateStatus(missionId, {
        status: missionStatusToNumber[status] as unknown as MissionStatus,
        changedById: user.id,
        note: note ?? "",
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: apiQueryKeys.dashboards.rescuer(),
      });
    },
  });
}
