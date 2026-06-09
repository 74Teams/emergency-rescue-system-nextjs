'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getApiErrorMessage } from '@/lib/api/client'
import { authApi } from '@/lib/api/services'
import { cn } from '@/lib/utils'
import { AlertCircle, Eye, EyeOff, Info, Loader2, LifeBuoy } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { toast } from 'sonner'
import { setStoredAuthSession } from '@/lib/api/storage'
import { normalizeAuthTokenPayload } from '@/lib/auth/normalize-auth'

export default function RegisterPage() {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        fullName: '',
        phoneNumber: '',
        userName: '',
    })

    const [isLoading, setIsLoading] = useState(false)
    const [passwordMatch, setPasswordMatch] = useState(true)
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))

        if (name === 'confirmPassword' || name === 'password') {
            setPasswordMatch(
                name === 'confirmPassword'
                    ? value === formData.password
                    : value === formData.confirmPassword
            )
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!passwordMatch) {
            toast.error('Mật khẩu không khớp')
            return
        }

        const phoneDigits = formData.phoneNumber.replace(/\D/g, '')
        if (phoneDigits.length < 9 || phoneDigits.length > 15) {
            toast.error('Số điện thoại không hợp lệ (9–15 chữ số)')
            return
        }

        if (formData.password.length < 6) {
            toast.error('Mật khẩu phải có tối thiểu 6 ký tự')
            return
        }

        if (!/(?=.*[A-Za-z])(?=.*\d)/.test(formData.password)) {
            toast.error('Mật khẩu phải có ít nhất 1 chữ cái và 1 số')
            return
        }

        const userName =
            formData.userName.trim() ||
            formData.email.split('@')[0]?.replace(/\W/g, '') ||
            'user'

        setIsLoading(true)
        try {
            const registerData = {
                email: formData.email.trim(),
                password: formData.password,
                fullName: formData.fullName.trim(),
                userName,
                phoneNumber: phoneDigits,
                address: '',
                dateOfBirth: new Date(2000, 0, 1).toISOString(),
                avatar: '',
            }

            const response = await authApi.register(registerData)
            const session = normalizeAuthTokenPayload(response.data)
            setStoredAuthSession(session)

            toast.success(
                'Đăng ký tài khoản thành công! Đang chuyển tới trang lựa chọn vai trò...'
            )
            setTimeout(() => {
                window.location.href = '/select-role'
            }, 1000)
        } catch (error) {
            toast.error('Có lỗi xảy ra', {
                description: getApiErrorMessage(error),
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <>
            <style>{`
        @keyframes slideInFromLeft {
          from { opacity: 0; transform: translateX(-32px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInFromRight {
          from { opacity: 0; transform: translateX(32px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes subtle-float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50%      { transform: translate(15px, -15px) scale(1.02); }
        }
      `}</style>

            <div className="relative min-h-screen flex items-center justify-center bg-slate-50/50 font-sans text-slate-800 px-4 py-12 overflow-hidden">
                {/* ── Ambient background elements ── */}
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    <div
                        className="absolute -left-24 -top-24 h-[400px] w-[400px] rounded-full opacity-[0.08]"
                        style={{
                            background:
                                'radial-gradient(circle, #3b82f6 0%, transparent 70%)',
                            filter: 'blur(80px)',
                            animation: 'subtle-float 12s ease-in-out infinite',
                        }}
                    />
                    <div
                        className="absolute -right-24 -bottom-24 h-[400px] w-[400px] rounded-full opacity-[0.06]"
                        style={{
                            background:
                                'radial-gradient(circle, #2563eb 0%, transparent 70%)',
                            filter: 'blur(80px)',
                            animation:
                                'subtle-float 16s ease-in-out infinite reverse',
                        }}
                    />
                    <div
                        className="absolute inset-0 opacity-[0.015]"
                        style={{
                            backgroundImage:
                                'linear-gradient(rgba(37,99,235,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(37,99,235,0.1) 1px, transparent 1px)',
                            backgroundSize: '48px 48px',
                        }}
                    />
                </div>

                {/* ── Main Layout Container ── */}
                <div className="relative z-10 w-full max-w-[1050px]">
                    <div
                        className={cn(
                            'w-full border border-blue-100 bg-white/95 shadow-[0_12px_40px_rgba(37,99,235,0.06)] backdrop-blur-md rounded-2xl overflow-hidden',
                            'grid grid-cols-1 lg:grid-cols-12 min-h-[580px]'
                        )}
                    >
                        {/* ── Left side: Register Form (Slides in from Left) ── */}
                        <div className="lg:col-span-7 flex flex-col justify-between p-8 sm:p-10 animate-[slideInFromLeft_0.5s_cubic-bezier(0.16,1,0.3,1)_both]">
                            {/* Card Header */}
                            <div className="flex flex-col items-center text-center gap-2 mb-6">
                                <div className="mb-1 flex size-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100/50">
                                    <LifeBuoy className="size-5.5 animate-[spin_20s_linear_infinite]" />
                                </div>
                                <h1 className="text-xl font-bold tracking-tight text-slate-900">
                                    Tạo tài khoản mới
                                </h1>
                                <p className="text-slate-500 text-xs font-medium">
                                    Điền đầy đủ thông tin bên dưới để bắt đầu
                                    đăng ký
                                </p>
                            </div>

                            {/* Input Form Fields */}
                            <form
                                onSubmit={handleSubmit}
                                className="flex flex-col gap-4 flex-1 justify-center"
                            >
                                {/* Họ và tên */}
                                <div className="flex flex-col gap-1.5">
                                    <label
                                        htmlFor="fullName"
                                        className="text-[11px] font-bold text-slate-500 uppercase tracking-wider"
                                    >
                                        Họ và tên *
                                    </label>
                                    <Input
                                        id="fullName"
                                        name="fullName"
                                        placeholder="Nguyễn Văn A"
                                        value={formData.fullName}
                                        onChange={handleChange}
                                        className="h-10 px-3.5 bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400 focus-visible:border-blue-500/50 focus-visible:ring-blue-500/10 focus-visible:bg-white transition-all rounded-lg text-sm"
                                        required
                                    />
                                </div>

                                {/* Email & Số điện thoại */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="flex flex-col gap-1.5">
                                        <label
                                            htmlFor="email"
                                            className="text-[11px] font-bold text-slate-500 uppercase tracking-wider"
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
                                            className="h-10 px-3.5 bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400 focus-visible:border-blue-500/50 focus-visible:ring-blue-500/10 focus-visible:bg-white transition-all rounded-lg text-sm"
                                            required
                                        />
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <label
                                            htmlFor="phoneNumber"
                                            className="text-[11px] font-bold text-slate-500 uppercase tracking-wider"
                                        >
                                            Số điện thoại *
                                        </label>
                                        <Input
                                            id="phoneNumber"
                                            name="phoneNumber"
                                            placeholder="0912345678"
                                            value={formData.phoneNumber}
                                            onChange={handleChange}
                                            className="h-10 px-3.5 bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400 focus-visible:border-blue-500/50 focus-visible:ring-blue-500/10 focus-visible:bg-white transition-all rounded-lg text-sm"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Mật khẩu & Xác nhận mật khẩu */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="flex flex-col gap-1.5">
                                        <label
                                            htmlFor="password"
                                            className="text-[11px] font-bold text-slate-500 uppercase tracking-wider"
                                        >
                                            Mật khẩu *
                                        </label>
                                        <div className="relative">
                                            <Input
                                                id="password"
                                                name="password"
                                                type={
                                                    showPassword
                                                        ? 'text'
                                                        : 'password'
                                                }
                                                placeholder="••••••••"
                                                value={formData.password}
                                                onChange={handleChange}
                                                className="h-10 pr-10 bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400 focus-visible:border-blue-500/50 focus-visible:ring-blue-500/10 focus-visible:bg-white transition-all rounded-lg text-sm"
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setShowPassword(v => !v)
                                                }
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                            >
                                                {showPassword ? (
                                                    <EyeOff className="size-4" />
                                                ) : (
                                                    <Eye className="size-4" />
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <label
                                            htmlFor="confirmPassword"
                                            className="text-[11px] font-bold text-slate-500 uppercase tracking-wider"
                                        >
                                            Xác nhận mật khẩu *
                                        </label>
                                        <div className="relative">
                                            <Input
                                                id="confirmPassword"
                                                name="confirmPassword"
                                                type={
                                                    showConfirmPassword
                                                        ? 'text'
                                                        : 'password'
                                                }
                                                placeholder="••••••••"
                                                value={formData.confirmPassword}
                                                onChange={handleChange}
                                                className={cn(
                                                    'h-10 pr-10 bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400 focus-visible:ring-blue-500/10 focus-visible:bg-white transition-all rounded-lg text-sm',
                                                    !passwordMatch &&
                                                        formData.confirmPassword
                                                        ? 'border-red-400 focus-visible:border-red-400'
                                                        : 'focus-visible:border-blue-500/50'
                                                )}
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setShowConfirmPassword(
                                                        v => !v
                                                    )
                                                }
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                            >
                                                {showConfirmPassword ? (
                                                    <EyeOff className="size-4" />
                                                ) : (
                                                    <Eye className="size-4" />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Tên đăng nhập */}
                                <div className="flex flex-col gap-1.5">
                                    <label
                                        htmlFor="userName"
                                        className="text-[11px] font-bold text-slate-500 uppercase tracking-wider"
                                    >
                                        Tên đăng nhập (tùy chọn)
                                    </label>
                                    <Input
                                        id="userName"
                                        name="userName"
                                        placeholder="Mặc định lấy từ email nếu để trống"
                                        value={formData.userName}
                                        onChange={handleChange}
                                        className="h-10 px-3.5 bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400 focus-visible:border-blue-500/50 focus-visible:ring-blue-500/10 focus-visible:bg-white transition-all rounded-lg text-sm"
                                    />
                                </div>

                                {/* Mật khẩu không khớp warning */}
                                {!passwordMatch && formData.confirmPassword && (
                                    <p className="text-xs text-red-500 font-semibold flex items-center gap-1.5 -mt-1">
                                        <AlertCircle className="size-3.5" /> Mật
                                        khẩu không khớp
                                    </p>
                                )}

                                {/* Submit */}
                                <Button
                                    type="submit"
                                    disabled={isLoading || !passwordMatch}
                                    className="mt-4 h-10 w-full font-semibold text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200 shadow-md shadow-blue-500/10 hover:shadow-lg hover:shadow-blue-500/20 active:scale-[0.98] cursor-pointer"
                                >
                                    {isLoading ? (
                                        <div className="flex items-center justify-center gap-2">
                                            <Loader2 className="animate-spin size-4" />
                                            Đang tạo tài khoản…
                                        </div>
                                    ) : (
                                        'Đăng ký tài khoản'
                                    )}
                                </Button>

                                {/* Guide box */}
                                <div className="flex items-start gap-2.5 rounded-lg border border-blue-100 bg-blue-50/50 p-3 text-xs text-blue-700 leading-normal mt-1">
                                    <Info className="size-4 shrink-0 mt-0.5 text-blue-600" />
                                    <span>
                                        Mật khẩu tối thiểu 6 ký tự, có ít nhất 1
                                        chữ và 1 số. Bạn sẽ lựa chọn vai trò tài
                                        khoản ở bước tiếp theo.
                                    </span>
                                </div>
                            </form>

                            {/* Divider & Footer links */}
                            <div className="flex flex-col items-center">
                                <div className="w-full h-px bg-slate-100 my-5" />
                                <div className="flex flex-col items-center gap-2.5">
                                    <p className="text-xs text-slate-500 font-medium">
                                        Đã có tài khoản?{' '}
                                        <Link
                                            href="/login"
                                            className="font-bold text-blue-600 transition-colors hover:text-blue-700"
                                        >
                                            Đăng nhập tại đây
                                        </Link>
                                    </p>
                                    <Link
                                        href="/"
                                        className="text-xs text-slate-400 transition-colors hover:text-slate-600 font-medium"
                                    >
                                        ← Quay về trang chính
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* ── Right side: Illustration Image (Slides in from Right) ── */}
                        <div className="relative hidden lg:block lg:col-span-5 bg-blue-50 overflow-hidden border-l border-blue-100/30 animate-[slideInFromRight_0.5s_cubic-bezier(0.16,1,0.3,1)_both]">
                            <img
                                src="/pic4.jpg"
                                alt="Rescue System illustration"
                                className="absolute inset-0 w-full h-full object-cover object-center"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-blue-900/10 via-transparent to-transparent" />
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}
