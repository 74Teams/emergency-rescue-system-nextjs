import { ApiRole } from "../../common/common.types";

export interface CreateRoleInput {
  name: ApiRole;
  description?: string;
}

export interface RoleSummary {
  id: string;
  name: ApiRole | string;
  description?: string;
}
