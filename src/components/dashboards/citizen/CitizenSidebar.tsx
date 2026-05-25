'use client'

import { CitizenRequestDetailDialog } from '@/components/dashboards/citizen/CitizenRequestDetailDialog'
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
    SidebarSeparator,
} from '@/components/ui/sidebar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { dictPriority, dictStatus, dictType } from '@/constants/dictionary'
import {
    useCitizenRequestsQuery,
    useCreateCitizenRequestMutation,
    type CitizenRequestSubmissionInput,
} from '@/lib/api/features/requests/citizen.queries'
import type {
    RequestDetail,
    EmergencyCategory,
    RequestPriority,
} from '@/types/request'
import { getApiErrorMessage } from '@/lib/api/client'
import { cn } from '@/lib/utils'
import {
    Activity,
    AlertTriangle,
    Camera,
    CheckCircle2,
    Clock,
    FileVideo,
    Filter,
    Loader2,
    LocateFixed,
    MapPin,
    Plus,
    Radio,
    RefreshCw,
    Search,
    X,
    XCircle,
} from 'lucide-react'
import { useMemo, useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import Image from 'next/image'

// ─── Status helpers ────────────────────────────────────────────────────────────
type FilterStatus = 'ALL' | 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'

const STATUS_FILTERS: { value: FilterStatus; label: string }[] = [
    { value: 'ALL', label: 'Tất cả' },
    { value: 'PENDING', label: 'Chờ xử lý' },
    { value: 'IN_PROGRESS', label: 'Đang xử lý' },
    { value: 'RESOLVED', label: 'Giải quyết' },
    { value: 'CLOSED', label: 'Đã đóng' },
]

function statusConfig(status: string) {
    const cfg: Record<
        string,
        { color: string; dot: string; icon: React.ReactNode }
    > = {
        PENDING: {
            color: 'text-amber-600 bg-amber-50 border-amber-200',
            dot: 'bg-amber-500 animate-pulse',
            icon: <Clock className="size-3" />,
        },
        IN_PROGRESS: {
            color: 'text-blue-600 bg-blue-50 border-blue-200',
            dot: 'bg-blue-500 animate-pulse',
            icon: <Radio className="size-3" />,
        },
        RESOLVED: {
            color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
            dot: 'bg-emerald-500',
            icon: <CheckCircle2 className="size-3" />,
        },
        CLOSED: {
            color: 'text-slate-500 bg-slate-50 border-slate-200',
            dot: 'bg-slate-400',
            icon: <XCircle className="size-3" />,
        },
        ON_MISSION: {
            color: 'text-violet-600 bg-violet-50 border-violet-200',
            dot: 'bg-violet-500 animate-pulse',
            icon: <Radio className="size-3" />,
        },
    }
    return cfg[status] ?? cfg.CLOSED
}

// ─── Emergency to API number map ──────────────────────────────────────────────
const emergencyToApi: Record<EmergencyCategory, number> = {
    FIRE: 1,
    FLOOD: 2,
    EARTHQUAKE: 3,
    MEDICAL: 4,
    TRAFFIC: 5,
    COLLAPSE: 6,
    LANDSLIDE: 7,
    OTHER: 8,
}
const priorityToApi: Record<RequestPriority, number> = {
    CRITICAL: 1,
    HIGH: 2,
    MEDIUM: 3,
    LOW: 4,
}

// ─── RequestCard ──────────────────────────────────────────────────────────────
function RequestCard({
    request,
    onClick,
}: {
    request: RequestDetail
    onClick: () => void
}) {
    const status = statusConfig(request.status)
    const timeAgo = useMemo(() => {
        const diff = Math.floor(
            (Date.now() - new Date(request.createdAt ?? '').getTime()) / 1000
        )
        if (diff < 60) return 'Vừa xong'
        if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`
        if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`
        return `${Math.floor(diff / 86400)} ngày trước`
    }, [request.createdAt])

    return (
        <button
            type="button"
            onClick={onClick}
            className="w-full text-left px-3 py-3 rounded-lg border border-slate-200 bg-white hover:border-blue-300 hover:shadow-sm transition-all group"
        >
            {/* Type + Priority */}
            <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <AlertTriangle className="size-3.5 text-orange-500 shrink-0" />
                    {dictType[request.emergencyType] ?? request.emergencyType}
                </span>
                <span className="text-[10px] font-bold text-orange-700 bg-orange-50 border border-orange-100 px-1.5 py-0.5 rounded">
                    {dictPriority[request.priority] ?? request.priority}
                </span>
            </div>

            {/* Location */}
            <div className="flex items-start gap-1.5 mb-1.5">
                <MapPin className="size-3 text-slate-400 shrink-0 mt-0.5" />
                <span className="text-[11px] text-slate-500 line-clamp-1">
                    {request.location?.address ?? 'Chưa có địa chỉ'}
                </span>
            </div>

            {/* Description */}
            {request.description && (
                <div className="mb-2 text-[11px] text-slate-600 line-clamp-2 italic">
                    {request.description}
                </div>
            )}

            {/* Status + Time */}
            <div className="flex items-center justify-between">
                <span
                    className={cn(
                        'inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border',
                        status.color
                    )}
                >
                    <span
                        className={cn(
                            'size-1.5 rounded-full shrink-0',
                            status.dot
                        )}
                    />
                    {dictStatus[request.status] ?? request.status}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                    {timeAgo}
                </span>
            </div>
        </button>
    )
}

// ─── CreateRequestSheet ───────────────────────────────────────────────────────
function CreateRequestSheet({
    open,
    onOpenChange,
}: {
    open: boolean
    onOpenChange: (v: boolean) => void
}) {
    const createMutation = useCreateCitizenRequestMutation()
    const [emergencyType, setEmergencyType] =
        useState<EmergencyCategory>('FLOOD')
    const [priority, setPriority] = useState<RequestPriority>('CRITICAL')
    const [address, setAddress] = useState('')
    const [landmark, setLandmark] = useState('')
    const [description, setDescription] = useState('')
    const [coords, setCoords] = useState('')
    const [isLocating, setIsLocating] = useState(false)
    const [attachments, setAttachments] = useState<
        { file: File; preview: string; type: string }[]
    >([])

    const handleGetLocation = () => {
        if (!navigator.geolocation) {
            toast.error('Trình duyệt không hỗ trợ GPS.')
            return
        }
        setIsLocating(true)
        navigator.geolocation.getCurrentPosition(
            pos => {
                setCoords(
                    `${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`
                )
                setIsLocating(false)
                toast.success('Đã lấy tọa độ GPS hiện tại.')
            },
            () => {
                setIsLocating(false)
                toast.error('Không thể lấy vị trí hiện tại.')
            },
            { enableHighAccuracy: true, timeout: 8000 }
        )
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files).map(file => ({
                file,
                preview: URL.createObjectURL(file),
                type: file.type.startsWith('video') ? 'video' : 'image',
            }))
            setAttachments(prev => [...prev, ...newFiles])
        }
    }

    const removeAttachment = (index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index))
    }

    const reset = () => {
        setEmergencyType('FLOOD')
        setPriority('CRITICAL')
        setAddress('')
        setLandmark('')
        setDescription('')
        setCoords('')
        setAttachments([])
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!coords.trim()) {
            toast.error('Vui lòng lấy tọa độ GPS trước khi gửi.')
            return
        }
        const [lat, lng] = coords.split(',').map(v => parseFloat(v.trim()))
        if (isNaN(lat) || isNaN(lng)) {
            toast.error('Tọa độ không hợp lệ.')
            return
        }
        try {
            await createMutation.mutateAsync({
                emergencyType: emergencyToApi[emergencyType],
                priority: priorityToApi[priority],
                description,
                address: address || 'Chưa có địa chỉ',
                latitude: lat,
                longitude: lng,
                landmark: landmark || undefined,
                medias:
                    attachments.length > 0
                        ? attachments.map(item => item.file)
                        : undefined,
            } satisfies CitizenRequestSubmissionInput)
            toast.success('Đã gửi yêu cầu cứu trợ thành công!')
            reset()
            onOpenChange(false)
        } catch (err) {
            toast.error('Không thể gửi yêu cầu', {
                description: getApiErrorMessage(err),
            })
        }
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="left"
                className="w-[400px] sm:w-[460px] p-0 flex flex-col"
            >
                <SheetHeader className="px-5 py-4 border-b bg-white shrink-0">
                    <SheetTitle className="flex items-center gap-2 text-slate-900">
                        <div className="flex size-8 items-center justify-center rounded-lg bg-red-100">
                            <Radio className="size-4 text-red-600" />
                        </div>
                        Tạo Yêu Cầu Cứu Trợ Mới
                    </SheetTitle>
                </SheetHeader>

                <ScrollArea className="flex-1">
                    <form
                        id="create-request-form"
                        onSubmit={handleSubmit}
                        className="flex flex-col gap-4 p-5"
                    >
                        {/* Emergency Type */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-semibold text-slate-700">
                                Loại sự cố *
                            </label>
                            <Select
                                value={emergencyType}
                                onValueChange={v =>
                                    setEmergencyType(v as EmergencyCategory)
                                }
                            >
                                <SelectTrigger className="h-10 rounded-lg bg-slate-50 border-slate-200">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="FIRE">
                                        🔥 Hỏa hoạn / Cháy nổ
                                    </SelectItem>
                                    <SelectItem value="FLOOD">
                                        🌊 Ngập lụt / Lũ quét
                                    </SelectItem>
                                    <SelectItem value="EARTHQUAKE">
                                        🌍 Động đất
                                    </SelectItem>
                                    <SelectItem value="MEDICAL">
                                        🏥 Cấp cứu y tế
                                    </SelectItem>
                                    <SelectItem value="TRAFFIC">
                                        🚗 Tai nạn giao thông
                                    </SelectItem>
                                    <SelectItem value="COLLAPSE">
                                        🏚️ Sập công trình
                                    </SelectItem>
                                    <SelectItem value="LANDSLIDE">
                                        ⛰️ Sạt lở / Thiên tai
                                    </SelectItem>
                                    <SelectItem value="OTHER">
                                        📋 Khác
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Priority */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-semibold text-slate-700">
                                Mức độ khẩn cấp *
                            </label>
                            <Select
                                value={priority}
                                onValueChange={v =>
                                    setPriority(v as RequestPriority)
                                }
                            >
                                <SelectTrigger className="h-10 rounded-lg bg-slate-50 border-slate-200">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="CRITICAL">
                                        🔴 CRITICAL — Cực kỳ khẩn cấp
                                    </SelectItem>
                                    <SelectItem value="HIGH">
                                        🟠 HIGH — Nguy hiểm cao
                                    </SelectItem>
                                    <SelectItem value="MEDIUM">
                                        🟡 MEDIUM — Trung bình
                                    </SelectItem>
                                    <SelectItem value="LOW">
                                        🟢 LOW — Thấp
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <Separator />

                        {/* GPS Coordinates */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-semibold text-slate-700">
                                Tọa độ GPS *
                            </label>
                            <div className="flex gap-2">
                                <Input
                                    value={coords}
                                    onChange={e => setCoords(e.target.value)}
                                    placeholder="16.05440, 108.20220"
                                    className="h-10 font-mono text-xs bg-slate-50 border-slate-200 rounded-lg flex-1"
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={handleGetLocation}
                                    disabled={isLocating}
                                    className="h-10 w-10 shrink-0 border-slate-200"
                                    title="Lấy vị trí hiện tại"
                                >
                                    {isLocating ? (
                                        <Loader2 className="size-4 animate-spin" />
                                    ) : (
                                        <LocateFixed className="size-4 text-blue-600" />
                                    )}
                                </Button>
                            </div>
                            <p className="text-[11px] text-slate-400">
                                Nhấn nút định vị để tự động lấy tọa độ GPS
                            </p>
                        </div>

                        {/* Address */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-semibold text-slate-700">
                                Địa chỉ *
                            </label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
                                <Input
                                    value={address}
                                    onChange={e => setAddress(e.target.value)}
                                    placeholder="Số nhà, tên đường, phường/xã..."
                                    className="h-10 pl-9 bg-slate-50 border-slate-200 rounded-lg"
                                />
                            </div>
                        </div>

                        {/* Landmark */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-semibold text-slate-700">
                                Mốc nhận diện
                            </label>
                            <Input
                                value={landmark}
                                onChange={e => setLandmark(e.target.value)}
                                placeholder="VD: Gần trường học, ngã tư..."
                                className="h-10 bg-slate-50 border-slate-200 rounded-lg"
                            />
                        </div>

                        {/* Description */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-semibold text-slate-700">
                                Mô tả tình trạng *
                            </label>
                            <Textarea
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                placeholder="Mô tả tình trạng hiện tại, số người cần cứu hộ..."
                                className="min-h-[100px] bg-slate-50 border-slate-200 rounded-lg resize-none text-sm"
                            />
                        </div>

                        {/* Attachments */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-semibold text-slate-700">
                                Đính kèm minh chứng (Ảnh/Video)
                            </label>
                            <div className="flex flex-wrap gap-2 p-2 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                                {attachments.map((item, index) => (
                                    <div
                                        key={index}
                                        className="relative w-16 h-16 rounded-md overflow-hidden border border-slate-200 bg-white"
                                    >
                                        {item.type === 'image' ? (
                                            <Image
                                                src={item.preview}
                                                alt="Tệp đính kèm"
                                                fill
                                                unoptimized
                                                className="object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <FileVideo className="text-slate-400 w-5 h-5" />
                                            </div>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() =>
                                                removeAttachment(index)
                                            }
                                            className="absolute top-0 right-0 bg-red-500 text-white p-0.5 rounded-bl-md"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                                <label className="w-16 h-16 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-md cursor-pointer hover:bg-white hover:border-emerald-500 transition-all group">
                                    <Camera className="w-5 h-5 text-slate-400 group-hover:text-emerald-500" />
                                    <span className="text-[9px] text-slate-500 font-medium">
                                        Thêm file
                                    </span>
                                    <input
                                        type="file"
                                        multiple
                                        accept="image/*,video/*"
                                        className="hidden"
                                        onChange={handleFileChange}
                                    />
                                </label>
                            </div>
                        </div>
                    </form>
                </ScrollArea>

                {/* Footer actions */}
                <div className="shrink-0 px-5 py-4 border-t bg-white flex gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        className="flex-1 border-slate-200"
                        onClick={() => {
                            reset()
                            onOpenChange(false)
                        }}
                        disabled={createMutation.isPending}
                    >
                        Huỷ
                    </Button>
                    <Button
                        type="submit"
                        form="create-request-form"
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold"
                        disabled={createMutation.isPending}
                    >
                        {createMutation.isPending ? (
                            <>
                                <Loader2 className="size-4 mr-1.5 animate-spin" />
                                Đang gửi...
                            </>
                        ) : (
                            <>
                                <Radio className="size-4 mr-1.5" />
                                Gửi SOS
                            </>
                        )}
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    )
}

// ─── Main CitizenSidebar ───────────────────────────────────────────────────────
export function CitizenSidebar() {
    const { data, isLoading, isError, refetch, isFetching } =
        useCitizenRequestsQuery()
    const requests = data?.items ?? []

    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState<FilterStatus>('ALL')
    const [createOpen, setCreateOpen] = useState(false)
    const [selectedRequest, setSelectedRequest] =
        useState<RequestDetail | null>(null)

    // Resize logic
    const [sidebarWidth, setSidebarWidth] = useState(380)
    const isResizing = useRef(false)

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing.current) return
            let newWidth = e.clientX
            if (newWidth < 300) newWidth = 300
            if (newWidth > 600) newWidth = 600
            setSidebarWidth(newWidth)
        }
        const handleMouseUp = () => {
            if (isResizing.current) {
                isResizing.current = false
                document.body.style.cursor = 'default'
                // Trigger resize event so the map (Leaflet) re-centers/invalidates size
                setTimeout(() => window.dispatchEvent(new Event('resize')), 100)
            }
        }

        document.addEventListener('mousemove', handleMouseMove)
        document.addEventListener('mouseup', handleMouseUp)
        return () => {
            document.removeEventListener('mousemove', handleMouseMove)
            document.removeEventListener('mouseup', handleMouseUp)
        }
    }, [])

    const startResizing = (e: React.MouseEvent) => {
        e.preventDefault()
        isResizing.current = true
        document.body.style.cursor = 'col-resize'
    }

    const filtered = useMemo(() => {
        let list = requests
        if (statusFilter !== 'ALL') {
            list = list.filter(r => r.status === statusFilter)
        }
        if (search.trim()) {
            const lower = search.toLowerCase()
            list = list.filter(
                r =>
                    r.location?.address?.toLowerCase().includes(lower) ||
                    dictType[r.emergencyType]?.toLowerCase().includes(lower) ||
                    r.requestedBy?.fullName?.toLowerCase().includes(lower)
            )
        }
        return list
    }, [requests, statusFilter, search])

    const openDetail = (r: RequestDetail) => {
        setSelectedRequest(r)
        // Also fly the map to the request location
        if (r.location?.latitude && r.location?.longitude) {
            window.dispatchEvent(
                new CustomEvent('MOVE_MAP', {
                    detail: {
                        lat: r.location.latitude,
                        lng: r.location.longitude,
                    },
                })
            )
        }
    }

    return (
        <div className="relative h-full flex shrink-0" style={{ width: sidebarWidth }}>
            <Sidebar
                collapsible="none"
                className="w-full border-r border-slate-200 flex flex-col shrink-0 h-full relative"
            >
                {/* ── HEADER ── */}
                <SidebarHeader className="px-4 py-3 bg-white border-b border-slate-200 shrink-0">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-600 text-white shrink-0">
                                <Activity className="size-4 stroke-[2.5]" />
                            </div>
                            <span className="text-sm font-black text-slate-900">
                                Yêu cầu cứu trợ
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={() => refetch()}
                            disabled={isFetching}
                            className="flex size-7 items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                            title="Làm mới"
                        >
                            <RefreshCw
                                className={cn(
                                    'size-3.5',
                                    isFetching && 'animate-spin'
                                )}
                            />
                        </button>
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-400 pointer-events-none" />
                        <Input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Tìm địa chỉ, loại sự cố..."
                            className="h-8 pl-8 text-xs bg-slate-50 border-slate-200 rounded-lg focus-visible:ring-emerald-500"
                        />
                    </div>

                    {/* Status filter chips */}
                    <div className="flex flex-wrap gap-1 mt-2">
                        {STATUS_FILTERS.map(f => {
                            const count =
                                f.value === 'ALL'
                                    ? requests.length
                                    : requests.filter(r => r.status === f.value)
                                          .length
                            return (
                                <button
                                    key={f.value}
                                    type="button"
                                    onClick={() => setStatusFilter(f.value)}
                                    className={cn(
                                        'px-2 py-0.5 rounded-full text-[10px] font-bold transition-all border',
                                        statusFilter === f.value
                                            ? 'bg-emerald-600 text-white border-emerald-600'
                                            : 'bg-white text-slate-500 border-slate-200 hover:border-emerald-300 hover:text-emerald-700'
                                    )}
                                >
                                    {f.label}
                                    {count > 0 && (
                                        <span className="ml-1 opacity-70">
                                            ({count})
                                        </span>
                                    )}
                                </button>
                            )
                        })}
                    </div>
                </SidebarHeader>

                <SidebarSeparator />

                {/* ── CONTENT ── */}
                <SidebarContent className="flex-1 overflow-hidden p-0">
                    <ScrollArea className="h-full">
                        <div className="flex flex-col gap-2 p-3">
                            {isLoading && (
                                <>
                                    {Array.from({ length: 4 }).map((_, i) => (
                                        <div
                                            key={i}
                                            className="flex flex-col gap-2 p-3 rounded-lg border border-slate-100"
                                        >
                                            <Skeleton className="h-3 w-28" />
                                            <Skeleton className="h-3 w-full" />
                                            <Skeleton className="h-3 w-20" />
                                        </div>
                                    ))}
                                </>
                            )}

                            {isError && (
                                <div className="flex flex-col items-center gap-2 py-10 text-slate-400">
                                    <XCircle className="size-8 text-red-300" />
                                    <p className="text-xs text-center">
                                        Không thể tải yêu cầu.
                                        <br />
                                        Vui lòng thử lại.
                                    </p>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => refetch()}
                                        className="h-7 text-xs"
                                    >
                                        Thử lại
                                    </Button>
                                </div>
                            )}

                            {!isLoading &&
                                !isError &&
                                filtered.length === 0 && (
                                    <div className="flex flex-col items-center gap-2 py-10 text-slate-400">
                                        <Filter className="size-8 text-slate-200" />
                                        <p className="text-xs text-center">
                                            {search || statusFilter !== 'ALL'
                                                ? 'Không tìm thấy yêu cầu phù hợp.'
                                                : 'Chưa có yêu cầu cứu trợ nào.'}
                                        </p>
                                    </div>
                                )}

                            {!isLoading &&
                                filtered.map(request => (
                                    <RequestCard
                                        key={request.id}
                                        request={request}
                                        onClick={() => openDetail(request)}
                                    />
                                ))}
                        </div>
                    </ScrollArea>
                </SidebarContent>

                {/* ── FOOTER ── */}
                <SidebarFooter className="p-3 border-t border-slate-200 bg-white shrink-0">
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton
                                onClick={() => setCreateOpen(true)}
                                className="h-10 w-full bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg justify-center gap-2 cursor-pointer"
                            >
                                <Plus className="size-4" />
                                <span>Tạo yêu cầu cứu trợ mới</span>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>

                    {/* Summary */}
                    <div className="flex items-center justify-center gap-3 mt-2 text-[10px] text-slate-400 font-mono">
                        <span>
                            {
                                requests.filter(r => r.status === 'PENDING')
                                    .length
                            }{' '}
                            chờ xử lý
                        </span>
                        <span>·</span>
                        <span>
                            {
                                requests.filter(r => r.status === 'IN_PROGRESS')
                                    .length
                            }{' '}
                            đang ứng cứu
                        </span>
                    </div>
                </SidebarFooter>

                <SidebarRail />
            </Sidebar>

            {/* Resize Handle */}
            <div
                className="absolute top-0 -right-0.5 w-1.5 h-full cursor-col-resize hover:bg-emerald-500/50 transition-colors z-50"
                onMouseDown={startResizing}
            />

            {/* Create Request Sheet */}
            <CreateRequestSheet
                open={createOpen}
                onOpenChange={setCreateOpen}
            />

            {/* Request Detail Dialog */}
            <CitizenRequestDetailDialog
                request={selectedRequest}
                open={selectedRequest !== null}
                onOpenChange={v => {
                    if (!v) setSelectedRequest(null)
                }}
            />
        </div>
    )
}
