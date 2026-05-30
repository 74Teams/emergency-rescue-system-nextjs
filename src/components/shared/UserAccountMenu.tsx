"use client";

import { LayoutDashboard, LogIn, LogOut, Settings, User } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { ProfileSettingsDialog } from "@/components/shared/ProfileSettingsDialog";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getStoredAccessToken, getStoredUser } from "@/lib/api/storage";
import { getRoleRedirectPath, useLogout } from "@/lib/api/use-auth";
import { useProfileQuery } from "@/lib/api/use-profile";
import { hasAnyRole } from "@/lib/auth/route-access";

const STAFF_ROLES = [
  "Dispatcher",
  "Commander",
  "Rescuer",
  "RescuerLeader",
] as const;

interface UserAccountMenuProps {
  /** Nút đăng nhập khi chưa có token (trang citizen) */
  showLoginWhenGuest?: boolean;
  avatarSize?: "sm" | "md" | "lg";
}

export function UserAccountMenu({
  showLoginWhenGuest = false,
  avatarSize = "md",
}: UserAccountMenuProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const logout = useLogout();
  const { data: profile } = useProfileQuery();

  useEffect(() => {
    setMounted(true);
  }, []);

  const token = mounted ? getStoredAccessToken() : null;
  const storedUser = mounted ? getStoredUser() : null;
  const isLoggedIn = !!token;
  const name =
    profile?.fullName ?? profile?.fullName ?? storedUser?.fullName ?? "";
  const email = profile?.email ?? storedUser?.email ?? "";
  const avatarUrl =
    profile?.avatarUrl ?? profile?.avatar ?? storedUser?.avatarUrl ?? null;
  const roles = (profile?.roles ?? storedUser?.roles ?? []) as string[];
  const isStaff = hasAnyRole(roles, STAFF_ROLES);
  const dashboardPath = isStaff ? getRoleRedirectPath(roles) : "/";

  if (!mounted) {
    return <div className="size-9 shrink-0" aria-hidden />;
  }

  if (!isLoggedIn && showLoginWhenGuest) {
    return (
      <Button
        asChild
        variant="outline"
        size="sm"
        className="rounded-full gap-1.5"
      >
        <Link href="/login">
          <LogIn className="size-4" />
          Đăng nhập
        </Link>
      </Button>
    );
  }

  if (!isLoggedIn) {
    return (
      <Button asChild variant="ghost" size="icon" className="rounded-full">
        <Link href="/login" title="Đăng nhập">
          <User className="size-5 text-slate-500" />
        </Link>
      </Button>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            aria-label="Menu tài khoản"
          >
            <UserAvatar
              name={name}
              src={avatarUrl}
              size={avatarSize}
              showRing
            />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="font-normal">
            <p className="font-semibold truncate">{name || "Tài khoản"}</p>
            <p className="text-xs text-muted-foreground truncate">{email}</p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {isStaff && dashboardPath !== "/" && (
            <DropdownMenuItem asChild>
              <Link href={dashboardPath} className="cursor-pointer">
                <LayoutDashboard className="mr-2 size-4" />
                Bảng điều khiển
              </Link>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem asChild>
            <Link href="/profile" className="cursor-pointer">
              <User className="mr-2 size-4" />
              Trang cá nhân
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setSettingsOpen(true)}>
            <Settings className="mr-2 size-4" />
            Cài đặt tài khoản
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-red-600 focus:text-red-600"
            onClick={logout}
          >
            <LogOut className="mr-2 size-4" />
            Đăng xuất
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ProfileSettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
      />
    </>
  );
}
