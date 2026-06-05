"use client";

import { AlertTriangle, CheckCircle, Clock, Shield, TrendingUp, Users } from "lucide-react";
import type { RequestSummary, RescueTeamSummary, MissionSummary } from "@/lib/api/types";
import { cn } from "@/lib/utils";

interface Props {
  requests: RequestSummary[];
  teams: RescueTeamSummary[];
  missions: MissionSummary[];
}

export function DispatcherOverview({ requests, teams, missions }: Props) {
  const pending = requests.filter((r) => r.status === "PENDING").length;
  const inProgress = requests.filter((r) => ["ACCEPTED", "IN_PROGRESS"].includes(r.status)).length;
  const completed = requests.filter((r) => r.status === "COMPLETED").length;
  const activeTeams = teams.filter(
    (t) => t.status === "AVAILABLE" || t.status === "ON_MISSION",
  ).length;
  const activeMissions = missions.filter((m) => !["COMPLETED", "ABORTED"].includes(m.status)).length;
  const critical = requests.filter((r) => r.priority === "CRITICAL" && r.status === "PENDING").length;

  const stats = [
    {
      label: "Tổng yêu cầu",
      value: requests.length,
      icon: TrendingUp,
      theme: "blue",
      gradient: "from-blue-500/10 to-indigo-500/5",
      border: "border-blue-200/50 dark:border-blue-800/30",
      text: "text-blue-600 dark:text-blue-400",
      shadow: "hover:shadow-blue-500/10",
      glowBg: "bg-blue-500/10"
    },
    {
      label: "Chờ xử lý",
      value: pending,
      icon: Clock,
      theme: "amber",
      gradient: "from-amber-500/10 to-orange-500/5",
      border: "border-amber-200/50 dark:border-amber-800/30",
      text: "text-amber-600 dark:text-amber-450",
      shadow: "hover:shadow-amber-500/10",
      glowBg: "bg-amber-500/10"
    },
    {
      label: "Đang xử lý",
      value: inProgress,
      icon: AlertTriangle,
      theme: "indigo",
      gradient: "from-indigo-500/10 to-purple-500/5",
      border: "border-indigo-200/50 dark:border-indigo-800/30",
      text: "text-indigo-600 dark:text-indigo-400",
      shadow: "hover:shadow-indigo-500/10",
      glowBg: "bg-indigo-500/10"
    },
    {
      label: "Hoàn thành",
      value: completed,
      icon: CheckCircle,
      theme: "emerald",
      gradient: "from-emerald-500/10 to-teal-500/5",
      border: "border-emerald-200/50 dark:border-emerald-800/30",
      text: "text-emerald-600 dark:text-emerald-450",
      shadow: "hover:shadow-emerald-500/10",
      glowBg: "bg-emerald-500/10"
    },
    {
      label: "Cấp bách",
      value: critical,
      icon: Shield,
      theme: "red",
      gradient: "from-red-500/10 to-rose-500/5",
      border: "border-red-200/50 dark:border-red-800/30",
      text: "text-red-600 dark:text-red-400",
      shadow: "hover:shadow-red-500/10",
      glowBg: "bg-red-500/10 animate-pulse"
    },
    {
      label: "Nhiệm vụ đang chạy",
      value: activeMissions,
      icon: Users,
      theme: "violet",
      gradient: "from-violet-500/10 to-fuchsia-500/5",
      border: "border-violet-200/50 dark:border-violet-800/30",
      text: "text-violet-600 dark:text-violet-400",
      shadow: "hover:shadow-violet-500/10",
      glowBg: "bg-violet-500/10"
    },
  ];

  return (
    <div className="w-full space-y-4">
      {/* Dynamic API Status bar */}
      <div className="flex items-center justify-between bg-white/60 dark:bg-slate-900/60 backdrop-blur-md p-3 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          Bảng phân tích trực quan
        </h3>
        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-semibold">
          <span>{teams.length} đội</span>
          <span className="text-slate-300 dark:text-slate-700">•</span>
          <span className="text-emerald-600 dark:text-emerald-400">{activeTeams} đội sẵn sàng</span>
        </div>
      </div>

      {/* Modern Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className={cn(
              "group relative overflow-hidden bg-white dark:bg-slate-900/40 backdrop-blur-md p-4 rounded-2xl border shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md",
              s.border,
              s.shadow
            )}
          >
            {/* Ambient Background Gradient */}
            <div className={cn("absolute inset-0 bg-gradient-to-br opacity-70 transition-opacity duration-300 group-hover:opacity-100", s.gradient)} />

            {/* Glowing spot */}
            <div className="absolute -right-6 -top-6 w-20 h-20 bg-white/20 dark:bg-white/5 rounded-full blur-xl transition-all duration-300 group-hover:scale-125" />

            <div className="relative z-10 flex flex-col justify-between h-full space-y-3">
              <div className="flex items-center justify-between">
                <span className={cn("text-[10px] font-black tracking-wider uppercase text-slate-400 dark:text-slate-500 block truncate max-w-[80%]", s.theme === "red" && "text-red-500/80")}>
                  {s.label}
                </span>
                <div className={cn("p-1.5 rounded-lg flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110", s.glowBg)}>
                  <s.icon className={cn("w-4 h-4", s.text)} />
                </div>
              </div>
              <div className="flex items-baseline gap-1">
                <span className={cn("text-3xl font-black tracking-tight", s.text)}>
                  {s.value}
                </span>
                {s.label === "Cấp bách" && s.value > 0 && (
                  <span className="relative flex h-2 w-2 mb-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
