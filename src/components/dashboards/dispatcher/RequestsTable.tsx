"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getApiErrorMessage } from "@/lib/api/client";
import {
  emergencyTypeLabels,
  priorityLabels,
  statusLabels,
  missionStatusLabels,
  useChangeRequestStatusMutation,
  useCreateMissionMutation,
  useTeamMembersQuery,
} from "@/lib/api/features/requests/dispatcher.queries";
import type { RequestSummary, RescueTeamSummary } from "@/lib/api/types";
import { useProfileQuery } from "@/lib/api/use-profile";
import {
  ArrowUpDown,
  Info,
  Loader2,
  MapPin,
  Phone,
  Send,
  ShieldAlert,
  Truck,
  UserCircle,
  Users,
} from "lucide-react";
import { UserProfileDialog } from "./UserProfileDialog";
import { useState } from "react";
import { toast } from "sonner";

interface Props {
  requests: RequestSummary[];
  allRequests: RequestSummary[];
  teams: RescueTeamSummary[];
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  selectedRequest: RequestSummary | null;
  onSelectRequest: (req: RequestSummary | null) => void;
}

const priorityWeight: Record<string, number> = {
  CRITICAL: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};
const statusWeight: Record<string, number> = {
  PENDING: 4,
  ACCEPTED: 3,
  IN_PROGRESS: 2,
  COMPLETED: 1,
  CANCELED: 0,
  REJECTED: 0,
};

