"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  KeyIcon,
  Loader2Icon,
  SendIcon,
  InfoIcon,
  BellIcon,
  EyeIcon,
} from "lucide-react";
import type { ProfileResponse } from "@/lib/api/types";
import { useForgotPassword } from "@/hooks/use-profile-page";

interface SecuritySettingsProps {
  profile: ProfileResponse | undefined;
  isLoading: boolean;
}

export function SecuritySettings({
  profile,
  isLoading,
}: SecuritySettingsProps) {
  const forgotPasswordMutation = useForgotPassword();
  const [passwordSent, setPasswordSent] = useState(false);

  function handleResetPassword() {
    if (!profile?.email) return;
    forgotPasswordMutation.mutate(profile.email, {
      onSuccess: () => setPasswordSent(true),
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Password Section */}
      <Card className="border border-slate-200 shadow-sm bg-white rounded-2xl p-6 md:p-8 ring-0">
        <CardHeader className="p-0 mb-6 flex flex-col gap-1.5">
          <CardTitle className="flex items-center gap-2 text-xl font-bold text-slate-800">
            <KeyIcon className="size-5 text-blue-600" />
            Đổi mật khẩu
          </CardTitle>
          <CardDescription className="text-sm text-slate-500">
            Gửi link đổi mật khẩu đến email đăng ký của bạn.
          </CardDescription>
        </CardHeader>

        <CardContent className="px-0">
          {passwordSent ? (
            <Alert className="bg-blue-50 border-blue-100 text-blue-900 rounded-xl">
              <InfoIcon className="size-4 text-blue-600" />
              <AlertTitle className="font-bold">Email đã được gửi!</AlertTitle>
              <AlertDescription className="text-sm mt-1">
                Vui lòng kiểm tra hộp thư <strong>{profile?.email}</strong> để
                đặt lại mật khẩu. Nếu không nhận được, hãy kiểm tra thư mục
                spam.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-slate-600">
                Vì lý do bảo mật, bạn cần đổi mật khẩu thông qua email.
                Chúng tôi sẽ gửi link đặt lại mật khẩu tới{" "}
                <strong>{profile?.email ?? "email của bạn"}</strong>.
              </p>
            </div>
          )}
        </CardContent>

        {!passwordSent && (
          <CardFooter className="px-0 pb-6 md:pb-8 mt-6 border-t border-slate-100 pt-6 flex justify-end bg-transparent">
            <Button
              onClick={handleResetPassword}
              disabled={forgotPasswordMutation.isPending || !profile?.email}
              variant="outline"
              className="h-10 px-5 border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-lg transition-colors"
            >
              {forgotPasswordMutation.isPending ? (
                <Loader2Icon className="size-4 mr-2 animate-spin" />
              ) : (
                <SendIcon className="size-4 mr-2" />
              )}
              Gửi link đổi mật khẩu
            </Button>
          </CardFooter>
        )}
      </Card>

      {/* Notification Preferences */}
      <Card className="border border-slate-200 shadow-sm bg-white rounded-2xl p-6 md:p-8 ring-0">
        <CardHeader className="p-0 mb-6 flex flex-col gap-1.5">
          <CardTitle className="flex items-center gap-2 text-xl font-bold text-slate-800">
            <BellIcon className="size-5 text-blue-600" />
            Thông báo
          </CardTitle>
          <CardDescription className="text-sm text-slate-500">
            Quản lý cài đặt thông báo của bạn.
          </CardDescription>
        </CardHeader>

        <CardContent className="px-0 space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-slate-100">
            <div className="space-y-1 pr-4">
              <label htmlFor="notif-emergency" className="text-sm font-semibold text-slate-800 cursor-pointer">
                Thông báo khẩn cấp
              </label>
              <p className="text-xs text-slate-400">
                Nhận thông báo khi có tình huống khẩn cấp trong khu vực.
              </p>
            </div>
            <Switch id="notif-emergency" defaultChecked />
          </div>

          <div className="flex items-center justify-between py-3 border-b border-slate-100">
            <div className="space-y-1 pr-4">
              <label htmlFor="notif-mission" className="text-sm font-semibold text-slate-800 cursor-pointer">
                Cập nhật nhiệm vụ
              </label>
              <p className="text-xs text-slate-400">
                Nhận thông báo khi nhiệm vụ được cập nhật trạng thái.
              </p>
            </div>
            <Switch id="notif-mission" defaultChecked />
          </div>

          <div className="flex items-center justify-between py-3">
            <div className="space-y-1 pr-4">
              <label htmlFor="notif-email" className="text-sm font-semibold text-slate-800 cursor-pointer">
                Thông báo qua email
              </label>
              <p className="text-xs text-slate-400">
                Nhận bản sao thông báo qua email.
              </p>
            </div>
            <Switch id="notif-email" />
          </div>
        </CardContent>
      </Card>

      {/* Privacy Section */}
      <Card className="border border-slate-200 shadow-sm bg-white rounded-2xl p-6 md:p-8 ring-0">
        <CardHeader className="p-0 mb-6 flex flex-col gap-1.5">
          <CardTitle className="flex items-center gap-2 text-xl font-bold text-slate-800">
            <EyeIcon className="size-5 text-blue-600" />
            Quyền riêng tư
          </CardTitle>
          <CardDescription className="text-sm text-slate-500">
            Kiểm soát mức độ hiển thị thông tin cá nhân.
          </CardDescription>
        </CardHeader>

        <CardContent className="px-0 space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-slate-100">
            <div className="space-y-1 pr-4">
              <label htmlFor="privacy-phone" className="text-sm font-semibold text-slate-800 cursor-pointer">
                Hiển thị số điện thoại
              </label>
              <p className="text-xs text-slate-400">
                Cho phép thành viên đội cứu hộ xem số điện thoại của bạn.
              </p>
            </div>
            <Switch id="privacy-phone" defaultChecked />
          </div>

          <div className="flex items-center justify-between py-3">
            <div className="space-y-1 pr-4">
              <label htmlFor="privacy-address" className="text-sm font-semibold text-slate-800 cursor-pointer">
                Hiển thị địa chỉ
              </label>
              <p className="text-xs text-slate-400">
                Chia sẻ địa chỉ với hệ thống điều phối khi có yêu cầu cứu hộ.
              </p>
            </div>
            <Switch id="privacy-address" defaultChecked />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
