import { PaginationQuery } from "../../common/common.types";

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

export interface ReportPageData {
  items: ReportSummary[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}
