"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  BarChart3, PieChart, TrendingUp, Clock, CheckCircle, XCircle,
  AlertTriangle, Flame, Droplets, Stethoscope, Mountain, Car, Building2, HelpCircle, Globe,
  Shield, Info, RefreshCw, Activity, ArrowUpRight
} from "lucide-react";
import { emergencyTypeLabels, priorityLabels, statusLabels, missionStatusLabels } from "@/lib/api/features/requests/dispatcher.queries";
import type { RequestSummary, MissionSummary, RescueTeamSummary } from "@/lib/api/types";
import { cn } from "@/lib/utils";

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

const emergencyColors: Record<string, { bg: string; text: string; bar: string; glow: string }> = {
  FIRE: {
    bg: "bg-red-50 dark:bg-red-950/20",
    text: "text-red-650 dark:text-red-400",
    bar: "bg-gradient-to-r from-red-500 to-rose-600",
    glow: "shadow-red-500/10"
  },
  FLOOD: {
    bg: "bg-blue-50 dark:bg-blue-950/20",
    text: "text-blue-650 dark:text-blue-400",
    bar: "bg-gradient-to-r from-blue-500 to-indigo-650",
    glow: "shadow-blue-500/10"
  },
  EARTHQUAKE: {
    bg: "bg-amber-50 dark:bg-amber-950/20",
    text: "text-amber-700 dark:text-amber-400",
    bar: "bg-gradient-to-r from-amber-600 to-yellow-600",
    glow: "shadow-amber-500/10"
  },
  MEDICAL_EMERGENCY: {
    bg: "bg-emerald-50 dark:bg-emerald-950/20",
    text: "text-emerald-650 dark:text-emerald-400",
    bar: "bg-gradient-to-r from-emerald-550 to-teal-600",
    glow: "shadow-emerald-500/10"
  },
  TRAFFIC_EMERGENCY: {
    bg: "bg-orange-50 dark:bg-orange-950/20",
    text: "text-orange-650 dark:text-orange-400",
    bar: "bg-gradient-to-r from-orange-500 to-amber-500",
    glow: "shadow-orange-500/10"
  },
  BUILDING_COLLAPSE: {
    bg: "bg-violet-50 dark:bg-violet-950/20",
    text: "text-violet-650 dark:text-violet-400",
    bar: "bg-gradient-to-r from-violet-500 to-purple-650",
    glow: "shadow-violet-500/10"
  },
  NATURAL_DISASTER: {
    bg: "bg-teal-50 dark:bg-teal-950/20",
    text: "text-teal-650 dark:text-teal-400",
    bar: "bg-gradient-to-r from-teal-500 to-emerald-500",
    glow: "shadow-teal-500/10"
  },
  OTHER: {
    bg: "bg-slate-50 dark:bg-slate-900/20",
    text: "text-slate-650 dark:text-slate-400",
    bar: "bg-gradient-to-r from-slate-400 to-zinc-500",
    glow: "shadow-slate-500/10"
  },
};

