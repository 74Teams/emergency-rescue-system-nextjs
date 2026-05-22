import { apiRequest } from "../../client";
import { apiRoutes, apiRouteBuilders } from "../../endpoints";
import { ApiResponse, PaginationQuery, ApiRole } from "../../common/common.types";
import { UserResponse, CreateUserRequest, UpdateUserRequest } from "./users.types";

function buildRoleListPayload(roles: ApiRole[]) {
  return { roles };
}

export const usersApi = {
  create(payload: CreateUserRequest) {
    return apiRequest<ApiResponse<null>>({
      method: "POST",
      url: apiRoutes.users,
      data: payload,
    });
  },
  list(params?: PaginationQuery) {
    return apiRequest<ApiResponse<UserResponse[]>>({
      method: "GET",
      url: apiRoutes.users,
      params,
    });
  },
  detail(userId: string) {
    return apiRequest<ApiResponse<UserResponse>>({
      method: "GET",
      url: apiRouteBuilders.users.byId(userId),
    });
  },
  update(userId: string, payload: UpdateUserRequest) {
    return apiRequest<ApiResponse<UserResponse>>({
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
