'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { getInitials } from '@/lib/utils/initials'
import { CheckCircle, Clock, Phone, ChevronUp, Navigation, MapPin, Hammer, Flag, ListTodo, Square, CheckSquare, Loader2, AlertTriangle } from 'lucide-react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { dictStatus as dictMissionStatus, dictPriority, dictType } from '@/constants/dictionary'

import { useQuery } from '@tanstack/react-query'
import { missionsApi } from '@/lib/api/features/missions/missions.api'
import { useMissionDetail } from '@/lib/api/features/missions/missions.queries'
import { useUpdateChecklistItem } from '@/lib/api/features/checklists/checklists.queries'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export default function RescuerCurrentMission({ currentMission, teamMembers }: any) {
    // Fetch detailed mission info containing checklists
    const { data: missionDetail, isLoading: isLoadingDetail } = useMissionDetail(currentMission?.id || '')
    const toggleItem = useUpdateChecklistItem(currentMission?.id || '')

    if (!currentMission) {
        return (
            <Card className="border-dashed border-2 border-slate-200 py-16 shadow-none bg-slate-50/50 rounded-3xl">
                <CardContent className="flex flex-col items-center justify-center text-center">
                    <div className="w-24 h-24 bg-white shadow-sm rounded-full flex items-center justify-center mb-6">
                        <CheckCircle className="h-12 w-12 text-emerald-400" />
                    </div>
                    <CardTitle className="text-2xl font-black text-slate-800">Không có nhiệm vụ nào đang diễn ra</CardTitle>
                    <CardDescription className="mt-3 text-base text-slate-500 max-w-md">
                        Đội của bạn hiện đang ở trạng thái Standby. Hãy nghỉ ngơi và chờ lệnh điều động tiếp theo.
                    </CardDescription>
                </CardContent>
            </Card>
        )
    }

    const getStepStatus = (stepName: string) => {
        const status = currentMission.status
        if (stepName === 'CONFIRM') {
            if (status === 'ASSIGNED') return 'CURRENT'
            return 'COMPLETED'
        }
        if (stepName === 'EN_ROUTE') {
            if (status === 'ASSIGNED') return 'PENDING'
            if (status === 'EN_ROUTE') return 'CURRENT'
            return 'COMPLETED'
        }
        if (stepName === 'ON_SITE') {
            if (['ASSIGNED', 'EN_ROUTE'].includes(status)) return 'PENDING'
            if (status === 'ON_SITE') return 'CURRENT'
            return 'COMPLETED'
        }
        if (stepName === 'IN_PROGRESS') {
            if (['ASSIGNED', 'EN_ROUTE', 'ON_SITE'].includes(status)) return 'PENDING'
            if (status === 'IN_PROGRESS') return 'CURRENT'
            return 'COMPLETED'
        }
        if (stepName === 'COMPLETED') {
            if (status === 'COMPLETED') return 'COMPLETED'
            return 'PENDING'
        }
        return 'PENDING'
    }

    const steps = [
        { label: 'Xác nhận nhiệm vụ', status: getStepStatus('CONFIRM'), icon: Clock },
        { label: 'Di chuyển', status: getStepStatus('EN_ROUTE'), icon: Navigation },
        { label: 'Tiếp cận hiện trường', status: getStepStatus('ON_SITE'), icon: MapPin },
        { label: 'Bắt đầu cứu hộ', status: getStepStatus('IN_PROGRESS'), icon: Hammer },
        { label: 'Hoàn thành', status: getStepStatus('COMPLETED'), icon: Flag },
    ]

    const timelineWidths: Record<string, string> = {
        ASSIGNED: '0%',
        EN_ROUTE: '25%',
        ON_SITE: '50%',
        IN_PROGRESS: '75%',
        COMPLETED: '100%',
    }

    const { data: historyItems } = useQuery({
        queryKey: ['missionHistory', currentMission?.id],
        queryFn: async () => {
            if (!currentMission?.id) return []
            const res = await missionsApi.history(currentMission.id)
            return res.data || []
        },
        enabled: !!currentMission?.id,
        refetchInterval: 10000,
    })

    const handleToggleCheck = async (itemId: string, description: string, currentChecked: boolean) => {
        try {
            await toggleItem.mutateAsync({
                itemId,
                payload: {
                    description,
                    isCheck: !currentChecked
                }
            })
            toast.success('Đã cập nhật trạng thái mục checklist.')
        } catch {
            toast.error('Không thể cập nhật trạng thái mục checklist.')
        }
    }

    // Calculate checklist statistics
    const allChecklists = missionDetail?.checklists || []
    const totalItems = allChecklists.reduce((acc: number, c: any) => acc + (c.items?.length || 0), 0)
    const completedItems = allChecklists.reduce((acc: number, c: any) => acc + (c.items?.filter((i: any) => i.isCheck).length || 0), 0)
    const completionPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0

    return (
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                <div>
                    <h2 className="text-3xl font-black text-slate-800 flex items-center gap-3">
                        Nhiệm vụ đang thực hiện: <span className="text-slate-500">#{currentMission.id.slice(-8)}</span>
                    </h2>
                    <p className="flex items-center gap-2 mt-2 text-slate-500 font-medium text-sm">
                        <Clock size={16} /> Tạo lúc: {format(new Date(currentMission.createAt || new Date()), 'HH:mm dd/MM/yyyy', { locale: vi })}
                    </p>
                </div>
                <Badge className="bg-orange-500 hover:bg-orange-600 text-white font-black uppercase px-4 py-2 mt-4 sm:mt-0 shadow-md">
                    {dictMissionStatus[currentMission.status as keyof typeof dictMissionStatus] || currentMission.status}
                </Badge>
            </div>

            {/* Horizontal Timeline (Tiến trình nhiệm vụ) */}
            <Card className="border-slate-100 shadow-sm rounded-2xl bg-white overflow-hidden">
                <CardContent className="p-6">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">
                        Tiến trình nhiệm vụ (General Status)
                    </p>
                    <div className="relative pt-2">
                        <div className="flex justify-between items-center relative">
                            {steps.map((step, idx) => (
                                <div key={idx} className="flex flex-col items-center gap-2 flex-1 relative z-10">
                                    <div className={cn(
                                        "w-10 h-10 rounded-full flex items-center justify-center border-4 border-white transition-all shadow-sm",
                                        step.status === 'COMPLETED'
                                            ? "bg-emerald-500 text-white"
                                            : step.status === 'CURRENT'
                                                ? "bg-orange-500 text-white animate-pulse"
                                                : "bg-slate-100 text-slate-400"
                                    )}>
                                        <step.icon size={16} />
                                    </div>
                                    <span className={cn(
                                        "text-xs font-bold text-center hidden md:inline-block max-w-[120px]",
                                        step.status === 'COMPLETED'
                                            ? "text-emerald-600"
                                            : step.status === 'CURRENT'
                                                ? "text-orange-600 font-black"
                                                : "text-slate-400"
                                    )}>
                                        {step.label}
                                    </span>
                                </div>
                            ))}
                        </div>
                        {/* Connecting timeline line */}
                        <div className="absolute top-[26px] left-[10%] right-[10%] h-[3px] bg-slate-100 -z-0">
                            <div 
                                className="h-full bg-gradient-to-r from-emerald-500 to-orange-500 transition-all duration-500"
                                style={{ width: `${timelineWidths[currentMission.status] ?? '0%'}` }}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Main Content Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* DYNAMIC TASK CHECKLIST (Col 1-8) */}
                <Card className="lg:col-span-8 border-slate-100 shadow-sm rounded-2xl">
                    <CardHeader className="bg-white border-b border-slate-50 pb-4 flex flex-row items-center justify-between flex-wrap gap-4">
                        <div>
                            <CardTitle className="text-lg font-black text-slate-800 flex items-center gap-2">
                                <ListTodo className="h-5 w-5 text-red-500" />
                                Checklist công việc chi tiết
                            </CardTitle>
                            <CardDescription>Các nhiệm vụ chi tiết được chỉ định cho đội thực hiện</CardDescription>
                        </div>
                        {totalItems > 0 && (
                            <div className="flex items-center gap-3">
                                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                                    Đã hoàn thành: {completedItems}/{totalItems} ({completionPercentage}%)
                                </span>
                            </div>
                        )}
                    </CardHeader>
                    <CardContent className="p-6">
                        {isLoadingDetail ? (
                            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                                <Loader2 className="w-8 h-8 animate-spin text-orange-500 mb-2" />
                                <p className="text-sm font-medium">Đang tải danh sách công việc...</p>
                            </div>
                        ) : allChecklists.length === 0 ? (
                            <div className="flex flex-col items-center justify-center text-center py-12 text-slate-500">
                                <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-400 shadow-sm">
                                    <ListTodo className="h-8 w-8" />
                                </div>
                                <p className="font-extrabold text-slate-700 text-lg">Chưa có checklist chi tiết</p>
                                <p className="text-sm text-slate-400 max-w-sm mt-2">
                                    Đội trưởng đang chuẩn bị hoặc chưa tạo checklist cụ thể cho nhiệm vụ này.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {allChecklists.map((checklist: any) => (
                                    <div key={checklist.id} className="bg-slate-50/50 border border-slate-100 rounded-2xl p-5 hover:shadow-sm transition-all">
                                        <h4 className="font-extrabold text-slate-800 text-base mb-4 flex items-center gap-2 pb-2 border-b border-slate-200/50">
                                            <span className="w-2 h-2 rounded-full bg-red-500" />
                                            {checklist.title}
                                        </h4>
                                        
                                        {!checklist.items || checklist.items.length === 0 ? (
                                            <p className="text-sm text-slate-400 italic pl-4">Chưa có hạng mục công việc chi tiết nào.</p>
                                        ) : (
                                            <div className="space-y-3">
                                                {checklist.items.map((item: any) => {
                                                    const isPending = toggleItem.isPending && toggleItem.variables?.itemId === item.id
                                                    return (
                                                        <div 
                                                            key={item.id} 
                                                            className={cn(
                                                                "flex items-start gap-3 p-3 rounded-xl border transition-all duration-200 bg-white",
                                                                item.isCheck 
                                                                    ? "border-emerald-100 bg-emerald-50/10" 
                                                                    : "border-slate-100 hover:border-slate-200"
                                                            )}
                                                        >
                                                            <button
                                                                onClick={() => handleToggleCheck(item.id, item.description, item.isCheck)}
                                                                disabled={isPending}
                                                                className="mt-0.5 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors shrink-0 outline-none"
                                                            >
                                                                {isPending ? (
                                                                    <Loader2 className="w-5 h-5 animate-spin text-orange-500" />
                                                                ) : item.isCheck ? (
                                                                    <CheckSquare className="w-5 h-5 text-emerald-500 fill-emerald-50/50 transition-all duration-300" />
                                                                ) : (
                                                                    <Square className="w-5 h-5 text-slate-300 transition-all duration-300" />
                                                                )}
                                                            </button>
                                                            
                                                            <div className="flex-1 min-w-0">
                                                                <p className={cn(
                                                                    "text-sm font-semibold leading-relaxed transition-all duration-300",
                                                                    item.isCheck 
                                                                        ? "text-slate-400 line-through decoration-slate-300" 
                                                                        : "text-slate-700"
                                                                )}>
                                                                    {item.description}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* TEAM ON SITE (Col 9-12 split) */}
                <div className="lg:col-span-4 space-y-6">
                    {/* Incident Request Details Card */}
                    <Card className="border-slate-100 shadow-sm rounded-2xl">
                        <CardHeader className="bg-white border-b border-slate-50 pb-4">
                            <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-amber-500" />
                                Thông tin yêu cầu cứu hộ
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
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
                                        <p className="text-xs text-slate-750 leading-relaxed italic whitespace-pre-wrap">
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
                        </CardContent>
                    </Card>

                    {/* Team Members Card */}
                    <Card className="border-slate-100 shadow-sm rounded-2xl h-fit">
                        <CardHeader className="bg-white border-b border-slate-50 pb-4">
                            <CardTitle className="text-base font-bold text-slate-800">Thành viên tại hiện trường</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="space-y-4">
                                {teamMembers?.map((member: any) => (
                                    <div key={member.id} className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="w-10 h-10 border border-slate-100">
                                                <AvatarFallback className="text-sm bg-slate-100 text-slate-600 font-bold">
                                                    {getInitials(member.fullName)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-bold text-sm text-slate-800">{member.fullName}</p>
                                                <p className="text-xs text-slate-500 font-medium">Cứu hộ viên</p>
                                            </div>
                                        </div>
                                        <Button variant="outline" size="sm" className="rounded-full flex items-center gap-2 text-slate-600 font-bold border-slate-200 h-8">
                                            <Phone size={12} /> Gọi
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Mission Logs */}
                    <Card className="border-slate-100 shadow-sm rounded-2xl h-fit p-6 bg-white">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="font-bold text-slate-800 text-base">Nhật ký nhiệm vụ</h4>
                            <ChevronUp size={18} className="text-slate-400" />
                        </div>
                        <div className="space-y-4 border-l-2 border-slate-100 ml-2 max-h-[280px] overflow-y-auto pr-1">
                            {!historyItems || historyItems.length === 0 ? (
                                <p className="text-sm text-slate-500 italic ml-4">Chưa có nhật ký nhiệm vụ</p>
                            ) : (
                                historyItems.map((log: any, idx: number) => (
                                    <div key={idx} className="relative pl-6 pb-2">
                                        <div className="absolute left-[-5px] top-1.5 w-2 h-2 rounded-full bg-slate-300"></div>
                                        <p className="text-xs text-slate-600 leading-relaxed">
                                            <span className="font-bold text-slate-400 mr-2">{format(new Date(log.createdAt || log.timestamp || new Date()), 'HH:mm dd/MM')}:</span>
                                            {log.note || (log.fromStatus !== log.toStatus ? `Chuyển trạng thái sang ${dictMissionStatus[log.toStatus as keyof typeof dictMissionStatus] || log.toStatus}` : 'Cập nhật nhiệm vụ')}
                                        </p>
                                    </div>
                                ))
                            )}
                        </div>
                    </Card>
                </div>

            </div>
        </section>
    )
}
