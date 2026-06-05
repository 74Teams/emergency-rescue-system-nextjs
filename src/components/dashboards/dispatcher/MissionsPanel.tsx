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
import {
  Clock,
  MapPin,
  Eye,
  ArrowUpDown,
  ArrowDown,
  ArrowUp,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Flame,
  Waves,
  Activity,
  HeartPulse,
  Car,
  Home,
  AlertTriangle,
  FileText,
  Compass,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  emergencyTypeLabels,
  missionStatusLabels,
} from "@/lib/api/features/requests/dispatcher.queries";
import type {
  MissionSummary,
  RequestSummary,
  RescueTeamSummary,
} from "@/lib/api/types";
import { cn } from "@/lib/utils";

interface Props {
  missions: MissionSummary[];
  teams: RescueTeamSummary[];
  requests: RequestSummary[];
}

const emergencyTypeConfig: Record<
  string,
  { icon: React.ComponentType<any>; colorClass: string; bgClass: string; textClass: string }
> = {
  FIRE: { icon: Flame, colorClass: "text-rose-500", bgClass: "bg-rose-50 dark:bg-rose-950/20", textClass: "text-rose-700 dark:text-rose-300" },
  FLOOD: { icon: Waves, colorClass: "text-blue-500", bgClass: "bg-blue-50 dark:bg-blue-950/20", textClass: "text-blue-700 dark:text-blue-300" },
  EARTHQUAKE: { icon: Activity, colorClass: "text-amber-600", bgClass: "bg-amber-50 dark:bg-amber-950/20", textClass: "text-amber-700 dark:text-amber-300" },
  MEDICAL_EMERGENCY: { icon: HeartPulse, colorClass: "text-emerald-500", bgClass: "bg-emerald-50 dark:bg-emerald-950/20", textClass: "text-emerald-700 dark:text-emerald-300" },
  TRAFFIC_EMERGENCY: { icon: Car, colorClass: "text-orange-500", bgClass: "bg-orange-50 dark:bg-orange-950/20", textClass: "text-orange-700 dark:text-orange-300" },
  BUILDING_COLLAPSE: { icon: Home, colorClass: "text-stone-500", bgClass: "bg-stone-50 dark:bg-stone-950/20", textClass: "text-stone-700 dark:text-stone-300" },
  NATURAL_DISASTER: { icon: AlertTriangle, colorClass: "text-red-500", bgClass: "bg-red-50 dark:bg-red-950/20", textClass: "text-red-700 dark:text-red-300" },
  OTHER: { icon: FileText, colorClass: "text-slate-500", bgClass: "bg-slate-50 dark:bg-slate-950/20", textClass: "text-slate-700 dark:text-slate-300" },
};

const getEmergencyConfig = (type: string) => {
  return emergencyTypeConfig[type] || emergencyTypeConfig.OTHER;
};

