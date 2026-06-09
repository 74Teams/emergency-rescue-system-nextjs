import { apiRequest } from "../../client";
import { apiRoutes, apiRouteBuilders } from "../../endpoints";
import { ApiResponse, PaginationQuery } from "../../common/common.types";
import { toBackendPagination } from "../../pagination";
import { 
  RequestPageData, CreateRequestInput, UpdateRequestInput, 
  ChangeRequestStatusInput, RequestSummary, RequestHistoryItem, RequestStatus 
} from "./requests.types";

const requestStatusToNumber: Record<string, number> = {
  PENDING: 1,
  ACCEPTED: 2,
  IN_PROGRESS: 3,
  COMPLETED: 4,
  CANCELED: 5,
  REJECTED: 6,
};

function appendIfDefined(formData: FormData, key: string, value: string | number | File | Blob | undefined | null) {
  if (value === undefined || value === null) return;
  formData.append(key, typeof value === "number" ? String(value) : value);
}

function appendFiles(formData: FormData, key: string, files?: File[]) {
  files?.forEach((file) => formData.append(key, file));
}

function buildRequestFormData(payload: CreateRequestInput | UpdateRequestInput) {
  const formData = new FormData();
  appendIfDefined(formData, "emergencyType", payload.emergencyType);
  appendIfDefined(formData, "priority", payload.priority);
  appendIfDefined(formData, "description", payload.description);
  appendIfDefined(formData, "phoneNumber", payload.phoneNumber);
  appendIfDefined(formData, "locationId", payload.locationId);
  appendIfDefined(formData, "status", "PENDING");
  appendFiles(formData, "Files", payload.medias);
  return formData;
}

export const requestsApi = {
  create(payload: CreateRequestInput) {
    return apiRequest<ApiResponse<{ id: string }>>({
      method: "POST",
      url: apiRoutes.requests,
      data: buildRequestFormData(payload),
    });
  },
  list(params?: PaginationQuery & { status?: string; priority?: string; emergencyType?: string }) {
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
    const newStatus = typeof payload.newStatus === "number" 
      ? payload.newStatus 
      : requestStatusToNumber[payload.newStatus as string];

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
