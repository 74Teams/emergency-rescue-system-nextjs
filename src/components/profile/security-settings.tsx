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
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyIcon className="size-5 text-primary" />
            Đổi mật khẩu
          </CardTitle>
          <CardDescription>
            Gửi link đổi mật khẩu đến email đăng ký của bạn.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {passwordSent ? (
            <Alert>
              <InfoIcon />
              <AlertTitle>Email đã được gửi!</AlertTitle>
              <AlertDescription>
                Vui lòng kiểm tra hộp thư <strong>{profile?.email}</strong> để
                đặt lại mật khẩu. Nếu không nhận được, hãy kiểm tra thư mục
                spam.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-muted-foreground">
                Vì lý do bảo mật, bạn cần đổi mật khẩu thông qua email.
                Chúng tôi sẽ gửi link đặt lại mật khẩu tới{" "}
                <strong>{profile?.email ?? "email của bạn"}</strong>.
              </p>
            </div>
          )}
        </CardContent>

        {!passwordSent && (
          <CardFooter className="border-t pt-4">
            <Button
              onClick={handleResetPassword}
              disabled={forgotPasswordMutation.isPending || !profile?.email}
              variant="outline"
            >
              {forgotPasswordMutation.isPending ? (
                <Loader2Icon
                  data-icon="inline-start"
                  className="animate-spin"
                />
              ) : (
                <SendIcon data-icon="inline-start" />
              )}
              Gửi link đổi mật khẩu
            </Button>
          </CardFooter>
        )}
      </Card>

      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellIcon className="size-5 text-primary" />
            Thông báo
          </CardTitle>
          <CardDescription>
            Quản lý cài đặt thông báo của bạn.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <FieldGroup>
            <Field orientation="horizontal">
              <FieldContent>
                <FieldLabel htmlFor="notif-emergency">
                  Thông báo khẩn cấp
                </FieldLabel>
                <FieldDescription>
                  Nhận thông báo khi có tình huống khẩn cấp trong khu vực.
                </FieldDescription>
              </FieldContent>
              <Switch id="notif-emergency" defaultChecked />
            </Field>

            <Separator />

            <Field orientation="horizontal">
              <FieldContent>
                <FieldLabel htmlFor="notif-mission">
                  Cập nhật nhiệm vụ
                </FieldLabel>
                <FieldDescription>
                  Nhận thông báo khi nhiệm vụ được cập nhật trạng thái.
                </FieldDescription>
              </FieldContent>
              <Switch id="notif-mission" defaultChecked />
            </Field>

            <Separator />

            <Field orientation="horizontal">
              <FieldContent>
                <FieldLabel htmlFor="notif-email">
                  Thông báo qua email
                </FieldLabel>
                <FieldDescription>
                  Nhận bản sao thông báo qua email.
                </FieldDescription>
              </FieldContent>
              <Switch id="notif-email" />
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      {/* Privacy Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <EyeIcon className="size-5 text-primary" />
            Quyền riêng tư
          </CardTitle>
          <CardDescription>
            Kiểm soát mức độ hiển thị thông tin cá nhân.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <FieldGroup>
            <Field orientation="horizontal">
              <FieldContent>
                <FieldLabel htmlFor="privacy-phone">
                  Hiển thị số điện thoại
                </FieldLabel>
                <FieldDescription>
                  Cho phép thành viên đội cứu hộ xem số điện thoại của bạn.
                </FieldDescription>
              </FieldContent>
              <Switch id="privacy-phone" defaultChecked />
            </Field>

            <Separator />

            <Field orientation="horizontal">
              <FieldContent>
                <FieldLabel htmlFor="privacy-address">
                  Hiển thị địa chỉ
                </FieldLabel>
                <FieldDescription>
                  Chia sẻ địa chỉ với hệ thống điều phối khi có yêu cầu cứu hộ.
                </FieldDescription>
              </FieldContent>
              <Switch id="privacy-address" defaultChecked />
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>
    </div>
  );
}
