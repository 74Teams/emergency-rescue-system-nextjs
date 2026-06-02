"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Clock, MapPin, Eye, ArrowUpDown, ArrowDown, ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  emergencyTypeLabels,
  missionStatusLabels,
  priorityLabels,
} from "@/lib/api/features/requests/dispatcher.queries";
import type {
  MissionSummary,
  RequestSummary,
  RescueTeamSummary,
} from "@/lib/api/types";

interface Props {
  missions: MissionSummary[];
  teams: RescueTeamSummary[];
  requests: RequestSummary[];
}

export function MissionsPanel({ missions, teams, requests }: Props) {
  const router = useRouter();
  type SortKey = "status" | "time" | "team";
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: "asc" | "desc" } | null>(null);
  const [selectedMission, setSelectedMission] = useState<MissionSummary | null>(null);
  const [now, setNow] = useState(Date.now());
  const toUtcDate = (dateString?: string) => {
    if (!dateString) return new Date(0);
    if (dateString.endsWith("Z") || dateString.includes("+")) return new Date(dateString);
    return new Date(dateString + "Z");
  };

  useEffect(() => {
    if (!selectedMission || selectedMission.status === "COMPLETED") return;
    // Cập nhật thời gian mỗi phút
    const interval = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(interval);
  }, [selectedMission]);

  function getDurationText(startString: string | undefined) {
    if (!startString) return "Không rõ";
    const start = toUtcDate(startString).getTime();
    const diff = now - start;
    if (diff < 0) return "Vừa mới đây";

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} ngày ${hours % 24} giờ`;
    if (hours > 0) return `${hours} giờ ${minutes % 60} phút`;
    return `${minutes} phút`;
  }

  const handleSort = (key: SortKey) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const SortIcon = ({ columnKey }: { columnKey: SortKey }) => {
    if (sortConfig?.key !== columnKey) return <ArrowUpDown className="w-3 h-3 text-slate-400" />;
    return sortConfig.direction === "asc" ? <ArrowUp className="w-3 h-3 text-blue-500" /> : <ArrowDown className="w-3 h-3 text-blue-500" />;
  };

  const getTeamName = (id: string) =>
    teams.find((t) => t.id === id)?.teamName ?? "N/A";
  const getRequest = (id: string) => requests.find((r) => r.id === id);

  const statusColors: Record<
    string,
    { dot: string; bg: string; text: string }
  > = {
    ASSIGNED: {
      dot: "bg-amber-500",
      bg: "bg-amber-50",
      text: "text-amber-600",
    },
    EN_ROUTE: {
      dot: "bg-blue-500 animate-pulse",
      bg: "bg-blue-50",
      text: "text-blue-600",
    },
    ON_SITE: {
      dot: "bg-violet-500",
      bg: "bg-violet-50",
      text: "text-violet-600",
    },
    IN_PROGRESS: {
      dot: "bg-indigo-500 animate-pulse",
      bg: "bg-indigo-50",
      text: "text-indigo-600",
    },
    COMPLETED: {
      dot: "bg-emerald-500",
      bg: "bg-emerald-50",
      text: "text-emerald-600",
    },
    ABORTED: { dot: "bg-red-500", bg: "bg-red-50", text: "text-red-600" },
  };

  const active = missions.filter(
    (m) => !["COMPLETED", "ABORTED"].includes(m.status),
  );
  const done = missions.filter((m) =>
    ["COMPLETED", "ABORTED"].includes(m.status),
  );

  const sortedMissions = [...missions].sort((a, b) => {
    if (!sortConfig) return 0;

    const { key, direction } = sortConfig;
    const modifier = direction === "asc" ? 1 : -1;

    if (key === "time") {
      const timeA = toUtcDate(a.createdAt).getTime();
      const timeB = toUtcDate(b.createdAt).getTime();
      return (timeA - timeB) * modifier;
    }

    if (key === "team") {
      const teamA = a.rescueTeam?.teamName || getTeamName(a.rescueTeamId);
      const teamB = b.rescueTeam?.teamName || getTeamName(b.rescueTeamId);
      return teamA.localeCompare(teamB) * modifier;
    }

    if (key === "status") {
      const statusOrder = ["ASSIGNED", "EN_ROUTE", "ON_SITE", "IN_PROGRESS", "COMPLETED", "ABORTED"];
      const indexA = statusOrder.indexOf(a.status);
      const indexB = statusOrder.indexOf(b.status);
      return (indexA - indexB) * modifier;
    }

    return 0;
  });

  return (
    <div className="space-y-4">
      {/* Active missions summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: "Tổng nhiệm vụ",
            value: missions.length,
            color: "text-slate-700",
          },
          {
            label: "Đang thực hiện",
            value: active.length,
            color: "text-blue-600",
          },
          {
            label: "Hoàn thành",
            value: done.filter((m) => m.status === "COMPLETED").length,
            color: "text-emerald-600",
          },
          {
            label: "Đã hủy",
            value: done.filter((m) => m.status === "ABORTED").length,
            color: "text-red-600",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm"
          >
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {s.label}
            </p>
            <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-3 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-800">
            Danh sách nhiệm vụ
          </h3>
          <Badge variant="outline" className="text-[10px]">
            {missions.length} nhiệm vụ
          </Badge>
        </div>
        <ScrollArea className="h-[calc(100vh-420px)]">
          <Table className="w-full text-[13px]">
            <TableHeader className="bg-slate-50/80 sticky top-0 z-10">
              <TableRow>
                <TableHead className="font-bold text-slate-500 w-[250px]">
                  YÊU CẦU LIÊN QUAN
                </TableHead>
                <TableHead
                  className="font-bold text-slate-500 w-[150px] cursor-pointer hover:text-slate-800 transition-colors select-none"
                  onClick={() => handleSort("team")}
                >
                  <div className="flex items-center gap-1.5">
                    ĐỘI CỨU HỘ
                    <SortIcon columnKey="team" />
                  </div>
                </TableHead>
                <TableHead
                  className="font-bold text-slate-500 w-[140px] cursor-pointer hover:text-slate-800 transition-colors select-none"
                  onClick={() => handleSort("status")}
                >
                  <div className="flex items-center gap-1.5">
                    TRẠNG THÁI
                    <SortIcon columnKey="status" />
                  </div>
                </TableHead>
                <TableHead
                  className="font-bold text-slate-500 w-[140px] cursor-pointer hover:text-slate-800 transition-colors select-none"
                  onClick={() => handleSort("time")}
                >
                  <div className="flex items-center gap-1.5">
                    THỜI GIAN
                    <SortIcon columnKey="time" />
                  </div>
                </TableHead>
                <TableHead className="font-bold text-slate-500 text-right w-[100px]">
                  THAO TÁC
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {missions.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-12 text-slate-400"
                  >
                    Chưa có nhiệm vụ nào
                  </TableCell>
                </TableRow>
              )}
              {sortedMissions.map((m) => {
                const req = getRequest(m.requestId);
                const sc = statusColors[m.status] ?? statusColors.ASSIGNED;
                return (
                  <TableRow key={m.id} className="hover:bg-slate-50">
                    <TableCell>
                      {req ? (
                        <div>
                          <div className="font-bold text-slate-800 text-xs">
                            {emergencyTypeLabels[req.emergencyType] ??
                              req.emergencyType}
                          </div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3" />{" "}
                            {req.location?.address ?? "N/A"}
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 font-mono">
                          ID: {m.requestId.substring(0, 8)}...
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="font-bold text-slate-800 text-xs">
                        {m.rescueTeam?.teamName || getTeamName(m.rescueTeamId)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`flex items-center ${sc.text} font-bold text-[11px] ${sc.bg} px-2 py-1 rounded w-fit`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${sc.dot} mr-1.5 shrink-0`}
                        />
                        {missionStatusLabels[m.status] ?? m.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <Clock className="w-3 h-3" />
                        {m.createdAt
                          ? toUtcDate(m.createdAt).toLocaleString("vi-VN", {
                            hour: "2-digit",
                            minute: "2-digit",
                            day: "2-digit",
                            month: "2-digit",
                          })
                          : "N/A"}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        onClick={() => router.push(`/dispatcher/missions/${m.id}`)}
                      >
                        <Eye className="w-4 h-4 mr-1.5" />
                        Chi tiết
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>

      {/* Mission Detail Dialog */}
      <Dialog open={!!selectedMission} onOpenChange={(open) => !open && setSelectedMission(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Chi tiết nhiệm vụ</DialogTitle>
          </DialogHeader>

          {selectedMission && (() => {
            const req = getRequest(selectedMission.requestId);
            const sc = statusColors[selectedMission.status] ?? statusColors.ASSIGNED;

            return (
              <div className="space-y-5 mt-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-1.5">Trạng thái</h4>
                    <span className={`inline-flex items-center ${sc.text} font-bold text-xs ${sc.bg} px-2 py-1 rounded`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${sc.dot} mr-1.5 shrink-0`} />
                      {missionStatusLabels[selectedMission.status] ?? selectedMission.status}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-1.5">Thời gian tạo</h4>
                    <div className="text-sm font-medium text-slate-800 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-slate-400" />
                      {selectedMission.createdAt
                        ? toUtcDate(selectedMission.createdAt).toLocaleString("vi-VN", { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })
                        : "N/A"}
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                  {selectedMission.status === "COMPLETED" ? (
                    <div>
                      <h4 className="text-xs font-bold text-slate-500 uppercase mb-1.5">Hoàn thành lúc</h4>
                      <div className="text-sm font-medium text-emerald-600 flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-emerald-500" />
                        {selectedMission.endTime || selectedMission.updateAt
                          ? toUtcDate(selectedMission.endTime || selectedMission.updateAt!).toLocaleString("vi-VN", { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })
                          : "N/A"}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h4 className="text-xs font-bold text-slate-500 uppercase mb-1.5">Thời gian đã trôi qua (Chưa hoàn thành)</h4>
                      <div className="text-sm font-bold text-amber-600 flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-amber-500" />
                        {getDurationText(selectedMission.createdAt)}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase mb-1.5">Đội cứu hộ tiếp nhận</h4>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                      <span className="text-blue-600 font-bold text-sm">
                        {(selectedMission.rescueTeam?.teamName || getTeamName(selectedMission.rescueTeamId)).charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="text-sm font-bold text-slate-800">
                      {selectedMission.rescueTeam?.teamName || getTeamName(selectedMission.rescueTeamId)}
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase mb-1.5">Yêu cầu liên quan</h4>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="font-bold text-sm text-slate-800">
                      {req ? (emergencyTypeLabels[req.emergencyType] ?? req.emergencyType) : "ID: " + selectedMission.requestId}
                    </div>
                    {req && (
                      <>
                        <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-2">
                          <MapPin className="w-3.5 h-3.5 shrink-0" />
                          <span className="line-clamp-2">{req.location?.address ?? "N/A"}</span>
                        </div>
                        {req.description && (
                          <div className="mt-3 pt-3 border-t border-slate-200 text-xs text-slate-600 italic">
                            "{req.description}"
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
