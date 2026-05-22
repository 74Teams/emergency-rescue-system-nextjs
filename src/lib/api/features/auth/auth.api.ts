import { apiRequest } from "../../client";
import { apiRoutes } from "../../endpoints";
import { ApiResponse } from "../../common/common.types";
import { 
  AuthTokenPayload, 
  LoginRequest, 
  RegisterRequest, 
  ProfileResponse, 
  UpdateProfileRequest, 
  UploadAvatarResponse 
} from "./auth.types";

export const authApi = {
  login(payload: LoginRequest) {
    return apiRequest<ApiResponse<AuthTokenPayload>>({
      method: "POST",
      url: apiRoutes.auth.login,
      data: payload,
    });
  },
  register(payload: RegisterRequest) {
    return apiRequest<ApiResponse<null>>({
      method: "POST",
      url: apiRoutes.auth.register,
      data: payload,
    });
  },
  profile() {
    return apiRequest<ApiResponse<ProfileResponse>>({
      method: "GET",
      url: apiRoutes.auth.profile,
    });
  },
  updateProfile(payload: UpdateProfileRequest) {
    return apiRequest<ApiResponse<ProfileResponse>>({
      method: "PUT",
      url: apiRoutes.auth.profile,
      data: payload,
    });
  },
  uploadAvatar(file: File) {
    const formData = new FormData();
    formData.append("File", file);

    return apiRequest<ApiResponse<UploadAvatarResponse>>({
      method: "POST",
      url: apiRoutes.auth.avatar,
      data: formData,
    });
  },
  forgotPassword(email: string) {
    return apiRequest<ApiResponse<null>>({
      method: "POST",
      url: apiRoutes.auth.forgotPassword,
      data: { email },
    });
  },
  resetPassword(payload: { email: string; otp: string; newPassword: string }) {
    return apiRequest<ApiResponse<null>>({
      method: "POST",
      url: apiRoutes.auth.resetPassword,
      data: payload,
    });
  },
  refresh(refreshToken: string) {
    return apiRequest<ApiResponse<AuthTokenPayload>>({
      method: "POST",
      url: apiRoutes.auth.refresh,
      data: { refreshToken },
    });
  },
};
