"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { authApi } from "./services";
import { setStoredAuthSession } from "./storage";
import type { ApiRole, LoginRequest } from "./types";

export function getRoleRedirectPath(roles: ApiRole[]) {
  if (roles.includes("Dispatcher")) {
    return "/dispatcher";
  }

  if (roles.includes("Rescuer") || roles.includes("RescuerLeader")) {
    return "/member";
  }

  return "/";
}

export function useLogin() {
  const router = useRouter();

  return useMutation({
    mutationFn: async (payload: LoginRequest) => {
      const response = await authApi.login(payload);
      return response.data;
    },
    onSuccess: (data) => {
      setStoredAuthSession(data);

      router.push(getRoleRedirectPath(data.user.roles));
    },
  });
}
