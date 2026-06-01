import { useState } from 'react'
import { CheckCircle2, XCircle, Clock, CalendarIcon, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getInitials } from '@/lib/utils/initials'
import {
    useApproveLeaveRequest,
    useRejectLeaveRequest,
} from '@/lib/api/features/leaveRequests/leaveRequests.mutations'
import { useTeamLeaveRequests as useTeamLeaveRequestsQuery } from '@/lib/api/features/leaveRequests/leaveRequests.queries'
import { Textarea } from '@/components/ui/textarea'

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'

export default function LeaveApprovalsView({ teamId }: { teamId: string }) {
    const { data: leaveRequests, isLoading } = useTeamLeaveRequestsQuery(teamId)
    const approveMutation = useApproveLeaveRequest(teamId)
    const rejectMutation = useRejectLeaveRequest(teamId)

    const [selectedRequest, setSelectedRequest] = useState<any>(null)
    const [actionType, setActionType] = useState<'APPROVE' | 'REJECT' | null>(null)
    const [note, setNote] = useState('')

    if (isLoading) {
        return (
            <div className="flex h-64 w-full items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
            </div>
        )
    }

    const pendingRequests = leaveRequests?.filter(req => req.status === 'PENDING') || []
    const historyRequests = leaveRequests?.filter(req => req.status !== 'PENDING') || []

    const handleConfirmAction = async () => {
        if (!selectedRequest || !actionType) return

        try {
            if (actionType === 'APPROVE') {
                await approveMutation.mutateAsync({
                    id: selectedRequest.id,
                    data: { note: note.trim() }
                })
                toast.success('Đã duyệt đơn xin nghỉ phép!')
            } else {
                if (!note.trim()) {
                    toast.error('Vui lòng nhập lý do từ chối')
                    return
                }
                await rejectMutation.mutateAsync({
                    id: selectedRequest.id,
                    data: { note: note.trim() }
                })
                toast.success('Đã từ chối đơn xin nghỉ phép!')
            }

            setSelectedRequest(null)
            setActionType(null)
            setNote('')
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Có lỗi xảy ra')
        }
    }

    const isPending = approveMutation.isPending || rejectMutation.isPending

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* PENDING LIST */}
            <div>
                <h3 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2">
                    <Clock className="w-6 h-6 text-amber-500" />
                    Chờ phê duyệt ({pendingRequests.length})
                </h3>

                {pendingRequests.length === 0 ? (
                    <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-8 text-center">
                        <p className="text-slate-500 font-medium">Không có đơn xin nghỉ phép nào đang chờ duyệt.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {pendingRequests.map(req => (
                            <div key={req.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col">
                                <div className="flex items-center gap-3 mb-4 border-b border-slate-50 pb-4">
                                    <Avatar className="w-12 h-12 shadow-sm border border-slate-100">
                                        <AvatarImage src={req.rescuerAvatar} />
                                        <AvatarFallback className="bg-slate-100 text-slate-700 font-bold">
                                            {getInitials(req.rescuerName)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-bold text-slate-900 leading-tight">{req.rescuerName}</p>
                                        <p className="text-xs text-slate-500 font-medium mt-0.5">Xin nghỉ phép</p>
                                    </div>
                                </div>
                                <div className="space-y-3 flex-1">
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Thời gian</p>
                                        <div className="text-sm font-medium text-slate-700 bg-slate-50 p-2 rounded-lg">
                                            Từ: {format(new Date(req.startTime), 'dd/MM/yyyy')} <br />
                                            Đến: {format(new Date(req.endTime), 'dd/MM/yyyy')} <br />
                                            <span className="text-xs font-bold text-orange-600 mt-1 inline-block">
                                                Nghỉ {Math.round((new Date(req.endTime).getTime() - new Date(req.startTime).getTime()) / (1000 * 60 * 60 * 24))} ngày
                                            </span>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Lý do</p>
                                        <p className="text-sm font-medium text-slate-800 line-clamp-3">{req.reason}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3 mt-6 pt-4 border-t border-slate-50">
                                    <Button
                                        variant="outline"
                                        className="border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                                        onClick={() => { setSelectedRequest(req); setActionType('REJECT'); setNote(''); }}
                                    >
                                        <XCircle className="w-4 h-4 mr-1.5" /> Từ chối
                                    </Button>
                                    <Button
                                        className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm shadow-emerald-500/20"
                                        onClick={() => { setSelectedRequest(req); setActionType('APPROVE'); setNote(''); }}
                                    >
                                        <CheckCircle2 className="w-4 h-4 mr-1.5" /> Phê duyệt
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* HISTORY LIST */}
            {historyRequests.length > 0 && (
                <div>
                    <h3 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2">
                        <CalendarIcon className="w-6 h-6 text-slate-400" />
                        Lịch sử duyệt
                    </h3>
                    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                        <div className="divide-y divide-slate-100">
                            {historyRequests.map(req => (
                                <div key={req.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <Avatar className="w-10 h-10 border border-slate-100">
                                            <AvatarFallback className="bg-slate-100 text-slate-600 font-bold text-xs">
                                                {getInitials(req.rescuerName)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-bold text-slate-900">{req.rescuerName}</p>
                                            <p className="text-xs text-slate-500 font-medium">
                                                {format(new Date(req.startTime), 'dd/MM/yyyy')} - {format(new Date(req.endTime), 'dd/MM/yyyy')}
                                                <span className="ml-2 px-1.5 py-0.5 bg-slate-100 rounded">
                                                    {Math.round((new Date(req.endTime).getTime() - new Date(req.startTime).getTime()) / (1000 * 60 * 60 * 24))} ngày
                                                </span>
                                            </p>
                                            {req.note && (
                                                <p className="text-xs text-slate-600 mt-1 italic">
                                                    " {req.note} "
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        {req.status === 'APPROVED' ? (
                                            <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none font-bold">
                                                <CheckCircle2 className="w-3 h-3 mr-1" /> Đã duyệt
                                            </Badge>
                                        ) : (
                                            <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100 border-none font-bold">
                                                <XCircle className="w-3 h-3 mr-1" /> Đã từ chối
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ACTION DIALOG */}
            <Dialog open={!!selectedRequest} onOpenChange={(open) => !open && setSelectedRequest(null)}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className={actionType === 'APPROVE' ? 'text-emerald-600' : 'text-rose-600'}>
                            {actionType === 'APPROVE' ? 'Phê duyệt nghỉ phép' : 'Từ chối nghỉ phép'}
                        </DialogTitle>
                        <DialogDescription>
                            {actionType === 'APPROVE'
                                ? `Bạn có chắc chắn muốn phê duyệt cho ${selectedRequest?.rescuerName}?`
                                : `Bạn đang từ chối đơn xin nghỉ của ${selectedRequest?.rescuerName}.`}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <label className="text-sm font-bold text-slate-700">Ghi chú (Tùy chọn cho Phê duyệt, Bắt buộc cho Từ chối)</label>
                            <Textarea
                                placeholder="Nhập ghi chú hoặc lý do..."
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                rows={3}
                                className="resize-none"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setSelectedRequest(null)}>
                            Hủy
                        </Button>
                        <Button
                            onClick={handleConfirmAction}
                            disabled={isPending}
                            className={actionType === 'APPROVE' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'}
                        >
                            {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Xác nhận
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
