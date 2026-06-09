'use client'

import { use, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import { useProfileQuery } from '@/lib/api/use-profile'
import {
    useMissionDetail,
    useMissionHistory,
    useUpdateMissionStatus,
    useAddMissionHistory,
    useFinishMission,
    useAbortMission,
} from '@/lib/api/features/missions/missions.queries'
import {
    useRescueTeamDetail,
    useRescueTeamMembers,
} from '@/lib/api/features/rescueTeams/rescueTeams.queries'
import {
    dictPriority,
    dictStatus,
    dictType,
    dictTeamStatus,
} from '@/constants/dictionary'
import {
    Loader2,
    ChevronLeft,
    Clock,
    MapPin,
    Phone,
    User,
    Users,
    Shield,
    Send,
    Calendar,
    AlertTriangle,
    FileText,
    ImageOff,
    ChevronRight,
    CheckCircle,
    XCircle,
    MessageSquare,
    RefreshCw,
    Mail,
    UserCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// Load Map Component Dynamically (Leaflet has SSR issues)
const MissionDetailMap = dynamic(
    () => import('@/components/dashboards/dispatcher/MissionDetailMap'),
    {
        ssr: false,
        loading: () => (
            <div className="w-full h-48 sm:h-64 flex items-center justify-center bg-slate-50 border border-slate-200 rounded-xl">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                <span className="ml-2 text-xs text-slate-500 font-medium">
                    Đang tải bản đồ...
                </span>
            </div>
        ),
    }
)

// Status Visual Config
const statusColors: Record<
    string,
    { dot: string; bg: string; text: string; ring: string }
> = {
    ASSIGNED: {
        dot: 'bg-amber-500',
        bg: 'bg-amber-50 dark:bg-amber-950/20',
        text: 'text-amber-700 dark:text-amber-400',
        ring: 'ring-amber-500/20',
    },
    EN_ROUTE: {
        dot: 'bg-blue-500 animate-pulse',
        bg: 'bg-blue-50 dark:bg-blue-950/20',
        text: 'text-blue-700 dark:text-blue-400',
        ring: 'ring-blue-500/20',
    },
    ON_SITE: {
        dot: 'bg-violet-500',
        bg: 'bg-violet-50 dark:bg-violet-950/20',
        text: 'text-violet-700 dark:text-violet-400',
        ring: 'ring-violet-500/20',
    },
    IN_PROGRESS: {
        dot: 'bg-indigo-500 animate-pulse',
        bg: 'bg-indigo-50 dark:bg-indigo-950/20',
        text: 'text-indigo-700 dark:text-indigo-400',
        ring: 'ring-indigo-500/20',
    },
    COMPLETED: {
        dot: 'bg-emerald-500',
        bg: 'bg-emerald-50 dark:bg-emerald-950/20',
        text: 'text-emerald-700 dark:text-emerald-400',
        ring: 'ring-emerald-500/20',
    },
    ABORTED: {
        dot: 'bg-red-500',
        bg: 'bg-red-50 dark:bg-red-950/20',
        text: 'text-red-700 dark:text-red-400',
        ring: 'ring-red-500/20',
    },
}

const priorityColor: Record<string, string> = {
    CRITICAL:
        'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
    HIGH: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800',
    MEDIUM: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
    LOW: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
}

// Image Gallery Helper
function ImageGallery({ urls }: { urls: string[] }) {
    const [active, setActive] = useState(0)
    const [imgError, setImgError] = useState<Record<number, boolean>>({})

    if (urls.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center gap-2 h-40 bg-slate-50 rounded-xl border border-slate-200 border-dashed">
                <ImageOff className="size-8 text-slate-300" />
                <p className="text-xs text-slate-400">
                    Không có hình ảnh hiện trường
                </p>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-2">
            <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                {imgError[active] ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-400">
                        <ImageOff className="size-8" />
                        <p className="text-xs">Không tải được ảnh</p>
                    </div>
                ) : (
                    <Image
                        src={urls[active]}
                        alt={`Hình ảnh đính kèm ${active + 1}`}
                        fill
                        unoptimized
                        className="object-cover"
                        onError={() =>
                            setImgError(prev => ({ ...prev, [active]: true }))
                        }
                    />
                )}
                {urls.length > 1 && (
                    <span className="absolute bottom-2 right-2 text-[10px] font-bold bg-black/50 text-white px-2 py-0.5 rounded-full">
                        {active + 1} / {urls.length}
                    </span>
                )}
            </div>

            {urls.length > 1 && (
                <div className="flex gap-1.5 overflow-x-auto pb-1">
                    {urls.map((url, i) => (
                        <button
                            key={i}
                            type="button"
                            onClick={() => setActive(i)}
                            className={cn(
                                'relative shrink-0 size-12 rounded-lg overflow-hidden border-2 transition-all',
                                active === i
                                    ? 'border-blue-500'
                                    : 'border-transparent opacity-60 hover:opacity-90'
                            )}
                        >
                            {imgError[i] ? (
                                <div className="flex size-full items-center justify-center bg-slate-100">
                                    <ImageOff className="size-4 text-slate-300" />
                                </div>
                            ) : (
                                <Image
                                    src={url}
                                    alt={`Thumb ${i + 1}`}
                                    fill
                                    unoptimized
                                    className="object-cover"
                                    onError={() =>
                                        setImgError(prev => ({
                                            ...prev,
                                            [i]: true,
                                        }))
                                    }
                                />
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}

// Main Page Component
export default function MissionDetailPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const router = useRouter()
    const { id } = use(params)

    // Queries
    const { data: profile } = useProfileQuery()
    const {
        data: missionResponse,
        isLoading: isMissionLoading,
        error: missionError,
    } = useMissionDetail(id)
    const { data: historyEvents, isLoading: isHistoryLoading } =
        useMissionHistory(id)

    const mission = missionResponse
    const rescueTeamId = mission?.rescueTeam?.id ?? mission?.rescueTeamId ?? ''

    const { data: teamDetail } = useRescueTeamDetail(rescueTeamId)
    const { data: teamMembers = [] } = useRescueTeamMembers(rescueTeamId)

    // Mutations
    const updateStatusMutation = useUpdateMissionStatus()
    const addHistoryMutation = useAddMissionHistory()
    const finishMissionMutation = useFinishMission()
    const abortMissionMutation = useAbortMission()

    // State
    const [historyNote, setHistoryNote] = useState('')
    const [isAbortDialogOpen, setIsAbortDialogOpen] = useState(false)
    const [abortNote, setAbortNote] = useState('')
    const [now, setNow] = useState(Date.now())

    // Update timer for elapsed calculation
    useEffect(() => {
        if (!mission || ['COMPLETED', 'ABORTED'].includes(mission.status))
            return
        const interval = setInterval(() => setNow(Date.now()), 10000)
        return () => clearInterval(interval)
    }, [mission])

    // Handle Note Submission
    const handleAddNote = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!historyNote.trim()) return

        try {
            await addHistoryMutation.mutateAsync({
                missionId: id,
                payload: {
                    changedById: profile?.id,
                    note: historyNote.trim(),
                },
            })
            toast.success('Đã ghi nhận ghi chú mới vào lịch sử!')
            setHistoryNote('')
        } catch (error) {
            toast.error('Không thể lưu ghi chú')
        }
    }

    // Rules for status transitions (matching backend validation)
    const isValidTransition = (currentStatus: string, targetStatus: string) => {
        if (['COMPLETED', 'ABORTED'].includes(currentStatus)) return false
        if (['COMPLETED', 'ABORTED'].includes(targetStatus)) return false

        if (currentStatus === 'ASSIGNED' && targetStatus === 'EN_ROUTE')
            return true
        if (currentStatus === 'EN_ROUTE' && targetStatus === 'ON_SITE')
            return true
        if (currentStatus === 'ON_SITE' && targetStatus === 'IN_PROGRESS')
            return true
        if (currentStatus === 'IN_PROGRESS' && targetStatus === 'ON_SITE')
            return true

        return false
    }

    // Handle Status Update
    const handleUpdateStatus = async (newStatus: string) => {
        if (!profile?.id) {
            toast.error('Không tìm thấy thông tin đăng nhập')
            return
        }

        if (!mission) {
            toast.error('Không tìm thấy thông tin nhiệm vụ')
            return
        }

        if (['COMPLETED', 'ABORTED'].includes(mission.status)) {
            toast.error(
                `Nhiệm vụ đã kết thúc ở trạng thái ${dictStatus[mission.status].toUpperCase()}. Không thể thay đổi trạng thái.`
            )
            return
        }

        if (!isValidTransition(mission.status, newStatus)) {
            toast.error(
                `Không thể chuyển trạng thái từ ${dictStatus[mission.status]} sang ${dictStatus[newStatus]} theo quy tắc hệ thống.`
            )
            return
        }

        try {
            await updateStatusMutation.mutateAsync({
                missionId: id,
                payload: {
                    status: newStatus as any,
                    changedById: profile.id,
                    note: `Điều phối viên cập nhật trạng thái nhiệm vụ thành ${dictStatus[newStatus]}`,
                },
            })
            toast.success(`Đã chuyển trạng thái sang: ${dictStatus[newStatus]}`)
        } catch (error: any) {
            const serverMsg = error?.response?.data?.message || error?.message
            toast.error(serverMsg || 'Không thể cập nhật trạng thái')
        }
    }

    // Handle Finish Mission
    const handleFinish = async () => {
        if (!profile?.id) return
        if (!mission) {
            toast.error('Không tìm thấy thông tin nhiệm vụ')
            return
        }

        if (['COMPLETED', 'ABORTED'].includes(mission.status)) {
            toast.error(
                `Nhiệm vụ đã kết thúc ở trạng thái ${dictStatus[mission.status].toUpperCase()}. Không thể hoàn thành.`
            )
            return
        }

        try {
            await finishMissionMutation.mutateAsync({
                missionId: id,
                payload: {
                    changedById: profile.id,
                    note: 'Điều phối viên đánh dấu hoàn thành nhiệm vụ.',
                },
            })
            toast.success('Nhiệm vụ đã được hoàn thành!')
        } catch (error: any) {
            const serverMsg = error?.response?.data?.message || error?.message
            toast.error(serverMsg || 'Thao tác thất bại')
        }
    }

    // Handle Abort Mission
    const handleAbort = async () => {
        if (!profile?.id) return
        if (!mission) {
            toast.error('Không tìm thấy thông tin nhiệm vụ')
            return
        }

        if (['COMPLETED', 'ABORTED'].includes(mission.status)) {
            toast.error(
                `Nhiệm vụ đã kết thúc ở trạng thái ${dictStatus[mission.status].toUpperCase()}. Không thể hủy bỏ.`
            )
            return
        }

        if (!abortNote.trim()) {
            toast.error('Vui lòng nhập lý do hủy nhiệm vụ')
            return
        }

        try {
            await abortMissionMutation.mutateAsync({
                missionId: id,
                payload: {
                    changedById: profile.id,
                    note: abortNote.trim(),
                },
            })
            toast.success('Đã hủy bỏ nhiệm vụ!')
            setIsAbortDialogOpen(false)
            setAbortNote('')
        } catch (error: any) {
            const serverMsg = error?.response?.data?.message || error?.message
            toast.error(serverMsg || 'Thao tác hủy nhiệm vụ thất bại')
        }
    }

    // Helper: format dates safe for both Local and ISO
    const toLocalDate = (dateString?: string) => {
        if (!dateString) return null
        if (dateString.endsWith('Z') || dateString.includes('+'))
            return new Date(dateString)
        return new Date(dateString + 'Z')
    }

    // Time elapsed or total taken
    const getDurationText = () => {
        if (!mission?.createAt) return 'N/A'
        const start = toLocalDate(mission.createAt)?.getTime() ?? 0
        const end =
            mission.status === 'COMPLETED' || mission.status === 'ABORTED'
                ? (toLocalDate(
                      mission.endTime || mission.updateAt
                  )?.getTime() ?? Date.now())
                : now

        const diff = end - start
        if (diff < 0) return 'Vừa mới đây'
        const minutes = Math.floor(diff / 60000)
        const hours = Math.floor(minutes / 60)
        const days = Math.floor(hours / 24)

        if (days > 0) return `${days} ngày ${hours % 24} giờ`
        if (hours > 0) return `${hours} giờ ${minutes % 60} phút`
        return `${minutes} phút`
    }

    if (isMissionLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] w-full py-16">
                <Loader2 className="size-10 animate-spin text-blue-600 mb-4" />
                <p className="text-slate-500 font-bold text-sm">
                    Đang tải chi tiết nhiệm vụ...
                </p>
            </div>
        )
    }

    if (missionError || !mission) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] w-full py-16 px-4">
                <XCircle className="size-16 text-rose-500 mb-4" />
                <h3 className="text-xl font-bold text-slate-800">
                    Không tìm thấy nhiệm vụ
                </h3>
                <p className="text-slate-500 text-sm mt-2 text-center max-w-md">
                    Có thể nhiệm vụ không tồn tại hoặc bạn không có quyền xem
                    thông tin chi tiết này.
                </p>
                <Button
                    onClick={() => router.push('/dashboard/dispatcher?view=missions')}
                    className="mt-6 bg-[#003da5] hover:bg-blue-800 text-white font-bold"
                >
                    <ChevronLeft className="w-4 h-4 mr-2" /> Quay lại Dashboard
                </Button>
            </div>
        )
    }

    const sc = statusColors[mission.status] ?? statusColors.ASSIGNED
    const isFinishedOrAborted = ['COMPLETED', 'ABORTED'].includes(
        mission.status
    )

    // Parse attached media
    const requestMedia = mission.request?.medias || []
    const mediaUrls = requestMedia.map((m: any) => m.mediaUrl || '')

    return (
        <div className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-8 py-6 space-y-6 bg-slate-50/50">
            {/* BREADCRUMB & HEADER BAR */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 md:p-6 rounded-2xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
                <div className="flex flex-col md:flex-row md:items-center gap-3">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push('/dashboard/dispatcher?view=missions')}
                        className="w-fit border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold"
                    >
                        <ChevronLeft className="w-4 h-4 mr-1.5" /> Trở về
                    </Button>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <h1 className="text-lg md:text-xl font-extrabold text-slate-900">
                                Chi tiết nhiệm vụ
                            </h1>
                            <Badge
                                variant="outline"
                                className="font-mono text-xs text-slate-500 bg-slate-50 px-2 py-0.5 border-slate-200"
                            >
                                ID-{mission.id.substring(0, 8).toUpperCase()}
                            </Badge>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                            Phân công lúc:{' '}
                            {mission.createdAt
                                ? new Date(mission.createdAt).toLocaleString(
                                      'vi-VN'
                                  )
                                : 'N/A'}
                        </p>
                    </div>
                </div>

                {/* Global Mission Status Badge */}
                <div className="flex items-center gap-2">
                    <span
                        className={cn(
                            'inline-flex items-center gap-2 text-sm font-extrabold px-4 py-2 rounded-full border ring-4',
                            sc.text,
                            sc.bg,
                            sc.ring
                        )}
                    >
                        <span
                            className={cn(
                                'w-2 h-2 rounded-full shrink-0',
                                sc.dot
                            )}
                        />
                        {dictStatus[mission.status] ?? mission.status}
                    </span>
                </div>
            </div>

            {/* TWO COLUMN GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* LEFT COLUMN: MISSION, TEAM, DISPATCHER */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Mission Progress / Actions */}
                    <Card className="rounded-2xl border-slate-200 shadow-sm hover:shadow-md transition-all">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                                <Clock className="w-5 h-5 text-blue-600" />
                                Tổng quan & Vận hành Nhiệm vụ
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                                <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                        Thời gian bắt đầu
                                    </span>
                                    <span className="text-sm font-semibold text-slate-800">
                                        {mission.createAt
                                            ? new Date(
                                                  mission.createAt
                                              ).toLocaleTimeString('vi-VN', {
                                                  hour: '2-digit',
                                                  minute: '2-digit',
                                              })
                                            : 'N/A'}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                        Thời gian kết thúc
                                    </span>
                                    <span className="text-sm font-semibold text-slate-800">
                                        {mission.endTime
                                            ? new Date(
                                                  mission.endTime
                                              ).toLocaleTimeString('vi-VN', {
                                                  hour: '2-digit',
                                                  minute: '2-digit',
                                              })
                                            : '—'}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                        Tổng thời gian
                                    </span>
                                    <span className="text-sm font-bold text-blue-600">
                                        {getDurationText()}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                        Trạng thái
                                    </span>
                                    <span className="text-sm font-bold text-slate-800">
                                        {dictStatus[mission.status]}
                                    </span>
                                </div>
                            </div>

                            {/* Operations Control buttons */}
                            {!isFinishedOrAborted ? (
                                <div className="pt-2 border-t border-slate-100 flex justify-end">
                                    <Button
                                        variant="outline"
                                        onClick={() =>
                                            setIsAbortDialogOpen(true)
                                        }
                                        className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 font-bold h-9 text-xs px-4"
                                    >
                                        <XCircle className="w-3.5 h-3.5 mr-1.5" />{' '}
                                        Hủy nhiệm vụ
                                    </Button>
                                </div>
                            ) : (
                                <div className="pt-2 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-400 italic">
                                    <AlertTriangle className="size-4 text-slate-400" />
                                    Nhiệm vụ đã kết thúc ở trạng thái{' '}
                                    {dictStatus[mission.status].toUpperCase()}.
                                    Không thể thao tác cập nhật trực tiếp.
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Rescue Team Details */}
                    <Card className="rounded-2xl border-slate-200 shadow-sm hover:shadow-md transition-all">
                        <CardHeader className="pb-3 border-b border-slate-100">
                            <div className="flex justify-between items-center">
                                <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                                    <Shield className="w-5 h-5 text-blue-600" />
                                    Đội Cứu Hộ Đảm Nhận
                                </CardTitle>
                                {teamDetail && (
                                    <Badge
                                        className={cn(
                                            'text-[10px] uppercase font-bold border-0',
                                            teamDetail.status === 'AVAILABLE'
                                                ? 'bg-emerald-100 text-emerald-700'
                                                : teamDetail.status ===
                                                    'ON_MISSION'
                                                  ? 'bg-blue-100 text-blue-700'
                                                  : 'bg-slate-100 text-slate-500'
                                        )}
                                    >
                                        {dictTeamStatus[teamDetail.status] ||
                                            teamDetail.status}
                                    </Badge>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-5">
                            {teamDetail ? (
                                <div className="space-y-4">
                                    {/* Team name & Description */}
                                    <div>
                                        <h3 className="text-lg font-black text-slate-800">
                                            {teamDetail.teamName}
                                        </h3>
                                        {teamDetail.description && (
                                            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                                {teamDetail.description}
                                            </p>
                                        )}
                                    </div>

                                    {/* Leader details */}
                                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-base shrink-0">
                                                {teamDetail.leader?.fullName ? (
                                                    teamDetail.leader.fullName
                                                        .charAt(0)
                                                        .toUpperCase()
                                                ) : (
                                                    <User />
                                                )}
                                            </div>
                                            <div className="overflow-hidden">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                                    Đội trưởng chỉ huy
                                                </span>
                                                <span className="text-sm font-bold text-slate-850 truncate block">
                                                    {teamDetail.leader
                                                        ?.fullName ??
                                                        'Chưa bổ nhiệm'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="space-y-1.5 text-xs text-slate-600 flex flex-col justify-center">
                                            <div className="flex items-center gap-2">
                                                <Mail className="w-3.5 h-3.5 text-slate-400" />
                                                <span className="truncate">
                                                    {teamDetail.leader?.email ??
                                                        'Chưa có email'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Team Members List */}
                                    <div>
                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                                            <Users className="w-4 h-4 text-slate-400" />
                                            Lực lượng trong đội (
                                            {teamMembers.length} thành viên)
                                        </h4>

                                        {teamMembers.length === 0 ? (
                                            <p className="text-xs text-slate-400 italic">
                                                Đội chưa có thành viên nào tham
                                                gia.
                                            </p>
                                        ) : (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                {teamMembers.map(member => (
                                                    <div
                                                        key={member.id}
                                                        className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-blue-200 hover:shadow-md transition-all"
                                                    >
                                                        <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs shrink-0 relative overflow-hidden">
                                                            {member.avatar ? (
                                                                <Image
                                                                    src={
                                                                        member.avatar
                                                                    }
                                                                    alt={
                                                                        member.fullName
                                                                    }
                                                                    fill
                                                                    className="object-cover"
                                                                />
                                                            ) : (
                                                                member.fullName
                                                                    .charAt(0)
                                                                    .toUpperCase()
                                                            )}
                                                        </div>
                                                        <div className="overflow-hidden flex-1">
                                                            <span className="text-xs font-extrabold text-slate-800 truncate block">
                                                                {
                                                                    member.fullName
                                                                }
                                                            </span>
                                                            <span className="text-[10px] text-slate-400 block truncate">
                                                                {member.phoneNumber ||
                                                                    member.email}
                                                            </span>
                                                        </div>
                                                        {member.id ===
                                                            teamDetail.leaderId && (
                                                            <Badge className="bg-blue-50 text-blue-600 border-blue-200 text-[8px] font-extrabold px-1.5 h-5 shrink-0 uppercase">
                                                                Leader
                                                            </Badge>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex justify-center py-6">
                                    <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Dispatcher details */}
                    <Card className="rounded-2xl border-slate-200 shadow-sm hover:shadow-md transition-all">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                                <UserCheck className="w-5 h-5 text-blue-600" />
                                Điều phối viên phụ trách
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {mission.dispatcher ? (
                                <div className="flex items-center gap-3.5">
                                    <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-base shrink-0">
                                        {(
                                            mission.dispatcher.fullName ||
                                            mission.dispatcher.name ||
                                            'D'
                                        )
                                            .charAt(0)
                                            .toUpperCase()}
                                    </div>
                                    <div className="overflow-hidden">
                                        <h4 className="font-bold text-slate-850 text-sm leading-snug">
                                            {mission.dispatcher.fullName ||
                                                mission.dispatcher.name ||
                                                'N/A'}
                                        </h4>
                                        <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-1">
                                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                                            {mission.dispatcher.email ||
                                                'Email chưa được liên kết'}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-xs text-slate-400 italic">
                                    Không tìm thấy thông tin điều phối viên phụ
                                    trách.
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* RIGHT COLUMN: REQUEST DETAIL & LOCATION MAP */}
                <div className="space-y-6">
                    {/* Incident request detail card */}
                    <Card className="rounded-2xl border-slate-200 shadow-sm hover:shadow-md transition-all">
                        <CardHeader className="pb-3 border-b border-slate-100">
                            <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-amber-500" />
                                Báo cáo sự cố liên quan
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-4">
                            {mission.request ? (
                                <div className="space-y-4">
                                    {/* Emergency type + priority */}
                                    <div className="flex gap-2 flex-wrap">
                                        <Badge
                                            variant="outline"
                                            className="text-xs font-bold text-blue-600 border-blue-200 bg-blue-50/50"
                                        >
                                            {dictType[
                                                mission.request.emergencyType
                                            ] || mission.request.emergencyType}
                                        </Badge>
                                        <Badge
                                            variant="outline"
                                            className={cn(
                                                'text-xs font-bold border-0',
                                                priorityColor[
                                                    mission.request.priority
                                                ]
                                            )}
                                        >
                                            {dictPriority[
                                                mission.request.priority
                                            ] || mission.request.priority}
                                        </Badge>
                                    </div>

                                    {/* Description from citizen */}
                                    <div className="bg-amber-50/30 border border-amber-100 p-3 rounded-xl">
                                        <span className="text-[10px] font-bold text-amber-600/80 uppercase tracking-wider block mb-1">
                                            Mô tả sự cố của người dân
                                        </span>
                                        <p className="text-xs text-slate-700 leading-relaxed italic whitespace-pre-wrap">
                                            "
                                            {mission.request.description ||
                                                'Không có mô tả chi tiết.'}
                                            "
                                        </p>
                                    </div>

                                    {/* Image Gallery */}
                                    <div>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                                            Hình ảnh hiện trường (
                                            {mediaUrls.length})
                                        </span>
                                        <ImageGallery urls={mediaUrls} />
                                    </div>

                                    {/* Location & map */}
                                    <div className="space-y-3">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                            Địa chỉ & Tọa độ bản đồ
                                        </span>
                                        <div className="flex gap-2 items-start text-xs text-slate-700">
                                            <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                                            <span className="leading-snug">
                                                {mission.request.location
                                                    ?.address ??
                                                    'Chưa rõ địa chỉ'}
                                            </span>
                                        </div>

                                        {mission.request.location?.latitude &&
                                            mission.request.location
                                                ?.longitude && (
                                                <>
                                                    <div className="text-[11px] font-mono text-slate-500 pl-6">
                                                        (
                                                        {mission.request.location.latitude.toFixed(
                                                            5
                                                        )}
                                                        ,{' '}
                                                        {mission.request.location.longitude.toFixed(
                                                            5
                                                        )}
                                                        )
                                                    </div>
                                                    {/* Leaflet Dynamic Map Component */}
                                                    <MissionDetailMap
                                                        latitude={
                                                            mission.request
                                                                .location
                                                                .latitude
                                                        }
                                                        longitude={
                                                            mission.request
                                                                .location
                                                                .longitude
                                                        }
                                                        address={
                                                            mission.request
                                                                .location
                                                                .address
                                                        }
                                                    />
                                                </>
                                            )}
                                    </div>
                                </div>
                            ) : (
                                <p className="text-xs text-slate-400 italic">
                                    Không thể liên kết với thông tin yêu cầu ban
                                    đầu.
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* FULL WIDTH: MISSION TIMELINE HISTORY */}
            <Card className="rounded-2xl border-slate-200 shadow-sm hover:shadow-md transition-all">
                <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
                    <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-blue-600" />
                        Nhật ký hành trình & Dòng thời gian
                    </CardTitle>
                    <Badge
                        variant="secondary"
                        className="text-[10px] font-bold px-2 py-0.5"
                    >
                        {historyEvents ? historyEvents.length : 0} sự kiện
                    </Badge>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                    {/* Chronological Timeline visual list */}
                    {isHistoryLoading ? (
                        <div className="flex justify-center py-6">
                            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                        </div>
                    ) : !historyEvents || historyEvents.length === 0 ? (
                        <p className="text-xs text-slate-400 italic py-4 text-center">
                            Chưa ghi nhận sự kiện nào trong lịch sử nhiệm vụ.
                        </p>
                    ) : (
                        <div className="relative pl-6 border-l-2 border-slate-200 space-y-6 ml-2">
                            {historyEvents.map(evt => {
                                const isSystem = !evt.changedBy
                                const authorName =
                                    evt.changedBy?.fullName || 'Hệ thống'
                                const createdDate = toLocalDate(evt.createdAt)

                                // Determine icon or color for status change
                                const toStatusVal = evt.toStatus
                                const statusColor =
                                    statusColors[toStatusVal]?.dot ||
                                    'bg-slate-400'

                                return (
                                    <div
                                        key={evt.id}
                                        className="relative group"
                                    >
                                        {/* Timeline Circle Bullet */}
                                        <span
                                            className={cn(
                                                'absolute -left-[31px] top-1 flex items-center justify-center rounded-full w-4 h-4 bg-white border-2 border-slate-350 z-10 transition-all group-hover:scale-125'
                                            )}
                                        >
                                            <span
                                                className={cn(
                                                    'w-1.5 h-1.5 rounded-full',
                                                    statusColor
                                                )}
                                            />
                                        </span>

                                        {/* Timeline event content card */}
                                        <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-sm max-w-2xl hover:border-blue-200 hover:shadow-md transition-all">
                                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1.5 mb-1.5">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="text-xs font-black text-slate-800">
                                                        {authorName}
                                                    </span>

                                                    {evt.fromStatus ? (
                                                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                                            chuyển trạng thái
                                                            sang
                                                            <Badge
                                                                className={cn(
                                                                    'text-[9px] font-black uppercase border-0',
                                                                    statusColors[
                                                                        evt
                                                                            .toStatus
                                                                    ]?.bg,
                                                                    statusColors[
                                                                        evt
                                                                            .toStatus
                                                                    ]?.text
                                                                )}
                                                            >
                                                                {dictStatus[
                                                                    evt.toStatus
                                                                ] ||
                                                                    evt.toStatus}
                                                            </Badge>
                                                        </span>
                                                    ) : (
                                                        <span className="text-[10px] text-slate-400">
                                                            đã ghi nhận ý kiến /
                                                            sự việc
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1 shrink-0">
                                                    <Clock className="size-3" />
                                                    {createdDate
                                                        ? createdDate.toLocaleString(
                                                              'vi-VN'
                                                          )
                                                        : 'N/A'}
                                                </span>
                                            </div>

                                            {evt.note && (
                                                <p className="text-xs text-slate-600 bg-slate-50 border border-slate-100 p-2.5 rounded-lg leading-relaxed whitespace-pre-wrap">
                                                    {evt.note}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}

                    {/* Quick timeline note submission form */}
                    <form
                        onSubmit={handleAddNote}
                        className="pt-4 border-t border-slate-100 space-y-3"
                    >
                        <div className="space-y-1.5">
                            <label
                                htmlFor="historyNote"
                                className="text-xs font-bold text-slate-700 flex items-center gap-1.5"
                            >
                                <MessageSquare className="w-4 h-4 text-blue-600" />
                                Thêm ghi chú/Ý kiến chỉ đạo nhanh vào Nhật ký
                                nhiệm vụ
                            </label>
                            <Textarea
                                id="historyNote"
                                value={historyNote}
                                onChange={e => setHistoryNote(e.target.value)}
                                placeholder="Nhập ý kiến chỉ đạo, ghi chú vị trí tắc đường, khó khăn gặp phải..."
                                className="bg-slate-50 border-slate-200 min-h-[80px] text-xs focus-visible:ring-blue-600"
                            />
                        </div>
                        <div className="flex justify-end">
                            <Button
                                type="submit"
                                disabled={
                                    addHistoryMutation.isPending ||
                                    !historyNote.trim()
                                }
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-9 text-xs px-5 shadow-sm"
                            >
                                {addHistoryMutation.isPending && (
                                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                                )}
                                <Send className="w-3.5 h-3.5 mr-1.5" /> Ghi nhận
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* ABORT CONFIRMATION DIALOG */}
            <Dialog
                open={isAbortDialogOpen}
                onOpenChange={setIsAbortDialogOpen}
            >
                <DialogContent className="sm:max-w-md bg-white">
                    <DialogHeader>
                        <DialogTitle className="text-red-600 font-bold flex items-center gap-2">
                            <AlertTriangle className="size-5" />
                            Yêu cầu Hủy Nhiệm Vụ
                        </DialogTitle>
                        <DialogDescription>
                            Vui lòng cung cấp lý do chi tiết hủy bỏ nhiệm vụ
                            này. Quyết định hủy nhiệm vụ sẽ lưu trữ trong lịch
                            sử và thông báo tới đội cứu hộ.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-3">
                        <Textarea
                            value={abortNote}
                            onChange={e => setAbortNote(e.target.value)}
                            placeholder="Nhập lý do hủy... (Ví dụ: Sự cố đã được xử lý bởi đội cứu hoả địa phương, thông tin báo giả...)"
                            className="bg-slate-50 border-slate-200 text-xs min-h-[100px]"
                        />
                    </div>
                    <div className="flex gap-3 justify-end border-t border-slate-100 pt-3">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsAbortDialogOpen(false)
                                setAbortNote('')
                            }}
                            className="font-bold text-xs"
                        >
                            Quay lại
                        </Button>
                        <Button
                            onClick={handleAbort}
                            disabled={
                                abortMissionMutation.isPending ||
                                !abortNote.trim()
                            }
                            className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs"
                        >
                            {abortMissionMutation.isPending && (
                                <Loader2 className="size-3.5 mr-1.5 animate-spin" />
                            )}
                            Xác nhận hủy
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
