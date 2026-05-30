'use client'

import { Button } from '@/components/ui/button'
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { getApiErrorMessage } from '@/lib/api/client'
import { useLogin } from '@/lib/api/use-auth'
import { cn } from '@/lib/utils'
import {
    Eye,
    EyeOff,
    Loader2,
    Lock,
    Radio,
    ShieldAlert,
    Zap,
} from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'
import { toast } from 'sonner'

// ─── Animated feature card ────────────────────────────────────────────────────
function FeatureCard({
    icon: Icon,
    title,
    desc,
    accentClass,
    delay,
}: {
    icon: React.ElementType
    title: string
    desc: string
    accentClass: string
    delay: string
}) {
    return (
        <div
            className={cn(
                'group relative rounded-xl border border-white/[0.06] bg-white/[0.03] p-4',
                'backdrop-blur-sm transition-all duration-300',
                'hover:border-white/[0.12] hover:bg-white/[0.06] hover:-translate-y-0.5',
                'animate-[fadeSlideUp_0.6s_ease_both]'
            )}
            style={{ animationDelay: delay }}
        >
            <div
                className={cn(
                    'mb-2 flex size-8 items-center justify-center rounded-lg',
                    accentClass
                )}
            >
                <Icon className="size-4" />
            </div>
            <p className="text-sm font-semibold text-white/90">{title}</p>
            <p className="mt-0.5 text-xs leading-relaxed text-white/45">
                {desc}
            </p>
        </div>
    )
}

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge() {
    return (
        <div className="inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 animate-[fadeSlideUp_0.4s_ease_both]">
            <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-red-500" />
            </span>
            <span className="text-xs font-semibold uppercase tracking-widest text-red-300">
                Rescue System
            </span>
        </div>
    )
}

