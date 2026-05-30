"use client";

import { Badge } from "@/components/ui/badge";
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
import { getApiErrorMessage } from "@/lib/api/client";
import { authApi } from "@/lib/api/services";
import { AlertCircle, Check } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    phoneNumber: "",
    userName: "",
    role: "Citizen",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [passwordMatch, setPasswordMatch] = useState(true);

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
      await authApi.register({
        email: formData.email.trim(),
        password: formData.password,
        fullName: formData.fullName.trim(),
        userName,
        phoneNumber: phoneDigits,
        address: "",
        dateOfBirth: new Date(2000, 0, 1).toISOString(),
        avatar: "",
        role: formData.role,
      });

      toast.success("Đăng ký thành công! Hãy đăng nhập để tiếp tục.");
      setTimeout(() => {
        window.location.href = "/login";
      }, 1500);
    } catch (error) {
      toast.error("Đăng ký thất bại", {
        description: getApiErrorMessage(error),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 text-slate-100">
      {/* Background accents */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -left-32 top-20 h-80 w-80 rounded-full bg-emerald-500/15 blur-3xl" />
        <div className="absolute -right-32 bottom-20 h-80 w-80 rounded-full bg-blue-500/15 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/10 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full grid gap-8 lg:grid-cols-[1.2fr_1fr]">
          {/* Left Section */}
          <div className="flex flex-col justify-center gap-8">
            <div className="space-y-1">
              <Badge className="w-fit bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/20 border-emerald-500/30">
                TẠO TÀI KHOẢN MỚI
              </Badge>
              <p className="text-xs uppercase tracking-widest text-slate-400 mt-4">
                Tham gia mạng lưới cứu hộ
              </p>
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl font-bold leading-tight">
                Trở thành phần đội{" "}
                <span className="text-emerald-400">cứu hộ</span>
              </h1>
              <p className="text-lg text-slate-300 leading-relaxed max-w-md">
                Đăng ký tài khoản và gia nhập mạng lưới có động lực cứu hộ tại
                văn phòng của bạn. Hỗ trợ các yêu cầu khẩn cấp nhất thắng.
              </p>
            </div>

            {/* Role Guide */}
            <div className="space-y-3">
              <p className="text-sm font-semibold text-slate-300">
                Các vai trò khả dụng:
              </p>
              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-slate-200">Rescuer</p>
                    <p className="text-sm text-slate-400">
                      Thành viên đội cứu hộ
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-slate-200">Dispatcher</p>
                    <p className="text-sm text-slate-400">
                      Điều phối yêu cầu cứu hộ
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-slate-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-slate-200">User</p>
                    <p className="text-sm text-slate-400">
                      Yêu cầu cứu hộ khi cần thiết
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Register Form Card */}
          <div className="flex items-center justify-center">
            <Card className="w-full max-w-md border-slate-700/50 bg-slate-900/40 shadow-2xl shadow-black/50 backdrop-blur-sm">
              <CardHeader className="space-y-3">
                <CardTitle className="text-2xl">Tạo tài khoản</CardTitle>
                <CardDescription>
                  Điền đầy đủ thông tin để tham gia hệ thống
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label
                      htmlFor="fullName"
                      className="text-sm font-medium text-slate-200"
                    >
                      Họ và tên *
                    </label>
                    <Input
                      id="fullName"
                      name="fullName"
                      placeholder="Nguyễn Văn A"
                      value={formData.fullName}
                      onChange={handleChange}
                      className="bg-slate-800/50 border-slate-700/50 focus:border-emerald-500/50 focus:ring-emerald-500/20"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="email"
                      className="text-sm font-medium text-slate-200"
                    >
                      Email *
                    </label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="email@rescue.vn"
                      value={formData.email}
                      onChange={handleChange}
                      className="bg-slate-800/50 border-slate-700/50 focus:border-emerald-500/50 focus:ring-emerald-500/20"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="phoneNumber"
                      className="text-sm font-medium text-slate-200"
                    >
                      Số điện thoại *
                    </label>
                    <Input
                      id="phoneNumber"
                      name="phoneNumber"
                      placeholder="0912345678"
                      value={formData.phoneNumber}
                      onChange={handleChange}
                      className="bg-slate-800/50 border-slate-700/50 focus:border-emerald-500/50 focus:ring-emerald-500/20"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="password"
                      className="text-sm font-medium text-slate-200"
                    >
                      Mật khẩu *
                    </label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleChange}
                      className="bg-slate-800/50 border-slate-700/50 focus:border-emerald-500/50 focus:ring-emerald-500/20"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="confirmPassword"
                      className="text-sm font-medium text-slate-200"
                    >
                      Xác nhận mật khẩu *
                    </label>
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className={`bg-slate-800/50 border-slate-700/50 focus:ring-emerald-500/20 transition ${
                        !passwordMatch && formData.confirmPassword
                          ? "border-red-500/50 focus:border-red-500/50"
                          : "focus:border-emerald-500/50"
                      }`}
                      required
                    />
                    {!passwordMatch && formData.confirmPassword && (
                      <p className="text-xs text-red-400">
                        Mật khẩu không khớp
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="userName"
                      className="text-sm font-medium text-slate-200"
                    >
                      Tên đăng nhập (tùy chọn)
                    </label>
                    <Input
                      id="userName"
                      name="userName"
                      placeholder="Tự lấy từ email nếu để trống"
                      value={formData.userName}
                      onChange={handleChange}
                      className="bg-slate-800/50 border-slate-700/50 focus:border-emerald-500/50 focus:ring-emerald-500/20"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-200">
                      Vai trò đăng ký *
                    </label>
                    <Select 
                      value={formData.role} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}
                    >
                      <SelectTrigger className="bg-slate-800/50 border-slate-700/50 focus:ring-emerald-500/20 w-full text-slate-100">
                        <SelectValue placeholder="Chọn vai trò" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-700 text-slate-100">
                        <SelectItem value="Citizen">Citizen (Người dân)</SelectItem>
                        <SelectItem value="Rescuer">Rescuer (Nhân viên cứu hộ)</SelectItem>
                        <SelectItem value="Dispatcher">Dispatcher (Điều phối viên)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold h-10 mt-2"
                    disabled={isLoading || !passwordMatch}
                  >
                    {isLoading ? "Đang tạo tài khoản..." : "Tạo tài khoản"}
                  </Button>
                </form>

                {/* Info Box */}
                <div className="mt-5 flex items-start gap-3 rounded-lg border border-blue-500/20 bg-blue-500/5 p-3">
                  <AlertCircle className="h-4 w-4 text-blue-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-300">
                    Mật khẩu tối thiểu 6 ký tự, có ít nhất 1 chữ và 1 số. Vui lòng chọn đúng vai trò của bạn.
                  </p>
                </div>
              </CardContent>

              <Separator className="bg-slate-700/30" />

              <CardFooter className="flex flex-col items-start gap-3 pt-4">
                <p className="text-xs text-slate-400">
                  Đã có tài khoản?{" "}
                  <Link
                    href="/login"
                    className="text-emerald-400 hover:text-emerald-300"
                  >
                    Đăng nhập tại đây
                  </Link>
                </p>
                <Link
                  href="/"
                  className="text-xs text-slate-500 hover:text-slate-400 transition"
                >
                  ← Quay về trang chính
                </Link>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
