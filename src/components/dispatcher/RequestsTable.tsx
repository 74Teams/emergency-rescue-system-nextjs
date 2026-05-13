"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowUpDown, Eye, MapPin, Clock, Send, Loader2, AlertTriangle, Info } from "lucide-react";
import { toast } from "sonner";
import {
  emergencyTypeLabels,
  priorityLabels,
  statusLabels,
  useCreateMissionMutation,
  useChangeRequestStatusMutation,
} from "@/lib/api/dispatcher-queries";
import { authApi } from "@/lib/api/services";
import type { RequestSummary, RescueTeamSummary } from "@/lib/api/types";

interface Props {
  requests: RequestSummary[];
  allRequests: RequestSummary[];
  teams: RescueTeamSummary[];
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  selectedRequest: RequestSummary | null;
  onSelectRequest: (req: RequestSummary | null) => void;
}

const priorityWeight: Record<string, number> = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
const statusWeight: Record<string, number> = { PENDING: 4, ACCEPTED: 3, IN_PROGRESS: 2, COMPLETED: 1, CANCELED: 0, REJECTED: 0 };

function getRelativeTime(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff <= 60) return "Vừa xong";
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  return `${Math.floor(diff / 86400)} ngày trước`;
}

function maskPhone(p: string) {
  if (!p || p.length < 10) return p || "N/A";
  return p.substring(0, 4) + "***" + p.substring(p.length - 3);
}

