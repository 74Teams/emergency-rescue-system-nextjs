"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api/client";
import { apiRouteBuilders } from "@/lib/api/endpoints";
import { apiQueryKeys } from "@/lib/api/query-keys";
import { ROLE_BADGES } from "@/types/dashboards/commander";
import { cn } from "@/lib/utils";

// Components từ Shadcn UI
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Eye,
} from "lucide-react";

// Types mã hóa nghiêm ngặt từ file types.ts
import type {
  ApiResponse,
  CommanderAccountSummary,
  RescueTeamMemberDTO,
  RescueTeamSummary,
} from "@/lib/api/types";

// Tạo interface mở rộng cục bộ để xử lý an toàn cả 2 trường hợp role/roles từ API mà không dùng any
interface SafeAccountSummary extends CommanderAccountSummary {
  roles?: string[];
}

export default function TeamManagementPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const teamId = params.teamId as string;

  // =========================================================================
  // STATES CHO BỘ LỌC NÂNG CAO
  // =========================================================================
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("active");

  // =========================================================================
  // 1. FETCH DATA (STRICT TYPES - KHÔNG ANY)
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
  // CHUẨN HÓA MẢNG DỮ LIỆU ĐẦU RA
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

  // =========================================================================
  // 2. MUTATIONS (THAO TÁC ĐIỀU ĐỘNG)
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
  // 3. LOGIC LỌC TÍCH HỢP CHUẨN ĐOÁN (KHÔNG CÒN LỖI LỆCH ROLE)
  // =========================================================================
  const eligibleAccounts = useMemo<SafeAccountSummary[]>(() => {
    const safeAccounts = actualAllAccounts as SafeAccountSummary[];

    return safeAccounts.filter((account) => {
      const accId = account.id;
      if (!accId) return false;

      // Hợp nhất dữ liệu tránh lệch thuộc tính giữa các API endpoint
      const currentRoles = account.roles || account.role || [];

      // [RULE 1] LỌC LÕI NGHIỆP VỤ: Chặn hoàn toàn Rescuer và RescuerLeader xuất hiện
      const hasRestrictedRole = currentRoles.some((r) => {
        const roleStr = String(r).trim().toLowerCase();
        return roleStr === "rescuer" || roleStr === "rescuerleader";
      });
      if (hasRestrictedRole) return false;

      // [RULE 2] Loại bỏ người đã nằm trong biên chế đội này rồi
      if (actualTeamMembers.some((member) => member.id === accId)) return false;

      // [RULE 3] Lọc theo Trạng thái hoạt động tài khoản
      if (statusFilter === "active" && !account.isActive) return false;
      if (statusFilter === "locked" && account.isActive) return false;

      // [RULE 4] Lọc theo Vai trò chỉ định trên Dropdown
      if (roleFilter !== "all") {
        if (roleFilter === "none") {
          if (currentRoles.length > 0) return false;
        } else {
          const hasSelectedRole = currentRoles.some((r) => {
            return String(r).trim().toLowerCase() === roleFilter.toLowerCase();
          });
          if (!hasSelectedRole) return false;
        }
      }

      // [RULE 5] Lọc theo Từ khóa tìm kiếm chữ
      const searchLower = searchTerm.toLowerCase();
      const fullName = (
        account.fullName ||
        account.username ||
        ""
      ).toLowerCase();
      const email = (account.email || "").toLowerCase();

      return (
        searchTerm === "" ||
        fullName.includes(searchLower) ||
        email.includes(searchLower)
      );
    });
  }, [
    actualAllAccounts,
    actualTeamMembers,
    searchTerm,
    roleFilter,
    statusFilter,
  ]);

  const getInitials = (name?: string) => {
    if (!name) return "CH";
    const parts = name.trim().split(" ");
    if (parts.length > 1) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
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
        {/* ========================================================== */}
        {/* CỘT TRÁI: KHO NGUỒN NHÂN LỰC SẴN CÓ + BỘ LỌC CHUẨN */}
        {/* ========================================================== */}
        <div className="xl:col-span-7 space-y-4">
          {/* THANH CÔNG CỤ LỌC */}
          <Card className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm border-slate-200/90 rounded-2xl bg-white">
            <div className="relative w-full md:w-80">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={18}
              />
              <Input
                className="pl-10 bg-slate-50/50 rounded-xl"
                placeholder="Tìm theo Tên, Email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-3 w-full md:w-auto">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[170px] bg-slate-50/50 rounded-xl">
                  <Filter size={14} className="mr-2 text-slate-500" />
                  <SelectValue placeholder="Lọc Vai trò" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="font-bold">
                    Mọi vai trò
                  </SelectItem>
                  <SelectItem value="Commander">Chỉ huy (Commander)</SelectItem>
                  <SelectItem value="Dispatcher">
                    Điều phối (Dispatcher)
                  </SelectItem>
                  <SelectItem value="Citizen">Người dân (Citizen)</SelectItem>
                  <SelectItem value="none">Chưa có vai trò</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px] bg-slate-50/50 rounded-xl">
                  <Activity size={14} className="mr-2 text-slate-500" />
                  <SelectValue placeholder="Lọc trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="font-bold">
                    Mọi trạng thái
                  </SelectItem>
                  <SelectItem value="active">Đang hoạt động</SelectItem>
                  <SelectItem value="locked">Bị khóa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>

          {/* BẢNG DANH SÁCH NHÂN SỰ */}
          <Card className="shadow-sm border-slate-200/90 bg-white rounded-2xl overflow-hidden">
            <CardHeader className="border-b border-slate-100 p-4 bg-slate-50/50 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" /> Kết quả tìm kiếm
              </CardTitle>
              <Badge
                variant="secondary"
                className="bg-blue-100 text-blue-800 font-bold border-none"
              >
                {eligibleAccounts.length} khả dụng
              </Badge>
            </CardHeader>
            <CardContent className="p-0">
              {isLoadingAccounts ||
              isLoadingMembers ||
              isFetchingAccounts ||
              isFetchingMembers ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <Loader2 className="animate-spin text-blue-600 w-8 h-8" />
                  <p className="text-sm font-medium text-slate-400">
                    Đang đồng bộ dữ liệu...
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-slate-50/30">
                      <TableRow className="border-b border-slate-100">
                        <TableHead className="pl-5 font-bold text-slate-600">
                          Nhân sự
                        </TableHead>
                        <TableHead className="font-bold text-slate-600">
                          Vai trò
                        </TableHead>
                        <TableHead className="font-bold text-slate-600">
                          Trạng thái
                        </TableHead>
                        <TableHead className="pr-5 font-bold text-slate-600 text-right">
                          Hành động
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {eligibleAccounts.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={4}
                            className="text-center py-16 text-slate-400 font-medium"
                          >
                            Không tìm thấy nhân sự khả dụng với bộ lọc hiện tại.
                          </TableCell>
                        </TableRow>
                      ) : (
                        eligibleAccounts.map((account) => {
                          const currentRoles =
                            account.roles || account.role || [];

                          return (
                            <TableRow
                              key={account.id}
                              className="border-b border-slate-100/60 hover:bg-slate-50/50 transition-colors"
                            >
                              <TableCell className="pl-5 py-3.5">
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-10 w-10 border border-slate-200 shadow-sm bg-white">
                                    <AvatarFallback className="bg-slate-100 text-slate-600 font-bold">
                                      {getInitials(
                                        account.fullName || account.username,
                                      )}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-bold text-sm text-slate-900">
                                      {account.fullName || account.username}
                                    </p>
                                    <p className="text-xs text-slate-500 font-medium">
                                      {account.email}
                                    </p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="py-3.5">
                                <div className="flex gap-1.5 flex-wrap">
                                  {currentRoles.length > 0 ? (
                                    currentRoles.map((r) => {
                                      const roleName = String(r);
                                      const roleStyle = ROLE_BADGES[
                                        roleName
                                      ] || {
                                        text: roleName,
                                        color:
                                          "bg-slate-50 text-slate-600 border border-slate-200",
                                      };
                                      return (
                                        <Badge
                                          key={roleName}
                                          variant="outline"
                                          className={cn(
                                            "text-[10px] px-2 py-0.5 rounded-md uppercase font-bold border-none shadow-sm",
                                            roleStyle.color,
                                          )}
                                        >
                                          {roleStyle.text}
                                        </Badge>
                                      );
                                    })
                                  ) : (
                                    <span className="text-xs text-slate-400 font-medium italic">
                                      - Chưa có -
                                    </span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="py-3.5">
                                <div className="flex items-center gap-2">
                                  <span
                                    className={cn(
                                      "w-2 h-2 rounded-full",
                                      account.isActive
                                        ? "bg-emerald-500"
                                        : "bg-rose-500",
                                    )}
                                  ></span>
                                  <span
                                    className={cn(
                                      "text-xs font-bold",
                                      account.isActive
                                        ? "text-emerald-600"
                                        : "text-rose-600",
                                    )}
                                  >
                                    {account.isActive ? "Hoạt động" : "Bị khóa"}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="pr-5 py-3.5 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 border-slate-200"
                                    title="Xem hồ sơ chi tiết"
                                    onClick={() =>
                                      toast.info(
                                        `Đang mở hồ sơ: ${account.fullName || account.username}`,
                                      )
                                    }
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>

                                  <Button
                                    size="sm"
                                    className={cn(
                                      "h-8 rounded-lg font-bold px-3 transition-all",
                                      account.isActive
                                        ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                                        : "bg-slate-100 text-slate-400 cursor-not-allowed hover:bg-slate-100",
                                    )}
                                    onClick={() =>
                                      addMemberMutation.mutate(account.id)
                                    }
                                    disabled={
                                      addMemberMutation.isPending ||
                                      !account.isActive
                                    }
                                  >
                                    <UserPlus className="w-4 h-4 mr-1.5" /> Thêm
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ========================================================== */}
        {/* CỘT PHẢI: BIÊN CHẾ ĐƠN VỊ HIỆN TẠI (Dùng phẳng RescueTeamMemberDTO) */}
        {/* ========================================================== */}
        <div className="xl:col-span-5">
          <Card className="shadow-md border-slate-200/80 bg-white rounded-2xl overflow-hidden sticky top-6">
            <CardHeader className="bg-slate-900 text-white p-5">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-base font-black flex items-center gap-2">
                    <Shield className="w-5 h-5 text-blue-400" /> Biên chế đơn vị
                  </CardTitle>
                </div>
                <Badge className="bg-blue-500 text-white font-black text-xs px-3 py-1 rounded-lg border-none">
                  {actualTeamMembers.length} Quân số
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoadingMembers ? (
                <div className="flex justify-center py-16">
                  <Loader2 className="animate-spin text-slate-500 w-6 h-6" />
                </div>
              ) : actualTeamMembers.length === 0 ? (
                <div className="text-center py-20 px-6 space-y-3">
                  <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto border border-slate-100">
                    <ShieldAlert className="w-5 h-5 text-slate-400" />
                  </div>
                  <p className="text-sm font-bold text-slate-700">
                    Chưa có biên chế
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
                  {actualTeamMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-4 hover:bg-slate-50/60 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar className="h-9 w-9 border border-slate-100 shrink-0">
                          <AvatarFallback className="bg-slate-100 text-slate-700 font-bold text-xs">
                            {getInitials(member.fullName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-900 truncate">
                            {member.fullName || "Cứu hộ viên"}
                          </p>
                          <p className="text-xs text-slate-500 truncate flex items-center gap-1 mt-0.5">
                            <Mail className="w-3 h-3 text-slate-400" />{" "}
                            {member.email}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        className="text-rose-500 border-rose-100 hover:text-rose-700 hover:bg-rose-50 rounded-xl"
                        onClick={() => removeMemberMutation.mutate(member.id)}
                        disabled={removeMemberMutation.isPending}
                      >
                        <UserMinus className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
