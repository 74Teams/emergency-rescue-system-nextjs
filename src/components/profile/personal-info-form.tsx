"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { SaveIcon, Loader2Icon, UserIcon } from "lucide-react";
import type { ProfileResponse, UpdateProfileRequest } from "@/lib/api/types";
import { useUpdateProfile } from "@/hooks/use-profile-page";

interface PersonalInfoFormProps {
  profile: ProfileResponse | undefined;
  isLoading: boolean;
}

export function PersonalInfoForm({
  profile,
  isLoading,
}: PersonalInfoFormProps) {
  const updateMutation = useUpdateProfile();

  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  // Sync form state from profile data
  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName ?? "");
      setPhoneNumber(profile.phoneNumber ?? "");
    }
  }, [profile]);

  const isDirty =
    fullName !== (profile?.fullName ?? "") ||
    phoneNumber !== (profile?.phoneNumber ?? "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const payload: UpdateProfileRequest = {
      fullName,
      phoneNumber,
      address: profile?.address,
    };

    updateMutation.mutate(payload);
  }

  function handleReset() {
    setFullName(profile?.fullName ?? "");
    setPhoneNumber(profile?.phoneNumber ?? "");
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-slate-200 shadow-sm bg-white rounded-2xl p-6 md:p-8 ring-0">
      <CardHeader className="p-0 mb-6 flex flex-col gap-1.5">
        <CardTitle className="flex items-center gap-2 text-xl font-bold text-slate-800">
          <UserIcon className="size-5 text-blue-600" />
          Thông tin cá nhân
        </CardTitle>
        <CardDescription className="text-sm text-slate-500">
          Quản lý thông tin cơ bản của bạn. Email không thể thay đổi.
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="px-0 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label htmlFor="profile-email" className="text-sm font-semibold text-slate-700">Email</label>
              <Input
                id="profile-email"
                type="email"
                value={profile?.email ?? ""}
                disabled
                className="h-10 px-3.5 bg-slate-50 border-slate-200"
              />
              <p className="text-xs text-slate-400">
                Email đăng nhập không thể thay đổi.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="profile-username" className="text-sm font-semibold text-slate-700">Tên đăng nhập</label>
              <Input
                id="profile-username"
                value={profile?.userName ?? ""}
                disabled
                className="h-10 px-3.5 bg-slate-50 border-slate-200"
              />
              <p className="text-xs text-slate-400">
                Tên đăng nhập không thể thay đổi.
              </p>
            </div>
          </div>

          <Separator className="bg-slate-100" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label htmlFor="profile-fullname" className="text-sm font-semibold text-slate-700">
                Họ và tên <span className="text-destructive">*</span>
              </label>
              <Input
                id="profile-fullname"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nhập họ và tên"
                required
                className="h-10 px-3.5 border-slate-200 focus-visible:ring-blue-500 rounded-lg"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="profile-phone" className="text-sm font-semibold text-slate-700">
                Số điện thoại <span className="text-destructive">*</span>
              </label>
              <Input
                id="profile-phone"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Nhập số điện thoại"
                required
                className="h-10 px-3.5 border-slate-200 focus-visible:ring-blue-500 rounded-lg"
              />
              <p className="text-xs text-slate-400">
                Số điện thoại liên hệ trong trường hợp khẩn cấp.
              </p>
            </div>
          </div>
        </CardContent>

        <CardFooter className="px-0 pb-6 md:pb-8 mt-6 border-t border-slate-100 pt-6 flex justify-end gap-3 bg-transparent">
          {isDirty && (
            <Button type="button" variant="ghost" onClick={handleReset} className="h-10 px-5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold transition-colors">
              Hủy thay đổi
            </Button>
          )}
          <Button
            type="submit"
            disabled={!isDirty || updateMutation.isPending}
            className="h-10 px-5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm transition-colors"
          >
            {updateMutation.isPending ? (
              <Loader2Icon className="size-4 mr-2 animate-spin" />
            ) : (
              <SaveIcon className="size-4 mr-2" />
            )}
            Lưu thay đổi
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
