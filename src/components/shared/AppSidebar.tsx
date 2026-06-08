'use client'

import { useEffect, useRef, useState } from 'react'

import {
    AlertCircle,
    Camera,
    CheckCircle2,
    Clock,
    FileVideo,
    Info,
    Loader2,
    LocateFixed,
    MapPin,
    MapPinned,
    Send,
    X,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
} from '@/components/ui/sidebar'
import { Textarea } from '@/components/ui/textarea'
import Image from 'next/image'

import { dictPriority, dictType } from '@/constants/dictionary'
import {
    type CitizenRequestSubmissionInput,
    EMERGENCY_TYPE_OPTIONS,
    PRIORITY_OPTIONS,
    useCreateCitizenRequestMutation,
} from '@/lib/api/features/requests/citizen.queries'
import CitizenRequestDetailDialog from '@/components/dashboards/citizen/CitizenRequestDetailDialog'

import { OsmAddressResult, RequestDetail } from '@/types/request'
import { getApiErrorMessage } from '@/lib/api/client'
import { toast } from 'sonner'

export function AppSidebar({ requests }: { requests: RequestDetail[] }) {
    const createRequestMutation = useCreateCitizenRequestMutation()

    const [isDialogOpen, setIsDialogOpen] = useState(false)

    // Form state — numeric enums matching backend
    const [emergencyType, setEmergencyType] = useState<number>(1)
    const [priority, setPriority] = useState<number>(1)
    const [description, setDescription] = useState('')
    const [addressInput, setAddressInput] = useState('')
    const [landmarkInput, setLandmarkInput] = useState('')
    const [gpsStatus, setGpsStatus] = useState<
        'idle' | 'loading' | 'success' | 'error'
    >('idle')
    const [gpsCoords, setGpsCoords] = useState<{
        lat: number
        lng: number
    } | null>(null)
    const [addressResults, setAddressResults] = useState<OsmAddressResult[]>([])
    const [isSearchingAddress, setIsSearchingAddress] = useState(false)
    const [showAddressDropdown, setShowAddressDropdown] = useState(false)

    const skipAddressSearch = useRef(false)

    const [attachments, setAttachments] = useState<
        { file: File; preview: string; type: string }[]
    >([])

    const resetForm = () => {
        setEmergencyType(1)
        setPriority(1)
        setDescription('')
        setAddressInput('')
        setLandmarkInput('')
        setGpsCoords(null)
        setGpsStatus('idle')
        setAttachments([])
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!gpsCoords) {
            toast.error('Vui lòng lấy tọa độ GPS trước khi gửi!')
            return
        }

        if (!description.trim()) {
            toast.error('Vui lòng mô tả tình trạng sự cố!')
            return
        }

        const payload: CitizenRequestSubmissionInput = {
            emergencyType,
            priority,
            description,
            address: addressInput || 'Chưa có địa chỉ',
            latitude: gpsCoords.lat,
            longitude: gpsCoords.lng,
            landmark: landmarkInput || undefined,
            medias:
                attachments.length > 0
                    ? attachments.map(item => item.file)
                    : undefined,
        }

        try {
            await createRequestMutation.mutateAsync(payload)
            toast.success('Đã gửi yêu cầu cứu trợ thành công!', {
                description: 'Đội cứu hộ sẽ tiếp nhận và xử lý ngay.',
            })
            setIsDialogOpen(false)
            resetForm()
        } catch (error) {
            toast.error('Không thể gửi yêu cầu', {
                description: getApiErrorMessage(error),
            })
        }
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

    const handleGetLocation = () => {
        setGpsStatus('loading')
        if (!navigator.geolocation) {
            setGpsStatus('error')
            toast.error('Trình duyệt không hỗ trợ định vị GPS')
            return
        }
        navigator.geolocation.getCurrentPosition(
            pos => {
                setGpsStatus('success')
                setGpsCoords({
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude,
                })
                setTimeout(() => setGpsStatus('idle'), 3000)
            },
            () => {
                setGpsStatus('error')
                toast.error(
                    'Không thể lấy vị trí. Hãy cho phép quyền truy cập vị trí.'
                )
                setTimeout(() => setGpsStatus('idle'), 3000)
            },
            { enableHighAccuracy: true, timeout: 5000 }
        )
    }

    // Address autocomplete
    useEffect(() => {
        if (!addressInput.trim()) {
            setAddressResults([])
            setShowAddressDropdown(false)
            return
        }

        if (skipAddressSearch.current) {
            skipAddressSearch.current = false
            return
        }

        const delayFn = setTimeout(async () => {
            setIsSearchingAddress(true)
            try {
                const res = await fetch(
                    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressInput)}&limit=4&countrycodes=vn`
                )
                const data = await res.json()
                setAddressResults(data)
                setShowAddressDropdown(true)
            } catch (error) {
                console.error('Lỗi tìm địa chỉ form:', error)
            } finally {
                setIsSearchingAddress(false)
            }
        }, 600)

        return () => clearTimeout(delayFn)
    }, [addressInput])

    const handleSelectAddress = (result: OsmAddressResult) => {
        skipAddressSearch.current = true
        setAddressInput(result.display_name)
        setShowAddressDropdown(false)

        // Auto-fill GPS from selected address
        const lat = parseFloat(result.lat)
        const lng = parseFloat(result.lon)
        if (!isNaN(lat) && !isNaN(lng)) {
            setGpsCoords({ lat, lng })
            setGpsStatus('success')
            setTimeout(() => setGpsStatus('idle'), 3000)
        }
    }

    const selectedEmergencyLabel =
        EMERGENCY_TYPE_OPTIONS.find(opt => opt.value === emergencyType)
            ?.label ?? ''
    const selectedPriority = PRIORITY_OPTIONS.find(
        opt => opt.value === priority
    )

    return (
        <Sidebar className="bg-white">
            <SidebarHeader className="h-16 border-0" />
            <SidebarContent className="flex-1 overflow-y-auto bg-slate-50/50 p-4 space-y-3">
                {requests.map(requestItem => (
                    <div
                        key={requestItem.id}
                        className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all group"
                    >
                        <div className="flex items-start justify-between mb-2">
                            <div className="flex flex-col">
                                <span className="font-extrabold text-slate-900 text-sm group-hover:text-[#003da5] transition-colors">
                                    {dictType[requestItem.emergencyType] ||
                                        requestItem.emergencyType}
                                </span>
                                <span
                                    className="text-[9px] text-slate-400 font-mono mt-0.5"
                                    title={requestItem.id}
                                >
                                    ID-{requestItem.id.substring(0, 4)}...
                                </span>
                            </div>
                            <span
                                className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider ${
                                    requestItem.priority === 'CRITICAL'
                                        ? 'bg-red-100 text-red-700'
                                        : requestItem.priority === 'HIGH'
                                          ? 'bg-orange-100 text-orange-700'
                                          : requestItem.priority === 'MEDIUM'
                                            ? 'bg-blue-100 text-blue-700'
                                            : 'bg-green-100 text-green-700'
                                }`}
                            >
                                {dictPriority[requestItem.priority]}
                            </span>
                        </div>

                        <div className="space-y-1.5 mt-3 mb-3">
                            <div className="flex items-start gap-2 text-xs text-slate-600">
                                <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                                <span className="line-clamp-2 leading-snug">
                                    {requestItem.location.address}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-slate-400">
                                <Clock className="w-3 h-3" />
                                {new Date(
                                    requestItem.submittedTime
                                ).toLocaleString('vi-VN')}
                            </div>
                        </div>

                        <CitizenRequestDetailDialog request={requestItem}>
                            <Button
                                variant="ghost"
                                className="w-full mt-2 h-9 text-[11px] font-bold uppercase tracking-wider text-blue-600 hover:text-blue-700 hover:bg-blue-50/50 border border-dashed border-blue-200 hover:border-blue-300 rounded-lg transition-all duration-200 group/btn cursor-pointer"
                            >
                                <div className="flex items-center justify-center gap-2 ">
                                    <Info className="w-3.5 h-3.5 transition-transform group-hover/btn:rotate-12" />
                                    Xem chi tiết báo cáo
                                </div>
                            </Button>
                        </CitizenRequestDetailDialog>
                    </div>
                ))}
            </SidebarContent>

            <SidebarFooter className="p-4 mb-4">
                <Dialog
                    open={isDialogOpen}
                    onOpenChange={open => {
                        setIsDialogOpen(open)
                        if (!open) resetForm()
                    }}
                >
                    <DialogTrigger asChild>
                        <Button className="w-full bg-[#003da5] hover:bg-blue-900 active:bg-blue-950 active:scale-95 text-white font-semibold py-6 rounded-xl shadow-md hover:shadow-lg active:shadow-sm text-base transition-all cursor-pointer duration-200">
                            Gửi yêu cầu cứu trợ
                        </Button>
                    </DialogTrigger>

                    <DialogContent className="sm:max-w-2xl bg-white rounded-2xl overflow-visible max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <div className="flex items-center gap-2">
                                <span className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
                                </span>
                                <span className="bg-red-500 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                                    Khẩn cấp
                                </span>
                            </div>
                            <DialogTitle className="text-2xl font-extrabold mt-2 text-slate-900">
                                Gửi Yêu Cầu Cứu Trợ
                            </DialogTitle>
                            <DialogDescription className="text-slate-500">
                                Điền thông tin chính xác để đội cứu hộ tiếp cận
                                nhanh nhất.
                            </DialogDescription>
                        </DialogHeader>

                        <form
                            className="space-y-5 mt-4"
                            onSubmit={handleSubmit}
                        >
                            {/* === LOẠI SỰ CỐ === */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-800 mb-2">
                                    Loại sự cố *
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    {EMERGENCY_TYPE_OPTIONS.map(option => (
                                        <button
                                            type="button"
                                            key={option.value}
                                            onClick={() =>
                                                setEmergencyType(option.value)
                                            }
                                            className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-xl border-2 text-xs font-semibold transition-all duration-150 cursor-pointer ${
                                                emergencyType === option.value
                                                    ? 'border-[#003da5] bg-blue-50 text-[#003da5] shadow-sm ring-1 ring-blue-200'
                                                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                                            }`}
                                        >
                                            <span className="text-base leading-none">
                                                {option.label.split(' ')[0]}
                                            </span>
                                            <span className="text-[10px] text-center leading-tight">
                                                {option.label
                                                    .split(' ')
                                                    .slice(1)
                                                    .join(' ')}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* === MỨC ĐỘ ƯU TIÊN === */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-800 mb-2">
                                    Mức độ ưu tiên *
                                </label>
                                <Select
                                    value={String(priority)}
                                    onValueChange={value =>
                                        setPriority(Number(value))
                                    }
                                >
                                    <SelectTrigger
                                        className={`border-2 font-semibold transition-colors ${
                                            selectedPriority
                                                ? `${selectedPriority.color} ${selectedPriority.bg}`
                                                : 'bg-slate-50 border-slate-200'
                                        }`}
                                    >
                                        <SelectValue placeholder="-- Chọn mức độ --" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {PRIORITY_OPTIONS.map(option => (
                                            <SelectItem
                                                key={option.value}
                                                value={String(option.value)}
                                                className={`${option.color} font-bold`}
                                            >
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* === VỊ TRÍ SỰ CỐ === */}
                            <div className="bg-slate-50 px-4 py-3 rounded-xl border border-slate-200 space-y-4">
                                <div className="flex items-center gap-2 text-slate-800 font-semibold mb-1">
                                    <MapPinned className="w-5 h-5 text-[#003da5]" />
                                    Thông tin vị trí sự cố
                                </div>

                                {/* GPS Button */}
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wider">
                                        1. Tọa độ bản đồ
                                    </label>
                                    <div className="flex items-center gap-3">
                                        <Button
                                            type="button"
                                            onClick={handleGetLocation}
                                            disabled={gpsStatus === 'loading'}
                                            className={`transition-all duration-200 active:scale-95 h-10 w-36 cursor-pointer ${
                                                gpsStatus === 'success'
                                                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                                    : gpsStatus === 'error'
                                                      ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                                      : 'bg-[#003da5] text-white hover:bg-blue-800'
                                            }`}
                                        >
                                            {gpsStatus === 'idle' && (
                                                <>
                                                    <LocateFixed className="w-4 h-4 mr-2" />{' '}
                                                    Lấy GPS
                                                </>
                                            )}
                                            {gpsStatus === 'loading' && (
                                                <span className="animate-pulse text-xs">
                                                    Đang dò tìm...
                                                </span>
                                            )}
                                            {gpsStatus === 'success' && (
                                                <>
                                                    <CheckCircle2 className="w-4 h-4 mr-2" />{' '}
                                                    Đã xác định
                                                </>
                                            )}
                                            {gpsStatus === 'error' && (
                                                <>
                                                    <AlertCircle className="w-4 h-4 mr-2" />{' '}
                                                    Lỗi định vị
                                                </>
                                            )}
                                        </Button>
                                        {gpsCoords && (
                                            <div className="text-sm font-mono text-green-700 bg-white px-3 py-2 rounded-lg border border-green-100 flex-1 text-center shadow-sm">
                                                {gpsCoords.lat.toFixed(5)},{' '}
                                                {gpsCoords.lng.toFixed(5)}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Address + Landmark */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-50">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wider">
                                            2. Địa chỉ cụ thể
                                        </label>
                                        <div className="relative">
                                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                            <Input
                                                className="pl-9 bg-white border-slate-200"
                                                placeholder="Số nhà, tên đường..."
                                                value={addressInput}
                                                onChange={e => {
                                                    setAddressInput(
                                                        e.target.value
                                                    )
                                                    setShowAddressDropdown(true)
                                                }}
                                            />
                                            {isSearchingAddress && (
                                                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-blue-500" />
                                            )}
                                        </div>
                                        {showAddressDropdown &&
                                            addressResults.length > 0 && (
                                                <div className="absolute top-[60px] left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-[60]">
                                                    {addressResults.map(
                                                        (
                                                            item: OsmAddressResult,
                                                            index: number
                                                        ) => (
                                                            <button
                                                                type="button"
                                                                key={
                                                                    item.place_id ||
                                                                    index
                                                                }
                                                                onClick={() =>
                                                                    handleSelectAddress(
                                                                        item
                                                                    )
                                                                }
                                                                className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 border-b border-slate-100 last:border-none transition-colors truncate"
                                                            >
                                                                {
                                                                    item.display_name
                                                                }
                                                            </button>
                                                        )
                                                    )}
                                                </div>
                                            )}
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wider">
                                            3. Mốc nhận diện (Landmark)
                                        </label>
                                        <Input
                                            className="bg-white border-slate-200"
                                            placeholder="Ví dụ: Gần trường học, ngã tư..."
                                            value={landmarkInput}
                                            onChange={e =>
                                                setLandmarkInput(e.target.value)
                                            }
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* === MÔ TẢ === */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-800 mb-1">
                                    Mô tả tình trạng chi tiết *
                                </label>
                                <Textarea
                                    className="bg-slate-50 border-slate-200 min-h-[80px]"
                                    placeholder="Mô tả chi tiết tình trạng: nước ngập đến đâu, có bao nhiêu người cần cứu, tình trạng sức khoẻ..."
                                    value={description}
                                    onChange={e =>
                                        setDescription(e.target.value)
                                    }
                                />
                            </div>

                            {/* === ĐÍNH KÈM === */}
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-slate-800">
                                    Đính kèm minh chứng (Ảnh/Video)
                                </label>
                                <div className="flex flex-wrap gap-2 p-2 bg-slate-50 rounded-lg border border-dashed border-slate-300">
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
                                    <label className="w-16 h-16 flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-md cursor-pointer hover:bg-white hover:border-[#003da5] transition-all group">
                                        <Camera className="w-5 h-5 text-slate-400 group-hover:text-[#003da5]" />
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

                            {/* === SUBMIT === */}
                            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                                <div className="text-xs text-slate-400">
                                    {selectedEmergencyLabel && (
                                        <span className="inline-flex items-center gap-1">
                                            {selectedEmergencyLabel}
                                            {selectedPriority && (
                                                <span
                                                    className={`font-bold ${selectedPriority.color}`}
                                                >
                                                    • {selectedPriority.label}
                                                </span>
                                            )}
                                        </span>
                                    )}
                                </div>
                                <Button
                                    type="submit"
                                    disabled={
                                        createRequestMutation.isPending ||
                                        !gpsCoords ||
                                        !description.trim()
                                    }
                                    className="bg-[#003da5] hover:bg-blue-800 active:bg-blue-900 active:scale-95 text-white px-8 h-12 text-md font-bold shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {createRequestMutation.isPending ? (
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    ) : null}
                                    GỬI CỨU TRỢ{' '}
                                    <Send className="w-4 h-4 ml-2" />
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </SidebarFooter>
        </Sidebar>
    )
}
