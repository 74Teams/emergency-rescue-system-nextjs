import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useUserDetail } from "@/lib/api/features/users/users.queries";
import { Loader2, Mail, MapPin, Phone } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface Props {
  userId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserProfileDialog({ userId, open, onOpenChange }: Props) {
  const { data: profile, isLoading, isError } = useUserDetail(userId || "");

  if (!userId) return null;

  const addressText = profile?.address
    ? [profile.address.street, profile.address.district, profile.address.city]
        .filter(Boolean)
        .join(", ")
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-slate-900">
            Hồ sơ người dùng
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : isError || !profile ? (
          <div className="text-center p-12 text-slate-500">
            Không thể tải thông tin người dùng.
          </div>
        ) : (
          <div className="flex flex-col gap-6 py-2">
            <div className="flex items-center gap-4">
              <Avatar className="w-16 h-16 border-2 border-slate-100 shadow-sm">
                <AvatarImage src={profile.avatarUrl || profile.avatar} />
                <AvatarFallback className="bg-blue-50 text-blue-600 text-xl font-bold">
                  {profile.fullName?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <h3 className="text-lg font-bold text-slate-900">
                  {profile.fullName || "Người dùng ẩn danh"}
                </h3>
                <div className="flex gap-1.5 mt-1.5 flex-wrap">
                  {profile.roles?.map((role) => (
                    <Badge
                      key={role}
                      variant="outline"
                      className="text-[10px] bg-slate-50 text-slate-600 border-slate-200 uppercase tracking-wider"
                    >
                      {role}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <Phone className="w-4 h-4 mt-0.5 text-slate-400 shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-slate-400">
                    Số điện thoại
                  </span>
                  <span className="text-sm font-medium text-slate-700">
                    {profile.phoneNumber || "Chưa cập nhật"}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="w-4 h-4 mt-0.5 text-slate-400 shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-slate-400">
                    Email
                  </span>
                  <span className="text-sm font-medium text-slate-700 break-all">
                    {profile.email || "Chưa cập nhật"}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 mt-0.5 text-slate-400 shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-slate-400">
                    Địa chỉ
                  </span>
                  <span className="text-sm font-medium text-slate-700">
                    {addressText || "Chưa cập nhật"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
