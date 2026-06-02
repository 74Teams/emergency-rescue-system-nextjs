"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useTeamMembersQuery,
  useCreateMissionMutation,
  useChangeRequestStatusMutation,
  emergencyTypeLabels,
} from "@/lib/api/features/requests/dispatcher.queries";
import { useProfileQuery } from "@/lib/api/use-profile";
import type { RescueTeamSummary, RequestSummary, MissionSummary } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  ChevronRight,
  Mail,
  Phone,
  Shield,
  UserCheck,
  Users,
  MapPin,
  Send,
  Loader2,
} from "lucide-react";
import { useState, useEffect } from "react";
import { dictTeamStatus } from "@/constants/dictionary";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/api/client";

interface Props {
  teams: RescueTeamSummary[];
  requests?: RequestSummary[];
  missions?: MissionSummary[];
  initialTeamId?: string | null;
}

const teamStatusLabels: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  AVAILABLE: {
    label: dictTeamStatus.AVAILABLE,
    color: "text-emerald-700",
    bg: "bg-emerald-50",
  },
  ON_MISSION: {
    label: dictTeamStatus.ON_MISSION,
    color: "text-blue-700",
    bg: "bg-blue-50",
  },
  UNAVAILABLE: {
    label: dictTeamStatus.UNAVAILABLE,
    color: "text-red-700",
    bg: "bg-red-50",
  },
  MAINTENANCE: {
    label: dictTeamStatus.MAINTENANCE,
    color: "text-orange-700",
    bg: "bg-orange-50",
  },
  // Fallback
  INACTIVE: {
    label: "Không HĐ",
    color: "text-slate-500",
    bg: "bg-slate-100",
  },
};

