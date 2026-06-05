"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getApiErrorMessage } from "@/lib/api/client";
import {
  emergencyTypeLabels,
  priorityLabels,
  statusLabels,
  useChangeRequestStatusMutation,
  useCreateMissionMutation,
  useTeamMembersQuery,
} from "@/lib/api/features/requests/dispatcher.queries";
import type { RequestSummary, RescueTeamSummary, MissionSummary } from "@/lib/api/types";
import { useProfileQuery } from "@/lib/api/use-profile";
import {
  Loader2,
  MapPin,
  Phone,
  Send,
  UserCircle,
  Users,
  Clock,
  Filter,
  ChevronRight,
  Truck
} from "lucide-react";
import { UserProfileDialog } from "./UserProfileDialog";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { dictTeamStatus } from "@/constants/dictionary";

const DispatcherMapView = dynamic(
  () => import("@/components/dashboards/dispatcher/DispatcherMapView"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-slate-50 border-l border-slate-200">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    ),
  }
);

interface Props {
  requests: RequestSummary[];
  allRequests: RequestSummary[];
  teams: RescueTeamSummary[];
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  selectedRequest: RequestSummary | null;
  onSelectRequest: (req: RequestSummary | null) => void;
  missions: MissionSummary[];
}

const statusFilters = [
  { value: "ALL", label: "Tất cả" },
  { value: "PENDING", label: "Chờ xử lý" },
  { value: "ACCEPTED", label: "Đã tiếp nhận" },
  { value: "IN_PROGRESS", label: "Đang xử lý" },
  { value: "COMPLETED", label: "Hoàn thành" },
  { value: "CANCELED", label: "Đã hủy" },
];

const priorityColor: Record<string, string> = {
  CRITICAL: "bg-red-100 text-red-700",
  HIGH: "bg-orange-100 text-orange-700",
  MEDIUM: "bg-amber-100 text-amber-700",
  LOW: "bg-blue-100 text-blue-700",
};

function getRelativeTime(iso?: string) {
  if (!iso) return "Chưa rõ thời gian";
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff <= 60) return "Vừa xong";
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  return `${Math.floor(diff / 86400)} ngày trước`;
}

