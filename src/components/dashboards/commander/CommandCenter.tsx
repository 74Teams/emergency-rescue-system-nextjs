'use client'

import { useState, useMemo, useEffect } from 'react'
import dynamic from 'next/dynamic'
import {
    Users,
    UserPlus,
    ShieldHalf,
    Bell,
    Search,
    CheckCircle,
    X,
    ToggleRight,
    ToggleLeft,
    Plus,
    Mail,
    Phone,
    Crown,
    Loader2,
    UserMinus,
    LayoutDashboard,
    Activity,
    Filter,
    TrendingUp,
    ShieldCheck,
    Map,
    ChevronLeft,
    ChevronRight,
    Zap,
    TrendingDown,
} from 'lucide-react'

import { BarChart, Bar, CartesianGrid, XAxis } from 'recharts'
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    ChartLegend,
    ChartLegendContent,
} from '@/components/ui/chart'

// Import động MapView vì Leaflet không support SSR
const MapView = dynamic(
    () => import('@/components/dashboards/commander/MapView'),
    {
        ssr: false,
        loading: () => (
            <div className="w-full h-full flex items-center justify-center bg-slate-50">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        ),
    }
)

import RescueTeamsList from '@/components/dashboards/commander/RescueTeamsList'
import ActionPanel from '@/components/dashboards/commander/ActionPanel'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// =========================================================================
// IMPORTS 100% SHADCN UI COMPONENTS
// =========================================================================
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
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
} from '@/components/ui/sidebar'

// =========================================================================
// IMPORTS API HOOKS & TYPES
// =========================================================================
import {
    usePendingApprovals,
    useSystemUsers,
    useApproveUser,
    useRejectUser,
    useToggleUserStatus,
    useRescueTeams,
    useRescueTeamMembers,
    useAddTeamMember,
    useRemoveTeamMember,
} from '@/lib/api/features/commander/commander-dashboard.queries'
import { useRequests } from '@/lib/api/features/requests/requests.queries'
import {
    ApiRole,
    RescueTeamSummary,
    RescueTeamMemberDTO,
} from '@/lib/api/types'
import { TEAM_STATUS_BADGES, ROLE_BADGES } from '@/types/dashboards/commander'
import { useRouter } from 'next/navigation'

const PRIORITY_BADGES: Record<string, { label: string; color: string }> = {
    CRITICAL: {
        label: 'Nghiêm trọng',
        color: 'bg-rose-100 text-rose-700 animate-pulse border-none font-bold',
    },
    HIGH: {
        label: 'Cao',
        color: 'bg-orange-100 text-orange-700 border-none font-bold',
    },
    MEDIUM: {
        label: 'Trung bình',
        color: 'bg-amber-100 text-amber-700 border-none font-bold',
    },
    LOW: {
        label: 'Thấp',
        color: 'bg-emerald-100 text-emerald-700 border-none font-bold',
    },
}

const EMERGENCY_TYPES: Record<string, string> = {
    FIRE: 'Hỏa hoạn',
    FLOOD: 'Lũ lụt',
    EARTHQUAKE: 'Động đất',
    MEDICAL_EMERGENCY: 'Y tế khẩn cấp',
    TRAFFIC_EMERGENCY: 'Tai nạn giao thông',
    BUILDING_COLLAPSE: 'Sập công trình',
    NATURAL_DISASTER: 'Thiên tai',
    OTHER: 'Sự cố khác',
}

