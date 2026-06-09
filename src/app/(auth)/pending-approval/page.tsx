"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, LogOut, RefreshCw, LifeBuoy } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { resolvePostLoginPath } from "@/lib/auth/route-access";
import { useState, useEffect } from "react";
import { useLogout } from "@/lib/api/use-auth";
import { getStoredUser } from "@/lib/api/storage";
import { authApi } from "@/lib/api/services";
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
      
      if (profile && currentSessionRaw) {
        const updatedUser = {
          id: profile.id,
          email: profile.email,
          fullName: profile.fullName || "",
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
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes subtle-float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50%      { transform: translate(20px, -20px) scale(1.03); }
        }
      `}</style>

      <div className="relative min-h-screen flex flex-col items-center justify-center bg-slate-50/50 font-sans text-slate-800 px-4 py-16 overflow-hidden">
        {/* ── Ambient background elements ── */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className="absolute -left-24 -top-24 h-[450px] w-[450px] rounded-full opacity-[0.08]"
            style={{
              background: "radial-gradient(circle, #3b82f6 0%, transparent 70%)",
              filter: "blur(90px)",
              animation: "subtle-float 15s ease-in-out infinite",
            }}
          />
          <div
            className="absolute -right-24 -bottom-24 h-[450px] w-[450px] rounded-full opacity-[0.06]"
            style={{
              background: "radial-gradient(circle, #2563eb 0%, transparent 70%)",
              filter: "blur(90px)",
              animation: "subtle-float 20s ease-in-out infinite reverse",
            }}
          />
          <div
            className="absolute inset-0 opacity-[0.015]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(37,99,235,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(37,99,235,0.1) 1px, transparent 1px)",
              backgroundSize: "48px 48px",
            }}
          />
        </div>

        {/* ── Layout Container ── */}
        <div className="relative z-10 w-full max-w-md animate-[fadeSlideUp_0.4s_ease_out_both] flex flex-col items-center">
          
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 shadow-sm mx-auto">
              <LifeBuoy className="size-6 animate-[spin_25s_linear_infinite]" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Đăng ký tài khoản
            </h1>
            <p className="mt-1 text-xs text-slate-500 font-medium">
              Rescue System - Hệ thống hỗ trợ cứu hộ khẩn cấp
            </p>
          </div>

          <Card className="w-full border border-blue-105 bg-white/90 shadow-[0_12px_40px_rgba(37,99,235,0.06)] backdrop-blur-md rounded-2xl overflow-hidden">
            {/* Top warning strip */}
            <div className="h-1.5 w-full bg-amber-500" />

            <CardHeader className="text-center pt-8 px-6">
              <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 shadow-sm">
                <Clock className="size-7 animate-pulse" />
              </div>
              <CardTitle className="text-xl font-bold text-slate-900">
                Chờ Chỉ Huy Phê Duyệt
              </CardTitle>
              <CardDescription className="text-slate-500 text-xs font-medium mt-1.5">
                Tài khoản của bạn đang được xem xét để tham gia hệ thống.
              </CardDescription>
            </CardHeader>

            <CardContent className="px-6 py-4 text-center space-y-4">
              <div className="rounded-xl border border-blue-100/50 bg-blue-50/10 p-4 text-left space-y-3 shadow-3xs">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Tên tài khoản:</span>
                  <span className="font-bold text-slate-800">{currentUser?.fullName || "N/A"}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Email đăng ký:</span>
                  <span className="font-mono text-blue-600 font-bold">{currentUser?.email || "N/A"}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Vai trò đăng ký:</span>
                  <span className="font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100/50">{getRoleDisplayName(currentUser?.roles)}</span>
                </div>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto font-medium">
                Vì lý do an ninh, vai trò <strong>Điều phối viên</strong> và <strong>Cứu hộ viên</strong> bắt buộc phải được phê duyệt bởi <strong>Chỉ huy (Commander)</strong> của trạm trước khi bắt đầu hoạt động.
              </p>
            </CardContent>

            <CardFooter className="px-6 pb-8 pt-4 flex flex-col gap-3">
              <Button
                disabled={isRefreshing}
                onClick={handleRefreshStatus}
                className="w-full h-10 font-semibold bg-amber-500 hover:bg-amber-600 text-white rounded-xl transition-all duration-200 shadow-md shadow-amber-500/10 active:scale-[0.98] gap-1.5 cursor-pointer"
              >
                <RefreshCw className={cn("size-4", isRefreshing && "animate-spin")} />
                Cập nhật trạng thái
              </Button>

              <div className="flex gap-3 w-full">
                <Button
                  variant="outline"
                  onClick={logout}
                  className="flex-1 h-10 border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold rounded-xl transition-all gap-1.5 active:scale-[0.98] cursor-pointer"
                >
                  <LogOut className="size-4" />
                  Đăng xuất
                </Button>
                
                <Link href="/" className="flex-1">
                  <Button
                    variant="ghost"
                    className="w-full h-10 hover:bg-slate-50 text-slate-500 hover:text-slate-800 font-semibold rounded-xl transition-all active:scale-[0.98] cursor-pointer"
                  >
                    Về trang chủ
                  </Button>
                </Link>
              </div>
            </CardFooter>
          </Card>

          <div className="mt-8 text-center">
            <Link
              href="/"
              className="text-xs text-slate-400 hover:text-slate-600 transition-colors font-medium"
            >
              ← Quay lại trang chủ chính
            </Link>
          </div>

        </div>
      </div>
    </>
  );
}
