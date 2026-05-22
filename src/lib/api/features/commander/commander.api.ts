import { apiRequest } from "../../client";
import { apiRouteBuilders } from "../../endpoints";
import { ApiResponse } from "../../common/common.types";
import { UserWithPendingCheck } from "./commander.types";

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
  rejectAccount(userId: string) {
    return apiRequest({
      method: "POST",
      url: apiRouteBuilders.commander.approvals.reject(userId),
    });
  },
  toggleAccountStatus(userId: string, isActive: boolean) {
    return apiRequest({
      method: "PUT",
      url: apiRouteBuilders.commander.users.toggleStatus(userId),
      data: { isActive },
    });
  },
};