function getRelativeTime(iso: string) {
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
}: Props) {
  const [sortKey, setSortKey] = useState<"priority" | "status" | "time" | null>(
    null,
  );
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [profileUserId, setProfileUserId] = useState<string | null>(null);

  const { data: profile } = useProfileQuery();
  const createMission = useCreateMissionMutation();
  const changeStatus = useChangeRequestStatusMutation();
  const teamMembersQuery = useTeamMembersQuery(
    assignDialogOpen && selectedTeamId ? selectedTeamId : null,
  );
  const selectedTeamMembers = teamMembersQuery.data ?? [];

  const handleSort = (key: "priority" | "status" | "time") => {
    if (sortKey === key && sortDir === "desc") setSortDir("asc");
    else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const sorted = [...requests].sort((a, b) => {
    if (!sortKey) return 0;
    let diff = 0;
    if (sortKey === "time")
      diff =
        new Date(b.createdAt ?? 0).getTime() -
        new Date(a.createdAt ?? 0).getTime();
    if (sortKey === "priority")
      diff =
        (priorityWeight[b.priority] ?? 0) - (priorityWeight[a.priority] ?? 0);
    if (sortKey === "status")
      diff = (statusWeight[b.status] ?? 0) - (statusWeight[a.status] ?? 0);
    return sortDir === "desc" ? diff : -diff;
  });

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

  const statusFilters = [
    { value: "ALL", label: "Tất cả" },
    { value: "PENDING", label: "Chờ xử lý" },
    { value: "ACCEPTED", label: "Đã tiếp nhận" },
    { value: "IN_PROGRESS", label: "Đang xử lý" },
    { value: "COMPLETED", label: "Hoàn thành" },
    { value: "CANCELED", label: "Đã hủy" },
  ];

  return (
    <>
      {/* FILTER BAR */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {statusFilters.map((f) => {
          const count =
            f.value === "ALL"
              ? allRequests.length
              : allRequests.filter((r) => r.status === f.value).length;
          return (
            <button
              key={f.value}
              onClick={() => onStatusFilterChange(f.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                statusFilter === f.value
                  ? "bg-[#003da5] text-white shadow-md"
                  : "bg-white text-slate-600 border border-slate-200 hover:border-blue-300"
              }`}
            >
              {f.label} ({count})
            </button>
          );
        })}
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <ScrollArea className="h-[calc(100vh-340px)]">
          <Table className="w-full text-[13px]">
            <TableHeader className="bg-slate-50/80 sticky top-0 z-10">
              <TableRow>
                <TableHead
                  className="w-[90px] font-bold text-slate-500 cursor-pointer"
                  onClick={() => handleSort("priority")}
                >
                  <div className="flex items-center gap-1">
                    ƯU TIÊN{" "}
                    <ArrowUpDown
                      className={`w-3 h-3 ${sortKey === "priority" ? "text-[#003da5]" : "text-slate-400"}`}
                    />
                  </div>
                </TableHead>
                <TableHead className="w-[130px] font-bold text-slate-500">
                  SỰ CỐ
                </TableHead>
                <TableHead className="w-[150px] font-bold text-slate-500">
                  NGƯỜI GỬI
                </TableHead>
                <TableHead className="min-w-[180px] font-bold text-slate-500">
                  VỊ TRÍ
                </TableHead>
                <TableHead
                  className="w-[100px] font-bold text-slate-500 cursor-pointer"
                  onClick={() => handleSort("time")}
                >
                  <div className="flex items-center gap-1">
                    THỜI GIAN{" "}
                    <ArrowUpDown
                      className={`w-3 h-3 ${sortKey === "time" ? "text-[#003da5]" : "text-slate-400"}`}
                    />
                  </div>
                </TableHead>
                <TableHead
                  className="w-[110px] font-bold text-slate-500 cursor-pointer"
                  onClick={() => handleSort("status")}
                >
                  <div className="flex items-center gap-1">
                    TRẠNG THÁI{" "}
                    <ArrowUpDown
                      className={`w-3 h-3 ${sortKey === "status" ? "text-[#003da5]" : "text-slate-400"}`}
                    />
                  </div>
                </TableHead>
                <TableHead className="w-[110px] font-bold text-slate-500 text-right pr-4">
                  HÀNH ĐỘNG
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-12 text-slate-400"
                  >
                    Không có yêu cầu nào
                  </TableCell>
                </TableRow>
              )}
              {sorted.map((req) => (
                <TableRow
                  key={req.id}
                  onClick={() => onSelectRequest(req)}
                  className={`cursor-pointer transition-colors ${selectedRequest?.id === req.id ? "bg-blue-50/60" : "hover:bg-slate-50"}`}
                >
                  <TableCell>
                    <PriorityBadge priority={req.priority} />
                  </TableCell>
                  <TableCell>
                    <div className="font-bold text-slate-800 text-xs line-clamp-1">
                      {emergencyTypeLabels[req.emergencyType] ??
                        req.emergencyType}
                    </div>
                  </TableCell>
                  <TableCell>
                    {/* ĐÃ FIX: Không ẩn số điện thoại, hiển thị đầy đủ */}
                    <button
                      type="button"
                      className="font-bold text-[#003da5] text-xs hover:underline text-left"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (req.requestedBy?.id) {
                          setProfileUserId(req.requestedBy.id);
                        }
                      }}
                    >
                      {req.requestedBy?.fullName ?? "Ẩn danh"}
                    </button>
                    {req.requestedBy?.phoneNumber ? (
                      <a
                        href={`tel:${req.requestedBy.phoneNumber}`}
                        className="text-[11px] text-slate-500 mt-0.5 flex items-center hover:text-blue-600"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Phone className="w-2.5 h-2.5 mr-1" />{" "}
                        {req.requestedBy.phoneNumber}
                      </a>
                    ) : (
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Không có SĐT
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-start gap-1.5 text-xs text-slate-600">
                      <MapPin className="w-3 h-3 mt-0.5 shrink-0 text-slate-400" />
                      <span className="line-clamp-2">
                        {req.location?.address ?? "Chưa xác định"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-bold text-slate-700 text-xs">
                      {getRelativeTime(req.createdAt ?? "")}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      {req.createdAt
                        ? new Date(req.createdAt).toLocaleTimeString("vi-VN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : ""}
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={req.status} />
                  </TableCell>
                  <TableCell className="text-right pr-4">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 text-blue-600 border-blue-200 hover:bg-blue-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectRequest(req);
                          setDetailDialogOpen(true);
                        }}
                      >
                        <Info className="w-4 h-4" />
                      </Button>
                      {(req.status === "PENDING" ||
                        req.status === "ACCEPTED") && (
                        <Button
                          variant="default"
                          size="icon"
                          className="h-8 w-8 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectRequest(req);
                            setAssignDialogOpen(true);
                          }}
                        >
                          <Send className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>

      {/* ASSIGN MISSION DIALOG (Giữ nguyên logic của bạn, chỉ làm mượt UI một chút) */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-slate-900">
              Phân công nhiệm vụ
            </DialogTitle>
            <DialogDescription>
              Chọn đội cứu hộ để giao nhiệm vụ cho yêu cầu này.
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4 mt-2">
              {/* ... Nội dung Assign Dialog giữ nguyên ... */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                <div className="flex items-center gap-2">
                  <PriorityBadge priority={selectedRequest.priority} />
                  <span className="text-xs font-bold text-slate-700">
                    {emergencyTypeLabels[selectedRequest.emergencyType]}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                  {selectedRequest.description}
                </p>
              </div>
              <div>
                <label className="text-sm font-bold text-slate-800 mb-2 block">
                  Chọn đội cứu hộ *
                </label>
                <Select
                  value={selectedTeamId}
                  onValueChange={setSelectedTeamId}
                >
                  <SelectTrigger className="bg-white h-12 border-slate-200 shadow-sm focus:ring-[#003da5] rounded-xl">
                    <SelectValue placeholder="-- Nhấn để chọn đội sẵn sàng --" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px] rounded-xl">
                    {teams.map((team) => {
                      const isAvailable = team.status === "AVAILABLE";
                      return (
                        <SelectItem
                          key={team.id}
                          value={team.id}
                          disabled={!isAvailable}
                          className={`py-2.5 px-3 mb-1 cursor-pointer rounded-lg transition-colors ${
                            isAvailable
                              ? "hover:bg-blue-50 focus:bg-blue-50"
                              : "opacity-60"
                          }`}
                        >
                          <div className="flex items-center justify-between w-full min-w-[300px] gap-4">
                            <div className="flex items-center gap-3">
                              <div
                                className={`p-2 rounded-lg ${
                                  isAvailable
                                    ? "bg-blue-100 text-blue-600"
                                    : "bg-slate-100 text-slate-400"
                                }`}
                              >
                                <Truck className="w-4 h-4" />
                              </div>
                              <div className="flex flex-col text-left">
                                <span className="font-bold text-slate-800 text-sm">
                                  {team.teamName}
                                </span>
                                <span className="text-[10px] text-slate-500 font-medium">
                                  ID: {team.id.substring(0, 8).toUpperCase()}
                                </span>
                              </div>
                            </div>
                            <Badge
                              className={`text-[10px] px-2.5 py-1 border-none shadow-sm uppercase tracking-wider font-bold ${
                                isAvailable
                                  ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                                  : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                              }`}
                            >
                              {isAvailable ? "Sẵn sàng" : "Đang bận"}
                            </Badge>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <Button
                className="w-full bg-[#003da5] hover:bg-blue-800 text-white font-bold h-11"
                disabled={!selectedTeamId || createMission.isPending}
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
          )}
        </DialogContent>
      </Dialog>

      {/* DETAIL DIALOG - ĐÃ NÂNG CẤP DÀNH CHO DISPATCHER */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="sm:max-w-2xl bg-slate-50 p-0 overflow-hidden">
          <div className="bg-white px-6 py-4 border-b flex items-center justify-between">
            <DialogHeader className="p-0">
              <DialogTitle className="text-xl font-black text-slate-900 flex items-center gap-2">
                <ShieldAlert className="text-red-500 w-6 h-6" /> Chi tiết cứu
                trợ
              </DialogTitle>
              <DialogDescription className="font-mono text-xs mt-1">
                ID: {selectedRequest?.id}
              </DialogDescription>
            </DialogHeader>
            <StatusBadge status={selectedRequest?.status || "PENDING"} />
          </div>

          {selectedRequest && (
            <ScrollArea className="max-h-[70vh] px-6 py-4">
              <div className="space-y-6">
                {/* Khối 1: Thông tin người gửi */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <h3 className="text-sm font-bold flex items-center gap-2 mb-3 text-[#003da5] border-b pb-2">
                    <UserCircle className="w-5 h-5" /> Thông tin người liên hệ
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <DetailField
                      label="Họ và Tên"
                      value={
                        selectedRequest.requestedBy?.fullName ??
                        "Người dân ẩn danh"
                      }
                    />
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Số điện thoại
                      </p>
                      {selectedRequest.requestedBy?.phoneNumber ? (
                        <a
                          href={`tel:${selectedRequest.requestedBy.phoneNumber}`}
                          className="text-sm font-bold text-blue-600 hover:underline flex items-center gap-1 mt-0.5"
                        >
                          <Phone className="w-3.5 h-3.5" />{" "}
                          {selectedRequest.requestedBy.phoneNumber}
                        </a>
                      ) : (
                        <p className="text-sm text-slate-800 mt-0.5">
                          Không cung cấp
                        </p>
                      )}
                    </div>
                    {/* Nếu UserDTO trả về Email, nó sẽ hiện ở đây */}
                    {selectedRequest.requestedBy?.email && (
                      <div className="col-span-2">
                        <DetailField
                          label="Email"
                          value={selectedRequest.requestedBy.email}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Khối 2: Thông tin sự cố */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <h3 className="text-sm font-bold flex items-center gap-2 mb-3 text-red-600 border-b pb-2">
                    <ShieldAlert className="w-5 h-5" /> Đánh giá sự cố
                  </h3>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Loại sự cố
                      </p>
                      <Badge variant="outline" className="text-sm">
                        {emergencyTypeLabels[selectedRequest.emergencyType] ??
                          selectedRequest.emergencyType}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Mức độ ưu tiên
                      </p>
                      <PriorityBadge priority={selectedRequest.priority} />
                    </div>
                  </div>
                  <DetailField
                    label="Thời gian ghi nhận"
                    value={
                      selectedRequest.createdAt
                        ? new Date(selectedRequest.createdAt).toLocaleString(
                            "vi-VN",
                          )
                        : "N/A"
                    }
                  />
                  <div className="mt-4">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Mô tả tình trạng
                    </p>
                    <p className="text-sm text-slate-700 mt-1 bg-slate-50 p-3 rounded border border-slate-100">
                      {selectedRequest.description ?? "Không có mô tả"}
                    </p>
                  </div>
                </div>

                {/* Khối 3: Vị trí */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <h3 className="text-sm font-bold flex items-center gap-2 mb-3 text-emerald-600 border-b pb-2">
                    <MapPin className="w-5 h-5" /> Vị trí hiện trường
                  </h3>
                  <p className="text-sm font-medium text-slate-800 mb-2">
                    {selectedRequest.location?.address ??
                      "Chưa xác định địa chỉ"}
                  </p>
                  {selectedRequest.location && (
                    <div className="flex gap-4">
                      <DetailField
                        label="Tọa độ Latitude"
                        value={selectedRequest.location.latitude.toString()}
                      />
                      <DetailField
                        label="Tọa độ Longitude"
                        value={selectedRequest.location.longitude.toString()}
                      />
                    </div>
                  )}
                  {selectedRequest.location?.landmark && (
                    <div className="mt-2">
                      <DetailField
                        label="Mốc nhận diện (Landmark)"
                        value={selectedRequest.location.landmark}
                      />
                    </div>
                  )}
                </div>

                {/* Khối 4: Đội cứu hộ (Chỉ hiện nếu request đã có Mission) */}
                {selectedRequest.missions &&
                  selectedRequest.missions.length > 0 && (
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 shadow-sm">
                      <h3 className="text-sm font-bold flex items-center gap-2 mb-3 text-[#003da5] border-b border-blue-200 pb-2">
                        <Truck className="w-5 h-5" /> Đội cứu hộ đang xử lý
                      </h3>
                      <div className="space-y-2">
                        {selectedRequest.missions.map((mission) => (
                          <div
                            key={mission.id}
                            className="bg-white p-3 rounded-lg border border-blue-100 flex justify-between items-center"
                          >
                            <div>
                              <p className="font-bold text-slate-800">
                                {mission.teamName || "Đội cứu hộ (ID bị ẩn)"}
                              </p>
                              <p className="text-xs text-slate-500 mt-0.5">
                                Bắt đầu:{" "}
                                {mission.startTime
                                  ? new Date(mission.startTime).toLocaleString(
                                      "vi-VN",
                                    )
                                  : "N/A"}
                              </p>
                            </div>
                            <Badge variant="default" className="bg-blue-600">
                              {missionStatusLabels[mission.status] ||
                                mission.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      {/* USER PROFILE DIALOG */}
      <UserProfileDialog
        userId={profileUserId}
        open={!!profileUserId}
        onOpenChange={(v) => {
          if (!v) setProfileUserId(null);
        }}
      />
    </>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
        {label}
      </p>
      <p className="text-sm font-semibold text-slate-800 mt-0.5">{value}</p>
    </div>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const map: Record<string, string> = {
    CRITICAL: "bg-red-100 text-red-700",
    HIGH: "bg-orange-100 text-orange-700",
    MEDIUM: "bg-yellow-100 text-yellow-700",
    LOW: "bg-slate-100 text-slate-600",
  };
  return (
    <Badge
      className={`${map[priority] ?? map.LOW} border-none rounded font-bold text-[10px] px-2 py-0.5`}
    >
      {priorityLabels[priority] ?? priority}
    </Badge>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { dot: string; bg: string; text: string }> = {
    PENDING: {
      dot: "bg-red-500 animate-pulse",
      bg: "bg-red-50",
      text: "text-red-600",
    },
    ACCEPTED: {
      dot: "bg-amber-500",
      bg: "bg-amber-50",
      text: "text-amber-600",
    },
    IN_PROGRESS: {
      dot: "bg-blue-500",
      bg: "bg-blue-50",
      text: "text-blue-600",
    },
    COMPLETED: {
      dot: "bg-emerald-500",
      bg: "bg-emerald-50",
      text: "text-emerald-600",
    },
    CANCELED: {
      dot: "bg-slate-400",
      bg: "bg-slate-50",
      text: "text-slate-500",
    },
    REJECTED: {
      dot: "bg-slate-400",
      bg: "bg-slate-50",
      text: "text-slate-500",
    },
  };
  const s = map[status] ?? map.PENDING;
  return (
    <span
      className={`flex items-center ${s.text} font-bold text-[11px] whitespace-nowrap ${s.bg} px-2 py-1 rounded w-fit`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot} mr-1.5 shrink-0`} />
      {statusLabels[status] ?? status}
    </span>
  );
}
