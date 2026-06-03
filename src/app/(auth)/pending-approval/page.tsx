"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldAlert, Clock, LogOut, RefreshCw } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { resolvePostLoginPath } from "@/lib/auth/route-access";
import { useState, useEffect } from "react";
import { useLogout } from "@/lib/api/use-auth";
import { getStoredUser } from "@/lib/api/storage";
import { authApi } from "@/lib/api/services";
import { normalizeAuthTokenPayload } from "@/lib/auth/normalize-auth";
import { setStoredAuthSession } from "@/lib/api/storage";
import { toast } from "sonner";

export default function PendingApprovalPage() {
  const router = useRouter();
  const logout = useLogout();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    setCurrentUser(getStoredUser());
  }, []);

  const handleRefreshStatus = async () => {
    setIsRefreshing(true);
    try {
      // Fetch latest profile state from API
      const response = await authApi.profile();
      const profile = response.data;

      // Update local storage user details if approval status changed
      const currentSessionRaw = localStorage.getItem("rescue_system.access_token");
      const currentRefreshToken = localStorage.getItem("rescue_system.refresh_token");
      
      if (profile && currentSessionRaw) {
        const updatedUser = {
          id: profile.id,
          email: profile.email,
          fullName: profile.fullName || profile.fullName || "",
          phoneNumber: profile.phoneNumber,
          avatarUrl: profile.avatarUrl || profile.avatar,
          roles: profile.roles,
          isActive: profile.isActive ?? true,
          isPendingApproval: profile.isPendingApproval ?? false,
        };

        // Save updated user data
        localStorage.setItem("rescue_system.user", JSON.stringify(updatedUser));
        setCurrentUser(updatedUser);

        if (!updatedUser.isPendingApproval && updatedUser.isActive) {
          toast.success("Tài khoản đã được phê duyệt thành công!");
          const targetPath = resolvePostLoginPath(profile.roles);
          setTimeout(() => {
            router.push(targetPath);
          }, 1000);
          return;
        }
      }
      toast.info("Tài khoản vẫn đang trong trạng thái chờ duyệt.");
    } catch (error) {
      console.error("Error checking approval status:", error);
      toast.error("Không thể kiểm tra trạng thái phê duyệt lúc này.");
    } finally {
      setIsRefreshing(false);
    }
  };

  const getRoleDisplayName = (roles: string[]) => {
    if (!roles || roles.length === 0) return "Chưa xác định";
    const role = roles[0];
    if (role === "Dispatcher") return "Điều phối viên (Dispatcher)";
    if (role === "Rescuer") return "Cứu hộ viên (Rescuer)";
    return role;
  };

  return (
    <>
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes orb-float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50%       { transform: translate(25px, -15px) scale(1.05); }
          100%       { transform: translate(0, 0) scale(1); }
        }
      `}</style>

      <div className="relative min-h-screen flex items-center justify-center bg-[#05080f] font-sans text-white px-4 overflow-hidden">
        {/* Ambient background orbs */}
        <div className="pointer-events-none fixed inset-0">
          <div
            className="absolute -left-24 -top-24 h-[400px] w-[400px] rounded-full opacity-15"
            style={{
              background: "radial-gradient(circle, #f59e0b 0%, transparent 70%)",
              filter: "blur(90px)",
              animation: "orb-float 16s ease-in-out infinite",
            }}
          />
          <div
            className="absolute -right-24 -bottom-24 h-[400px] w-[400px] rounded-full opacity-15"
            style={{
              background: "radial-gradient(circle, #dc2626 0%, transparent 70%)",
              filter: "blur(90px)",
              animation: "orb-float 20s ease-in-out infinite reverse",
            }}
          />
        </div>

        {/* Card Container */}
        <div className="relative z-10 w-full max-w-md animate-[fadeSlideUp_0.5s_ease_both]">
          <Card className="border border-white/[0.08] bg-white/[0.03] shadow-[0_32px_80px_rgba(0,0,0,0.6)] backdrop-blur-xl rounded-2xl overflow-hidden">
            {/* Top warning strip */}
            <div className="h-1.5 w-full bg-amber-500" />

            <CardHeader className="text-center pt-8">
              <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 ring-4 ring-amber-500/5">
                <Clock className="size-8 animate-pulse" />
              </div>
              <CardTitle className="text-2xl font-black text-white">
                Chờ Commander Phê Duyệt
              </CardTitle>
              <CardDescription className="text-white/40 text-sm mt-1">
                Tài khoản của bạn đang được xem xét để tham gia hệ thống.
              </CardDescription>
            </CardHeader>

            <CardContent className="px-6 py-4 text-center space-y-4">
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.01] p-4 text-left space-y-2.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-white/40 uppercase tracking-wider">Tên tài khoản:</span>
                  <span className="font-semibold text-white/90">{currentUser?.fullName || "N/A"}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-white/40 uppercase tracking-wider">Email đăng ký:</span>
                  <span className="font-mono text-emerald-400 font-semibold">{currentUser?.email || "N/A"}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-white/40 uppercase tracking-wider">Vai trò đăng ký:</span>
                  <span className="font-semibold text-amber-400">{getRoleDisplayName(currentUser?.roles)}</span>
                </div>
              </div>

              <p className="text-xs text-white/50 leading-relaxed max-w-sm mx-auto">
                Vì lý do an ninh, vai trò Điều phối viên và Cứu hộ viên bắt buộc phải được xác thực bởi <strong>Chỉ huy (Commander)</strong> của trạm trước khi bắt đầu hoạt động.
              </p>
            </CardContent>

            <CardFooter className="px-6 pb-8 pt-4 flex flex-col gap-3">
              <Button
                disabled={isRefreshing}
                onClick={handleRefreshStatus}
                className="w-full h-11 font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl transition-all duration-200 shadow-[0_4px_20px_rgba(245,158,11,0.2)] hover:shadow-[0_4px_30px_rgba(245,158,11,0.35)] gap-2"
              >
                <RefreshCw className={cn("size-4", isRefreshing && "animate-spin")} />
                Cập nhật trạng thái
              </Button>

              <div className="flex gap-3 w-full">
                <Button
                  variant="outline"
                  onClick={logout}
                  className="flex-1 h-10 border-white/10 bg-white/5 hover:bg-white/10 text-white font-semibold rounded-xl transition-all gap-1.5"
                >
                  <LogOut className="size-4" />
                  Đăng xuất
                </Button>
                
                <Link href="/" className="flex-1">
                  <Button
                    variant="ghost"
                    className="w-full h-10 hover:bg-white/5 text-white/60 hover:text-white font-semibold rounded-xl transition-all"
                  >
                    Về trang chủ
                  </Button>
                </Link>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </>
  );
}
