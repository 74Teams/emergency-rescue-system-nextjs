import { apiRequest } from "../../client";
import { apiRoutes, apiRouteBuilders } from "../../endpoints";
import { ApiResponse } from "../../common/common.types";
import { RoleSummary, CreateRoleInput } from "./roles.types";

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
