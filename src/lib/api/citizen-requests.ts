"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiQueryKeys } from "./query-keys";
import { locationsApi, requestsApi } from "./services";
import type {
  EmergencyType,
  PriorityLevel,
  RequestSummary,
  RequestStatus as ApiRequestStatus,
} from "./types";

import type {
  EmergencyCategory,
  RequestDetail,
  RequestPriority,
  RequestStatus,
} from "@/types/request";

export interface CitizenRequestSubmissionInput {
  emergencyType: number;
  priority: number;
  description: string;
  address: string;
  latitude: number;
  longitude: number;
  landmark?: string;
  medias?: File[];
}

// Numeric enum values matching backend C# enums
export const EMERGENCY_TYPE_OPTIONS = [
  { value: 1, label: "🔥 Hỏa hoạn / Cháy nổ", icon: "FIRE" },
  { value: 2, label: "🌊 Ngập lụt / Lũ quét", icon: "FLOOD" },
  { value: 3, label: "🌍 Động đất", icon: "EARTHQUAKE" },
  { value: 4, label: "🏥 Cấp cứu y tế", icon: "MEDICAL" },
  { value: 5, label: "🚗 Tai nạn giao thông", icon: "TRAFFIC" },
  { value: 6, label: "🏚️ Sập công trình", icon: "COLLAPSE" },
  { value: 7, label: "⛰️ Sạt lở / Thiên tai", icon: "LANDSLIDE" },
  { value: 8, label: "📋 Khác", icon: "OTHER" },
] as const;

export const PRIORITY_OPTIONS = [
  {
    value: 1,
    label: "Cực kỳ khẩn cấp",
    color: "text-red-600",
    bg: "bg-red-50 border-red-200",
  },
  {
    value: 2,
    label: "Nguy hiểm cao",
    color: "text-orange-600",
    bg: "bg-orange-50 border-orange-200",
  },
  {
    value: 3,
    label: "Trung bình",
    color: "text-blue-600",
    bg: "bg-blue-50 border-blue-200",
  },
  {
    value: 4,
    label: "Thấp",
    color: "text-slate-600",
    bg: "bg-slate-50 border-slate-200",
  },
] as const;

const emergencyTypeMap: Record<EmergencyCategory, EmergencyType> = {
  FIRE: "FIRE",
  FLOOD: "FLOOD",
  MEDICAL: "MEDICAL_EMERGENCY",
  LANDSLIDE: "NATURAL_DISASTER",
  EARTHQUAKE: "EARTHQUAKE",
  TRAFFIC: "TRAFFIC_EMERGENCY",
  COLLAPSE: "BUILDING_COLLAPSE",
  OTHER: "OTHER",
};

const priorityMap: Record<RequestPriority, PriorityLevel> = {
  CRITICAL: "CRITICAL",
  HIGH: "HIGH",
  MEDIUM: "MEDIUM",
  LOW: "LOW",
};

const apiEmergencyTypeMap: Partial<Record<EmergencyType, EmergencyCategory>> = {
  FIRE: "FIRE",
  FLOOD: "FLOOD",
  MEDICAL_EMERGENCY: "MEDICAL",
  NATURAL_DISASTER: "LANDSLIDE",
  EARTHQUAKE: "EARTHQUAKE",
  TRAFFIC_EMERGENCY: "TRAFFIC",
  BUILDING_COLLAPSE: "COLLAPSE",
  OTHER: "OTHER",
};

const apiPriorityMap: Partial<Record<PriorityLevel, RequestPriority>> = {
  CRITICAL: "CRITICAL",
  HIGH: "HIGH",
  MEDIUM: "MEDIUM",
  LOW: "LOW",
};

const apiStatusMap: Record<ApiRequestStatus, RequestStatus> = {
  PENDING: "PENDING",
  ACCEPTED: "IN_PROGRESS",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "RESOLVED",
  CANCELED: "CLOSED",
  REJECTED: "CLOSED",
};