// ─── Main page ────────────────────────────────────────────────────────────────
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
            {/* ── Global keyframes ── */}
            <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes gradientShift {
          0%, 100% { background-position: 0% 50%; }
          50%       { background-position: 100% 50%; }
        }
        @keyframes orb-float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33%       { transform: translate(20px, -30px) scale(1.05); }
          66%       { transform: translate(-15px, 20px) scale(0.95); }
        }
      `}</style>

            <div className="relative min-h-screen overflow-hidden bg-[#05080f] font-sans text-white">
                {/* ── Ambient background orbs ── */}
                <div className="pointer-events-none fixed inset-0">
                    {/* Left orb */}
                    <div
                        className="absolute -left-48 top-10 h-[520px] w-[520px] rounded-full opacity-30"
                        style={{
                            background:
                                'radial-gradient(circle, #dc2626 0%, transparent 70%)',
                            filter: 'blur(80px)',
                            animation: 'orb-float 14s ease-in-out infinite',
                        }}
                    />
                    {/* Right orb */}
                    <div
                        className="absolute -right-32 bottom-0 h-[480px] w-[480px] rounded-full opacity-20"
                        style={{
                            background:
                                'radial-gradient(circle, #1d4ed8 0%, transparent 70%)',
                            filter: 'blur(80px)',
                            animation:
                                'orb-float 18s ease-in-out infinite reverse',
                        }}
                    />
                    {/* Center orb */}
                    <div
                        className="absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-10"
                        style={{
                            background:
                                'radial-gradient(circle, #06b6d4 0%, transparent 70%)',
                            filter: 'blur(60px)',
                        }}
                    />
                    {/* Grid overlay */}
                    <div
                        className="absolute inset-0 opacity-[0.03]"
                        style={{
                            backgroundImage:
                                'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
                            backgroundSize: '48px 48px',
                        }}
                    />
                </div>

                {/* ── Layout ── */}
                <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl items-center px-6 py-16 lg:px-10">
                    <div className="grid w-full gap-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
                        {/* ═══════════ LEFT – Hero ═══════════ */}
                        <div className="flex flex-col gap-10">
                            <StatusBadge />

                            {/* Headline */}
                            <div
                                className="flex flex-col gap-4 animate-[fadeSlideUp_0.5s_ease_both]"
                                style={{ animationDelay: '0.1s' }}
                            >
                                <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl xl:text-6xl">
                                    Hệ thống{' '}
                                    <span
                                        style={{
                                            background:
                                                'linear-gradient(135deg, #f87171 0%, #fbbf24 50%, #f87171 100%)',
                                            backgroundSize: '200% 200%',
                                            animation:
                                                'gradientShift 4s ease infinite',
                                            WebkitBackgroundClip: 'text',
                                            WebkitTextFillColor: 'transparent',
                                            backgroundClip: 'text',
                                        }}
                                    >
                                        cứu hộ
                                    </span>
                                    <br />
                                    khẩn cấp
                                </h1>
                                <p className="max-w-md text-base leading-relaxed text-white/50">
                                    Nền tảng điều phối cứu hộ thời gian thực —
                                    kết nối Trung tâm chỉ huy với các đội cứu
                                    nạn ngoài hiện trường.
                                </p>
                            </div>

                            {/* Feature grid */}
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-2">
                                <FeatureCard
                                    icon={Radio}
                                    title="24/7 Hoạt động"
                                    desc="Nhận và xử lý yêu cầu cứu hộ bất kỳ lúc nào"
                                    accentClass="bg-red-500/15 text-red-400"
                                    delay="0.2s"
                                />
                                <FeatureCard
                                    icon={Zap}
                                    title="Thời gian thực"
                                    desc="Cập nhật tình trạng đội cứu liên tục"
                                    accentClass="bg-amber-500/15 text-amber-400"
                                    delay="0.3s"
                                />
                                <FeatureCard
                                    icon={Lock}
                                    title="Bảo mật cao"
                                    desc="Xác thực nhiều lớp, mã hóa đầu cuối"
                                    accentClass="bg-cyan-500/15 text-cyan-400"
                                    delay="0.4s"
                                />
                                <FeatureCard
                                    icon={ShieldAlert}
                                    title="Ưu tiên khẩn cấp"
                                    desc="Tự động phân loại mức độ nguy hiểm"
                                    accentClass="bg-blue-500/15 text-blue-400"
                                    delay="0.5s"
                                />
                            </div>
                        </div>

                        {/* ═══════════ RIGHT – Login Card ═══════════ */}
                        <div
                            className="flex justify-center lg:justify-end animate-[fadeSlideUp_0.5s_ease_both]"
                            style={{ animationDelay: '0.2s' }}
                        >
                            <Card
                                className={cn(
                                    'w-full max-w-[420px]',
                                    'border border-white/[0.08] bg-white/[0.04]',
                                    'shadow-[0_32px_80px_rgba(0,0,0,0.6)]',
                                    'backdrop-blur-xl'
                                )}
                            >
                                {/* Card top glow line */}
                                <div className="h-px w-full rounded-t-xl bg-gradient-to-r from-transparent via-red-500/60 to-transparent" />

                                <CardHeader className="gap-2 px-6 pt-6">
                                    {/* Logo mark */}
                                    <div className="mb-1 flex size-10 items-center justify-center rounded-lg bg-red-500/15 text-red-400 ring-1 ring-red-500/20">
                                        <ShieldAlert className="size-5" />
                                    </div>
                                    <CardTitle className="text-xl font-bold text-white">
                                        Đăng nhập
                                    </CardTitle>
                                    <CardDescription className="text-white/45 text-sm">
                                        Truy cập bảng điều khiển cứu hộ & điều
                                        phối
                                    </CardDescription>
                                </CardHeader>

                                <CardContent className="px-6 pb-2">
                                    <form
                                        onSubmit={handleSubmit}
                                        className="flex flex-col gap-4"
                                    >
                                        {/* Email field */}
                                        <div className="flex flex-col gap-1.5">
                                            <label
                                                htmlFor="email"
                                                className="text-sm font-medium text-white/70"
                                            >
                                                Email
                                            </label>
                                            <Input
                                                id="email"
                                                type="email"
                                                placeholder="dieu_phoi@rescue.vn"
                                                value={email}
                                                onChange={e =>
                                                    setEmail(e.target.value)
                                                }
                                                autoComplete="email"
                                                required
                                                className={cn(
                                                    'h-10 bg-white/[0.05] border-white/10 text-white placeholder:text-white/25',
                                                    'focus-visible:border-red-500/50 focus-visible:ring-red-500/20',
                                                    'transition-colors'
                                                )}
                                            />
                                        </div>

                                        {/* Password field */}
                                        <div className="flex flex-col gap-1.5">
                                            <div className="flex items-center justify-between">
                                                <label
                                                    htmlFor="password"
                                                    className="text-sm font-medium text-white/70"
                                                >
                                                    Mật khẩu
                                                </label>
                                                <Link
                                                    href="/forgot-password"
                                                    className="text-xs text-white/35 transition-colors hover:text-red-300"
                                                >
                                                    Quên mật khẩu?
                                                </Link>
                                            </div>
                                            <div className="relative">
                                                <Input
                                                    id="password"
                                                    type={
                                                        showPassword
                                                            ? 'text'
                                                            : 'password'
                                                    }
                                                    placeholder="••••••••"
                                                    value={password}
                                                    onChange={e =>
                                                        setPassword(
                                                            e.target.value
                                                        )
                                                    }
                                                    autoComplete="current-password"
                                                    required
                                                    className={cn(
                                                        'h-10 pr-10 bg-white/[0.05] border-white/10 text-white placeholder:text-white/25',
                                                        'focus-visible:border-red-500/50 focus-visible:ring-red-500/20',
                                                        'transition-colors'
                                                    )}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setShowPassword(v => !v)
                                                    }
                                                    aria-label={
                                                        showPassword
                                                            ? 'Ẩn mật khẩu'
                                                            : 'Hiện mật khẩu'
                                                    }
                                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 transition-colors hover:text-white/70"
                                                >
                                                    {showPassword ? (
                                                        <EyeOff className="size-4" />
                                                    ) : (
                                                        <Eye className="size-4" />
                                                    )}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Submit */}
                                        <Button
                                            type="submit"
                                            size="lg"
                                            disabled={login.isPending}
                                            className={cn(
                                                'mt-1 h-10 w-full font-semibold',
                                                'bg-red-600 text-white',
                                                'hover:bg-red-500',
                                                'disabled:opacity-60',
                                                'transition-all duration-200',
                                                'shadow-[0_4px_24px_rgba(220,38,38,0.35)]',
                                                'hover:shadow-[0_4px_32px_rgba(220,38,38,0.55)]'
                                            )}
                                        >
                                            {login.isPending ? (
                                                <>
                                                    <Loader2
                                                        data-icon="inline-start"
                                                        className="animate-spin"
                                                    />
                                                    Đang đăng nhập…
                                                </>
                                            ) : (
                                                'Đăng nhập'
                                            )}
                                        </Button>
                                    </form>
                                </CardContent>

                                <div className="mx-6 h-px bg-white/[0.07]" />

                                <CardFooter className="flex flex-col items-start gap-3 px-6 pb-6 bg-transparent">
                                    <p className="text-xs text-white/35">
                                        Chưa có tài khoản?{' '}
                                        <Link
                                            href="/register"
                                            className="font-medium text-red-400 transition-colors hover:text-red-300"
                                        >
                                            Đăng ký tại đây
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
                </div>
            </div>
        </>
    )
}

export default function LoginPage() {
    return (
        <Suspense
            fallback={
                <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-400">
                    Đang tải...
                </div>
            }
        >
            <LoginPageContent />
        </Suspense>
    )
}
