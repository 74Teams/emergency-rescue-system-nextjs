import { apiRequest } from "../../client";
import { apiRoutes, apiRouteBuilders } from "../../endpoints";
import { ApiResponse, PaginationQuery } from "../../common/common.types";
import { CreateReportInput, ReportPageData, ReportSummary } from "./reports.types";

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
    return apiRequest<ApiResponse<ReportSummary & { mission?: any; createdBy?: any }>>({
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
    return apiRequest<ApiResponse<Array<any>>>({
      method: "GET",
      url: apiRouteBuilders.reports.byMission(missionId),
    });
  },
};
