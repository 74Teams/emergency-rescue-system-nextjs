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
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserIcon className="size-5 text-primary" />
          Thông tin cá nhân
        </CardTitle>
        <CardDescription>
          Quản lý thông tin cơ bản của bạn. Email không thể thay đổi.
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="profile-email">Email</FieldLabel>
              <Input
                id="profile-email"
                type="email"
                value={profile?.email ?? ""}
                disabled
              />
              <FieldDescription>
                Email đăng nhập không thể thay đổi.
              </FieldDescription>
            </Field>

            <Field>
              <FieldLabel htmlFor="profile-username">Tên đăng nhập</FieldLabel>
              <Input
                id="profile-username"
                value={profile?.userName ?? ""}
                disabled
              />
              <FieldDescription>
                Tên đăng nhập không thể thay đổi.
              </FieldDescription>
            </Field>

            <Separator />

            <Field>
              <FieldLabel htmlFor="profile-fullname">
                Họ và tên <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                id="profile-fullname"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nhập họ và tên"
                required
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="profile-phone">
                Số điện thoại <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                id="profile-phone"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Nhập số điện thoại"
                required
              />
              <FieldDescription>
                Số điện thoại liên hệ trong trường hợp khẩn cấp.
              </FieldDescription>
            </Field>
          </FieldGroup>
        </CardContent>

        <CardFooter className="flex justify-end gap-2 border-t pt-4">
          {isDirty && (
            <Button type="button" variant="ghost" onClick={handleReset}>
              Hủy thay đổi
            </Button>
          )}
          <Button
            type="submit"
            disabled={!isDirty || updateMutation.isPending}
          >
            {updateMutation.isPending ? (
              <Loader2Icon data-icon="inline-start" className="animate-spin" />
            ) : (
              <SaveIcon data-icon="inline-start" />
            )}
            Lưu thay đổi
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
