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
    ChevronLeft,
    ChevronRight,
    Copy,
    Heart,
    LifeBuoy,
    Map,
    MapPin,
    Menu,
    Radio,
    Shield,
    X,
    Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { UserAccountMenu } from '@/components/shared/UserAccountMenu'

const GithubIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
    >
        <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
        <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
)

export default function LandingPage() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [copied, setCopied] = useState(false)
    const [currentSlide, setCurrentSlide] = useState(0)

    const heroSlides = [
        {
            image: '/slider14.png',
            title: 'Bản đồ',
            subtitle:
                'Bản đồ trực quan hiển thị vị trí sự cố và đội cứu hộ thời gian thực.',
        },
        {
            image: '/slider2.png',
            title: 'Cổng thông tin người dân',
            subtitle:
                'Gửi yêu cầu cứu nạn khẩn cấp và cập nhật trạng thái cứu hộ.',
        },
        {
            image: '/slider3.png',
            title: 'Chi tiết cứu hộ',
            subtitle: 'Có thể xem chi tiết các yêu cầu cứu hộ xung quanh',
        },
    ]

    useEffect(() => {
        AOS.init({
            duration: 800,
            easing: 'ease-out-cubic',
            once: true,
            offset: 40,
        })
    }, [])

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide(prev => (prev + 1) % heroSlides.length)
        }, 5000)
        return () => clearInterval(timer)
    }, [heroSlides.length])

    const nextSlide = () => {
        setCurrentSlide(prev => (prev + 1) % heroSlides.length)
    }

    const prevSlide = () => {
        setCurrentSlide(
            prev => (prev - 1 + heroSlides.length) % heroSlides.length
        )
    }

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
        <div className="min-h-screen bg-slate-50/40 font-sans text-slate-800 selection:bg-emerald-100 selection:text-emerald-900 overflow-x-hidden">
            {/* ── Soft Glow Orbs ── */}
            <div className="absolute top-0 left-1/4 -z-10 h-[500px] w-[500px] rounded-full bg-emerald-100/30 blur-3xl" />
            <div className="absolute top-1/3 right-1/4 -z-10 h-[600px] w-[600px] rounded-full bg-blue-100/20 blur-3xl" />

            {/* ── Header ── */}
            <header className="sticky top-0 z-50 w-full border-b border-slate-200/50 bg-white/70 backdrop-blur-md transition-all">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 md:px-8">
                    {/* Logo */}
                    <Link
                        href="/"
                        className="flex items-center gap-2.5 hover:opacity-90 transition-opacity group"
                    >
                        <div className="relative flex size-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-600/10">
                            <LifeBuoy className="size-5 stroke-[2.2] transition-transform duration-500 group-hover:rotate-90" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[15px] font-black tracking-tight leading-none text-slate-900">
                                Rescue
                                <span className="text-emerald-600">System</span>
                            </span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.15em] leading-none mt-1">
                                Hỗ trợ & Điều phối cứu nạn
                            </span>
                        </div>
                    </Link>

                    {/* Desktop Navigation Links */}
                    <nav className="hidden md:flex items-center gap-8">
                        <Link
                            href="#solution"
                            className="text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-emerald-600 transition-colors"
                        >
                            Giải pháp
                        </Link>
                        <Link
                            href="#project"
                            className="text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-emerald-600 transition-colors"
                        >
                            Đồ án
                        </Link>
                        <Link
                            href="#team"
                            className="text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-emerald-600 transition-colors"
                        >
                            Đội ngũ
                        </Link>
                        <Link
                            href="#support"
                            className="text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-emerald-600 transition-colors"
                        >
                            Ủng hộ
                        </Link>
                    </nav>

                    {/* Header Actions */}
                    <div className="flex items-center gap-3">
                        <Link href="/map">
                            <Button className="hidden sm:inline-flex bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider h-10 px-5 shadow-sm transition-all rounded-xl cursor-pointer">
                                Bản đồ trực tuyến
                                <ArrowRight className="size-4 ml-1.5" />
                            </Button>
                        </Link>
                        <UserAccountMenu showLoginWhenGuest avatarSize="md" />

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="flex items-center justify-center p-2 rounded-lg text-slate-500 hover:text-emerald-600 md:hidden cursor-pointer"
                            aria-label={
                                mobileMenuOpen ? 'Đóng menu' : 'Mở menu'
                            }
                        >
                            {mobileMenuOpen ? (
                                <X className="size-5" />
                            ) : (
                                <Menu className="size-5" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Mobile Navigation Dropdown */}
                {mobileMenuOpen && (
                    <div className="md:hidden border-b border-slate-200 bg-white py-4 px-6 flex flex-col gap-3 shadow-md animate-in fade-in slide-in-from-top-5 duration-200">
                        <Link
                            href="#solution"
                            onClick={() => setMobileMenuOpen(false)}
                            className="text-sm font-bold uppercase tracking-wider text-slate-600 hover:text-emerald-600 py-2 border-b border-slate-100"
                        >
                            Giải pháp
                        </Link>
                        <Link
                            href="#project"
                            onClick={() => setMobileMenuOpen(false)}
                            className="text-sm font-bold uppercase tracking-wider text-slate-600 hover:text-emerald-600 py-2 border-b border-slate-100"
                        >
                            Đồ án
                        </Link>
                        <Link
                            href="#team"
                            onClick={() => setMobileMenuOpen(false)}
                            className="text-sm font-bold uppercase tracking-wider text-slate-600 hover:text-emerald-600 py-2 border-b border-slate-100"
                        >
                            Đội ngũ
                        </Link>
                        <Link
                            href="#support"
                            onClick={() => setMobileMenuOpen(false)}
                            className="text-sm font-bold uppercase tracking-wider text-slate-600 hover:text-emerald-600 py-2 border-b border-slate-100"
                        >
                            Ủng hộ
                        </Link>
                        <div className="flex flex-col gap-2 pt-2">
                            <Link
                                href="/map"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider h-10 shadow-md">
                                    Bản đồ trực tuyến
                                    <ArrowRight className="size-4 ml-1.5" />
                                </Button>
                            </Link>
                        </div>
                    </div>
                )}
            </header>

            {/* ── HERO SECTION ── */}
            <section className="relative py-16 md:py-24 overflow-hidden">
                <div className="mx-auto max-w-7xl px-6 md:px-8 w-full">
                    <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
                        {/* Left Info Column */}
                        <div className="lg:col-span-6 flex flex-col gap-6 text-left">
                            <div
                                className="inline-flex max-w-fit items-center gap-2 rounded-full bg-emerald-50 border border-emerald-100 px-3.5 py-1.5 text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider shadow-2xs"
                                data-aos="fade-up"
                            >
                                <Heart className="size-3 fill-emerald-600 text-emerald-600" />
                                <span>Đồ án Công nghệ phần mềm</span>
                            </div>

                            <h1
                                className="text-4xl font-black leading-[1.1] tracking-tight sm:text-5xl md:text-6xl text-slate-900"
                                data-aos="fade-up"
                                data-aos-delay="100"
                            >
                                Cứu Hộ Khẩn Cấp.
                                <br />
                                <span className="text-emerald-600">
                                    Phản Ứng Tức Thì.
                                </span>
                            </h1>

                            <p
                                className="text-sm md:text-base leading-relaxed text-slate-505 max-w-lg font-medium"
                                data-aos="fade-up"
                                data-aos-delay="150"
                            >
                                Nền tảng kết nối trực tiếp người dân gặp nạn với
                                lực lượng cứu hộ và điều phối viên theo thời
                                gian thực trên bản đồ số, tối ưu hóa quy trình
                                phản ứng nhanh trong các tình huống khẩn cấp.
                            </p>

                            <div
                                className="flex flex-wrap gap-4 pt-2"
                                data-aos="fade-up"
                                data-aos-delay="200"
                            >
                                <Link href="/sos">
                                    <Button className="h-12 px-6 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md shadow-rose-600/10 active:scale-[0.98] transition-all cursor-pointer relative overflow-hidden group">
                                        <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <Radio className="size-4 mr-2 animate-pulse" />
                                        SOS khẩn cấp
                                    </Button>
                                </Link>
                                <Link href="/map">
                                    <Button
                                        variant="outline"
                                        className="h-12 px-6 border-slate-200 hover:border-emerald-505 bg-white hover:bg-emerald-50/30 text-slate-700 hover:text-emerald-700 font-bold text-xs uppercase tracking-wider rounded-xl active:scale-[0.98] transition-all cursor-pointer"
                                    >
                                        <Map className="size-4 mr-2" />
                                        Bản đồ cứu trợ
                                    </Button>
                                </Link>
                            </div>
                        </div>

                        {/* Right Slider Column */}
                        <div
                            className="lg:col-span-6 flex flex-col gap-3"
                            data-aos="fade-left"
                            data-aos-delay="200"
                        >
                            <div className="relative w-full aspect-[16/10] rounded-2xl overflow-hidden border border-slate-200/60 bg-white shadow-lg group">
                                {/* Slides */}
                                <div className="relative w-full h-full">
                                    {heroSlides.map((slide, index) => (
                                        <div
                                            key={index}
                                            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                                                index === currentSlide
                                                    ? 'opacity-100 z-10'
                                                    : 'opacity-0 z-0'
                                            }`}
                                        >
                                            <Image
                                                src={slide.image}
                                                alt={slide.title}
                                                fill
                                                className="object-cover object-top"
                                                priority={index === 0}
                                            />
                                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/80 via-slate-950/40 to-transparent p-4 pt-12 text-white z-20">
                                                <h4 className="text-xs md:text-sm font-bold">
                                                    {slide.title}
                                                </h4>
                                                <p className="text-[10px] md:text-xs text-slate-200 mt-0.5">
                                                    {slide.subtitle}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Navigation Arrows */}
                                <button
                                    onClick={prevSlide}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 z-30 flex size-9 items-center justify-center rounded-full border border-white/10 bg-black/30 hover:bg-black/50 text-white backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer transition-colors"
                                    aria-label="Slide trước"
                                >
                                    <ChevronLeft className="size-5" />
                                </button>
                                <button
                                    onClick={nextSlide}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 z-30 flex size-9 items-center justify-center rounded-full border border-white/10 bg-black/30 hover:bg-black/50 text-white backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer transition-colors"
                                    aria-label="Slide tiếp theo"
                                >
                                    <ChevronRight className="size-5" />
                                </button>

                                {/* Indicator Dots */}
                                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex gap-1.5">
                                    {heroSlides.map((_, index) => (
                                        <button
                                            key={index}
                                            onClick={() =>
                                                setCurrentSlide(index)
                                            }
                                            className={`h-1.5 rounded-full transition-all cursor-pointer ${
                                                index === currentSlide
                                                    ? 'w-4 bg-emerald-500'
                                                    : 'w-1.5 bg-white/60 hover:bg-white'
                                            }`}
                                            aria-label={`Đến slide ${index + 1}`}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── SOLUTION SECTION ── */}
            <section
                id="solution"
                className="py-20 bg-white border-t border-slate-100"
            >
                <div className="mx-auto max-w-7xl px-6 md:px-8">
                    <div
                        className="mx-auto max-w-2xl text-center flex flex-col gap-3 mb-16"
                        data-aos="fade-up"
                    >
                        <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-600">
                            Mô hình phối hợp
                        </span>
                        <h2 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900">
                            Quy trình liên thông 4 phân hệ
                        </h2>
                        <p className="text-slate-505 text-xs md:text-sm leading-relaxed max-w-lg mx-auto font-medium">
                            Hệ thống tối giản hóa kết nối, truyền tải thông tin
                            định vị và sự cố tức thời giữa người dân và các đơn
                            vị chức năng.
                        </p>
                    </div>

                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        {[
                            {
                                icon: MapPin,
                                title: 'Người dân',
                                color: 'border-emerald-100 bg-emerald-50/30 text-emerald-600',
                                desc: 'Gửi yêu cầu khẩn cấp kèm định vị GPS chuẩn và hình ảnh mô tả hiện trường.',
                            },
                            {
                                icon: Activity,
                                title: 'Điều phối viên',
                                color: 'border-blue-100 bg-blue-50/30 text-blue-600',
                                desc: 'Tiếp nhận, thẩm định và trực tiếp chỉ định sự cố đến các đội cứu hộ phù hợp.',
                            },
                            {
                                icon: Shield,
                                title: 'Chỉ huy hệ thống',
                                color: 'border-indigo-100 bg-indigo-50/30 text-indigo-600',
                                desc: 'Giám sát tài nguyên, duyệt các đội, tổ chức nhân sự các trạm phản ứng nhanh.',
                            },
                            {
                                icon: Zap,
                                title: 'Đội cứu hộ',
                                color: 'border-rose-100 bg-rose-50/30 text-rose-600',
                                desc: 'Nhận thông báo sự vụ, dẫn đường định vị và báo cáo cập nhật trực tiếp tại hiện trường.',
                            },
                        ].map((item, index) => {
                            const Icon = item.icon
                            return (
                                <Card
                                    key={item.title}
                                    data-aos="fade-up"
                                    data-aos-delay={index * 100}
                                    className="border-slate-100 bg-slate-50/40 rounded-2xl hover:border-emerald-200 hover:bg-white hover:shadow-md transition-all duration-300"
                                >
                                    <CardContent className="p-6 flex flex-col gap-4">
                                        <div
                                            className={`flex size-10 items-center justify-center rounded-xl border ${item.color}`}
                                        >
                                            <Icon className="size-5" />
                                        </div>
                                        <h3 className="text-sm font-bold text-slate-900 leading-tight">
                                            {item.title}
                                        </h3>
                                        <p className="text-slate-505 text-xs md:text-sm leading-relaxed font-medium">
                                            {item.desc}
                                        </p>
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                </div>
            </section>

            {/* ── PROJECT & TECH SECTION ── */}
            <section
                id="project"
                className="border-t border-b border-slate-100 bg-slate-50/20 py-20"
            >
                <div className="mx-auto max-w-7xl px-6 md:px-8">
                    <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
                        {/* Left Info Column */}
                        <div
                            className="lg:col-span-6 flex flex-col gap-4"
                            data-aos="fade-right"
                        >
                            <Badge
                                variant="secondary"
                                className="max-w-fit bg-emerald-50 text-emerald-700 border border-emerald-100 font-bold hover:bg-emerald-100 text-[9px] uppercase tracking-wider"
                            >
                                Đề tài nghiên cứu & Ứng dụng
                            </Badge>
                            <h2 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900">
                                Bản đồ số & Dữ liệu thời gian thực
                            </h2>
                            <p className="text-slate-505 text-xs md:text-sm leading-relaxed font-medium">
                                Rescue System là giải pháp thay thế các hình
                                thức chỉ huy truyền thống bằng công nghệ số, hỗ
                                trợ kết nối dữ liệu tin cậy và giao diện tương
                                tác bản đồ tối ưu.
                            </p>
                            <div className="flex gap-3 items-start border-t border-slate-100 pt-5 mt-2">
                                <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100/50">
                                    <Check
                                        className="size-3.5"
                                        strokeWidth={3}
                                    />
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-slate-900">
                                        Dẫn đường & Định vị tối ưu
                                    </h4>
                                    <p className="text-[11px] text-slate-505 mt-0.5 font-medium">
                                        Hiển thị trực tiếp tọa độ người gặp nạn
                                        và hướng di chuyển tốt nhất cho các đội
                                        ứng cứu.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Right Tech Grid */}
                        <div
                            className="lg:col-span-6 grid grid-cols-2 gap-4"
                            data-aos="fade-left"
                        >
                            {[
                                {
                                    name: 'Next.js 16 (React 19)',
                                    desc: 'SSR & Client App',
                                },
                                {
                                    name: '.NET 10 Web API',
                                    desc: 'Backend Clean Architecture',
                                },
                                {
                                    name: 'Leaflet GIS Maps',
                                    desc: 'Bản đồ địa lý tương tác',
                                },
                                {
                                    name: 'SignalR Realtime',
                                    desc: 'Đồng bộ dữ liệu trực tiếp',
                                },
                            ].map(tech => (
                                <div
                                    key={tech.name}
                                    className="p-5 rounded-2xl bg-white border border-slate-100 flex flex-col gap-1 shadow-2xs hover:shadow-xs transition-shadow"
                                >
                                    <span className="text-xs font-black text-emerald-700">
                                        {tech.name}
                                    </span>
                                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                                        {tech.desc}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ── TEAM SECTION ── */}
            <section id="team" className="py-20 bg-white">
                <div className="mx-auto max-w-7xl px-6 md:px-8">
                    <div
                        className="mx-auto max-w-2xl text-center flex flex-col gap-3 mb-16"
                        data-aos="fade-up"
                    >
                        <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-600">
                            Đội ngũ phát triển
                        </span>
                        <h2 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900">
                            Thành viên dự án
                        </h2>
                        <p className="text-slate-505 text-xs md:text-sm leading-relaxed max-w-lg mx-auto font-medium">
                            Nhóm sinh viên ngành Công nghệ thông tin Trường đại
                            học Bách Khoa - Đại học Đà Nẵng
                        </p>
                    </div>

                    <div className="grid gap-6 sm:grid-cols-3">
                        {[
                            {
                                name: 'Nguyễn Minh Chiến',
                                role: 'Backend & Infrastructure',
                                image: '/mc.jpg',
                                desc: 'Kiến trúc máy chủ ASP.NET Web API, cấu hình CSDL SQL Server và hạ tầng Docker.',
                                skills: [
                                    '.NET 10',
                                    'SQL Server',
                                    'SignalR',
                                    'Docker',
                                ],
                            },
                            {
                                name: 'Nguyễn Lê Đình Diệu',
                                role: 'UI/UX & Frontend Developer',
                                image: '/dieu.png',
                                desc: 'Thiết kế và tối ưu giao diện người dùng, xây dựng các tính năng giao diện người dùng của hệ thống. ',
                                skills: [
                                    'Next.js',
                                    'React 19',
                                    'Tailwind',
                                    'Figma',
                                ],
                            },
                            {
                                name: 'Võ Ngọc Cư',
                                role: 'Backend Developer & GIS',
                                image: '/nc.jpg',
                                desc: 'Phát triển các API tích hợp bản đồ số GIS, xuất báo cáo và cấu hình bản đồ Leaflet.',
                                skills: [
                                    '.NET 10',
                                    'Leaflet',
                                    'GeoJSON',
                                    'TypeScript',
                                ],
                            },
                        ].map((m, index) => (
                            <Card
                                key={m.name}
                                data-aos="fade-up"
                                data-aos-delay={index * 100}
                                className="border-slate-100 bg-slate-50/40 rounded-2xl overflow-hidden hover:border-emerald-200 hover:bg-white hover:shadow-md transition-all duration-300 flex flex-col justify-between"
                            >
                                <CardContent className="p-6 flex flex-col gap-5 flex-1 justify-between">
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-4">
                                            <div className="relative size-12 rounded-xl overflow-hidden border border-slate-200/50 bg-slate-100 shadow-2xs shrink-0">
                                                <Image
                                                    src={m.image}
                                                    alt={m.name}
                                                    fill
                                                    className="object-cover"
                                                />
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-bold text-slate-900 leading-tight">
                                                    {m.name}
                                                </h4>
                                                <p className="text-[9px] text-emerald-700 font-extrabold uppercase tracking-wider mt-0.5">
                                                    {m.role}
                                                </p>
                                            </div>
                                        </div>
                                        <p className="text-slate-505 text-xs leading-relaxed font-medium">
                                            {m.desc}
                                        </p>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5 pt-3 border-t border-slate-100">
                                        {m.skills.map(s => (
                                            <Badge
                                                key={s}
                                                variant="outline"
                                                className="text-[8px] px-2 py-0.5 border-slate-200 bg-white text-slate-500 font-bold"
                                            >
                                                {s}
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
                className="bg-slate-50/40 border-t border-slate-100 py-20"
            >
                <div className="mx-auto max-w-7xl px-6 md:px-8">
                    <div className="mx-auto max-w-3xl rounded-3xl border border-slate-100 bg-white p-6 md:p-8 shadow-xs">
                        <div className="grid gap-8 md:grid-cols-12 md:items-center">
                            {/* Left side info */}
                            <div
                                className="flex flex-col gap-4 md:col-span-7"
                                data-aos="fade-right"
                            >
                                <div className="inline-flex size-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100/50">
                                    <Heart className="size-5 fill-emerald-600/10" />
                                </div>
                                <h2 className="text-xl md:text-2xl font-black text-slate-900 leading-tight">
                                    Đồng hành cùng dự án
                                </h2>
                                <p className="text-slate-505 text-xs leading-relaxed font-medium">
                                    Mọi sự đóng góp của quý vị đều được sử dụng
                                    100% để chi trả phí vận hành máy chủ Cloud,
                                    duy trì SignalR realtime và cơ sở dữ liệu
                                    thử nghiệm.
                                </p>

                                <div className="mt-2 rounded-2xl border border-slate-100 bg-slate-50/50 p-4 flex flex-col gap-2.5">
                                    <div className="flex justify-between items-center text-xs">
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-[8px] font-extrabold text-slate-400 uppercase tracking-wider">
                                                Ngân hàng thụ hưởng
                                            </span>
                                            <span className="font-bold text-slate-800">
                                                {bankDetails.bankName}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center border-t border-slate-100 pt-2 text-xs">
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-[8px] font-extrabold text-slate-400 uppercase tracking-wider">
                                                Số tài khoản
                                            </span>
                                            <span className="font-bold text-emerald-700 font-mono">
                                                {bankDetails.accountNumber}
                                            </span>
                                        </div>
                                        <Button
                                            onClick={copyToClipboard}
                                            variant="outline"
                                            size="sm"
                                            className="h-7 border-emerald-200 hover:border-emerald-400 text-emerald-700 hover:bg-emerald-50 font-bold text-[9px] uppercase tracking-wider rounded-lg cursor-pointer"
                                        >
                                            {copied ? (
                                                <Check className="size-3 mr-1 text-emerald-600" />
                                            ) : (
                                                <Copy className="size-3 mr-1" />
                                            )}
                                            Copy STK
                                        </Button>
                                    </div>
                                    <div className="flex justify-between items-center border-t border-slate-100 pt-2 text-xs">
                                        <div>
                                            <span className="text-[8px] font-extrabold text-slate-400 uppercase tracking-wider block">
                                                Người thụ hưởng
                                            </span>
                                            <span className="font-bold text-slate-800">
                                                {bankDetails.accountName}
                                            </span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[8px] font-extrabold text-slate-400 uppercase tracking-wider block">
                                                Nội dung
                                            </span>
                                            <span className="font-mono font-bold text-slate-700">
                                                {bankDetails.memo}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right side QR */}
                            <div
                                className="flex flex-col items-center justify-center md:col-span-5 bg-slate-50 p-6 rounded-2xl border border-slate-100"
                                data-aos="fade-left"
                                data-aos-delay="100"
                            >
                                <div className="relative rounded-xl border border-slate-200 bg-white p-2.5 shadow-2xs max-w-[150px] w-full aspect-square">
                                    <div className="relative w-full h-full">
                                        <Image
                                            src="/qr_donation.png"
                                            alt="QR Code Ủng Hộ Đồ Án Rescue System"
                                            fill
                                            className="object-contain"
                                        />
                                    </div>
                                </div>
                                <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mt-3 text-center">
                                    Quét Mã VietQR
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── FOOTER SECTION ── */}
            <footer className="bg-slate-950 py-12 text-slate-400 text-xs border-t border-slate-800/80 relative overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />

                <div className="mx-auto max-w-7xl px-6 md:px-8 grid gap-10 md:grid-cols-12">
                    {/* Left Column: Logo & Acknowledgement */}
                    <div
                        className="md:col-span-6 flex flex-col gap-4 text-center md:text-left"
                        data-aos="fade-up"
                    >
                        <div className="flex items-center justify-center md:justify-start gap-2.5">
                            <div className="flex size-8 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-600/10">
                                <LifeBuoy className="size-4.5 stroke-[2.2]" />
                            </div>
                            <span className="text-[15px] font-black text-white tracking-wider leading-none">
                                Rescue
                                <span className="text-emerald-500">System</span>
                            </span>
                        </div>
                        <p className="text-slate-400 text-xs leading-relaxed max-w-md">
                            Dự án nghiên cứu và xây dựng giải pháp số hóa điều
                            phối cứu hộ, cứu nạn khẩn cấp. Đặc biệt, nhóm xin
                            gửi lời cảm ơn chân thành đến{' '}
                            <strong className="text-slate-200 font-semibold">
                                Thầy Mai Văn Hà
                            </strong>{' '}
                            đã hỗ trợ, định hướng và đồng hành cùng nhóm trong
                            suốt quá trình hoàn thành đồ án.
                        </p>
                        <p className="text-slate-500 text-[11px] font-medium mt-1">
                            © {new Date().getFullYear()} Rescue System. Đồ án
                            Công nghệ phần mềm.
                        </p>
                    </div>

                    {/* Middle Column: Quick Links */}
                    <div
                        className="md:col-span-3 flex flex-col items-center md:items-start gap-4"
                        data-aos="fade-up"
                        data-aos-delay="100"
                    >
                        <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-300">
                            Hệ thống
                        </h4>
                        <div className="flex flex-col items-center md:items-start gap-2.5 font-bold text-[11px] uppercase tracking-wider text-slate-400">
                            <Link
                                href="/sos"
                                className="hover:text-emerald-400 transition-colors"
                            >
                                SOS khẩn cấp
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

                    {/* Right Column: Source Code Links */}
                    <div
                        className="md:col-span-3 flex flex-col items-center md:items-start gap-4"
                        data-aos="fade-up"
                        data-aos-delay="150"
                    >
                        <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-300">
                            Mã nguồn Github
                        </h4>
                        <div className="flex flex-col items-center md:items-start gap-3">
                            <a
                                href="https://github.com/74Teams/emergency-rescue-system-nextjs"
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-2.5 text-slate-400 hover:text-white transition-colors group"
                            >
                                <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 group-hover:border-slate-700 transition-colors">
                                    <GithubIcon className="size-4 text-slate-300 group-hover:text-white" />
                                </div>
                                <span className="font-bold text-[11px] uppercase tracking-wider">
                                    Next.js Frontend
                                </span>
                            </a>
                            <a
                                href="https://github.com/74Teams/emergency-rescue-system-backend"
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-2.5 text-slate-400 hover:text-white transition-colors group"
                            >
                                <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 group-hover:border-slate-700 transition-colors">
                                    <GithubIcon className="size-4 text-slate-300 group-hover:text-white" />
                                </div>
                                <span className="font-bold text-[11px] uppercase tracking-wider">
                                    .NET 10 Backend
                                </span>
                            </a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    )
}