const getAvatarColor = (name: string) => {
  const colors = [
    "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-300 dark:border-red-900/30",
    "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/20 dark:text-orange-300 dark:border-orange-900/30",
    "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-300 dark:border-amber-900/30",
    "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-300 dark:border-emerald-900/30",
    "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/20 dark:text-teal-300 dark:border-teal-900/30",
    "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-300 dark:border-blue-900/30",
    "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/20 dark:text-indigo-300 dark:border-indigo-900/30",
    "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/20 dark:text-violet-300 dark:border-violet-900/30",
    "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/20 dark:text-purple-300 dark:border-purple-900/30",
    "bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-950/20 dark:text-pink-300 dark:border-pink-900/30",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

export function MissionsPanel({ missions, teams, requests }: Props) {
  const router = useRouter();
  type SortKey = "status" | "time" | "team";
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: "asc" | "desc" } | null>({ key: "time", direction: "desc" });
  const [selectedMission, setSelectedMission] = useState<MissionSummary | null>(null);
  const [now, setNow] = useState(Date.now());

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const toUtcDate = (dateString?: string) => {
    if (!dateString) return new Date(0);
    if (dateString.endsWith("Z") || dateString.includes("+")) return new Date(dateString);
    return new Date(dateString + "Z");
  };

  useEffect(() => {
    // Cập nhật thời gian mỗi phút để cập nhật thời gian tương đối
    const interval = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

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
    setCurrentPage(1); // Reset page to 1 on sort change
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
    { dot: string; bg: string; text: string; border: string }
  > = {
    ASSIGNED: {
      dot: "bg-amber-500",
      bg: "bg-amber-50/70 dark:bg-amber-950/10",
      text: "text-amber-700 dark:text-amber-300",
      border: "border-amber-200/60 dark:border-amber-800/30",
    },
    EN_ROUTE: {
      dot: "bg-blue-500 animate-pulse",
      bg: "bg-blue-50/70 dark:bg-blue-950/10",
      text: "text-blue-700 dark:text-blue-300",
      border: "border-blue-200/60 dark:border-blue-800/30",
    },
    ON_SITE: {
      dot: "bg-violet-500",
      bg: "bg-violet-50/70 dark:bg-violet-950/10",
      text: "text-violet-700 dark:text-violet-300",
      border: "border-violet-200/60 dark:border-violet-800/30",
    },
    IN_PROGRESS: {
      dot: "bg-indigo-500 animate-pulse",
      bg: "bg-indigo-50/70 dark:bg-indigo-950/10",
      text: "text-indigo-700 dark:text-indigo-300",
      border: "border-indigo-200/60 dark:border-indigo-800/30",
    },
    COMPLETED: {
      dot: "bg-emerald-500",
      bg: "bg-emerald-50/70 dark:bg-emerald-950/10",
      text: "text-emerald-700 dark:text-emerald-300",
      border: "border-emerald-200/60 dark:border-emerald-800/30",
    },
    ABORTED: {
      dot: "bg-rose-500",
      bg: "bg-rose-50/70 dark:bg-rose-950/10",
      text: "text-rose-700 dark:text-rose-300",
      border: "border-rose-200/60 dark:border-rose-800/30",
    },
  };

  const active = missions.filter(
    (m) => !["COMPLETED", "ABORTED"].includes(m.status),
  );
  const done = missions.filter((m) =>
    ["COMPLETED", "ABORTED"].includes(m.status),
  );

  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (val: string) => {
    setStatusFilter(val);
    setCurrentPage(1);
  };

  // Filter & Search
  const filteredMissions = missions.filter((m) => {
    const req = getRequest(m.requestId);
    const teamName = m.rescueTeam?.teamName || getTeamName(m.rescueTeamId);
    const address = req?.location?.address || "";
    const emergencyTypeLabel = req ? (emergencyTypeLabels[req.emergencyType] || "") : "";

    const matchesSearch =
      searchTerm === "" ||
      teamName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emergencyTypeLabel.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "ALL" || m.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Sort
  const sortedAndFilteredMissions = [...filteredMissions].sort((a, b) => {
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

  // Pagination computation
  const totalItems = sortedAndFilteredMissions.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedMissions = sortedAndFilteredMissions.slice(
    (safeCurrentPage - 1) * pageSize,
    safeCurrentPage * pageSize
  );

  const startItem = totalItems === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
  const endItem = Math.min(safeCurrentPage * pageSize, totalItems);

  const filterOptions = [
    { value: "ALL", label: "Tất cả trạng thái" },
    { value: "ASSIGNED", label: "Đã giao" },
    { value: "EN_ROUTE", label: "Đang di chuyển" },
    { value: "ON_SITE", label: "Tại hiện trường" },
    { value: "IN_PROGRESS", label: "Đang xử lý" },
    { value: "COMPLETED", label: "Hoàn thành" },
    { value: "ABORTED", label: "Đã hủy" },
  ];

  return (
    <div className="space-y-5">
      {/* Active missions summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            label: "Tổng nhiệm vụ",
            value: missions.length,
            icon: Compass,
            gradient: "from-blue-500/10 to-indigo-500/10 hover:from-blue-500/15 hover:to-indigo-500/15",
            border: "border-blue-100 hover:border-blue-200 dark:border-blue-900/20",
            iconColor: "text-blue-600 dark:text-blue-400",
            iconBg: "bg-blue-100/60 dark:bg-blue-950/40",
          },
          {
            label: "Đang thực hiện",
            value: active.length,
            icon: Activity,
            gradient: "from-amber-500/10 to-orange-500/10 hover:from-amber-500/15 hover:to-orange-500/15",
            border: "border-amber-100 hover:border-amber-200 dark:border-amber-900/20",
            iconColor: "text-amber-600 dark:text-amber-400",
            iconBg: "bg-amber-100/60 dark:bg-amber-950/40",
          },
          {
            label: "Hoàn thành",
            value: done.filter((m) => m.status === "COMPLETED").length,
            icon: CheckCircle2,
            gradient: "from-emerald-500/10 to-teal-500/10 hover:from-emerald-500/15 hover:to-teal-500/15",
            border: "border-emerald-100 hover:border-emerald-200 dark:border-emerald-900/20",
            iconColor: "text-emerald-600 dark:text-emerald-400",
            iconBg: "bg-emerald-100/60 dark:bg-emerald-950/40",
          },
          {
            label: "Đã hủy",
            value: done.filter((m) => m.status === "ABORTED").length,
            icon: AlertCircle,
            gradient: "from-rose-500/10 to-red-500/10 hover:from-rose-500/15 hover:to-red-500/15",
            border: "border-rose-100 hover:border-rose-200 dark:border-rose-900/20",
            iconColor: "text-rose-600 dark:text-rose-400",
            iconBg: "bg-rose-100/60 dark:bg-rose-950/40",
          },
        ].map((s) => {
          const IconComponent = s.icon;
          return (
            <div
              key={s.label}
              className={cn(
                "bg-white dark:bg-slate-900 p-4 rounded-2xl border shadow-sm transition-all duration-300 flex items-center justify-between hover:shadow-md hover:-translate-y-0.5",
                s.border,
                "bg-gradient-to-br",
                s.gradient
              )}
            >
              <div>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  {s.label}
                </p>
                <p className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-1">{s.value}</p>
              </div>
              <div className={cn("p-2.5 rounded-xl shrink-0", s.iconBg)}>
                <IconComponent className={cn("w-5 h-5", s.iconColor)} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Table & Controls Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
        {/* Header with Title & Badge */}
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">
            Danh sách nhiệm vụ
          </h3>
          <Badge variant="outline" className="text-[10px] bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 px-2 py-0.5 font-semibold text-slate-500">
            {totalItems} / {missions.length} nhiệm vụ
          </Badge>
        </div>

        {/* Filter bar */}
        <div className="p-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-1 items-center gap-2 max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Tìm kiếm đội cứu hộ, địa chỉ, loại sự cố..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-9 h-9 text-xs bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-blue-500 rounded-xl"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleSearchChange("")}
                  className="absolute right-1 top-1 h-7 w-7 text-slate-400 hover:text-slate-600 rounded-full"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
              <SelectTrigger className="h-9 w-[180px] text-xs bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-xl">
                <SelectValue placeholder="Lọc trạng thái" />
              </SelectTrigger>
              <SelectContent>
                {filterOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="text-xs">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {(searchTerm || statusFilter !== "ALL") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("ALL");
                  setCurrentPage(1);
                }}
                className="h-9 px-3 text-xs text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl gap-1.5 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                Xóa bộ lọc
              </Button>
            )}
          </div>
        </div>

        {/* Table list */}
        <ScrollArea className="h-[calc(100vh-320px)]">
          <Table className="w-full text-[13px]">
            <TableHeader className="bg-slate-50/80 dark:bg-slate-950/80 sticky top-0 z-10 border-b border-slate-100 dark:border-slate-800">
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-bold text-slate-500 text-[11px] uppercase tracking-wider py-3 w-[250px]">
                  Yêu cầu liên quan
                </TableHead>
                <TableHead
                  className="font-bold text-slate-500 text-[11px] uppercase tracking-wider py-3 w-[180px] cursor-pointer hover:text-slate-800 dark:hover:text-slate-200 transition-colors select-none"
                  onClick={() => handleSort("team")}
                >
                  <div className="flex items-center gap-1.5">
                    Đội cứu hộ
                    <SortIcon columnKey="team" />
                  </div>
                </TableHead>
                <TableHead
                  className="font-bold text-slate-500 text-[11px] uppercase tracking-wider py-3 w-[150px] cursor-pointer hover:text-slate-800 dark:hover:text-slate-200 transition-colors select-none"
                  onClick={() => handleSort("status")}
                >
                  <div className="flex items-center gap-1.5">
                    Trạng thái
                    <SortIcon columnKey="status" />
                  </div>
                </TableHead>
                <TableHead
                  className="font-bold text-slate-500 text-[11px] uppercase tracking-wider py-3 w-[180px] cursor-pointer hover:text-slate-800 dark:hover:text-slate-200 transition-colors select-none"
                  onClick={() => handleSort("time")}
                >
                  <div className="flex items-center gap-1.5">
                    Thời gian tạo
                    <SortIcon columnKey="time" />
                  </div>
                </TableHead>
                <TableHead className="font-bold text-slate-500 text-[11px] uppercase tracking-wider py-3 text-right w-[110px]">
                  Thao tác
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedMissions.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-12 text-slate-400 dark:text-slate-500"
                  >
                    Chưa có nhiệm vụ nào khớp với bộ lọc
                  </TableCell>
                </TableRow>
              ) : (
                paginatedMissions.map((m) => {
                  const req = getRequest(m.requestId);
                  const sc = statusColors[m.status] ?? statusColors.ASSIGNED;
                  const teamName = m.rescueTeam?.teamName || getTeamName(m.rescueTeamId);
                  const teamAvatarClass = getAvatarColor(teamName);
                  const config = req ? getEmergencyConfig(req.emergencyType) : emergencyTypeConfig.OTHER;
                  const EmergencyIcon = config.icon;

                  return (
                    <TableRow key={m.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/35 border-b border-slate-100 dark:border-slate-800/80 transition-colors">
                      <TableCell className="align-middle py-3">
                        {req ? (
                          <div className="flex items-start gap-3">
                            <div className={cn("p-2 rounded-xl shrink-0 mt-0.5", config.bgClass)}>
                              <EmergencyIcon className={cn("w-4 h-4", config.colorClass)} />
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                                {emergencyTypeLabels[req.emergencyType] ?? req.emergencyType}
                              </div>
                              <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                                <MapPin className="w-3 h-3 shrink-0 text-slate-300 dark:text-slate-600" />
                                <span className="truncate max-w-[180px]" title={req.location?.address ?? "N/A"}>
                                  {req.location?.address ?? "N/A"}
                                </span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950 shrink-0">
                              <FileText className="w-4 h-4 text-slate-400" />
                            </div>
                            <div>
                              <span className="text-xs text-slate-400 font-mono">
                                ID: {m.requestId.substring(0, 8)}...
                              </span>
                            </div>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="align-middle py-3">
                        <div className="flex items-center gap-2.5">
                          <div className={cn("w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs border shrink-0 shadow-sm", teamAvatarClass)}>
                            {teamName.charAt(0).toUpperCase()}
                          </div>
                          <div className="font-bold text-slate-800 dark:text-slate-200 text-xs truncate max-w-[140px]" title={teamName}>
                            {teamName}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="align-middle py-3">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 font-bold text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-lg border",
                            sc.bg,
                            sc.text,
                            sc.border
                          )}
                        >
                          <span
                            className={cn(
                              "w-1.5 h-1.5 rounded-full shrink-0",
                              sc.dot
                            )}
                          />
                          {missionStatusLabels[m.status] ?? m.status}
                        </span>
                      </TableCell>
                      <TableCell className="align-middle py-3">
                        {m.createdAt ? (
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 font-medium">
                              <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              {toUtcDate(m.createdAt).toLocaleString("vi-VN", {
                                hour: "2-digit",
                                minute: "2-digit",
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                              })}
                            </div>
                            <div className="text-[10px] text-slate-400 pl-5">
                              {getDurationText(m.createdAt) === "Không rõ" ? "" : `${getDurationText(m.createdAt)} trước`}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">N/A</span>
                        )}
                      </TableCell>
                      <TableCell className="align-middle py-3 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs font-semibold text-blue-600 hover:text-white border-blue-200 dark:border-blue-900/60 hover:border-blue-600 hover:bg-blue-600 rounded-lg transition-all duration-200 shadow-sm flex items-center ml-auto gap-1"
                          onClick={() => router.push(`/dashboard/dispatcher/missions/${m.id}`)}
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Chi tiết
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </ScrollArea>

        {/* Pagination controls */}
        {totalItems > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 gap-3">
            {/* Left side: range display & page size selection */}
            <div className="flex items-center gap-4 flex-wrap">
              <div className="text-xs font-medium text-slate-500">
                Hiển thị <span className="font-semibold text-slate-700 dark:text-slate-300">{startItem}</span> -{" "}
                <span className="font-semibold text-slate-700 dark:text-slate-300">{endItem}</span> trong tổng số{" "}
                <span className="font-semibold text-slate-700 dark:text-slate-300">{totalItems}</span> nhiệm vụ
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 whitespace-nowrap">Hiển thị</span>
                <Select
                  value={pageSize.toString()}
                  onValueChange={(val) => {
                    setPageSize(Number(val));
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="h-8 w-16 text-xs bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800">
                    <SelectValue placeholder={pageSize} />
                  </SelectTrigger>
                  <SelectContent>
                    {[5, 10, 20, 50].map((size) => (
                      <SelectItem key={size} value={size.toString()} className="text-xs">
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-xs text-slate-400 whitespace-nowrap">dòng</span>
              </div>
            </div>

            {/* Right side: navigation buttons */}
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safeCurrentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="sr-only">Trang trước</span>
              </Button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }).map((_, idx) => {
                  const pageNum = idx + 1;
                  if (
                    totalPages <= 5 ||
                    pageNum === 1 ||
                    pageNum === totalPages ||
                    (pageNum >= safeCurrentPage - 1 && pageNum <= safeCurrentPage + 1)
                  ) {
                    return (
                      <Button
                        key={pageNum}
                        variant={safeCurrentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        className={cn(
                          "h-8 min-w-8 px-2 font-semibold text-xs",
                          safeCurrentPage === pageNum
                            ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-600/20"
                            : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                        )}
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    );
                  } else if (
                    (pageNum === safeCurrentPage - 2 && pageNum > 2) ||
                    (pageNum === safeCurrentPage + 2 && pageNum < totalPages - 1)
                  ) {
                    return (
                      <span key={pageNum} className="text-slate-400 dark:text-slate-600 px-1 text-xs">
                        ...
                      </span>
                    );
                  }
                  return null;
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={safeCurrentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
                <span className="sr-only">Trang sau</span>
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Mission Detail Dialog (Kept for compatibility) */}
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
                    <span className={cn("inline-flex items-center gap-1.5 font-bold text-xs px-2 py-1 rounded border", sc.bg, sc.text, sc.border)}>
                      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", sc.dot)} />
                      {missionStatusLabels[selectedMission.status] ?? selectedMission.status}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-1.5">Thời gian tạo</h4>
                    <div className="text-sm font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-slate-400" />
                      {selectedMission.createdAt
                        ? toUtcDate(selectedMission.createdAt).toLocaleString("vi-VN", { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })
                        : "N/A"}
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950 rounded-lg p-3 border border-slate-100 dark:border-slate-800">
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
                      <h4 className="text-xs font-bold text-slate-500 uppercase mb-1.5">Thời gian đã trôi qua</h4>
                      <div className="text-sm font-bold text-amber-600 flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-amber-500" />
                        {getDurationText(selectedMission.createdAt)}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase mb-1.5">Đội cứu hộ tiếp nhận</h4>
                  <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-100 dark:border-slate-800 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center shrink-0">
                      <span className="text-blue-600 dark:text-blue-400 font-bold text-sm">
                        {(selectedMission.rescueTeam?.teamName || getTeamName(selectedMission.rescueTeamId)).charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      {selectedMission.rescueTeam?.teamName || getTeamName(selectedMission.rescueTeamId)}
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase mb-1.5">Yêu cầu liên quan</h4>
                  <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-100 dark:border-slate-800">
                    <div className="font-bold text-sm text-slate-800 dark:text-slate-200">
                      {req ? (emergencyTypeLabels[req.emergencyType] ?? req.emergencyType) : "ID: " + selectedMission.requestId}
                    </div>
                    {req && (
                      <>
                        <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-2">
                          <MapPin className="w-3.5 h-3.5 shrink-0" />
                          <span className="line-clamp-2">{req.location?.address ?? "N/A"}</span>
                        </div>
                        {req.description && (
                          <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 italic">
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
