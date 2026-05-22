import { apiRequest } from "../../client";
import { apiRoutes, apiRouteBuilders } from "../../endpoints";
import { ApiResponse, PaginationQuery } from "../../common/common.types";
import { LocationSummary, CreateLocationRequest } from "./locations.types";

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
