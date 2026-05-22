"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authApi, contactsApi } from "@/lib/api/services";
import { apiQueryKeys } from "@/lib/api/query-keys";
import { getStoredAccessToken } from "@/lib/api/storage";
import { getApiErrorMessage } from "@/lib/api/client";
import type {
  ContactSummary,
  CreateContactInput,
  ProfileResponse,
  UpdateProfileRequest,
} from "@/lib/api/types";
import { toast } from "sonner";

export function useProfileQuery() {
  return useQuery({
    queryKey: apiQueryKeys.auth.profile,
    queryFn: async () => {
      const res = await authApi.profile();
      return res.data;
    },
    enabled: !!getStoredAccessToken(),
    staleTime: 5 * 60_000,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: UpdateProfileRequest) => {
      const res = await authApi.updateProfile(payload);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: apiQueryKeys.auth.profile });
      toast.success("Cập nhật thông tin thành công!");
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });
}

export function useUploadAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      const res = await authApi.uploadAvatar(file);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: apiQueryKeys.auth.profile });
      toast.success("Cập nhật ảnh đại diện thành công!");
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });
}

export function useContactsQuery() {
  return useQuery({
    queryKey: apiQueryKeys.contacts.all,
    queryFn: async () => {
      const res = await contactsApi.list();
      return res.data;
    },
    enabled: !!getStoredAccessToken(),
    staleTime: 5 * 60_000,
  });
}

export function useCreateContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateContactInput) => {
      const res = await contactsApi.create(payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: apiQueryKeys.contacts.all });
      toast.success("Thêm liên hệ khẩn cấp thành công!");
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });
}

export function useUpdateContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      contactId,
      payload,
    }: {
      contactId: string;
      payload: CreateContactInput;
    }) => {
      const res = await contactsApi.update(contactId, payload);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: apiQueryKeys.contacts.all });
      toast.success("Cập nhật liên hệ thành công!");
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });
}

export function useDeleteContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (contactId: string) => {
      const res = await contactsApi.remove(contactId);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: apiQueryKeys.contacts.all });
      toast.success("Xóa liên hệ thành công!");
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: async (email: string) => {
      const res = await authApi.forgotPassword(email);
      return res;
    },
    onSuccess: () => {
      toast.success("Link đổi mật khẩu đã được gửi tới email của bạn!");
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });
}
