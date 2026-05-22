import { ApiRole } from "../../common/common.types";
import { ProfileResponse } from "../auth/auth.types";

export type UserResponse = ProfileResponse; // Since they reuse this type

export interface CreateUserRequest {
  email: string;
  password: string;
  fullName: string;
  phoneNumber: string;
  roles: ApiRole[];
}

export interface UpdateUserRequest {
  fullName?: string; 
  phoneNumber?: string; 
  roles?: ApiRole[];
}
