import { apiRequest } from "./client";
import { apiRouteBuilders, apiRoutes } from "./endpoints";
import type {
  ApiResponse,
  ApiRole,
  AuthTokenPayload,
  ChangeRequestStatusInput,
  ContactSummary,
  CreateContactInput,
  CreateLocationRequest,
  CreateMissionInput,
  CreateReportInput,
  CreateRequestInput,
  CreateRescueTeamInput,
  CreateRoleInput,
  LocationSummary,
  LoginRequest,
  MissionStatus,
  MissionSummary,
  MissionTimelineItem,
  PaginationQuery,
  ProfileResponse,
  RegisterRequest,
  ReportSummary,
  RequestHistoryItem,
  RequestStatus,
  RequestSummary,
  RescueTeamSummary,
  RoleSummary,
  TeamMemberDTO,
  TeamMemberSummary,
  UpdateMissionStatusInput,
  UpdateProfileRequest,
  UpdateRequestInput,
  UploadAvatarResponse,
  UserWithPendingCheck,
} from "./types";

import { toBackendPagination } from "./pagination";
type RequestPageData = {
  items: RequestSummary[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
};

type ReportPageData = {
  items: ReportSummary[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
};

const requestStatusToNumber: Record<RequestStatus, number> = {
  PENDING: 1,
  ACCEPTED: 2,
  IN_PROGRESS: 3,
  COMPLETED: 4,
  CANCELED: 5,
  REJECTED: 6,
};

function appendIfDefined(
  formData: FormData,
  key: string,
  value: string | number | File | Blob | undefined | null,
) {
  if (value === undefined || value === null) {
    return;
  }

  formData.append(key, typeof value === "number" ? String(value) : value);
}

function appendFiles(formData: FormData, key: string, files?: File[]) {
  files?.forEach((file) => formData.append(key, file));
}

function buildRequestFormData(
  payload: CreateRequestInput | UpdateRequestInput,
) {
  const formData = new FormData();

  appendIfDefined(formData, "emergencyType", payload.emergencyType);
  appendIfDefined(formData, "priority", payload.priority);
  appendIfDefined(formData, "description", payload.description);
  appendIfDefined(formData, "locationId", payload.locationId);
  appendIfDefined(formData, "status", "PENDING");
  appendFiles(formData, "Files", payload.medias);

  return formData;
}

function buildRequestUpdateFormData(
  request: RequestSummary,
  overrides?: { status?: RequestStatus },
) {
  const formData = new FormData();

  appendIfDefined(formData, "emergencyType", request.emergencyType);
  appendIfDefined(formData, "priority", request.priority);
  appendIfDefined(formData, "status", overrides?.status ?? request.status);
  appendIfDefined(formData, "description", request.description);
  appendIfDefined(formData, "locationId", request.location?.id);

  return formData;
}

function buildContactPayload(payload: CreateContactInput) {
  return {
    name: payload.name,
    phone: payload.phone,
    relationship: payload.relationship,
  };
}

function buildRoleListPayload(roles: ApiRole[]) {
  return { roles };
}

export const authApi = {
  login(payload: LoginRequest) {
    return apiRequest<ApiResponse<AuthTokenPayload>>({
      method: "POST",
      url: apiRoutes.auth.login,
      data: payload,
    });
  },
  register(payload: RegisterRequest) {
    return apiRequest<ApiResponse<null>>({
      method: "POST",
      url: apiRoutes.auth.register,
      data: payload,
    });
  },
  profile() {
    return apiRequest<ApiResponse<ProfileResponse>>({
      method: "GET",
      url: apiRoutes.auth.profile,
    });
  },
  updateProfile(payload: UpdateProfileRequest) {
    return apiRequest<ApiResponse<ProfileResponse>>({
      method: "PUT",
      url: apiRoutes.auth.profile,
      data: payload,
    });
  },
  uploadAvatar(file: File) {
    const formData = new FormData();
    formData.append("File", file);

    return apiRequest<ApiResponse<UploadAvatarResponse>>({
      method: "POST",
      url: apiRoutes.auth.avatar,
      data: formData,
    });
  },
  forgotPassword(email: string) {
    return apiRequest<ApiResponse<null>>({
      method: "POST",
      url: apiRoutes.auth.forgotPassword,
      data: { email },
    });
  },
  resetPassword(payload: { email: string; otp: string; newPassword: string }) {
    return apiRequest<ApiResponse<null>>({
      method: "POST",
      url: apiRoutes.auth.resetPassword,
      data: payload,
    });
  },
  refresh(refreshToken: string) {
    return apiRequest<ApiResponse<AuthTokenPayload>>({
      method: "POST",
      url: apiRoutes.auth.refresh,
      data: { refreshToken },
    });
  },
};

export const usersApi = {
  create(payload: {
    email: string;
    password: string;
    fullName: string;
    phoneNumber: string;
    roles: ApiRole[];
  }) {
    return apiRequest<ApiResponse<null>>({
      method: "POST",
      url: apiRoutes.users,
      data: payload,
    });
  },
  list(params?: PaginationQuery) {
    return apiRequest<ApiResponse<ProfileResponse[]>>({
      method: "GET",
      url: apiRoutes.users,
      params,
    });
  },
  detail(userId: string) {
    return apiRequest<ApiResponse<ProfileResponse>>({
      method: "GET",
      url: apiRouteBuilders.users.byId(userId),
    });
  },
  update(
    userId: string,
    payload: { fullName?: string; phoneNumber?: string; roles?: ApiRole[] },
  ) {
    return apiRequest<ApiResponse<ProfileResponse>>({
      method: "PUT",
      url: apiRouteBuilders.users.byId(userId),
      data: payload.roles
        ? { ...payload, ...buildRoleListPayload(payload.roles) }
        : payload,
    });
  },
  remove(userId: string) {
    return apiRequest<ApiResponse<null>>({
      method: "DELETE",
      url: apiRouteBuilders.users.byId(userId),
    });
  },
};

export const locationsApi = {
  list(params?: PaginationQuery) {
    return apiRequest<ApiResponse<LocationSummary[]>>({
      method: "GET",
      url: apiRoutes.locations,
      params,
    });
  },
  detail(locationId: string) {
    return apiRequest<ApiResponse<LocationSummary>>({
      method: "GET",
      url: apiRouteBuilders.locations.byId(locationId),
    });
  },
  create(payload: CreateLocationRequest) {
    return apiRequest<ApiResponse<LocationSummary>>({
      method: "POST",
      url: apiRoutes.locations,
      data: payload,
    });
  },
  update(locationId: string, payload: Partial<CreateLocationRequest>) {
    return apiRequest<ApiResponse<null>>({
      method: "PUT",
      url: apiRouteBuilders.locations.byId(locationId),
      data: payload,
    });
  },
  remove(locationId: string) {
    return apiRequest<ApiResponse<null>>({
      method: "DELETE",
      url: apiRouteBuilders.locations.byId(locationId),
    });
  },
};

export const requestsApi = {
  create(payload: CreateRequestInput) {
    return apiRequest<ApiResponse<{ id: string }>>({
      method: "POST",
      url: apiRoutes.requests,
      data: buildRequestFormData(payload),
    });
  },
  list(
    params?: PaginationQuery & {
      status?: RequestStatus;
      priority?: string;
      emergencyType?: string;
    },
  ) {
    return apiRequest<ApiResponse<RequestPageData>>({
      method: "GET",
      url: apiRoutes.requests,
      params: {
        ...toBackendPagination(params),
        Status: params?.status,
        Priority: params?.priority,
        EmergencyType: params?.emergencyType,
      },
    });
  },
  detail(requestId: string) {
    return apiRequest<ApiResponse<RequestSummary>>({
      method: "GET",
      url: apiRouteBuilders.requests.byId(requestId),
    });
  },
  update(requestId: string, payload: UpdateRequestInput) {
    return apiRequest<ApiResponse<{ id: string }>>({
      method: "PUT",
      url: apiRouteBuilders.requests.byId(requestId),
      data: buildRequestFormData(payload),
    });
  },
  remove(requestId: string) {
    return apiRequest<ApiResponse<{ deleted: boolean }>>({
      method: "DELETE",
      url: apiRouteBuilders.requests.byId(requestId),
    });
  },

  changeStatus(requestId: string, payload: ChangeRequestStatusInput) {
    const newStatus =
      typeof payload.newStatus === "number"
        ? payload.newStatus
        : requestStatusToNumber[payload.newStatus];

    return apiRequest<ApiResponse<null>>({
      method: "PUT",
      url: apiRouteBuilders.requests.changeStatus(requestId),
      data: { newStatus },
    });
  },
  history(requestId: string) {
    return apiRequest<ApiResponse<RequestHistoryItem[]>>({
      method: "GET",
      url: apiRouteBuilders.requests.history(requestId),
    });
  },
};

export const rescueTeamsApi = {
  list(params?: PaginationQuery & { status?: string }) {
    return apiRequest<ApiResponse<RescueTeamSummary[]>>({
      method: "GET",
      url: apiRoutes.rescueTeams,
      params,
    });
  },
  detail(teamId: string) {
    return apiRequest<ApiResponse<RescueTeamSummary>>({
      method: "GET",
      url: apiRouteBuilders.rescueTeams.byId(teamId),
    });
  },
  create(payload: CreateRescueTeamInput) {
    return apiRequest<ApiResponse<null>>({
      method: "POST",
      url: apiRoutes.rescueTeams,
      data: payload,
    });
  },
  updateStatus(teamId: string, newStatus: string) {
    return apiRequest<ApiResponse<null>>({
      method: "PUT",
      url: apiRouteBuilders.rescueTeams.status(teamId, newStatus),
    });
  },
  delete(teamId: string) {
    return apiRequest<ApiResponse<null>>({
      method: "DELETE",
      url: apiRouteBuilders.rescueTeams.byId(teamId),
    });
  },
  members(teamId: string) {
    return apiRequest<ApiResponse<TeamMemberDTO[]>>({
      method: "GET",
      url: apiRouteBuilders.rescueTeams.members(teamId),
    });
  },
  addMember(teamId: string, memberId: string) {
    return apiRequest<ApiResponse<null>>({
      method: "POST",
      url: apiRouteBuilders.rescueTeams.member(teamId, memberId),
    });
  },
  removeMember(teamId: string, memberId: string) {
    return apiRequest<ApiResponse<null>>({
      method: "DELETE",
      url: apiRouteBuilders.rescueTeams.member(teamId, memberId),
    });
  },
  missions(
    teamId: string,
    params?: PaginationQuery & { status?: MissionStatus },
  ) {
    return apiRequest<ApiResponse<MissionSummary[]>>({
      method: "GET",
      url: apiRouteBuilders.rescueTeams.missions(teamId),
      params,
    });
  },
};

export const missionsApi = {
  create(payload: CreateMissionInput) {
    return apiRequest<ApiResponse<{ id: string }>>({
      method: "POST",
      url: apiRoutes.missions,
      data: payload,
    });
  },
  list(params?: PaginationQuery & { status?: MissionStatus }) {
    return apiRequest<ApiResponse<MissionSummary[]>>({
      method: "GET",
      url: apiRoutes.missions,
      params: {
        ...toBackendPagination(params),
        Status: params?.status,
      },
    });
  },
  detail(missionId: string) {
    return apiRequest<
      ApiResponse<
        MissionSummary & {
          request?: RequestSummary;
          rescueTeam?: RescueTeamSummary;
        }
      >
    >({
      method: "GET",
      url: apiRouteBuilders.missions.byId(missionId),
    });
  },
  updateStatus(missionId: string, payload: UpdateMissionStatusInput) {
    return apiRequest<ApiResponse<null>>({
      method: "PUT",
      url: apiRouteBuilders.missions.status(missionId),
      data: payload,
    });
  },
  finish(
    missionId: string,
    payload: Pick<UpdateMissionStatusInput, "changedById" | "note">,
  ) {
    return apiRequest<ApiResponse<null>>({
      method: "PUT",
      url: apiRouteBuilders.missions.finish(missionId),
      data: payload,
    });
  },
  abort(
    missionId: string,
    payload: Pick<UpdateMissionStatusInput, "changedById" | "note">,
  ) {
    return apiRequest<ApiResponse<null>>({
      method: "PUT",
      url: apiRouteBuilders.missions.abort(missionId),
      data: payload,
    });
  },
  history(missionId: string) {
    return apiRequest<ApiResponse<MissionTimelineItem[]>>({
      method: "GET",
      url: apiRouteBuilders.missions.history(missionId),
    });
  },
};

export const reportsApi = {
  create(payload: CreateReportInput) {
    return apiRequest<ApiResponse<{ id: string }>>({
      method: "POST",
      url: apiRoutes.reports,
      data: payload,
    });
  },
  list(params?: PaginationQuery & { type?: string; outcome?: string }) {
    return apiRequest<ApiResponse<ReportPageData>>({
      method: "GET",
      url: apiRoutes.reports,
      params,
    });
  },
  detail(reportId: string) {
    return apiRequest<
      ApiResponse<
        ReportSummary & {
          mission?: MissionSummary & { rescueTeam?: RescueTeamSummary };
          createdBy?: { id: string; fullName: string; email?: string };
        }
      >
    >({
      method: "GET",
      url: apiRouteBuilders.reports.byId(reportId),
    });
  },
  update(reportId: string, payload: Partial<CreateReportInput>) {
    return apiRequest<ApiResponse<null>>({
      method: "PUT",
      url: apiRouteBuilders.reports.byId(reportId),
      data: payload,
    });
  },
  remove(reportId: string) {
    return apiRequest<ApiResponse<null>>({
      method: "DELETE",
      url: apiRouteBuilders.reports.byId(reportId),
    });
  },
  exportPdf(reportId: string) {
    return apiRequest<Blob>({
      method: "GET",
      url: apiRouteBuilders.reports.exportPdf(reportId),
      responseType: "blob",
    });
  },
  byMission(missionId: string) {
    return apiRequest<
      ApiResponse<
        Array<{
          id: string;
          content: string;
          outcome: string;
          createdBy: { fullName: string };
          createdAt: string;
        }>
      >
    >({
      method: "GET",
      url: apiRouteBuilders.reports.byMission(missionId),
    });
  },
};

export const contactsApi = {
  create(payload: CreateContactInput) {
    return apiRequest<ApiResponse<string>>({
      method: "POST",
      url: apiRoutes.auth.contact,
      data: buildContactPayload(payload),
    });
  },
  list() {
    return apiRequest<ApiResponse<ContactSummary[]>>({
      method: "GET",
      url: apiRoutes.auth.contact,
    });
  },
  detail(contactId: string) {
    return apiRequest<ApiResponse<ContactSummary>>({
      method: "GET",
      url: `${apiRoutes.auth.contact}/${contactId}`,
    });
  },
  update(contactId: string, payload: CreateContactInput) {
    return apiRequest<ApiResponse<null>>({
      method: "PUT",
      url: `${apiRoutes.auth.contact}/${contactId}`,
      data: buildContactPayload(payload),
    });
  },
  remove(contactId: string) {
    return apiRequest<ApiResponse<null>>({
      method: "DELETE",
      url: `${apiRoutes.auth.contact}/${contactId}`,
    });
  },
};

export const rolesApi = {
  create(payload: CreateRoleInput) {
    return apiRequest<ApiResponse<null>>({
      method: "POST",
      url: apiRoutes.roles,
      data: payload,
    });
  },
  list() {
    return apiRequest<ApiResponse<RoleSummary[]>>({
      method: "GET",
      url: apiRoutes.roles,
    });
  },
  detail(roleId: string) {
    return apiRequest<ApiResponse<RoleSummary>>({
      method: "GET",
      url: apiRouteBuilders.roles.byId(roleId),
    });
  },
  update(roleId: string, payload: CreateRoleInput) {
    return apiRequest<ApiResponse<null>>({
      method: "PUT",
      url: apiRouteBuilders.roles.byId(roleId),
      data: payload,
    });
  },
  remove(roleId: string) {
    return apiRequest<ApiResponse<null>>({
      method: "DELETE",
      url: apiRouteBuilders.roles.byId(roleId),
    });
  },
};

export const commanderApi = {
  getPendingApprovals() {
    return apiRequest<ApiResponse<UserWithPendingCheck[]>>({
      method: "GET",
      url: apiRouteBuilders.commander.approvals.pending,
    });
  },

  getSystemAccounts(params?: { search?: string; role?: string }) {
    return apiRequest({
      method: "GET",
      url: apiRouteBuilders.commander.users.list,
      params,
    });
  },

  approveAccount(userId: string) {
    return apiRequest({
      method: "POST",
      url: apiRouteBuilders.commander.approvals.approve(userId),
    });
  },

  // Từ chối tài khoản
  rejectAccount(userId: string) {
    return apiRequest({
      method: "POST",
      url: apiRouteBuilders.commander.approvals.reject(userId),
    });
  },

  // Khóa/Mở khóa tài khoản
  toggleAccountStatus(userId: string, isActive: boolean) {
    return apiRequest({
      method: "PUT",
      url: apiRouteBuilders.commander.users.toggleStatus(userId),
      data: { isActive },
    });
  },
};
