"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiQueryKeys } from "./query-keys";
import { requestsApi, rescueTeamsApi, missionsApi } from "./services";
import type {
  RequestSummary,
  RescueTeamSummary,
  MissionSummary,
  CreateMissionInput,
  EmergencyType,
  PriorityLevel,
  RequestStatus,
  MissionStatus,
} from "./types";

// ===========================
// Numeric enum resolvers (reused from citizen-requests.ts)
// ===========================
const numericEmergencyTypeMap: Record<number, EmergencyType> = {
  1: "FIRE",
  2: "FLOOD",
  3: "EARTHQUAKE",
  4: "MEDICAL_EMERGENCY",
  5: "TRAFFIC_EMERGENCY",
  6: "BUILDING_COLLAPSE",
  7: "NATURAL_DISASTER",
  8: "OTHER",
};
const numericPriorityMap: Record<number, PriorityLevel> = {
  1: "CRITICAL",
  2: "HIGH",
  3: "MEDIUM",
  4: "LOW",
};
const numericStatusMap: Record<number, RequestStatus> = {
  1: "PENDING",
  2: "ACCEPTED",
  3: "IN_PROGRESS",
  4: "COMPLETED",
  5: "CANCELED",
  6: "REJECTED",
};
const numericMissionStatusMap: Record<number, MissionStatus> = {
  1: "ASSIGNED",
  2: "EN_ROUTE",
  3: "ON_SITE",
  4: "IN_PROGRESS",
  5: "COMPLETED",
  6: "ABORTED",
};

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
  return {
    ...req,
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
    queryKey: [...apiQueryKeys.requests.all, params],
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
    refetchInterval: 30_000, // Auto refresh every 30s
  });
}

// ===========================
// RESCUE TEAMS
// ===========================
const numericTeamStatusMap: Record<number, string> = {
  1: "ACTIVE",
  2: "INACTIVE",
  3: "ON_DUTY",
  4: "OFF_DUTY",
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
        .map((t: any) => ({
          ...t,
          name: t.teamName ?? t.name ?? "Đội không tên",
          status: typeof t.status === "number"
            ? (numericTeamStatusMap[t.status] ?? "INACTIVE")
            : t.status === "AVAILABLE" ? "ACTIVE" : (t.status || "INACTIVE"),
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
      return (response.data as MissionSummary[]).map(normalizeMission);
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
        queryClient.invalidateQueries({ queryKey: apiQueryKeys.requests.all }),
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
      await queryClient.invalidateQueries({
        queryKey: apiQueryKeys.requests.all,
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
