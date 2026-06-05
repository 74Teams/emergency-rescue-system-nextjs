"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api/client";
import { apiRouteBuilders } from "@/lib/api/endpoints";
import { apiQueryKeys } from "@/lib/api/query-keys";
import { cn } from "@/lib/utils";

// Components từ Shadcn UI
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";

// Icons
import {
  ArrowLeft,
  UserPlus,
  UserMinus,
  Loader2,
  Mail,
  Shield,
  Search,
  Users,
  ShieldAlert,
  Activity,
  Filter,
  Lock,
  CheckCircle2,
  XCircle,
} from "lucide-react";

// Types
import type {
  ApiResponse,
  CommanderAccountSummary,
  RescueTeamMemberDTO,
  RescueTeamSummary,
} from "@/lib/api/types";

interface SafeAccountSummary extends CommanderAccountSummary {
  roles?: string[];
}

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
// Loại tình trạng đội của một rescuer trong danh sách chọn
type TeamAvailabilityFilter = "available" | "assigned" | "all";

// ============================================================
// HELPER: kiểm tra user có role Rescuer hoặc RescuerLeader
// ============================================================
function isRescuerOnly(account: SafeAccountSummary): boolean {
  const currentRoles = account.roles || account.role || [];
  const normalizedRoles = currentRoles.map((r) =>
    String(r).trim().toLowerCase()
  );

  const hasRescuer = normalizedRoles.includes("rescuer");
  const hasLeader = normalizedRoles.includes("rescuerleader");

  return hasRescuer && !hasLeader;
}

// ============================================================
// HELPER: kiểm tra user có đang thuộc một đội KHÁC không
// ============================================================
function isInAnotherTeam(
  account: SafeAccountSummary,
  currentTeamId: string,
  teamMemberIds: Set<string>,
): boolean {
  if (teamMemberIds.has(account.id)) return false;
  return !!(account.rescueTeamId && account.rescueTeamId !== currentTeamId);
}

// ============================================================
// HELPER: kiểm tra member có phải RescuerLeader không
// ============================================================
function isLeaderMember(member: RescueTeamMemberDTO): boolean {
  return (member.roles ?? []).some(
    (r) => String(r).trim().toLowerCase() === "rescuerleader",
  );
}

// ============================================================
// HELPER: kiểm tra account có phải RescuerLeader không
// ============================================================
function isLeaderRole(account: SafeAccountSummary): boolean {
  const currentRoles = account.roles || account.role || [];
  return currentRoles.some((r) => {
    const roleStr = String(r).trim().toLowerCase();
    return roleStr === "rescuerleader";
  });
}