// ─── TEAM LIST VIEW ─────────────────────────────────────
function TeamListView({
  teams,
  missions = [],
  onSelectTeam,
}: {
  teams: RescueTeamSummary[];
  missions?: MissionSummary[];
  onSelectTeam: (team: RescueTeamSummary) => void;
}) {
  const active = teams.filter((t) => {
    const hasActiveMission = missions.some(m => m.rescueTeamId === t.id && ["ASSIGNED", "EN_ROUTE", "ON_SITE", "IN_PROGRESS"].includes(m.status));
    return t.status === "AVAILABLE" || t.status === "ON_MISSION" || hasActiveMission;
  }).length;
  const totalMembers = teams.reduce((sum, t) => sum + (t.memberCount ?? 0), 0);

  return (
    <div className="flex flex-col gap-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="size-4 text-blue-500" />
            <p className="text-[10px] font-bold text-slate-400 uppercase">
              Tổng đội
            </p>
          </div>
          <p className="text-xl font-black text-slate-700">{teams.length}</p>
        </div>
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <UserCheck className="size-4 text-emerald-500" />
            <p className="text-[10px] font-bold text-slate-400 uppercase">
              Đang HĐ
            </p>
          </div>
          <p className="text-xl font-black text-emerald-600">{active}</p>
        </div>
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Users className="size-4 text-violet-500" />
            <p className="text-[10px] font-bold text-slate-400 uppercase">
              Tổng TV
            </p>
          </div>
          <p className="text-xl font-black text-violet-600">{totalMembers}</p>
        </div>
      </div>

      {/* Team Cards */}
      <ScrollArea className="h-[calc(100vh-380px)]">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {teams.map((team) => {
            const hasActiveMission = missions.some(m => m.rescueTeamId === team.id && ["ASSIGNED", "EN_ROUTE", "ON_SITE", "IN_PROGRESS"].includes(m.status));
            const st = hasActiveMission 
              ? teamStatusLabels.ON_MISSION 
              : (teamStatusLabels[team.status] ?? teamStatusLabels.INACTIVE);
            
            return (
              <button
                type="button"
                key={team.id}
                onClick={() => onSelectTeam(team)}
                className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all text-left cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="size-10 bg-gradient-to-br from-blue-500 to-blue-700 text-white rounded-xl flex items-center justify-center font-black text-sm shadow-sm">
                      {(team.teamName ?? "??").substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">
                        {team.teamName}
                      </h4>
                      {team.leader && (
                        <p className="text-[11px] text-slate-500">
                          Đội trưởng:{" "}
                          <span className="font-bold">
                            {team.leader.fullName}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge
                    className={`${st.bg} ${st.color} border-none font-bold text-[10px]`}
                  >
                    {st.label}
                  </Badge>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-2">
                  <span className="flex items-center gap-1">
                    <Users className="size-3" /> {team.memberCount ?? 0} thành
                    viên
                  </span>
                  <ChevronRight className="size-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
                </div>
              </button>
            );
          })}
          {teams.length === 0 && (
            <div className="col-span-full text-center py-12 text-slate-400">
              Chưa có đội cứu hộ nào
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

// ─── TEAM DETAIL VIEW ────────────────────────────────────
function TeamDetailView({
  team,
  requests = [],
  missions = [],
  onBack,
}: {
  team: RescueTeamSummary;
  requests?: RequestSummary[];
  missions?: MissionSummary[];
  onBack: () => void;
}) {
  const membersQuery = useTeamMembersQuery(team.id);
  const members = membersQuery.data ?? [];
  const hasActiveMission = missions.some(m => m.rescueTeamId === team.id && ["ASSIGNED", "EN_ROUTE", "ON_SITE", "IN_PROGRESS"].includes(m.status));
  const st = hasActiveMission ? teamStatusLabels.ON_MISSION : (teamStatusLabels[team.status] ?? teamStatusLabels.INACTIVE);
  const isAvailable = team.status === "AVAILABLE" && !hasActiveMission;

  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState("");
  
  const { data: profile } = useProfileQuery();
  const createMission = useCreateMissionMutation();
  const changeStatus = useChangeRequestStatusMutation();

  const handleAssignMission = async () => {
    if (!selectedRequestId || !team.id) return;
    const request = requests.find(r => r.id === selectedRequestId);
    if (!request) return;

    const dispatcherId = profile?.id;
    if (!dispatcherId) {
      toast.error("Không lấy được thông tin điều phối viên");
      return;
    }

    try {
      if (request.status === "PENDING") {
        await changeStatus.mutateAsync({
          requestId: request.id,
          newStatus: "ACCEPTED",
          note: "Điều phối viên tiếp nhận",
        });
      }

      await createMission.mutateAsync({
        requestId: request.id,
        dispatcherId,
        rescueTeamId: team.id,
      });

      toast.success("Đã phân công nhiệm vụ thành công!", {
        description: `Đội ${team.teamName} đã nhận nhiệm vụ.`,
      });
      setAssignDialogOpen(false);
      setSelectedRequestId("");
    } catch (error) {
      toast.error("Lỗi tạo nhiệm vụ", {
        description: getApiErrorMessage(error),
      });
    }
  };

  const pendingRequests = requests.filter(r => r.status === "PENDING" || r.status === "ACCEPTED");

  return (
    <div className="flex flex-col gap-4">
      {/* Back Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onBack}
        className="self-start -ml-2 text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft data-icon="inline-start" />
        Quay lại danh sách
      </Button>

      {/* Team Info Card */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="size-14 bg-gradient-to-br from-blue-500 to-blue-700 text-white rounded-2xl flex items-center justify-center font-black text-lg shadow-md">
                {(team.teamName ?? "??").substring(0, 2).toUpperCase()}
              </div>
              <div>
                <CardTitle className="text-lg">{team.teamName}</CardTitle>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {team.description || "Chưa có mô tả"}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge
                className={`${st.bg} ${st.color} border-none font-bold text-xs px-3 py-1`}
              >
                {st.label}
              </Badge>
              {isAvailable && (
                <Button 
                  onClick={() => setAssignDialogOpen(true)}
                  className="bg-[#003da5] hover:bg-blue-800 text-white shadow-sm mt-1" 
                  size="sm"
                >
                  <MapPin className="w-3.5 h-3.5 mr-1.5" />
                  Giao nhiệm vụ
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <Separator />

        <CardContent className="pt-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">
                Đội trưởng
              </p>
              <p className="text-sm font-semibold text-slate-800">
                {team.leader?.fullName ?? "Chưa phân công"}
              </p>
              {team.leader?.email && (
                <p className="text-xs text-slate-400">{team.leader.email}</p>
              )}
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">
                Số thành viên
              </p>
              <p className="text-sm font-semibold text-slate-800">
                {team.memberCount ?? members.length ?? 0} người
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">
                Trạng thái
              </p>
              <p className={cn("text-sm font-semibold", st.color)}>
                {st.label}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">
                Ngày tạo
              </p>
              <p className="text-sm font-semibold text-slate-800">
                {team.createdAt
                  ? new Date(team.createdAt).toLocaleDateString("vi-VN")
                  : "—"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Members Section */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="size-4 text-blue-500" />
              Danh sách thành viên
            </CardTitle>
            <Badge variant="secondary" className="font-bold text-xs">
              {membersQuery.isLoading ? "..." : members.length} thành viên
            </Badge>
          </div>
        </CardHeader>

        <Separator />

        <CardContent className="pt-4">
          {membersQuery.isLoading && (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="size-10 rounded-full" />
                  <div className="flex-1 flex flex-col gap-1.5">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-56" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {membersQuery.isError && (
            <div className="text-center py-8 text-red-500 text-sm">
              Không thể tải danh sách thành viên. Vui lòng thử lại.
            </div>
          )}

          {!membersQuery.isLoading &&
            !membersQuery.isError &&
            members.length === 0 && (
              <div className="text-center py-8 text-slate-400 text-sm">
                Đội chưa có thành viên nào
              </div>
            )}

          {!membersQuery.isLoading && members.length > 0 && (
            <ScrollArea className="max-h-[calc(100vh-540px)]">
              <div className="flex flex-col gap-2">
                {members.map((member: any) => {
                  // Support both flat DTO and nested { user: {...} } shape
                  const user = member.user ?? member;
                  const fullName =
                    (user as { fullName?: string })?.fullName ?? "Không rõ";
                  const email = (user as { email?: string })?.email ?? "";
                  const phone =
                    (user as { phoneNumber?: string })?.phoneNumber ?? "";
                  const avatar = (user as { avatar?: string })?.avatar ?? "";
                  const isActive =
                    (user as { isActive?: boolean })?.isActive !== false;
                  const initials = fullName
                    .split(" ")
                    .map((w: string) => w[0])
                    .slice(-2)
                    .join("")
                    .toUpperCase();

                  return (
                    <div
                      key={member.id ?? user.id}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all",
                        !isActive && "opacity-50",
                      )}
                    >
                      {/* Avatar */}
                      {avatar ? (
                        <img
                          src={avatar}
                          alt={fullName}
                          className="size-10 rounded-full object-cover border-2 border-slate-200"
                        />
                      ) : (
                        <div className="size-10 rounded-full bg-gradient-to-br from-slate-400 to-slate-600 text-white flex items-center justify-center text-xs font-bold border-2 border-slate-200">
                          {initials}
                        </div>
                      )}

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-slate-800 truncate">
                            {fullName}
                          </p>
                          {!isActive && (
                            <Badge
                              variant="secondary"
                              className="text-[9px] px-1.5 py-0 bg-slate-100 text-slate-400"
                            >
                              Ngưng HĐ
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-0.5">
                          {email && (
                            <span className="flex items-center gap-1 text-xs text-slate-400 truncate">
                              <Mail className="size-3 shrink-0" />
                              {email}
                            </span>
                          )}
                          {phone && (
                            <span className="flex items-center gap-1 text-xs text-slate-400">
                              <Phone className="size-3 shrink-0" />
                              {phone}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Active dot */}
                      <div
                        className={cn(
                          "size-2.5 rounded-full shrink-0",
                          isActive ? "bg-emerald-500" : "bg-slate-300",
                        )}
                        title={isActive ? "Đang hoạt động" : "Ngưng hoạt động"}
                      />
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-slate-900 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-600" />
              Giao nhiệm vụ cho {team.teamName}
            </DialogTitle>
            <DialogDescription>
              Chọn một yêu cầu cứu trợ đang chờ xử lý để phân công cho đội này.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-2">
            <div>
              <label className="text-sm font-bold text-slate-800 mb-2 block">
                Chọn Sự Cố / Yêu Cầu *
              </label>
              <Select
                value={selectedRequestId}
                onValueChange={setSelectedRequestId}
              >
                <SelectTrigger className="bg-white h-12 border-slate-200 shadow-sm focus:ring-[#003da5] rounded-xl text-left">
                  <SelectValue placeholder="-- Nhấn để chọn Yêu cầu cứu trợ --" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px] rounded-xl max-w-[calc(100vw-2rem)] sm:max-w-none">
                  {pendingRequests.length === 0 && (
                    <div className="p-4 text-center text-sm text-slate-500">
                      Không có yêu cầu nào đang chờ xử lý.
                    </div>
                  )}
                  {pendingRequests.map((req) => {
                    return (
                      <SelectItem
                        key={req.id}
                        value={req.id}
                        className="py-2.5 px-3 mb-1 cursor-pointer rounded-lg hover:bg-blue-50 focus:bg-blue-50 transition-colors"
                      >
                        <div className="flex flex-col text-left pr-4">
                          <span className="font-bold text-slate-800 text-sm">
                            {emergencyTypeLabels[req.emergencyType] ?? req.emergencyType}
                          </span>
                          <span className="text-[11px] text-slate-500 font-medium truncate max-w-[300px] mt-0.5">
                            {req.location?.address ?? "Chưa rõ vị trí"}
                          </span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <Button
              className="w-full bg-[#003da5] hover:bg-blue-800 text-white font-bold h-11"
              disabled={!selectedRequestId || createMission.isPending}
              onClick={handleAssignMission}
            >
              {createMission.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              XÁC NHẬN PHÂN CÔNG
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function TeamsPanel({ teams, requests = [], missions = [], initialTeamId }: Props) {
  const [selectedTeam, setSelectedTeam] = useState<RescueTeamSummary | null>(null);

  useEffect(() => {
    if (initialTeamId) {
      const t = teams.find(x => x.id === initialTeamId);
      if (t) setSelectedTeam(t);
    }
  }, [initialTeamId, teams]);

  if (selectedTeam) {
    return (
      <TeamDetailView
        team={selectedTeam}
        requests={requests}
        missions={missions}
        onBack={() => {
          setSelectedTeam(null);
        }}
      />
    );
  }

  return <TeamListView teams={teams} missions={missions} onSelectTeam={setSelectedTeam} />;
}
