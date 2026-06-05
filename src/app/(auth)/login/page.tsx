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
    Zap,
    Activity,
    Shield,
    LifeBuoy,
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
                'group relative rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5',
                'backdrop-blur-sm transition-all duration-300',
                'hover:border-emerald-500/20 hover:bg-white/[0.05] hover:-translate-y-0.5',
                'animate-[fadeSlideUp_0.6s_ease_both]'
            )}
            style={{ animationDelay: delay }}
        >
            <div
                className={cn(
                    'mb-3 flex size-9 items-center justify-center rounded-xl',
                    accentClass
                )}
            >
                <Icon className="size-4.5" />
            </div>
            <p className="text-sm font-bold text-white/95">{title}</p>
            <p className="mt-1 text-xs leading-relaxed text-white/45 font-medium">
                {desc}
            </p>
        </div>
    )
}

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge() {
    return (
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-1.5 animate-[fadeSlideUp_0.4s_ease_both]">
            <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
            </span>
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-emerald-300">
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
          33%       { transform: translate(25px, -25px) scale(1.05); }
          66%       { transform: translate(-20px, 20px) scale(0.95); }
        }
      `}</style>

            <div className="relative min-h-screen overflow-hidden bg-[#060913] font-sans text-white">
                {/* ── Ambient background orbs ── */}
                <div className="pointer-events-none fixed inset-0">
                    {/* Left orb */}
                    <div
                        className="absolute -left-48 top-10 h-[520px] w-[520px] rounded-full opacity-[0.18]"
                        style={{
                            background:
                                'radial-gradient(circle, #10b981 0%, transparent 70%)',
                            filter: 'blur(90px)',
                            animation: 'orb-float 14s ease-in-out infinite',
                        }}
                    />
                    {/* Right orb */}
                    <div
                        className="absolute -right-32 bottom-0 h-[480px] w-[480px] rounded-full opacity-[0.15]"
                        style={{
                            background:
                                'radial-gradient(circle, #0d9488 0%, transparent 70%)',
                            filter: 'blur(90px)',
                            animation:
                                'orb-float 18s ease-in-out infinite reverse',
                        }}
                    />
                    {/* Center orb */}
                    <div
                        className="absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-[0.08]"
                        style={{
                            background:
                                'radial-gradient(circle, #0ea5e9 0%, transparent 70%)',
                            filter: 'blur(70px)',
                        }}
                    />
                    {/* Grid overlay */}
                    <div
                        className="absolute inset-0 opacity-[0.025]"
                        style={{
                            backgroundImage:
                                'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
                            backgroundSize: '56px 56px',
                        }}
                    />
                </div>

                {/* ── Layout ── */}
                <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl items-center px-6 py-16 lg:px-10">
                    <div className="grid w-full gap-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
                        {/* ═══════════ LEFT – Hero ═══════════ */}
                        <div className="flex flex-col gap-10">
                            <div>
                                <StatusBadge />
                            </div>

                            {/* Headline */}
                            <div
                                className="flex flex-col gap-5 animate-[fadeSlideUp_0.5s_ease_both]"
                                style={{ animationDelay: '0.1s' }}
                            >
                                <h1 className="text-4xl font-black leading-[1.15] tracking-tight sm:text-5xl xl:text-6xl text-white">
                                    Hệ thống{' '}
                                    <span
                                        style={{
                                            background:
                                                'linear-gradient(135deg, #34d399 0%, #06b6d4 50%, #34d399 100%)',
                                            backgroundSize: '200% 200%',
                                            animation:
                                                'gradientShift 4s ease infinite',
                                            WebkitBackgroundClip: 'text',
                                            WebkitTextFillColor: 'transparent',
                                            backgroundClip: 'text',
                                        }}
                                    >
                                        điều phối
                                    </span>
                                    <br />
                                    cứu hộ khẩn cấp
                                </h1>
                                <p className="max-w-md text-sm md:text-base leading-relaxed text-white/50 font-medium">
                                    Nền tảng liên kết thời gian thực — kết nối nhanh chóng người dân gặp sự cố với Trung tâm điều phối và lực lượng cứu nạn thực địa.
                                </p>
                            </div>

                            {/* Feature grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <FeatureCard
                                    icon={Radio}
                                    title="24/7 Hoạt động"
                                    desc="Nhận và xử lý yêu cầu khẩn cấp bất kể thời gian"
                                    accentClass="bg-emerald-500/15 text-emerald-400"
                                    delay="0.2s"
                                />
                                <FeatureCard
                                    icon={Zap}
                                    title="Thời gian thực"
                                    desc="Cập nhật trạng thái sự cố và vị trí lực lượng liên tục"
                                    accentClass="bg-teal-500/15 text-teal-400"
                                    delay="0.3s"
                                />
                                <FeatureCard
                                    icon={Lock}
                                    title="Bảo mật tối đa"
                                    desc="Mã hóa đầu cuối và xác thực phân quyền chặt chẽ"
                                    accentClass="bg-cyan-500/15 text-cyan-400"
                                    delay="0.4s"
                                />
                                <FeatureCard
                                    icon={Shield}
                                    title="Điều phối tối ưu"
                                    desc="Tự động hóa phân phối sự cố tới các đội lân cận"
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
                                    'border border-white/[0.08] bg-white/[0.03]',
                                    'shadow-[0_32px_80px_rgba(0,0,0,0.7)]',
                                    'backdrop-blur-xl rounded-2xl overflow-hidden'
                                )}
                            >
                                {/* Card top glow line */}
                                <div className="h-[3px] w-full bg-gradient-to-r from-transparent via-emerald-500/60 to-transparent" />

                                <CardHeader className="gap-2.5 px-8 pt-8">
                                    {/* Logo mark */}
                                    <div className="mb-1 flex size-11 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/20 group cursor-pointer">
                                        <LifeBuoy className="size-5.5 transition-transform duration-500 hover:rotate-90" />
                                    </div>
                                    <CardTitle className="text-xl font-extrabold text-white">
                                        Đăng nhập hệ thống
                                    </CardTitle>
                                    <CardDescription className="text-white/45 text-sm font-medium">
                                        Đăng nhập bảng điều khiển thành viên & điều phối
                                    </CardDescription>
                                </CardHeader>

                                <CardContent className="px-8 pb-3">
                                    <form
                                        onSubmit={handleSubmit}
                                        className="flex flex-col gap-4.5"
                                    >
                                        {/* Email field */}
                                        <div className="flex flex-col gap-1.5">
                                            <label
                                                htmlFor="email"
                                                className="text-xs font-bold text-white/60 uppercase tracking-wider"
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
                                                    'h-10 bg-white/[0.05] border-white/10 text-white placeholder:text-white/20 rounded-lg',
                                                    'focus-visible:border-emerald-500/50 focus-visible:ring-emerald-500/20',
                                                    'transition-all duration-200'
                                                )}
                                            />
                                        </div>

                                        {/* Password field */}
                                        <div className="flex flex-col gap-1.5">
                                            <div className="flex items-center justify-between">
                                                <label
                                                    htmlFor="password"
                                                    className="text-xs font-bold text-white/60 uppercase tracking-wider"
                                                >
                                                    Mật khẩu
                                                </label>
                                                <Link
                                                    href="/forgot-password"
                                                    className="text-xs text-white/35 transition-colors hover:text-emerald-400 font-semibold"
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
                                                        'h-10 pr-10 bg-white/[0.05] border-white/10 text-white placeholder:text-white/20 rounded-lg',
                                                        'focus-visible:border-emerald-500/50 focus-visible:ring-emerald-500/20',
                                                        'transition-all duration-200'
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
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 transition-colors hover:text-white/70"
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
                                                'mt-2 h-10 w-full font-bold rounded-lg',
                                                'bg-gradient-to-r from-emerald-600 to-teal-600 text-white',
                                                'hover:from-emerald-500 hover:to-teal-500',
                                                'disabled:opacity-60',
                                                'transition-all duration-200 active:scale-[0.98]',
                                                'shadow-[0_4px_24px_rgba(16,185,129,0.25)]',
                                                'hover:shadow-[0_4px_32px_rgba(16,185,129,0.45)]'
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

                                <div className="mx-8 my-4 h-px bg-white/[0.06]" />

                                <CardFooter className="flex flex-col items-center gap-3.5 px-8 pb-8 bg-transparent">
                                    <p className="text-xs text-white/40 font-medium">
                                        Chưa có tài khoản?{' '}
                                        <Link
                                            href="/register"
                                            className="font-bold text-emerald-400 transition-colors hover:text-emerald-300"
                                        >
                                            Đăng ký tại đây
                                        </Link>
                                    </p>
                                    <Link
                                        href="/"
                                        className="text-xs text-white/25 transition-colors hover:text-white/50 font-medium"
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
                <div className="flex min-h-screen items-center justify-center bg-[#060913] text-slate-500 font-bold">
                    <Loader2 className="h-8 w-8 animate-spin text-emerald-500 mr-2" />
                    Đang tải...
                </div>
            }
        >
            <LoginPageContent />
        </Suspense>
    )
}
