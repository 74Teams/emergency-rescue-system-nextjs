export type ApiRole =
  | "Admin"
  | "Citizen"
  | "Dispatcher"
  | "Commander"
  | "Rescuer"
  | "RescuerLeader";

export type RequestStatus =
  | "PENDING"
  | "ACCEPTED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELED"
  | "REJECTED";
export type MissionStatus =
  | "ASSIGNED"
  | "EN_ROUTE"
  | "ON_SITE"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "ABORTED";
export type TeamStatus =
  | "AVAILABLE"
  | "ON_MISSION"
  | "UNAVAILABLE"
  | "MAINTENANCE";
export type PriorityLevel = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
export type EmergencyType =
  | "FIRE"
  | "FLOOD"
  | "EARTHQUAKE"
  | "MEDICAL_EMERGENCY"
  | "TRAFFIC_EMERGENCY"
  | "BUILDING_COLLAPSE"
  | "NATURAL_DISASTER"
  | "OTHER";
export type MediaType = "IMAGE" | "VIDEO" | "AUDIO" | "FILE";

export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  statusCode: number;
  message: string;
  errors?: Array<{ field?: string; message: string }>;
  error?: string;
}

export interface PaginationMeta {
  totalCount: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export type PaginatedResponse<T> = ApiResponse<{ items: T[] } & PaginationMeta>;

export interface PaginationQuery {
  pageNumber?: number;
  pageSize?: number;
  sortBy?: string;
}

export interface Address {
  street?: string;
  city?: string;
  district?: string;
  gps?: string;
}

export interface AuthUserSummary {
  id: string;
  email: string;
  fullName: string;
  phoneNumber?: string;
  avatarUrl?: string;
  roles: ApiRole[];
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  userName: string;
  phoneNumber: string;
  address?: string;
  dateOfBirth: string;
  avatar?: string;
}

export interface AuthTokenPayload {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: AuthUserSummary;
}

export interface ProfileResponse {
  id: string;
  fullName?: string;
  rescueTeamId?: string;
  teamName?: string;
  userName?: string;
  email: string;
  phoneNumber?: string;
  avatarUrl?: string;
  avatar?: string;
  address?: Address;
  roles: ApiRole[];
}

export interface UpdateProfileRequest {
  fullName: string;
  phoneNumber: string;
  address?: Address;
}

export interface UploadAvatarResponse {
  avatarUrl: string;
  publicId: string;
}

export interface LocationSummary {
  id: string;
  latitude: number;
  longitude: number;
  address: string;
  landmark?: string;
  createdAt?: string;
}

export interface CreateLocationRequest {
  latitude: number;
  longitude: number;
  address: string;
  landmark?: string;
}

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
  status: MissionStatus;
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
  newStatus: RequestStatus;
  note?: string;
}

export interface RescueTeamSummary {
  id: string;
  teamName: string;
  status: TeamStatus;
  description?: string;
  baseLocation: {
    latitude: number;
    longitude: number;
    address?: string;
    landmark?: string;
  };
  leaderId?: string;
  leader?: {
    id: string;
    fullName: string;
    email?: string;
  };
  memberCount?: number;
  createdAt?: string;
}

export interface CreateRescueTeamInput {
  teamName: string;
  teamLeaderId: string;
  description?: string;
  baseLocationId?: string;
  memberIds?: string[];
}

export interface TeamMemberSummary {
  id: string;
  userId: string;
  teamId: string;
  joinDate?: string;
  user?: {
    id: string;
    fullName: string;
    email?: string;
    phoneNumber?: string;
  };
}

export interface MissionSummary {
  id: string;
  requestId: string;
  dispatcherId?: string;
  rescueTeamId: string;
  status: MissionStatus;
  startTime?: string;
  endTime?: string | null;
  createdAt?: string;
}

export interface CreateMissionInput {
  requestId: string;
  dispatcherId: string;
  rescueTeamId: string;
}

export interface UpdateMissionStatusInput {
  status: MissionStatus;
  changedById: string;
  note?: string;
}

export interface MissionTimelineItem {
  id: string;
  missionId: string;
  fromStatus: MissionStatus;
  toStatus: MissionStatus;
  changedById: string;
  note?: string;
  changedBy?: {
    id: string;
    fullName: string;
    email?: string;
  };
  createdAt: string;
}

export type ReportType = "SUMMARY" | "DAILY" | "INCIDENT" | "OTHER";
export type ReportOutcome = "SUCCESS" | "FAILED" | "PARTIAL" | "PENDING";

export interface CreateReportInput {
  missionId: string;
  createdById: string;
  content: string;
  type: ReportType;
  outcome: ReportOutcome;
  injuries?: string;
  damages?: string;
  latitude?: number;
  longitude?: number;
  note?: string;
}

export interface ReportSummary {
  id: string;
  missionId: string;
  createdById: string;
  content: string;
  type: ReportType;
  outcome: ReportOutcome;
  injuries?: string;
  damages?: string;
  latitude?: number;
  longitude?: number;
  note?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ContactSummary {
  id: string;
  name: string;
  phone: string;
  relationship: string;
  createdAt?: string;
}

export interface CreateContactInput {
  name: string;
  phone: string;
  relationship: string;
}

export interface CreateRoleInput {
  name: ApiRole;
  description?: string;
}

export interface RoleSummary {
  id: string;
  name: ApiRole | string;
  description?: string;
}

// Command Center - Rescue Team Filters
export interface RescueTeamFilter {
  status?: TeamStatus;
  search?: string;
}

export interface RescueTeamQueryParams extends PaginationQuery {
  status?: TeamStatus;
  search?: string;
}

export interface CommanderAccountSummary {
  id: string;
  fullName?: string;
  username: string;
  email: string;
  avatarUrl?: string;
  //address; : string;
  phoneNumber?: string;
  isActive: boolean;
  role: ApiRole[];
  createdAt?: string;
}

//  Tham số để filter danh sách tài khoản (áp dụng cho Tab Account Management)
export interface AccountQueryParams extends PaginationQuery {
  search?: string;
  role?: ApiRole | "ALL" | string;
}

//UserSystemDTO
export interface UserWithPendingCheck extends ProfileResponse {
  isActive: boolean;
  isPendingApproval: boolean;
}

//TeamMemberDTO
export interface TeamMemberDTO {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  avatar?: string;
  isActive: boolean;
}
