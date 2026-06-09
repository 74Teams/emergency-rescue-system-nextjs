'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { getApiErrorMessage } from '@/lib/api/client'
import { useCreateCitizenRequestMutation } from '@/lib/api/features/requests/citizen.queries'
import type { EmergencyCategory, RequestPriority } from '@/types/request'

import {
    ArrowLeft,
    Loader2,
    LocateFixed,
    MapPin,
    Paperclip,
    Send,
    Trash2,
    UploadCloud,
    AlertTriangle,
    Activity,
    CheckCircle,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'

const emergencyCategoryToApiValue: Record<EmergencyCategory, number> = {
    FIRE: 1,
    FLOOD: 2,
    EARTHQUAKE: 3,
    MEDICAL: 4,
    TRAFFIC: 5,
    COLLAPSE: 6,
    LANDSLIDE: 7,
    OTHER: 8,
}
const priorityToApiValue: Record<RequestPriority, number> = {
    CRITICAL: 1,
    HIGH: 2,
    MEDIUM: 3,
    LOW: 4,
}

export default function SubmitRequestPage() {
    const createRequestMutation = useCreateCitizenRequestMutation()

    const [emergencyType, setEmergencyType] =
        useState<EmergencyCategory>('FLOOD')
    const [priority, setPriority] = useState<RequestPriority>('CRITICAL')
    const [address, setAddress] = useState('')
    const [landmark, setLandmark] = useState('')
    const [description, setDescription] = useState('')
    const [phoneNumber, setPhoneNumber] = useState('')
    const [phoneError, setPhoneError] = useState('')
    const [coords, setCoords] = useState('')
    const [isLocating, setIsLocating] = useState(false)

    const [suggestions, setSuggestions] = useState<
        { display_name: string; lat: string; lon: string }[]
    >([])
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)
    const [showSuggestions, setShowSuggestions] = useState(false)
    const suggestionContainerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                suggestionContainerRef.current &&
                !suggestionContainerRef.current.contains(event.target as Node)
            ) {
                setShowSuggestions(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () =>
            document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    useEffect(() => {
        if (!address.trim() || address.length < 3 || !showSuggestions) {
            setSuggestions([])
            return
        }

        const timer = setTimeout(async () => {
            setIsLoadingSuggestions(true)
            try {
                const res = await fetch(
                    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=5&countrycodes=vn`
                )
                if (res.ok) {
                    const data = await res.json()
                    setSuggestions(data)
                }
            } catch (error) {
                console.error('Error fetching suggestions:', error)
            } finally {
                setIsLoadingSuggestions(false)
            }
        }, 600)

        return () => clearTimeout(timer)
    }, [address, showSuggestions])

    const handleSelectSuggestion = (item: {
        display_name: string
        lat: string
        lon: string
    }) => {
        setShowSuggestions(false)
        setAddress(item.display_name)
        setCoords(
            `${parseFloat(item.lat).toFixed(5)}, ${parseFloat(item.lon).toFixed(5)}`
        )
        setSuggestions([])
        toast.success('Đã điền địa chỉ và tọa độ GPS.')
    }
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
            position => {
                setCoords(
                    `${position.coords.latitude.toFixed(5)}, ${position.coords.longitude.toFixed(5)}`
                )
                setIsLocating(false)
                toast.success('Đã lấy tọa độ hiện tại.')
            },
            () => {
                setIsLocating(false)
                toast.error('Không thể lấy vị trí hiện tại.')
            },
            { enableHighAccuracy: true, timeout: 8000 }
        )
    }

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!event.target.files?.length) return

        const nextFiles = Array.from(event.target.files).map(file => ({
            file,
            preview: URL.createObjectURL(file),
            type: file.type.startsWith('video') ? 'video' : 'image',
        }))

        setAttachments(prev => [...prev, ...nextFiles])
        event.target.value = ''
    }

    const removeAttachment = (index: number) => {
        setAttachments(prev =>
            prev.filter((_, attachmentIndex) => attachmentIndex !== index)
        )
    }

    const coordsValue = useMemo(() => coords.trim(), [coords])

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault()

        if (!phoneNumber.trim()) {
            toast.error('Vui lòng nhập số điện thoại liên hệ.')
            return
        }
        if (phoneError || !/^\d{10,11}$/.test(phoneNumber.trim())) {
            toast.error('Số điện thoại không hợp lệ. Vui lòng kiểm tra lại.')
            return
        }

        let latitude = 0
        let longitude = 0
        let finalAddress = address.trim()

        if (coordsValue) {
            const parts = coordsValue.split(',')
            latitude = parseFloat(parts[0].trim())
            longitude = parseFloat(parts[1].trim())
            
            if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
                toast.error('Tọa độ hiện tại không hợp lệ.')
                return
            }

            if (!finalAddress) {
                const loadingToast = toast.loading('Đang tự động lấy địa chỉ từ tọa độ...')
                try {
                    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`)
                    const data = await res.json()
                    if (data && data.display_name) {
                        finalAddress = data.display_name
                        setAddress(data.display_name)
                    }
                    toast.dismiss(loadingToast)
                } catch (error) {
                    toast.dismiss(loadingToast)
                    console.error('Lỗi khi lấy địa chỉ:', error)
                }
            }
        } else {
            if (!finalAddress) {
                toast.error('Vui lòng nhập địa chỉ sự cố.')
                return
            }
            
            const loadingToast = toast.loading('Đang tự động lấy tọa độ từ địa chỉ...')
            try {
                const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(finalAddress)}&format=json&limit=1&countrycodes=vn`)
                const data = await res.json()
                if (data && data.length > 0) {
                    latitude = parseFloat(data[0].lat)
                    longitude = parseFloat(data[0].lon)
                    toast.dismiss(loadingToast)
                } else {
                    toast.dismiss(loadingToast)
                    toast.error('Không thể tự động tìm tọa độ từ địa chỉ này. Vui lòng bấm "Lấy vị trí hiện tại".')
                    return
                }
            } catch (error) {
                toast.dismiss(loadingToast)
                toast.error('Lỗi khi định vị địa chỉ.')
                return
            }
        }

        if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
            toast.error('Tọa độ không hợp lệ.')
            return
        }

        try {
            await createRequestMutation.mutateAsync({
                emergencyType: emergencyCategoryToApiValue[emergencyType],
                priority: priorityToApiValue[priority],
                description: description,
                phoneNumber: phoneNumber.trim(),
                address: finalAddress || 'Chưa có địa chỉ',
                latitude,
                longitude,
                landmark: landmark || undefined,
                medias: attachments.map(item => item.file),
            })

            toast.success('Đã gửi yêu cầu cứu trợ.')
            setEmergencyType('FLOOD')
            setPriority('CRITICAL')
            setAddress('')
            setPhoneNumber('')
            setLandmark('')
            setDescription('')
            setCoords('')
            setAttachments([])
        } catch (error) {
            toast.error('Không thể gửi yêu cầu', {
                description: getApiErrorMessage(error),
            })
        }
    }

    return (
        <div className="p-3 sm:p-4 md:p-8 h-full overflow-y-auto bg-white">
            <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-6 md:gap-10">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                        <span className="bg-orange-500 text-white text-[10px] sm:text-xs font-bold px-2.5 sm:px-3 py-1 rounded-full uppercase tracking-wider shadow-sm shrink-0">
                            * Cấp bách
                        </span>
                        <Link
                            href="/map"
                            className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors bg-blue-50 hover:bg-blue-100 px-2.5 sm:px-3 py-1.5 rounded-lg shrink-0"
                        >
                            <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            Quay lại bản đồ
                        </Link>
                    </div>
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold mt-3 sm:mt-4 mb-1.5 sm:mb-2 text-slate-900 tracking-tight">
                        Gửi Yêu Cầu Cứu Trợ
                    </h1>
                    <p className="text-sm sm:text-base text-slate-500 mb-5 sm:mb-8">
                        Cung cấp thông tin chính xác để đội cứu hộ tiếp cận bạn
                        nhanh nhất.
                    </p>

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-800 mb-2">
                                    Loại sự cố *
                                </label>
                                <Select
                                    value={emergencyType}
                                    onValueChange={value =>
                                        setEmergencyType(
                                            value as EmergencyCategory
                                        )
                                    }
                                >
                                    <SelectTrigger className="bg-slate-50 border-slate-200 h-12 rounded-xl">
                                        <SelectValue placeholder="Chọn loại sự cố" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            <SelectItem value="FIRE">
                                                Hỏa hoạn / Cháy nổ
                                            </SelectItem>
                                            <SelectItem value="FLOOD">
                                                Ngập lụt / Lũ quét
                                            </SelectItem>
                                            <SelectItem value="EARTHQUAKE">
                                                Động đất
                                            </SelectItem>
                                            <SelectItem value="MEDICAL">
                                                Cấp cứu y tế
                                            </SelectItem>
                                            <SelectItem value="TRAFFIC">
                                                Tai nạn giao thông
                                            </SelectItem>
                                            <SelectItem value="COLLAPSE">
                                                Sập công trình
                                            </SelectItem>
                                            <SelectItem value="LANDSLIDE">
                                                Sạt lở / Thiên tai
                                            </SelectItem>
                                            <SelectItem value="OTHER">
                                                Khác
                                            </SelectItem>
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-800 mb-2">
                                    Mức độ ưu tiên *
                                </label>
                                <Select
                                    value={priority}
                                    onValueChange={value =>
                                        setPriority(value as RequestPriority)
                                    }
                                >
                                    <SelectTrigger className="bg-slate-50 border-slate-200 h-12 rounded-xl">
                                        <SelectValue placeholder="Chọn mức độ" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="CRITICAL">
                                            <div className="flex items-center gap-2 text-red-600 font-bold"><AlertTriangle className="w-4 h-4"/> Cực kỳ khẩn cấp</div>
                                        </SelectItem>
                                        <SelectItem value="HIGH">
                                            <div className="flex items-center gap-2 text-orange-600 font-bold"><AlertTriangle className="w-4 h-4"/> Nguy hiểm cao</div>
                                        </SelectItem>
                                        <SelectItem value="MEDIUM">
                                            <div className="flex items-center gap-2 text-blue-600 font-bold"><Activity className="w-4 h-4"/> Trung bình</div>
                                        </SelectItem>
                                        <SelectItem value="LOW">
                                            <div className="flex items-center gap-2 text-slate-600 font-bold"><Activity className="w-4 h-4"/> Thấp</div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-800 mb-2">
                                    Địa chỉ *
                                </label>
                                <div
                                    ref={suggestionContainerRef}
                                    className="relative"
                                >
                                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                    <Input
                                        className="pl-10 bg-slate-50 border-slate-200 h-12 text-md rounded-xl"
                                        placeholder="Số nhà, tên đường, phường/xã..."
                                        value={address}
                                        onChange={event => {
                                            setAddress(event.target.value)
                                            setShowSuggestions(true)
                                        }}
                                        onFocus={() => setShowSuggestions(true)}
                                    />
                                    {showSuggestions &&
                                        (isLoadingSuggestions ||
                                            suggestions.length > 0) && (
                                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden max-h-[250px] overflow-y-auto z-50 animate-in fade-in slide-in-from-top-1">
                                                {isLoadingSuggestions && (
                                                    <div className="px-4 py-3 text-sm text-slate-500 flex items-center gap-2">
                                                        <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                                                        Đang tìm kiếm địa điểm...
                                                    </div>
                                                )}
                                                {!isLoadingSuggestions &&
                                                    suggestions.map((item, idx) => (
                                                        <div
                                                            key={idx}
                                                            onClick={() =>
                                                                handleSelectSuggestion(
                                                                    item
                                                                )
                                                            }
                                                            className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-slate-50 last:border-none transition-colors cursor-pointer flex items-start gap-2"
                                                        >
                                                            <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                                                            <span className="text-sm text-slate-700 font-medium line-clamp-2">
                                                                {item.display_name}
                                                            </span>
                                                        </div>
                                                    ))}
                                            </div>
                                        )}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-800 mb-2">
                                    Xác định vị trí tự động
                                </label>
                                <Button
                                    type="button"
                                    variant={coordsValue ? "outline" : "secondary"}
                                    onClick={handleGetLocation}
                                    disabled={isLocating}
                                    className={`h-12 rounded-xl font-semibold w-fit transition-all duration-300 ${
                                        isLocating ? "bg-blue-100 text-blue-600" : 
                                        coordsValue ? "bg-emerald-50 text-emerald-600 border-emerald-200" : 
                                        "bg-slate-100 hover:bg-slate-200 text-[#003da5]"
                                    }`}
                                >
                                    {isLocating ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : coordsValue ? <CheckCircle className="w-5 h-5 mr-2" /> : <LocateFixed className="w-5 h-5 mr-2" />}
                                    {isLocating ? 'Đang định vị...' : coordsValue ? 'Lấy lại vị trí' : 'Lấy vị trí hiện tại'}
                                </Button>
                                {coordsValue && !isLocating && (
                                    <p className="text-xs text-emerald-600 font-medium mt-2 flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
                                        <MapPin className="w-3 h-3" /> Đã lấy tọa độ thành công
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-800 mb-2">
                                    Số điện thoại liên hệ *
                                </label>
                                <Input
                                    className={`bg-slate-50 h-12 rounded-xl ${phoneError ? 'border-red-500 focus-visible:ring-red-500' : 'border-slate-200'}`}
                                    placeholder="Ví dụ: 0906711211"
                                    type="tel"
                                    value={phoneNumber}
                                    onChange={event => {
                                        const val = event.target.value;
                                        setPhoneNumber(val);
                                        if (val && !/^\d+$/.test(val)) {
                                            setPhoneError('Vui lòng chỉ nhập số');
                                        } else if (val && (val.length < 10 || val.length > 11)) {
                                            setPhoneError('Số điện thoại không hợp lệ (10-11 số)');
                                        } else {
                                            setPhoneError('');
                                        }
                                    }}
                                />
                                {phoneError && (
                                    <p className="text-red-500 text-xs mt-1.5 font-medium">{phoneError}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-800 mb-2">
                                    Mốc nhận diện
                                </label>
                                <Input
                                    className="bg-slate-50 border-slate-200 h-12 rounded-xl"
                                    placeholder="Ví dụ: Gần trường học, ngã tư..."
                                    value={landmark}
                                    onChange={event =>
                                        setLandmark(event.target.value)
                                    }
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-800 mb-2">
                                Mô tả tình trạng *
                            </label>
                            <Textarea
                                className="bg-slate-50 border-slate-200 min-h-[120px] rounded-xl text-md p-4"
                                placeholder="Ví dụ: 0906711211 - Đang bị cô lập do nước dâng cao, cần lương thực và nước uống cho 3 người..."
                                value={description}
                                onChange={event =>
                                    setDescription(event.target.value)
                                }
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-slate-800">
                                Đính kèm minh chứng
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
                                                <Paperclip className="text-slate-400 w-5 h-5" />
                                            </div>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() =>
                                                removeAttachment(index)
                                            }
                                            className="absolute top-0 right-0 bg-red-500 text-white p-0.5 rounded-bl-md"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                                <label className="w-16 h-16 flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-md cursor-pointer hover:bg-white hover:border-[#003da5] transition-all group">
                                    <UploadCloud className="w-5 h-5 text-slate-400 group-hover:text-[#003da5]" />
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

                        <Button
                            type="submit"
                            disabled={createRequestMutation.isPending}
                            className="w-full bg-[#003da5] hover:bg-blue-800 text-white h-12 sm:h-14 px-6 sm:px-8 text-base sm:text-lg font-bold rounded-xl shadow-lg transition-all hover:scale-[1.02]"
                        >
                            {createRequestMutation.isPending ? (
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            ) : null}
                            Gửi Yêu Cầu
                            <Send className="w-5 h-5 ml-2" />
                        </Button>
                    </form>
                </div>

                <div className="w-full lg:w-[350px] shrink-0 space-y-4 sm:space-y-6">
                    <div className="bg-[#f0f7ff] rounded-2xl p-4 sm:p-6 border border-blue-100">
                        <div className="flex items-center gap-2 text-[#003da5] font-bold mb-3 sm:mb-4 text-base sm:text-lg">
                            <UploadCloud className="w-5 h-5 sm:w-6 sm:h-6" />
                            <span>Lưu ý quan trọng</span>
                        </div>
                        <ul className="space-y-3 sm:space-y-4 text-sm text-blue-900">
                            <li className="flex gap-3">
                                <span className="bg-blue-200 text-[#003da5] font-bold rounded-full w-6 h-6 flex items-center justify-center shrink-0 text-sm">
                                    1
                                </span>
                                Giữ điện thoại luôn bật và đảm bảo có sóng.
                            </li>
                            <li className="flex gap-3">
                                <span className="bg-blue-200 text-[#003da5] font-bold rounded-full w-6 h-6 flex items-center justify-center shrink-0 text-sm">
                                    2
                                </span>
                                Nếu có thể, hãy di chuyển lên vị trí cao hơn.
                            </li>
                            <li className="flex gap-3">
                                <span className="bg-blue-200 text-[#003da5] font-bold rounded-full w-6 h-6 flex items-center justify-center shrink-0 text-sm">
                                    3
                                </span>
                                Sử dụng đèn pin hoặc vải màu sáng để làm tín hiệu.
                            </li>
                        </ul>
                    </div>
                    <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-100 shadow-sm">
                        <h3 className="font-bold text-slate-800 mb-3 sm:mb-4 flex items-center justify-between text-base sm:text-lg">
                            Đường dây nóng
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                            </span>
                        </h3>
                        <div className="space-y-3 text-sm sm:text-base">
                            <div className="flex justify-between border-b border-slate-100 pb-2">
                                <span className="text-slate-500 font-medium">Cứu hỏa</span>
                                <span className="font-bold text-red-600">114</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-100 pb-2">
                                <span className="text-slate-500 font-medium">Cấp cứu</span>
                                <span className="font-bold text-red-600">115</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500 font-medium">Cứu hộ địa phương</span>
                                <span className="font-bold text-[#003da5]">024 123 456</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
