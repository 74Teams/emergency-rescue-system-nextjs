import { useState } from 'react'
import { CalendarIcon, Loader2, Send } from 'lucide-react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { useCreateLeaveRequest } from '@/lib/api/features/leaveRequests/leaveRequests.mutations'

export default function LeaveRequestModal() {
    const [open, setOpen] = useState(false)
    const [startDate, setStartDate] = useState('')
    const [durationDays, setDurationDays] = useState('1')
    const [reason, setReason] = useState('')

    const createLeaveRequest = useCreateLeaveRequest()

    const handleSubmit = async () => {
        if (!startDate || !durationDays || !reason.trim()) {
            toast.error('Vui lòng điền đầy đủ thông tin')
            return
        }

        const days = parseInt(durationDays)
        if (isNaN(days) || days <= 0) {
            toast.error('Số ngày nghỉ không hợp lệ')
            return
        }

        const start = new Date(startDate)
        start.setHours(0, 0, 0, 0)
        
        const end = new Date(start)
        end.setDate(end.getDate() + days)

        try {
            await createLeaveRequest.mutateAsync({
                startTime: start.toISOString(),
                endTime: end.toISOString(),
                reason: reason.trim(),
            })
            toast.success('Gửi đơn xin phép thành công!')
            setOpen(false)
            setStartDate('')
            setDurationDays('1')
            setReason('')
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi xin phép')
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2 font-bold text-slate-600 border-slate-300">
                    <CalendarIcon className="w-4 h-4" />
                    Xin nghỉ phép
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold">Đơn xin nghỉ phép</DialogTitle>
                    <DialogDescription>
                        Điền thời gian và lý do để gửi đơn đến Đội trưởng duyệt.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <label className="text-sm font-bold text-slate-700">Ngày bắt đầu</label>
                            <Input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <label className="text-sm font-bold text-slate-700">Số ngày nghỉ</label>
                            <Input
                                type="number"
                                min="1"
                                value={durationDays}
                                onChange={(e) => setDurationDays(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <label className="text-sm font-bold text-slate-700">Lý do</label>
                        <Textarea
                            placeholder="Nhập lý do xin nghỉ phép..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            rows={3}
                            className="resize-none"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => setOpen(false)}>
                        Hủy
                    </Button>
                    <Button 
                        onClick={handleSubmit} 
                        disabled={createLeaveRequest.isPending}
                        className="bg-orange-600 hover:bg-orange-700 text-white"
                    >
                        {createLeaveRequest.isPending ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                            <Send className="w-4 h-4 mr-2" />
                        )}
                        Gửi đơn
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
