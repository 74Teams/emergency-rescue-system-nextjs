import { PaginationQuery, ApiRole } from "../../common/common.types";
import { ProfileResponse } from "../auth/auth.types";

export interface CommanderAccountSummary {
  id: string;
  fullName?: string;
  username: string;
  email: string;
  avatarUrl?: string;
  phoneNumber?: string;
  isActive: boolean;
  role: ApiRole[];
  createdAt?: string;
  rescueTeamId?: string | null;
}

export interface AccountQueryParams extends PaginationQuery {
  search?: string;
  role?: ApiRole | "ALL" | string;
}

export interface UserWithPendingCheck extends ProfileResponse {
  isActive: boolean;
  isPendingApproval: boolean;
  createdAt?: string;
}