// Backend trả về enum dưới dạng số (C# enum, bắt đầu từ 1)
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

const numericStatusMap: Record<number, ApiRequestStatus> = {
  1: "PENDING",
  2: "ACCEPTED",
  3: "IN_PROGRESS",
  4: "COMPLETED",
  5: "CANCELED",
  6: "REJECTED",
};

function resolveEmergencyType(value: EmergencyType | number): EmergencyType {
  if (typeof value === "number")
    return numericEmergencyTypeMap[value] ?? "OTHER";
  return value;
}

function resolvePriority(value: PriorityLevel | number): PriorityLevel {
  if (typeof value === "number") return numericPriorityMap[value] ?? "LOW";
  return value;
}

function resolveStatus(value: ApiRequestStatus | number): ApiRequestStatus {
  if (typeof value === "number") return numericStatusMap[value] ?? "PENDING";
  return value;
}

function mapSummaryToRequestDetail(request: RequestSummary): RequestDetail {
  const requester = request.requestedBy ?? {
    id: "",
    fullName: "Không rõ",
    phoneNumber: "",
    email: "",
  };

  const location = request.location ?? {
    id: "",
    latitude: 0,
    longitude: 0,
    address: "Không rõ",
    landmark: undefined,
  };

  const emergencyType = resolveEmergencyType(
    request.emergencyType as EmergencyType | number,
  );
  const priority = resolvePriority(request.priority as PriorityLevel | number);
  const status = resolveStatus(request.status as ApiRequestStatus | number);

  return {
    id: request.id,
    userId: requester.id,
    requestedBy: {
      id: requester.id,
      fullName: requester.fullName,
      phoneNumber: requester.phoneNumber ?? "",
      email: requester.email ?? "",
    },
    emergencyType: apiEmergencyTypeMap[emergencyType] ?? "OTHER",
    priority: apiPriorityMap[priority] ?? "LOW",
    status: apiStatusMap[status] ?? "PENDING",
    description: request.description ?? "",
    location: {
      id: location.id,
      latitude: location.latitude,
      longitude: location.longitude,
      address: location.address,
      landmark: location.landmark,
    },
    mediaUrl: request.medias?.map((media) => media.mediaUrl),
    submittedTime:
      request.createdAt ?? request.updatedAt ?? new Date().toISOString(),
    missions: (request.missions ?? []).map((mission) => ({
      id: mission.id,
      status: mission.status === "COMPLETED" ? "COMPLETED" : "IN_PROGRESS",
      startTime: request.createdAt ?? new Date().toISOString(),
      rescueTeam: {
        id: mission.id,
        teamName: "Đội cứu hộ",
        status: mission.status === "COMPLETED" ? "AVAILABLE" : "ON_MISSION",
      },
    })),
    createdAt: request.createdAt ?? new Date().toISOString(),
    updatedAt:
      request.updatedAt ?? request.createdAt ?? new Date().toISOString(),
  };
}

export function useCitizenRequestsQuery() {
  return useQuery({
    queryKey: apiQueryKeys.requests.all,
    queryFn: async () => {
      const response = await requestsApi.list({ pageNumber: 1, pageSize: 100 });
      return {
        ...response.data,
        items: response.data.items.map(mapSummaryToRequestDetail),
      };
    },
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}

export function useCreateCitizenRequestMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CitizenRequestSubmissionInput) => {
      const locationResponse = await locationsApi.create({
        latitude: payload.latitude,
        longitude: payload.longitude,
        address: payload.address,
        landmark: payload.landmark,
      });

      const requestResponse = await requestsApi.create({
        emergencyType: payload.emergencyType,
        priority: payload.priority,
        description: payload.description,
        locationId: locationResponse.data.id,
        medias: payload.medias,
      });

      return requestResponse.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: apiQueryKeys.requests.all,
      });
    },
  });
}
