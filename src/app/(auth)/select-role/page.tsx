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
      color: "emerald",
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
      color: "amber",
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
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes orb-float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          53%       { transform: translate(30px, -20px) scale(1.05); }
          78%       { transform: translate(-20px, 30px) scale(0.95); }
        }
      `}</style>

      <div className="relative min-h-screen flex flex-col items-center justify-center bg-[#05080f] font-sans text-white px-4 py-16 overflow-hidden">
        {/* ── Ambient background orbs ── */}
        <div className="pointer-events-none fixed inset-0">
          <div
            className="absolute -left-24 -top-24 h-[450px] w-[450px] rounded-full opacity-20"
            style={{
              background: "radial-gradient(circle, #dc2626 0%, transparent 70%)",
              filter: "blur(90px)",
              animation: "orb-float 15s ease-in-out infinite",
            }}
          />
          <div
            className="absolute -right-24 -bottom-24 h-[450px] w-[450px] rounded-full opacity-25"
            style={{
              background: "radial-gradient(circle, #2563eb 0%, transparent 70%)",
              filter: "blur(90px)",
              animation: "orb-float 20s ease-in-out infinite reverse",
            }}
          />
          <div
            className="absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
              backgroundSize: "56px 56px",
            }}
          />
        </div>

        {/* ── Layout Container ── */}
        <div className="relative z-10 w-full max-w-6xl flex flex-col items-center">
          
          {/* Header */}
          <div className="text-center mb-12 animate-[fadeSlideUp_0.5s_ease_both] group cursor-pointer">
            <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/20 ring-4 ring-emerald-500/10 mx-auto">
              <LifeBuoy className="size-6 transition-transform duration-500 group-hover:rotate-90" />
            </div>
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl text-white">
              Lựa chọn vai trò của bạn
            </h1>
            <p className="mt-2 text-base text-white/50 max-w-xl mx-auto">
              {currentUser ? (
                <>
                  Hãy chọn một vai trò phù hợp để hoàn tất đăng ký tài khoản cho <strong className="text-emerald-400 font-semibold">{currentUser.email}</strong>.
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
                    "relative flex flex-col border bg-white/[0.03] transition-all duration-300 rounded-2xl overflow-hidden animate-[fadeSlideUp_0.5s_ease_both]",
                    hasRoleSelected
                      ? cn(
                          "bg-white/[0.05] -translate-y-2 border-white/20",
                          r.color === "blue" && "ring-2 ring-blue-500 shadow-[0_0_30px_rgba(37,99,235,0.25)]",
                          r.color === "emerald" && "ring-2 ring-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.25)]",
                          r.color === "amber" && "ring-2 ring-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.25)]"
                        )
                      : "border-white/[0.08] hover:border-white/20 hover:bg-white/[0.05]"
                  )}
                  style={{ animationDelay: `${0.1 + index * 0.08}s` }}
                >
                  {/* Color strip top */}
                  <div
                    className={cn(
                      "h-1.5 w-full",
                      r.color === "blue" && "bg-blue-500",
                      r.color === "emerald" && "bg-emerald-500",
                      r.color === "amber" && "bg-amber-500"
                    )}
                  />

                  {/* Selected Highlight Badge */}
                  {hasRoleSelected && (
                    <div className="absolute top-4 right-4 flex items-center gap-1 bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-sm">
                      <CheckCircle2 className="size-3" />
                      Đang chọn
                    </div>
                  )}

                  <CardHeader className="space-y-1.5 px-6 pt-6">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "flex size-10 items-center justify-center rounded-xl ring-4",
                          r.color === "blue" && "bg-blue-500/10 text-blue-400 ring-blue-500/5",
                          r.color === "emerald" && "bg-emerald-500/10 text-emerald-400 ring-emerald-500/5",
                          r.color === "amber" && "bg-amber-500/10 text-amber-400 ring-amber-500/5"
                        )}
                      >
                        <Icon className="size-5" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-bold text-white">
                          {r.title}
                        </CardTitle>
                        <CardDescription className="text-white/40 text-xs">
                          {r.subtitle}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="px-6 py-4 flex-1 flex flex-col gap-4">
                    <p className="text-xs text-white/50 leading-relaxed italic">
                      {r.description}
                    </p>

                    <div className="space-y-2 mt-2">
                      <p className="text-xs font-semibold text-white/70 uppercase tracking-wider">
                        Tính năng chính:
                      </p>
                      <ul className="space-y-2">
                        {r.features.map((feature, fIndex) => (
                          <li key={fIndex} className="flex items-start gap-2 text-xs text-white/60 leading-normal">
                            <span
                              className={cn(
                                "size-1.5 rounded-full mt-1.5 shrink-0",
                                r.color === "blue" && "bg-blue-400",
                                r.color === "emerald" && "bg-emerald-400",
                                r.color === "amber" && "bg-amber-400"
                              )}
                            />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>

                  <CardFooter className="px-6 pb-6 pt-4 mt-auto border-t border-white/[0.04] bg-transparent">
                    <Button
                      disabled={selectingRoleId !== null}
                      onClick={() => handleSelectRole(r.id)}
                      className={cn(
                        "w-full h-10 font-bold transition-all duration-200 gap-1.5",
                        "text-white",
                        r.color === "blue" && "bg-blue-600 hover:bg-blue-500 shadow-[0_4px_16px_rgba(37,99,235,0.3)]",
                        r.color === "emerald" && "bg-emerald-600 hover:bg-emerald-500 shadow-[0_4px_16px_rgba(16,185,129,0.3)]",
                        r.color === "amber" && "bg-amber-600 hover:bg-amber-500 shadow-[0_4px_16px_rgba(245,158,11,0.3)]"
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

          <div className="mt-12 text-center animate-[fadeSlideUp_0.5s_ease_both]" style={{ animationDelay: "0.4s" }}>
            <Link
              href="/"
              className="text-sm text-white/30 hover:text-white/60 transition-colors"
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
        <div className="flex min-h-screen items-center justify-center bg-[#05080f] text-slate-400">
          Đang tải...
        </div>
      }
    >
      <SelectRoleContent />
    </Suspense>
  );
}
