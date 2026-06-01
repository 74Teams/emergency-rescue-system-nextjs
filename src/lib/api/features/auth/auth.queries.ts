import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authApi } from "./auth.api";
import { getStoredAccessToken, setStoredAuthSession, clearStoredAuthSession, getStoredUser, setStoredUser } from "../../storage";
import { normalizeAuthTokenPayload } from "@/lib/auth/normalize-auth";
import { resolvePostLoginPath } from "@/lib/auth/route-access";
import { useRouter } from "next/navigation";
import { LoginRequest, AuthTokenPayload } from "./auth.types";
import { ApiRole } from "../../common/common.types";

// qk-factory-pattern: Standardized query key factory
export const authKeys = {
  all: ["auth"] as const,
  profile: () => [...authKeys.all, "profile"] as const,
};

// Hooks
export function getRoleRedirectPath(roles: ApiRole[] | string[]) {
  return resolvePostLoginPath(roles as string[], null);
}

export function useProfileQuery() {
  return useQuery({
    queryKey: authKeys.profile(),
    queryFn: async () => {
      const res = await authApi.profile();
      return res.data;
    },
    enabled: !!getStoredAccessToken(),
    staleTime: 60 * 1000, // 60s — rescueTeamId cần được refresh sớm
  });
}

// Mutations
function persistAuthSession(data: AuthTokenPayload): AuthTokenPayload {
  const session = { ...data };
  setStoredAuthSession(session);
  return session;
}

export function useLogin() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ payload, redirectTo }: { payload: LoginRequest; redirectTo?: string | null }) => {
      const response = await authApi.login(payload);
      const session = persistAuthSession(normalizeAuthTokenPayload(response.data));
      return { session, redirectTo };
    },
    onSuccess: ({ session, redirectTo }) => {
      // mut-invalidate-queries: Automatically invalidate auth state
      queryClient.invalidateQueries({ queryKey: authKeys.all });
      const nextPath = resolvePostLoginPath(
        session.user.roles as string[],
        redirectTo
      );
      router.replace(nextPath);
    },
  });
}

export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return () => {
    clearStoredAuthSession();
    queryClient.clear();
    router.replace("/");
  };
}

export function updateStoredUserAvatar(avatarUrl: string) {
  const user = getStoredUser();
  if (!user) return;
  setStoredUser({ ...user, avatarUrl });
}
