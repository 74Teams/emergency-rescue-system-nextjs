"use client";

import { getStoredAccessToken, getStoredUser } from "@/lib/api/storage";
import {
  canAccessPath,
  getProtectedRoles,
  isAuthRequiredPath,
  isPublicPath,
} from "@/lib/auth/route-access";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    // 1. Public paths → always allowed
    if (isPublicPath(pathname)) {
      setAllowed(true);
      return;
    }

    // 2. All non-public paths require authentication
    if (isAuthRequiredPath(pathname)) {
      const token = getStoredAccessToken();
      const user = getStoredUser();

      if (!token || !user) {
        router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
        setAllowed(false);
        return;
      }

      // Check if user is registered but pending commander approval
      if (user.isPendingApproval && pathname !== "/pending-approval" && pathname !== "/select-role") {
        router.replace("/pending-approval");
        setAllowed(false);
        return;
      }

      // 3. Role-protected paths → additionally check user roles
      const requiredRoles = getProtectedRoles(pathname);
      if (requiredRoles && !canAccessPath(pathname, user.roles)) {
        router.replace("/");
        setAllowed(false);
        return;
      }

      setAllowed(true);
      return;
    }

    // Fallback: allow (should not reach here)
    setAllowed(true);
  }, [pathname, router]);

  if (allowed === null) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Đang kiểm tra quyền...
      </div>
    );
  }

  if (!allowed) return null;

  return <>{children}</>;
}

