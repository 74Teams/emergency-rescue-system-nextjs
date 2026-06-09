"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LifeBuoy, User, Radio, Flame, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Suspense, useState, useEffect } from "react";
import { toast } from "sonner";
import { authApi } from "@/lib/api/services";
import { getApiErrorMessage } from "@/lib/api/client";
import { getStoredUser, setStoredAuthSession } from "@/lib/api/storage";
import { normalizeAuthTokenPayload } from "@/lib/auth/normalize-auth";

function SelectRoleContent() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [selectingRoleId, setSelectingRoleId] = useState<string | null>(null);

  useEffect(() => {
    setCurrentUser(getStoredUser());
  }, []);

  const handleSelectRole = async (roleId: string) => {
    setSelectingRoleId(roleId);
    try {
      const response = await authApi.selectRole({ role: roleId });
      const session = normalizeAuthTokenPayload(response.data);
      setStoredAuthSession(session);

      toast.success("Lựa chọn vai trò thành công!");

      setTimeout(() => {
        if (session.user.isPendingApproval) {
          router.push("/pending-approval");
        } else {
          router.push("/map");
        }
      }, 1000);
    } catch (error) {
      toast.error("Lựa chọn vai trò thất bại", {
        description: getApiErrorMessage(error),
      });
    } finally {
      setSelectingRoleId(null);
    }
  };

  const roles = [
    {
      id: "Citizen",
      title: "Công dân / Citizen",
      subtitle: "Báo cáo sự cố & Yêu cầu cứu hộ",
      icon: User,
      color: "blue",
      badge: "Phổ biến",
      features: [
        "Báo cáo sự cố khẩn cấp (cháy nổ, y tế, bão lũ...)",
        "Gửi tọa độ định vị GPS chính xác của bạn",
        "Theo dõi vị trí đội cứu hộ thời gian thực trên bản đồ",
        "Quản lý danh bạ liên hệ khẩn cấp cá nhân",
      ],
      description: "Thích hợp cho người dân cần gửi yêu cầu cứu trợ khẩn cấp tới cơ quan chức năng khi gặp hiểm họa.",
      dashboardPath: "/map",
    },
    {
      id: "Rescuer",
      title: "Cứu hộ viên / Rescuer",
      subtitle: "Lực lượng phản ứng nhanh",
      icon: Flame,
      color: "blue-dark",
      badge: "Hiện trường",
      features: [
        "Nhận thông tin cứu trợ trực tiếp từ trung tâm điều phối",
        "Định vị chỉ đường GPS tới vị trí nạn nhân khẩn cấp",
        "Cập nhật trạng thái đội cứu hộ và tiến độ nhiệm vụ",
        "Quản lý danh sách công việc cần làm tại hiện trường",
      ],
      description: "Dành cho thành viên đội cứu hộ, những người trực tiếp di chuyển tới hiện trường để ứng cứu sự cố. (Cần được phê duyệt)",
      dashboardPath: "/dashboard/rescuer",
    },
    {
      id: "Dispatcher",
      title: "Điều phối viên / Dispatcher",
      subtitle: "Trung tâm quản lý & Giám sát",
      icon: Radio,
      color: "blue-deep",
      badge: "Văn phòng",
      features: [
        "Tiếp nhận và phê duyệt yêu cầu khẩn cấp từ người dân",
        "Tìm kiếm và điều động các đội cứu nạn phù hợp nhất",
        "Giám sát bản đồ định vị các lực lượng thời gian thực",
        "Phân tích dữ liệu báo cáo thống kê tình huống cứu trợ",
      ],
      description: "Dành cho nhân viên điều hành tại trung tâm chỉ huy điều phối các lực lượng cứu nạn cứu hộ. (Cần được phê duyệt)",
      dashboardPath: "/dashboard/dispatcher",
    },
  ];

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
        <div className="relative z-10 w-full max-w-5xl flex flex-col items-center">
          
          {/* Header */}
          <div className="text-center mb-12 animate-[fadeSlideUp_0.4s_ease_out_both]">
            <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 shadow-sm mx-auto">
              <LifeBuoy className="size-6 animate-[spin_25s_linear_infinite]" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Lựa chọn vai trò của bạn
            </h1>
            <p className="mt-2 text-sm text-slate-500 max-w-xl mx-auto font-medium">
              {currentUser ? (
                <>
                  Hãy chọn một vai trò phù hợp để hoàn tất đăng ký tài khoản cho <strong className="text-blue-600 font-semibold">{currentUser.email}</strong>.
                </>
              ) : (
                "Vui lòng lựa chọn vai trò để tiếp tục truy cập vào hệ thống."
              )}
            </p>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full items-stretch">
            {roles.map((r, index) => {
              const Icon = r.icon;
              const hasRoleSelected = currentUser?.roles?.some((role: string) => role.toLowerCase() === r.id.toLowerCase());

              return (
                <Card
                  key={r.id}
                  className={cn(
                    "relative flex flex-col border bg-white/90 transition-all duration-300 rounded-2xl overflow-hidden animate-[fadeSlideUp_0.4s_ease_out_both]",
                    hasRoleSelected
                      ? "bg-white border-blue-200 ring-2 ring-blue-500 shadow-[0_12px_30px_rgba(37,99,235,0.08)] -translate-y-1.5"
                      : "border-slate-100 hover:border-blue-200 hover:bg-white hover:-translate-y-1 hover:shadow-[0_8px_25px_rgba(37,99,235,0.04)]"
                  )}
                  style={{ animationDelay: `${0.08 * (index + 1)}s` }}
                >
                  {/* Top color strip */}
                  <div
                    className={cn(
                      "h-1.5 w-full",
                      r.id === "Citizen" && "bg-blue-400",
                      r.id === "Rescuer" && "bg-blue-600",
                      r.id === "Dispatcher" && "bg-blue-800"
                    )}
                  />

                  {/* Selected Badge */}
                  {hasRoleSelected && (
                    <div className="absolute top-4 right-4 flex items-center gap-1 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-sm">
                      <CheckCircle2 className="size-3" />
                      Đang chọn
                    </div>
                  )}

                  <CardHeader className="space-y-1.5 px-6 pt-6">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "flex size-10 items-center justify-center rounded-xl border",
                          r.id === "Citizen" && "bg-blue-50/50 text-blue-500 border-blue-100/50",
                          r.id === "Rescuer" && "bg-blue-50/80 text-blue-600 border-blue-100",
                          r.id === "Dispatcher" && "bg-blue-50 text-blue-700 border-blue-200/55"
                        )}
                      >
                        <Icon className="size-5" />
                      </div>
                      <div>
                        <CardTitle className="text-base font-bold text-slate-900">
                          {r.title}
                        </CardTitle>
                        <CardDescription className="text-slate-400 text-xs font-medium">
                          {r.subtitle}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="px-6 py-4 flex-1 flex flex-col gap-4">
                    <p className="text-xs text-slate-500 leading-relaxed italic">
                      {r.description}
                    </p>

                    <div className="space-y-2.5 mt-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Tính năng chính:
                      </p>
                      <ul className="space-y-2">
                        {r.features.map((feature, fIndex) => (
                          <li key={fIndex} className="flex items-start gap-2 text-xs text-slate-600 leading-normal font-medium">
                            <span
                              className={cn(
                                "size-1.5 rounded-full mt-1.5 shrink-0",
                                r.id === "Citizen" && "bg-blue-400",
                                r.id === "Rescuer" && "bg-blue-600",
                                r.id === "Dispatcher" && "bg-blue-800"
                              )}
                            />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>

                  <CardFooter className="px-6 pb-6 pt-4 mt-auto border-t border-slate-50 bg-transparent">
                    <Button
                      disabled={selectingRoleId !== null}
                      onClick={() => handleSelectRole(r.id)}
                      className={cn(
                        "w-full h-10 font-semibold text-sm transition-all duration-200 gap-1.5 text-white cursor-pointer",
                        r.id === "Citizen" && "bg-blue-500 hover:bg-blue-600 shadow-sm shadow-blue-500/10",
                        r.id === "Rescuer" && "bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-600/10",
                        r.id === "Dispatcher" && "bg-blue-700 hover:bg-blue-800 shadow-sm shadow-blue-700/10"
                      )}
                    >
                      {selectingRoleId === r.id ? (
                        <>
                          <Loader2 className="animate-spin size-4" />
                          Đang thiết lập…
                        </>
                      ) : (
                        <>
                          Lựa chọn vai trò này
                          <ArrowRight className="size-4" />
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>

          <div className="mt-12 text-center animate-[fadeSlideUp_0.4s_ease_out_both]" style={{ animationDelay: "0.35s" }}>
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

export default function SelectRolePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-500 font-medium">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600 mr-2" />
          Đang tải...
        </div>
      }
    >
      <SelectRoleContent />
    </Suspense>
  );
}
