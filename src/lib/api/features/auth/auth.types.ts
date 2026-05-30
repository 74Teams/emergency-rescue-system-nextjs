import { ApiRole, Address } from "../../common/common.types";

export interface AuthUserSummary {
  id: string;
  email: string;
  fullName: string;
  phoneNumber?: string;
  avatarUrl?: string;
  roles: ApiRole[];
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  userName: string;
  phoneNumber: string;
  address?: string;
  dateOfBirth: string;
  avatar?: string;
  role?: string;
}

export interface AuthTokenPayload {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: AuthUserSummary;
}

export interface ProfileResponse {
  id: string;
  fullName?: string;
  rescueTeamId?: string;
  teamName?: string;
  userName?: string;
  email: string;
  phoneNumber?: string;
  avatarUrl?: string;
  avatar?: string;
  address?: Address;
  roles: ApiRole[];
}

export interface UpdateProfileRequest {
  fullName: string;
  phoneNumber: string;
  address?: Address;
}

export interface UploadAvatarResponse {
  avatarUrl: string;
  publicId: string;
}
