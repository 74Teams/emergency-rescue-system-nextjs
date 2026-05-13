"use client";

import { AlertTriangle, CheckCircle, Clock, Shield, TrendingUp, Users } from "lucide-react";
import type { RequestSummary, RescueTeamSummary, MissionSummary } from "@/lib/api/types";

interface Props {
  requests: RequestSummary[];
  teams: RescueTeamSummary[];
  missions: MissionSummary[];
}

export function DispatcherOverview({ requests, teams, missions }: Props) {
  const pending = requests.filter((r) => r.status === "PENDING").length;
  const inProgress = requests.filter((r) => ["ACCEPTED", "IN_PROGRESS"].includes(r.status)).length;
  const completed = requests.filter((r) => r.status === "COMPLETED").length;
  const activeTeams = teams.filter((t) => t.status === "ACTIVE" || t.status === "ON_DUTY").length;
  const activeMissions = missions.filter((m) => !["COMPLETED", "ABORTED"].includes(m.status)).length;
  const critical = requests.filter((r) => r.priority === "CRITICAL" && r.status === "PENDING").length;

  const stats = [
    { label: "Tổng yêu cầu", value: requests.length, icon: TrendingUp, color: "text-[#003da5]", bg: "bg-blue-50 border-blue-100" },
    { label: "Chờ xử lý", value: pending, icon: Clock, color: "text-amber-600", bg: "bg-amber-50 border-amber-100" },
    { label: "Đang xử lý", value: inProgress, icon: AlertTriangle, color: "text-blue-600", bg: "bg-blue-50 border-blue-100" },
    { label: "Hoàn thành", value: completed, icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-100" },
    { label: "Cấp bách", value: critical, icon: Shield, color: "text-red-600", bg: "bg-red-50 border-red-100" },
    { label: "Nhiệm vụ đang chạy", value: activeMissions, icon: Users, color: "text-violet-600", bg: "bg-violet-50 border-violet-100" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Bảng Điều Phối Cứu Trợ</h1>
          <p className="text-slate-500 text-sm mt-1">RescueCore — Giám sát & Điều động thời gian thực</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="relative flex h-2 w-2"><span className="animate-ping absolute h-full w-full rounded-full bg-green-400 opacity-75" /><span className="relative rounded-full h-2 w-2 bg-green-500" /></span>
          Đang kết nối API • {teams.length} đội • {activeTeams} sẵn sàng
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {stats.map((s) => (
          <div key={s.label} className={`p-3 rounded-xl border shadow-sm ${s.bg}`}>
            <div className="flex items-center gap-2 mb-1">
              <s.icon className={`w-4 h-4 ${s.color}`} />
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate">{s.label}</p>
            </div>
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
