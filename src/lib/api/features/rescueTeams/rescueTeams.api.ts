import { apiRequest } from "../../client";
import { apiRoutes, apiRouteBuilders } from "../../endpoints";
import { ApiResponse } from "../../common/common.types";
import { RescueTeamSummary, CreateRescueTeamInput, RescueTeamMemberDTO, RescueTeamQueryParams } from "./rescueTeams.types";

export const rescueTeamsApi = {
  list(params?: RescueTeamQueryParams) {
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
    return apiRequest<ApiResponse<RescueTeamMemberDTO[]>>({
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
  missions(teamId: string, params?: any) {
    return apiRequest<ApiResponse<any[]>>({
      method: "GET",
      url: apiRouteBuilders.rescueTeams.missions(teamId),
      params,
    });
  },
};
