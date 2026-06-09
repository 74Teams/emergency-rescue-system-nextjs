'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getApiErrorMessage } from '@/lib/api/client'
import { useLogin } from '@/lib/api/use-auth'
import { cn } from '@/lib/utils'
import {
    Eye,
    EyeOff,
    Loader2,
    LifeBuoy,
} from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'
import { toast } from 'sonner'

function LoginPageContent() {
    const searchParams = useSearchParams()
    const redirectTo = searchParams.get('redirect')
    const [email, setEmail] = useState(searchParams.get('email') || '')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const login = useLogin()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            await login.mutateAsync({
                payload: { email, password },
                redirectTo,
            })
            toast.success('Đăng nhập thành công')
        } catch (error) {
            toast.error('Đăng nhập thất bại', {
                description: getApiErrorMessage(error),
            })
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

            <div className="relative min-h-screen overflow-hidden bg-slate-50/50 font-sans text-slate-800 flex items-center justify-center px-4 py-8">
                {/* ── Ambient background elements ── */}
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    <div
                        className="absolute -left-24 -top-24 h-[400px] w-[400px] rounded-full opacity-[0.08]"
                        style={{
                            background: 'radial-gradient(circle, #3b82f6 0%, transparent 70%)',
                            filter: 'blur(80px)',
                            animation: 'subtle-float 12s ease-in-out infinite',
                        }}
                    />
                    <div
                        className="absolute -right-24 -bottom-24 h-[400px] w-[400px] rounded-full opacity-[0.06]"
                        style={{
                            background: 'radial-gradient(circle, #2563eb 0%, transparent 70%)',
                            filter: 'blur(80px)',
                            animation: 'subtle-float 16s ease-in-out infinite reverse',
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
                <div className="relative z-10 w-full max-w-[850px]">
                    <div
                        className={cn(
                            'w-full border border-blue-100 bg-white/95',
                            'shadow-[0_12px_40px_rgba(37,99,235,0.06)]',
                            'backdrop-blur-md rounded-2xl overflow-hidden',
                            'grid grid-cols-1 lg:grid-cols-12 min-h-[540px]'
                        )}
                    >
                        {/* ── Left side: Illustration Image (Slides in from Left) ── */}
                        <div className="relative hidden lg:block lg:col-span-5 bg-blue-50 overflow-hidden border-r border-blue-100/30 animate-[slideInFromLeft_0.5s_cubic-bezier(0.16,1,0.3,1)_both]">
                            <img
                                src="/pic2.png"
                                alt="Rescue System illustration"
                                className="absolute inset-0 w-full h-full object-cover object-center"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-blue-900/10 via-transparent to-transparent" />
                        </div>

                        {/* ── Right side: Login Form (Slides in from Right) ── */}
                        <div className="lg:col-span-7 flex flex-col justify-between p-8 sm:p-10 animate-[slideInFromRight_0.5s_cubic-bezier(0.16,1,0.3,1)_both]">
                            {/* Card Top / Header */}
                            <div className="flex flex-col items-center text-center gap-2 mb-6">
                                <div className="mb-1 flex size-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100/50">
                                    <LifeBuoy className="size-5.5 animate-[spin_20s_linear_infinite]" />
                                </div>
                                <h1 className="text-xl font-bold tracking-tight text-slate-900">
                                    Đăng nhập hệ thống
                                </h1>
                                <p className="text-slate-500 text-xs font-medium">
                                    Điền thông tin tài khoản của bạn để truy cập
                                </p>
                            </div>

                            {/* Form Input fields */}
                            <form
                                onSubmit={handleSubmit}
                                className="flex flex-col gap-4 flex-1 justify-center"
                            >
                                {/* Email field */}
                                <div className="flex flex-col gap-1.5">
                                    <label
                                        htmlFor="email"
                                        className="text-[11px] font-bold text-slate-500 uppercase tracking-wider"
                                    >
                                        Email
                                    </label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="username@rescue.vn"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        autoComplete="email"
                                        required
                                        className={cn(
                                            'h-10 bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400 rounded-lg px-3.5',
                                            'focus-visible:border-blue-500/50 focus-visible:ring-blue-500/10 focus-visible:bg-white',
                                            'transition-all duration-200 text-sm'
                                        )}
                                    />
                                </div>

                                {/* Password field */}
                                <div className="flex flex-col gap-1.5">
                                    <div className="flex items-center justify-between">
                                        <label
                                            htmlFor="password"
                                            className="text-[11px] font-bold text-slate-500 uppercase tracking-wider"
                                        >
                                            Mật khẩu
                                        </label>
                                        <Link
                                            href="/forgot-password"
                                            className="text-xs text-slate-400 transition-colors hover:text-blue-600 font-semibold"
                                        >
                                            Quên mật khẩu?
                                        </Link>
                                    </div>
                                    <div className="relative">
                                        <Input
                                            id="password"
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={e => setPassword(e.target.value)}
                                            autoComplete="current-password"
                                            required
                                            className={cn(
                                                'h-10 pr-10 bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400 rounded-lg px-3.5',
                                                'focus-visible:border-blue-500/50 focus-visible:ring-blue-500/10 focus-visible:bg-white',
                                                'transition-all duration-200 text-sm'
                                            )}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(v => !v)}
                                            aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600"
                                        >
                                            {showPassword ? (
                                                <EyeOff className="size-4" />
                                            ) : (
                                                <Eye className="size-4" />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* Submit button */}
                                <Button
                                    type="submit"
                                    size="lg"
                                    disabled={login.isPending}
                                    className={cn(
                                        'mt-4 h-10 w-full font-semibold rounded-lg text-sm',
                                        'bg-blue-600 hover:bg-blue-700 text-white',
                                        'disabled:opacity-60',
                                        'transition-all duration-200 active:scale-[0.98]',
                                        'shadow-md shadow-blue-500/10 hover:shadow-lg hover:shadow-blue-500/20 cursor-pointer'
                                    )}
                                >
                                    {login.isPending ? (
                                        <>
                                            <Loader2
                                                data-icon="inline-start"
                                                className="animate-spin mr-2"
                                            />
                                            Đang đăng nhập…
                                        </>
                                    ) : (
                                        'Đăng nhập'
                                    )}
                                </Button>
                            </form>

                            {/* Divider & Footer links */}
                            <div className="flex flex-col items-center">
                                <div className="w-full h-px bg-slate-100 my-5" />
                                <div className="flex flex-col items-center gap-2.5">
                                    <p className="text-xs text-slate-500 font-medium">
                                        Chưa có tài khoản?{' '}
                                        <Link
                                            href="/register"
                                            className="font-bold text-blue-600 transition-colors hover:text-blue-700"
                                        >
                                            Đăng ký tại đây
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
                    </div>
                </div>
            </div>
        </>
    )
}

export default function LoginPage() {
    return (
        <Suspense
            fallback={
                <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-500 font-medium">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-600 mr-2" />
                    Đang tải...
                </div>
            }
        >
            <LoginPageContent />
        </Suspense>
    )
}
