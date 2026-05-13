"use client";

import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  BarChart3, PieChart, TrendingUp, Clock, CheckCircle, XCircle,
  AlertTriangle, Flame, Droplets, Stethoscope, Mountain, Car, Building2, HelpCircle, Globe,
} from "lucide-react";
import { emergencyTypeLabels, priorityLabels, statusLabels, missionStatusLabels } from "@/lib/api/dispatcher-queries";
import type { RequestSummary, MissionSummary, RescueTeamSummary } from "@/lib/api/types";

interface Props {
  requests: RequestSummary[];
  missions: MissionSummary[];
  teams: RescueTeamSummary[];
}

const emergencyIcons: Record<string, React.ReactNode> = {
  FIRE: <Flame className="w-4 h-4" />,
  FLOOD: <Droplets className="w-4 h-4" />,
  EARTHQUAKE: <Globe className="w-4 h-4" />,
  MEDICAL_EMERGENCY: <Stethoscope className="w-4 h-4" />,
  TRAFFIC_EMERGENCY: <Car className="w-4 h-4" />,
  BUILDING_COLLAPSE: <Building2 className="w-4 h-4" />,
  NATURAL_DISASTER: <Mountain className="w-4 h-4" />,
  OTHER: <HelpCircle className="w-4 h-4" />,
};

const emergencyColors: Record<string, string> = {
  FIRE: "bg-red-500", FLOOD: "bg-blue-500", EARTHQUAKE: "bg-amber-600",
  MEDICAL_EMERGENCY: "bg-emerald-500", TRAFFIC_EMERGENCY: "bg-orange-500",
  BUILDING_COLLAPSE: "bg-violet-500", NATURAL_DISASTER: "bg-teal-500", OTHER: "bg-slate-400",
};

const priorityColors: Record<string, string> = {
  CRITICAL: "bg-red-500", HIGH: "bg-orange-500", MEDIUM: "bg-yellow-500", LOW: "bg-slate-400",
};

const statusColors: Record<string, string> = {
  PENDING: "bg-red-500", ACCEPTED: "bg-amber-500", IN_PROGRESS: "bg-blue-500",
  COMPLETED: "bg-emerald-500", CANCELED: "bg-slate-400", REJECTED: "bg-slate-400",
};

