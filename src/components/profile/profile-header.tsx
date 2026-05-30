"use client";

import { useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CameraIcon,
  MailIcon,
  PhoneIcon,
  Loader2Icon,
  ShieldCheckIcon,
  ShieldAlertIcon,
  RadioIcon,
  FlameIcon,
  UserIcon,
} from "lucide-react";
import type { ProfileResponse } from "@/lib/api/types";
import { useUploadAvatar } from "@/hooks/use-profile-page";

function getInitials(name?: string): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const roleLabels: Record<string, string> = {
  Admin: "Quản trị viên",
  User: "Người dùng",
  Citizen: "Công dân",
  Dispatcher: "Điều phối viên",
  Commander: "Chỉ huy",
  Rescuer: "Cứu hộ viên",
  RescuerLeader: "Đội trưởng cứu hộ",
};

const roleStyles: Record<string, string> = {
  Admin: "bg-rose-50 text-rose-700 border-rose-200/80 px-2.5 py-1 text-xs font-semibold rounded-full shadow-sm flex items-center h-6",
  User: "bg-slate-100 text-slate-700 border-slate-200 px-2.5 py-1 text-xs font-semibold rounded-full flex items-center h-6",
  Citizen: "bg-blue-50 text-blue-700 border-blue-200 px-2.5 py-1 text-xs font-semibold rounded-full shadow-sm flex items-center h-6",
  Dispatcher: "bg-amber-50 text-amber-700 border-amber-200 px-2.5 py-1 text-xs font-semibold rounded-full shadow-sm flex items-center h-6",
  Commander: "bg-indigo-600 hover:bg-indigo-600/90 text-white border-indigo-600 px-3 py-1 text-xs font-bold rounded-full shadow-md tracking-wide uppercase flex items-center h-6.5",
  Rescuer: "bg-emerald-50 text-emerald-700 border-emerald-200 px-2.5 py-1 text-xs font-semibold rounded-full shadow-sm flex items-center h-6",
  RescuerLeader: "bg-rose-600 hover:bg-rose-600/90 text-white border-rose-600 px-3 py-1 text-xs font-bold rounded-full shadow-md tracking-wide uppercase flex items-center h-6.5",
};

const roleIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  Admin: ShieldCheckIcon,
  Commander: ShieldAlertIcon,
  Dispatcher: RadioIcon,
  Rescuer: FlameIcon,
  RescuerLeader: ShieldAlertIcon,
  Citizen: UserIcon,
  User: UserIcon,
};

interface ProfileHeaderProps {
  profile: ProfileResponse | undefined;
  isLoading: boolean;
}

export function ProfileHeader({ profile, isLoading }: ProfileHeaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadMutation = useUploadAvatar();

  function handleAvatarClick() {
    fileInputRef.current?.click();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB) and type
    if (file.size > 5 * 1024 * 1024) {
      return;
    }
    if (!file.type.startsWith("image/")) {
      return;
    }

    uploadMutation.mutate(file);
    // Reset input so same file can be re-selected
    e.target.value = "";
  }

  if (isLoading) {
    return (
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/5 via-primary/3 to-transparent border border-border p-6 md:p-8">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-6">
          <Skeleton className="size-24 rounded-full" />
          <div className="flex flex-1 flex-col items-center gap-2 sm:items-start">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-36" />
            <div className="flex gap-2 mt-2">
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const avatarUrl = profile?.avatarUrl || profile?.avatar;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/5 via-primary/3 to-transparent">
      {/* Decorative gradient background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/8 via-transparent to-transparent" />

      <div className="relative p-6 md:p-8">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-6">
          {/* Avatar with upload */}
          <div className="group relative">
            <Avatar className="size-24 border-4 border-background shadow-lg ring-2 ring-primary/10">
              <AvatarImage src={avatarUrl} alt={profile?.fullName} />
              <AvatarFallback className="text-xl font-bold bg-primary text-primary-foreground">
                {getInitials(profile?.fullName)}
              </AvatarFallback>
            </Avatar>

            <button
              type="button"
              onClick={handleAvatarClick}
              disabled={uploadMutation.isPending}
              className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100 cursor-pointer disabled:cursor-not-allowed"
              aria-label="Đổi ảnh đại diện"
            >
              {uploadMutation.isPending ? (
                <Loader2Icon className="size-5 text-white animate-spin" />
              ) : (
                <CameraIcon className="size-5 text-white" />
              )}
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              id="profile-avatar-input"
            />
          </div>

          {/* Info */}
          <div className="flex flex-1 flex-col items-center gap-1.5 sm:items-start">
            <h1 className="text-2xl font-bold tracking-tight">
              {profile?.fullName || "—"}
            </h1>

            {profile?.userName && (
              <p className="text-sm text-muted-foreground">
                @{profile.userName}
              </p>
            )}

            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              {profile?.email && (
                <span className="flex items-center gap-1.5">
                  <MailIcon className="size-3.5" />
                  {profile.email}
                </span>
              )}
              {profile?.phoneNumber && (
                <span className="flex items-center gap-1.5">
                  <PhoneIcon className="size-3.5" />
                  {profile.phoneNumber}
                </span>
              )}
            </div>

            {/* Roles */}
            <div className="mt-2.5 flex flex-wrap gap-2">
              {profile?.roles?.map((role) => {
                const Icon = roleIcons[role] || UserIcon;
                const style = roleStyles[role] || "bg-secondary text-secondary-foreground";
                return (
                  <Badge key={role} className={style} variant="outline">
                    <Icon className="size-3.5 mr-1.5 shrink-0" />
                    {roleLabels[role] ?? role}
                  </Badge>
                );
              })}
            </div>

            {/* Team info */}
            {profile?.teamName && (
              <p className="mt-1.5 text-sm text-muted-foreground">
                Đội:{" "}
                <span className="font-medium text-foreground">
                  {profile.teamName}
                </span>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