const priorityColors: Record<string, { text: string; bg: string; dot: string; grad: string }> = {
  CRITICAL: { text: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-950/25", dot: "bg-red-500", grad: "url(#gradCritical)" },
  HIGH: { text: "text-orange-650 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-950/25", dot: "bg-orange-500", grad: "url(#gradHigh)" },
  MEDIUM: { text: "text-yellow-600 dark:text-yellow-400", bg: "bg-yellow-50 dark:bg-yellow-950/25", dot: "bg-yellow-500", grad: "url(#gradMedium)" },
  LOW: { text: "text-slate-550 dark:text-slate-400", bg: "bg-slate-50 dark:bg-slate-900/25", dot: "bg-slate-400", grad: "url(#gradLow)" },
};

const statusGlows: Record<string, string> = {
  PENDING: "bg-gradient-to-r from-red-400 to-red-650",
  ACCEPTED: "bg-gradient-to-r from-amber-400 to-amber-600",
  IN_PROGRESS: "bg-gradient-to-r from-blue-400 to-blue-650",
  COMPLETED: "bg-gradient-to-r from-emerald-400 to-emerald-650",
  CANCELED: "bg-gradient-to-r from-slate-400 to-zinc-500",
  REJECTED: "bg-gradient-to-r from-rose-400 to-red-650",
};

export function AnalyticsPanel({ requests, missions, teams }: Props) {
  const [hoveredTrendIndex, setHoveredTrendIndex] = useState<number | null>(null);

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

    // --- Stats calculations ---
    const pendingRequests = requests.filter((r) => r.status === "PENDING");
    const resolvedRequests = requests.filter((r) => ["COMPLETED", "CANCELED", "REJECTED"].includes(r.status));

    // --- Teams utilization ---
    const activeTeams = teams.filter(
      (t) => t.status === "AVAILABLE" || t.status === "ON_MISSION",
    ).length;
    const teamUtilization = teams.length > 0 ? Math.round((activeTeams / teams.length) * 100) : 0;

    return {
      byType,
      maxTypeCount,
      byPriority,
      byStatus,
      missionByStatus,
      completedMissions,
      abortedMissions,
      successRate,
      days,
      maxDayCount,
      pendingRequests,
      resolvedRequests,
      activeTeams,
      teamUtilization
    };
  }, [requests, missions, teams]);

  // Math for Priority Donut Chart (Radius = 35)
  const totalRequests = requests.length || 1;
  const radius = 35;
  const circumference = 2 * Math.PI * radius; // ~219.91
  const priorityOrder = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];

  // Compute accumulated percentages for SVG offset stacking
  let accumulatedPct = 0;
  const donutSlices = priorityOrder.map((p) => {
    const count = analytics.byPriority[p] || 0;
    const pct = count / totalRequests;
    const strokeDash = pct * circumference;
    const strokeOffset = circumference - strokeDash + (accumulatedPct * circumference);
    accumulatedPct += pct;
    return {
      priority: p,
      count,
      pct: Math.round(pct * 100),
      strokeDasharray: `${strokeDash} ${circumference}`,
      strokeDashoffset: strokeOffset,
    };
  });

  // Calculate coordinates for the 7 Days Trend SVG Area Chart (viewBox: 0 0 540 160)
  const chartW = 540;
  const chartH = 160;
  const padL = 40;
  const padR = 20;
  const padT = 20;
  const padB = 25;
  const innerW = chartW - padL - padR;
  const innerH = chartH - padT - padB;

  const trendPoints = analytics.days.map((day, i) => {
    const x = padL + i * (innerW / 6);
    const y = padT + innerH - (day.count / analytics.maxDayCount) * innerH;
    return { x, y, label: day.label, count: day.count };
  });

  // SVG Area path generator
  const areaPath = trendPoints.length > 0
    ? `M ${trendPoints[0].x} ${padT + innerH} ` +
      trendPoints.map((p) => `L ${p.x} ${p.y}`).join(" ") +
      ` L ${trendPoints[trendPoints.length - 1].x} ${padT + innerH} Z`
    : "";

  // SVG Line path generator
  const linePath = trendPoints.length > 0
    ? trendPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ")
    : "";

  return (
    <ScrollArea className="h-[calc(100vh-275px)] pr-2">
      <div className="space-y-6 pb-6">

        {/* TOP LAYER: MAIN CHARTS ROW (3 COLUMNS) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">

          {/* ===== 1. BY EMERGENCY TYPE ===== */}
          <div className="bg-white dark:bg-slate-900/40 backdrop-blur-md rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm p-6 flex flex-col hover:shadow-md transition-all duration-300 col-span-1 lg:col-span-2 xl:col-span-1">
            <div className="flex items-center justify-between mb-5 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/20 text-[#003da5] dark:text-blue-400">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-850 dark:text-slate-100">Báo cáo theo Loại Sự Cố</h3>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold mt-0.5">Phân bổ sự vụ chi tiết</p>
                </div>
              </div>
              <Badge variant="secondary" className="font-bold text-[10px] bg-slate-50 dark:bg-slate-800/40 border-slate-200/40 text-slate-500">
                {Object.keys(analytics.byType).length} Loại
              </Badge>
            </div>

            <div className="space-y-4 flex-1">
              {Object.entries(analytics.byType)
                .sort(([, a], [, b]) => b - a)
                .map(([type, count]) => {
                  const percent = Math.round((count / totalRequests) * 100);
                  const colors = emergencyColors[type] || emergencyColors.OTHER;
                  return (
                    <div key={type} className="group/item flex items-center gap-3.5 transition-all duration-200">
                      {/* Icon wrapper */}
                      <div className={cn(
                        "w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm transition-transform duration-300 group-hover/item:scale-105",
                        colors.bar
                      )}>
                        {emergencyIcons[type] ?? <HelpCircle className="w-4 h-4" />}
                      </div>

                      {/* Info & bar */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-black text-slate-700 dark:text-slate-350 truncate">
                            {emergencyTypeLabels[type]?.replace(/^.{2}\s/, "") ?? type}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-black text-slate-900 dark:text-white">{count}</span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">({percent}%)</span>
                          </div>
                        </div>
                        {/* Progress Bar Container */}
                        <div className="h-2 bg-slate-100/80 dark:bg-slate-800/80 rounded-full overflow-hidden relative shadow-inner">
                          <div
                            className={cn("h-full rounded-full transition-all duration-1000", colors.bar)}
                            style={{ width: `${(count / analytics.maxTypeCount) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              {Object.keys(analytics.byType).length === 0 && (
                <div className="flex flex-col items-center justify-center h-44 text-slate-400 dark:text-slate-600 gap-2 border border-dashed border-slate-200/55 dark:border-slate-800 rounded-xl bg-slate-50/20">
                  <Info className="w-6 h-6 stroke-[1.5]" />
                  <p className="text-xs font-semibold">Chưa có dữ liệu sự cố</p>
                </div>
              )}
            </div>
          </div>

          {/* ===== 2. BY PRIORITY (DONUT) ===== */}
          <div className="bg-white dark:bg-slate-900/40 backdrop-blur-md rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm p-6 flex flex-col hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-between mb-5 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-orange-50 dark:bg-orange-950/20 text-orange-650 dark:text-orange-400">
                  <PieChart className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-850 dark:text-slate-100">Cấp Độ Ưu Tiên</h3>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold mt-0.5">Mức khẩn cấp cứu nạn</p>
                </div>
              </div>
            </div>

            {/* Circular Donut chart wrapper */}
            <div className="flex items-center justify-center my-3 relative">
              <div className="relative w-36 h-36">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <defs>
                    <linearGradient id="gradCritical" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#ef4444" />
                      <stop offset="100%" stopColor="#f87171" />
                    </linearGradient>
                    <linearGradient id="gradHigh" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#f97316" />
                      <stop offset="100%" stopColor="#fb923c" />
                    </linearGradient>
                    <linearGradient id="gradMedium" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#eab308" />
                      <stop offset="100%" stopColor="#fde047" />
                    </linearGradient>
                    <linearGradient id="gradLow" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#64748b" />
                      <stop offset="100%" stopColor="#94a3b8" />
                    </linearGradient>
                  </defs>

                  {/* Background Track */}
                  <circle cx="50" cy="50" r={radius} fill="none" stroke="#f1f5f9" dark-stroke="#1e293b" strokeWidth="9" className="dark:opacity-10" />

                  {/* Donut Slices */}
                  {donutSlices.map((slice) => (
                    <circle
                      key={slice.priority}
                      cx="50"
                      cy="50"
                      r={radius}
                      fill="none"
                      stroke={priorityColors[slice.priority]?.grad}
                      strokeWidth="10"
                      strokeDasharray={slice.strokeDasharray}
                      strokeDashoffset={slice.strokeDashoffset}
                      strokeLinecap="round"
                      className="transition-all duration-1000 origin-center cursor-pointer hover:stroke-[12]"
                    >
                      <title>{`${priorityLabels[slice.priority]}: ${slice.count} (${slice.pct}%)`}</title>
                    </circle>
                  ))}
                </svg>

                {/* Donut Center text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white dark:bg-slate-950/80 rounded-full w-24 h-24 m-auto shadow-sm border border-slate-100 dark:border-slate-800">
                  <span className="text-2xl font-black text-slate-850 dark:text-white leading-none">
                    {requests.length}
                  </span>
                  <span className="text-[9px] text-slate-400 dark:text-slate-500 font-extrabold uppercase mt-1 tracking-wider">
                    Yêu cầu
                  </span>
                </div>
              </div>
            </div>

            {/* Grid details */}
            <div className="grid grid-cols-2 gap-3 mt-4">
              {donutSlices.map((slice) => {
                const c = priorityColors[slice.priority];
                return (
                  <div
                    key={slice.priority}
                    className={cn(
                      "flex items-center gap-2.5 p-2 rounded-xl border border-slate-100 dark:border-slate-850 shadow-2xs hover:shadow-xs transition-shadow duration-200",
                      c.bg
                    )}
                  >
                    <span className={cn("w-2 h-2 rounded-full shrink-0", c.dot)} />
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 block truncate leading-none mb-0.5">
                        {priorityLabels[slice.priority]}
                      </span>
                      <span className="text-xs font-black text-slate-800 dark:text-slate-100 leading-none">
                        {slice.count} <span className="text-[9px] text-slate-400 dark:text-slate-500 font-medium">({slice.pct}%)</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ===== 3. BY STATUS DISTRIBUTION ===== */}
          <div className="bg-white dark:bg-slate-900/40 backdrop-blur-md rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm p-6 flex flex-col hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-between mb-5 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/20 text-indigo-650 dark:text-indigo-400">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-850 dark:text-slate-100">Quy Trình Xử Lý</h3>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold mt-0.5">Trạng thái hệ thống</p>
                </div>
              </div>
            </div>

            <div className="space-y-4 flex-1">
              {["PENDING", "ACCEPTED", "IN_PROGRESS", "COMPLETED", "CANCELED", "REJECTED"].map((s) => {
                const count = analytics.byStatus[s] || 0;
                const pct = requests.length > 0 ? Math.round((count / requests.length) * 100) : 0;
                const progressColor = statusGlows[s];
                return (
                  <div key={s} className="group/status">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className={cn("w-2 h-2 rounded-full", s === "PENDING" ? "bg-red-500" : s === "ACCEPTED" ? "bg-amber-500" : s === "IN_PROGRESS" ? "bg-blue-500" : s === "COMPLETED" ? "bg-emerald-500" : "bg-slate-400")} />
                        <span className="font-black text-slate-650 dark:text-slate-450">{statusLabels[s] ?? s}</span>
                      </div>
                      <span className="font-black text-slate-850 dark:text-white">
                        {count} <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">({pct}%)</span>
                      </span>
                    </div>
                    {/* Gauge wrapper */}
                    <div className="h-1.5 bg-slate-100/85 dark:bg-slate-800 rounded-full overflow-hidden shadow-2xs">
                      <div
                        className={cn("h-full rounded-full transition-all duration-1000", progressColor)}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* MIDDLE LAYER: 7 DAYS TREND & MISSION PERFORMANCE (2 COLUMNS) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ===== 4. 7 DAYS TREND (responsive area chart) ===== */}
          <div className="bg-white dark:bg-slate-900/40 backdrop-blur-md rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm p-6 col-span-1 lg:col-span-2 flex flex-col hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-between mb-5 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/20 text-blue-650 dark:text-blue-400">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-850 dark:text-slate-100">Xu Hướng Báo Cáo Sự Cố</h3>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold mt-0.5">Số lượng yêu cầu trong 7 ngày qua</p>
                </div>
              </div>
              {analytics.days[6] && (
                <div className="flex items-center gap-1.5 text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-250/20 px-2.5 py-1 rounded-lg">
                  Hôm nay: {analytics.days[6].count} vụ <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
                </div>
              )}
            </div>

            {/* Custom SVG Area chart */}
            <div className="relative w-full aspect-[21/7] mt-2 select-none">
              <svg viewBox={`0 0 ${chartW} ${chartH}`} width="100%" height="100%" className="overflow-visible">
                <defs>
                  {/* Glowing Area Gradient */}
                  <linearGradient id="trendAreaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#003da5" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#003da5" stopOpacity="0.0" />
                  </linearGradient>
                  {/* Line Gradient */}
                  <linearGradient id="trendLineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#003da5" />
                  </linearGradient>
                  {/* Grid shadow */}
                  <filter id="glowCircle" x="-50%" y="-50%" width="200%" height="200%">
                    <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#3b82f6" floodOpacity="0.4" />
                  </filter>
                </defs>

                {/* Y-Axis helper grid lines (dashed guides) */}
                {[0, 0.5, 1].map((ratio, index) => {
                  const yVal = padT + ratio * innerH;
                  return (
                    <line
                      key={index}
                      x1={padL}
                      y1={yVal}
                      x2={chartW - padR}
                      y2={yVal}
                      stroke="#e2e8f0"
                      dark-stroke="#1e293b"
                      strokeWidth="1"
                      strokeDasharray="4 4"
                      className="dark:opacity-30"
                    />
                  );
                })}

                {/* Y-Axis Value Indicators */}
                {[1, 0.5, 0].map((ratio, index) => {
                  const yVal = padT + (1 - ratio) * innerH;
                  const labelVal = Math.round(ratio * analytics.maxDayCount);
                  return (
                    <text
                      key={index}
                      x={padL - 10}
                      y={yVal + 3.5}
                      textAnchor="end"
                      fontSize="9"
                      fontWeight="bold"
                      fill="#94a3b8"
                      className="font-sans"
                    >
                      {labelVal}
                    </text>
                  );
                })}

                {/* Area Gradient Shape */}
                {areaPath && (
                  <path
                    d={areaPath}
                    fill="url(#trendAreaGrad)"
                    className="transition-all duration-700"
                  />
                )}

                {/* Stroke Line Curve */}
                {linePath && (
                  <path
                    d={linePath}
                    fill="none"
                    stroke="url(#trendLineGrad)"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="transition-all duration-700"
                  />
                )}

                {/* Value nodes / circle markers */}
                {trendPoints.map((p, index) => {
                  const isHovered = hoveredTrendIndex === index;
                  return (
                    <g key={index}>
                      {/* Interactive Hover Area */}
                      <rect
                        x={p.x - innerW / 14}
                        y={padT}
                        width={innerW / 7}
                        height={innerH + padB}
                        fill="transparent"
                        className="cursor-pointer"
                        onMouseEnter={() => setHoveredTrendIndex(index)}
                        onMouseLeave={() => setHoveredTrendIndex(null)}
                      />

                      {/* Animated outer glowing ring on hover */}
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r={isHovered ? 10 : 7}
                        fill="#3b82f6"
                        opacity={isHovered ? 0.35 : 0}
                        filter="url(#glowCircle)"
                        className="transition-all duration-205 pointer-events-none"
                      />

                      {/* Sharp center node */}
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r="3.5"
                        fill="#ffffff"
                        stroke={isHovered ? "#003da5" : "#3b82f6"}
                        strokeWidth="3"
                        className="transition-colors duration-200 pointer-events-none"
                      />

                      {/* Static top value label */}
                      <text
                        x={p.x}
                        y={p.y - 10}
                        textAnchor="middle"
                        fontSize="9.5"
                        fontWeight="black"
                        fill={isHovered ? "#003da5" : "#64748b"}
                        className="font-mono transition-colors duration-200 pointer-events-none"
                      >
                        {p.count}
                      </text>

                      {/* X-Axis day label */}
                      <text
                        x={p.x}
                        y={chartH - 8}
                        textAnchor="middle"
                        fontSize="9"
                        fontWeight="extrabold"
                        fill="#94a3b8"
                        className="font-sans pointer-events-none"
                      >
                        {p.label}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          {/* ===== 5. MISSION PERFORMANCE GAUGE ===== */}
          <div className="bg-white dark:bg-slate-900/40 backdrop-blur-md rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm p-6 flex flex-col hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-between mb-5 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-650 dark:text-emerald-400">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-850 dark:text-slate-100">Hiệu Suất Phân Động</h3>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold mt-0.5">Tỷ lệ cứu nạn thành công</p>
                </div>
              </div>
            </div>

            {/* Circular progress gauge */}
            <div className="flex items-center justify-center my-2.5 relative">
              <div className="relative w-32 h-32">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <defs>
                    <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#059669" />
                    </linearGradient>
                  </defs>
                  {/* Gauge background track */}
                  <circle cx="50" cy="50" r="41" fill="none" stroke="#f1f5f9" dark-stroke="#1e293b" strokeWidth="9.5" className="dark:opacity-10" />
                  {/* Glowing active success rate path */}
                  <circle
                    cx="50"
                    cy="50"
                    r="41"
                    fill="none"
                    stroke="url(#gaugeGrad)"
                    strokeWidth="10.5"
                    strokeLinecap="round"
                    strokeDasharray={`${analytics.successRate * 2.576} 257.6`}
                    className="transition-all duration-1000 origin-center"
                  />
                </svg>

                {/* Percentage details in center */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-black text-emerald-650 dark:text-emerald-450 leading-none">
                    {analytics.successRate}%
                  </span>
                  <span className="text-[8px] text-slate-400 dark:text-slate-500 font-black uppercase mt-1 tracking-widest">
                    Thành công
                  </span>
                </div>
              </div>
            </div>

            {/* Metric counters */}
            <div className="grid grid-cols-3 gap-2 text-center mt-3.5">
              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-2.5 border border-slate-100 dark:border-slate-850">
                <p className="text-sm font-black text-slate-700 dark:text-slate-300">{missions.length}</p>
                <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mt-0.5">Tổng</p>
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-950/20 rounded-xl p-2.5 border border-emerald-100/35">
                <p className="text-sm font-black text-emerald-600 dark:text-emerald-405">{analytics.completedMissions}</p>
                <p className="text-[9px] text-emerald-500 font-bold uppercase tracking-wider mt-0.5">Xong</p>
              </div>
              <div className="bg-red-50 dark:bg-red-950/20 rounded-xl p-2.5 border border-red-100/35">
                <p className="text-sm font-black text-red-600 dark:text-red-400">{analytics.abortedMissions}</p>
                <p className="text-[9px] text-red-500 font-bold uppercase tracking-wider mt-0.5">Hủy</p>
              </div>
            </div>

            {/* Dynamic mission breakdown */}
            <div className="mt-4 space-y-2 flex-1">
              {Object.entries(analytics.missionByStatus).map(([s, count]) => (
                <div key={s} className="flex items-center justify-between text-[11px] hover:bg-slate-50 dark:hover:bg-slate-900 p-1.5 rounded-lg transition-colors">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">{missionStatusLabels[s] ?? s}</span>
                  <Badge variant="outline" className="text-[10px] font-mono font-bold bg-white dark:bg-slate-800 border-slate-200/60 text-slate-700 dark:text-slate-300 px-2 py-0">
                    {count}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* BOTTOM LAYER: SYSTEM OPERATIONAL STATS CARD */}
        <div className="bg-white dark:bg-slate-900/40 backdrop-blur-md rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm p-6 hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between mb-6 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/20 text-[#003da5] dark:text-blue-400">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-850 dark:text-slate-100">Chỉ Số Vận Hành Hệ Thống</h3>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold mt-0.5">Khả năng phản ứng & Năng lực nhân sự</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

            {/* A. Team Utilization progress */}
            <div className="flex flex-col justify-between p-4 bg-slate-50 dark:bg-slate-900/30 rounded-2xl border border-slate-150/40 dark:border-slate-850">
              <div>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-bold text-slate-500 dark:text-slate-400">Lực lượng ứng trực</span>
                  <span className="font-black text-[#003da5] dark:text-blue-400">{analytics.activeTeams}/{teams.length}</span>
                </div>
                <Progress value={analytics.teamUtilization} className="h-2.5 bg-slate-200/60 dark:bg-slate-800" />
              </div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold mt-4">
                {analytics.teamUtilization}% đội sẵn sàng xuất kích ngay
              </p>
            </div>

            {/* B. Pending Queue details */}
            <div className={cn(
              "flex flex-col justify-between p-4 rounded-2xl border transition-all duration-300",
              analytics.pendingRequests.length > 0
                ? "bg-red-50/70 border-red-200/50 dark:bg-red-950/10 dark:border-red-900/35 shadow-sm shadow-red-500/5"
                : "bg-slate-50 dark:bg-slate-900/30 border-slate-150/40 dark:border-slate-850"
            )}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={cn("p-1.5 rounded-lg shrink-0", analytics.pendingRequests.length > 0 ? "bg-red-100/80 dark:bg-red-900/30 text-red-600" : "bg-slate-100 dark:bg-slate-800 text-slate-400")}>
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Hàng đợi chờ xử lý</span>
                </div>
                {analytics.pendingRequests.length > 0 && (
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                  </span>
                )}
              </div>
              <div className="flex items-baseline justify-between mt-3">
                <span className={cn("text-3xl font-black tracking-tight", analytics.pendingRequests.length > 0 ? "text-red-600 dark:text-red-400" : "text-slate-800 dark:text-slate-200")}>
                  {analytics.pendingRequests.length}
                </span>
                <span className="text-[10px] text-slate-450 dark:text-slate-500 font-semibold">Yêu cầu cứu trợ</span>
              </div>
            </div>

            {/* C. Resolved rate indicator */}
            <div className="flex flex-col justify-between p-4 bg-slate-50 dark:bg-slate-900/30 rounded-2xl border border-slate-150/40 dark:border-slate-850">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-bold text-slate-500 dark:text-slate-400">Tỷ lệ giải quyết</span>
                <span className="font-black text-emerald-600 dark:text-emerald-400">
                  {requests.length > 0 ? Math.round((analytics.resolvedRequests.length / totalRequests) * 100) : 0}%
                </span>
              </div>
              <Progress
                value={requests.length > 0 ? (analytics.resolvedRequests.length / totalRequests) * 100 : 0}
                className="h-2.5 bg-slate-200/60 dark:bg-slate-800"
              />
              <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 font-semibold mt-3">
                <span>Đã xử lý: {analytics.resolvedRequests.length} vụ</span>
                <span>/ {requests.length} vụ</span>
              </div>
            </div>

            {/* D. Personnel headcount */}
            <div className="flex flex-col justify-between p-4 bg-slate-50 dark:bg-slate-900/30 rounded-2xl border border-slate-150/40 dark:border-slate-850">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-indigo-100/80 dark:bg-indigo-950/20 text-[#003da5] dark:text-blue-400 shrink-0">
                  <Shield className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Tổng nhân sự cứu nạn</span>
              </div>
              <div className="flex items-baseline justify-between mt-3">
                <span className="text-3xl font-black tracking-tight text-slate-800 dark:text-slate-200">
                  {teams.reduce((s, t) => s + (t.memberCount ?? 0), 0)}
                </span>
                <span className="text-[10px] text-slate-450 dark:text-slate-500 font-semibold">Thành viên cứu hộ</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </ScrollArea>
  );
}
