/** Roles that must sign in before using their dashboard routes */
export const STAFF_ROLES = [
  "Dispatcher",
  "Commander",
  "Rescuer",
  "RescuerLeader",
] as const;

export type StaffRole = (typeof STAFF_ROLES)[number];

const COMMANDER_ROLES: StaffRole[] = ["Commander"];
const DISPATCHER_ROLES: StaffRole[] = ["Dispatcher", "Commander"];
const RESCUER_ROLES: StaffRole[] = ["Rescuer", "RescuerLeader"];

/** Paths anyone can open without logging in */
export function isPublicPath(pathname: string): boolean {
  if (pathname === "/") return true;
  if (pathname.startsWith("/sos")) return true;
  if (pathname.startsWith("/login")) return true;
  if (pathname.startsWith("/register")) return true;
  if (pathname.startsWith("/forgot-password")) return true;
  return false;
}

export function isAuthRequiredPath(pathname: string): boolean {
  if (isPublicPath(pathname)) return false;
  // All non-public paths require authentication
  return true;
}

export function getProtectedRoles(pathname: string): StaffRole[] | null {
  if (pathname.startsWith("/commander")) return COMMANDER_ROLES;
  if (pathname.startsWith("/dispatcher")) return DISPATCHER_ROLES;
  if (pathname.startsWith("/rescuer")) return RESCUER_ROLES;
  return null;
}

function normalizeRoleName(role: string) {
  return role.trim().toLowerCase();
}

export function hasAnyRole(
  userRoles: string[] | undefined,
  allowed: readonly string[],
): boolean {
  if (!userRoles?.length) return false;
  const userSet = new Set(userRoles.map(normalizeRoleName));
  return allowed.some((role) => userSet.has(normalizeRoleName(role)));
}

export function canAccessPath(
  pathname: string,
  userRoles: string[] | undefined,
): boolean {
  const required = getProtectedRoles(pathname);
  if (!required) return true;
  return hasAnyRole(userRoles, required);
}

function safeDecodeRedirect(redirectTo?: string | null): string | null {
  if (!redirectTo) return null;
  try {
    return decodeURIComponent(redirectTo);
  } catch {
    return redirectTo;
  }
}

export function resolvePostLoginPath(
  userRoles: string[],
  redirectTo?: string | null,
): string {
  const target = safeDecodeRedirect(redirectTo);

  if (target && target.startsWith("/") && canAccessPath(target, userRoles)) {
    return target;
  }

  // Ưu tiên check quyền từ cao xuống thấp
  if (hasAnyRole(userRoles, COMMANDER_ROLES)) return "/commander";
  if (hasAnyRole(userRoles, DISPATCHER_ROLES)) return "/dispatcher";
  if (hasAnyRole(userRoles, RESCUER_ROLES)) return "/rescuer";

  return "/";
}
