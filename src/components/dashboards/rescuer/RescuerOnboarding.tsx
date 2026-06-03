import { useState, useMemo } from 'react'
import {
    Search,
    Building2,
    UserPlus,
    MapPin,
    Users,
    LogOut,
    Clock,
    Loader2,
    ShieldAlert,
    CheckCircle2,
    MessageSquare,
    User,
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getInitials } from '@/lib/utils/initials'

// APIs & Hooks
import { useLogout } from '@/lib/api/use-auth'
import { useRescueTeams } from '@/lib/api/features/rescueTeams/rescueTeams.queries'
import {
    useRescuerJoinRequestStatus,
    useCreateJoinRequest,
} from '@/lib/api/features/joinRequests/joinRequest.queries'

interface RescuerOnboardingProps {
    profile: any
}

export default function RescuerOnboarding({ profile }: RescuerOnboardingProps) {
    const logout = useLogout()
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedTeam, setSelectedTeam] = useState<any>(null)
    const [message, setMessage] = useState('')

    // Queries
    const { data: joinRequestStatus, isLoading: isLoadingStatus } = useRescuerJoinRequestStatus()
    const { data: rescueTeams, isLoading: isLoadingTeams } = useRescueTeams()
    const createJoinMutation = useCreateJoinRequest()

    // Filter teams based on search query
    const filteredTeams = useMemo(() => {
        if (!rescueTeams) return []
        return rescueTeams.filter(team =>
            team.teamName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (team.description && team.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (team.baseLocation?.address && team.baseLocation.address.toLowerCase().includes(searchQuery.toLowerCase()))
        )
    }, [rescueTeams, searchQuery])

    const handleApply = async () => {
        if (!selectedTeam) return

        try {
            await createJoinMutation.mutateAsync({
                rescueTeamId: selectedTeam.id,
                message: message.trim() || undefined
            })
            toast.success('Gửi đơn gia nhập đội thành công!')
            setSelectedTeam(null)
            setMessage('')
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Không thể gửi đơn gia nhập.')
        }
    }

    const isLoading = isLoadingStatus || isLoadingTeams

    if (isLoading) {
        return (
            <div className="flex h-screen w-full flex-col items-center justify-center bg-slate-50">
                <Loader2 className="w-10 h-10 animate-spin text-orange-600 mb-4" />
                <p className="text-slate-500 font-semibold uppercase tracking-wider text-xs">Đang tải thông tin...</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen w-full bg-slate-50/50 flex flex-col font-sans">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 px-6 lg:px-12 h-20 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center text-white font-black text-xl shadow-md shadow-orange-600/20">
                        <ShieldAlert size={20} />
                    </div>
                    <div>
                        <h1 className="text-lg font-black text-slate-900 tracking-tight leading-tight">
                            Gia nhập Đội cứu hộ
                        </h1>
                        <p className="text-[10px] font-bold text-orange-600 uppercase tracking-widest">
                            Lực lượng cứu hộ
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                        <Avatar className="w-9 h-9 border border-slate-200 shadow-sm">
                            <AvatarImage src={profile?.avatarUrl || profile?.avatar} />
                            <AvatarFallback className="bg-slate-100 text-slate-700 font-bold">
                                {getInitials(profile?.fullName || 'RS')}
                            </AvatarFallback>
                        </Avatar>
                        <div className="hidden md:block text-left">
                            <p className="text-sm font-bold text-slate-800 leading-tight">
                                {profile?.fullName}
                            </p>
                            <p className="text-[10px] text-slate-500 font-medium">
                                Cứu hộ viên tự do
                            </p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => logout()}
                        className="text-slate-500 hover:text-red-600 transition-colors"
                        title="Đăng xuất"
                    >
                        <LogOut size={18} />
                    </Button>
                </div>
            </header>

            {/* Main Area */}
            <main className="flex-1 max-w-6xl w-full mx-auto p-6 md:p-12 space-y-8">
                {joinRequestStatus ? (
                    // Show Pending Status Card
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-xl mx-auto mt-12">
                        <Card className="border-orange-500/20 shadow-xl overflow-hidden bg-white">
                            <div className="bg-orange-500/10 h-2 w-full" />
                            <CardHeader className="text-center pt-8">
                                <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-4 border border-orange-200">
                                    <Clock className="w-8 h-8 text-orange-600 animate-pulse" />
                                </div>
                                <CardTitle className="text-2xl font-black text-slate-900">Đơn xin gia nhập đang chờ duyệt</CardTitle>
                                <CardDescription className="text-slate-500 font-medium">
                                    Bạn đã gửi yêu cầu gia nhập vào một đội cứu hộ trên hệ thống.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="px-8 pb-8 space-y-6">
                                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Đội cứu hộ chọn</p>
                                            <p className="font-extrabold text-slate-800 text-base">{joinRequestStatus.teamName}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Thời gian gửi</p>
                                            <p className="font-semibold text-slate-700 text-sm">
                                                {format(new Date(joinRequestStatus.createdAt), 'dd/MM/yyyy HH:mm')}
                                            </p>
                                        </div>
                                    </div>
                                    {joinRequestStatus.message && (
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                                                <MessageSquare className="w-3.5 h-3.5 text-slate-400" /> Lời nhắn kèm theo
                                            </p>
                                            <p className="text-sm text-slate-600 bg-white p-3 rounded-xl border border-slate-200/60 italic">
                                                "{joinRequestStatus.message}"
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl text-blue-800">
                                    <CheckCircle2 className="w-5 h-5 shrink-0 text-blue-600 mt-0.5" />
                                    <div className="text-xs font-semibold leading-relaxed">
                                        Yêu cầu gia nhập của bạn cần được Đội trưởng Đội cứu hộ này phê duyệt. Sau khi được duyệt, bạn sẽ được tự động biên chế vào đội và truy cập vào Bảng điều khiển Cứu hộ viên.
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                ) : (
                    // Show Directory Search & Cards
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="text-center max-w-2xl mx-auto space-y-3">
                            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Tìm kiếm Đội cứu hộ để gia nhập</h2>
                            <p className="text-slate-500 font-medium text-sm">
                                Bạn chưa thuộc biên chế của đội cứu hộ nào. Hãy tìm kiếm đội cứu hộ gần nhất hoặc phù hợp và gửi đơn xin gia nhập.
                            </p>
                        </div>

                        {/* Search Input */}
                        <div className="relative max-w-md mx-auto">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                            <Input
                                placeholder="Nhập tên đội cứu hộ, địa chỉ..."
                                className="pl-11 h-12 bg-white border-slate-200/80 rounded-xl text-slate-950 placeholder:text-slate-400 shadow-sm focus-visible:ring-orange-500/30 text-sm"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        {/* Cards Grid */}
                        {filteredTeams.length === 0 ? (
                            <div className="text-center py-20 bg-slate-50 border border-slate-200/40 rounded-2xl max-w-md mx-auto">
                                <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                <p className="text-slate-500 font-medium">Không tìm thấy đội cứu hộ nào.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
                                {filteredTeams.map((team) => (
                                    <Card key={team.id} className="border-slate-200 hover:border-orange-500/30 hover:shadow-md transition-all duration-300 flex flex-col justify-between bg-white">
                                        <CardHeader className="pb-4">
                                            <div className="flex justify-between items-start gap-4">
                                                <div className="bg-slate-100 p-2.5 rounded-xl text-slate-600 border border-slate-200/40">
                                                    <Building2 className="w-5 h-5" />
                                                </div>
                                                <Badge
                                                    variant="secondary"
                                                    className={
                                                        team.status === 'AVAILABLE'
                                                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/50 hover:bg-emerald-50'
                                                            : 'bg-amber-50 text-amber-700 border border-amber-200/50 hover:bg-amber-50'
                                                    }
                                                >
                                                    {team.status === 'AVAILABLE' ? 'Sẵn sàng' : 'Bận'}
                                                </Badge>
                                            </div>
                                            <CardTitle className="text-lg font-black text-slate-900 mt-4 leading-snug">
                                                {team.teamName}
                                            </CardTitle>
                                            {team.description && (
                                                <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                                                    {team.description}
                                                </p>
                                            )}
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="space-y-2 border-t border-slate-50 pt-4 text-xs font-semibold text-slate-600">
                                                <div className="flex items-center gap-2">
                                                    <User className="w-4 h-4 text-slate-400 shrink-0" />
                                                    <span>Đội trưởng: <span className="text-slate-900 font-extrabold">{team.leader?.fullName || 'Chưa phân công'}</span></span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                                                    <span className="truncate" title={team.baseLocation?.address}>
                                                        Trụ sở: <span className="text-slate-900">{team.baseLocation?.address || 'Chưa cập nhật'}</span>
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Users className="w-4 h-4 text-slate-400 shrink-0" />
                                                    <span>Thành viên: <span className="text-slate-950 font-extrabold">{team.memberCount || 0} người</span></span>
                                                </div>
                                            </div>

                                            <Button
                                                onClick={() => setSelectedTeam(team)}
                                                className="w-full mt-4 bg-orange-600 hover:bg-orange-500 text-white font-bold h-10 shadow-sm"
                                            >
                                                <UserPlus className="w-4 h-4 mr-2" />
                                                Gửi đơn gia nhập
                                            </Button>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* JOIN MODAL DIALOG */}
            <Dialog open={!!selectedTeam} onOpenChange={(open) => !open && setSelectedTeam(null)}>
                <DialogContent className="sm:max-w-[450px] rounded-2xl bg-white text-slate-950">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-slate-900">
                            <UserPlus className="w-5 h-5 text-orange-600" />
                            Gửi yêu cầu gia nhập
                        </DialogTitle>
                        <DialogDescription className="text-slate-500">
                            Bạn đang xin gia nhập vào đội: <span className="font-extrabold text-slate-800">{selectedTeam?.teamName}</span>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 py-4">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                            Lời nhắn giới thiệu bản thân (Tùy chọn)
                        </label>
                        <Textarea
                            placeholder="Hãy viết một vài câu tự giới thiệu kinh nghiệm cứu hộ của bạn..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            maxLength={500}
                            rows={4}
                            className="bg-slate-50 border-slate-200 focus-visible:ring-orange-500/30 text-sm text-slate-950"
                        />
                        <div className="text-[10px] text-right font-medium text-slate-400">
                            {message.length}/500 ký tự
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setSelectedTeam(null)} className="text-slate-500">
                            Hủy
                        </Button>
                        <Button
                            onClick={handleApply}
                            disabled={createJoinMutation.isPending}
                            className="bg-orange-600 hover:bg-orange-500 text-white font-bold"
                        >
                            {createJoinMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Xác nhận gửi đơn
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