export default function CommandCenter() {
    const router = useRouter()
    // === STATES ĐIỀU HƯỚNG ===
    const [activeTab, setActiveTab] = useState('overview')

    // === DỮ LIỆU TỪ BACKEND ===
    const { data: pendingUsers, isLoading: isLoadingPending } =
        usePendingApprovals()
    const { data: allUsers, isLoading: isLoadingUsers } = useSystemUsers()
    const { data: teams, isLoading: isLoadingTeams } = useRescueTeams()
    const { data: requestsData, isLoading: isLoadingRequests } = useRequests({
        page: 1,
        pageSize: 5,
        status: 'PENDING',
    })
    const recentRequests = requestsData?.items || []

    // === MUTATIONS ===
    const approveMutation = useApproveUser()
    const rejectMutation = useRejectUser()
    const toggleStatusMutation = useToggleUserStatus()
    const addMemberMutation = useAddTeamMember()
    const removeMemberMutation = useRemoveTeamMember()

    // === STATES QUẢN LÝ NHÂN SỰ ĐỘI ===
    const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null)
    const { data: teamMembers, isLoading: isLoadingMembers } =
        useRescueTeamMembers(selectedTeamId)
    const [selectedNewMemberId, setSelectedNewMemberId] = useState('')

    // States lọc Accounts
    const [searchAccount, setSearchAccount] = useState('')
    const [roleFilter, setRoleFilter] = useState('all')
    const [statusFilter, setStatusFilter] = useState('all')

    // === THÊM STATE PAGINATION CHO DANH BẠ ===
    const [accountPage, setAccountPage] = useState(1)
    const ACCOUNTS_PER_PAGE = 10

    // === STATES CHO RESCUE MAP TAB ===
    const [mapSelectedTeamId, setMapSelectedTeamId] = useState<
        string | undefined
    >(undefined)
    const [mapHoveredTeamId, setMapHoveredTeamId] = useState<
        string | undefined
    >(undefined)
    const [isChangeStatusOpen, setIsChangeStatusOpen] = useState(false)
    const [isActionPanelOpen, setIsActionPanelOpen] = useState(false)

    const handleMapSelectTeam = (teamId: string) => {
        setMapSelectedTeamId(teamId)
    }
    const handleMapHoverTeam = (teamId: string | null) => {
        setMapHoveredTeamId(teamId ?? undefined)
    }
    const handleMapTeamAction = (action: string, teamId: string) => {
        setMapSelectedTeamId(teamId)

        if (action === 'change_status') {
            setIsActionPanelOpen(true)
            setIsChangeStatusOpen(true)
        } else if (action === 'assign_mission') {
            setIsActionPanelOpen(true)
        } else if (action === 'view_details') {
            setIsActionPanelOpen(true)
        }
    }

    // =========================================================================
    // HANDLERS (LOGIC NGHIỆP VỤ CỐT LÕI)
    // =========================================================================

    const handleApprove = async (id: string) => {
        try {
            await approveMutation.mutateAsync(id)
            toast.success('Đã phê duyệt tài khoản thành công!')
        } catch (error) {
            const err = error as { response?: { data?: { message?: string } } }
            toast.error(
                err.response?.data?.message || 'Lỗi khi phê duyệt tài khoản.'
            )
        }
    }

    const handleReject = async (id: string) => {
        try {
            await rejectMutation.mutateAsync(id)
            toast.success('Đã từ chối tài khoản đăng ký.')
        } catch (error) {
            const err = error as { response?: { data?: { message?: string } } }
            toast.error(
                err.response?.data?.message || 'Lỗi khi từ chối tài khoản.'
            )
        }
    }

    const handleToggleStatus = async (id: string, currentStatus: boolean) => {
        try {
            await toggleStatusMutation.mutateAsync({
                userId: id,
                isActive: !currentStatus,
            })
            toast.success(
                currentStatus
                    ? 'Đã khóa tài khoản thành công'
                    : 'Đã kích hoạt tài khoản'
            )
        } catch (error) {
            const err = error as { response?: { data?: { message?: string } } }
            toast.error(
                err.response?.data?.message ||
                    'Lỗi khi thay đổi trạng thái. Vui lòng kiểm tra dữ liệu.'
            )
        }
    }

    const handleAddMember = async () => {
        if (!selectedTeamId || !selectedNewMemberId) return
        try {
            await addMemberMutation.mutateAsync({
                teamId: selectedTeamId,
                memberId: selectedNewMemberId,
            })
            toast.success('Đã bổ sung nhân sự vào đội hình!')
            setSelectedNewMemberId('')
        } catch (error) {
            const err = error as { response?: { data?: { message?: string } } }
            toast.error(
                err.response?.data?.message || 'Không thể thêm nhân sự này.'
            )
        }
    }

    const handleRemoveMember = async (memberId: string) => {
        if (!selectedTeamId) return
        try {
            await removeMemberMutation.mutateAsync({
                teamId: selectedTeamId,
                memberId,
            })
            toast.success('Đã gỡ nhân sự khỏi đội hình.')
        } catch (error) {
            toast.error('Lỗi khi điều chuyển nhân sự.')
        }
    }

    // =========================================================================
    // HELPERS & MEMO
    // =========================================================================
    const getAvatarText = (fullName?: string) => {
        if (!fullName) return 'U'
        const parts = fullName.trim().split(' ')
        return parts.length > 1
            ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
            : parts[0][0].toUpperCase()
    }

    const filteredAccounts = useMemo(() => {
        return allUsers?.filter(user => {
            const safeFullName = user.fullName || ''
            const safeEmail = user.email || ''
            const matchSearch =
                safeFullName
                    .toLowerCase()
                    .includes(searchAccount.toLowerCase()) ||
                safeEmail.toLowerCase().includes(searchAccount.toLowerCase())
            const matchRole =
                roleFilter === 'all' ||
                user.roles?.includes(roleFilter as ApiRole)
            const matchStatus =
                statusFilter === 'all' ||
                (statusFilter === 'active' ? user.isActive : !user.isActive)
            return matchSearch && matchRole && matchStatus
        })
    }, [allUsers, searchAccount, roleFilter, statusFilter])

    // Reset page when filter changes
    useEffect(() => {
        setAccountPage(1)
    }, [searchAccount, roleFilter, statusFilter])

    const paginatedAccounts = useMemo(() => {
        if (!filteredAccounts) return []
        const startIndex = (accountPage - 1) * ACCOUNTS_PER_PAGE
        return filteredAccounts.slice(
            startIndex,
            startIndex + ACCOUNTS_PER_PAGE
        )
    }, [filteredAccounts, accountPage])

    const totalAccountPages = Math.max(
        1,
        Math.ceil((filteredAccounts?.length || 0) / ACCOUNTS_PER_PAGE)
    )

    const eligibleMembers = allUsers?.filter(
        u =>
            u.isActive &&
            !u.roles?.includes('Rescuer') &&
            !u.roles?.includes('RescuerLeader') &&
            !teamMembers?.find(tm => tm.id === u.id)
    )

    // =========================================================================
    // RENDER UI
    // =========================================================================
    return (
        <SidebarProvider>
            <div className="flex h-screen w-full bg-slate-50/50 font-sans overflow-hidden text-slate-800">
                {/* === SIDEBAR === */}
                <Sidebar className="border-r border-slate-200 bg-white z-50 shadow-sm">
                    <SidebarHeader className="p-6 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-xl shadow-md shadow-blue-600/20">
                                HQ
                            </div>
                            <div>
                                <h1 className="text-lg font-black text-slate-900 tracking-tight leading-tight">
                                    Command Center
                                </h1>
                                <p className="text-[11px] font-bold text-blue-600 uppercase tracking-widest">
                                    Hệ thống chỉ huy
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
                                            ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100'
                                            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                                    )}
                                >
                                    <LayoutDashboard
                                        size={18}
                                        className="mr-3"
                                    />{' '}
                                    <span>Tổng quan</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>

                            <div className="pt-4 pb-2 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                Nhân sự & Quyền
                            </div>

                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    isActive={activeTab === 'approval'}
                                    onClick={() => setActiveTab('approval')}
                                    className={cn(
                                        'py-5 rounded-xl font-bold transition-all duration-200 flex justify-between',
                                        activeTab === 'approval'
                                            ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100'
                                            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                                    )}
                                >
                                    <div className="flex items-center">
                                        <UserPlus size={18} className="mr-3" />{' '}
                                        <span>Phê duyệt</span>
                                    </div>
                                    {pendingUsers &&
                                        pendingUsers.length > 0 && (
                                            <Badge
                                                variant="destructive"
                                                className="ml-auto rounded-full px-2"
                                            >
                                                {pendingUsers.length}
                                            </Badge>
                                        )}
                                </SidebarMenuButton>
                            </SidebarMenuItem>

                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    isActive={activeTab === 'accounts'}
                                    onClick={() => setActiveTab('accounts')}
                                    className={cn(
                                        'py-5 rounded-xl font-bold transition-all duration-200',
                                        activeTab === 'accounts'
                                            ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100'
                                            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                                    )}
                                >
                                    <Users size={18} className="mr-3" />{' '}
                                    <span>Danh bạ</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>

                            <div className="pt-4 pb-2 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                Chiến dịch & Bản đồ
                            </div>

                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    isActive={activeTab === 'teams'}
                                    onClick={() => setActiveTab('teams')}
                                    className={cn(
                                        'py-5 rounded-xl font-bold transition-all duration-200',
                                        activeTab === 'teams'
                                            ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100'
                                            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                                    )}
                                >
                                    <ShieldHalf size={18} className="mr-3" />{' '}
                                    <span>Đội cứu hộ (Teams)</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>

                            {/* === MỤC RESCUE MAP MỚI THÊM VÀO ĐÂY === */}
                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    isActive={activeTab === 'rescue_map'}
                                    onClick={() => setActiveTab('rescue_map')}
                                    className={cn(
                                        'py-5 rounded-xl font-bold transition-all duration-200',
                                        activeTab === 'rescue_map'
                                            ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100'
                                            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                                    )}
                                >
                                    <Map size={18} className="mr-3" />{' '}
                                    <span>Rescue Map</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarContent>

                    <SidebarFooter className="p-4 mt-auto border-t border-slate-100">
                        <div className="flex items-center gap-3 p-2">
                            <Avatar className="w-10 h-10 border-2 border-white shadow-sm">
                                <AvatarImage src="https://ui-avatars.com/api/?name=HQ&background=3b82f6&color=fff" />
                                <AvatarFallback>HQ</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 overflow-hidden">
                                <p className="text-sm font-bold text-slate-800 truncate">
                                    Sĩ quan Chỉ Huy
                                </p>
                                <p className="text-[11px] text-slate-500 truncate">
                                    Hệ thống cấp cao
                                </p>
                            </div>
                        </div>
                    </SidebarFooter>
                </Sidebar>

                <main className="flex-1 flex flex-col relative w-full h-full overflow-hidden">
                    {/* === TOPBAR === */}
                    <header className="flex justify-between items-center px-8 w-full sticky top-0 z-40 bg-white/70 backdrop-blur-xl h-20 border-b border-slate-200/60 shadow-sm">
                        <div className="flex items-center gap-6 flex-1">
                            <h2 className="text-xl font-extrabold text-slate-800 tracking-tight hidden lg:block">
                                {activeTab === 'overview' &&
                                    'Tổng quan hệ thống'}
                                {activeTab === 'approval' &&
                                    'Phê duyệt đăng ký'}
                                {activeTab === 'accounts' && 'Danh bạ nhân sự'}
                                {activeTab === 'teams' && 'Điều phối lực lượng'}
                                {activeTab === 'rescue_map' && 'Bản đồ Cứu hộ'}
                            </h2>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="rounded-full relative text-slate-500 hover:text-blue-600"
                            >
                                <Bell size={20} strokeWidth={2.5} />
                                <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full animate-pulse"></span>
                            </Button>
                        </div>
                    </header>

                    <div className="flex-1 overflow-y-auto p-8 lg:p-10 scroll-smooth">
                        <div className="max-w-7xl mx-auto space-y-10 pb-24">
                            {/* ========================================================================= */}
                            {/* TAB 0: OVERVIEW */}
                            {/* ========================================================================= */}
                            {activeTab === 'overview' && (
                                <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
                                    {/* ROW 1: 4 Cards */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                        <Card>
                                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                                <CardTitle className="text-sm font-bold text-slate-500">
                                                    Chờ duyệt
                                                </CardTitle>
                                                <UserPlus
                                                    size={20}
                                                    className="text-amber-500"
                                                />
                                            </CardHeader>
                                            <CardContent>
                                                <div className="text-4xl font-black text-slate-800">
                                                    {pendingUsers?.length || 0}
                                                </div>
                                                <p className="text-xs text-amber-600 mt-2 flex items-center font-semibold">
                                                    <TrendingUp
                                                        size={14}
                                                        className="mr-1"
                                                    />{' '}
                                                    +12% so với tuần trước
                                                </p>
                                            </CardContent>
                                        </Card>

                                        <Card>
                                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                                <CardTitle className="text-sm font-bold text-slate-500">
                                                    Tổng nhân sự
                                                </CardTitle>
                                                <Users
                                                    size={20}
                                                    className="text-blue-500"
                                                />
                                            </CardHeader>
                                            <CardContent>
                                                <div className="text-4xl font-black text-slate-800">
                                                    {allUsers?.length || 0}
                                                </div>
                                                <p className="text-xs text-blue-600 mt-2 flex items-center font-semibold">
                                                    <CheckCircle
                                                        size={14}
                                                        className="mr-1"
                                                    />{' '}
                                                    Sẵn sàng huy động
                                                </p>
                                            </CardContent>
                                        </Card>

                                        <Card>
                                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                                <CardTitle className="text-sm font-bold text-slate-500">
                                                    Đội cứu hộ
                                                </CardTitle>
                                                <ShieldHalf
                                                    size={20}
                                                    className="text-emerald-500"
                                                />
                                            </CardHeader>
                                            <CardContent>
                                                <div className="text-4xl font-black text-slate-800">
                                                    {teams?.length || 0}
                                                </div>
                                                <p className="text-xs text-emerald-600 mt-2 flex items-center font-semibold">
                                                    <ShieldCheck
                                                        size={14}
                                                        className="mr-1"
                                                    />{' '}
                                                    Lực lượng nòng cốt
                                                </p>
                                            </CardContent>
                                        </Card>

                                        <Card>
                                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                                <CardTitle className="text-sm font-bold text-slate-500">
                                                    Tốc độ phản ứng
                                                </CardTitle>
                                                <Zap
                                                    size={20}
                                                    className="text-rose-500"
                                                />
                                            </CardHeader>
                                            <CardContent>
                                                <div className="text-4xl font-black text-slate-800">
                                                    4.2<span className="text-xl">p</span>
                                                </div>
                                                <p className="text-xs text-emerald-600 mt-2 flex items-center font-semibold">
                                                    <TrendingDown
                                                        size={14}
                                                        className="mr-1"
                                                    />{' '}
                                                    Nhanh hơn 15%
                                                </p>
                                            </CardContent>
                                        </Card>
                                    </div>

                                    {/* ROW 2: Charts and Teams */}
                                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                                        <Card className="col-span-1 lg:col-span-3">
                                            <CardHeader>
                                                <CardTitle className="font-bold text-slate-800">
                                                    Biểu đồ hoạt động cứu hộ
                                                </CardTitle>
                                                <CardDescription>
                                                    Thống kê số yêu cầu và hoàn thành trong 7 ngày qua
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <ChartContainer
                                                    config={{
                                                        requests: {
                                                            label: 'Yêu cầu',
                                                            color: '#e11d48',
                                                        },
                                                        resolved: {
                                                            label: 'Hoàn thành',
                                                            color: '#2563eb',
                                                        },
                                                    }}
                                                    className="min-h-[250px] w-full"
                                                >
                                                    <BarChart
                                                        accessibilityLayer
                                                        data={[
                                                            { day: 'T2', requests: 12, resolved: 10 },
                                                            { day: 'T3', requests: 19, resolved: 15 },
                                                            { day: 'T4', requests: 15, resolved: 14 },
                                                            { day: 'T5', requests: 22, resolved: 20 },
                                                            { day: 'T6', requests: 28, resolved: 25 },
                                                            { day: 'T7', requests: 35, resolved: 30 },
                                                            { day: 'CN', requests: 40, resolved: 35 },
                                                        ]}
                                                    >
                                                        <CartesianGrid vertical={false} />
                                                        <XAxis
                                                            dataKey="day"
                                                            tickLine={false}
                                                            tickMargin={10}
                                                            axisLine={false}
                                                        />
                                                        <ChartTooltip content={<ChartTooltipContent />} />
                                                        <ChartLegend content={<ChartLegendContent />} />
                                                        <Bar
                                                            dataKey="requests"
                                                            fill="var(--color-requests)"
                                                            radius={4}
                                                        />
                                                        <Bar
                                                            dataKey="resolved"
                                                            fill="var(--color-resolved)"
                                                            radius={4}
                                                        />
                                                    </BarChart>
                                                </ChartContainer>
                                            </CardContent>
                                        </Card>

                                        <Card className="col-span-1 lg:col-span-2 flex flex-col">
                                            <CardHeader>
                                                <CardTitle className="font-bold text-slate-800">
                                                    Lực lượng trực ban
                                                </CardTitle>
                                                <CardDescription>
                                                    Trạng thái hiện tại của các đội cứu hộ
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent className="flex-1 overflow-y-auto max-h-[300px] pr-2">
                                                <div className="space-y-4">
                                                    {teams?.map(team => (
                                                        <div
                                                            key={team.id}
                                                            className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100 transition-colors"
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                                                                    {team.teamName.charAt(0)}
                                                                </div>
                                                                <div>
                                                                    <p className="font-semibold text-slate-800 text-sm">
                                                                        {team.teamName}
                                                                    </p>
                                                                    <p className="text-xs text-slate-500">
                                                                        {team.leader?.fullName || 'Chưa rõ'}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <Badge
                                                                variant="outline"
                                                                className={
                                                                    TEAM_STATUS_BADGES[team.status]?.color ||
                                                                    'bg-slate-100 text-slate-700'
                                                                }
                                                            >
                                                                {TEAM_STATUS_BADGES[team.status]?.label || team.status}
                                                            </Badge>
                                                        </div>
                                                    ))}
                                                    {(!teams || teams.length === 0) && (
                                                        <div className="text-center py-8 text-slate-500 text-sm">
                                                            Chưa có đội cứu hộ nào
                                                        </div>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>

                                    {/* ROW 3: Urgent SOS */}
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="font-bold text-slate-800">
                                                Yêu cầu khẩn cấp (Mới nhất)
                                            </CardTitle>
                                            <CardDescription>
                                                Các trường hợp báo cáo sự cố chờ điều động lực lượng
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="overflow-x-auto">
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow className="bg-slate-50 hover:bg-slate-50">
                                                            <TableHead className="font-bold text-slate-600">ID Yêu cầu</TableHead>
                                                            <TableHead className="font-bold text-slate-600">Loại sự cố</TableHead>
                                                            <TableHead className="font-bold text-slate-600">Vị trí báo cáo</TableHead>
                                                            <TableHead className="font-bold text-slate-600">Mức độ</TableHead>
                                                            <TableHead className="text-right font-bold text-slate-600">Hành động</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {isLoadingRequests ? (
                                                            <TableRow>
                                                                <TableCell
                                                                    colSpan={5}
                                                                    className="text-center py-8 text-slate-500"
                                                                >
                                                                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-blue-600" />
                                                                    Đang tải dữ liệu...
                                                                </TableCell>
                                                            </TableRow>
                                                        ) : recentRequests.length === 0 ? (
                                                            <TableRow>
                                                                <TableCell
                                                                    colSpan={5}
                                                                    className="text-center py-8 text-slate-500 font-medium"
                                                                >
                                                                    Không có yêu cầu khẩn cấp nào đang chờ xử lý.
                                                                </TableCell>
                                                            </TableRow>
                                                        ) : (
                                                            recentRequests.map(
                                                                req => (
                                                                    <TableRow key={req.id}>
                                                                        <TableCell className="font-mono text-xs font-semibold text-slate-500">
                                                                            {req.id.slice(0, 8).toUpperCase()}
                                                                        </TableCell>
                                                                        <TableCell className="font-semibold text-slate-800">
                                                                            {EMERGENCY_TYPES[req.emergencyType] || req.emergencyType}
                                                                        </TableCell>
                                                                        <TableCell
                                                                            className="text-slate-600 truncate max-w-[200px]"
                                                                            title={req.location?.address}
                                                                        >
                                                                            {req.location?.address || 'Chưa xác định'}
                                                                        </TableCell>
                                                                        <TableCell>
                                                                            <Badge
                                                                                variant="secondary"
                                                                                className={PRIORITY_BADGES[req.priority]?.color || 'bg-slate-100 text-slate-700'}
                                                                            >
                                                                                {PRIORITY_BADGES[req.priority]?.label || req.priority}
                                                                            </Badge>
                                                                        </TableCell>
                                                                        <TableCell className="text-right">
                                                                            <Button
                                                                                size="sm"
                                                                                variant="default"
                                                                                className="font-bold shadow-md shadow-blue-500/20"
                                                                            >
                                                                                Điều động
                                                                            </Button>
                                                                        </TableCell>
                                                                    </TableRow>
                                                                )
                                                            )
                                                        )}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </section>
                            )}

                            {/* ========================================================================= */}
                            {/* TAB 1: ACCOUNT APPROVAL */}
                            {/* ========================================================================= */}
                            {activeTab === 'approval' && (
                                <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    {isLoadingPending ? (
                                        <div className="flex flex-col items-center justify-center py-32">
                                            <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
                                        </div>
                                    ) : pendingUsers?.length === 0 ? (
                                        <Card className="border-dashed border-2 py-16 shadow-none bg-transparent">
                                            <CardContent className="flex flex-col items-center justify-center text-center">
                                                <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
                                                    <CheckCircle className="h-10 w-10 text-emerald-500" />
                                                </div>
                                                <CardTitle className="text-xl">
                                                    Tất cả đã được xử lý!
                                                </CardTitle>
                                                <CardDescription className="mt-2 text-base">
                                                    Không có tài khoản nào đang
                                                    chờ phê duyệt lúc này.
                                                </CardDescription>
                                            </CardContent>
                                        </Card>
                                    ) : (
                                        <Card className="shadow-sm border-slate-200">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                                                        <TableHead className="w-[300px] font-bold">
                                                            Người đăng ký
                                                        </TableHead>
                                                        <TableHead className="font-bold">
                                                            Vai trò xin cấp
                                                        </TableHead>
                                                        <TableHead className="font-bold">
                                                            Liên hệ
                                                        </TableHead>
                                                        <TableHead className="text-right font-bold">
                                                            Quyết định
                                                        </TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {pendingUsers?.map(user => (
                                                        <TableRow
                                                            key={user.id}
                                                            className="hover:bg-slate-50/80 transition-colors"
                                                        >
                                                            <TableCell className="py-4">
                                                                <div className="flex items-center gap-4">
                                                                    <Avatar className="w-12 h-12 border border-slate-200">
                                                                        <AvatarFallback className="bg-slate-100 text-slate-700 font-bold">
                                                                            {getAvatarText(
                                                                                user.fullName
                                                                            )}
                                                                        </AvatarFallback>
                                                                    </Avatar>
                                                                    <div>
                                                                        <p className="font-bold text-sm text-slate-900">
                                                                            {user.fullName ||
                                                                                'Unknown'}
                                                                        </p>
                                                                        <p className="text-xs text-slate-500 font-medium">
                                                                            @
                                                                            {
                                                                                user.userName
                                                                            }
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Badge
                                                                    variant="secondary"
                                                                    className="bg-blue-50 text-blue-700 border-blue-100 uppercase tracking-wider text-[10px] font-black"
                                                                >
                                                                    {user
                                                                        .roles?.[0] ||
                                                                        'USER'}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="space-y-1">
                                                                    <p className="text-sm text-slate-600 flex items-center gap-2">
                                                                        <Mail
                                                                            size={
                                                                                14
                                                                            }
                                                                            className="text-slate-400"
                                                                        />{' '}
                                                                        {user.email ||
                                                                            'N/A'}
                                                                    </p>
                                                                    <p className="text-sm text-slate-600 flex items-center gap-2">
                                                                        <Phone
                                                                            size={
                                                                                14
                                                                            }
                                                                            className="text-slate-400"
                                                                        />{' '}
                                                                        {user.phoneNumber ||
                                                                            'N/A'}
                                                                    </p>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                <div className="flex justify-end gap-2">
                                                                    <Button
                                                                        variant="outline"
                                                                        className="border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                                                                        onClick={() =>
                                                                            handleReject(
                                                                                user.id
                                                                            )
                                                                        }
                                                                        disabled={
                                                                            rejectMutation.isPending
                                                                        }
                                                                    >
                                                                        {rejectMutation.isPending ? (
                                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                                        ) : (
                                                                            <X className="w-4 h-4 mr-1" />
                                                                        )}{' '}
                                                                        Từ chối
                                                                    </Button>
                                                                    <Button
                                                                        variant="default"
                                                                        className="bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20"
                                                                        onClick={() =>
                                                                            handleApprove(
                                                                                user.id
                                                                            )
                                                                        }
                                                                        disabled={
                                                                            approveMutation.isPending
                                                                        }
                                                                    >
                                                                        {approveMutation.isPending ? (
                                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                                        ) : (
                                                                            <CheckCircle className="w-4 h-4 mr-1" />
                                                                        )}{' '}
                                                                        Phê
                                                                        duyệt
                                                                    </Button>
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </Card>
                                    )}
                                </section>
                            )}

                            {/* ========================================================================= */}
                            {/* TAB 2: ACCOUNT MANAGEMENT */}
                            {/* ========================================================================= */}
                            {activeTab === 'accounts' && (
                                <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <Card className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm border-slate-200">
                                        <div className="relative w-full md:w-96">
                                            <Search
                                                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                                size={18}
                                            />
                                            <Input
                                                className="pl-10 bg-slate-50/50"
                                                placeholder="Tìm theo Tên, Email..."
                                                value={searchAccount}
                                                onChange={e =>
                                                    setSearchAccount(
                                                        e.target.value
                                                    )
                                                }
                                            />
                                        </div>
                                        <div className="flex gap-3 w-full md:w-auto">
                                            <Select
                                                value={roleFilter}
                                                onValueChange={setRoleFilter}
                                            >
                                                <SelectTrigger className="w-[180px] bg-slate-50/50">
                                                    <Filter
                                                        size={14}
                                                        className="mr-2 text-slate-500"
                                                    />
                                                    <SelectValue placeholder="Lọc theo Vai trò" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">
                                                        Tất cả vai trò
                                                    </SelectItem>
                                                    <SelectItem value="Commander">
                                                        Chỉ huy (Commander)
                                                    </SelectItem>
                                                    <SelectItem value="Dispatcher">
                                                        Điều phối (Dispatcher)
                                                    </SelectItem>
                                                    <SelectItem value="Rescuer">
                                                        Cứu hộ (Rescuer)
                                                    </SelectItem>
                                                    <SelectItem value="Citizen">
                                                        Người dân (Citizen)
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <Select
                                                value={statusFilter}
                                                onValueChange={setStatusFilter}
                                            >
                                                <SelectTrigger className="w-[180px] bg-slate-50/50">
                                                    <Activity
                                                        size={14}
                                                        className="mr-2 text-slate-500"
                                                    />
                                                    <SelectValue placeholder="Lọc trạng thái" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">
                                                        Mọi trạng thái
                                                    </SelectItem>
                                                    <SelectItem value="active">
                                                        Đang hoạt động
                                                    </SelectItem>
                                                    <SelectItem value="locked">
                                                        Bị khóa
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </Card>

                                    {isLoadingUsers ? (
                                        <div className="flex justify-center py-20">
                                            <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
                                        </div>
                                    ) : (
                                        <Card className="shadow-sm overflow-hidden border-slate-200">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                                                        <TableHead className="font-bold">
                                                            Nhân sự
                                                        </TableHead>
                                                        <TableHead className="font-bold">
                                                            Vai trò
                                                        </TableHead>
                                                        <TableHead className="font-bold">
                                                            Trạng thái
                                                        </TableHead>
                                                        <TableHead className="text-right font-bold">
                                                            Hành động
                                                        </TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {paginatedAccounts?.length ===
                                                    0 ? (
                                                        <TableRow>
                                                            <TableCell
                                                                colSpan={4}
                                                                className="text-center py-10 text-slate-500"
                                                            >
                                                                Không tìm thấy
                                                                kết quả.
                                                            </TableCell>
                                                        </TableRow>
                                                    ) : (
                                                        paginatedAccounts?.map(
                                                            acc => (
                                                                <TableRow
                                                                    key={acc.id}
                                                                    className="hover:bg-slate-50/50 transition-colors"
                                                                >
                                                                    <TableCell className="py-4">
                                                                        <div className="flex items-center gap-4">
                                                                            <Avatar>
                                                                                <AvatarFallback className="bg-slate-100 text-slate-600 font-bold border border-slate-200">
                                                                                    {getAvatarText(
                                                                                        acc.fullName
                                                                                    )}
                                                                                </AvatarFallback>
                                                                            </Avatar>
                                                                            <div>
                                                                                <p className="font-bold text-sm text-slate-900">
                                                                                    {
                                                                                        acc.fullName
                                                                                    }
                                                                                </p>
                                                                                <p className="text-xs text-slate-500 font-medium">
                                                                                    {
                                                                                        acc.email
                                                                                    }
                                                                                </p>
                                                                            </div>
                                                                        </div>
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        <div className="flex gap-1.5 flex-wrap">
                                                                            {acc.roles?.map(
                                                                                role => {
                                                                                    const roleStyle =
                                                                                        ROLE_BADGES[
                                                                                            role
                                                                                        ] || {
                                                                                            text: role,
                                                                                            color: 'bg-slate-50 text-slate-600 border border-slate-200 font-medium',
                                                                                        }

                                                                                    return (
                                                                                        <Badge
                                                                                            key={
                                                                                                role
                                                                                            }
                                                                                            variant="outline"
                                                                                            className={cn(
                                                                                                'text-[10px] px-2.5 py-0.5 rounded-md uppercase',
                                                                                                roleStyle.color
                                                                                            )}
                                                                                        >
                                                                                            {
                                                                                                roleStyle.text
                                                                                            }
                                                                                        </Badge>
                                                                                    )
                                                                                }
                                                                            )}
                                                                        </div>
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        <div className="flex items-center gap-2">
                                                                            <span
                                                                                className={cn(
                                                                                    'w-2.5 h-2.5 rounded-full shadow-sm',
                                                                                    acc.isActive
                                                                                        ? 'bg-emerald-500'
                                                                                        : 'bg-rose-500'
                                                                                )}
                                                                            ></span>
                                                                            <span
                                                                                className={cn(
                                                                                    'text-xs font-bold',
                                                                                    acc.isActive
                                                                                        ? 'text-emerald-600'
                                                                                        : 'text-rose-600'
                                                                                )}
                                                                            >
                                                                                {acc.isActive
                                                                                    ? 'Hoạt động'
                                                                                    : 'Bị khóa'}
                                                                            </span>
                                                                        </div>
                                                                    </TableCell>
                                                                    <TableCell className="text-right">
                                                                        <Button
                                                                            variant="outline"
                                                                            size="icon"
                                                                            onClick={() =>
                                                                                handleToggleStatus(
                                                                                    acc.id,
                                                                                    acc.isActive
                                                                                )
                                                                            }
                                                                            disabled={
                                                                                toggleStatusMutation.isPending
                                                                            }
                                                                            className={cn(
                                                                                'rounded-lg',
                                                                                acc.isActive
                                                                                    ? 'text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200'
                                                                                    : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border-emerald-200'
                                                                            )}
                                                                            title={
                                                                                acc.isActive
                                                                                    ? 'Khóa tài khoản'
                                                                                    : 'Mở khóa tài khoản'
                                                                            }
                                                                        >
                                                                            {acc.isActive ? (
                                                                                <ToggleRight
                                                                                    size={
                                                                                        20
                                                                                    }
                                                                                />
                                                                            ) : (
                                                                                <ToggleLeft
                                                                                    size={
                                                                                        20
                                                                                    }
                                                                                />
                                                                            )}
                                                                        </Button>
                                                                    </TableCell>
                                                                </TableRow>
                                                            )
                                                        )
                                                    )}
                                                </TableBody>
                                            </Table>

                                            {/* Pagination Controls */}
                                            {filteredAccounts &&
                                                filteredAccounts.length > 0 && (
                                                    <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50/50">
                                                        <div className="text-sm font-medium text-slate-500">
                                                            Hiển thị{' '}
                                                            {(accountPage - 1) *
                                                                ACCOUNTS_PER_PAGE +
                                                                1}{' '}
                                                            -{' '}
                                                            {Math.min(
                                                                accountPage *
                                                                    ACCOUNTS_PER_PAGE,
                                                                filteredAccounts.length
                                                            )}{' '}
                                                            trong số{' '}
                                                            {
                                                                filteredAccounts.length
                                                            }{' '}
                                                            nhân sự
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="h-8 w-8 p-0"
                                                                onClick={() =>
                                                                    setAccountPage(
                                                                        p =>
                                                                            Math.max(
                                                                                1,
                                                                                p -
                                                                                    1
                                                                            )
                                                                    )
                                                                }
                                                                disabled={
                                                                    accountPage ===
                                                                    1
                                                                }
                                                            >
                                                                <ChevronLeft className="h-4 w-4" />
                                                                <span className="sr-only">
                                                                    Trang trước
                                                                </span>
                                                            </Button>

                                                            <div className="flex items-center gap-1">
                                                                {Array.from({
                                                                    length: totalAccountPages,
                                                                }).map(
                                                                    (
                                                                        _,
                                                                        idx
                                                                    ) => {
                                                                        const pageNum =
                                                                            idx +
                                                                            1
                                                                        // Hiển thị giới hạn số trang (ví dụ chỉ hiện trang đầu, cuối và các trang xung quanh trang hiện tại)
                                                                        if (
                                                                            totalAccountPages <=
                                                                                5 ||
                                                                            pageNum ===
                                                                                1 ||
                                                                            pageNum ===
                                                                                totalAccountPages ||
                                                                            (pageNum >=
                                                                                accountPage -
                                                                                    1 &&
                                                                                pageNum <=
                                                                                    accountPage +
                                                                                        1)
                                                                        ) {
                                                                            return (
                                                                                <Button
                                                                                    key={
                                                                                        pageNum
                                                                                    }
                                                                                    variant={
                                                                                        accountPage ===
                                                                                        pageNum
                                                                                            ? 'default'
                                                                                            : 'outline'
                                                                                    }
                                                                                    size="sm"
                                                                                    className={cn(
                                                                                        'h-8 min-w-8 px-2 font-semibold',
                                                                                        accountPage ===
                                                                                            pageNum
                                                                                            ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20'
                                                                                            : 'text-slate-600 hover:text-slate-900'
                                                                                    )}
                                                                                    onClick={() =>
                                                                                        setAccountPage(
                                                                                            pageNum
                                                                                        )
                                                                                    }
                                                                                >
                                                                                    {
                                                                                        pageNum
                                                                                    }
                                                                                </Button>
                                                                            )
                                                                        } else if (
                                                                            (pageNum ===
                                                                                accountPage -
                                                                                    2 &&
                                                                                pageNum >
                                                                                    2) ||
                                                                            (pageNum ===
                                                                                accountPage +
                                                                                    2 &&
                                                                                pageNum <
                                                                                    totalAccountPages -
                                                                                        1)
                                                                        ) {
                                                                            return (
                                                                                <span
                                                                                    key={
                                                                                        pageNum
                                                                                    }
                                                                                    className="text-slate-400 px-1"
                                                                                >
                                                                                    ...
                                                                                </span>
                                                                            )
                                                                        }
                                                                        return null
                                                                    }
                                                                )}
                                                            </div>

                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="h-8 w-8 p-0"
                                                                onClick={() =>
                                                                    setAccountPage(
                                                                        p =>
                                                                            Math.min(
                                                                                totalAccountPages,
                                                                                p +
                                                                                    1
                                                                            )
                                                                    )
                                                                }
                                                                disabled={
                                                                    accountPage ===
                                                                    totalAccountPages
                                                                }
                                                            >
                                                                <ChevronRight className="h-4 w-4" />
                                                                <span className="sr-only">
                                                                    Trang sau
                                                                </span>
                                                            </Button>
                                                        </div>
                                                    </div>
                                                )}
                                        </Card>
                                    )}
                                </section>
                            )}

                            {/* ========================================================================= */}
                            {/* TAB 3: TEAM MANAGEMENT */}
                            {/* ========================================================================= */}
                            {activeTab === 'teams' && (
                                <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="flex justify-end mb-6">
                                        <Button
                                            className="bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/20 font-bold"
                                            onClick={() => {
                                                router.push(
                                                    '/commander/teams/create'
                                                )
                                            }}
                                        >
                                            <Plus className="mr-2 h-4 w-4" />{' '}
                                            Thành lập Đội Mới
                                        </Button>
                                    </div>

                                    {isLoadingTeams ? (
                                        <div className="flex justify-center py-20">
                                            <Loader2 className="animate-spin text-blue-600 w-10 h-10" />
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                                            {teams?.map(
                                                (team: RescueTeamSummary) => {
                                                    const statusStyle =
                                                        TEAM_STATUS_BADGES[
                                                            team.status
                                                        ] || {
                                                            text: 'Không rõ',
                                                            variant: 'outline',
                                                            color: 'bg-slate-50 text-slate-600 border border-slate-200 font-medium',
                                                        }
                                                    return (
                                                        <Card
                                                            key={team.id}
                                                            className="group flex flex-col rounded-2xl border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-500/10 overflow-hidden"
                                                        >
                                                            <div className="relative p-5 pb-8 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
                                                                <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f00a_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f00a_1px,transparent_1px)] bg-[size:1rem_1rem] opacity-50"></div>

                                                                <div className="relative z-10 flex items-start justify-between gap-4">
                                                                    <div className="space-y-1.5 flex-1">
                                                                        <h4 className="text-lg font-black text-white tracking-tight line-clamp-1">
                                                                            {
                                                                                team.teamName
                                                                            }
                                                                        </h4>
                                                                        <p className="text-xs text-slate-400 font-medium line-clamp-1 max-w-[90%]">
                                                                            {team.description ||
                                                                                'Lực lượng phản ứng nhanh'}
                                                                        </p>
                                                                    </div>
                                                                    <Badge
                                                                        variant={
                                                                            statusStyle.variant
                                                                        }
                                                                        className={cn(
                                                                            'shrink-0 text-[10px] font-black tracking-wider uppercase shadow-sm border',
                                                                            statusStyle.color
                                                                        )}
                                                                    >
                                                                        {
                                                                            statusStyle.text
                                                                        }
                                                                    </Badge>
                                                                </div>
                                                            </div>

                                                            <CardContent className="relative flex-1 p-5 pt-0">
                                                                <div className="flex items-end justify-between -mt-6 mb-5 relative z-20">
                                                                    <div className="relative">
                                                                        <Avatar className="w-14 h-14 border-4 border-white shadow-md bg-white">
                                                                            <AvatarFallback className="bg-gradient-to-br from-amber-100 to-amber-200 text-amber-700 font-black text-lg">
                                                                                {team
                                                                                    .leader
                                                                                    ?.fullName
                                                                                    ? getAvatarText(
                                                                                          team
                                                                                              .leader
                                                                                              .fullName
                                                                                      )
                                                                                    : 'LD'}
                                                                            </AvatarFallback>
                                                                        </Avatar>
                                                                        <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-amber-500 text-white shadow-sm">
                                                                            <Crown
                                                                                size={
                                                                                    10
                                                                                }
                                                                                strokeWidth={
                                                                                    3
                                                                                }
                                                                            />
                                                                        </div>
                                                                    </div>

                                                                    <div className="mb-1 text-right">
                                                                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                                                            Sĩ
                                                                            quan
                                                                            chỉ
                                                                            huy
                                                                        </p>
                                                                        <p className="text-sm font-bold text-slate-800 line-clamp-1">
                                                                            {team
                                                                                .leader
                                                                                ?.fullName ||
                                                                                'Chưa bổ nhiệm'}
                                                                        </p>
                                                                    </div>
                                                                </div>

                                                                <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4 transition-colors group-hover:bg-blue-50/50 group-hover:border-blue-100">
                                                                    <div className="flex items-center gap-4">
                                                                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm border border-slate-100 transition-transform group-hover:scale-105 group-hover:text-blue-700">
                                                                            <Users
                                                                                size={
                                                                                    20
                                                                                }
                                                                                strokeWidth={
                                                                                    2.5
                                                                                }
                                                                            />
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-2xl font-black text-slate-800 leading-none transition-colors group-hover:text-blue-700">
                                                                                {team.memberCount ||
                                                                                    0}
                                                                            </p>
                                                                            <p className="text-[10px] font-bold text-slate-500 mt-1.5 uppercase tracking-widest">
                                                                                Nhân
                                                                                sự
                                                                                biên
                                                                                chế
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </CardContent>

                                                            <CardFooter className="p-5 pt-0 mt-auto">
                                                                <Button
                                                                    variant="outline"
                                                                    className="w-full bg-white hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 border-slate-200 font-bold shadow-sm transition-all h-11"
                                                                    onClick={() =>
                                                                        router.push(
                                                                            `/commander/teams/${team.id}/manage`
                                                                        )
                                                                    }
                                                                >
                                                                    Quản lý Đội
                                                                    hình & Nhân
                                                                    sự
                                                                </Button>
                                                            </CardFooter>
                                                        </Card>
                                                    )
                                                }
                                            )}
                                        </div>
                                    )}
                                </section>
                            )}

                            {/* ========================================================================= */}
                            {/* TAB 4: RESCUE MAP */}
                            {/* ========================================================================= */}
                            {activeTab === 'rescue_map' && (
                                <section className="absolute inset-x-0 bottom-0 top-20 flex overflow-hidden bg-white">
                                    {/* 1. Danh sách đội */}
                                    <div className="w-[380px] shrink-0 border-r border-slate-200 bg-white flex flex-col h-full overflow-hidden">
                                        <RescueTeamsList
                                            selectedTeamId={mapSelectedTeamId}
                                            onSelectTeam={handleMapSelectTeam}
                                            onHoverTeam={handleMapHoverTeam}
                                            onTeamAction={handleMapTeamAction}
                                        />
                                    </div>

                                    {/* 2. Bản đồ*/}
                                    <div className="flex-1 relative h-full bg-slate-100">
                                        <MapView
                                            selectedTeamId={mapSelectedTeamId}
                                            hoveredTeamId={mapHoveredTeamId}
                                            onSelectTeam={handleMapSelectTeam}
                                            onHoverTeam={handleMapHoverTeam}
                                        />
                                    </div>

                                    {/* 3. Action Panel */}
                                    {mapSelectedTeamId && (
                                        <div className="w-[350px] shrink-0 border-l border-slate-200 bg-white shadow-xl h-full animate-in slide-in-from-right-10 duration-300">
                                            <ActionPanel
                                                key={mapSelectedTeamId}
                                                selectedTeamId={
                                                    mapSelectedTeamId
                                                }
                                                onClose={() =>
                                                    setMapSelectedTeamId(
                                                        undefined
                                                    )
                                                }
                                                isChangeStatusOpen={
                                                    isChangeStatusOpen
                                                }
                                                onOpenChangeStatus={
                                                    setIsChangeStatusOpen
                                                }
                                            />
                                        </div>
                                    )}
                                </section>
                            )}
                        </div>
                    </div>
                </main>

                {/* ========================================================================= */}
                {/* MODAL 1: TEAM MANAGEMENT (QUẢN LÝ NHÂN SỰ ĐỘI ĐÃ CÓ SẴN) */}
                {/* ========================================================================= */}
                <Dialog
                    open={!!selectedTeamId}
                    onOpenChange={open => !open && setSelectedTeamId(null)}
                >
                    <DialogContent className="sm:max-w-2xl p-0 overflow-hidden rounded-[2rem] border-slate-200 shadow-2xl">
                        <div className="relative p-6 md:p-8 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
                            <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f00a_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f00a_1px,transparent_1px)] bg-[size:1rem_1rem] opacity-50"></div>

                            <div className="relative z-10 flex items-center gap-5">
                                <div className="w-14 h-14 rounded-2xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400 shadow-inner">
                                    <ShieldHalf size={28} strokeWidth={2} />
                                </div>
                                <div>
                                    <DialogTitle className="text-2xl font-black text-white tracking-tight">
                                        Bộ Chỉ Huy Lực Lượng
                                    </DialogTitle>
                                    <DialogDescription className="text-slate-400 mt-1.5 font-medium text-sm">
                                        Bổ sung biên chế hoặc điều chuyển nhân
                                        sự trực thuộc đội.
                                    </DialogDescription>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 md:p-8 bg-slate-50/80 space-y-6">
                            <div className="flex-1">
                                <Select
                                    value={selectedNewMemberId}
                                    onValueChange={setSelectedNewMemberId}
                                >
                                    <SelectTrigger className="w-full bg-white h-12 shadow-sm">
                                        <SelectValue placeholder="Chọn nhân sự để thêm..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {eligibleMembers?.map(u => (
                                            <SelectItem key={u.id} value={u.id}>
                                                {u.fullName} - {u.email}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Button
                                    type="button"
                                    disabled={
                                        !selectedNewMemberId ||
                                        addMemberMutation.isPending
                                    }
                                    onClick={handleAddMember}
                                    className="mt-3 h-12 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-500/20 w-full"
                                >
                                    {addMemberMutation.isPending ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <>
                                            <Plus className="w-4 h-4 mr-2" />
                                            Xác nhận thêm nhân sự
                                        </>
                                    )}
                                </Button>
                            </div>

                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                                <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                        <Users
                                            size={16}
                                            className="text-blue-600"
                                        />{' '}
                                        Danh sách biên chế
                                    </h3>
                                    <Badge
                                        variant="secondary"
                                        className="bg-blue-100 text-blue-800 font-black border-none"
                                    >
                                        {teamMembers?.length || 0} nhân sự
                                    </Badge>
                                </div>

                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableBody>
                                            {isLoadingMembers ? (
                                                <TableRow>
                                                    <TableCell
                                                        colSpan={2}
                                                        className="h-40 text-center"
                                                    >
                                                        <div className="flex flex-col items-center justify-center text-slate-500">
                                                            <Loader2 className="animate-spin text-blue-600 w-8 h-8 mb-3" />
                                                            <span className="text-sm font-medium">
                                                                Đang tải hồ sơ
                                                                nhân sự...
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ) : teamMembers?.length === 0 ? (
                                                <TableRow>
                                                    <TableCell
                                                        colSpan={2}
                                                        className="h-48 text-center hover:bg-transparent"
                                                    >
                                                        <div className="flex flex-col items-center justify-center py-6">
                                                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-3 border border-slate-100">
                                                                <UserMinus className="text-slate-300 w-8 h-8" />
                                                            </div>
                                                            <p className="text-slate-700 font-bold text-base">
                                                                Lực lượng đang
                                                                trống
                                                            </p>
                                                            <p className="text-slate-500 text-sm mt-1 max-w-[250px] mx-auto">
                                                                Đội cứu hộ này
                                                                hiện chưa có
                                                                thành viên nào.
                                                                Hãy bổ sung ở
                                                                phía trên.
                                                            </p>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                teamMembers?.map(
                                                    (
                                                        member: RescueTeamMemberDTO
                                                    ) => (
                                                        <TableRow
                                                            key={member.id}
                                                            className="hover:bg-blue-50/30 transition-colors group"
                                                        >
                                                            <TableCell className="py-4 pl-5">
                                                                <div className="flex items-center gap-4">
                                                                    <Avatar className="w-11 h-11 border border-slate-200 shadow-sm bg-white">
                                                                        <AvatarFallback className="bg-slate-100 text-slate-700 font-black">
                                                                            {getAvatarText(
                                                                                member.fullName
                                                                            )}
                                                                        </AvatarFallback>
                                                                    </Avatar>
                                                                    <div>
                                                                        <p className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                                                                            {
                                                                                member.fullName
                                                                            }
                                                                        </p>
                                                                        <p className="text-xs text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                                                                            <Mail
                                                                                size={
                                                                                    10
                                                                                }
                                                                            />{' '}
                                                                            {
                                                                                member.email
                                                                            }
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="text-right pr-5">
                                                                <Button
                                                                    variant="outline"
                                                                    size="icon"
                                                                    className="text-rose-500 border-rose-100 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-all shadow-sm"
                                                                    onClick={() =>
                                                                        handleRemoveMember(
                                                                            member.id
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        removeMemberMutation.isPending
                                                                    }
                                                                    title="Loại khỏi đội"
                                                                >
                                                                    <UserMinus
                                                                        size={
                                                                            18
                                                                        }
                                                                    />
                                                                </Button>
                                                            </TableCell>
                                                        </TableRow>
                                                    )
                                                )
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </SidebarProvider>
    )
}
