export type RequestStatus = "PENDING" | "ACCEPTED" | "IN_PROGRESS" | "COMPLETED" | "CANCELED" | "REJECTED";
export type PriorityLevel = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
export type EmergencyType = "FIRE" | "FLOOD" | "EARTHQUAKE" | "MEDICAL_EMERGENCY" | "TRAFFIC_EMERGENCY" | "BUILDING_COLLAPSE" | "NATURAL_DISASTER" | "OTHER";
export type MediaType = "IMAGE" | "VIDEO" | "AUDIO" | "FILE";

export interface RequestMedia {
  id: string;
  mediaUrl: string;
  mediaType: MediaType;
}

export interface RequestOwnerSummary {
  id: string;
  fullName: string;
  phoneNumber?: string;
  email?: string;
  userName?: string;
}

export interface RequestLocationSummary {
  id: string;
  latitude: number;
  longitude: number;
  address: string;
  landmark?: string;
}

export interface RequestMissionSummary {
  id: string;
  status: string;
  rescueTeamId?: string;
  teamName?: string;
  startTime?: string;
  endTime?: string | null;
}

export interface RequestSummary {
  id: string;
  emergencyType: EmergencyType;
  priority: PriorityLevel;
  status: RequestStatus;
  description: string;
  location: RequestLocationSummary | null;
  requestedBy: RequestOwnerSummary | null;
  medias?: RequestMedia[];
  missions?: RequestMissionSummary[];
  createdAt?: string;
  updatedAt?: string;
}

export interface RequestHistoryItem {
  id: string;
  fromStatus: RequestStatus;
  toStatus: RequestStatus;
  changedById: string;
  note?: string;
  changedBy?: {
    id: string;
    fullName: string;
    email?: string;
  };
  createdAt: string;
}

export interface CreateRequestInput {
  emergencyType: EmergencyType | number;
  priority: PriorityLevel | number;
  description: string;
  locationId: string;
  medias?: File[];
}

export type UpdateRequestInput = CreateRequestInput;

export interface ChangeRequestStatusInput {
  newStatus: RequestStatus | number;
  note?: string;
}

export interface RequestPageData {
  items: RequestSummary[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}
