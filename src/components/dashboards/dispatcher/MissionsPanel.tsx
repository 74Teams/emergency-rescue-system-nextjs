"use client";

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
import { Clock, MapPin } from "lucide-react";
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
                <TableHead className="font-bold text-slate-500 w-[100px]">
                  TRẠNG THÁI
                </TableHead>
                <TableHead className="font-bold text-slate-500">
                  YÊU CẦU LIÊN QUAN
                </TableHead>
                <TableHead className="font-bold text-slate-500 w-[150px]">
                  ĐỘI CỨU HỘ
                </TableHead>
                <TableHead className="font-bold text-slate-500 w-[120px]">
                  THỜI GIAN
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {missions.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center py-12 text-slate-400"
                  >
                    Chưa có nhiệm vụ nào
                  </TableCell>
                </TableRow>
              )}
              {missions.map((m) => {
                const req = getRequest(m.requestId);
                const sc = statusColors[m.status] ?? statusColors.ASSIGNED;
                return (
                  <TableRow key={m.id} className="hover:bg-slate-50">
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
                        {getTeamName(m.rescueTeamId)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <Clock className="w-3 h-3" />
                        {m.createdAt
                          ? new Date(m.createdAt).toLocaleString("vi-VN", {
                              hour: "2-digit",
                              minute: "2-digit",
                              day: "2-digit",
                              month: "2-digit",
                            })
                          : "N/A"}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>
    </div>
  );
}
