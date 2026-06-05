"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { RescueTeamSummary, TeamStatus } from "@/lib/api/types";
import {
  MapPin,
  Users,
  User,
  Calendar,
  MoreVertical,
  CheckCircle2,
  Clock,
  XCircle,
  Wrench,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getInitials } from "@/lib/utils/initials";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { dictTeamStatus } from "@/constants/dictionary";

/**
 * Component Team Card cho Command Center
 *
 * NHIỆM VỤ CỦA FILE:
 * - Hiển thị thông tin chi tiết của một Rescue Team
 * - Hiển thị status badge với màu sắc phù hợp
 * - Cung cấp actions nhanh (change status, view details)
 * - Highlight khi được selected
 * - Hover effect để highlight marker trên map
 *
 * DATA FLOW:
 * 1. Parent component (RescueTeamsList) truyền team data vào props
 * 2. Component render thông tin team từ props
 * 3. User click vào card → onSelect callback → Parent update selected team
 * 4. User click action button → onAction callback → Parent xử lý action
 * 5. User hover card → onHover callback → Map highlight marker
 *
 * CƠ CHẾ REALTIME:
 * - Component nhận data từ props (không tự fetch)
 * - Khi data thay đổi ở parent, component tự động re-render
 * - Status badge tự động update khi team status thay đổi
 *
 * LEAFLET MAP INTEGRATION:
 * - onHover callback: khi hover card → map highlight marker
 * - onLeave callback: khi leave card → map unhighlight marker
 * - onSelect callback: khi click card → map fly to marker
 * - Điều này tạo ra sync giữa list và map
 */

interface TeamCardProps {
  team: RescueTeamSummary;
  isSelected?: boolean;
  onSelect?: (teamId: string) => void;
  onAction?: (action: string, teamId: string) => void;
  onHover?: (teamId: string | null) => void;
  showActions?: boolean;
}

// Mapping status sang config (icon, màu, label)
const STATUS_CONFIG: Record<
  TeamStatus,
  { icon: React.ElementType; badgeClass: string; borderClass: string; indicatorClass: string; label: string }
> = {
  AVAILABLE: {
    icon: CheckCircle2,
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/20 dark:text-emerald-300 dark:border-emerald-900/30",
    borderClass: "border-l-emerald-500",
    indicatorClass: "bg-emerald-500",
    label: dictTeamStatus.AVAILABLE,
  },
  ON_MISSION: {
    icon: Clock,
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200/60 dark:bg-blue-950/20 dark:text-blue-300 dark:border-blue-900/30",
    borderClass: "border-l-blue-500",
    indicatorClass: "bg-blue-500",
    label: dictTeamStatus.ON_MISSION,
  },
  UNAVAILABLE: {
    icon: XCircle,
    badgeClass: "bg-rose-50 text-rose-700 border-rose-200/60 dark:bg-rose-950/20 dark:text-rose-300 dark:border-rose-900/30",
    borderClass: "border-l-rose-500",
    indicatorClass: "bg-rose-500",
    label: dictTeamStatus.UNAVAILABLE,
  },
  MAINTENANCE: {
    icon: Wrench,
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200/60 dark:bg-amber-950/20 dark:text-amber-300 dark:border-amber-900/30",
    borderClass: "border-l-amber-500",
    indicatorClass: "bg-amber-500",
    label: dictTeamStatus.MAINTENANCE,
  },
};