export default function TeamManagementPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const teamId = params.teamId as string;

  // =========================================================================
  // STATES CHO BỘ LỌC
  // =========================================================================
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"active" | "locked" | "all">("active");
  const [availabilityFilter, setAvailabilityFilter] = useState<TeamAvailabilityFilter>("all");
  const [roleFilter, setRoleFilter] = useState<"all" | "leader" | "rescuer">("all");

  // =========================================================================
  // 1. FETCH DATA
  // =========================================================================
  const { data: teamDetail, isLoading: isLoadingTeam } =
    useQuery<RescueTeamSummary | null>({
      queryKey: apiQueryKeys.rescueTeams.detail(teamId),
      queryFn: async () => {
        const res = await apiRequest<ApiResponse<RescueTeamSummary>>({
          method: "GET",
          url: apiRouteBuilders.rescueTeams.byId(teamId),
        });
        return res?.data ?? null;
      },
    });

  const {
    data: teamMembersData,
    isLoading: isLoadingMembers,
    isFetching: isFetchingMembers,
  } = useQuery<RescueTeamMemberDTO[] | { items: RescueTeamMemberDTO[] } | null>(
    {
      queryKey: apiQueryKeys.rescueTeams.members(teamId),
      queryFn: async () => {
        const res = await apiRequest<ApiResponse<RescueTeamMemberDTO[]>>({
          method: "GET",
          url: apiRouteBuilders.rescueTeams.members(teamId),
        });
        return res?.data ?? null;
      },
    },
  );

  const {
    data: allAccountsData,
    isLoading: isLoadingAccounts,
    isFetching: isFetchingAccounts,
  } = useQuery<
    CommanderAccountSummary[] | { items: CommanderAccountSummary[] } | null
  >({
    queryKey: apiQueryKeys.users.all,
    queryFn: async () => {
      const res = await apiRequest<ApiResponse<CommanderAccountSummary[]>>({
        method: "GET",
        url: apiRouteBuilders.commander.users.list,
      });
      return res?.data ?? null;
    },
  });

  // =========================================================================
  // CHUẨN HÓA DỮ LIỆU ĐẦU RA
  // =========================================================================
  const actualTeamMembers = useMemo<RescueTeamMemberDTO[]>(() => {
    if (!teamMembersData) return [];
    if (Array.isArray(teamMembersData)) return teamMembersData;
    if ("items" in teamMembersData && Array.isArray(teamMembersData.items))
      return teamMembersData.items;
    return [];
  }, [teamMembersData]);

  const actualAllAccounts = useMemo<CommanderAccountSummary[]>(() => {
    if (!allAccountsData) return [];
    if (Array.isArray(allAccountsData)) return allAccountsData;
    if ("items" in allAccountsData && Array.isArray(allAccountsData.items))
      return allAccountsData.items;
    return [];
  }, [allAccountsData]);

  // Set ID member hiện tại để tra cứu nhanh
  const teamMemberIdSet = useMemo<Set<string>>(
    () => new Set(actualTeamMembers.map((m) => m.id)),
    [actualTeamMembers],
  );

  // Phân tách biên chế thành 2 nhóm
  const leaderMembers = useMemo(
    () => actualTeamMembers.filter(isLeaderMember),
    [actualTeamMembers],
  );
  const rescuerMembers = useMemo(
    () => actualTeamMembers.filter((m) => !isLeaderMember(m)),
    [actualTeamMembers],
  );

  // =========================================================================
  // 2. MUTATIONS
  // =========================================================================
  const addMemberMutation = useMutation({
    mutationFn: (memberId: string) =>
      apiRequest<ApiResponse<unknown>>({
        method: "POST",
        url: apiRouteBuilders.rescueTeams.member(teamId, memberId),
      }),
    onSuccess: () => {
      toast.success("Đã điều động nhân sự vào đội hình thành công!");
      queryClient.invalidateQueries({ queryKey: apiQueryKeys.rescueTeams.all });
      queryClient.invalidateQueries({
        queryKey: apiQueryKeys.rescueTeams.members(teamId),
      });
      queryClient.invalidateQueries({ queryKey: apiQueryKeys.users.all });
    },
    onError: (
      error: Error & { response?: { data?: { message?: string } } },
    ) => {
      toast.error(
        error?.response?.data?.message || "Không thể điều động nhân sự này.",
      );
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: (memberId: string) =>
      apiRequest<ApiResponse<unknown>>({
        method: "DELETE",
        url: apiRouteBuilders.rescueTeams.member(teamId, memberId),
      }),
    onSuccess: () => {
      toast.success("Đã rút nhân sự khỏi biên chế đội hình.");
      queryClient.invalidateQueries({ queryKey: apiQueryKeys.rescueTeams.all });
      queryClient.invalidateQueries({
        queryKey: apiQueryKeys.rescueTeams.members(teamId),
      });
      queryClient.invalidateQueries({ queryKey: apiQueryKeys.users.all });
    },
    onError: (
      error: Error & { response?: { data?: { message?: string } } },
    ) => {
      toast.error(
        error?.response?.data?.message || "Thao tác rút nhân sự thất bại.",
      );
    },
  });

  // =========================================================================
  // 3. LOGIC LỌC — CHỈ HIỂN THỊ RESCUER ở cột trái
  // =========================================================================
  const rescuerAccounts = useMemo<SafeAccountSummary[]>(() => {
    const safeAccounts = actualAllAccounts as SafeAccountSummary[];
    return safeAccounts.filter((account) => {
      if (!account.id) return false;
      if (!isRescuerOnly(account)) return false;
      if (teamMemberIdSet.has(account.id)) return false;
      return true;
    });
  }, [actualAllAccounts, teamMemberIdSet]);

  const filteredRescuers = useMemo<SafeAccountSummary[]>(() => {
    let list = rescuerAccounts;

    if (statusFilter === "active") list = list.filter((a) => a.isActive);
    if (statusFilter === "locked") list = list.filter((a) => !a.isActive);

    if (availabilityFilter === "available") {
      list = list.filter((a) => !a.rescueTeamId);
    } else if (availabilityFilter === "assigned") {
      list = list.filter((a) => a.rescueTeamId && a.rescueTeamId !== teamId);
    }

    if (roleFilter === "leader") {
      list = list.filter(isLeaderRole);
    } else if (roleFilter === "rescuer") {
      list = list.filter((a) => !isLeaderRole(a));
    }

    if (searchTerm.trim()) {
      const kw = searchTerm.toLowerCase();
      list = list.filter(
        (a) =>
          (a.fullName || a.username || "").toLowerCase().includes(kw) ||
          (a.email || "").toLowerCase().includes(kw),
      );
    }

    return [...list].sort((a, b) => {
      // Đội trưởng (Leader) lên trước, sau đó khả dụng lên trước
      const aIsLeader = isLeaderRole(a) ? 0 : 1;
      const bIsLeader = isLeaderRole(b) ? 0 : 1;
      if (aIsLeader !== bIsLeader) return aIsLeader - bIsLeader;

      const aFree = !a.rescueTeamId ? 0 : 1;
      const bFree = !b.rescueTeamId ? 0 : 1;
      return aFree - bFree;
    });
  }, [rescuerAccounts, statusFilter, availabilityFilter, roleFilter, searchTerm, teamId]);

  // Thống kê nhanh
  const stats = useMemo(() => {
    const total = rescuerAccounts.length;
    const available = rescuerAccounts.filter((a) => !a.rescueTeamId).length;
    const assigned = total - available;
    return { total, available, assigned };
  }, [rescuerAccounts]);

  // =========================================================================
  // HELPER: Avatar initials
  // =========================================================================
  const getInitials = (name?: string) => {
    if (!name) return "CH";
    const parts = name.trim().split(" ");
    if (parts.length > 1) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const isLoading =
    isLoadingAccounts ||
    isLoadingMembers ||
    isFetchingAccounts ||
    isFetchingMembers;

  return (
    <TooltipProvider>
      <div className="p-6 max-w-[1600px] mx-auto space-y-6 bg-slate-50/50 min-h-screen animate-in fade-in duration-200">
        {/* HEADER BAR */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.back()}
              className="rounded-xl border-slate-200 hover:bg-slate-50 transition-all shadow-sm h-10 w-10 shrink-0"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-600 px-2.5 py-0.5 rounded-md border border-blue-100">
                  Chỉ Huy Đơn Vị
                </span>
                <span className="text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-md">
                  Biên Chế Nhân Sự
                </span>
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
                {isLoadingTeam ? (
                  <div className="h-7 w-48 bg-slate-200 animate-pulse rounded-md" />
                ) : (
                  `Điều Động Đội Hình: ${teamDetail?.teamName || "Đội Cứu Hộ"}`
                )}
              </h1>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* ================================================================= */}
          {/* CỘT TRÁI: DANH SÁCH CỨU HỘ VIÊN SẴN CÓ                          */}
          {/* ================================================================= */}
          <div className="xl:col-span-7">
            <Card className="shadow-sm border-slate-200/90 bg-white rounded-2xl overflow-hidden flex flex-col min-h-[600px]">
              {/* Header của Card: Title + Mini Summary Stats */}
              <CardHeader className="border-b border-slate-100 p-5 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base font-black text-slate-800 flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    Lực Lượng Cứu Hộ Hệ Thống
                  </CardTitle>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    Danh sách toàn bộ Chỉ huy và Cứu hộ viên ngoài biên chế đội hiện tại
                  </p>
                </div>

                {/* Mini Summary Stats Pills (thay thế cho 3 card thống kê cồng kềnh) */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
                    Tổng: {stats.total}
                  </span>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                    Khả dụng: {stats.available}
                  </span>
                  <span className="text-xs font-bold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-200/60">
                    Đội khác: {stats.assigned}
                  </span>
                </div>
              </CardHeader>

              <CardContent className="p-0 flex flex-col flex-1">
                {/* Thanh công cụ lọc tích hợp (Toolbar) */}
                <div className="p-4 bg-slate-50/20 border-b border-slate-100 flex flex-col lg:flex-row gap-3 items-center justify-between">
                  {/* Tìm kiếm */}
                  <div className="relative w-full lg:w-72 shrink-0">
                    <Search
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                      size={16}
                    />
                    <Input
                      className="pl-9 bg-white border-slate-200 rounded-xl text-sm h-9"
                      placeholder="Tìm theo Tên, Email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  {/* Các bộ lọc */}
                  <div className="flex gap-2 w-full lg:w-auto justify-end flex-wrap">
                    {/* Lọc Tình trạng */}
                    <Select
                      value={availabilityFilter}
                      onValueChange={(v) =>
                        setAvailabilityFilter(v as TeamAvailabilityFilter)
                      }
                    >
                      <SelectTrigger className="w-[150px] bg-white border-slate-200 rounded-xl text-xs h-9">
                        <Filter size={12} className="mr-1.5 text-slate-400" />
                        <SelectValue placeholder="Tình trạng đội" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all" className="text-xs font-semibold">Tất cả trạng thái</SelectItem>
                        <SelectItem value="available" className="text-xs">✅ Chưa có đội (khả dụng)</SelectItem>
                        <SelectItem value="assigned" className="text-xs">🔒 Đã thuộc đội khác</SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Lọc Vai trò */}
                    <Select
                      value={roleFilter}
                      onValueChange={(v) =>
                        setRoleFilter(v as "all" | "leader" | "rescuer")
                      }
                    >
                      <SelectTrigger className="w-[140px] bg-white border-slate-200 rounded-xl text-xs h-9">
                        <Shield size={12} className="mr-1.5 text-slate-400" />
                        <SelectValue placeholder="Vai trò" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all" className="text-xs font-semibold">Tất cả vai trò</SelectItem>
                        <SelectItem value="leader" className="text-xs">👑 Đội trưởng (Leader)</SelectItem>
                        <SelectItem value="rescuer" className="text-xs">🏃 Cứu hộ viên (Rescuer)</SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Lọc Tài khoản */}
                    <Select
                      value={statusFilter}
                      onValueChange={(v) =>
                        setStatusFilter(v as "active" | "locked" | "all")
                      }
                    >
                      <SelectTrigger className="w-[135px] bg-white border-slate-200 rounded-xl text-xs h-9">
                        <Activity size={12} className="mr-1.5 text-slate-400" />
                        <SelectValue placeholder="Trạng thái TK" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active" className="text-xs">Đang hoạt động</SelectItem>
                        <SelectItem value="locked" className="text-xs">Bị khóa</SelectItem>
                        <SelectItem value="all" className="text-xs font-semibold">Mọi tài khoản</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Danh sách nhân sự khả dụng dạng List */}
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-24 gap-3 flex-1">
                    <Loader2 className="animate-spin text-blue-600 w-8 h-8" />
                    <p className="text-xs font-semibold text-slate-400">
                      Đang đồng bộ dữ liệu lực lượng...
                    </p>
                  </div>
                ) : filteredRescuers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-24 px-6 text-center flex-1">
                    <ShieldAlert className="w-10 h-10 text-slate-300 mb-2" />
                    <p className="text-sm font-bold text-slate-700">
                      Không tìm thấy nhân sự phù hợp
                    </p>
                    <p className="text-xs text-slate-400 mt-1 max-w-[280px] mx-auto">
                      Hãy thay đổi từ khóa tìm kiếm hoặc điều chỉnh các bộ lọc ở trên.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 max-h-[650px] overflow-y-auto">
                    {filteredRescuers.map((account) => {
                      const inOtherTeam = isInAnotherTeam(
                        account,
                        teamId,
                        teamMemberIdSet,
                      );
                      const isLeader = isLeaderRole(account);
                      const canAdd =
                        !inOtherTeam &&
                        account.isActive &&
                        !addMemberMutation.isPending;

                      return (
                        <div
                          key={account.id}
                          className={cn(
                            "flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-4 transition-all",
                            inOtherTeam ? "bg-slate-100/80 grayscale opacity-60" : "hover:bg-slate-50/50"
                          )}
                        >
                          {/* Khối Thông tin nhân sự */}
                          <div className="flex items-start gap-3 min-w-0">
                            {/* Avatar với vòng trạng thái */}
                            <div className="relative shrink-0">
                              <Avatar
                                className={cn(
                                  "h-10 w-10 border shadow-sm",
                                  inOtherTeam
                                    ? "border-slate-200 bg-slate-100"
                                    : isLeader
                                      ? "border-amber-200 bg-amber-50"
                                      : "border-blue-100 bg-blue-50/30",
                                )}
                              >
                                <AvatarFallback
                                  className={cn(
                                    "font-bold text-xs",
                                    inOtherTeam
                                      ? "bg-slate-100 text-slate-400"
                                      : isLeader
                                        ? "bg-amber-100/60 text-amber-700"
                                        : "bg-blue-50 text-blue-700",
                                  )}
                                >
                                  {getInitials(account.fullName || account.username)}
                                </AvatarFallback>
                              </Avatar>
                              <span
                                className={cn(
                                  "absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full ring-2 ring-white",
                                  !account.isActive
                                    ? "bg-rose-400"
                                    : inOtherTeam
                                      ? "bg-slate-300"
                                      : "bg-emerald-400",
                                )}
                              />
                            </div>

                            {/* Tên + Email + Vai trò */}
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p
                                  className={cn(
                                    "font-bold text-sm",
                                    inOtherTeam ? "text-slate-500" : "text-slate-800",
                                  )}
                                >
                                  {account.fullName || account.username}
                                </p>

                                {isLeader ? (
                                  <span className="inline-flex items-center gap-0.5 text-[9px] font-black uppercase tracking-wider bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded border border-amber-200">
                                    <Shield className="w-2.5 h-2.5" /> Chỉ huy (Leader)
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-0.5 text-[9px] font-black uppercase tracking-wider bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-100">
                                    <Users className="w-2.5 h-2.5" /> Cứu hộ viên
                                  </span>
                                )}
                              </div>

                              <p className="text-xs text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                                <Mail className="w-3 h-3 text-slate-300" />
                                {account.email}
                              </p>
                            </div>
                          </div>

                          {/* Khối Trạng thái & Hành động */}
                          <div className="flex items-center gap-3 sm:justify-end shrink-0">
                            {/* Trạng thái Tổng hợp */}
                            <div className="text-right hidden sm:block">
                              {!account.isActive ? (
                                <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-500 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-100">
                                  <XCircle className="w-3.5 h-3.5" /> Bị khóa
                                </span>
                              ) : inOtherTeam ? (
                                <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                                  <Lock className="w-3.5 h-3.5" /> Đội khác
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Khả dụng
                                </span>
                              )}
                            </div>

                            {/* Nút hành động */}
                            {inOtherTeam ? (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="inline-block">
                                    <Button
                                      size="sm"
                                      disabled
                                      className="h-8 rounded-lg font-bold px-3 bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed text-xs"
                                    >
                                      <Lock className="w-3 h-3 mr-1" />
                                      Đội khác
                                    </Button>
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent
                                  side="left"
                                  className="bg-slate-800 text-white text-xs max-w-[200px]"
                                >
                                  Nhân sự đã được biên chế sang đội khác, không thể điều động.
                                </TooltipContent>
                              </Tooltip>
                            ) : (
                              <Button
                                size="sm"
                                className={cn(
                                  "h-8 rounded-lg font-bold px-3 text-xs transition-all",
                                  account.isActive
                                    ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                                    : "bg-slate-100 text-slate-400 cursor-not-allowed hover:bg-slate-100 border border-slate-200",
                                )}
                                onClick={() =>
                                  canAdd &&
                                  addMemberMutation.mutate(account.id)
                                }
                                disabled={!canAdd}
                              >
                                <UserPlus className="w-3.5 h-3.5 mr-1" />
                                Điều động
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ================================================================= */}
          {/* CỘT PHẢI: BIÊN CHẾ ĐỘI HIỆN TẠI (Phân tách Leader / Rescuer rõ rệt) */}
          {/* ================================================================= */}
          <div className="xl:col-span-5">
            <Card className="shadow-md border-slate-200/90 bg-white rounded-2xl overflow-hidden sticky top-6">
              {/* Header Roster */}
              <CardHeader className="bg-slate-900 text-white p-5">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-base font-black flex items-center gap-2">
                    <Shield className="w-5 h-5 text-blue-400" /> Biên chế đơn vị
                  </CardTitle>
                  <Badge className="bg-blue-600 text-white font-black text-xs px-3 py-1 rounded-lg border-none">
                    {actualTeamMembers.length} Quân số
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                {isLoadingMembers ? (
                  <div className="flex justify-center py-20">
                    <Loader2 className="animate-spin text-slate-500 w-6 h-6" />
                  </div>
                ) : actualTeamMembers.length === 0 ? (
                  <div className="text-center py-20 px-6 space-y-3">
                    <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto border border-slate-100">
                      <ShieldAlert className="w-5 h-5 text-slate-400" />
                    </div>
                    <p className="text-sm font-bold text-slate-700">
                      Chưa có nhân sự biên chế
                    </p>
                    <p className="text-xs text-slate-400 max-w-[240px] mx-auto">
                      Chọn và điều động Chỉ huy hoặc Cứu hộ viên từ bảng danh sách bên trái.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">

                    {/* ──────────────────────────────────────────────────────── */}
                    {/* PHẦN 1: BAN CHỈ HUY ĐỘI HÌNH (Command Tier)             */}
                    {/* ──────────────────────────────────────────────────────── */}
                    <div className="p-4 bg-gradient-to-br from-amber-50/70 to-orange-50/40 border-b border-amber-100">
                      <div className="flex items-center gap-2 mb-3">
                        <Shield className="w-4.5 h-4.5 text-amber-600" />
                        <span className="text-[11px] font-black uppercase tracking-wider text-amber-800 font-bold">
                          Ban Chỉ Huy Đội hình
                        </span>
                        <Badge className="ml-auto bg-amber-100 text-amber-800 border border-amber-200 font-black text-[10px] px-2 py-0 h-4">
                          {leaderMembers.length} Chỉ huy
                        </Badge>
                      </div>

                      {leaderMembers.length === 0 ? (
                        /* Cảnh báo thiếu chỉ huy đội hình */
                        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-100/50 border border-amber-200 text-amber-800">
                          <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                          <div>
                            <p className="text-xs font-bold">Chưa có Chỉ huy đội!</p>
                            <p className="text-[10px] text-amber-700 font-medium mt-0.5 animate-pulse">
                              Đội hình cần ít nhất một Đội trưởng (Rescuer Leader) để dẫn dắt các hoạt động cứu hộ.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {leaderMembers.map((member) => (
                            <div
                              key={member.id}
                              className="flex items-center justify-between p-3 bg-white border border-amber-200/80 rounded-xl shadow-sm hover:border-amber-300 transition-colors"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <Avatar className="h-9 w-9 border-2 border-amber-200 shrink-0">
                                  <AvatarFallback className="bg-amber-50 text-amber-700 font-bold text-xs">
                                    {getInitials(member.fullName)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <p className="text-xs font-extrabold text-slate-800 truncate">
                                      {member.fullName}
                                    </p>
                                    <span className="shrink-0 text-[8px] font-black uppercase tracking-wider bg-amber-100 text-amber-700 px-1 py-0.5 rounded border border-amber-200">
                                      Leader
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-slate-400 truncate flex items-center gap-0.5 mt-0.5">
                                    <Mail className="w-3 h-3 text-slate-300 shrink-0" />
                                    {member.email}
                                  </p>
                                </div>
                              </div>

                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="inline-block shrink-0">
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      disabled
                                      className="h-8 w-8 rounded-lg border-amber-100 text-amber-400 cursor-not-allowed bg-amber-50/50"
                                    >
                                      <Lock className="w-3.5 h-3.5" />
                                    </Button>
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent
                                  side="left"
                                  className="bg-slate-800 text-white text-[11px]"
                                >
                                  Chỉ huy không thể rút trực tiếp tại đây.
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* ──────────────────────────────────────────────────────── */}
                    {/* PHẦN 2: LỰC LƯỢNG CỨU HỘ VIÊN (Operational Tier)        */}
                    {/* ──────────────────────────────────────────────────────── */}
                    <div className="p-4 bg-white">
                      <div className="flex items-center gap-2 mb-3">
                        <Users className="w-4.5 h-4.5 text-blue-600" />
                        <span className="text-[11px] font-black uppercase tracking-wider text-slate-600 font-bold">
                          Lực Lượng Cứu Hộ Viên
                        </span>
                        <Badge className="ml-auto bg-blue-50 text-blue-700 border border-blue-100 font-black text-[10px] px-2 py-0 h-4">
                          {rescuerMembers.length} Quân số
                        </Badge>
                      </div>

                      {rescuerMembers.length === 0 ? (
                        <div className="text-center py-8 text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl bg-slate-50/30">
                          Chưa có Cứu hộ viên. Hãy thêm từ danh sách.
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                          {rescuerMembers.map((member) => (
                            <div
                              key={member.id}
                              className="flex items-center justify-between p-3 border border-slate-100 rounded-xl hover:bg-slate-50/50 transition-colors"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <Avatar className="h-9 w-9 border border-slate-100 shrink-0">
                                  <AvatarFallback className="bg-blue-50 text-blue-700 font-bold text-xs">
                                    {getInitials(member.fullName)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <p className="text-xs font-bold text-slate-700 truncate">
                                      {member.fullName}
                                    </p>
                                    <span className="shrink-0 text-[8px] font-bold uppercase tracking-wider bg-blue-50 text-blue-600 px-1 py-0.5 rounded border border-blue-100">
                                      Rescuer
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-slate-400 truncate flex items-center gap-0.5 mt-0.5">
                                    <Mail className="w-3 h-3 text-slate-300 shrink-0" />
                                    {member.email}
                                  </p>
                                </div>
                              </div>

                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8 text-rose-500 border-rose-100 hover:text-rose-700 hover:bg-rose-50 rounded-lg shrink-0 transition-colors"
                                    onClick={() =>
                                      removeMemberMutation.mutate(member.id)
                                    }
                                    disabled={removeMemberMutation.isPending}
                                  >
                                    <UserMinus className="w-3.5 h-3.5" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent
                                  side="left"
                                  className="bg-slate-800 text-white text-[11px]"
                                >
                                  Rút khỏi biên chế đội
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