export function AnalyticsPanel({ requests, missions, teams }: Props) {
  const analytics = useMemo(() => {
    // --- By Emergency Type ---
    const byType: Record<string, number> = {};
    requests.forEach((r) => { byType[r.emergencyType] = (byType[r.emergencyType] || 0) + 1; });
    const maxTypeCount = Math.max(...Object.values(byType), 1);

    // --- By Priority ---
    const byPriority: Record<string, number> = {};
    requests.forEach((r) => { byPriority[r.priority] = (byPriority[r.priority] || 0) + 1; });

    // --- By Status ---
    const byStatus: Record<string, number> = {};
    requests.forEach((r) => { byStatus[r.status] = (byStatus[r.status] || 0) + 1; });

    // --- Mission stats ---
    const missionByStatus: Record<string, number> = {};
    missions.forEach((m) => { missionByStatus[m.status] = (missionByStatus[m.status] || 0) + 1; });
    const completedMissions = missionByStatus["COMPLETED"] || 0;
    const abortedMissions = missionByStatus["ABORTED"] || 0;
    const successRate = missions.length > 0 ? Math.round((completedMissions / missions.length) * 100) : 0;

    // --- Daily trend (last 7 days) ---
    const now = new Date();
    const days: { label: string; count: number; date: string }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const label = d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
      const count = requests.filter((r) => r.createdAt?.startsWith(dateStr)).length;
      days.push({ label, count, date: dateStr });
    }
    const maxDayCount = Math.max(...days.map((d) => d.count), 1);

    // --- Avg response time (PENDING → ACCEPTED/IN_PROGRESS) ---
    const pendingRequests = requests.filter((r) => r.status === "PENDING");
    const resolvedRequests = requests.filter((r) => ["COMPLETED", "CANCELED", "REJECTED"].includes(r.status));

    // --- Teams utilization ---
    const activeTeams = teams.filter((t) => t.status === "ACTIVE" || t.status === "ON_DUTY").length;
    const teamUtilization = teams.length > 0 ? Math.round((activeTeams / teams.length) * 100) : 0;

    return { byType, maxTypeCount, byPriority, byStatus, missionByStatus, completedMissions, abortedMissions, successRate, days, maxDayCount, pendingRequests, resolvedRequests, activeTeams, teamUtilization };
  }, [requests, missions, teams]);

  return (
    <ScrollArea className="h-[calc(100vh-300px)]">
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">

        {/* ===== CARD 1: BY EMERGENCY TYPE (horizontal bar) ===== */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 col-span-1 lg:col-span-2 xl:col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-[#003da5]" />
            <h3 className="font-bold text-sm text-slate-800">Theo loại sự cố</h3>
          </div>
          <div className="space-y-3">
            {Object.entries(analytics.byType)
              .sort(([, a], [, b]) => b - a)
              .map(([type, count]) => (
                <div key={type} className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-white ${emergencyColors[type] ?? "bg-slate-400"}`}>
                    {emergencyIcons[type] ?? <HelpCircle className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs font-bold text-slate-700 truncate">{emergencyTypeLabels[type]?.replace(/^.{2}\s/, "") ?? type}</span>
                      <span className="text-xs font-black text-slate-900 ml-2">{count}</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-700 ${emergencyColors[type] ?? "bg-slate-400"}`} style={{ width: `${(count / analytics.maxTypeCount) * 100}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            {Object.keys(analytics.byType).length === 0 && (
              <p className="text-xs text-slate-400 text-center py-4">Chưa có dữ liệu</p>
            )}
          </div>
        </div>

        {/* ===== CARD 2: BY PRIORITY (donut-like) ===== */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <PieChart className="w-5 h-5 text-[#003da5]" />
            <h3 className="font-bold text-sm text-slate-800">Theo mức độ ưu tiên</h3>
          </div>
          <div className="flex items-center justify-center mb-4">
            <div className="relative w-32 h-32">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                {(() => {
                  const order = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];
                  const colors = { CRITICAL: "#ef4444", HIGH: "#f97316", MEDIUM: "#eab308", LOW: "#94a3b8" };
                  let offset = 0;
                  const total = requests.length || 1;
                  return order.map((p) => {
                    const count = analytics.byPriority[p] || 0;
                    const pct = (count / total) * 100;
                    const gap = 2;
                    const el = (
                      <circle key={p} cx="50" cy="50" r="40" fill="none"
                        stroke={colors[p as keyof typeof colors]} strokeWidth="12"
                        strokeDasharray={`${Math.max(pct - gap, 0)} ${100 - Math.max(pct - gap, 0)}`}
                        strokeDashoffset={-offset} strokeLinecap="round" className="transition-all duration-700" />
                    );
                    offset += pct;
                    return el;
                  });
                })()}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-slate-900">{requests.length}</span>
                <span className="text-[9px] text-slate-400 font-bold uppercase">Tổng</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {["CRITICAL", "HIGH", "MEDIUM", "LOW"].map((p) => (
              <div key={p} className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${priorityColors[p]}`} />
                <span className="text-[11px] text-slate-600">{priorityLabels[p]}</span>
                <span className="text-[11px] font-black text-slate-900 ml-auto">{analytics.byPriority[p] || 0}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ===== CARD 3: BY STATUS ===== */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-[#003da5]" />
            <h3 className="font-bold text-sm text-slate-800">Theo trạng thái</h3>
          </div>
          <div className="space-y-3">
            {["PENDING", "ACCEPTED", "IN_PROGRESS", "COMPLETED", "CANCELED", "REJECTED"].map((s) => {
              const count = analytics.byStatus[s] || 0;
              const pct = requests.length > 0 ? Math.round((count / requests.length) * 100) : 0;
              return (
                <div key={s}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${statusColors[s]}`} />
                      <span className="text-[11px] font-bold text-slate-600">{statusLabels[s] ?? s}</span>
                    </div>
                    <span className="text-[11px] font-black text-slate-800">{count} <span className="text-slate-400 font-normal">({pct}%)</span></span>
                  </div>
                  <Progress value={pct} className="h-1.5 bg-slate-100" />
                </div>
              );
            })}
          </div>
        </div>

        {/* ===== CARD 4: DAILY TREND ===== */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 col-span-1 lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-[#003da5]" />
            <h3 className="font-bold text-sm text-slate-800">Xu hướng 7 ngày gần nhất</h3>
          </div>
          <div className="flex items-end gap-2 h-40">
            {analytics.days.map((day) => (
              <div key={day.date} className="flex-1 flex flex-col items-center gap-1.5">
                <span className="text-[10px] font-black text-slate-700">{day.count}</span>
                <div className="w-full bg-slate-100 rounded-t-lg overflow-hidden relative" style={{ height: "100%" }}>
                  <div
                    className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#003da5] to-blue-400 rounded-t-lg transition-all duration-700"
                    style={{ height: `${analytics.maxDayCount > 0 ? (day.count / analytics.maxDayCount) * 100 : 0}%`, minHeight: day.count > 0 ? "8px" : "0" }}
                  />
                </div>
                <span className="text-[9px] text-slate-400 font-bold">{day.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ===== CARD 5: MISSION PERFORMANCE ===== */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="w-5 h-5 text-[#003da5]" />
            <h3 className="font-bold text-sm text-slate-800">Hiệu suất nhiệm vụ</h3>
          </div>

          {/* Success rate ring */}
          <div className="flex items-center justify-center mb-4">
            <div className="relative w-28 h-28">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r="42" fill="none" stroke="#f1f5f9" strokeWidth="10" />
                <circle cx="50" cy="50" r="42" fill="none"
                  stroke={analytics.successRate >= 70 ? "#10b981" : analytics.successRate >= 40 ? "#f59e0b" : "#ef4444"}
                  strokeWidth="10" strokeLinecap="round"
                  strokeDasharray={`${analytics.successRate * 2.64} 264`}
                  className="transition-all duration-1000" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-black text-slate-900">{analytics.successRate}%</span>
                <span className="text-[8px] text-slate-400 font-bold uppercase">Thành công</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-slate-50 rounded-lg p-2">
              <p className="text-lg font-black text-slate-700">{missions.length}</p>
              <p className="text-[9px] text-slate-400 font-bold uppercase">Tổng</p>
            </div>
            <div className="bg-emerald-50 rounded-lg p-2">
              <p className="text-lg font-black text-emerald-600">{analytics.completedMissions}</p>
              <p className="text-[9px] text-emerald-500 font-bold uppercase">Xong</p>
            </div>
            <div className="bg-red-50 rounded-lg p-2">
              <p className="text-lg font-black text-red-600">{analytics.abortedMissions}</p>
              <p className="text-[9px] text-red-500 font-bold uppercase">Hủy</p>
            </div>
          </div>

          {/* Mission status breakdown */}
          <div className="mt-4 space-y-1.5">
            {Object.entries(analytics.missionByStatus).map(([s, count]) => (
              <div key={s} className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500">{missionStatusLabels[s] ?? s}</span>
                <Badge variant="outline" className="text-[10px] font-bold">{count}</Badge>
              </div>
            ))}
          </div>
        </div>

        {/* ===== CARD 6: TEAM UTILIZATION & KEY METRICS ===== */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 col-span-1 lg:col-span-2 xl:col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-[#003da5]" />
            <h3 className="font-bold text-sm text-slate-800">Chỉ số vận hành</h3>
          </div>

          <div className="space-y-4">
            {/* Team utilization */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-600">Đội đang hoạt động</span>
                <span className="text-xs font-black text-[#003da5]">{analytics.activeTeams}/{teams.length}</span>
              </div>
              <Progress value={analytics.teamUtilization} className="h-2.5 bg-slate-100" />
              <p className="text-[10px] text-slate-400 mt-1">{analytics.teamUtilization}% đội sẵn sàng</p>
            </div>

            {/* Pending queue */}
            <div className="bg-red-50 rounded-xl p-3 border border-red-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <span className="text-xs font-bold text-red-700">Hàng đợi chờ xử lý</span>
                </div>
                <span className="text-xl font-black text-red-600">{analytics.pendingRequests.length}</span>
              </div>
            </div>

            {/* Resolved */}
            <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs font-bold text-emerald-700">Đã giải quyết</span>
                </div>
                <span className="text-xl font-black text-emerald-600">{analytics.resolvedRequests.length}</span>
              </div>
            </div>

            {/* Resolution rate */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-600">Tỷ lệ giải quyết</span>
                <span className="text-xs font-black text-emerald-600">
                  {requests.length > 0 ? Math.round((analytics.resolvedRequests.length / requests.length) * 100) : 0}%
                </span>
              </div>
              <Progress
                value={requests.length > 0 ? (analytics.resolvedRequests.length / requests.length) * 100 : 0}
                className="h-2.5 bg-slate-100"
              />
            </div>

            {/* Members total */}
            <div className="flex items-center justify-between bg-slate-50 rounded-xl p-3 border border-slate-100">
              <span className="text-xs font-bold text-slate-600">Tổng nhân sự</span>
              <span className="text-lg font-black text-slate-800">{teams.reduce((s, t) => s + (t.memberCount ?? 0), 0)}</span>
            </div>
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}
