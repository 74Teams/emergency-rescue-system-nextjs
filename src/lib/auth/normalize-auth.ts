import type {
  ApiRole,
  AuthTokenPayload,
  AuthUserSummary,
} from "@/lib/api/types";

export function normalizeApiRoles(roles: unknown): string[] {
  if (!Array.isArray(roles)) return [];
  return roles.map((r) => String(r).trim()).filter(Boolean);
}

function pickString(
  source: Record<string, unknown>,
  ...keys: string[]
): string {
  for (const key of keys) {
    const value = source[key];
    if (value !== undefined && value !== null && value !== "") {
      return String(value);
    }
  }
  return "";
}

/** Chuẩn hóa payload login (hỗ trợ camelCase / PascalCase từ .NET) */
export function normalizeAuthTokenPayload(raw: unknown): AuthTokenPayload {
  const root = (raw ?? {}) as Record<string, unknown>;
  const userRaw = (root.user ?? root.User ?? {}) as Record<string, unknown>;

  const user: AuthUserSummary = {
    id: pickString(userRaw, "id", "Id"),
    email: pickString(userRaw, "email", "Email"),
    fullName: pickString(userRaw, "fullName", "FullName"),
    phoneNumber: pickString(userRaw, "phoneNumber", "PhoneNumber") || undefined,
    avatarUrl:
      pickString(userRaw, "avatarUrl", "avatar", "Avatar") || undefined,
    roles: normalizeApiRoles(userRaw.roles ?? userRaw.Roles) as ApiRole[],
    isActive: Boolean(userRaw.isActive ?? userRaw.IsActive ?? true),
    isPendingApproval: Boolean(userRaw.isPendingApproval ?? userRaw.IsPendingApproval ?? false),
  };

  return {
    accessToken: pickString(root, "accessToken", "AccessToken"),
    refreshToken: pickString(root, "refreshToken", "RefreshToken"),
    expiresIn: Number(root.expiresIn ?? root.ExpiresIn ?? 3600),
    user,
  };
}
