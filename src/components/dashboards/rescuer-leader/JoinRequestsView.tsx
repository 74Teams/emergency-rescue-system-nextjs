import { useState } from 'react'
import { CheckCircle2, XCircle, Clock, Loader2, MessageSquare } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getInitials } from '@/lib/utils/initials'
import {
    useTeamJoinRequests,
    useApproveJoinRequest,
    useRejectJoinRequest,
} from '@/lib/api/features/joinRequests/joinRequest.queries'

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'

export default function JoinRequestsView({ teamId }: { teamId: string }) {
    const { data: joinRequests, isLoading } = useTeamJoinRequests(teamId)
    const approveMutation = useApproveJoinRequest()
    const rejectMutation = useRejectJoinRequest()

    const [selectedRequest, setSelectedRequest] = useState<any>(null)
    const [actionType, setActionType] = useState<'APPROVE' | 'REJECT' | null>(null)

    if (isLoading) {
        return (
            <div className="flex h-64 w-full items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
            </div>
        )
    }

    const pendingRequests = joinRequests?.filter(req => req.status === 0) || []

    const handleConfirmAction = async () => {
        if (!selectedRequest || !actionType) return

        try {
            if (actionType === 'APPROVE') {
                await approveMutation.mutateAsync(selectedRequest.id)
                toast.success('Đã duyệt cứu hộ viên vào đội!')
            } else {
                await rejectMutation.mutateAsync(selectedRequest.id)
                toast.success('Đã từ chối yêu cầu gia nhập!')
            }

            setSelectedRequest(null)
            setActionType(null)
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Có lỗi xảy ra')
        }
    }

    const isPending = approveMutation.isPending || rejectMutation.isPending

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h3 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2">
                    <Clock className="w-6 h-6 text-amber-500" />
                    Đơn xin gia nhập đội ({pendingRequests.length})
                </h3>

                {pendingRequests.length === 0 ? (
                    <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-8 text-center">
                        <p className="text-slate-500 font-medium">Không có yêu cầu xin gia nhập nào đang chờ duyệt.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {pendingRequests.map(req => (
                            <div key={req.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center gap-3 mb-4 border-b border-slate-50 pb-4">
                                        <Avatar className="w-12 h-12 shadow-sm border border-slate-100">
                                            <AvatarImage src={req.rescuerAvatar} />
                                            <AvatarFallback className="bg-slate-100 text-slate-700 font-bold">
                                                {getInitials(req.rescuerName)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-bold text-slate-900 leading-tight">{req.rescuerName}</p>
                                            <p className="text-xs text-slate-500 font-medium mt-0.5">{req.rescuerEmail}</p>
                                            <p className="text-xs text-slate-400 font-medium mt-0.5">{req.rescuerPhone || 'Chưa cung cấp SĐT'}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                                                <MessageSquare className="w-3.5 h-3.5 text-slate-400" /> Lời giới thiệu
                                            </p>
                                            <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 italic min-h-[60px] break-words">
                                                {req.message ? `"${req.message}"` : '"Không có lời nhắn."'}
                                            </p>
                                        </div>
                                        <div className="text-[10px] text-slate-400 font-semibold">
                                            Ngày gửi: {format(new Date(req.createdAt), 'dd/MM/yyyy HH:mm')}
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3 mt-6 pt-4 border-t border-slate-50">
                                    <Button
                                        variant="outline"
                                        className="border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                                        onClick={() => { setSelectedRequest(req); setActionType('REJECT'); }}
                                    >
                                        <XCircle className="w-4 h-4 mr-1.5" /> Từ chối
                                    </Button>
                                    <Button
                                        className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm shadow-emerald-500/20"
                                        onClick={() => { setSelectedRequest(req); setActionType('APPROVE'); }}
                                    >
                                        <CheckCircle2 className="w-4 h-4 mr-1.5" /> Đồng ý
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ACTION DIALOG */}
            <Dialog open={!!selectedRequest} onOpenChange={(open) => !open && setSelectedRequest(null)}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className={actionType === 'APPROVE' ? 'text-emerald-600' : 'text-rose-600'}>
                            {actionType === 'APPROVE' ? 'Phê duyệt yêu cầu gia nhập' : 'Từ chối yêu cầu gia nhập'}
                        </DialogTitle>
                        <DialogDescription>
                            {actionType === 'APPROVE'
                                ? `Bạn có chắc chắn muốn nhận cứu hộ viên ${selectedRequest?.rescuerName} vào đội?`
                                : `Bạn có chắc muốn từ chối yêu cầu gia nhập của cứu hộ viên ${selectedRequest?.rescuerName}?`}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-4">
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
