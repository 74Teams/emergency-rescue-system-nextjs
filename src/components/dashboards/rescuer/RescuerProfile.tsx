'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { getInitials } from '@/lib/utils/initials'
import { Shield, Mail, Phone, Clock, Target, CheckCircle } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'
import { format } from 'date-fns'
import { dictTeamStatus } from '@/constants/dictionary'
import { vi } from 'date-fns/locale'
import { toast } from 'sonner'

const mockPerformanceData = [
  { name: '1 tháng trước', missions: 5 },
  { name: '2 tháng trước', missions: 15 },
  { name: '3 tháng trước', missions: 14 },
  { name: '4 tháng trước', missions: 22 },
  { name: '5 tháng trước', missions: 20 },
  { name: 'Tháng này', missions: 35 },
]

export default function RescuerProfile({ profile, teamDetails, historyMissions, isUserActive = true }: any) {
    const isTeamActive = teamDetails?.status === 'ON_MISSION'
    
    return (
        <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* 1. HỒ SƠ CÁ NHÂN */}
                <Card className="border-slate-100 shadow-sm rounded-2xl overflow-hidden">
                    <CardHeader className="bg-white border-b border-slate-50 pb-4">
                        <CardTitle className="text-base font-bold text-slate-800">Hồ sơ cá nhân</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 bg-white">
                        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                            <Avatar className="w-24 h-24 border-4 border-slate-50 shadow-sm">
                                <AvatarImage src={profile?.avatarUrl} />
                                <AvatarFallback className="text-3xl bg-orange-100 text-orange-600 font-black">
                                    {getInitials(profile?.fullName || 'RS')}
                                </AvatarFallback>
                            </Avatar>
                            <div className="text-center sm:text-left flex-1">
                                <h3 className="text-2xl font-black text-slate-800">{profile?.fullName}</h3>
                                <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-2">
                                    {profile?.roles?.map((role: string) => (
                                        <Badge key={role} variant="secondary" className="bg-blue-50 text-blue-600 hover:bg-blue-100 uppercase text-[10px] tracking-wider font-bold">
                                            {role}
                                        </Badge>
                                    ))}
                                </div>
                                <div className="mt-3">
                                    {isUserActive ? (
                                        <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50 rounded-full px-3 py-0.5">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2 animate-pulse"></div>
                                            Trực tuyến
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline" className="text-slate-500 border-slate-200 bg-slate-50 rounded-full px-3 py-0.5">
                                            <div className="w-1.5 h-1.5 rounded-full bg-slate-400 mr-2"></div>
                                            Ngoại tuyến
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 space-y-4">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Thông tin liên lạc</h4>
                            <div className="flex items-center gap-3 text-sm border-b border-slate-50 pb-3">
                                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400"><Mail size={14} /></div>
                                <span className="font-bold text-slate-700">{profile?.email}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm pb-3">
                                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400"><Phone size={14} /></div>
                                <span className="font-bold text-slate-700">{profile?.phoneNumber || 'Chưa cập nhật'}</span>
                            </div>
                        </div>

                        <div className="mt-6 flex gap-6 pt-6 border-t border-slate-50">
                            <div>
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Kinh nghiệm</h4>
                                <p className="text-xl font-black text-slate-800">3 Năm</p>
                                <p className="text-xs text-slate-500 font-medium">Kinh nghiệm</p>
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 invisible">Nhiệm vụ</h4>
                                <p className="text-xl font-black text-slate-800">{historyMissions?.length || 50}</p>
                                <p className="text-xs text-slate-500 font-medium">Nhiệm vụ</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* 2. THÔNG TIN ĐỘI */}
                <Card className="border-slate-100 shadow-sm rounded-2xl overflow-hidden">
                    <CardHeader className="bg-white border-b border-slate-50 pb-4">
                        <CardTitle className="text-base font-bold text-slate-800">Thông tin Đội</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 bg-white">
                        {teamDetails ? (
                            <>
                                <div className="flex items-start justify-between">
                                    <div>
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center">
                                                <Shield size={20} className={isTeamActive ? "animate-pulse" : ""} />
                                            </div>
                                            <h3 className="text-2xl font-black text-slate-800">{teamDetails.teamName}</h3>
                                        </div>
                                        <Badge className={isTeamActive ? "bg-orange-500 hover:bg-orange-600 text-white font-black uppercase" : "bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase"}>
                                            {dictTeamStatus[teamDetails.status] || teamDetails.status}
                                        </Badge>
                                    </div>
                                </div>
                                
                                <p className="text-sm text-slate-500 mt-4 leading-relaxed font-medium">
                                    {teamDetails.description || 'Không có mô tả cho đội này.'}
                                </p>

                                <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-50">
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Đội trưởng</p>
                                        <p className="font-bold text-slate-800 text-sm truncate">{teamDetails.leader?.fullName || 'Chưa có'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Thành viên</p>
                                        <p className="font-bold text-slate-800 text-sm">{teamDetails.members?.length || 0} người</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Ngày thành lập</p>
                                        <p className="font-bold text-slate-800 text-sm">
                                            {format(new Date(teamDetails.createdAt || '2023-01-12'), 'dd/MM/yyyy')}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-6">
                                    <h4 className="text-xs font-bold text-slate-800 mb-3">Danh sách thành viên</h4>
                                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                                        {teamDetails.members?.map((member: any) => (
                                            <div key={member.id} className={`flex items-center gap-3 p-3 rounded-xl min-w-[200px] border ${member.id === teamDetails.leaderId ? 'bg-orange-50/50 border-orange-100' : 'border-slate-100 bg-white'}`}>
                                                <Avatar className="w-10 h-10 border border-slate-100 shadow-sm">
                                                    <AvatarFallback className="text-sm bg-slate-100 text-slate-600 font-bold">
                                                        {getInitials(member.fullName)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-bold text-sm text-slate-800 truncate max-w-[120px]">{member.fullName}</p>
                                                    <p className="text-[10px] text-slate-500 font-medium">
                                                        {member.id === teamDetails.leaderId ? 'Đội trưởng' : 'Cứu hộ viên'}
                                                    </p>
                                                    <p className={`text-[10px] font-bold mt-0.5 ${isTeamActive ? 'text-orange-500' : 'text-emerald-500'}`}>
                                                        {isTeamActive ? 'Đang làm nhiệm vụ' : 'Sẵn sàng'}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-10 text-slate-500">Chưa tham gia đội cứu hộ nào.</div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* 3. HIỆU SUẤT GẦN ĐÂY */}
            <Card className="border-slate-100 shadow-sm rounded-2xl overflow-hidden mt-6">
                <CardHeader className="bg-white border-b border-slate-50 pb-4">
                    <CardTitle className="text-base font-bold text-slate-800">Hiệu suất gần đây</CardTitle>
                </CardHeader>
                <CardContent className="p-6 bg-white">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        <div className="lg:col-span-3 h-[250px]">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Số lượng nhiệm vụ</h4>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={mockPerformanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorMissions" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        labelStyle={{ color: '#64748b', fontSize: '12px', fontWeight: 'bold' }}
                                    />
                                    <Area type="monotone" dataKey="missions" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorMissions)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex flex-col gap-4 justify-center">
                            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
                                <div className="flex justify-between items-center mb-2">
                                    <p className="text-xs font-bold text-slate-500">Nhiệm vụ hoàn thành</p>
                                    <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center">
                                        <CheckCircle size={14} />
                                    </div>
                                </div>
                                <p className="text-4xl font-black text-slate-800">45</p>
                            </div>
                            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
                                <div className="flex justify-between items-center mb-2">
                                    <p className="text-xs font-bold text-slate-500">Thời gian hoạt động</p>
                                    <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center">
                                        <Clock size={14} />
                                    </div>
                                </div>
                                <p className="text-4xl font-black text-slate-800">120<span className="text-lg text-slate-400 font-bold ml-1">h</span></p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* 4. LỊCH SỬ XIN NGHỈ PHÉP */}
            <LeaveRequestsHistory />
        </section>
    )
}

import { useMyLeaveRequests } from '@/lib/api/features/leaveRequests/leaveRequests.queries'
import { LeaveRequestStatus } from '@/lib/api/features/leaveRequests/leaveRequests.types'

function LeaveRequestsHistory() {
    const { data: leaveRequests, isLoading } = useMyLeaveRequests()
    const prevRequestsRef = React.useRef<any>(undefined)

    React.useEffect(() => {
        if (!leaveRequests || !prevRequestsRef.current) {
            if (leaveRequests) prevRequestsRef.current = leaveRequests
            return
        }

        const prevMap = new Map(prevRequestsRef.current.map((r: any) => [r.id, r.status]))
        
        leaveRequests.forEach((req: any) => {
            const prevStatus = prevMap.get(req.id)
            if (prevStatus === 'PENDING') {
                if (req.status === 'APPROVED') {
                    toast.success('Đơn xin nghỉ phép của bạn đã được duyệt!', {
                        description: `Từ ${format(new Date(req.startTime), 'dd/MM/yyyy')} đến ${format(new Date(req.endTime), 'dd/MM/yyyy')}`
                    })
                } else if (req.status === 'REJECTED') {
                    toast.error('Đơn xin nghỉ phép của bạn đã bị từ chối.', {
                        description: req.note ? `Lý do: ${req.note}` : 'Vui lòng liên hệ Đội trưởng.'
                    })
                }
            }
        })

        prevRequestsRef.current = leaveRequests
    }, [leaveRequests])

    if (isLoading) return <div>Đang tải lịch sử xin phép...</div>

    if (!leaveRequests || leaveRequests.length === 0) return null

    return (
        <Card className="border-slate-100 shadow-sm rounded-2xl overflow-hidden mt-6">
            <CardHeader className="bg-white border-b border-slate-50 pb-4">
                <CardTitle className="text-base font-bold text-slate-800">Lịch sử xin nghỉ phép</CardTitle>
            </CardHeader>
            <CardContent className="p-0 bg-white">
                <div className="divide-y divide-slate-50">
                    {leaveRequests.map(req => (
                        <div key={req.id} className="p-4 flex flex-col sm:flex-row gap-4 items-start justify-between">
                            <div>
                                <p className="font-bold text-slate-800 text-sm mb-1">{req.reason}</p>
                                <p className="text-xs text-slate-500 font-medium">
                                    Từ: {format(new Date(req.startTime), 'dd/MM/yyyy')} - 
                                    Đến: {format(new Date(req.endTime), 'dd/MM/yyyy')} 
                                    <span className="ml-2 px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md">
                                        {Math.round((new Date(req.endTime).getTime() - new Date(req.startTime).getTime()) / (1000 * 60 * 60 * 24))} ngày
                                    </span>
                                </p>
                                {req.note && (
                                    <p className="text-xs text-rose-500 mt-2 font-medium bg-rose-50 p-2 rounded-lg inline-block">
                                        Ghi chú từ Leader: {req.note}
                                    </p>
                                )}
                            </div>
                            <div>
                                {req.status === 'PENDING' && <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none">Đang chờ</Badge>}
                                {req.status === 'APPROVED' && <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none">Đã duyệt</Badge>}
                                {req.status === 'REJECTED' && <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100 border-none">Từ chối</Badge>}
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
