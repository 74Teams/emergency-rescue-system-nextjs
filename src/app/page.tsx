'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { toast } from 'sonner'
import AOS from 'aos'
import 'aos/dist/aos.css'
import {
    Activity,
    ArrowRight,
    Check,
    CheckCircle,
    Copy,
    Heart,
    Info,
    Layers,
    LifeBuoy,
    Map,
    MapPin,
    Menu,
    PhoneCall,
    Radio,
    Shield,
    Users,
    X,
    Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { UserAccountMenu } from '@/components/shared/UserAccountMenu'

interface TeamMember {
    name: string
    role: string
    avatarInitials: string
    imageUrl?: string
    objectPosition?: string
    desc: string
    skills: string[]
    avatarBg: string
}

function TeamMemberHeader({ member }: { member: TeamMember }) {
    const [imageError, setImageError] = useState(false)

    return (
        <div className="relative w-full h-48 bg-slate-100 overflow-hidden border-b border-slate-100 flex items-center justify-center">
            {member.imageUrl && !imageError ? (
                <Image
                    src={member.imageUrl}
                    alt={member.name}
                    fill
                    className="object-cover transition-transform duration-500 hover:scale-105"
                    style={{
                        objectPosition: member.objectPosition || 'center',
                    }}
                    onError={() => setImageError(true)}
                />
            ) : (
                <div
                    className={`absolute inset-0 flex items-center justify-center ${member.avatarBg} text-white font-black text-4xl tracking-wider select-none`}
                >
                    {member.avatarInitials}
                </div>
            )}
            <span className="absolute bottom-4 right-4 flex h-3.5 w-3.5 rounded-full bg-emerald-400 border-2 border-white shadow-sm z-10" />
        </div>
    )
}

export default function LandingPage() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [copied, setCopied] = useState(false)
    const [activeTab, setActiveTab] = useState<
        'citizen' | 'dispatcher' | 'commander' | 'rescuer'
    >('citizen')

    useEffect(() => {
        AOS.init({
            duration: 800,
            easing: 'ease-out-cubic',
            once: true,
            offset: 50,
        })
    }, [])

    const bankDetails = {
        bankName: 'Ngân Hàng Techcombank',
        accountNumber: '1012006227',
        accountName: 'NGUYEN MINH CHIEN',
        memo: 'Ung ho du an cuu ho, cuu nan',
    }

    const copyToClipboard = () => {
        navigator.clipboard.writeText(bankDetails.accountNumber)
        setCopied(true)
        toast.success('Đã sao chép số tài khoản ngân hàng!')
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-800 selection:bg-emerald-100 selection:text-emerald-900">
            {/* ── Header ── */}
            <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur-sm shadow-sm">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 md:px-8">
                    {/* Logo */}
                    <Link
                        href="/"
                        className="flex items-center gap-2.5 hover:opacity-90 transition-opacity group"
                    >
                        <div className="relative flex size-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-200">
                            <LifeBuoy className="size-5 stroke-[2.5] transition-transform duration-500 group-hover:rotate-90" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[17px] font-black tracking-tight leading-none text-slate-950">
                                Rescue
                                <span className="text-emerald-600">
                                    System
                                </span>
                            </span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] leading-none mt-1">
                                Điều phối cứu hộ cứu nạn
                            </span>
                        </div>
                    </Link>

                    {/* Desktop Navigation Links */}
                    <nav className="hidden md:flex items-center gap-8">
                        <Link
                            href="#features"
                            className="text-sm font-semibold text-slate-600 hover:text-emerald-600 transition-colors"
                        >
                            Tính năng
                        </Link>
                        <Link
                            href="#project"
                            className="text-sm font-semibold text-slate-600 hover:text-emerald-600 transition-colors"
                        >
                            Về dự án
                        </Link>
                        <Link
                            href="#team"
                            className="text-sm font-semibold text-slate-600 hover:text-emerald-600 transition-colors"
                        >
                            Đội ngũ phát triển
                        </Link>
                        <Link
                            href="#support"
                            className="text-sm font-semibold text-slate-600 hover:text-emerald-600 transition-colors"
                        >
                            Ủng hộ đóng góp
                        </Link>
                    </nav>

                    {/* Header Actions */}
                    <div className="flex items-center gap-3">
                        <Link href="/map">
                            <Button className="hidden sm:inline-flex bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm transition-all">
                                Bản đồ trực tuyến
                                <ArrowRight className="size-4 ml-1" />
                            </Button>
                        </Link>
                        <div className="hidden md:block">
                            <UserAccountMenu showLoginWhenGuest avatarSize="md" />
                        </div>
                        <div className="md:hidden">
                            <UserAccountMenu avatarSize="sm" />
                        </div>
                        
                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="flex items-center justify-center p-2 rounded-lg text-slate-500 hover:text-emerald-600 md:hidden"
                            aria-label={mobileMenuOpen ? 'Đóng menu' : 'Mở menu'}
                        >
                            {mobileMenuOpen ? (
                                <X className="size-6" />
                            ) : (
                                <Menu className="size-6" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Mobile Navigation Dropdown */}
                {mobileMenuOpen && (
                    <div className="md:hidden border-b border-slate-200 bg-white py-4 px-6 flex flex-col gap-3 shadow-md animate-[fadeSlideDown_0.2s_ease_both]">
                        <Link
                            href="#features"
                            onClick={() => setMobileMenuOpen(false)}
                            className="text-base font-semibold text-slate-700 hover:text-emerald-600 py-2 border-b border-slate-100"
                        >
                            Tính năng
                        </Link>
                        <Link
                            href="#project"
                            onClick={() => setMobileMenuOpen(false)}
                            className="text-base font-semibold text-slate-700 hover:text-emerald-600 py-2 border-b border-slate-100"
                        >
                            Về dự án
                        </Link>
                        <Link
                            href="#team"
                            onClick={() => setMobileMenuOpen(false)}
                            className="text-base font-semibold text-slate-700 hover:text-emerald-600 py-2 border-b border-slate-100"
                        >
                            Đội ngũ
                        </Link>
                        <Link
                            href="#support"
                            onClick={() => setMobileMenuOpen(false)}
                            className="text-base font-semibold text-slate-700 hover:text-emerald-600 py-2 border-b border-slate-100"
                        >
                            Ủng hộ
                        </Link>
                        <div className="flex flex-col gap-2 pt-2">
                            <Link
                                href="/login"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                <Button
                                    variant="outline"
                                    className="w-full border-slate-200 text-slate-700 hover:bg-slate-50"
                                >
                                    Đăng nhập hệ thống
                                </Button>
                            </Link>
                            <Link
                                href="/map"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                                    Bản đồ trực tuyến
                                    <ArrowRight className="size-4 ml-1" />
                                </Button>
                            </Link>
                        </div>
                    </div>
                )}
            </header>

            {/* ── HERO SECTION ── */}
            <section className="relative isolate overflow-hidden border-b border-slate-100 py-20 md:py-28">
                {/* Base solid background layer */}
                <div className="absolute inset-0 -z-30 bg-slate-950" />

                {/* Background image from /public */}
                <Image
                    src="/bg1.jpg"
                    alt="Cứu hộ thiên tai"
                    fill
                    priority
                    className="-z-20 object-cover object-center opacity-55 select-none pointer-events-none"
                />

                {/* Overlay to create high contrast for text readability */}
                <div className="absolute inset-0 -z-10 bg-gradient-to-r from-slate-950 via-slate-950/75 to-slate-950/20" />

                <div className="mx-auto max-w-7xl px-6 md:px-8">
                    <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
                        {/* Left Info Column */}
                        <div className="flex flex-col gap-6 lg:col-span-8">
                            {/* Charity Project Badge (Glassmorphic) */}
                            <div
                                className="inline-flex max-w-fit items-center gap-2 rounded-full bg-white/10 border border-white/10 px-4 py-1.5 text-xs font-semibold text-slate-100 shadow-sm backdrop-blur-sm"
                                data-aos="fade-up"
                            >
                                <Heart className="size-3.5 fill-red-500 text-red-500" />
                                <span>
                                    Project base Learning - Đồ án công nghệ phần
                                    mềm
                                </span>
                            </div>

                            {/* Main Headline */}
                            <h1
                                className="text-4xl font-extrabold leading-[1.15] tracking-tight sm:text-5xl md:text-6xl text-white"
                                data-aos="fade-up"
                                data-aos-delay="100"
                            >
                                Kết nối công nghệ, <br />
                                <span className="text-emerald-400">
                                    sẻ chia hoạn nạn
                                </span>
                            </h1>

                            {/* Subheading */}
                            <p
                                className="max-w-xl text-base md:text-lg leading-relaxed text-slate-200"
                                data-aos="fade-up"
                                data-aos-delay="150"
                            >
                                Ứng dụng cứu hộ, cứu nạn là một nền tảng công
                                nghệ giúp liên kết tức thời người dân gặp thiên
                                tai, tai nạn với lực lượng cứu nạn ngoài hiện
                                trường trên bản đồ thời gian thực.
                            </p>

                            {/* CTAs */}
                            <div
                                className="flex flex-col sm:flex-row gap-4 pt-2"
                                data-aos="fade-up"
                                data-aos-delay="200"
                            >
                                <Link href="/sos">
                                    <Button className="h-12 w-full sm:w-auto px-8 bg-red-600 hover:bg-red-700 text-white font-bold tracking-wide shadow-md transition-all">
                                        <Radio className="size-4 mr-2 animate-pulse" />
                                        GỬI YÊU CẦU SOS KHẨN CẤP
                                    </Button>
                                </Link>
                                <Link href="/map">
                                    <Button
                                        variant="outline"
                                        className="h-12 w-full sm:w-auto px-8 border-white/20 hover:border-emerald-400 bg-white/5 hover:bg-white/10 text-white font-semibold transition-all"
                                    >
                                        <Map className="size-4 mr-2" />
                                        Xem Bản Đồ Cứu Trợ
                                    </Button>
                                </Link>
                            </div>

                            {/* Features list highlight */}
                            <div className="flex flex-wrap gap-x-6 gap-y-3 mt-4 border-t border-white/10 pt-6">
                                <div
                                    className="flex items-center gap-2 text-sm text-slate-200"
                                    data-aos="fade-up"
                                    data-aos-delay="250"
                                >
                                    <Check className="size-4 text-emerald-400 stroke-[3]" />
                                    <span>Định vị tọa độ GPS</span>
                                </div>
                                <div
                                    className="flex items-center gap-2 text-sm text-slate-200"
                                    data-aos="fade-up"
                                    data-aos-delay="300"
                                >
                                    <Check className="size-4 text-emerald-400 stroke-[3]" />
                                    <span>Đồng bộ Live bản đồ</span>
                                </div>
                                <div
                                    className="flex items-center gap-2 text-sm text-slate-200"
                                    data-aos="fade-up"
                                    data-aos-delay="350"
                                >
                                    <Check className="size-4 text-emerald-400 stroke-[3]" />
                                    <span>Phản ứng nhanh 24/7</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── CORE FEATURES SECTION ── */}
            <section id="features" className="py-20 md:py-24">
                <div className="mx-auto max-w-7xl px-6 md:px-8">
                    {/* Section Title */}
                    <div
                        className="mx-auto max-w-3xl text-center flex flex-col gap-3"
                        data-aos="fade-up"
                    >
                        <span className="text-sm font-bold uppercase tracking-wider text-emerald-600">
                            Mô hình phối hợp ứng cứu
                        </span>
                        <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-slate-900">
                            Giải pháp liên kết 4 thành phần chính
                        </h2>
                        <p className="text-slate-500 text-sm md:text-base">
                            Chúng tôi xây dựng các phân hệ giao diện trực quan,
                            dễ dàng sử dụng cho cả người dân lẫn lực lượng ứng
                            cứu chuyên nghiệp.
                        </p>
                    </div>

                    {/* Interactive Roles Tabs */}
                    <div className="mt-12 flex flex-col items-center">
                        {/* Tab Triggers */}
                        <div
                            className="inline-flex flex-wrap justify-center rounded-xl bg-slate-100 p-1 border border-slate-200 max-w-full mb-8"
                            data-aos="fade-up"
                            data-aos-delay="100"
                        >
                            {[
                                {
                                    id: 'citizen',
                                    label: 'Người dân',
                                    icon: MapPin,
                                },
                                {
                                    id: 'dispatcher',
                                    label: 'Điều phối',
                                    icon: Activity,
                                },
                                {
                                    id: 'commander',
                                    label: 'Chỉ huy',
                                    icon: Shield,
                                },
                                {
                                    id: 'rescuer',
                                    label: 'Cứu nạn',
                                    icon: Zap,
                                },
                            ].map(tab => {
                                const Icon = tab.icon
                                const isActive = activeTab === tab.id
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() =>
                                            setActiveTab(tab.id as any)
                                        }
                                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                                            isActive
                                                ? 'bg-white text-emerald-700 shadow-sm border border-slate-200'
                                                : 'text-slate-500 hover:text-emerald-600'
                                        }`}
                                    >
                                        <Icon className="size-4" />
                                        {tab.label}
                                    </button>
                                )
                            })}
                        </div>

                        {/* Tab Content Card */}
                        <div
                            className="w-full max-w-4xl"
                            data-aos="fade-up"
                            data-aos-delay="200"
                        >
                            {activeTab === 'citizen' && (
                                <Card className="border-slate-200 bg-white shadow-md">
                                    <CardContent className="p-6 md:p-8 flex flex-col md:flex-row gap-8 items-center">
                                        <div className="flex-1 flex flex-col gap-4">
                                            <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-100 max-w-fit font-bold">
                                                Giao diện người dân
                                            </Badge>
                                            <h3 className="text-xl md:text-2xl font-bold text-slate-900">
                                                Gửi vị trí SOS khẩn cấp trong
                                                vài giây
                                            </h3>
                                            <p className="text-slate-600 text-sm md:text-base leading-relaxed">
                                                Giao diện tối giản dành cho
                                                người dân trong trường hợp nguy
                                                kịch. Tự động thu thập tọa độ
                                                định vị GPS chính xác của thiết
                                                bị, cho phép tải lên hình ảnh mô
                                                tả hiện trạng và theo dõi trạng
                                                thái tiếp nhận cứu trợ.
                                            </p>
                                            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-600 text-sm mt-1">
                                                <li className="flex items-center gap-2">
                                                    <CheckCircle className="size-4 text-emerald-600 shrink-0" />{' '}
                                                    Tự động lấy tọa độ GPS
                                                </li>
                                                <li className="flex items-center gap-2">
                                                    <CheckCircle className="size-4 text-emerald-600 shrink-0" />{' '}
                                                    Tải ảnh hiện trường sự cố
                                                </li>
                                                <li className="flex items-center gap-2">
                                                    <CheckCircle className="size-4 text-emerald-600 shrink-0" />{' '}
                                                    Theo dõi tiến trình ứng cứu
                                                </li>
                                                <li className="flex items-center gap-2">
                                                    <CheckCircle className="size-4 text-emerald-600 shrink-0" />{' '}
                                                    Giao diện nút nhấn SOS cực
                                                    lớn
                                                </li>
                                            </ul>
                                            <div className="pt-2">
                                                <Link href="/sos">
                                                    <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
                                                        Gửi thử SOS khẩn cấp
                                                    </Button>
                                                </Link>
                                            </div>
                                        </div>
                                        <div className="flex-1 w-full max-w-[340px] aspect-[4/3] rounded-xl border border-slate-200 bg-slate-50 p-6 flex flex-col justify-between shadow-sm relative overflow-hidden">
                                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                                                    SOS PHONE MOCKUP
                                                </span>
                                                <span className="flex h-2 w-2 relative">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                                </span>
                                            </div>
                                            <div className="my-3 flex flex-col items-center gap-3">
                                                <div className="size-14 rounded-full bg-red-100 border border-red-200 flex items-center justify-center">
                                                    <PhoneCall className="size-7 text-red-600" />
                                                </div>
                                                <span className="text-xs font-bold text-slate-700">
                                                    Đang chuẩn bị gửi tọa độ cứu
                                                    trợ...
                                                </span>
                                                <span className="text-[10px] text-slate-400 font-mono">
                                                    Vĩ độ: 16.0544 - Kinh độ:
                                                    108.2022
                                                </span>
                                            </div>
                                            <div className="h-8 bg-emerald-50 border border-emerald-100 rounded flex items-center justify-center text-xs text-emerald-700 font-bold">
                                                Đã kết nối với Trung Tâm Cứu Hộ
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {activeTab === 'dispatcher' && (
                                <Card className="border-slate-200 bg-white shadow-md">
                                    <CardContent className="p-6 md:p-8 flex flex-col md:flex-row gap-8 items-center">
                                        <div className="flex-1 flex flex-col gap-4">
                                            <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-100 max-w-fit font-bold">
                                                Giao diện điều phối
                                            </Badge>
                                            <h3 className="text-xl md:text-2xl font-bold text-slate-900">
                                                Bảng điều phối sự cố tích hợp
                                            </h3>
                                            <p className="text-slate-600 text-sm md:text-base leading-relaxed">
                                                Phục vụ điều phối viên trung
                                                tâm. Tiếp nhận toàn bộ các cuộc
                                                gọi SOS từ người dân, hỗ trợ
                                                phân loại mức độ khẩn cấp, hiển
                                                thị vị trí trên bản đồ lớn và
                                                phân công nhiệm vụ cứu nạn cho
                                                đội cứu hộ nhanh nhất.
                                            </p>
                                            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-600 text-sm mt-1">
                                                <li className="flex items-center gap-2">
                                                    <CheckCircle className="size-4 text-emerald-600 shrink-0" />{' '}
                                                    Xử lý cuộc gọi SOS thời gian
                                                    thực
                                                </li>
                                                <li className="flex items-center gap-2">
                                                    <CheckCircle className="size-4 text-emerald-600 shrink-0" />{' '}
                                                    Phân công đội cứu hộ chỉ với
                                                    2 click
                                                </li>
                                                <li className="flex items-center gap-2">
                                                    <CheckCircle className="size-4 text-emerald-600 shrink-0" />{' '}
                                                    Lọc tìm kiếm địa phương
                                                    thông minh
                                                </li>
                                                <li className="flex items-center gap-2">
                                                    <CheckCircle className="size-4 text-emerald-600 shrink-0" />{' '}
                                                    Biểu đồ theo dõi năng lực
                                                    ứng cứu
                                                </li>
                                            </ul>
                                            <div className="pt-2">
                                                <Link href="/login">
                                                    <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
                                                        Đăng nhập điều phối
                                                    </Button>
                                                </Link>
                                            </div>
                                        </div>
                                        <div className="flex-1 w-full max-w-[340px] aspect-[4/3] rounded-xl border border-slate-200 bg-slate-50 p-4 flex flex-col justify-between shadow-sm">
                                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                                <span className="text-[10px] text-slate-500 font-bold">
                                                    Yêu cầu chờ điều phối
                                                </span>
                                                <Badge className="bg-red-50 text-red-700 border-red-100 text-[10px]">
                                                    Mới nhận
                                                </Badge>
                                            </div>
                                            <div className="flex-1 flex flex-col gap-2 my-2 overflow-y-auto">
                                                <div className="p-2 bg-white rounded border border-slate-200 flex flex-col gap-0.5">
                                                    <span className="text-[11px] font-bold text-slate-800">
                                                        #SOS-9811: Ngập sâu cô
                                                        lập
                                                    </span>
                                                    <span className="text-[9px] text-slate-400">
                                                        Vị trí: Huyện Hòa Vang,
                                                        Đà Nẵng
                                                    </span>
                                                </div>
                                                <div className="p-2 bg-emerald-50/50 rounded border border-emerald-100 flex flex-col gap-0.5">
                                                    <span className="text-[11px] font-bold text-emerald-800">
                                                        #SOS-9810: Tai nạn xe
                                                        khách
                                                    </span>
                                                    <span className="text-[9px] text-emerald-600">
                                                        Đang ứng cứu - Đội 3
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="text-[10px] text-slate-400 text-center font-mono">
                                                Trực tuyến: 3 Điều phối viên
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {activeTab === 'commander' && (
                                <Card className="border-slate-200 bg-white shadow-md">
                                    <CardContent className="p-6 md:p-8 flex flex-col md:flex-row gap-8 items-center">
                                        <div className="flex-1 flex flex-col gap-4">
                                            <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-100 max-w-fit font-bold">
                                                Giao diện chỉ huy
                                            </Badge>
                                            <h3 className="text-xl md:text-2xl font-bold text-slate-900">
                                                Giám sát tổng thể & Quản lý nhân
                                                sự
                                            </h3>
                                            <p className="text-slate-600 text-sm md:text-base leading-relaxed">
                                                Phân hệ dành cho chỉ huy, ban
                                                điều hành hoặc các tổ chức từ
                                                thiện. Theo dõi mật độ sự cố
                                                toàn vùng, quản lý danh sách đội
                                                cứu trợ, kiểm kho vật tư, phương
                                                tiện dự phòng và phân tích hiệu
                                                quả chiến dịch ứng cứu.
                                            </p>
                                            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-600 text-sm mt-1">
                                                <li className="flex items-center gap-2">
                                                    <CheckCircle className="size-4 text-emerald-600 shrink-0" />{' '}
                                                    Quản lý danh sách đội cứu
                                                    nạn
                                                </li>
                                                <li className="flex items-center gap-2">
                                                    <CheckCircle className="size-4 text-emerald-600 shrink-0" />{' '}
                                                    Giám sát lộ trình di chuyển
                                                    trực tiếp
                                                </li>
                                                <li className="flex items-center gap-2">
                                                    <CheckCircle className="size-4 text-emerald-600 shrink-0" />{' '}
                                                    Thống kê vật tư & nhu yếu
                                                    phẩm
                                                </li>
                                                <li className="flex items-center gap-2">
                                                    <CheckCircle className="size-4 text-emerald-600 shrink-0" />{' '}
                                                    Trích xuất báo cáo tổng kết
                                                    chiến dịch
                                                </li>
                                            </ul>
                                            <div className="pt-2">
                                                <Link href="/login">
                                                    <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
                                                        Đăng nhập chỉ huy
                                                    </Button>
                                                </Link>
                                            </div>
                                        </div>
                                        <div className="flex-1 w-full max-w-[340px] aspect-[4/3] rounded-xl border border-slate-200 bg-slate-50 p-4 flex flex-col justify-between shadow-sm">
                                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                                <span className="text-[10px] text-slate-500 font-bold">
                                                    Tổng quan tài nguyên cứu nạn
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 my-2">
                                                <div className="bg-white p-2 rounded border border-slate-200 text-center">
                                                    <span className="text-[9px] text-slate-400 uppercase tracking-wider block">
                                                        Nhân sự
                                                    </span>
                                                    <span className="text-base font-bold text-slate-800">
                                                        45 chiến sĩ
                                                    </span>
                                                </div>
                                                <div className="bg-white p-2 rounded border border-slate-200 text-center">
                                                    <span className="text-[9px] text-slate-400 uppercase tracking-wider block">
                                                        Xuồng máy
                                                    </span>
                                                    <span className="text-base font-bold text-emerald-600">
                                                        8 chiếc
                                                    </span>
                                                </div>
                                                <div className="bg-white p-2 rounded border border-slate-200 text-center">
                                                    <span className="text-[9px] text-slate-400 uppercase tracking-wider block">
                                                        Áo phao
                                                    </span>
                                                    <span className="text-base font-bold text-slate-800">
                                                        350 cái
                                                    </span>
                                                </div>
                                                <div className="bg-white p-2 rounded border border-slate-200 text-center">
                                                    <span className="text-[9px] text-slate-400 uppercase tracking-wider block">
                                                        Hoàn thành
                                                    </span>
                                                    <span className="text-base font-bold text-emerald-600">
                                                        124 vụ
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="text-[10px] text-slate-400 text-center font-mono">
                                                Báo cáo mới nhất: 5 phút trước
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {activeTab === 'rescuer' && (
                                <Card className="border-slate-200 bg-white shadow-md">
                                    <CardContent className="p-6 md:p-8 flex flex-col md:flex-row gap-8 items-center">
                                        <div className="flex-1 flex flex-col gap-4">
                                            <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-100 max-w-fit font-bold">
                                                Giao diện cứu hộ
                                            </Badge>
                                            <h3 className="text-xl md:text-2xl font-bold text-slate-900">
                                                Dành riêng cho các đội cứu hộ
                                                thực địa
                                            </h3>
                                            <p className="text-slate-600 text-sm md:text-base leading-relaxed">
                                                Giao diện hiển thị rõ ràng trên
                                                điện thoại của đội viên cứu hộ.
                                                Cung cấp chỉ đường nhanh nhất
                                                trên bản đồ tránh các tuyến
                                                đường ngập sâu, cập nhật tiến độ
                                                công tác ứng cứu và báo cáo trực
                                                tiếp hình ảnh sau khi hoàn
                                                thành.
                                            </p>
                                            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-600 text-sm mt-1">
                                                <li className="flex items-center gap-2">
                                                    <CheckCircle className="size-4 text-emerald-600 shrink-0" />{' '}
                                                    Bản đồ dẫn đường khẩn cấp
                                                </li>
                                                <li className="flex items-center gap-2">
                                                    <CheckCircle className="size-4 text-emerald-600 shrink-0" />{' '}
                                                    Báo cáo trạng thái ca cứu hộ
                                                    tức thời
                                                </li>
                                                <li className="flex items-center gap-2">
                                                    <CheckCircle className="size-4 text-emerald-600 shrink-0" />{' '}
                                                    Cập nhật GPS liên tục gửi về
                                                    bộ chỉ huy
                                                </li>
                                                <li className="flex items-center gap-2">
                                                    <CheckCircle className="size-4 text-emerald-600 shrink-0" />{' '}
                                                    Đơn giản, dễ bấm khi thao
                                                    tác dưới nước
                                                </li>
                                            </ul>
                                            <div className="pt-2">
                                                <Link href="/login">
                                                    <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
                                                        Đăng nhập thực địa
                                                    </Button>
                                                </Link>
                                            </div>
                                        </div>
                                        <div className="flex-1 w-full max-w-[340px] aspect-[4/3] rounded-xl border border-slate-200 bg-slate-50 p-4 flex flex-col justify-between shadow-sm">
                                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                                <span className="text-[10px] text-slate-500 font-bold">
                                                    Thông tin nhiệm vụ hiện tại
                                                </span>
                                                <Badge className="bg-amber-50 text-amber-700 border-amber-100 text-[10px]">
                                                    Đang ứng cứu
                                                </Badge>
                                            </div>
                                            <div className="my-2 bg-white p-3 rounded border border-slate-200 flex flex-col gap-1">
                                                <span className="text-xs font-bold text-slate-800">
                                                    Sự cố: Người già kẹt mái nhà
                                                </span>
                                                <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                                                    <MapPin className="size-3" />{' '}
                                                    Cách vị trí bạn: 450 mét
                                                </span>
                                            </div>
                                            <div className="text-[10px] text-slate-400 text-center font-mono">
                                                GPS Tracking: BẬT - Tín hiệu Tốt
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* ── ABOUT THE THESIS PROJECT SECTION ── */}
            <section
                id="project"
                className="relative bg-white border-t border-b border-slate-200/60 py-20 md:py-24"
            >
                <div className="mx-auto max-w-7xl px-6 md:px-8">
                    <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
                        {/* Left Graphic Grid */}
                        <div
                            className="lg:col-span-5 flex flex-col gap-6 order-2 lg:order-1"
                            data-aos="fade-right"
                        >
                            <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50 shadow-sm flex flex-col gap-4">
                                <h3 className="text-base font-bold text-slate-900 border-b border-slate-200 pb-2">
                                    Nền Tảng Công Nghệ Đồ Án
                                </h3>

                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        {
                                            name: 'Next.js 16 (React 19)',
                                            desc: 'Tối ưu hóa Server & Client',
                                        },
                                        {
                                            name: 'Tailwind CSS v4',
                                            desc: 'Styling hiện đại, mượt mà',
                                        },
                                        {
                                            name: 'Leaflet Map GIS',
                                            desc: 'Bản đồ số không gian địa lý',
                                        },
                                        {
                                            name: '.NET 10 / ASP.NET API',
                                            desc: 'Kiến trúc máy chủ Clean Architecture',
                                        },
                                        {
                                            name: 'SQL Server Database',
                                            desc: 'Lưu trữ dữ liệu tin cậy, nhất quán',
                                        },
                                        {
                                            name: 'SignalR Real-time',
                                            desc: 'Đồng bộ trạng thái và định vị thực tế',
                                        },
                                    ].map((tech, index) => (
                                        <div
                                            key={tech.name}
                                            data-aos="zoom-in"
                                            data-aos-delay={index * 100}
                                            className="p-3 rounded-lg bg-white border border-slate-200 flex flex-col gap-0.5"
                                        >
                                            <span className="text-xs font-bold text-emerald-700">
                                                {tech.name}
                                            </span>
                                            <span className="text-[10px] text-slate-500 leading-none">
                                                {tech.desc}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Right Text Context */}
                        <div
                            className="lg:col-span-7 flex flex-col gap-5 order-1 lg:order-2"
                            data-aos="fade-left"
                        >
                            <Badge
                                variant="secondary"
                                className="max-w-fit bg-emerald-50 text-emerald-700 border border-emerald-100 font-bold hover:bg-emerald-100"
                            >
                                THÔNG TIN VỀ ĐỀ TÀI ĐỒ ÁN
                            </Badge>
                            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-slate-900">
                                Ứng dụng Bản Đồ Số vào quản lý thiên tai & Cứu
                                nạn nhân đạo
                            </h2>
                            <p className="text-slate-600 text-sm md:text-base leading-relaxed">
                                Đồ án tốt nghiệp đại học chuyên ngành Công nghệ
                                thông tin với tên gọi{' '}
                                <strong className="text-slate-900">
                                    "Hệ thống Hỗ trợ Chỉ huy và Điều phối Cứu
                                    nạn Cứu hộ thời gian thực - Rescue System"
                                </strong>{' '}
                                được thiết kế nhằm đóng góp một giải pháp mã
                                nguồn mở hữu ích cho xã hội.
                            </p>
                            <p className="text-slate-600 text-sm md:text-base leading-relaxed">
                                Hệ thống tập trung giải quyết bài toán đồng bộ
                                thông tin cứu nạn tức thời, khắc phục nhược điểm
                                của các kênh truyền thống bị nghẽn mạng hoặc
                                thiếu dữ liệu toạ độ GPS khi xảy ra lũ lụt, bão
                                lũ hay tai nạn nghiêm trọng.
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                                <div
                                    className="flex gap-3"
                                    data-aos="fade-up"
                                    data-aos-delay="100"
                                >
                                    <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                                        <Layers className="size-3.5" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-semibold text-slate-900">
                                            Kiến trúc tin cậy
                                        </h4>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            Vận hành trơn tru cả trong điều kiện
                                            đường truyền internet yếu.
                                        </p>
                                    </div>
                                </div>
                                <div
                                    className="flex gap-3"
                                    data-aos="fade-up"
                                    data-aos-delay="200"
                                >
                                    <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                                        <MapPin className="size-3.5" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-semibold text-slate-900">
                                            Thuật toán dẫn đường thông minh
                                        </h4>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            Hỗ trợ tìm tuyến đường ngắn nhất,
                                            tránh vùng ngập lũ cô lập.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── DEVELOPMENT TEAM SECTION ── */}
            <section id="team" className="py-20 md:py-24">
                <div className="mx-auto max-w-7xl px-6 md:px-8">
                    {/* Header */}
                    <div
                        className="mx-auto max-w-3xl text-center flex flex-col gap-3"
                        data-aos="fade-up"
                    >
                        <span className="text-sm font-bold uppercase tracking-wider text-emerald-600">
                            Đội ngũ phát triển
                        </span>
                        <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-slate-900">
                            Nhóm nghiên cứu và thực hiện đồ án
                        </h2>
                        <p className="text-slate-500 text-sm md:text-base">
                            Chúng tôi gồm 3 thành viên lớp Công nghệ phần mềm
                            thiết kế và xây dựng giải pháp cứu hộ Rescue System
                            từ đầu.
                        </p>
                    </div>
                    {/* Team Cards Grid */}
                    <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3 justify-center">
                        {[
                            {
                                name: 'Nguyễn Minh Chiến',
                                role: 'Backend & Infrastructure Developer',
                                avatarInitials: 'MC',
                                imageUrl: '/mc.jpg',
                                objectPosition: 'center 15%',
                                desc: 'Xây dựng kiến trúc máy chủ dựa trên Clean Architecture với .NET 10 & ASP.NET Core Web API, thiết kế CSDL SQL Server, bảo mật bằng JWT & Identity, và quản lý triển khai Docker.',
                                skills: [
                                    '.NET 10',
                                    'ASP.NET Core',
                                    'SQL Server',
                                    'Clean Architecture',
                                    'SignalR',
                                    'Docker',
                                ],
                                avatarBg: 'bg-emerald-600',
                            },
                            {
                                name: 'Nguyễn Lê Đình Diệu',
                                role: 'UI/UX Designer & Frontend Developer',
                                avatarInitials: 'DD',
                                imageUrl: '/dieu.png',
                                desc: 'Thiết kế toàn bộ trải nghiệm UI/UX , phát triển giao diện Next.js, xây dựng các phân hệ dashboard cho Dispatcher, Commander và trang Landing Page.',
                                skills: [
                                    'Next.js',
                                    'React 19',
                                    'Tailwind CSS',
                                    'Framer Motion',
                                    'Figma',
                                ],
                                avatarBg: 'bg-teal-600',
                            },
                            {
                                name: 'Võ Ngọc Cư',
                                role: 'Backend Developer & GIS',
                                avatarInitials: 'NC',
                                imageUrl: '/nc.jpg',
                                desc: 'Phát triển hệ thống theo kiến trúc Clean Architecture và tích hợp các thành phần GIS.',
                                skills: [
                                    '.NET 10',
                                    'ASP.NET Core',
                                    'SQL Server',
                                    'Clean Architecture',
                                    'Leaflet Map',
                                    'GeoJSON',
                                    'TypeScript',
                                    'Vite',
                                ],
                                avatarBg: 'bg-green-600',
                            },
                        ].map((member, index) => (
                            <Card
                                key={member.name}
                                data-aos="fade-up"
                                data-aos-delay={index * 150}
                                className="border-slate-200 bg-white hover:border-emerald-300 hover:shadow-md transition-all duration-300 flex flex-col overflow-hidden justify-between pt-0 pb-0"
                            >
                                <TeamMemberHeader member={member} />
                                <CardContent className="p-6 md:p-8 flex flex-col gap-5 flex-1 justify-between">
                                    <div className="flex flex-col gap-4">
                                        {/* Title & Role */}
                                        <div className="flex flex-col">
                                            <h4 className="text-base font-bold text-slate-900 leading-tight">
                                                {member.name}
                                            </h4>
                                            <p className="text-xs text-emerald-700 font-semibold mt-1">
                                                {member.role}
                                            </p>
                                        </div>

                                        {/* Description */}
                                        <p className="text-slate-600 text-xs md:text-sm leading-relaxed">
                                            {member.desc}
                                        </p>
                                    </div>

                                    {/* Skill Badges */}
                                    <div className="flex flex-wrap gap-1.5 pt-3 border-t border-slate-100">
                                        {member.skills.map(skill => (
                                            <Badge
                                                key={skill}
                                                variant="outline"
                                                className="text-[10px] px-2 py-0.5 border-slate-200 bg-slate-50 text-slate-600"
                                            >
                                                {skill}
                                            </Badge>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── SUPPORT & DONATION SECTION ── */}
            <section
                id="support"
                className="bg-[#f0f9f4] border-t border-slate-200/50 py-20 md:py-24"
            >
                <div className="mx-auto max-w-7xl px-6 md:px-8">
                    <div className="mx-auto max-w-4xl rounded-2xl border border-emerald-100 bg-white p-6 md:p-10 shadow-md">
                        <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
                            {/* Left side: Text support */}
                            <div
                                className="flex flex-col gap-4 lg:col-span-7"
                                data-aos="fade-right"
                            >
                                <div className="inline-flex size-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
                                    <Heart className="size-5 fill-emerald-600/10" />
                                </div>

                                <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 leading-tight">
                                    Đồng hành cùng dự án Điều Phối Cứu Hộ
                                </h2>

                                <p className="text-slate-600 text-sm md:text-base leading-relaxed">
                                    Điều phối cứu hộ, cứu nạn là hệ thống quản
                                    lý các hoạt động cứu hộ, cứu nạn, tìm kiếm
                                    cứu nạn, ứng cứu khẩn cấp. Hệ thống được xây
                                    dựng nhằm tối ưu hóa công tác điều phối lực
                                    lượng, phương tiện, trang thiết bị và vật tư
                                    phục vụ công tác tìm kiếm, cứu nạn.
                                </p>

                                <p className="text-slate-600 text-xs md:text-sm italic">
                                    * Mọi đóng góp của bạn đều được công khai
                                    minh bạch trong báo cáo tiến độ đồ án và
                                    dùng 100% để duy trì hạ tầng vận hành thử
                                    nghiệm. Nhóm xin chân thành cảm ơn!
                                </p>

                                {/* Bank details card */}
                                <div className="mt-2 rounded-xl border border-emerald-100 bg-emerald-50/30 p-4 flex flex-col gap-3">
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                                            Ngân hàng thụ hưởng
                                        </span>
                                        <span className="text-xs md:text-sm font-semibold text-slate-800">
                                            {bankDetails.bankName}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center border-t border-emerald-100 pt-2.5">
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                                                Số tài khoản ngân hàng
                                            </span>
                                            <span className="text-sm md:text-base font-bold text-emerald-700 font-mono tracking-wider">
                                                {bankDetails.accountNumber}
                                            </span>
                                        </div>
                                        <Button
                                            onClick={copyToClipboard}
                                            variant="outline"
                                            size="sm"
                                            className="h-8 border-emerald-200 hover:border-emerald-400 text-emerald-700 hover:bg-emerald-50 font-semibold"
                                        >
                                            {copied ? (
                                                <Check className="size-3.5 mr-1 text-emerald-600" />
                                            ) : (
                                                <Copy className="size-3.5 mr-1" />
                                            )}
                                            {copied
                                                ? 'Đã sao chép'
                                                : 'Sao chép số tài khoản'}
                                        </Button>
                                    </div>
                                    <div className="flex flex-col gap-0.5 border-t border-emerald-100 pt-2.5">
                                        <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
                                            <div>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">
                                                    Tên người nhận
                                                </span>
                                                <span className="text-xs md:text-sm font-semibold text-slate-800">
                                                    {bankDetails.accountName}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">
                                                    Nội dung chuyển khoản
                                                </span>
                                                <span className="text-xs md:text-sm font-bold text-slate-700 font-mono">
                                                    {bankDetails.memo}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right side: QR Code display */}
                            <div
                                className="flex flex-col items-center justify-center lg:col-span-5 bg-slate-50 p-6 rounded-xl border border-slate-200"
                                data-aos="fade-left"
                                data-aos-delay="200"
                            >
                                <div className="relative rounded-xl border border-slate-300 bg-white p-3 shadow-sm max-w-[200px] w-full aspect-square">
                                    <div className="relative w-full h-full">
                                        <Image
                                            src="/qr_donation.png"
                                            alt="QR Code Ủng Hộ Đồ Án Rescue System"
                                            fill
                                            className="object-contain"
                                        />
                                    </div>
                                </div>
                                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-widest mt-4 text-center">
                                    Quét Mã QR Ủng Hộ VietQR
                                </span>
                                <span className="text-[10px] text-slate-400 mt-1 text-center max-w-[200px]">
                                    Hỗ trợ nhanh qua mọi ví điện tử và ứng dụng
                                    ngân hàng di động
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── FOOTER SECTION ── */}
            <footer className="bg-slate-900 py-12 text-slate-400 text-xs border-t border-slate-800">
                <div className="mx-auto max-w-7xl px-6 md:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
                    {/* Copyright info */}
                    <div
                        className="flex flex-col items-center md:items-start gap-1.5"
                        data-aos="fade-up"
                    >
                        <div className="flex items-center gap-2 group">
                            <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm">
                                <LifeBuoy className="size-4 stroke-[2.5] transition-transform duration-500 group-hover:rotate-45" />
                            </div>
                            <span className="text-sm font-black text-white tracking-wider">
                                Rescue<span className="text-emerald-500">System</span>
                            </span>
                        </div>
                        <p className="text-slate-500 text-center md:text-left">
                            © {new Date().getFullYear()} Rescue System. Đồ án
                            tốt nghiệp đại học phi lợi nhuận.
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div
                        className="flex items-center gap-6 font-semibold"
                        data-aos="fade-up"
                        data-aos-delay="100"
                    >
                        <Link
                            href="/sos"
                            className="hover:text-emerald-400 transition-colors"
                        >
                            SOS
                        </Link>
                        <Link
                            href="/map"
                            className="hover:text-emerald-400 transition-colors"
                        >
                            Bản đồ cứu trợ
                        </Link>
                        <Link
                            href="/login"
                            className="hover:text-emerald-400 transition-colors"
                        >
                            Đăng nhập
                        </Link>
                        <Link
                            href="/register"
                            className="hover:text-emerald-400 transition-colors"
                        >
                            Đăng ký thành viên
                        </Link>
                    </div>
                </div>
            </footer>
        </div>
    )
}
