import { apiRequest } from "../../client";
import { apiRoutes, apiRouteBuilders } from "../../endpoints";
import { ApiResponse } from "../../common/common.types";
import { RescueTeamJoinRequestDTO, CreateJoinRequestInput } from "./joinRequest.types";

export const joinRequestsApi = {
  create(payload: CreateJoinRequestInput) {
    return apiRequest<ApiResponse<RescueTeamJoinRequestDTO>>({
      method: "POST",
      url: apiRoutes.joinRequests,
      data: payload,
    });
  },
  getMyStatus() {
    return apiRequest<ApiResponse<RescueTeamJoinRequestDTO | null>>({
      method: "GET",
      url: apiRouteBuilders.joinRequests.myStatus,
    });
  },
  getPending(teamId?: string) {
    return apiRequest<ApiResponse<RescueTeamJoinRequestDTO[]>>({
      method: "GET",
      url: apiRouteBuilders.joinRequests.pending(teamId),
    });
  },
  approve(requestId: string) {
    return apiRequest<ApiResponse<null>>({
      method: "POST",
      url: apiRouteBuilders.joinRequests.approve(requestId),
    });
  },
  reject(requestId: string) {
    return apiRequest<ApiResponse<null>>({
      method: "POST",
      url: apiRouteBuilders.joinRequests.reject(requestId),
    });
  },
};
