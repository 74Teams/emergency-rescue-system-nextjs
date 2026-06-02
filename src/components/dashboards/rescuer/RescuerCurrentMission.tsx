'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getInitials } from '@/lib/utils/initials'
import { CheckCircle, Clock, Phone, AlertCircle, ChevronUp } from 'lucide-react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { dictStatus as dictMissionStatus } from '@/constants/dictionary'

import { useQuery } from '@tanstack/react-query'
import { missionsApi } from '@/lib/api/features/missions/missions.api'

export default function RescuerCurrentMission({ currentMission, teamMembers }: any) {
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

    const steps = [
        { label: 'Xác nhận nhiệm vụ', status: 'COMPLETED' },
        { label: 'Di chuyển đến điểm tập kết', status: 'COMPLETED' },
        { label: 'Tiếp cận hiện trường', status: 'CURRENT' },
        { label: 'Đưa nạn nhân đến nơi an toàn', status: 'PENDING' },
        { label: 'Báo cáo hoàn thành', status: 'PENDING' },
    ]

    const { data: historyItems } = useQuery({
        queryKey: ['missionHistory', currentMission?.id],
        queryFn: async () => {
            if (!currentMission?.id) return []
            const res = await missionsApi.history(currentMission.id)
            return res.data || []
        },
        enabled: !!currentMission?.id,
        refetchInterval: 10000, // refresh every 10s
    })

    return (
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8">
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

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* CHECKLIST (Col 1-5) */}
                <Card className="lg:col-span-5 border-slate-100 shadow-sm rounded-2xl">
                    <CardContent className="p-6">
                        <div className="space-y-0 relative before:absolute before:inset-0 before:ml-[23px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                            {steps.map((step, idx) => (
                                <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active py-4">
                                    <div className="flex items-center justify-center w-12 h-12 rounded-full border-4 border-white bg-slate-100 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm relative z-10"
                                        style={step.status === 'COMPLETED' ? { backgroundColor: '#10b981', color: 'white' } : step.status === 'CURRENT' ? { backgroundColor: '#f97316', color: 'white' } : {}}
                                    >
                                        {step.status === 'COMPLETED' && <CheckCircle size={20} />}
                                        {step.status === 'CURRENT' && <Clock size={20} />}
                                    </div>
                                    <div className={`w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border ${step.status === 'CURRENT' ? 'border-orange-200 bg-orange-50/50 shadow-sm' : 'border-transparent'}`}>
                                        <div className="flex items-center justify-between">
                                            <p className={`font-bold text-base ${step.status === 'PENDING' ? 'text-slate-400' : 'text-slate-800'}`}>
                                                {idx + 1}. {step.label}
                                            </p>
                                        </div>
                                        {step.status === 'CURRENT' && (
                                            <Button className="w-full mt-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg h-9">
                                                Đánh dấu đã tiếp cận
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* TEAM ON SITE (Col 6-9) */}
                <Card className="lg:col-span-4 border-slate-100 shadow-sm rounded-2xl h-fit">
                    <CardHeader className="bg-white border-b border-slate-50 pb-4">
                        <CardTitle className="text-base font-bold text-slate-800">Thành viên tại hiện trường (Team on Site)</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="space-y-4">
                            {teamMembers?.map((member: any) => (
                                <div key={member.id} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="w-12 h-12 border border-slate-100">
                                            <AvatarFallback className="text-lg bg-slate-100 text-slate-600 font-bold">
                                                {getInitials(member.fullName)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-bold text-sm text-slate-800">{member.fullName}</p>
                                            <p className="text-xs text-slate-500 font-medium">Cứu hộ viên</p>
                                        </div>
                                    </div>
                                    <Button variant="outline" size="sm" className="rounded-full flex items-center gap-2 text-slate-600 font-bold border-slate-200">
                                        <Phone size={14} /> Gọi ngay
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* MISSION LOGS (Col 10-12) */}
                <Card className="lg:col-span-3 border-transparent bg-transparent shadow-none">
                    <div className="flex items-center justify-between mb-4 px-2">
                        <h4 className="font-bold text-slate-800 text-base">Nhật ký nhiệm vụ (Mission Logs)</h4>
                        <ChevronUp size={20} className="text-slate-400" />
                    </div>
                    <div className="space-y-4 px-2 border-l-2 border-slate-100 ml-2 max-h-[300px] overflow-y-auto">
                        {!historyItems || historyItems.length === 0 ? (
                            <p className="text-sm text-slate-500 italic ml-4">Chưa có nhật ký nhiệm vụ</p>
                        ) : (
                            historyItems.map((log: any, idx: number) => (
                                <div key={idx} className="relative pl-6 pb-2">
                                    <div className="absolute left-[-5px] top-1.5 w-2 h-2 rounded-full bg-slate-300"></div>
                                    <p className="text-sm text-slate-700 leading-relaxed">
                                        <span className="font-bold text-slate-500 mr-2">{format(new Date(log.createdAt || log.timestamp || new Date()), 'HH:mm dd/MM')}:</span>
                                        {log.note || (log.fromStatus !== log.toStatus ? `Chuyển trạng thái sang ${dictMissionStatus[log.toStatus as keyof typeof dictMissionStatus] || log.toStatus}` : 'Cập nhật nhiệm vụ')}
                                    </p>
                                </div>
                            ))
                        )}
                    </div>
                </Card>

            </div>
        </section>
    )
}
