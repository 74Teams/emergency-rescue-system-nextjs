'use client'

import { useState, useMemo } from 'react'
import {
    Activity,
    Map as MapIcon,
    CheckSquare,
    History,
    User,
    ShieldAlert,
    Bell,
    CheckCircle,
    MapPin,
    Clock,
    Shield,
    Loader2,
    ListTodo,
    LogOut,
    Settings,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import {
    Sidebar,
    SidebarContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarProvider,
    SidebarFooter,
} from '@/components/ui/sidebar'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

// APIs
import { useLogout } from '@/lib/api/use-auth'
import { useProfileQuery } from '@/lib/api/features/auth/auth.queries'
import {
    useRescueTeamDetail,
    useTeamMissions,
    useRescueTeamMembers,
} from '@/lib/api/features/commander/commander-dashboard.queries'
import type { MissionSummary } from '@/lib/api/features/missions/missions.types'
import { getInitials } from '@/lib/utils/initials'

// Dynamic map import
const MapView = dynamic(
    () => import('@/components/dashboards/commander/MapView'),
    {
        ssr: false,
        loading: () => (
            <div className="w-full h-full flex items-center justify-center bg-slate-50">
                <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
            </div>
        ),
    }
)

export default function RescuerDashboard() {
    const [activeTab, setActiveTab] = useState('overview')
    const router = useRouter()
    const logout = useLogout()

    // Fetch current user profile to get teamId
    const { data: profile, isLoading: isLoadingProfile } = useProfileQuery()
    const teamId = profile?.rescueTeamId

    // Fetch team details and missions
    const { data: teamDetails, isLoading: isLoadingTeam } = useRescueTeamDetail(
        teamId || ''
    )
    const { data: missions, isLoading: isLoadingMissions } = useTeamMissions(
        teamId || ''
    )
    const { data: teamMembers, isLoading: isLoadingMembers } =
        useRescueTeamMembers(teamId || null)

    // Derived states
    const activeMissions = useMemo(() => {
        return (
            missions?.filter((m: MissionSummary) =>
                ['ASSIGNED', 'EN_ROUTE', 'ON_SITE', 'IN_PROGRESS'].includes(
                    m.status
                )
            ) || []
        )
    }, [missions])

    const historyMissions = useMemo(() => {
        return (
            missions?.filter((m: MissionSummary) =>
                ['COMPLETED', 'ABORTED'].includes(m.status)
            ) || []
        )
    }, [missions])

    const currentMission = activeMissions.length > 0 ? activeMissions[0] : null

    const totalCompleted = historyMissions.filter(
        m => m.status === 'COMPLETED'
    ).length
    // Giả sử mỗi mission ~2 giờ (để demo stats)
    const totalHours = totalCompleted * 2

    const isGlobalLoading =
        isLoadingProfile ||
        (teamId && (isLoadingTeam || isLoadingMissions || isLoadingMembers))

    if (isGlobalLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-slate-50">
                <Loader2 className="w-10 h-10 animate-spin text-orange-600" />
            </div>
        )
    }

    return (
        <SidebarProvider>
            <div className="flex h-screen w-full bg-slate-50/50 font-sans overflow-hidden text-slate-800">
                <Sidebar className="border-r border-slate-200 bg-white z-50 shadow-sm">
                    <SidebarHeader className="p-6 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center text-white font-black text-xl shadow-md shadow-orange-600/20">
                                <ShieldAlert size={20} />
                            </div>
                            <div>
                                <h1 className="text-lg font-black text-slate-900 tracking-tight leading-tight">
                                    Rescuer Team
                                </h1>
                                <p className="text-[11px] font-bold text-orange-600 uppercase tracking-widest">
                                    Lực lượng cứu hộ
                                </p>
                            </div>
                        </div>
                    </SidebarHeader>

                    <SidebarContent className="px-4 mt-4">
                        <SidebarMenu className="space-y-1.5">
                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    isActive={activeTab === 'overview'}
                                    onClick={() => setActiveTab('overview')}
                                    className={cn(
                                        'py-5 rounded-xl font-bold transition-all duration-200',
                                        activeTab === 'overview'
                                            ? 'bg-orange-50 text-orange-700 shadow-sm border border-orange-100'
                                            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                                    )}
                                >
                                    <Activity size={18} className="mr-3" />
                                    <span>Tổng quan</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>

                            <div className="pt-4 pb-2 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                Nhiệm vụ & Bản đồ
                            </div>

                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    isActive={activeTab === 'current_mission'}
                                    onClick={() =>
                                        setActiveTab('current_mission')
                                    }
                                    className={cn(
                                        'py-5 rounded-xl font-bold transition-all duration-200 flex justify-between',
                                        activeTab === 'current_mission'
                                            ? 'bg-orange-50 text-orange-700 shadow-sm border border-orange-100'
                                            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                                    )}
                                >
                                    <div className="flex items-center">
                                        <CheckSquare
                                            size={18}
                                            className="mr-3"
                                        />
                                        <span>Nhiệm vụ hiện tại</span>
                                    </div>
                                    {currentMission && (
                                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse ml-auto" />
                                    )}
                                </SidebarMenuButton>
                            </SidebarMenuItem>

                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    isActive={activeTab === 'requests_map'}
                                    onClick={() => setActiveTab('requests_map')}
                                    className={cn(
                                        'py-5 rounded-xl font-bold transition-all duration-200',
                                        activeTab === 'requests_map'
                                            ? 'bg-orange-50 text-orange-700 shadow-sm border border-orange-100'
                                            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                                    )}
                                >
                                    <MapIcon size={18} className="mr-3" />
                                    <span>Bản đồ yêu cầu</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>

                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    isActive={activeTab === 'mission_history'}
                                    onClick={() =>
                                        setActiveTab('mission_history')
                                    }
                                    className={cn(
                                        'py-5 rounded-xl font-bold transition-all duration-200',
                                        activeTab === 'mission_history'
                                            ? 'bg-orange-50 text-orange-700 shadow-sm border border-orange-100'
                                            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                                    )}
                                >
                                    <History size={18} className="mr-3" />
                                    <span>Lịch sử nhiệm vụ</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>

                            <div className="pt-4 pb-2 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                Đội & Cá nhân
                            </div>

                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    isActive={activeTab === 'profile'}
                                    onClick={() => setActiveTab('profile')}
                                    className={cn(
                                        'py-5 rounded-xl font-bold transition-all duration-200',
                                        activeTab === 'profile'
                                            ? 'bg-orange-50 text-orange-700 shadow-sm border border-orange-100'
                                            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                                    )}
                                >
                                    <User size={18} className="mr-3" />
                                    <span>Hồ sơ & Đội cứu hộ</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarContent>

                    <SidebarFooter className="p-4 mt-auto border-t border-slate-100">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-100 cursor-pointer transition-colors outline-none">
                                    <Avatar className="w-10 h-10 border-2 border-white shadow-sm">
                                        <AvatarImage
                                            src={
                                                profile?.avatarUrl ||
                                                `https://ui-avatars.com/api/?name=${profile?.fullName || 'RS'}&background=f97316&color=fff`
                                            }
                                        />
                                        <AvatarFallback>
                                            {getInitials(profile?.fullName || 'RS')}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 overflow-hidden">
                                        <p className="text-sm font-bold text-slate-800 truncate">
                                            {profile?.fullName || 'Thành viên Cứu hộ'}
                                        </p>
                                        <p className="text-[11px] text-slate-500 truncate">
                                            {profile?.teamName || 'Chưa tham gia đội'}
                                        </p>
                                    </div>
                                </div>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56" sideOffset={8}>
                                <DropdownMenuLabel>Tài khoản của bạn</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => setActiveTab('profile')} className="cursor-pointer">
                                    <Shield className="mr-2 h-4 w-4" />
                                    <span>Đội cứu hộ (Nội bộ)</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => router.push('/profile')} className="cursor-pointer">
                                    <User className="mr-2 h-4 w-4" />
                                    <span>Hồ sơ cá nhân</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => router.push('/map')} className="cursor-pointer">
                                    <MapIcon className="mr-2 h-4 w-4" />
                                    <span>Bản đồ hệ thống</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => logout()} className="text-red-600 focus:text-red-600 cursor-pointer">
                                    <LogOut className="mr-2 h-4 w-4" />
                                    <span>Đăng xuất</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </SidebarFooter>
                </Sidebar>

                <main className="flex-1 flex flex-col relative w-full h-full overflow-hidden">
                    <header className="flex justify-between items-center px-8 w-full sticky top-0 z-40 bg-white/70 backdrop-blur-xl h-20 border-b border-slate-200/60 shadow-sm">
                        <div className="flex items-center gap-6 flex-1">
                            <h2 className="text-xl font-extrabold text-slate-800 tracking-tight hidden lg:block">
                                {activeTab === 'overview' &&
                                    'Tổng quan hoạt động'}
                                {activeTab === 'current_mission' &&
                                    'Chi tiết nhiệm vụ đang thực hiện'}
                                {activeTab === 'requests_map' &&
                                    'Bản đồ yêu cầu cứu hộ'}
                                {activeTab === 'mission_history' &&
                                    'Lịch sử nhiệm vụ đội'}
                                {activeTab === 'profile' &&
                                    'Thông tin đội & cá nhân'}
                            </h2>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="rounded-full relative text-slate-500 hover:text-orange-600"
                            >
                                <Bell size={20} strokeWidth={2.5} />
                                {currentMission && (
                                    <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full animate-pulse"></span>
                                )}
                            </Button>
                        </div>
                    </header>

                    <div className="flex-1 overflow-y-auto p-8 lg:p-10 scroll-smooth">
                        <div className="max-w-7xl mx-auto space-y-10 pb-24">
                            {/* TAB: OVERVIEW */}
                            {activeTab === 'overview' && (
                                <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <Card>
                                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                                <CardTitle className="text-sm font-bold text-slate-500">
                                                    Nhiệm vụ hoàn thành
                                                </CardTitle>
                                                <CheckCircle
                                                    size={20}
                                                    className="text-emerald-500"
                                                />
                                            </CardHeader>
                                            <CardContent>
                                                <div className="text-4xl font-black text-slate-800">
                                                    {totalCompleted}
                                                </div>
                                                <p className="text-xs text-emerald-600 mt-2 font-semibold">
                                                    Toàn thời gian
                                                </p>
                                            </CardContent>
                                        </Card>
                                        <Card>
                                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                                <CardTitle className="text-sm font-bold text-slate-500">
                                                    Giờ hoạt động (Ước tính)
                                                </CardTitle>
                                                <Clock
                                                    size={20}
                                                    className="text-blue-500"
                                                />
                                            </CardHeader>
                                            <CardContent>
                                                <div className="text-4xl font-black text-slate-800">
                                                    {totalHours}h
                                                </div>
                                                <p className="text-xs text-blue-600 mt-2 font-semibold">
                                                    Toàn thời gian
                                                </p>
                                            </CardContent>
                                        </Card>
                                        <Card
                                            className={cn(
                                                'text-white border-none shadow-md',
                                                currentMission
                                                    ? 'bg-orange-600 shadow-orange-500/30'
                                                    : 'bg-emerald-600 shadow-emerald-500/30'
                                            )}
                                        >
                                            <CardHeader
                                                className={cn(
                                                    'flex flex-row items-center justify-between pb-2',
                                                    currentMission
                                                        ? 'text-orange-100'
                                                        : 'text-emerald-100'
                                                )}
                                            >
                                                <CardTitle
                                                    className={cn(
                                                        'text-sm font-bold',
                                                        currentMission
                                                            ? 'text-orange-100'
                                                            : 'text-emerald-100'
                                                    )}
                                                >
                                                    Trạng thái hiện tại
                                                </CardTitle>
                                                <Activity size={20} />
                                            </CardHeader>
                                            <CardContent>
                                                <div className="text-3xl font-black">
                                                    {currentMission
                                                        ? 'Đang làm nhiệm vụ'
                                                        : 'Sẵn sàng (Standby)'}
                                                </div>
                                                {currentMission && (
                                                    <p
                                                        className={cn(
                                                            'text-xs mt-2 font-semibold',
                                                            currentMission
                                                                ? 'text-orange-200'
                                                                : 'text-emerald-200'
                                                        )}
                                                    >
                                                        Mã NV: #
                                                        {currentMission.id.slice(
                                                            -6
                                                        )}
                                                    </p>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </div>
                                </section>
                            )}

                            {/* TAB: CURRENT MISSION */}
                            {activeTab === 'current_mission' && (
                                <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    {currentMission ? (
                                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                            <Card className="lg:col-span-2">
                                                <CardHeader>
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <CardTitle className="text-2xl font-black text-slate-800">
                                                                Nhiệm vụ #
                                                                {currentMission.id.slice(
                                                                    -8
                                                                )}
                                                            </CardTitle>
                                                            <CardDescription className="flex items-center gap-2 mt-2 text-slate-500 font-medium">
                                                                <Clock
                                                                    size={16}
                                                                />{' '}
                                                                Tạo lúc:{' '}
                                                                {format(
                                                                    new Date(
                                                                        currentMission.createdAt ||
                                                                            ''
                                                                    ),
                                                                    'HH:mm dd/MM/yyyy',
                                                                    {
                                                                        locale: vi,
                                                                    }
                                                                )}
                                                            </CardDescription>
                                                        </div>
                                                        <Badge className="bg-rose-500 hover:bg-rose-600 text-white font-bold uppercase tracking-wider">
                                                            {
                                                                currentMission.status
                                                            }
                                                        </Badge>
                                                    </div>
                                                </CardHeader>
                                                <CardContent className="space-y-6">
                                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm text-slate-700 leading-relaxed">
                                                        <strong>
                                                            Request ID:
                                                        </strong>{' '}
                                                        {
                                                            currentMission.requestId
                                                        }{' '}
                                                        <br />
                                                        Đây là nhiệm vụ đang
                                                        được phân công cho đội
                                                        của bạn. Các chi tiết
                                                        khác sẽ được lấy từ API
                                                        theo yêu cầu.
                                                    </div>

                                                    <div>
                                                        <h4 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
                                                            <ListTodo
                                                                size={18}
                                                                className="text-orange-500"
                                                            />{' '}
                                                            Checklist Nhiệm vụ
                                                            (Ví dụ)
                                                        </h4>
                                                        <div className="space-y-3">
                                                            {[
                                                                {
                                                                    label: 'Xác nhận nhận nhiệm vụ',
                                                                    done:
                                                                        currentMission.status !==
                                                                        'ASSIGNED',
                                                                },
                                                                {
                                                                    label: 'Di chuyển đến điểm tập kết gần nhất',
                                                                    done: [
                                                                        'ON_SITE',
                                                                        'IN_PROGRESS',
                                                                        'COMPLETED',
                                                                    ].includes(
                                                                        currentMission.status
                                                                    ),
                                                                },
                                                                {
                                                                    label: 'Tiếp cận hiện trường và liên lạc nạn nhân',
                                                                    done: [
                                                                        'IN_PROGRESS',
                                                                        'COMPLETED',
                                                                    ].includes(
                                                                        currentMission.status
                                                                    ),
                                                                },
                                                                {
                                                                    label: 'Đưa nạn nhân đến nơi an toàn',
                                                                    done:
                                                                        currentMission.status ===
                                                                        'COMPLETED',
                                                                },
                                                                {
                                                                    label: 'Báo cáo hoàn thành và di chuyển về base',
                                                                    done:
                                                                        currentMission.status ===
                                                                        'COMPLETED',
                                                                },
                                                            ].map(
                                                                (item, idx) => (
                                                                    <div
                                                                        key={
                                                                            idx
                                                                        }
                                                                        className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg shadow-sm hover:border-orange-300 transition-colors cursor-pointer"
                                                                    >
                                                                        <div
                                                                            className={cn(
                                                                                'w-5 h-5 rounded flex items-center justify-center border',
                                                                                item.done
                                                                                    ? 'bg-emerald-500 border-emerald-500 text-white'
                                                                                    : 'border-slate-300 text-transparent'
                                                                            )}
                                                                        >
                                                                            <CheckSquare
                                                                                size={
                                                                                    14
                                                                                }
                                                                            />
                                                                        </div>
                                                                        <span
                                                                            className={cn(
                                                                                'font-medium',
                                                                                item.done
                                                                                    ? 'text-slate-400 line-through'
                                                                                    : 'text-slate-700'
                                                                            )}
                                                                        >
                                                                            {
                                                                                item.label
                                                                            }
                                                                        </span>
                                                                    </div>
                                                                )
                                                            )}
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>

                                            <Card>
                                                <CardHeader>
                                                    <CardTitle className="text-lg font-bold">
                                                        Thành viên đội (
                                                        {teamMembers?.length ||
                                                            0}
                                                        )
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent className="space-y-4">
                                                    {teamMembers?.map(
                                                        (member: any) => (
                                                            <div
                                                                key={member.id}
                                                                className="flex items-center gap-3"
                                                            >
                                                                <Avatar>
                                                                    <AvatarFallback className="font-bold bg-slate-100">
                                                                        {getInitials(
                                                                            member.fullName
                                                                        )}
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                                <div>
                                                                    <p className="font-bold text-sm text-slate-800">
                                                                        {
                                                                            member.fullName
                                                                        }
                                                                    </p>
                                                                    <p className="text-xs text-slate-500 font-medium">
                                                                        Cứu hộ
                                                                        viên
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        )
                                                    )}
                                                </CardContent>
                                            </Card>
                                        </div>
                                    ) : (
                                        <Card className="border-dashed border-2 py-16 shadow-none bg-transparent">
                                            <CardContent className="flex flex-col items-center justify-center text-center">
                                                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                                    <CheckCircle className="h-10 w-10 text-slate-400" />
                                                </div>
                                                <CardTitle className="text-xl">
                                                    Không có nhiệm vụ nào đang
                                                    diễn ra
                                                </CardTitle>
                                                <CardDescription className="mt-2 text-base">
                                                    Đội của bạn hiện đang ở
                                                    trạng thái Standby. Hãy nghỉ
                                                    ngơi và chờ lệnh điều động
                                                    tiếp theo.
                                                </CardDescription>
                                            </CardContent>
                                        </Card>
                                    )}
                                </section>
                            )}

                            {/* TAB: REQUESTS MAP */}
                            {activeTab === 'requests_map' && (
                                <section className="h-[600px] rounded-2xl overflow-hidden border border-slate-200 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
                                    <MapView />
                                </section>
                            )}

                            {/* TAB: MISSION HISTORY */}
                            {activeTab === 'mission_history' && (
                                <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>
                                                Lịch sử nhiệm vụ của đội
                                            </CardTitle>
                                            <CardDescription>
                                                Các nhiệm vụ đội đã tham gia
                                                thực hiện
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            {historyMissions.length === 0 ? (
                                                <div className="text-center py-10 text-slate-500">
                                                    Chưa có dữ liệu lịch sử
                                                    nhiệm vụ.
                                                </div>
                                            ) : (
                                                <div className="space-y-4">
                                                    {historyMissions.map(
                                                        (
                                                            mission: MissionSummary
                                                        ) => (
                                                            <div
                                                                key={mission.id}
                                                                className="flex flex-col md:flex-row md:items-center justify-between p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                                                            >
                                                                <div className="flex items-start gap-4 mb-4 md:mb-0">
                                                                    <div
                                                                        className={cn(
                                                                            'p-3 rounded-xl',
                                                                            mission.status ===
                                                                                'COMPLETED'
                                                                                ? 'bg-emerald-100 text-emerald-600'
                                                                                : 'bg-rose-100 text-rose-600'
                                                                        )}
                                                                    >
                                                                        {mission.status ===
                                                                        'COMPLETED' ? (
                                                                            <CheckCircle
                                                                                size={
                                                                                    24
                                                                                }
                                                                            />
                                                                        ) : (
                                                                            <ShieldAlert
                                                                                size={
                                                                                    24
                                                                                }
                                                                            />
                                                                        )}
                                                                    </div>
                                                                    <div>
                                                                        <h4 className="font-bold text-slate-800 text-lg">
                                                                            Nhiệm
                                                                            vụ #
                                                                            {mission.id.slice(
                                                                                -6
                                                                            )}
                                                                        </h4>
                                                                        <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                                                                            <MapPin
                                                                                size={
                                                                                    14
                                                                                }
                                                                            />{' '}
                                                                            {
                                                                                mission.requestId
                                                                            }
                                                                        </p>
                                                                        <p className="text-xs text-slate-400 mt-1">
                                                                            Trạng
                                                                            thái
                                                                            cuối:{' '}
                                                                            {
                                                                                mission.status
                                                                            }
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                <Button
                                                                    variant="outline"
                                                                    className="font-bold text-slate-600"
                                                                >
                                                                    Xem chi tiết
                                                                </Button>
                                                            </div>
                                                        )
                                                    )}
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </section>
                            )}

                            {/* TAB: PROFILE */}
                            {activeTab === 'profile' && (
                                <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <Card>
                                            <CardHeader>
                                                <CardTitle>
                                                    Hồ sơ cá nhân
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-6">
                                                <div className="flex items-center gap-4">
                                                    <Avatar className="w-20 h-20">
                                                        <AvatarImage
                                                            src={
                                                                profile?.avatarUrl
                                                            }
                                                        />
                                                        <AvatarFallback className="text-2xl bg-orange-100 text-orange-600 font-bold">
                                                            {getInitials(
                                                                profile?.fullName ||
                                                                    'RS'
                                                            )}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <h3 className="text-xl font-bold text-slate-800">
                                                            {profile?.fullName}
                                                        </h3>
                                                        <p className="text-slate-500 font-medium uppercase text-xs mt-1">
                                                            {profile?.roles?.join(
                                                                ', '
                                                            )}
                                                        </p>
                                                        <Badge
                                                            variant="outline"
                                                            className="mt-2 text-emerald-600 border-emerald-200 bg-emerald-50"
                                                        >
                                                            Đang hoạt động
                                                        </Badge>
                                                    </div>
                                                </div>
                                                <div className="space-y-3 pt-4 border-t border-slate-100">
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-slate-500 font-medium">
                                                            Email
                                                        </span>
                                                        <span className="font-bold text-slate-800">
                                                            {profile?.email}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-slate-500 font-medium">
                                                            Số điện thoại
                                                        </span>
                                                        <span className="font-bold text-slate-800">
                                                            {profile?.phoneNumber ||
                                                                'Chưa cập nhật'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>

                                        <Card>
                                            <CardHeader>
                                                <CardTitle className="flex items-center gap-2">
                                                    <Shield className="text-orange-500" />{' '}
                                                    Thông tin Đội
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                {teamDetails ? (
                                                    <div className="space-y-4">
                                                        <h3 className="text-xl font-bold text-slate-800">
                                                            {
                                                                teamDetails.teamName
                                                            }
                                                        </h3>
                                                        <p className="text-sm text-slate-600">
                                                            {teamDetails.description ||
                                                                'Không có mô tả cho đội này.'}
                                                        </p>

                                                        <div className="flex justify-between text-sm mt-4">
                                                            <span className="text-slate-500 font-medium">
                                                                Đội trưởng
                                                            </span>
                                                            <span className="font-bold text-slate-800">
                                                                {teamDetails
                                                                    .leader
                                                                    ?.fullName ||
                                                                    'Chưa phân công'}
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between text-sm">
                                                            <span className="text-slate-500 font-medium">
                                                                Thành viên
                                                            </span>
                                                            <span className="font-bold text-slate-800">
                                                                {teamDetails.memberCount ||
                                                                    0}{' '}
                                                                người
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between text-sm">
                                                            <span className="text-slate-500 font-medium">
                                                                Trạng thái đội
                                                            </span>
                                                            <span className="font-bold text-orange-600">
                                                                {
                                                                    teamDetails.status
                                                                }
                                                            </span>
                                                        </div>

                                                        {teamMembers &&
                                                            teamMembers.length >
                                                                0 && (
                                                                <div className="mt-6 pt-6 border-t border-slate-100">
                                                                    <h4 className="font-bold text-sm text-slate-800 mb-4">
                                                                        Danh
                                                                        sách
                                                                        thành
                                                                        viên (
                                                                        {
                                                                            teamMembers.length
                                                                        }
                                                                        )
                                                                    </h4>
                                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                                        {teamMembers.map(
                                                                            (
                                                                                member: any
                                                                            ) => (
                                                                                <div
                                                                                    key={
                                                                                        member.id
                                                                                    }
                                                                                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors"
                                                                                >
                                                                                    <Avatar className="w-10 h-10">
                                                                                        <AvatarFallback className="text-sm font-bold bg-orange-100 text-orange-700">
                                                                                            {getInitials(
                                                                                                member.fullName
                                                                                            )}
                                                                                        </AvatarFallback>
                                                                                    </Avatar>
                                                                                    <div className="overflow-hidden">
                                                                                        <p className="font-bold text-sm text-slate-800 truncate">
                                                                                            {
                                                                                                member.fullName
                                                                                            }
                                                                                        </p>
                                                                                        <p className="text-xs text-slate-500 truncate">
                                                                                            {member.id ===
                                                                                            teamDetails
                                                                                                .leader
                                                                                                ?.id
                                                                                                ? 'Đội trưởng'
                                                                                                : 'Cứu hộ viên'}
                                                                                        </p>
                                                                                    </div>
                                                                                </div>
                                                                            )
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )}
                                                    </div>
                                                ) : (
                                                    <div className="text-slate-500 text-sm">
                                                        Bạn chưa được phân bổ
                                                        vào đội cứu hộ nào.
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </div>
                                </section>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </SidebarProvider>
    )
}
