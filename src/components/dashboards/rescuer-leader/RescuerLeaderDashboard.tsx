'use client'

import { useState, useMemo, useCallback } from 'react'
import {
    ShieldAlert,
    Activity,
    History,
    Users,
    Bell,
    LogOut,
    User,
    Loader2,
    CheckCircle2,
    XCircle,
    Clock,
    MapPin,
    ChevronRight,
    Send,
    AlertTriangle,
    Megaphone,
    CalendarCheck,
    Siren,
    Zap,
    BarChart3,
    TrendingUp,
    Navigation,
    Flag,
    Hammer,
    Info,
    UserCheck,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { format, formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'
import { cn } from '@/lib/utils'

// UI Components
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
    SidebarTrigger,
} from '@/components/ui/sidebar'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { dictTeamStatus, dictPriority, dictType } from '@/constants/dictionary'
import { NotificationBell, NotificationItem } from '@/components/shared/NotificationBell'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'

// APIs & Hooks
import { useLogout } from '@/lib/api/use-auth'
import { useProfileQuery } from '@/lib/api/features/auth/auth.queries'
import {
    useRescueTeamDetail,
    useTeamMissions,
    useRescueTeamMembers,
} from '@/lib/api/features/commander/commander-dashboard.queries'
import {
    useAcceptMissionMutation,
    useRejectMissionMutation,
    useUpdateMissionProgressMutation,
    useFinishMissionMutation,
    useAddMissionHistoryMutation,
    useAbortMissionMutation,
} from '@/lib/api/features/missions/rescuer-leader.mutations'
import { useMissionDetail } from '@/lib/api/features/missions/missions.queries'
import {
    useCreateChecklist,
    useDeleteChecklist,
    useCreateChecklistItem,
    useUpdateChecklistItem,
    useDeleteChecklistItem,
} from '@/lib/api/features/checklists/checklists.queries'
import { Trash2, Plus, CheckSquare, Square, ListTodo, Phone } from 'lucide-react'
import type { MissionSummary } from '@/lib/api/features/missions/missions.types'
import type { RescueTeamMemberDTO } from '@/lib/api/features/rescueTeams/rescueTeams.types'
import { getInitials } from '@/lib/utils/initials'
import LeaveApprovalsView from '@/components/dashboards/rescuer-leader/LeaveApprovalsView'
import JoinRequestsView from '@/components/dashboards/rescuer-leader/JoinRequestsView'
import { useTeamLeaveRequests } from '@/lib/api/features/leaveRequests/leaveRequests.queries'
import { useTeamJoinRequests } from '@/lib/api/features/joinRequests/joinRequest.queries'

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────
type TabId =
    | 'overview'
    | 'pending_missions'
    | 'active_mission'
    | 'team_members'
    | 'join_requests'
    | 'leave_approvals'
    | 'mission_history'

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────
const MISSION_STATUS_LABELS: Record<string, string> = {
    ASSIGNED: 'Chờ tiếp nhận',
    EN_ROUTE: 'Đang di chuyển',
    ON_SITE: 'Tại hiện trường',
    IN_PROGRESS: 'Đang cứu hộ',
    COMPLETED: 'Hoàn thành',
    ABORTED: 'Đã hủy',
}

const MISSION_STATUS_COLORS: Record<
    string,
    { bg: string; text: string; dot: string; border: string }
> = {
    ASSIGNED: {
        bg: 'bg-amber-500/15',
        text: 'text-amber-400',
        dot: 'bg-amber-400',
        border: 'border-amber-500/30',
    },
    EN_ROUTE: {
        bg: 'bg-blue-500/15',
        text: 'text-blue-400',
        dot: 'bg-blue-400',
        border: 'border-blue-500/30',
    },
    ON_SITE: {
        bg: 'bg-violet-500/15',
        text: 'text-violet-400',
        dot: 'bg-violet-400',
        border: 'border-violet-500/30',
    },
    IN_PROGRESS: {
        bg: 'bg-orange-500/15',
        text: 'text-orange-400',
        dot: 'bg-orange-400',
        border: 'border-orange-500/30',
    },
    COMPLETED: {
        bg: 'bg-emerald-500/15',
        text: 'text-emerald-400',
        dot: 'bg-emerald-400',
        border: 'border-emerald-500/30',
    },
    ABORTED: {
        bg: 'bg-rose-500/15',
        text: 'text-rose-400',
        dot: 'bg-rose-400',
        border: 'border-rose-500/30',
    },
}

const NEXT_STATUS_MAP: Record<string, string | null> = {
    EN_ROUTE: 'ON_SITE',
    ON_SITE: 'IN_PROGRESS',
    IN_PROGRESS: null,
}

const NEXT_STATUS_LABEL: Record<string, string> = {
    ON_SITE: 'Đã đến hiện trường',
    IN_PROGRESS: 'Bắt đầu cứu hộ',
}

const MISSION_PROGRESS_PERCENT: Record<string, string> = {
    EN_ROUTE: '25%',
    ON_SITE: '50%',
    IN_PROGRESS: '75%',
}

const MISSION_PROGRESS_VALUE: Record<string, number> = {
    EN_ROUTE: 25,
    ON_SITE: 50,
    IN_PROGRESS: 75,
}

const MISSION_TIMELINE_WIDTH: Record<string, string> = {
    EN_ROUTE: '0%',
    ON_SITE: '33%',
    IN_PROGRESS: '66%',
    COMPLETED: '100%',
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────
function MissionStatusBadge({ status }: { status: string }) {
    const colors = MISSION_STATUS_COLORS[status] ?? MISSION_STATUS_COLORS.ASSIGNED
    return (
        <span
            className={cn(
                'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border',
                colors.bg,
                colors.text,
                colors.border
            )}
        >
            <span className={cn('w-1.5 h-1.5 rounded-full', colors.dot)} />
            {MISSION_STATUS_LABELS[status] ?? status}
        </span>
    )
}

function StatCard({
    label,
    value,
    icon: Icon,
    trend,
    color = 'slate',
}: {
    label: string
    value: number | string
    icon: React.ElementType
    trend?: string
    color?: 'slate' | 'amber' | 'emerald' | 'rose' | 'blue' | 'orange'
}) {
    const colorMap = {
        slate: 'from-white to-slate-100 text-slate-600',
        amber: 'from-amber-600/20 to-amber-700/10 text-amber-400',
        emerald: 'from-emerald-600/20 to-emerald-700/10 text-emerald-400',
        rose: 'from-rose-600/20 to-rose-700/10 text-rose-400',
        blue: 'from-blue-600/20 to-blue-700/10 text-blue-400',
        orange: 'from-orange-600/20 to-orange-700/10 text-orange-400',
    }
    return (
        <div
            className={cn(
                'rounded-2xl p-5 border border-slate-900/5 bg-gradient-to-br',
                colorMap[color]
            )}
        >
            <div className="flex items-start justify-between mb-3">
                <p className="text-sm font-semibold text-slate-500">{label}</p>
                <Icon className="w-5 h-5 opacity-70" />
            </div>
            <p className="text-3xl font-black text-slate-900">{value}</p>
            {trend && (
                <p className="text-xs font-medium mt-2 opacity-70">{trend}</p>
            )}
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// TEAM NOTIFY MODAL
// Hiển thị sau khi Leader tiếp nhận nhiệm vụ — cho phép ghi chú và xác nhận
// đã thông báo cho thành viên (không fake animation)
// ─────────────────────────────────────────────────────────────────────────────
function TeamNotifyModal({
    open,
    onClose,
    members,
    onConfirmed,
}: {
    open: boolean
    onClose: () => void
    members: RescueTeamMemberDTO[]
    onConfirmed: (note: string) => void
}) {
    const [note, setNote] = useState(
        '🚨 Đội đã nhận nhiệm vụ mới. Toàn bộ thành viên tập hợp ngay, kiểm tra trang thiết bị và sẵn sàng xuất phát.'
    )

    const handleConfirm = useCallback(() => {
        onConfirmed(note)
        setNote('🚨 Đội đã nhận nhiệm vụ mới. Toàn bộ thành viên tập hợp ngay, kiểm tra trang thiết bị và sẵn sàng xuất phát.')
    }, [onConfirmed, note])

    const handleClose = useCallback(() => {
        setNote('🚨 Đội đã nhận nhiệm vụ mới. Toàn bộ thành viên tập hợp ngay, kiểm tra trang thiết bị và sẵn sàng xuất phát.')
        onClose()
    }, [onClose])

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-lg bg-white border-slate-300 text-slate-900">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-slate-900">
                        <Megaphone className="w-5 h-5 text-emerald-500" />
                        Thông báo cho đội
                    </DialogTitle>
                    <DialogDescription className="text-slate-500">
                        Nhiệm vụ đã được tiếp nhận. Xác nhận đội ({members.length} thành viên) đã được thông báo.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Success indicator */}
                    <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                        <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-emerald-700">Nhiệm vụ đã được tiếp nhận!</p>
                            <p className="text-xs text-emerald-600">Trạng thái chuyển sang «Đang di chuyển»</p>
                        </div>
                    </div>

                    {/* Member list */}
                    <div className="space-y-2">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                            Thành viên đội ({members.length} người)
                        </p>
                        <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto">
                            {members.length > 0 ? members.map(m => (
                                <div
                                    key={m.id}
                                    className="flex items-center gap-1.5 bg-slate-100 rounded-full px-3 py-1.5 border border-slate-200"
                                >
                                    <div className="w-5 h-5 rounded-full bg-red-700 flex items-center justify-center text-[9px] font-black text-white">
                                        {getInitials(m.fullName)}
                                    </div>
                                    <span className="text-xs font-semibold text-slate-700">
                                        {m.fullName}
                                    </span>
                                </div>
                            )) : (
                                <p className="text-xs text-slate-400 italic">Không có thành viên nào trong đội</p>
                            )}
                        </div>
                    </div>

                    <Separator className="bg-slate-200" />

                    {/* Note for members */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                            Ghi chú điều phối (tuỳ chọn)
                        </label>
                        <Textarea
                            className="bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 min-h-20 resize-none focus:border-emerald-500/50 text-sm"
                            value={note}
                            onChange={e => setNote(e.target.value)}
                            placeholder="Ghi chú cho đội..."
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="ghost"
                        onClick={handleClose}
                        className="text-slate-500 hover:text-slate-900"
                    >
                        Bỏ qua
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                    >
                        <Send className="w-4 h-4 mr-2" />
                        Xác nhận đã thông báo
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// CONFIRM DIALOG (Reject / Abort)
// ─────────────────────────────────────────────────────────────────────────────
function ConfirmActionDialog({
    open,
    onClose,
    onConfirm,
    title,
    description,
    confirmLabel,
    isPending,
    noteLabel,
}: {
    open: boolean
    onClose: () => void
    onConfirm: (note: string) => void
    title: string
    description: string
    confirmLabel: string
    isPending: boolean
    noteLabel?: string
}) {
    const [note, setNote] = useState('')

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md bg-white border-slate-300 text-slate-900">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-slate-900">
                        <AlertTriangle className="w-5 h-5 text-rose-400" />
                        {title}
                    </DialogTitle>
                    <DialogDescription className="text-slate-500">
                        {description}
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                        {noteLabel ?? 'Lý do (tuỳ chọn)'}
                    </label>
                    <Textarea
                        className="bg-slate-100 border-slate-300 text-slate-900 placeholder:text-slate-500 resize-none"
                        placeholder="Nhập lý do..."
                        value={note}
                        onChange={e => setNote(e.target.value)}
                    />
                </div>
                <DialogFooter>
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        className="text-slate-500 hover:text-slate-900"
                        disabled={isPending}
                    >
                        Huỷ
                    </Button>
                    <Button
                        onClick={() => onConfirm(note)}
                        disabled={isPending}
                        className="bg-rose-600 hover:bg-rose-700 font-bold"
                    >
                        {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        {confirmLabel}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────
export default function RescuerLeaderDashboard() {
    const router = useRouter()
    const logout = useLogout()
    const [activeTab, setActiveTab] = useState<TabId>('overview')

    // Checklist inputs local states
    const [newChecklistTitle, setNewChecklistTitle] = useState('')
    const [newItemTexts, setNewItemTexts] = useState<Record<string, string>>({})

    // ── Profile & Team ────────────────────────────────────────────────────────
    const { data: profile, isLoading: isLoadingProfile } = useProfileQuery()
    const teamId = profile?.rescueTeamId ?? ''

    const { data: teamDetails, isLoading: isLoadingTeam } =
        useRescueTeamDetail(teamId)
    const { data: missions, isLoading: isLoadingMissions } =
        useTeamMissions(teamId)
    const { data: teamMembers, isLoading: isLoadingMembers } =
        useRescueTeamMembers(teamId || null)
    const { data: leaveRequests } = useTeamLeaveRequests(teamId || null)
    const { data: joinRequests } = useTeamJoinRequests(teamId || undefined)

    const pendingJoinRequestsCount = useMemo(
        () => (joinRequests ?? []).filter(r => r.status === 0).length,
        [joinRequests]
    )

    // ── Mutations ─────────────────────────────────────────────────────────────
    const acceptMission = useAcceptMissionMutation()
    const rejectMission = useRejectMissionMutation()
    const updateProgress = useUpdateMissionProgressMutation()
    const finishMission = useFinishMissionMutation()
    const addMissionHistory = useAddMissionHistoryMutation()
    const abortMission = useAbortMissionMutation()

    // ── Dialog States ─────────────────────────────────────────────────────────
    const [rejectTarget, setRejectTarget] = useState<string | null>(null)
    const [abortTarget, setAbortTarget] = useState<string | null>(null)
    const [showTeamNotify, setShowTeamNotify] = useState(false)

    // ── Derived data ──────────────────────────────────────────────────────────
    const pendingMissions = useMemo(
        () =>
            (missions ?? []).filter(
                (m: MissionSummary) => m.status === 'ASSIGNED'
            ),
        [missions]
    )

    const pendingLeaveRequestsCount = useMemo(
        () =>
            (leaveRequests ?? []).filter(req => req.status === 'PENDING').length,
        [leaveRequests]
    )

    const activeMissions = useMemo(
        () =>
            (missions ?? []).filter((m: MissionSummary) =>
                ['EN_ROUTE', 'ON_SITE', 'IN_PROGRESS'].includes(m.status)
            ),
        [missions]
    )

    const historyMissions = useMemo(
        () =>
            (missions ?? []).filter((m: MissionSummary) =>
                ['COMPLETED', 'ABORTED'].includes(m.status)
            ),
        [missions]
    )

    const currentMission =
        activeMissions.length > 0 ? activeMissions[0] : null

    // Load detailed active mission details containing checklists
    const { data: missionDetail, isLoading: isLoadingMissionDetail } = useMissionDetail(currentMission?.id || '')

    // Mutations for checklist
    const createChecklist = useCreateChecklist()
    const deleteChecklist = useDeleteChecklist(currentMission?.id || '')
    const createChecklistItem = useCreateChecklistItem(currentMission?.id || '')
    const updateChecklistItem = useUpdateChecklistItem(currentMission?.id || '')
    const deleteChecklistItem = useDeleteChecklistItem(currentMission?.id || '')

    const handleCreateChecklist = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newChecklistTitle.trim() || !currentMission) return
        try {
            await createChecklist.mutateAsync({
                title: newChecklistTitle.trim(),
                missionId: currentMission.id
            })
            setNewChecklistTitle('')
            toast.success('Đã tạo checklist mới.')
        } catch {
            toast.error('Không thể tạo checklist.')
        }
    }

    const handleCreateItem = async (checklistId: string) => {
        const text = newItemTexts[checklistId] || ''
        if (!text.trim()) return
        try {
            await createChecklistItem.mutateAsync({
                checklistId,
                payload: { description: text.trim() }
            })
            setNewItemTexts(prev => ({ ...prev, [checklistId]: '' }))
            toast.success('Đã thêm mục công việc.')
        } catch {
            toast.error('Không thể thêm mục công việc.')
        }
    }

    const handleToggleItemCheck = async (itemId: string, description: string, currentChecked: boolean) => {
        try {
            await updateChecklistItem.mutateAsync({
                itemId,
                payload: {
                    description,
                    isCheck: !currentChecked
                }
            })
            toast.success('Đã cập nhật trạng thái mục công việc.')
        } catch {
            toast.error('Không thể cập nhật trạng thái.')
        }
    }

    const handleDeleteItem = async (itemId: string) => {
        try {
            await deleteChecklistItem.mutateAsync(itemId)
            toast.success('Đã xóa mục công việc.')
        } catch {
            toast.error('Không thể xóa mục công việc.')
        }
    }

    const handleDeleteChecklist = async (checklistId: string) => {
        if (!confirm('Bạn có chắc chắn muốn xóa checklist này?')) return
        try {
            await deleteChecklist.mutateAsync(checklistId)
            toast.success('Đã xóa checklist.')
        } catch {
            toast.error('Không thể xóa checklist.')
        }
    }

    const leaderNotifications: NotificationItem[] = useMemo(() => {
        const items: NotificationItem[] = []
        if (pendingMissions && pendingMissions.length > 0) {
            items.push(...pendingMissions.map(m => ({
                id: `mission_${m.id}`,
                title: <p className="text-sm font-bold text-amber-600">Nhiệm vụ mới: {m.id.slice(-6).toUpperCase()}</p>,
                description: <p className="text-xs text-slate-500">Chờ Đội trưởng tiếp nhận hoặc từ chối.</p>,
                timestamp: m.startTime || new Date().toISOString(),
                onClick: () => setActiveTab('pending_missions')
            })))
        }
        if (leaveRequests && leaveRequests.length > 0) {
            const pendingReqs = leaveRequests.filter((r: any) => r.status === 'PENDING')
            items.push(...pendingReqs.map((r: any) => ({
                id: `leave_${r.id}`,
                title: <p className="text-sm font-bold text-blue-600">Yêu cầu nghỉ phép từ {r.userFullName || 'Thành viên'}</p>,
                description: <p className="text-xs text-slate-500">Chờ Đội trưởng phê duyệt.</p>,
                timestamp: r.createdAt || new Date().toISOString(),
                onClick: () => setActiveTab('leave_approvals')
            })))
        }
        return items
    }, [pendingMissions, leaveRequests])

    // ── Handlers ──────────────────────────────────────────────────────────────
    const handleAccept = useCallback(
        async (missionId: string) => {
            try {
                await acceptMission.mutateAsync({ missionId, teamId })
                toast.success('Nhiệm vụ đã được tiếp nhận!', {
                    description: 'Trạng thái đã chuyển sang «Đang di chuyển». Hãy thông báo cho đội của bạn.',
                })
                // Show team notify modal and navigate to active mission tab
                setShowTeamNotify(true)
                setActiveTab('active_mission')
            } catch {
                toast.error('Không thể tiếp nhận nhiệm vụ', {
                    description: 'Vui lòng thử lại.',
                })
            }
        },
        [acceptMission, teamId]
    )

    const handleReject = useCallback(
        async (note: string) => {
            if (!rejectTarget) return
            try {
                await rejectMission.mutateAsync({
                    missionId: rejectTarget,
                    teamId,
                    note: note || 'Đội trưởng từ chối nhiệm vụ',
                })
                toast.success('Đã từ chối nhiệm vụ')
                setRejectTarget(null)
            } catch {
                toast.error('Không thể từ chối nhiệm vụ')
            }
        },
        [rejectMission, rejectTarget, teamId]
    )

    const handleUpdateProgress = useCallback(
        async (missionId: string, status: string) => {
            try {
                await updateProgress.mutateAsync({
                    missionId,
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    status: status as any,
                    teamId,
                    note: `Cập nhật trạng thái: ${MISSION_STATUS_LABELS[status]}`,
                })
                toast.success(`Đã cập nhật: ${MISSION_STATUS_LABELS[status]}`)
            } catch {
                toast.error('Không thể cập nhật trạng thái')
            }
        },
        [updateProgress, teamId]
    )

    const handleFinish = useCallback(
        async (missionId: string) => {
            try {
                await finishMission.mutateAsync({ missionId, teamId })
                toast.success('🎉 Nhiệm vụ hoàn thành xuất sắc!')
                setActiveTab('overview')
            } catch {
                toast.error('Không thể hoàn thành nhiệm vụ')
            }
        },
        [finishMission, teamId]
    )

    const handleAbort = useCallback(
        async (note: string) => {
            if (!abortTarget) return
            try {
                await abortMission.mutateAsync({
                    missionId: abortTarget,
                    teamId,
                    note: note || 'Đội trưởng hủy nhiệm vụ',
                })
                toast.success('Nhiệm vụ đã được hủy bỏ')
                setAbortTarget(null)
                setActiveTab('overview')
            } catch {
                toast.error('Không thể hủy nhiệm vụ')
            }
        },
        [abortMission, abortTarget, teamId]
    )

    // ── Loading ───────────────────────────────────────────────────────────────
    const isGlobalLoading =
        isLoadingProfile ||
        (teamId && (isLoadingTeam || isLoadingMissions || isLoadingMembers))

    if (isGlobalLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                        <div className="w-16 h-16 rounded-full border-2 border-red-500/30 animate-ping absolute inset-0" />
                        <div className="w-16 h-16 rounded-full bg-red-900/30 flex items-center justify-center relative">
                            <Siren className="w-8 h-8 text-red-400 animate-pulse" />
                        </div>
                    </div>
                    <p className="text-slate-500 font-semibold tracking-widest text-sm uppercase">
                        Đang tải hệ thống...
                    </p>
                </div>
            </div>
        )
    }

    // ── NAV Items ─────────────────────────────────────────────────────────────
    const navItems: {
        id: TabId
        label: string
        icon: React.ElementType
        badge?: number
    }[] = [
            { id: 'overview', label: 'Tổng quan', icon: BarChart3 },
            {
                id: 'pending_missions',
                label: 'Chờ tiếp nhận',
                icon: Bell,
                badge: pendingMissions.length,
            },
            {
                id: 'active_mission',
                label: 'Nhiệm vụ hiện tại',
                icon: Siren,
                badge: currentMission ? 1 : undefined,
            },
            { id: 'team_members', label: 'Thành viên đội', icon: Users },
            { id: 'join_requests', label: 'Duyệt gia nhập', icon: UserCheck, badge: pendingJoinRequestsCount },
            { id: 'leave_approvals', label: 'Duyệt phép', icon: CalendarCheck, badge: pendingLeaveRequestsCount },
            { id: 'mission_history', label: 'Lịch sử nhiệm vụ', icon: History },
        ]

    // ─────────────────────────────────────────────────────────────────────────
    // RENDER
    // ─────────────────────────────────────────────────────────────────────────
    return (
        <SidebarProvider>
            <div className="flex h-screen w-full bg-slate-50 font-sans overflow-hidden text-slate-900">
                {/* ─── SIDEBAR ─────────────────────────────────────────── */}
                <Sidebar className="border-r border-slate-200/60 bg-slate-50 z-50 shadow-2xl">
                    <SidebarHeader className="p-6 pb-4 border-b border-slate-200/40">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-red-600 to-rose-700 flex items-center justify-center text-slate-900 shadow-lg shadow-red-600/30">
                                    <ShieldAlert size={20} />
                                </div>
                                <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-200" />
                            </div>
                            <div>
                                <h1 className="text-base font-black text-slate-900 tracking-tight leading-tight">
                                    Chỉ huy Đội
                                </h1>
                                <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest">
                                    Rescuer Leader
                                </p>
                            </div>
                        </div>

                        {/* Team info */}
                        {teamDetails && (
                            <div className="mt-4 p-3 rounded-xl bg-slate-100/50 border border-slate-300/40">
                                <p className="text-xs font-black text-slate-900 truncate">
                                    {teamDetails.teamName}
                                </p>
                                <div className="flex items-center gap-1.5 mt-1">
                                    <span
                                        className={cn(
                                            'w-1.5 h-1.5 rounded-full',
                                            teamDetails.status === 'ON_MISSION'
                                                ? 'bg-orange-400 animate-pulse'
                                                : teamDetails.status === 'AVAILABLE'
                                                    ? 'bg-emerald-400'
                                                    : 'bg-slate-500'
                                        )}
                                    />
                                    <p className="text-[10px] text-slate-500 font-semibold uppercase">
                                        {dictTeamStatus[teamDetails.status] || teamDetails.status}
                                    </p>
                                </div>
                            </div>
                        )}
                    </SidebarHeader>

                    <SidebarContent className="px-3 mt-4">
                        <SidebarMenu className="space-y-1">
                            {navItems.map(item => (
                                <SidebarMenuItem key={item.id}>
                                    <SidebarMenuButton
                                        isActive={activeTab === item.id}
                                        onClick={() => setActiveTab(item.id)}
                                        className={cn(
                                            'py-5 px-4 rounded-xl font-semibold transition-all duration-200',
                                            activeTab === item.id
                                                ? 'bg-red-700/30 text-slate-900 border border-red-600/30 shadow-md shadow-red-900/20'
                                                : 'text-slate-500 hover:bg-slate-100/60 hover:text-slate-700'
                                        )}
                                    >
                                        <item.icon size={17} className="mr-3 shrink-0" />
                                        <span className="flex-1">{item.label}</span>
                                        {item.badge !== undefined && item.badge > 0 && (
                                            <span
                                                className={cn(
                                                    'ml-auto flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-black',
                                                    item.id === 'pending_missions'
                                                        ? 'bg-amber-500 text-black animate-bounce'
                                                        : 'bg-red-600 text-slate-900 animate-pulse'
                                                )}
                                            >
                                                {item.badge}
                                            </span>
                                        )}
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>

                        {/* Current mission quick indicator */}
                        {currentMission && (
                            <div className="mt-6 px-1">
                                <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mb-2">
                                    Nhiệm vụ hiện tại
                                </p>
                                <div className="text-[10px] text-slate-500 flex items-start gap-2 py-1 p-2 bg-orange-500/10 rounded-lg border border-orange-500/20">
                                    <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse shrink-0 mt-0.5" />
                                    <span className="font-semibold text-orange-600">
                                        #{currentMission.id.slice(-6).toUpperCase()}
                                        {' — '}{MISSION_STATUS_LABELS[currentMission.status]}
                                    </span>
                                </div>
                            </div>
                        )}
                    </SidebarContent>

                    <SidebarFooter className="p-4 border-t border-slate-200/40">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <div className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-100/60 cursor-pointer transition-colors">
                                    <Avatar className="w-9 h-9 border-2 border-red-600/40">
                                        <AvatarImage
                                            src={
                                                profile?.avatarUrl ||
                                                profile?.avatar ||
                                                `https://ui-avatars.com/api/?name=${profile?.fullName || 'RL'}&background=dc2626&color=fff`
                                            }
                                        />
                                        <AvatarFallback className="bg-red-900 text-red-200 font-black text-sm">
                                            {getInitials(profile?.fullName || 'RL')}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 overflow-hidden">
                                        <p className="text-sm font-bold text-slate-900 truncate">
                                            {profile?.fullName || 'Đội trưởng'}
                                        </p>
                                        <p className="text-[10px] text-red-400 font-semibold truncate">
                                            Rescuer Leader
                                        </p>
                                    </div>
                                </div>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                align="end"
                                className="w-52 bg-white border-slate-300 text-slate-900"
                                sideOffset={8}
                            >
                                <DropdownMenuLabel className="text-slate-500">
                                    Tài khoản
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator className="bg-slate-200" />
                                <DropdownMenuItem
                                    onClick={() => router.push('/profile')}
                                    className="cursor-pointer hover:bg-slate-100 focus:bg-slate-100"
                                >
                                    <User className="mr-2 h-4 w-4" />
                                    Hồ sơ cá nhân
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-slate-200" />
                                <DropdownMenuItem
                                    onClick={() => logout()}
                                    className="text-rose-400 focus:text-rose-300 cursor-pointer hover:bg-slate-100 focus:bg-slate-100"
                                >
                                    <LogOut className="mr-2 h-4 w-4" />
                                    Đăng xuất
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </SidebarFooter>
                </Sidebar>

                {/* ─── MAIN CONTENT ─────────────────────────────────────── */}
                <main className="flex-1 flex flex-col relative w-full h-full overflow-hidden">
                    {/* Header */}
                    <header className="flex justify-between items-center px-6 lg:px-8 w-full sticky top-0 z-40 bg-white/80 backdrop-blur-xl h-[68px] border-b border-slate-200/60">
                        <div className="flex items-center gap-4">
                            <SidebarTrigger className="-ml-2 mr-2 md:hidden" />
                            {/* Status indicator */}
                            {currentMission && (
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-500/10 border border-orange-500/20 rounded-full">
                                    <span className="w-2 h-2 rounded-full bg-orange-400 animate-ping" />
                                    <span className="text-xs font-bold text-orange-400">
                                        Đang trong nhiệm vụ
                                    </span>
                                </div>
                            )}
                            <h2 className="text-lg font-extrabold text-slate-900 tracking-tight hidden lg:block">
                                {activeTab === 'overview' && 'Bảng chỉ huy'}
                                {activeTab === 'pending_missions' &&
                                    'Nhiệm vụ chờ tiếp nhận'}
                                {activeTab === 'active_mission' &&
                                    'Nhiệm vụ đang thực hiện'}
                                {activeTab === 'team_members' && 'Quản lý đội'}
                                {activeTab === 'join_requests' && 'Yêu cầu gia nhập'}
                                {activeTab === 'leave_approvals' && 'Duyệt phép thành viên'}
                                {activeTab === 'mission_history' && 'Lịch sử nhiệm vụ'}
                            </h2>
                        </div>

                        <div className="flex items-center gap-2">
                            <NotificationBell items={leaderNotifications} />
                        </div>
                    </header>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6 lg:p-8 scroll-smooth">
                        <div className="max-w-6xl mx-auto space-y-6 pb-20">

                            {/* ══════════════════ TAB: OVERVIEW ══════════════════ */}
                            {activeTab === 'overview' && (
                                <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                        <StatCard
                                            label="Nhiệm vụ chờ duyệt"
                                            value={pendingMissions.length}
                                            icon={Bell}
                                            color="amber"
                                            trend={
                                                pendingMissions.length > 0
                                                    ? 'Cần xử lý ngay'
                                                    : 'Không có nhiệm vụ mới'
                                            }
                                        />
                                        <StatCard
                                            label="Đang thực hiện"
                                            value={activeMissions.length}
                                            icon={Zap}
                                            color="orange"
                                            trend={
                                                currentMission
                                                    ? `Trạng thái: ${MISSION_STATUS_LABELS[currentMission.status]}`
                                                    : 'Chưa có nhiệm vụ'
                                            }
                                        />
                                        <StatCard
                                            label="Đã hoàn thành"
                                            value={
                                                historyMissions.filter(
                                                    (m: MissionSummary) =>
                                                        m.status === 'COMPLETED'
                                                ).length
                                            }
                                            icon={CheckCircle2}
                                            color="emerald"
                                            trend="Toàn thời gian"
                                        />
                                        <StatCard
                                            label="Thành viên đội"
                                            value={teamMembers?.length ?? 0}
                                            icon={Users}
                                            color="blue"
                                            trend={`Đội: ${teamDetails?.teamName ?? '—'}`}
                                        />
                                    </div>

                                    {/* Quick actions */}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                        {/* Pending missions quick view */}
                                        <div className="bg-white/60 border border-slate-200/60 rounded-2xl p-5">
                                            <div className="flex items-center justify-between mb-4">
                                                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                                    <Bell className="w-4 h-4 text-amber-400" />
                                                    Nhiệm vụ đang chờ
                                                </h3>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() =>
                                                        setActiveTab('pending_missions')
                                                    }
                                                    className="text-slate-500 hover:text-slate-900 text-xs"
                                                >
                                                    Xem tất cả
                                                    <ChevronRight className="w-3 h-3 ml-1" />
                                                </Button>
                                            </div>
                                            {pendingMissions.length === 0 ? (
                                                <div className="flex flex-col items-center py-8 text-slate-600">
                                                    <CheckCircle2 className="w-8 h-8 mb-2" />
                                                    <p className="text-sm font-medium">
                                                        Không có nhiệm vụ chờ duyệt
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="space-y-2">
                                                    {pendingMissions
                                                        .slice(0, 3)
                                                        .map((m: MissionSummary) => (
                                                            <div
                                                                key={m.id}
                                                                className="flex items-center justify-between p-3 bg-slate-100/50 rounded-xl border border-amber-500/10 hover:border-amber-500/30 transition-colors cursor-pointer"
                                                                onClick={() =>
                                                                    setActiveTab(
                                                                        'pending_missions'
                                                                    )
                                                                }
                                                            >
                                                                <div>
                                                                    <p className="text-sm font-bold text-slate-900">
                                                                        #
                                                                        {m.id.slice(-6).toUpperCase()}
                                                                    </p>
                                                                    <p className="text-xs text-slate-500">
                                                                        {m.startTime
                                                                            ? formatDistanceToNow(
                                                                                new Date(m.startTime),
                                                                                {
                                                                                    locale: vi,
                                                                                    addSuffix: true,
                                                                                }
                                                                            )
                                                                            : '—'}
                                                                    </p>
                                                                </div>
                                                                <MissionStatusBadge
                                                                    status={m.status}
                                                                />
                                                            </div>
                                                        ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Active mission quick view */}
                                        <div className="bg-white/60 border border-slate-200/60 rounded-2xl p-5">
                                            <div className="flex items-center justify-between mb-4">
                                                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                                    <Siren className="w-4 h-4 text-orange-400" />
                                                    Nhiệm vụ hiện tại
                                                </h3>
                                                {currentMission && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() =>
                                                            setActiveTab('active_mission')
                                                        }
                                                        className="text-slate-500 hover:text-slate-900 text-xs"
                                                    >
                                                        Chi tiết
                                                        <ChevronRight className="w-3 h-3 ml-1" />
                                                    </Button>
                                                )}
                                            </div>
                                            {!currentMission ? (
                                                <div className="flex flex-col items-center py-8 text-slate-600">
                                                    <Activity className="w-8 h-8 mb-2" />
                                                    <p className="text-sm font-medium">
                                                        Đội đang ở trạng thái Standby
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-black text-slate-900">
                                                            #{currentMission.id.slice(-8).toUpperCase()}
                                                        </span>
                                                        <MissionStatusBadge
                                                            status={currentMission.status}
                                                        />
                                                    </div>
                                                    {/* Progress bar */}
                                                    <div>
                                                        <div className="flex justify-between text-xs text-slate-500 mb-1.5 font-medium">
                                                            <span>Tiến trình</span>
                                                            <span>
                                                                {
                                                                    ({
                                                                        EN_ROUTE: '25%',
                                                                        ON_SITE: '50%',
                                                                        IN_PROGRESS: '75%',
                                                                    } as Record<string, string>)[currentMission.status] ??
                                                                    '0%'
                                                                }
                                                            </span>
                                                        </div>
                                                        <Progress
                                                            value={
                                                                ({
                                                                    EN_ROUTE: 25,
                                                                    ON_SITE: 50,
                                                                    IN_PROGRESS: 75,
                                                                } as Record<string, number>)[currentMission.status] ?? 0
                                                            }
                                                            className="h-1.5 bg-slate-200 [&>[data-slot=progress-indicator]]:bg-orange-500"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </section>
                            )}

                            {/* ══════════════════ TAB: JOIN REQUESTS ══════════════════ */}
                            {activeTab === 'join_requests' && (
                                <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
                                    <JoinRequestsView teamId={teamId} />
                                </section>
                            )}

                            {/* ══════════════════ TAB: LEAVE APPROVALS ══════════════════ */}
                            {activeTab === 'leave_approvals' && (
                                <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
                                    <LeaveApprovalsView teamId={teamId} />
                                </section>
                            )}


                            {/* ══════════════════ TAB: PENDING MISSIONS ══════════════════ */}
                            {activeTab === 'pending_missions' && (
                                <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-4">
                                    {pendingMissions.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-24 text-center">
                                            <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                                                <CheckCircle2 className="w-10 h-10 text-slate-600" />
                                            </div>
                                            <h3 className="text-xl font-bold text-slate-500">
                                                Không có nhiệm vụ nào đang chờ
                                            </h3>
                                            <p className="text-slate-600 mt-2 text-sm">
                                                Khi Dispatcher giao nhiệm vụ mới, chúng sẽ xuất
                                                hiện tại đây để bạn tiếp nhận hoặc từ chối.
                                            </p>
                                        </div>
                                    ) : (
                                        pendingMissions.map((mission: MissionSummary) => (
                                            <div
                                                key={mission.id}
                                                className="bg-white/70 border border-amber-500/20 rounded-2xl p-6 hover:border-amber-500/40 transition-all shadow-lg shadow-amber-900/5"
                                            >
                                                <div className="flex items-start justify-between gap-4 mb-5">
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                                                            <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">
                                                                Nhiệm vụ mới — Chờ xác nhận
                                                            </span>
                                                        </div>
                                                        <h3 className="text-xl font-black text-slate-900">
                                                            Nhiệm vụ #{mission.id.slice(-8).toUpperCase()}
                                                        </h3>
                                                    </div>
                                                    <MissionStatusBadge status={mission.status} />
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
                                                    <div className="bg-slate-100/50 rounded-xl p-3 border border-slate-300/40">
                                                        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">
                                                            Mã yêu cầu
                                                        </p>
                                                        <p className="text-sm font-bold text-slate-900 font-mono">
                                                            {mission.requestId.slice(-10).toUpperCase()}
                                                        </p>
                                                    </div>
                                                    <div className="bg-slate-100/50 rounded-xl p-3 border border-slate-300/40">
                                                        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">
                                                            Thời gian tạo
                                                        </p>
                                                        <p className="text-sm font-bold text-slate-900">
                                                            {mission.startTime
                                                                ? format(
                                                                    new Date(mission.startTime),
                                                                    'HH:mm dd/MM',
                                                                    { locale: vi }
                                                                )
                                                                : '—'}
                                                        </p>
                                                    </div>
                                                    <div className="bg-slate-100/50 rounded-xl p-3 border border-slate-300/40">
                                                        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">
                                                            Dispatcher
                                                        </p>
                                                        <p className="text-sm font-bold text-slate-900 truncate">
                                                            {mission.dispatcher?.fullName ??
                                                                mission.dispatcherId?.slice(-8) ??
                                                                '—'}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3">
                                                    <Button
                                                        onClick={() => handleAccept(mission.id)}
                                                        disabled={acceptMission.isPending}
                                                        className="flex-1 bg-emerald-600 hover:bg-emerald-500 font-bold h-11 shadow-lg shadow-emerald-900/20"
                                                    >
                                                        {acceptMission.isPending ? (
                                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                        ) : (
                                                            <CheckCircle2 className="w-4 h-4 mr-2" />
                                                        )}
                                                        Tiếp nhận nhiệm vụ
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        onClick={() =>
                                                            setRejectTarget(mission.id)
                                                        }
                                                        disabled={rejectMission.isPending}
                                                        className="flex-1 border-rose-500/40 text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/60 font-bold h-11 bg-transparent"
                                                    >
                                                        <XCircle className="w-4 h-4 mr-2" />
                                                        Từ chối
                                                    </Button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </section>
                            )}

                            {/* ══════════════════ TAB: ACTIVE MISSION ══════════════════ */}
                            {activeTab === 'active_mission' && (
                                <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    {!currentMission ? (
                                        <div className="flex flex-col items-center justify-center py-24 text-center">
                                            <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                                                <Siren className="w-10 h-10 text-slate-600" />
                                            </div>
                                            <h3 className="text-xl font-bold text-slate-500">
                                                Chưa có nhiệm vụ đang thực hiện
                                            </h3>
                                            <p className="text-slate-600 mt-2 text-sm max-w-sm">
                                                Hãy tiếp nhận một nhiệm vụ từ tab "Chờ tiếp
                                                nhận" để bắt đầu.
                                            </p>
                                            {pendingMissions.length > 0 && (
                                                <Button
                                                    className="mt-6 bg-amber-600 hover:bg-amber-500 font-bold"
                                                    onClick={() =>
                                                        setActiveTab('pending_missions')
                                                    }
                                                >
                                                    <Bell className="w-4 h-4 mr-2" />
                                                    Xem {pendingMissions.length} nhiệm vụ chờ
                                                </Button>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                                            {/* Main mission card */}
                                            <div className="lg:col-span-2 space-y-4">
                                                {/* Mission header */}
                                                <div className="bg-gradient-to-br from-slate-100 to-slate-50 border border-slate-300/60 rounded-2xl p-6 shadow-xl">
                                                    <div className="flex items-start justify-between mb-4">
                                                        <div>
                                                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
                                                                Nhiệm vụ đang thực hiện
                                                            </p>
                                                            <h3 className="text-2xl font-black text-slate-900">
                                                                #{currentMission.id.slice(-8).toUpperCase()}
                                                            </h3>
                                                        </div>
                                                        <MissionStatusBadge
                                                            status={currentMission.status}
                                                        />
                                                    </div>

                                                    {/* Progress timeline */}
                                                    <div className="relative">
                                                        <div className="flex justify-between mb-2">
                                                            {[
                                                                {
                                                                    s: 'EN_ROUTE',
                                                                    l: 'Di chuyển',
                                                                    icon: Navigation,
                                                                },
                                                                {
                                                                    s: 'ON_SITE',
                                                                    l: 'Hiện trường',
                                                                    icon: MapPin,
                                                                },
                                                                {
                                                                    s: 'IN_PROGRESS',
                                                                    l: 'Cứu hộ',
                                                                    icon: Hammer,
                                                                },
                                                                {
                                                                    s: 'COMPLETED',
                                                                    l: 'Hoàn thành',
                                                                    icon: Flag,
                                                                },
                                                            ].map((step, i) => {
                                                                const order = [
                                                                    'EN_ROUTE',
                                                                    'ON_SITE',
                                                                    'IN_PROGRESS',
                                                                    'COMPLETED',
                                                                ]
                                                                const currentIdx = order.indexOf(
                                                                    currentMission.status
                                                                )
                                                                const stepIdx = order.indexOf(step.s)
                                                                const isDone = stepIdx < currentIdx
                                                                const isCurrent =
                                                                    stepIdx === currentIdx
                                                                return (
                                                                    <div
                                                                        key={step.s}
                                                                        className="flex flex-col items-center gap-1.5 flex-1"
                                                                    >
                                                                        <div
                                                                            className={cn(
                                                                                'w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all',
                                                                                isDone
                                                                                    ? 'bg-emerald-500 border-emerald-500 text-slate-900'
                                                                                    : isCurrent
                                                                                        ? 'bg-orange-500/20 border-orange-500 text-orange-400 animate-pulse'
                                                                                        : 'bg-slate-100 border-slate-300 text-slate-600'
                                                                            )}
                                                                        >
                                                                            <step.icon
                                                                                className={cn(
                                                                                    'w-3.5 h-3.5',
                                                                                    isCurrent &&
                                                                                    'animate-pulse'
                                                                                )}
                                                                            />
                                                                        </div>
                                                                        <span
                                                                            className={cn(
                                                                                'text-[10px] font-bold',
                                                                                isDone
                                                                                    ? 'text-emerald-400'
                                                                                    : isCurrent
                                                                                        ? 'text-orange-400'
                                                                                        : 'text-slate-600'
                                                                            )}
                                                                        >
                                                                            {step.l}
                                                                        </span>
                                                                    </div>
                                                                )
                                                            })}
                                                        </div>
                                                        <div className="absolute top-4 left-[12.5%] right-[12.5%] h-px bg-slate-200">
                                                            <div
                                                                className="h-full bg-gradient-to-r from-emerald-500 to-orange-500 transition-all duration-500"
                                                                style={{
                                                                    width: `${MISSION_TIMELINE_WIDTH[currentMission.status] ?? '0%'}`,
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Mission info */}
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="bg-white/60 border border-slate-200 rounded-xl p-4">
                                                        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">
                                                            Mã yêu cầu
                                                        </p>
                                                        <p className="text-sm font-bold text-slate-900 font-mono break-all">
                                                            {currentMission.requestId.slice(-12).toUpperCase()}
                                                        </p>
                                                    </div>
                                                    <div className="bg-white/60 border border-slate-200 rounded-xl p-4">
                                                        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">
                                                            Bắt đầu lúc
                                                        </p>
                                                        <p className="text-sm font-bold text-slate-900">
                                                            {currentMission.startTime
                                                                ? format(
                                                                    new Date(
                                                                        currentMission.startTime
                                                                    ),
                                                                    'HH:mm dd/MM/yyyy',
                                                                    { locale: vi }
                                                                )
                                                                : '—'}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Action buttons */}
                                                <div className="bg-white/60 border border-slate-200 rounded-xl p-4 space-y-3">
                                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                                                        Cập nhật tiến trình
                                                    </p>
                                                    <div className="flex flex-col gap-2">
                                                        {NEXT_STATUS_MAP[
                                                            currentMission.status
                                                        ] && (
                                                                <Button
                                                                    onClick={() =>
                                                                        handleUpdateProgress(
                                                                            currentMission.id,
                                                                            NEXT_STATUS_MAP[
                                                                            currentMission.status
                                                                            ]!
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        updateProgress.isPending
                                                                    }
                                                                    className="w-full bg-blue-600 hover:bg-blue-500 font-bold h-11"
                                                                >
                                                                    {updateProgress.isPending ? (
                                                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                                    ) : (
                                                                        <ChevronRight className="w-4 h-4 mr-2" />
                                                                    )}
                                                                    {
                                                                        NEXT_STATUS_LABEL[
                                                                        NEXT_STATUS_MAP[
                                                                        currentMission.status
                                                                        ]!
                                                                        ]
                                                                    }
                                                                </Button>
                                                            )}

                                                        {currentMission.status ===
                                                            'IN_PROGRESS' && (
                                                                <Button
                                                                    onClick={() =>
                                                                        handleFinish(currentMission.id)
                                                                    }
                                                                    disabled={finishMission.isPending}
                                                                    className="w-full bg-emerald-600 hover:bg-emerald-500 font-bold h-11"
                                                                >
                                                                    {finishMission.isPending ? (
                                                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                                    ) : (
                                                                        <Flag className="w-4 h-4 mr-2" />
                                                                    )}
                                                                    Hoàn thành nhiệm vụ
                                                                </Button>
                                                            )}

                                                        <Button
                                                            variant="outline"
                                                            onClick={() =>
                                                                setShowTeamNotify(true)
                                                            }
                                                            className="w-full border-amber-500/30 text-amber-400 hover:bg-amber-500/10 font-bold h-10 bg-transparent"
                                                        >
                                                            <Megaphone className="w-4 h-4 mr-2" />
                                                            Gửi thông báo cho đội
                                                        </Button>

                                                        <Button
                                                            variant="outline"
                                                            onClick={() =>
                                                                setAbortTarget(currentMission.id)
                                                            }
                                                            disabled={rejectMission.isPending}
                                                            className="w-full border-rose-500/30 text-rose-400 hover:bg-rose-500/10 font-bold h-10 bg-transparent"
                                                        >
                                                            <XCircle className="w-4 h-4 mr-2" />
                                                            Hủy bỏ nhiệm vụ
                                                        </Button>
                                                    </div>
</div>

                                                 {/* Checklist Management Card */}
                                                 <Card className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                                                     <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                                         <div>
                                                             <h3 className="font-extrabold text-slate-900 flex items-center gap-2 text-base">
                                                                 <ListTodo className="w-5 h-5 text-red-500" />
                                                                 Checklist công việc chi tiết
                                                             </h3>
                                                             <p className="text-[11px] text-slate-500 mt-1">Lập danh sách công việc cứu hộ chi tiết cho đội</p>
                                                         </div>
                                                     </div>

                                                     {/* Create checklist form */}
                                                     <form onSubmit={handleCreateChecklist} className="flex gap-2">
                                                         <input
                                                             type="text"
                                                             value={newChecklistTitle}
                                                             onChange={e => setNewChecklistTitle(e.target.value)}
                                                             placeholder="Nhập tên checklist mới (VD: Sơ tán tầng 3)..."
                                                             className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:border-red-500 focus:outline-none"
                                                             disabled={createChecklist.isPending}
                                                         />
                                                         <Button
                                                             type="submit"
                                                             className="bg-red-700 hover:bg-red-800 text-white font-bold h-9 text-xs rounded-xl"
                                                             disabled={createChecklist.isPending}
                                                         >
                                                             {createChecklist.isPending ? (
                                                                 <Loader2 className="w-4 h-4 animate-spin" />
                                                             ) : (
                                                                 <Plus className="w-4 h-4 mr-1" />
                                                             )}
                                                             Tạo
                                                         </Button>
                                                     </form>

                                                     {/* List of checklists */}
                                                     {isLoadingMissionDetail ? (
                                                         <div className="flex items-center justify-center py-6 text-slate-400 text-sm">
                                                             <Loader2 className="w-5 h-5 animate-spin mr-2" /> Đang tải checklist...
                                                         </div>
                                                     ) : !missionDetail?.checklists || missionDetail.checklists.length === 0 ? (
                                                         <div className="text-center py-8 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 text-slate-500 text-xs">
                                                             Nhiệm vụ này chưa có checklist chi tiết. Hãy tạo checklist ở trên.
                                                         </div>
                                                     ) : (
                                                         <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
                                                             {missionDetail.checklists.map((checklist) => {
                                                                 const items = checklist.items || []
                                                                 const doneItems = items.filter((i) => i.isCheck).length
                                                                 const pct = items.length > 0 ? Math.round((doneItems / items.length) * 100) : 0

                                                                 return (
                                                                     <div key={checklist.id} className="border border-slate-200/80 rounded-xl p-4 bg-white/40 space-y-3">
                                                                         <div className="flex items-center justify-between">
                                                                             <div>
                                                                                 <h4 className="font-extrabold text-slate-800 text-sm">{checklist.title}</h4>
                                                                                 <span className="text-[10px] font-bold text-slate-500">Tiến độ: {doneItems}/{items.length} ({pct}%)</span>
                                                                             </div>
                                                                             <Button
                                                                                 variant="ghost"
                                                                                 size="sm"
                                                                                 onClick={() => handleDeleteChecklist(checklist.id)}
                                                                                 className="text-slate-400 hover:text-rose-500 h-8 w-8 p-0"
                                                                                 disabled={deleteChecklist.isPending}
                                                                             >
                                                                                 <Trash2 className="w-4 h-4" />
                                                                             </Button>
                                                                         </div>

                                                                         {/* Progress bar */}
                                                                         <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                                                             <div className="bg-emerald-500 h-full transition-all duration-300" style={{ width: `${pct}%` }} />
                                                                         </div>

                                                                         {/* Items */}
                                                                         {items.length > 0 && (
                                                                             <div className="space-y-2 pt-1">
                                                                                 {items.map((item) => {
                                                                                     const itemPending = updateChecklistItem.isPending && updateChecklistItem.variables?.itemId === item.id
                                                                                     return (
                                                                                         <div key={item.id} className="flex items-center justify-between p-2 rounded-lg bg-white/70 border border-slate-100 hover:border-slate-200">
                                                                                             <div className="flex items-center gap-2 min-w-0 flex-1">
                                                                                                 <button
                                                                                                     type="button"
                                                                                                     onClick={() => handleToggleItemCheck(item.id, item.description, item.isCheck)}
                                                                                                     disabled={itemPending}
                                                                                                     className="text-slate-400 hover:text-slate-600 shrink-0"
                                                                                                 >
                                                                                                     {itemPending ? (
                                                                                                         <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
                                                                                                     ) : item.isCheck ? (
                                                                                                         <CheckSquare className="w-4.5 h-4.5 text-emerald-500 fill-emerald-50" />
                                                                                                     ) : (
                                                                                                         <Square className="w-4.5 h-4.5 text-slate-300" />
                                                                                                     )}
                                                                                                 </button>
                                                                                                 <span className={cn(
                                                                                                     "text-xs font-semibold truncate",
                                                                                                     item.isCheck ? "text-slate-400 line-through" : "text-slate-700"
                                                                                                 )}>
                                                                                                     {item.description}
                                                                                                 </span>
                                                                                             </div>
                                                                                             <Button
                                                                                                 variant="ghost"
                                                                                                 size="sm"
                                                                                                 onClick={() => handleDeleteItem(item.id)}
                                                                                                 className="text-slate-400 hover:text-rose-500 h-7 w-7 p-0 shrink-0"
                                                                                                 disabled={deleteChecklistItem.isPending}
                                                                                             >
                                                                                                 <Trash2 className="w-3.5 h-3.5" />
                                                                                             </Button>
                                                                                         </div>
                                                                                     )
                                                                                 })}
                                                                             </div>
                                                                         )}

                                                                         {/* Add item form */}
                                                                         <div className="flex gap-2 pt-1">
                                                                             <input
                                                                                 type="text"
                                                                                 value={newItemTexts[checklist.id] || ''}
                                                                                 onChange={e => setNewItemTexts(prev => ({ ...prev, [checklist.id]: e.target.value }))}
                                                                                 placeholder="Thêm công việc nhỏ..."
                                                                                 className="flex-1 bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs focus:border-red-500 focus:outline-none"
                                                                                 onKeyDown={e => {
                                                                                     if (e.key === 'Enter') {
                                                                                         e.preventDefault()
                                                                                         handleCreateItem(checklist.id)
                                                                                     }
                                                                                 }}
                                                                             />
                                                                             <Button
                                                                                 type="button"
                                                                                 onClick={() => handleCreateItem(checklist.id)}
                                                                                 className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-extrabold h-7 text-[10px] rounded-lg px-2"
                                                                                 disabled={createChecklistItem.isPending}
                                                                             >
                                                                                 Thêm
                                                                             </Button>
                                                                         </div>
                                                                     </div>
                                                                 )
                                                             })}
                                                         </div>
                                                     )}
                                                 </Card>

</div>

                                            {/* Team members sidebar */}
                                            <div className="space-y-4">
                                                {/* Incident Request Details Card */}
                                                <Card className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                                                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                                        <h3 className="font-extrabold text-slate-900 flex items-center gap-2 text-base">
                                                            <AlertTriangle className="w-5 h-5 text-amber-500" />
                                                            Thông tin yêu cầu cứu hộ
                                                        </h3>
                                                    </div>
                                                    <div className="space-y-4">
                                                        {missionDetail?.request ? (
                                                            <div className="space-y-4">
                                                                {/* Emergency type & priority */}
                                                                <div className="flex gap-2 flex-wrap">
                                                                    <Badge variant="outline" className="text-xs font-bold text-blue-600 border-blue-200 bg-blue-50/50">
                                                                        {dictType[missionDetail.request.emergencyType] || missionDetail.request.emergencyType}
                                                                    </Badge>
                                                                    <Badge variant="outline" className={cn("text-xs font-bold border-0", 
                                                                        missionDetail.request.priority === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                                                                        missionDetail.request.priority === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                                                                        missionDetail.request.priority === 'MEDIUM' ? 'bg-amber-100 text-amber-700' :
                                                                        'bg-blue-100 text-blue-700'
                                                                    )}>
                                                                        {dictPriority[missionDetail.request.priority] || missionDetail.request.priority}
                                                                    </Badge>
                                                                </div>

                                                                {/* Description */}
                                                                <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl">
                                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Nội dung chi tiết</span>
                                                                    <p className="text-xs text-slate-700 leading-relaxed italic whitespace-pre-wrap">
                                                                        "{missionDetail.request.description || 'Không có mô tả chi tiết từ người gửi.'}"
                                                                    </p>
                                                                </div>

                                                                {/* Sender/Contact Info */}
                                                                {missionDetail.request.requestedBy && (
                                                                    <div className="p-3 bg-red-50/10 border border-red-100/30 rounded-xl space-y-2">
                                                                        <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider block">Thông tin liên hệ người báo cáo</span>
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="w-8 h-8 rounded-full bg-red-100 text-red-650 flex items-center justify-center font-bold text-xs shrink-0">
                                                                                {missionDetail.request.requestedBy.fullName?.charAt(0).toUpperCase()}
                                                                            </div>
                                                                            <div className="min-w-0 flex-1">
                                                                                <p className="text-xs font-bold text-slate-800 truncate">{missionDetail.request.requestedBy.fullName}</p>
                                                                                <p className="text-[10px] text-slate-500 truncate">{missionDetail.request.requestedBy.email || 'Không có email'}</p>
                                                                            </div>
                                                                        </div>
                                                                        {missionDetail.request.requestedBy.phoneNumber && (
                                                                            <a 
                                                                                href={`tel:${missionDetail.request.requestedBy.phoneNumber}`}
                                                                                className="mt-1 flex items-center justify-center gap-2 w-full py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-xs font-extrabold text-slate-700 transition-colors shadow-sm"
                                                                            >
                                                                                <Phone size={12} className="text-slate-500" />
                                                                                Gọi: {missionDetail.request.requestedBy.phoneNumber}
                                                                            </a>
                                                                        )}
                                                                    </div>
                                                                )}

                                                                {/* Location / Address */}
                                                                <div className="space-y-1 bg-slate-50/50 border border-slate-100 p-3 rounded-xl">
                                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Địa điểm sự cố</span>
                                                                    <div className="flex gap-2 items-start text-xs text-slate-755">
                                                                        <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                                                                        <span className="leading-relaxed font-semibold">{missionDetail.request.location?.address || 'Chưa xác định địa chỉ'}</span>
                                                                    </div>
                                                                </div>

                                                                {/* Scene Photos (Medias) */}
                                                                {missionDetail.request.medias && missionDetail.request.medias.length > 0 && (
                                                                    <div className="space-y-2">
                                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Hình ảnh hiện trường ({missionDetail.request.medias.length})</span>
                                                                        <div className="grid grid-cols-2 gap-2">
                                                                            {missionDetail.request.medias.map((media: any) => (
                                                                                <div key={media.id} className="relative aspect-video rounded-lg overflow-hidden bg-slate-100 border border-slate-200 group">
                                                                                    <img 
                                                                                        src={media.secureUrl || media.mediaUrl} 
                                                                                        alt="Incident scene" 
                                                                                        className="object-cover w-full h-full hover:scale-105 transition-transform duration-300 cursor-zoom-in"
                                                                                        onClick={() => window.open(media.secureUrl || media.mediaUrl, '_blank')}
                                                                                    />
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <div className="text-xs text-slate-400 italic">Đang tải thông tin...</div>
                                                        )}
                                                    </div>
                                                </Card>

                                                <div className="bg-white/60 border border-slate-200 rounded-2xl p-5">
                                                    <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                                                        <Users className="w-4 h-4 text-slate-500" />
                                                        Thành viên đội (
                                                        {teamMembers?.length ?? 0})
                                                    </h4>
                                                    <div className="space-y-3">
                                                        {teamMembers?.map(
                                                            (member: RescueTeamMemberDTO) => (
                                                                <div
                                                                    key={member.id}
                                                                    className="flex items-center gap-3"
                                                                >
                                                                    <Avatar className="w-9 h-9 border border-slate-300">
                                                                        <AvatarImage
                                                                            src={member.avatar}
                                                                        />
                                                                        <AvatarFallback className="bg-slate-100 text-slate-600 text-xs font-bold">
                                                                            {getInitials(
                                                                                member.fullName
                                                                            )}
                                                                        </AvatarFallback>
                                                                    </Avatar>
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="text-sm font-bold text-slate-900 truncate">
                                                                            {member.fullName}
                                                                        </p>
                                                                        <p className="text-xs text-slate-500 truncate">
                                                                            {member.email}
                                                                        </p>
                                                                    </div>
                                                                    <div
                                                                        className="w-2 h-2 rounded-full bg-slate-300"
                                                                        title="Thành viên đội"
                                                                    />
                                                                </div>
                                                            )
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </section>
                            )}

                            {/* ══════════════════ TAB: TEAM MEMBERS ══════════════════ */}
                            {activeTab === 'team_members' && (
                                <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-5">
                                    {/* Team info */}
                                    {teamDetails && (
                                        <div className="bg-gradient-to-br from-slate-100 to-slate-50 border border-slate-300/60 rounded-2xl p-6">
                                            <div className="flex items-center justify-between flex-wrap gap-4">
                                                <div>
                                                    <h3 className="text-xl font-black text-slate-900">
                                                        {teamDetails.teamName}
                                                    </h3>
                                                    <p className="text-slate-500 text-sm mt-1">
                                                        {teamDetails.description ??
                                                            'Đội cứu hộ chuyên nghiệp'}
                                                    </p>
                                                </div>
                                                <MissionStatusBadge
                                                    status={teamDetails.status}
                                                />
                                            </div>
                                            <div className="grid grid-cols-3 gap-4 mt-5 pt-5 border-t border-slate-300/40">
                                                <div>
                                                    <p className="text-2xl font-black text-slate-900">
                                                        {teamMembers?.length ?? 0}
                                                    </p>
                                                    <p className="text-xs text-slate-500 font-semibold mt-0.5">
                                                        Thành viên
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-2xl font-black text-slate-900">
                                                        {
                                                            historyMissions.filter(
                                                                (m: MissionSummary) =>
                                                                    m.status === 'COMPLETED'
                                                            ).length
                                                        }
                                                    </p>
                                                    <p className="text-xs text-slate-500 font-semibold mt-0.5">
                                                        Nhiệm vụ hoàn thành
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-2xl font-black text-slate-900">
                                                        {missions?.length ?? 0}
                                                    </p>
                                                    <p className="text-xs text-slate-500 font-semibold mt-0.5">
                                                        Tổng nhiệm vụ
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Members grid */}
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-3">
                                            Danh sách thành viên ({teamMembers?.length ?? 0})
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {teamMembers?.map(
                                                (member: RescueTeamMemberDTO) => (
                                                    <div
                                                        key={member.id}
                                                        className="flex items-center gap-4 p-4 bg-white/70 border border-slate-200 rounded-xl hover:border-slate-300 transition-all"
                                                    >
                                                        <Avatar className="w-12 h-12 border-2 border-slate-300">
                                                            <AvatarImage src={member.avatar} />
                                                            <AvatarFallback className="bg-red-900/50 text-red-300 font-black">
                                                                {getInitials(member.fullName)}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-bold text-slate-900 truncate">
                                                                {member.fullName}
                                                            </p>
                                                            <p className="text-xs text-slate-500 truncate">
                                                                {member.email}
                                                            </p>
                                                            <div className="flex items-center gap-2 mt-1.5">
                                                                <span
                                                                    className={cn(
                                                                        'text-[10px] font-bold px-2 py-0.5 rounded-full',
                                                                        member.isActive
                                                                            ? 'bg-emerald-500/15 text-emerald-400'
                                                                            : 'bg-slate-200 text-slate-500'
                                                                    )}
                                                                >
                                                                    {member.isActive
                                                                        ? 'Hoạt động'
                                                                        : 'Không hoạt động'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    </div>
                                </section>
                            )}

                            {/* ══════════════════ TAB: HISTORY ══════════════════ */}
                            {activeTab === 'mission_history' && (
                                <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-slate-500">
                                                {historyMissions.length} nhiệm vụ đã kết thúc
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm">
                                            <span className="flex items-center gap-1.5 text-emerald-400">
                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                                {
                                                    historyMissions.filter(
                                                        (m: MissionSummary) =>
                                                            m.status === 'COMPLETED'
                                                    ).length
                                                }{' '}
                                                hoàn thành
                                            </span>
                                            <span className="text-slate-700">·</span>
                                            <span className="flex items-center gap-1.5 text-rose-400">
                                                <XCircle className="w-3.5 h-3.5" />
                                                {
                                                    historyMissions.filter(
                                                        (m: MissionSummary) =>
                                                            m.status === 'ABORTED'
                                                    ).length
                                                }{' '}
                                                đã hủy
                                            </span>
                                        </div>
                                    </div>

                                    {historyMissions.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-24 text-center">
                                            <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                                                <History className="w-10 h-10 text-slate-600" />
                                            </div>
                                            <h3 className="text-xl font-bold text-slate-500">
                                                Chưa có lịch sử nhiệm vụ
                                            </h3>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {historyMissions.map(
                                                (mission: MissionSummary) => (
                                                    <div
                                                        key={mission.id}
                                                        className="flex items-center gap-4 p-5 bg-white/60 border border-slate-200 rounded-xl hover:border-slate-300 transition-colors"
                                                    >
                                                        <div
                                                            className={cn(
                                                                'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                                                                mission.status === 'COMPLETED'
                                                                    ? 'bg-emerald-500/15 text-emerald-400'
                                                                    : 'bg-rose-500/15 text-rose-400'
                                                            )}
                                                        >
                                                            {mission.status === 'COMPLETED' ? (
                                                                <CheckCircle2 className="w-5 h-5" />
                                                            ) : (
                                                                <XCircle className="w-5 h-5" />
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-bold text-slate-900">
                                                                #{mission.id.slice(-8).toUpperCase()}
                                                            </p>
                                                            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                                                                <Clock className="w-3 h-3" />
                                                                {mission.startTime
                                                                    ? format(
                                                                        new Date(mission.startTime),
                                                                        'HH:mm dd/MM/yyyy',
                                                                        { locale: vi }
                                                                    )
                                                                    : '—'}
                                                                {mission.endTime && (
                                                                    <>
                                                                        {' '}→{' '}
                                                                        {format(
                                                                            new Date(mission.endTime),
                                                                            'HH:mm dd/MM',
                                                                            { locale: vi }
                                                                        )}
                                                                    </>
                                                                )}
                                                            </p>
                                                        </div>
                                                        <MissionStatusBadge
                                                            status={mission.status}
                                                        />
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    )}
                                </section>
                            )}
                        </div>
                    </div>
                </main>
            </div>

            {/* ── DIALOGS ────────────────────────────────────────────────── */}
            <ConfirmActionDialog
                open={!!rejectTarget}
                onClose={() => setRejectTarget(null)}
                onConfirm={handleReject}
                isPending={rejectMission.isPending}
                title="Từ chối nhiệm vụ"
                description="Bạn sắp từ chối nhiệm vụ này. Hành động này sẽ hủy bỏ phân công và đội sẽ trở về trạng thái Sẵn sàng."
                confirmLabel="Xác nhận từ chối"
            />

            <ConfirmActionDialog
                open={!!abortTarget}
                onClose={() => setAbortTarget(null)}
                onConfirm={handleAbort}
                isPending={rejectMission.isPending}
                title="Hủy bỏ nhiệm vụ"
                description="Bạn sắp hủy bỏ nhiệm vụ đang thực hiện. Request tương ứng sẽ bị hủy và đội sẽ trở về trạng thái Sẵn sàng."
                confirmLabel="Xác nhận hủy"
            />

            <TeamNotifyModal
                open={showTeamNotify}
                onClose={() => setShowTeamNotify(false)}
                members={(teamMembers ?? []).filter((m: RescueTeamMemberDTO) => m.isActive !== false)}
                onConfirmed={async (note) => {
                    setShowTeamNotify(false)
                    if (currentMission?.id) {
                        try {
                            await addMissionHistory.mutateAsync({
                                missionId: currentMission.id,
                                note: note
                            })
                            toast.success('Đã gửi thông báo đến toàn đội!')
                        } catch (error) {
                            toast.error('Lỗi khi gửi thông báo')
                        }
                    } else {
                        toast.success('Đã gửi thông báo đến toàn đội!')
                    }
                }}
            />
        </SidebarProvider>
    )
}