export function RequestsTable({
  requests,
  allRequests,
  teams,
  statusFilter,
  onStatusFilterChange,
  selectedRequest,
  onSelectRequest,
  missions,
}: Props) {
  const router = useRouter();
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [profileUserId, setProfileUserId] = useState<string | null>(null);

  const { data: profile } = useProfileQuery();
  const createMission = useCreateMissionMutation();
  const changeStatus = useChangeRequestStatusMutation();
  const teamMembersQuery = useTeamMembersQuery(
    assignDialogOpen && selectedTeamId ? selectedTeamId : null,
  );
  const selectedTeamMembers = teamMembersQuery.data ?? [];

  const handleAssignMission = async () => {
    if (!selectedRequest || !selectedTeamId) return;

    const dispatcherId = profile?.id;
    if (!dispatcherId) {
      toast.error("Không lấy được thông tin điều phối viên");
      return;
    }

    try {
      if (selectedRequest.status === "PENDING") {
        await changeStatus.mutateAsync({
          requestId: selectedRequest.id,
          newStatus: "ACCEPTED",
          note: "Điều phối viên tiếp nhận",
        });
      }

      await createMission.mutateAsync({
        requestId: selectedRequest.id,
        dispatcherId,
        rescueTeamId: selectedTeamId,
      });

      toast.success("Đã tạo nhiệm vụ thành công!", {
        description: "Đội cứu hộ đã được phân công.",
      });
      setAssignDialogOpen(false);
      setSelectedTeamId("");
    } catch (error) {
      toast.error("Lỗi tạo nhiệm vụ", {
        description: getApiErrorMessage(error),
      });
    }
  };

  // Sắp xếp các yêu cầu mới nhất lên đầu
  const sorted = [...requests].sort((a, b) => {
    return new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime();
  });

  return (
    <>
      <div className="flex h-full w-full rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-white relative">
        {/* LEFT PANEL: LIST OF CARDS */}
        <div className="w-[380px] shrink-0 flex flex-col bg-slate-50 border-r border-slate-200 z-10">
          {/* Header & Filter */}
          <div className="p-4 bg-white border-b border-slate-200 shadow-sm flex items-center justify-between sticky top-0">
            <h3 className="font-extrabold text-slate-800 text-[13px] uppercase tracking-wider">
              Danh sách yêu cầu
            </h3>
            
            {/* Filter Dropdown */}
            <Select value={statusFilter} onValueChange={onStatusFilterChange}>
              <SelectTrigger className="w-[140px] h-8 text-xs font-semibold bg-slate-100 border-0 focus:ring-0">
                <Filter className="w-3.5 h-3.5 mr-1 text-slate-500" />
                <SelectValue placeholder="Lọc trạng thái" />
              </SelectTrigger>
              <SelectContent>
                {statusFilters.map((f) => {
                   const count =
                   f.value === "ALL"
                     ? allRequests.length
                     : allRequests.filter((r) => r.status === f.value).length;
                  return (
                    <SelectItem key={f.value} value={f.value} className="text-xs font-medium">
                      {f.label} ({count})
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Cards List */}
          <ScrollArea className="flex-1 p-3">
            {sorted.length === 0 ? (
               <div className="h-40 flex items-center justify-center text-slate-400 text-sm font-medium">
                 Không có yêu cầu nào
               </div>
            ) : (
              <div className="space-y-3">
                {sorted.map((req) => {
                  const isSelected = selectedRequest?.id === req.id;
                  return (
                    <div
                      key={req.id}
                      onClick={() => onSelectRequest(req)}
                      className={cn(
                        "p-4 rounded-xl border transition-all cursor-pointer relative group",
                        isSelected 
                          ? "bg-white border-blue-400 shadow-[0_4px_20px_-4px_rgba(59,130,246,0.3)] ring-1 ring-blue-400/50" 
                          : "bg-white border-slate-200 shadow-sm hover:border-blue-300 hover:shadow-md"
                      )}
                    >
                      {/* Indicator for selected */}
                      {isSelected && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-600 rounded-r-full"></div>
                      )}

                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "w-2 h-2 rounded-full",
                            req.status === "PENDING" ? "bg-amber-500 animate-pulse" : "bg-blue-500"
                          )}></div>
                          <h4 className="font-bold text-slate-800 text-[13px]">
                            {emergencyTypeLabels[req.emergencyType] ?? req.emergencyType}
                          </h4>
                        </div>
                        <Badge variant="secondary" className={cn("text-[10px] font-bold border-0 uppercase", priorityColor[req.priority])}>
                          {priorityLabels[req.priority] || req.priority}
                        </Badge>
                      </div>

                      <div className="space-y-1.5 mt-3">
                        <p className="text-[11px] text-slate-600 flex items-start gap-2">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                          <span className="line-clamp-2 leading-relaxed">{req.location?.address ?? "Chưa rõ vị trí"}</span>
                        </p>
                        <p className="text-[11px] text-slate-600 flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{getRelativeTime(req.createdAt)}</span>
                        </p>
                      </div>

                      {/* Small action area or assigned team info */}
                      {(req.status === "PENDING" || req.status === "ACCEPTED") && (
                        <div 
                          className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-600 cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectRequest(req);
                            setAssignDialogOpen(true);
                          }}
                        >
                          <span className="flex items-center gap-1.5">
                            <Send className="w-3 h-3" /> Giao nhiệm vụ
                          </span>
                          <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 transform" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* RIGHT PANEL: MAP */}
        <div className="flex-1 h-full bg-slate-100 relative z-0">
          <DispatcherMapView
            requests={sorted}
            teams={teams}
            selectedRequestId={selectedRequest?.id}
            onSelectRequest={onSelectRequest}
            onAssignRequest={() => {
              setAssignDialogOpen(true);
            }}
            onViewTeamDetails={(teamId) => {
              router.push(`/dashboard/dispatcher?view=teams&teamId=${teamId}`);
            }}
          />
        </div>
      </div>

      {/* MODALS */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-800 text-center flex items-center justify-center gap-2">
              <Send className="w-5 h-5 text-blue-600" />
              Điều Phối Lực Lượng
            </DialogTitle>
          </DialogHeader>

          {selectedRequest && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mt-2 space-y-3">
              <div className="flex items-start gap-3">
                <div className="bg-red-100 p-2 rounded-lg">
                  <MapPin className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">
                    {emergencyTypeLabels[selectedRequest.emergencyType]}
                  </h4>
                  <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                    {selectedRequest.location?.address}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Truck className="w-4 h-4 text-slate-500" /> Chọn đội cứu hộ
              </label>
              <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
                <SelectTrigger className="w-full bg-slate-50 border-slate-200 focus:ring-blue-500 font-medium">
                  <SelectValue placeholder="--- Chọn một đội sẵn sàng ---" />
                </SelectTrigger>
                <SelectContent className="max-h-[250px]">
                  {teams.length === 0 ? (
                    <SelectItem value="empty" disabled>
                      Không có đội cứu hộ nào
                    </SelectItem>
                  ) : (
                    teams.map((t) => {
                      const hasActiveMission = missions.some(m => 
                        m.rescueTeamId === t.id && 
                        ["ASSIGNED", "EN_ROUTE", "ON_SITE", "IN_PROGRESS"].includes(m.status)
                      );
                      const isWorking = hasActiveMission || t.status === "ON_MISSION";
                      const isAvailable = t.status === "AVAILABLE" && !isWorking;
                      
                      return (
                      <SelectItem
                        key={t.id}
                        value={t.id}
                        disabled={!isAvailable}
                        className={
                          !isAvailable ? "opacity-50" : ""
                        }
                      >
                        <div className="flex items-center justify-between w-[320px]">
                          <span className="font-bold">{t.teamName}</span>
                          <Badge
                            variant="secondary"
                            className={cn(
                              "text-[10px] uppercase font-bold",
                              isAvailable
                                ? "bg-emerald-100 text-emerald-700"
                                : isWorking ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500",
                            )}
                          >
                            {isWorking ? dictTeamStatus["ON_MISSION"] : (dictTeamStatus[t.status] || t.status)}
                          </Badge>
                        </div>
                      </SelectItem>
                    )})
                  )}
                </SelectContent>
              </Select>
            </div>

            {selectedTeamId && teamMembersQuery.isLoading && (
              <div className="flex justify-center py-4">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              </div>
            )}

            {selectedTeamId &&
              !teamMembersQuery.isLoading &&
              selectedTeamMembers.length > 0 && (
                <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-3 space-y-3">
                  <h4 className="text-xs font-bold text-blue-800 flex items-center gap-2 uppercase tracking-wide">
                    <Users className="w-3.5 h-3.5" /> Lực lượng tham gia (
                    {selectedTeamMembers.length})
                  </h4>
                  <div className="grid grid-cols-2 gap-2 max-h-[120px] overflow-y-auto pr-2 custom-scrollbar">
                    {selectedTeamMembers.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center gap-2 bg-white border border-blue-100 rounded-lg p-2 shadow-sm"
                      >
                        <UserCircle className="w-5 h-5 text-slate-400" />
                        <div className="overflow-hidden">
                          <p className="text-xs font-bold text-slate-800 truncate">
                            {member.fullName}
                          </p>
                          <p className="text-[10px] text-slate-500 truncate">
                            {member.phoneNumber || member.email}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </div>

          <div className="flex gap-3 mt-4">
            <Button
              variant="outline"
              onClick={() => setAssignDialogOpen(false)}
              className="flex-1 font-bold border-slate-200 hover:bg-slate-50"
            >
              Hủy
            </Button>
            <Button
              onClick={handleAssignMission}
              disabled={
                !selectedTeamId ||
                !selectedRequest ||
                createMission.isPending ||
                changeStatus.isPending
              }
              className="flex-1 bg-[#003da5] hover:bg-blue-800 text-white font-bold"
            >
              {(createMission.isPending || changeStatus.isPending) && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              <Send className="w-4 h-4 mr-2" />
              Điều Động Ngay
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <UserProfileDialog
        open={!!profileUserId}
        userId={profileUserId}
        onOpenChange={(isOpen) => !isOpen && setProfileUserId(null)}
      />
    </>
  );
}
