"use client";

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
import { getApiErrorMessage } from "@/lib/api/client";
import { authApi } from "@/lib/api/services";
import { cn } from "@/lib/utils";
import { AlertCircle, Eye, EyeOff, Info, Loader2, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
// Select component not needed anymore

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    phoneNumber: "",
    userName: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [passwordMatch, setPasswordMatch] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "confirmPassword" || name === "password") {
      setPasswordMatch(
        name === "confirmPassword"
          ? value === formData.password
          : value === formData.confirmPassword,
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!passwordMatch) {
      toast.error("Mật khẩu không khớp");
      return;
    }

    const phoneDigits = formData.phoneNumber.replace(/\D/g, "");
    if (phoneDigits.length < 9 || phoneDigits.length > 15) {
      toast.error("Số điện thoại không hợp lệ (9–15 chữ số)");
      return;
    }

    if (formData.password.length < 6) {
      toast.error("Mật khẩu phải có tối thiểu 6 ký tự");
      return;
    }

    if (!/(?=.*[A-Za-z])(?=.*\d)/.test(formData.password)) {
      toast.error("Mật khẩu phải có ít nhất 1 chữ cái và 1 số");
      return;
    }

    const userName =
      formData.userName.trim() ||
      formData.email.split("@")[0]?.replace(/\W/g, "") ||
      "user";

    setIsLoading(true);
    try {
      const pendingData = {
        email: formData.email.trim(),
        password: formData.password,
        fullName: formData.fullName.trim(),
        userName,
        phoneNumber: phoneDigits,
      };

      sessionStorage.setItem("pendingRegister", JSON.stringify(pendingData));

      toast.success("Thông tin hợp lệ! Đang chuyển tới trang lựa chọn vai trò...");
      setTimeout(() => {
        window.location.href = "/select-role";
      }, 1000);
    } catch (error) {
      toast.error("Có lỗi xảy ra", {
        description: getApiErrorMessage(error),
      });
    } finally {
      setIsLoading(false);
    }
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
          53%       { transform: translate(30px, -20px) scale(1.05); }
          78%       { transform: translate(-20px, 30px) scale(0.95); }
        }
      `}</style>

      <div className="relative min-h-screen flex items-center justify-center bg-[#05080f] font-sans text-white px-4 py-12 overflow-hidden">
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
        <div className="relative z-10 w-full max-w-[560px] flex flex-col items-center">
          {/* Logo Brand Header */}
          <div className="flex flex-col items-center text-center mb-6 animate-[fadeSlideUp_0.5s_ease_both]">
            <div className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-amber-500 text-white shadow-lg shadow-red-500/20 ring-4 ring-red-500/10">
              <ShieldAlert className="size-6 animate-pulse" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">
              Rescue System
            </h1>
            <p className="mt-1 text-sm text-white/45 max-w-xs">
              Đăng ký tài khoản tham gia mạng lưới cứu hộ khẩn cấp
            </p>
          </div>

          {/* Register Card */}
          <Card
            className={cn(
              "w-full border border-white/[0.08] bg-white/[0.04] shadow-[0_32px_80px_rgba(0,0,0,0.6)] backdrop-blur-xl rounded-2xl overflow-hidden",
              "animate-[fadeSlideUp_0.5s_ease_both]"
            )}
            style={{ animationDelay: "0.12s" }}
          >
            <div className="h-[3px] w-full bg-gradient-to-r from-emerald-500 to-teal-500" />

            <CardHeader className="space-y-1 px-6 pt-5">
              <CardTitle className="text-xl font-bold text-white text-center">
                Tạo tài khoản
              </CardTitle>
              <CardDescription className="text-white/45 text-sm text-center">
                Điền đầy đủ thông tin bên dưới để bắt đầu đăng ký
              </CardDescription>
            </CardHeader>

            <CardContent className="px-6 pb-2">
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {/* Họ và tên (Full Width) */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="fullName" className="text-xs font-semibold text-white/60 uppercase tracking-wider">
                    Họ và tên *
                  </label>
                  <Input
                    id="fullName"
                    name="fullName"
                    placeholder="Nguyễn Văn A"
                    value={formData.fullName}
                    onChange={handleChange}
                    className="h-10 px-3.5 bg-white/[0.05] border-white/10 text-white placeholder:text-white/20 focus-visible:border-emerald-500/50 focus-visible:ring-emerald-500/20 transition-all rounded-lg"
                    required
                  />
                </div>

                {/* Email & Số điện thoại */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="email" className="text-xs font-semibold text-white/60 uppercase tracking-wider">
                      Email *
                    </label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="email@rescue.vn"
                      value={formData.email}
                      onChange={handleChange}
                      className="h-10 px-3.5 bg-white/[0.05] border-white/10 text-white placeholder:text-white/20 focus-visible:border-emerald-500/50 focus-visible:ring-emerald-500/20 transition-all rounded-lg"
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="phoneNumber" className="text-xs font-semibold text-white/60 uppercase tracking-wider">
                      Số điện thoại *
                    </label>
                    <Input
                      id="phoneNumber"
                      name="phoneNumber"
                      placeholder="0912345678"
                      value={formData.phoneNumber}
                      onChange={handleChange}
                      className="h-10 px-3.5 bg-white/[0.05] border-white/10 text-white placeholder:text-white/20 focus-visible:border-emerald-500/50 focus-visible:ring-emerald-500/20 transition-all rounded-lg"
                      required
                    />
                  </div>
                </div>

                {/* Mật khẩu & Xác nhận mật khẩu */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="password" className="text-xs font-semibold text-white/60 uppercase tracking-wider">
                      Mật khẩu *
                    </label>
                    <div className="relative">
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={handleChange}
                        className="h-10 pr-10 bg-white/[0.05] border-white/10 text-white placeholder:text-white/20 focus-visible:border-emerald-500/50 focus-visible:ring-emerald-500/20 transition-all rounded-lg"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/75 transition-colors"
                      >
                        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="confirmPassword" className="text-xs font-semibold text-white/60 uppercase tracking-wider">
                      Xác nhận mật khẩu *
                    </label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className={cn(
                          "h-10 pr-10 bg-white/[0.05] border-white/10 text-white placeholder:text-white/20 focus-visible:ring-emerald-500/20 transition-all rounded-lg",
                          !passwordMatch && formData.confirmPassword
                            ? "border-red-500/50 focus-visible:border-red-500/50"
                            : "focus-visible:border-emerald-500/50"
                        )}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/75 transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Tên đăng nhập (tùy chọn) */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="userName" className="text-xs font-semibold text-white/60 uppercase tracking-wider">
                    Tên đăng nhập (tùy chọn)
                  </label>
                  <Input
                    id="userName"
                    name="userName"
                    placeholder="Mặc định lấy từ email nếu để trống"
                    value={formData.userName}
                    onChange={handleChange}
                    className="h-10 px-3.5 bg-white/[0.05] border-white/10 text-white placeholder:text-white/20 focus-visible:border-emerald-500/50 focus-visible:ring-emerald-500/20 transition-all rounded-lg"
                  />
                </div>

                {/* Password match alert info */}
                {!passwordMatch && formData.confirmPassword && (
                  <p className="text-xs text-red-400 -mt-1 font-semibold flex items-center gap-1">
                    <AlertCircle className="size-3.5" /> Mật khẩu không khớp
                  </p>
                )}

                {/* Submit */}
                <Button
                  type="submit"
                  disabled={isLoading || !passwordMatch}
                  className="mt-2 h-10 w-full font-bold bg-gradient-to-r from-emerald-600 to-emerald-750 hover:from-emerald-500 hover:to-emerald-600 text-white rounded-lg transition-all duration-200 shadow-[0_4px_24px_rgba(16,185,129,0.25)] hover:shadow-[0_4px_32px_rgba(16,185,129,0.45)] active:scale-[0.98]"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="animate-spin size-4" />
                      Đang tạo tài khoản…
                    </div>
                  ) : (
                    "Tạo tài khoản"
                  )}
                </Button>

                {/* Info guide box */}
                <div className="flex items-start gap-2.5 rounded-lg border border-blue-500/20 bg-blue-500/10 p-3 text-xs text-blue-300 leading-normal mt-1 animate-[fadeSlideUp_0.3s_ease_both]">
                  <Info className="size-4 shrink-0 mt-0.5 text-blue-400" />
                  <span>
                    Mật khẩu tối thiểu 6 ký tự, có ít nhất 1 chữ và 1 số. Bạn sẽ chọn vai trò tài khoản ở bước tiếp theo.
                  </span>
                </div>
              </form>
            </CardContent>

            <div className="mx-6 my-4 h-px bg-white/[0.06]" />

            <CardFooter className="flex flex-col items-center gap-3 px-6 pb-6 bg-transparent">
              <p className="text-xs text-white/40">
                Đã có tài khoản?{" "}
                <Link
                  href="/login"
                  className="font-semibold text-emerald-455 transition-colors hover:text-emerald-300"
                >
                  Đăng nhập tại đây
                </Link>
              </p>
              <Link
                href="/"
                className="text-xs text-white/25 transition-colors hover:text-white/50"
              >
                ← Quay về trang chính
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    </>
  );
}
