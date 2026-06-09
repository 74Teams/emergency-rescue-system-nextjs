"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiQueryKeys } from "../../query-keys";
import { missionsApi, requestsApi, rescueTeamsApi } from "../../services";
import type {
  CreateMissionInput,
  EmergencyType,
  MissionStatus,
  MissionSummary,
  PriorityLevel,
  RequestStatus,
  RequestSummary,
  RescueTeamSummary,
  TeamStatus,
} from "../../types";

// ===========================
// Numeric enum resolvers (reused from citizen-requests.ts)
// ===========================
import {
  numericEmergencyTypeMap,
  numericMissionStatusMap,
  numericPriorityMap,
  numericStatusMap,
} from "../../enum-mappers";

export function resolveEnum<T>(
  value: T | number,
  map: Record<number, T>,
  fallback: T,
): T {
  if (typeof value === "number") return map[value] ?? fallback;
  return value;
}

/** Normalize a request from API (numeric enums → string enums) */
export function normalizeRequest(req: RequestSummary): RequestSummary {
  // Normalize request medias if they exist
  const normalizedMedias = req.medias?.map((media: any) => {
    // Read resourceType (csharp backend property) or mediaType
    let type = media.resourceType !== undefined ? media.resourceType : media.mediaType;
    if (typeof type === "number") {
      // Map enum integers
      if (type === 0) type = "IMAGE";
      else if (type === 1) type = "VIDEO";
      else if (type === 2) type = "AUDIO";
      else type = "FILE";
    } else if (typeof type === "string") {
      const upper = type.toUpperCase();
      if (upper === "IMAGE" || upper === "0") type = "IMAGE";
      else if (upper === "VIDEO" || upper === "VIDEOS" || upper === "1") type = "VIDEO";
      else if (upper === "AUDIO" || upper === "2") type = "AUDIO";
      else type = "FILE";
    } else {
      type = "IMAGE"; // Fallback safe guess
    }

    const url = media.mediaUrl || media.secureUrl || "";

    return {
      ...media,
      mediaUrl: url,
      mediaType: type
    };
  }) ?? [];

  return {
    ...req,
    medias: normalizedMedias,
    emergencyType: resolveEnum(
      req.emergencyType as EmergencyType | number,
      numericEmergencyTypeMap,
      "OTHER",
    ),
    priority: resolveEnum(
      req.priority as PriorityLevel | number,
      numericPriorityMap,
      "LOW",
    ),
    status: resolveEnum(
      req.status as RequestStatus | number,
      numericStatusMap,
      "PENDING",
    ),
  };
}

export function normalizeMission(m: MissionSummary): MissionSummary {
  return {
    ...m,
    status: resolveEnum(
      m.status as MissionStatus | number,
      numericMissionStatusMap,
      "ASSIGNED",
    ),
    createdAt: m.createdAt || m.createAt,
    rescueTeamId: m.rescueTeamId || m.rescueTeam?.id || "",
    dispatcherId: m.dispatcherId || m.dispatcher?.id,
  };
}

// ===========================
// REQUESTS (paginated)
// ===========================
export function useDispatcherRequestsQuery(params?: {
  pageNumber?: number;
  pageSize?: number;
  status?: RequestStatus;
}) {
  return useQuery({
    queryKey: apiQueryKeys.requests.dispatcher(params),
    queryFn: async () => {
      const response = await requestsApi.list({
        pageNumber: params?.pageNumber ?? 1,
        pageSize: params?.pageSize ?? 50,
        status: params?.status,
      });
      return {
        ...response.data,
        items: response.data.items.map(normalizeRequest),
      };
    },
    staleTime: 15_000,
    refetchInterval: (query) =>
      typeof document !== "undefined" && document.hidden ? false : 30_000,
    refetchIntervalInBackground: false, // Auto refresh every 30s
  });
}

// ===========================
// RESCUE TEAMS
// ===========================
const numericTeamStatusMap: Record<number, TeamStatus> = {
  1: "AVAILABLE",
  2: "ON_MISSION",
  3: "UNAVAILABLE",
  4: "MAINTENANCE",
};

export function useRescueTeamsQuery() {
  return useQuery({
    queryKey: apiQueryKeys.rescueTeams.all,
    queryFn: async () => {
      const response = await rescueTeamsApi.list();
      // API may return array or paginated object
      const raw = response.data;
      const teams: RescueTeamSummary[] = Array.isArray(raw)
        ? raw
        : ((raw as unknown as { items?: RescueTeamSummary[] })?.items ?? []);
      return teams
        .filter((t) => !!t)
        .map((t: RescueTeamSummary) => ({
          ...t,
          name: t.teamName ?? "Đội không tên",
          status:
            typeof t.status === "number"
              ? (numericTeamStatusMap[t.status] ?? "UNAVAILABLE")
              : ((t.status as TeamStatus) ?? "UNAVAILABLE"),
        }));
    },
    staleTime: 30_000,
  });
}

