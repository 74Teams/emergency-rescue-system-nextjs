'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
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
    CalendarCheck,
} from 'lucide-react'
import { toast } from 'sonner'
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
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import {
    Sidebar,
    SidebarContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarProvider,
    SidebarFooter,
    SidebarTrigger,
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
import RescuerProfile from '@/components/dashboards/rescuer/RescuerProfile'
import RescuerCurrentMission from '@/components/dashboards/rescuer/RescuerCurrentMission'
import LeaveRequestModal from '@/components/dashboards/rescuer/LeaveRequestModal'
import RescuerOnboarding from '@/components/dashboards/rescuer/RescuerOnboarding'
import {
    NotificationBell,
    NotificationItem,
} from '@/components/shared/NotificationBell'
import { useMyLeaveRequests } from '@/lib/api/features/leaveRequests/leaveRequests.queries'
import { useProfileQuery } from '@/lib/api/features/auth/auth.queries'
import {
    useRescueTeamDetail,
    useTeamMissions,
    useRescueTeamMembers,
    useToggleUserStatus,
} from '@/lib/api/features/commander/commander-dashboard.queries'
import { Switch } from '@/components/ui/switch'
import type { MissionSummary } from '@/lib/api/features/missions/missions.types'
import { getInitials } from '@/lib/utils/initials'
import { dictStatus, dictPriority, dictType } from '@/constants/dictionary'

// Dynamic map import
const RescuerMapView = dynamic(
    () => import('@/components/dashboards/rescuer/RescuerMapView'),
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

    const teamDetailsWithMembers = useMemo(() => {
        if (!teamDetails) return null
        return {
            ...teamDetails,
            members: teamMembers || [],
        }
    }, [teamDetails, teamMembers])

    const { mutate: toggleUserStatus, isPending: isTogglingStatus } =
        useToggleUserStatus()

    const currentUserMember = teamMembers?.find(
        (m: any) => m.id === profile?.id
    )
    const isUserActive = currentUserMember?.isActive ?? true

    const { data: leaveRequests } = useMyLeaveRequests()
    const todayStr = new Date().toISOString().split('T')[0]

    const recentNotifications = useMemo(() => {
        if (!leaveRequests) return []
        return leaveRequests.filter((req: any) => {
            if (req.status === 'PENDING') return false
            const updatedDateStr = req.updatedAt?.split('T')?.[0]
            return updatedDateStr === todayStr
        })
    }, [leaveRequests, todayStr])

    const recentMissionUpdates = useMemo(() => {
        if (!missions) return []
        const RECENT_THRESHOLD_MS = 30 * 60 * 1000 // 30 mins
        const now = Date.now()
        return missions.filter((m: any) => {
            if (m.status !== 'EN_ROUTE' && m.status !== 'ABORTED') return false
            const ts =
                m.updateAt ||
                (m as any).updatedAt ||
                m.createdAt ||
                (m as any).createAt
            if (!ts) return false
            const cleanTs = ts.replace('Z', '').replace('+00:00', '')
            const tsWithZone = cleanTs.includes('+')
                ? cleanTs
                : cleanTs + '+07:00'
            const elapsed = now - new Date(tsWithZone).getTime()
            return elapsed >= 0 && elapsed <= RECENT_THRESHOLD_MS
        })
    }, [missions])

    const rescuerNotifications: NotificationItem[] = useMemo(() => {
        const items: NotificationItem[] = []
        if (recentNotifications.length > 0) {
            items.push(
                ...recentNotifications.map((req: any) => ({
                    id: `leave_${req.id}_${req.status}`,
                    title: (
                        <p
                            className={cn(
                                'text-sm font-bold',
                                req.status === 'APPROVED'
                                    ? 'text-emerald-600'
                                    : 'text-rose-600'
                            )}
                        >
                            Đơn xin phép{' '}
                            {req.status === 'APPROVED'
                                ? 'đã được duyệt'
                                : 'bị từ chối'}
                        </p>
                    ),
                    description: (
                        <>
                            <p className="text-xs text-slate-500">
                                Nghỉ từ{' '}
                                {format(new Date(req.startTime), 'dd/MM/yyyy')}{' '}
                                đến{' '}
                                {format(new Date(req.endTime), 'dd/MM/yyyy')}
                            </p>
                            {req.note && (
                                <p className="text-[10px] text-slate-400 mt-1 bg-slate-50 p-1.5 rounded w-full">
                                    Ghi chú: {req.note}
                                </p>
                            )}
                        </>
                    ),
                    timestamp: req.updatedAt || new Date().toISOString(),
                    onClick: () => setActiveTab('profile'),
                }))
            )
        }

        if (recentMissionUpdates.length > 0) {
            items.push(
                ...recentMissionUpdates.map((mission: any) => {
                    const isAccepted = mission.status === 'EN_ROUTE'
                    const ts =
                        mission.updateAt ||
                        mission.updatedAt ||
                        mission.createdAt ||
                        mission.createAt ||
                        new Date().toISOString()
                    return {
                        id: `mis_${mission.id}_${mission.status}_${ts}`,
                        title: (
                            <p
                                className={cn(
                                    'text-sm font-bold',
                                    isAccepted
                                        ? 'text-emerald-600'
                                        : 'text-rose-600'
                                )}
                            >
                                {isAccepted
                                    ? '✅ Nhiệm vụ đã tiếp nhận'
                                    : '❌ Nhiệm vụ bị hủy'}
                            </p>
                        ),
                        description: (
                            <p className="text-xs text-slate-500 truncate w-full">
                                Đội trưởng vừa{' '}
                                {isAccepted
                                    ? 'xác nhận di chuyển'
                                    : 'hủy/từ chối'}{' '}
                                nhiệm vụ.
                            </p>
                        ),
                        timestamp:
                            mission.updateAt ||
                            mission.createdAt ||
                            new Date().toISOString(),
                        onClick: () => setActiveTab('current_mission'),
                    }
                })
            )
        }

        // Sắp xếp lại theo thời gian mới nhất
        return items.sort(
            (a, b) =>
                new Date(b.timestamp).getTime() -
                new Date(a.timestamp).getTime()
        )
    }, [recentNotifications, recentMissionUpdates])

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

    const totalHours = useMemo(() => {
        let hours = 0
        historyMissions.forEach((m: MissionSummary) => {
            if (m.status === 'COMPLETED' && m.startTime && m.endTime) {
                const diff =
                    new Date(m.endTime).getTime() -
                    new Date(m.startTime).getTime()
                if (diff > 0) {
                    hours += diff / (1000 * 60 * 60)
                }
            }
        })
        return Math.round(hours * 10) / 10
    }, [historyMissions])

    const prevMissionIdRef = useRef<string | null>(null)
    const prevMissionStatusRef = useRef<string | null>(null)

    useEffect(() => {
        if (!missions) return

        const currentId = currentMission?.id || null
        const currentStatus = currentMission?.status || null

        // If a previously ASSIGNED mission becomes EN_ROUTE
        if (
            currentId &&
            currentId === prevMissionIdRef.current &&
            prevMissionStatusRef.current === 'ASSIGNED' &&
            currentStatus === 'EN_ROUTE'
        ) {
            toast.info('Đội trưởng đã tiếp nhận nhiệm vụ!', {
                description:
                    'Nhiệm vụ đã chuyển sang trạng thái "Đang di chuyển", hãy chuẩn bị xuất phát.',
            })
        }

        // Check if an active mission was aborted
        if (prevMissionIdRef.current && !currentId) {
            const aborted = historyMissions.find(
                m => m.id === prevMissionIdRef.current && m.status === 'ABORTED'
            )
            if (aborted) {
                toast.error('Nhiệm vụ đã bị hủy!', {
                    description:
                        'Đội trưởng hoặc Điều phối viên đã hủy nhiệm vụ.',
                })
            }
        }

        prevMissionIdRef.current = currentId
        prevMissionStatusRef.current = currentStatus
    }, [currentMission, historyMissions, missions])

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

    if (!teamId && profile?.roles?.includes('Rescuer')) {
        return <RescuerOnboarding profile={profile} />
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
                                    Rescuer
                                </h1>
                                <p className="text-[11px] font-bold text-orange-600 uppercase tracking-widest">
                                    Cứu hộ viên
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

                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    isActive={activeTab === 'leave_history'}
                                    onClick={() => setActiveTab('leave_history')}
                                    className={cn(
                                        'py-5 rounded-xl font-bold transition-all duration-200',
                                        activeTab === 'leave_history'
                                            ? 'bg-orange-50 text-orange-700 shadow-sm border border-orange-100'
                                            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                                    )}
                                >
                                    <CalendarCheck size={18} className="mr-3" />
                                    <span>Lịch sử xin nghỉ</span>
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
                                            {getInitials(
                                                profile?.fullName || 'RS'
                                            )}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 overflow-hidden">
                                        <p className="text-sm font-bold text-slate-800 truncate">
                                            {profile?.fullName ||
                                                'Thành viên Cứu hộ'}
                                        </p>
                                        <p className="text-[11px] text-slate-500 truncate">
                                            {profile?.teamName ||
                                                'Chưa tham gia đội'}
                                        </p>
                                    </div>
                                </div>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                align="end"
                                className="w-56"
                                sideOffset={8}
                            >
                                <DropdownMenuLabel>
                                    Tài khoản của bạn
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onClick={() => setActiveTab('profile')}
                                    className="cursor-pointer"
                                >
                                    <Shield className="mr-2 h-4 w-4" />
                                    <span>Đội cứu hộ (Nội bộ)</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => router.push('/profile')}
                                    className="cursor-pointer"
                                >
                                    <User className="mr-2 h-4 w-4" />
                                    <span>Hồ sơ cá nhân</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => router.push('/map')}
                                    className="cursor-pointer"
                                >
                                    <MapIcon className="mr-2 h-4 w-4" />
                                    <span>Bản đồ hệ thống</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onClick={() => logout()}
                                    className="text-red-600 focus:text-red-600 cursor-pointer"
                                >
                                    <LogOut className="mr-2 h-4 w-4" />
                                    <span>Đăng xuất</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </SidebarFooter>
                </Sidebar>

                <main className="flex-1 flex flex-col min-w-0 bg-slate-50 h-screen relative">
                    <header className="sticky top-0 z-10 flex h-20 shrink-0 items-center gap-4 border-b border-slate-200/60 bg-white/80 backdrop-blur-xl px-6 lg:px-10">
                        <SidebarTrigger className="-ml-2 mr-2 md:hidden" />
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
                                {activeTab === 'leave_history' &&
                                    'Lịch sử xin nghỉ phép'}
                            </h2>
                        </div>
                        <div className="flex items-center gap-3">
                            {/* Trạng thái hoạt động cá nhân */}
                            {profile && (
                                <div className="flex items-center gap-2 mr-2 bg-white/50 px-3 py-1.5 rounded-full border border-slate-200">
                                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest hidden sm:inline-block">
                                        {isUserActive
                                            ? 'Trực tuyến'
                                            : 'Ngoại tuyến'}
                                    </span>
                                    <Switch
                                        checked={isUserActive}
                                        onCheckedChange={checked => {
                                            toggleUserStatus({
                                                userId: profile.id,
                                                isActive: checked,
                                            })
                                        }}
                                        disabled={isTogglingStatus}
                                        className="data-[state=checked]:bg-emerald-500"
                                    />
                                </div>
                            )}

                            <LeaveRequestModal />

                            <NotificationBell items={rescuerNotifications} />
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
                                                    Giờ hoạt động
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
                                <RescuerCurrentMission
                                    currentMission={currentMission}
                                    teamMembers={teamMembers}
                                />
                            )}

                            {/* TAB: LEAVE HISTORY */}
                            {activeTab === 'leave_history' && (
                                <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Lịch sử xin nghỉ phép</CardTitle>
                                            <CardDescription>
                                                Danh sách các đơn xin nghỉ phép của bạn
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            {(!leaveRequests || leaveRequests.length === 0) ? (
                                                <div className="text-center py-10 text-slate-500">
                                                    Bạn chưa có đơn xin nghỉ phép nào.
                                                </div>
                                            ) : (
                                                <div className="space-y-4">
                                                    {leaveRequests.map((req: any) => (
                                                        <div key={req.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                                                            <div className="flex items-start gap-4 mb-4 md:mb-0">
                                                                <div className={cn(
                                                                    'p-3 rounded-xl',
                                                                    req.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-600' :
                                                                        req.status === 'REJECTED' ? 'bg-rose-100 text-rose-600' :
                                                                            'bg-amber-100 text-amber-600'
                                                                )}>
                                                                    {req.status === 'APPROVED' ? <CheckCircle size={24} /> :
                                                                        req.status === 'REJECTED' ? <ShieldAlert size={24} /> :
                                                                            <Clock size={24} />}
                                                                </div>
                                                                <div>
                                                                    <h4 className="font-bold text-slate-800 text-lg">
                                                                        Nghỉ từ {format(new Date(req.startTime), 'dd/MM/yyyy')} đến {format(new Date(req.endTime), 'dd/MM/yyyy')}
                                                                    </h4>
                                                                    <div className="mt-1 flex flex-col gap-1">
                                                                        <span className="text-sm text-slate-600">Lý do: {req.reason}</span>
                                                                        {req.note && <span className="text-xs text-slate-500 italic">Ghi chú: {req.note}</span>}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex-shrink-0 text-right">
                                                                <Badge className={cn(
                                                                    'px-3 py-1 font-bold border-none shadow-sm text-xs',
                                                                    req.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' :
                                                                        req.status === 'REJECTED' ? 'bg-rose-100 text-rose-700' :
                                                                            'bg-amber-100 text-amber-700'
                                                                )}>
                                                                    {req.status === 'APPROVED' ? 'Đã duyệt' : req.status === 'REJECTED' ? 'Từ chối' : 'Chờ duyệt'}
                                                                </Badge>
                                                                <div className="text-[10px] text-slate-400 mt-2 font-medium">
                                                                    Gửi lúc: {format(new Date(req.createdAt), 'HH:mm dd/MM/yyyy')}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </section>
                            )}

                            {/* TAB: REQUESTS MAP */}
                            {activeTab === 'requests_map' && (
                                <section className="h-[calc(100vh-160px)] min-h-[600px] rounded-2xl overflow-hidden border border-slate-200 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500 relative bg-slate-100">
                                    <RescuerMapView
                                        currentMission={currentMission}
                                        teamLocation={
                                            teamDetails?.baseLocation || null
                                        }
                                    />
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
                                                            <Dialog
                                                                key={mission.id}
                                                            >
                                                                <div className="flex flex-col md:flex-row md:items-center justify-between p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
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
                                                                                {mission
                                                                                    .request
                                                                                    ?.location
                                                                                    ?.address ||
                                                                                    `Nhiệm vụ #${mission.id.slice(-6)}`}
                                                                            </h4>
                                                                            <div className="flex flex-wrap items-center gap-2 mt-1">
                                                                                <Badge
                                                                                    variant="outline"
                                                                                    className="text-slate-500 font-medium"
                                                                                >
                                                                                    {dictType[
                                                                                        mission
                                                                                            .request
                                                                                            ?.emergencyType ||
                                                                                        ''
                                                                                    ] ||
                                                                                        'Khác'}
                                                                                </Badge>
                                                                                <Badge
                                                                                    variant="outline"
                                                                                    className={cn(
                                                                                        'font-medium',
                                                                                        mission
                                                                                            .request
                                                                                            ?.priority ===
                                                                                            'CRITICAL' ||
                                                                                            mission
                                                                                                .request
                                                                                                ?.priority ===
                                                                                            'HIGH'
                                                                                            ? 'text-rose-500 border-rose-200'
                                                                                            : 'text-amber-500 border-amber-200'
                                                                                    )}
                                                                                >
                                                                                    Mức
                                                                                    độ:{' '}
                                                                                    {dictPriority[
                                                                                        mission
                                                                                            .request
                                                                                            ?.priority ||
                                                                                        ''
                                                                                    ] ||
                                                                                        mission
                                                                                            .request
                                                                                            ?.priority}
                                                                                </Badge>
                                                                            </div>
                                                                            <p className="text-xs text-slate-400 mt-2 font-medium">
                                                                                Trạng
                                                                                thái:{' '}
                                                                                <span
                                                                                    className={
                                                                                        mission.status ===
                                                                                            'COMPLETED'
                                                                                            ? 'text-emerald-600'
                                                                                            : 'text-rose-600'
                                                                                    }
                                                                                >
                                                                                    {dictStatus[
                                                                                        mission.status as keyof typeof dictStatus
                                                                                    ] ||
                                                                                        mission.status}
                                                                                </span>
                                                                                {mission.endTime &&
                                                                                    ` • Hoàn thành: ${format(new Date(mission.endTime), 'HH:mm dd/MM/yyyy')}`}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                    <DialogTrigger
                                                                        asChild
                                                                    >
                                                                        <Button
                                                                            variant="outline"
                                                                            className="font-bold text-slate-600 self-start md:self-center"
                                                                        >
                                                                            Xem
                                                                            chi
                                                                            tiết
                                                                        </Button>
                                                                    </DialogTrigger>
                                                                </div>
                                                                <DialogContent className="sm:max-w-[500px] rounded-2xl">
                                                                    <DialogHeader>
                                                                        <DialogTitle className="text-xl font-black text-slate-800 flex items-center gap-2">
                                                                            {mission.status ===
                                                                                'COMPLETED' ? (
                                                                                <CheckCircle className="text-emerald-500" />
                                                                            ) : (
                                                                                <ShieldAlert className="text-rose-500" />
                                                                            )}
                                                                            Chi
                                                                            tiết
                                                                            nhiệm
                                                                            vụ
                                                                        </DialogTitle>
                                                                    </DialogHeader>
                                                                    <div className="mt-4 space-y-4">
                                                                        <div className="grid grid-cols-2 gap-4">
                                                                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                                                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                                                                    Mã
                                                                                    NV
                                                                                </p>
                                                                                <p className="font-bold text-slate-800 text-sm">
                                                                                    #
                                                                                    {mission.id.slice(
                                                                                        -8
                                                                                    )}
                                                                                </p>
                                                                            </div>
                                                                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                                                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                                                                    Trạng
                                                                                    thái
                                                                                </p>
                                                                                <p
                                                                                    className={cn(
                                                                                        'font-bold text-sm',
                                                                                        mission.status ===
                                                                                            'COMPLETED'
                                                                                            ? 'text-emerald-600'
                                                                                            : 'text-rose-600'
                                                                                    )}
                                                                                >
                                                                                    {dictStatus[
                                                                                        mission.status as keyof typeof dictStatus
                                                                                    ] ||
                                                                                        mission.status}
                                                                                </p>
                                                                            </div>
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-sm font-bold text-slate-800 mb-1">
                                                                                Địa
                                                                                chỉ
                                                                                hiện
                                                                                trường
                                                                            </p>
                                                                            <div className="flex items-start gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                                                                                <MapPin
                                                                                    size={
                                                                                        16
                                                                                    }
                                                                                    className="text-rose-500 mt-0.5 shrink-0"
                                                                                />
                                                                                <p className="text-sm text-slate-600">
                                                                                    {mission
                                                                                        .request
                                                                                        ?.location
                                                                                        ?.address ||
                                                                                        'Không có thông tin địa chỉ'}
                                                                                </p>
                                                                            </div>
                                                                        </div>
                                                                        <div className="grid grid-cols-2 gap-4">
                                                                            <div>
                                                                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                                                                    Loại
                                                                                    sự
                                                                                    cố
                                                                                </p>
                                                                                <Badge
                                                                                    variant="secondary"
                                                                                    className="font-medium bg-slate-100"
                                                                                >
                                                                                    {dictType[
                                                                                        mission
                                                                                            .request
                                                                                            ?.emergencyType ||
                                                                                        ''
                                                                                    ] ||
                                                                                        'Khác'}
                                                                                </Badge>
                                                                            </div>
                                                                            <div>
                                                                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                                                                    Mức
                                                                                    độ
                                                                                </p>
                                                                                <Badge
                                                                                    variant="secondary"
                                                                                    className="font-medium bg-slate-100"
                                                                                >
                                                                                    {dictPriority[
                                                                                        mission
                                                                                            .request
                                                                                            ?.priority ||
                                                                                        ''
                                                                                    ] ||
                                                                                        'Bình thường'}
                                                                                </Badge>
                                                                            </div>
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                                                                Mô
                                                                                tả
                                                                                sự
                                                                                cố
                                                                            </p>
                                                                            <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 min-h-[60px]">
                                                                                {mission
                                                                                    .request
                                                                                    ?.description ||
                                                                                    'Không có mô tả thêm.'}
                                                                            </p>
                                                                        </div>
                                                                        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                                                                            <div>
                                                                                <p className="text-xs text-slate-500 flex items-center gap-1">
                                                                                    <Clock
                                                                                        size={
                                                                                            12
                                                                                        }
                                                                                    />{' '}
                                                                                    Thời
                                                                                    gian
                                                                                    tạo
                                                                                </p>
                                                                                <p className="text-sm font-semibold text-slate-700 mt-0.5">
                                                                                    {mission.createdAt
                                                                                        ? format(
                                                                                            new Date(
                                                                                                mission.createdAt
                                                                                            ),
                                                                                            'HH:mm dd/MM/yyyy'
                                                                                        )
                                                                                        : '--'}
                                                                                </p>
                                                                            </div>
                                                                            <div>
                                                                                <p className="text-xs text-slate-500 flex items-center gap-1">
                                                                                    <CheckSquare
                                                                                        size={
                                                                                            12
                                                                                        }
                                                                                    />{' '}
                                                                                    Hoàn
                                                                                    thành
                                                                                    lúc
                                                                                </p>
                                                                                <p className="text-sm font-semibold text-slate-700 mt-0.5">
                                                                                    {mission.endTime
                                                                                        ? format(
                                                                                            new Date(
                                                                                                mission.endTime
                                                                                            ),
                                                                                            'HH:mm dd/MM/yyyy'
                                                                                        )
                                                                                        : '--'}
                                                                                </p>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </DialogContent>
                                                            </Dialog>
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
                                <RescuerProfile
                                    profile={profile}
                                    teamDetails={teamDetailsWithMembers}
                                    missions={missions}
                                    isUserActive={isUserActive}
                                />
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </SidebarProvider>
    )
}