export function RequestsTable({ requests, allRequests, teams, statusFilter, onStatusFilterChange, selectedRequest, onSelectRequest }: Props) {
  const [sortKey, setSortKey] = useState<"priority" | "status" | "time" | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState("");

  const createMission = useCreateMissionMutation();
  const changeStatus = useChangeRequestStatusMutation();

  const handleSort = (key: "priority" | "status" | "time") => {
    if (sortKey === key && sortDir === "desc") setSortDir("asc");
    else { setSortKey(key); setSortDir("desc"); }
  };

  const sorted = [...requests].sort((a, b) => {
    if (!sortKey) return 0;
    let diff = 0;
    if (sortKey === "time") diff = new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime();
    if (sortKey === "priority") diff = (priorityWeight[b.priority] ?? 0) - (priorityWeight[a.priority] ?? 0);
    if (sortKey === "status") diff = (statusWeight[b.status] ?? 0) - (statusWeight[a.status] ?? 0);
    return sortDir === "desc" ? diff : -diff;
  });

  const handleAssignMission = async () => {
    if (!selectedRequest || !selectedTeamId) return;
    try {
      // Get dispatcher ID
      const profile = await authApi.profile();
      const dispatcherId = profile.data?.id || "00000000-0000-0000-0000-000000000000";

      // Accept request first if PENDING
      if (selectedRequest.status === "PENDING") {
        await changeStatus.mutateAsync({ requestId: selectedRequest.id, newStatus: "ACCEPTED", note: "Điều phối viên tiếp nhận" });
      }
      await createMission.mutateAsync({
        requestId: selectedRequest.id,
        dispatcherId: dispatcherId,
        rescueTeamId: selectedTeamId,
      });
      toast.success("Đã tạo nhiệm vụ thành công!", { description: `Đội cứu hộ đã được phân công.` });
      setAssignDialogOpen(false);
      setSelectedTeamId("");
    } catch (err) {
      toast.error("Lỗi tạo nhiệm vụ", { description: err instanceof Error ? err.message : "Thử lại sau" });
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
          const count = f.value === "ALL" ? allRequests.length : allRequests.filter((r) => r.status === f.value).length;
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
                <TableHead className="w-[90px] font-bold text-slate-500 cursor-pointer" onClick={() => handleSort("priority")}>
                  <div className="flex items-center gap-1">ƯU TIÊN <ArrowUpDown className={`w-3 h-3 ${sortKey === "priority" ? "text-[#003da5]" : "text-slate-400"}`} /></div>
                </TableHead>
                <TableHead className="w-[130px] font-bold text-slate-500">SỰ CỐ</TableHead>
                <TableHead className="w-[130px] font-bold text-slate-500">NGƯỜI GỌI</TableHead>
                <TableHead className="min-w-[180px] font-bold text-slate-500">VỊ TRÍ</TableHead>
                <TableHead className="w-[100px] font-bold text-slate-500 cursor-pointer" onClick={() => handleSort("time")}>
                  <div className="flex items-center gap-1">THỜI GIAN <ArrowUpDown className={`w-3 h-3 ${sortKey === "time" ? "text-[#003da5]" : "text-slate-400"}`} /></div>
                </TableHead>
                <TableHead className="w-[110px] font-bold text-slate-500 cursor-pointer" onClick={() => handleSort("status")}>
                  <div className="flex items-center gap-1">TRẠNG THÁI <ArrowUpDown className={`w-3 h-3 ${sortKey === "status" ? "text-[#003da5]" : "text-slate-400"}`} /></div>
                </TableHead>
                <TableHead className="w-[110px] font-bold text-slate-500 text-right pr-4">HÀNH ĐỘNG</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center py-12 text-slate-400">Không có yêu cầu nào</TableCell></TableRow>
              )}
              {sorted.map((req) => (
                <TableRow
                  key={req.id}
                  onClick={() => onSelectRequest(req)}
                  className={`cursor-pointer transition-colors ${selectedRequest?.id === req.id ? "bg-blue-50/60" : "hover:bg-slate-50"}`}
                >
                  <TableCell><PriorityBadge priority={req.priority} /></TableCell>
                  <TableCell>
                    <div className="font-bold text-slate-800 text-xs line-clamp-1">{emergencyTypeLabels[req.emergencyType] ?? req.emergencyType}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-bold text-slate-800 text-xs">{req.requestedBy?.fullName ?? "N/A"}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{maskPhone(req.requestedBy?.phoneNumber ?? "")}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-start gap-1.5 text-xs text-slate-600">
                      <MapPin className="w-3 h-3 mt-0.5 shrink-0 text-slate-400" />
                      <span className="line-clamp-2">{req.location?.address ?? "N/A"}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-bold text-slate-700 text-xs">{getRelativeTime(req.createdAt ?? "")}</div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      {req.createdAt ? new Date(req.createdAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : ""}
                    </div>
                  </TableCell>
                  <TableCell><StatusBadge status={req.status} /></TableCell>
                  <TableCell className="text-right pr-4">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-blue-600" onClick={(e) => { e.stopPropagation(); onSelectRequest(req); setDetailDialogOpen(true); }}>
                        <Info className="w-3.5 h-3.5" />
                      </Button>
                      {(req.status === "PENDING" || req.status === "ACCEPTED") && (
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-emerald-600" onClick={(e) => { e.stopPropagation(); onSelectRequest(req); setAssignDialogOpen(true); }}>
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

      {/* ASSIGN MISSION DIALOG */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-slate-900">Phân công nhiệm vụ</DialogTitle>
            <DialogDescription>Chọn đội cứu hộ để giao nhiệm vụ cho yêu cầu này.</DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4 mt-2">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                <div className="flex items-center gap-2">
                  <PriorityBadge priority={selectedRequest.priority} />
                  <span className="text-xs font-bold text-slate-700">{emergencyTypeLabels[selectedRequest.emergencyType]}</span>
                </div>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{selectedRequest.description}</p>
                <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-1"><MapPin className="w-3 h-3" /> {selectedRequest.location?.address}</p>
              </div>
              <div>
                <label className="text-sm font-bold text-slate-800 mb-2 block">Chọn đội cứu hộ *</label>
                <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
                  <SelectTrigger className="bg-white"><SelectValue placeholder="-- Chọn đội --" /></SelectTrigger>
                  <SelectContent>
                    {teams.map((team) => {
                      const isAvailable = team.status === "ACTIVE" || team.status === "AVAILABLE" || team.status === "ON_DUTY";
                      const statusMap: Record<string, { label: string; bg: string; color: string }> = {
                        ACTIVE: { label: "Hoạt động", bg: "bg-emerald-50", color: "text-emerald-700" },
                        AVAILABLE: { label: "Sẵn sàng", bg: "bg-emerald-50", color: "text-emerald-700" },
                        ON_DUTY: { label: "Đang trực", bg: "bg-blue-50", color: "text-blue-700" },
                        INACTIVE: { label: "Không HĐ", bg: "bg-slate-100", color: "text-slate-500" },
                        OFF_DUTY: { label: "Nghỉ", bg: "bg-amber-50", color: "text-amber-700" },
                      };
                      const st = statusMap[team.status] ?? statusMap.INACTIVE;
                      
                      return (
                        <SelectItem key={team.id} value={team.id} disabled={!isAvailable}>
                          <div className="flex items-center justify-between w-full min-w-[200px] gap-2">
                            <span className="font-bold">{team.name}</span>
                            <div className="flex items-center gap-2">
                              <Badge className={`${st.bg} ${st.color} border-none font-bold text-[10px]`}>{st.label}</Badge>
                              <Badge variant="outline" className="text-[10px]">{team.memberCount ?? 0} TV</Badge>
                            </div>
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
                {createMission.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                XÁC NHẬN PHÂN CÔNG
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* DETAIL DIALOG */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="sm:max-w-lg bg-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-slate-900">Chi tiết yêu cầu</DialogTitle>
            <DialogDescription>ID: {selectedRequest?.id}</DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-3 mt-2">
              <div className="grid grid-cols-2 gap-3">
                <DetailField label="Loại sự cố" value={emergencyTypeLabels[selectedRequest.emergencyType] ?? selectedRequest.emergencyType} />
                <DetailField label="Mức độ" value={priorityLabels[selectedRequest.priority] ?? selectedRequest.priority} />
                <DetailField label="Trạng thái" value={statusLabels[selectedRequest.status] ?? selectedRequest.status} />
                <DetailField label="Thời gian" value={selectedRequest.createdAt ? new Date(selectedRequest.createdAt).toLocaleString("vi-VN") : "N/A"} />
              </div>
              <DetailField label="Người yêu cầu" value={`${selectedRequest.requestedBy?.fullName ?? "N/A"} • ${selectedRequest.requestedBy?.phoneNumber ?? ""}`} />
              <DetailField label="Địa chỉ" value={selectedRequest.location?.address ?? "N/A"} />
              <DetailField label="Mô tả" value={selectedRequest.description ?? "Không có mô tả"} />
              {selectedRequest.location && (
                <DetailField label="Tọa độ" value={`${selectedRequest.location.latitude}, ${selectedRequest.location.longitude}`} />
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
      <p className="text-sm text-slate-800 mt-0.5">{value}</p>
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
    <Badge className={`${map[priority] ?? map.LOW} border-none rounded font-bold text-[10px] px-2 py-0.5`}>
      {priorityLabels[priority] ?? priority}
    </Badge>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { dot: string; bg: string; text: string }> = {
    PENDING: { dot: "bg-red-500 animate-pulse", bg: "bg-red-50", text: "text-red-600" },
    ACCEPTED: { dot: "bg-amber-500", bg: "bg-amber-50", text: "text-amber-600" },
    IN_PROGRESS: { dot: "bg-blue-500", bg: "bg-blue-50", text: "text-blue-600" },
    COMPLETED: { dot: "bg-emerald-500", bg: "bg-emerald-50", text: "text-emerald-600" },
    CANCELED: { dot: "bg-slate-400", bg: "bg-slate-50", text: "text-slate-500" },
    REJECTED: { dot: "bg-slate-400", bg: "bg-slate-50", text: "text-slate-500" },
  };
  const s = map[status] ?? map.PENDING;
  return (
    <span className={`flex items-center ${s.text} font-bold text-[11px] whitespace-nowrap ${s.bg} px-2 py-1 rounded w-fit`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot} mr-1.5 shrink-0`} />
      {statusLabels[status] ?? status}
    </span>
  );
}