// ===========================
// TEAM MEMBERS (by team id)
// ===========================
export function useTeamMembersQuery(teamId: string | null) {
  return useQuery({
    queryKey: apiQueryKeys.rescueTeams.members(teamId ?? ""),
    queryFn: async () => {
      if (!teamId) return [];
      const response = await rescueTeamsApi.members(teamId);
      const raw = response.data;
      return Array.isArray(raw) ? raw : [];
    },
    enabled: !!teamId,
    staleTime: 30_000,
  });
}

// ===========================
// MISSIONS
// ===========================
export function useMissionsQuery(params?: { status?: MissionStatus }) {
  return useQuery({
    queryKey: [...apiQueryKeys.missions.all, params],
    queryFn: async () => {
      const response = await missionsApi.list({
        pageNumber: 1,
        pageSize: 100,
        status: params?.status,
      });
      const raw = response.data as
        | { items?: MissionSummary[] }
        | MissionSummary[];
      const items = Array.isArray(raw) ? raw : (raw.items ?? []);
      return items.map(normalizeMission);
    },
    staleTime: 15_000,
  });
}

// ===========================
// CREATE MISSION (assign team to request)
// ===========================
export function useCreateMissionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateMissionInput) => {
      const response = await missionsApi.create(payload);
      return response.data;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: apiQueryKeys.missions.all }),
        queryClient.invalidateQueries({ queryKey: ["requests"] }),
        queryClient.invalidateQueries({
          queryKey: apiQueryKeys.rescueTeams.all,
        }),
      ]);
    },
  });
}

// ===========================
// CHANGE REQUEST STATUS
// ===========================
export function useChangeRequestStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      requestId,
      newStatus,
      note,
    }: {
      requestId: string;
      newStatus: RequestStatus;
      note?: string;
    }) => {
      const response = await requestsApi.changeStatus(requestId, {
        newStatus,
        note,
      });
      return response;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["requests"] });
      await queryClient.invalidateQueries({
        queryKey: apiQueryKeys.missions.all,
      });
      await queryClient.invalidateQueries({
        queryKey: apiQueryKeys.rescueTeams.all,
      });
    },
  });
}

// ===========================
// LABEL MAPS for UI display
// ===========================
export const emergencyTypeLabels: Record<string, string> = {
  FIRE: "🔥 Hỏa hoạn",
  FLOOD: "🌊 Ngập lụt",
  EARTHQUAKE: "🌍 Động đất",
  MEDICAL_EMERGENCY: "🏥 Cấp cứu y tế",
  TRAFFIC_EMERGENCY: "🚗 Tai nạn GT",
  BUILDING_COLLAPSE: "🏚️ Sập công trình",
  NATURAL_DISASTER: "⛰️ Sạt lở",
  OTHER: "📋 Khác",
};

export const priorityLabels: Record<string, string> = {
  CRITICAL: "Cấp bách",
  HIGH: "Nguy hiểm",
  MEDIUM: "Trung bình",
  LOW: "Thấp",
};

export const statusLabels: Record<string, string> = {
  PENDING: "Chờ xử lý",
  ACCEPTED: "Đã tiếp nhận",
  IN_PROGRESS: "Đang xử lý",
  COMPLETED: "Hoàn thành",
  CANCELED: "Đã hủy",
  REJECTED: "Từ chối",
};

export const missionStatusLabels: Record<string, string> = {
  ASSIGNED: "Đã giao",
  EN_ROUTE: "Đang di chuyển",
  ON_SITE: "Tại hiện trường",
  IN_PROGRESS: "Đang xử lý",
  COMPLETED: "Hoàn thành",
  ABORTED: "Đã hủy",
};

// ===========================
// ABORT MISSION
// ===========================
export function useAbortMissionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      missionId,
      reason,
    }: {
      missionId: string;
      reason: string;
    }) => {
      const response = await missionsApi.abort(missionId, {
        note: reason,
        changedById: "dispatcher",
      });
      return response.data;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: apiQueryKeys.missions.all }),
        queryClient.invalidateQueries({
          queryKey: apiQueryKeys.requests.dispatcher({ pageSize: 50 }),
        }),
        queryClient.invalidateQueries({
          queryKey: apiQueryKeys.rescueTeams.all,
        }),
      ]);
    },
  });
}

// ===========================
// DELETE REQUEST
// ===========================
export function useDeleteRequestMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (requestId: string) => {
      const response = await requestsApi.remove(requestId);
      return response.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["requests"] });
    },
  });
}

// ===========================
// UPDATE REQUEST (e.g., Change Priority)
// ===========================
export function useUpdateRequestMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      requestId,
      payload,
    }: {
      requestId: string;
      payload: any;
    }) => {
      const response = await requestsApi.update(requestId, payload);
      return response.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["requests"] });
    },
  });
}