export default function TeamCard({
  team,
  isSelected = false,
  onSelect,
  onAction,
  onHover,
  showActions = true,
}: TeamCardProps) {
  const statusConfig = STATUS_CONFIG[team.status];
  const StatusIcon = statusConfig.icon;

  /**
   * Hàm handleCardClick
   *
   * Mục đích: Xử lý khi user click vào card
   *
   * Logic:
   * 1. Nếu có onSelect callback → gọi onSelect với teamId
   * 2. Parent component sẽ nhận callback và update selected team
   * 3. Map component sẽ fly đến marker của team được chọn
   *
   * Data Flow:
   * User Click Card → handleCardClick → onSelect(teamId)
   * → Parent Component → setSelectedTeam(team)
   * → Map Component → flyTo(team.location)
   */
  const handleCardClick = () => {
    if (onSelect) {
      onSelect(team.id);
    }
  };

  /**
   * Hàm handleActionClick
   *
   * Mục đích: Xử lý khi user click vào action button
   *
   * Logic:
   * 1. Stop propagation để không trigger card click
   * 2. Gọi onAction callback với action type và teamId
   * 3. Parent component sẽ xử lý action (mở dialog, gọi API, etc.)
   *
   * Data Flow:
   * User Click Action → handleActionClick → onAction(action, teamId)
   * → Parent Component → Open Action Dialog / Call API
   */
  const handleActionClick = (action: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    if (onAction) {
      onAction(action, team.id);
    }
  };

  /**
   * Hàm handleMouseEnter
   *
   * Mục đích: Xử lý khi user hover vào card
   *
   * Logic:
   * 1. Gọi onHover callback với teamId
   * 2. Map component sẽ highlight marker tương ứng
   *
   * Leaflet Integration:
   * Hover Card → onHover(teamId) → Map highlight marker
   * → User thấy marker sáng lên trên map
   */
  const handleMouseEnter = () => {
    if (onHover) {
      onHover(team.id);
    }
  };

  /**
   * Hàm handleMouseLeave
   *
   * Mục đích: Xử lý khi user rời khỏi card
   *
   * Logic:
   * 1. Gọi onHover callback với null
   * 2. Map component sẽ unhighlight marker
   *
   * Leaflet Integration:
   * Leave Card → onHover(null) → Map unhighlight marker
   * → Marker trở về trạng thái bình thường
   */
  const handleMouseLeave = () => {
    if (onHover) {
      onHover(null);
    }
  };

  /**
   * Hàm formatCreatedAt
   *
   * Mục đích: Format ngày tạo team để hiển thị
   *
   * Logic:
   * 1. Nếu có createdAt → format theo locale vi
   * 2. Nếu không có → return "N/A"
   */
  const formatCreatedAt = () => {
    if (!team.createdAt) return "N/A";
    try {
      return format(new Date(team.createdAt), "dd/MM/yyyy HH:mm", {
        locale: vi,
      });
    } catch {
      return "N/A";
    }
  };

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all duration-300 border-l-4 rounded-xl bg-white dark:bg-slate-900 overflow-hidden",
        statusConfig.borderClass,
        isSelected
          ? "ring-2 ring-blue-500 border-blue-400 dark:border-blue-600 shadow-md scale-[1.01]"
          : "border-slate-200 dark:border-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 hover:scale-[1.01]"
      )}
      onClick={handleCardClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <CardHeader className="px-5 pt-5 pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3.5 flex-1 min-w-0">
            {/* Team Avatar */}
            <Avatar className="h-10 w-10 border border-slate-100 dark:border-slate-800 shadow-sm shrink-0">
              <AvatarFallback className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold text-xs">
                {getInitials(team.teamName)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              {/* Team Name */}
              <CardTitle className="text-base font-black text-slate-900 dark:text-slate-100 tracking-tight leading-snug truncate">
                {team.teamName}
              </CardTitle>

              {/* Status Badge */}
              <Badge
                variant="outline"
                className={cn(
                  "mt-1.5 gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full border tracking-wide uppercase",
                  statusConfig.badgeClass,
                )}
              >
                <StatusIcon className="h-3 w-3 shrink-0" />
                {statusConfig.label}
              </Badge>
            </div>
          </div>

          {/* More Options Button */}
          {showActions && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 shrink-0"
              onClick={(e) => handleActionClick("menu", e)}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="px-5 pb-4 pt-1">
        <div className="grid grid-cols-1 gap-2.5">
          {/* Leader Info */}
          {team.leader && (
            <div className="flex items-center gap-2.5 text-xs font-medium text-slate-600 dark:text-slate-300">
              <div className="flex items-center justify-center size-5 rounded bg-slate-50 dark:bg-slate-800 text-slate-400">
                <User className="h-3.5 w-3.5" />
              </div>
              <span className="truncate">
                Đội trưởng: <strong className="text-slate-900 dark:text-white font-semibold">{team.leader.fullName}</strong>
              </span>
            </div>
          )}

          {/* Member Count */}
          {team.memberCount !== undefined && (
            <div className="flex items-center gap-2.5 text-xs font-medium text-slate-600 dark:text-slate-300">
              <div className="flex items-center justify-center size-5 rounded bg-slate-50 dark:bg-slate-800 text-slate-400">
                <Users className="h-3.5 w-3.5" />
              </div>
              <span>
                Thành viên: <strong className="text-slate-900 dark:text-white font-semibold">{team.memberCount} người</strong>
              </span>
            </div>
          )}

          {/* Created At */}
          <div className="flex items-center gap-2.5 text-xs font-medium text-slate-500 dark:text-slate-400">
            <div className="flex items-center justify-center size-5 rounded bg-slate-50 dark:bg-slate-800 text-slate-400">
              <Calendar className="h-3.5 w-3.5" />
            </div>
            <span>Ngày thành lập: {formatCreatedAt()}</span>
          </div>

          {/* Description (truncated) */}
          {team.description && (
            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 leading-relaxed italic border-l-2 border-slate-200 dark:border-slate-800 pl-2">
              {team.description}
            </p>
          )}
        </div>

        {/* Quick Actions */}
        {showActions && (
          <div className="mt-4 flex gap-2 border-t border-slate-100 dark:border-slate-800/60 pt-3.5">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-1.5 text-xs font-bold rounded-lg border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-950 transition-all cursor-pointer h-9 shadow-sm"
              onClick={(e) => handleActionClick("change_status", e)}
            >
              <Clock className="h-3.5 w-3.5 text-slate-400" />
              Trạng thái
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-1.5 text-xs font-bold rounded-lg border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-950 transition-all cursor-pointer h-9 shadow-sm"
              onClick={(e) => handleActionClick("assign_mission", e)}
            >
              <MapPin className="h-3.5 w-3.5 text-slate-400" />
              Phân công
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-xs font-bold rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-blue-600 hover:text-blue-700 transition-all cursor-pointer h-9 w-9 p-0 shrink-0"
              onClick={(e) => handleActionClick("view_details", e)}
              title="Xem chi tiết"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
