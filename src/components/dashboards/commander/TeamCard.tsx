"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import type { RescueTeamSummary, TeamStatus } from "@/lib/api/types";
import {
  MapPin,
  Users,
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
  { icon: React.ElementType; color: string; label: string }
> = {
  AVAILABLE: {
    icon: CheckCircle2,
    color: "bg-green-500",
    label: dictTeamStatus.AVAILABLE,
  },
  ON_MISSION: {
    icon: Clock,
    color: "bg-blue-500",
    label: dictTeamStatus.ON_MISSION,
  },
  UNAVAILABLE: {
    icon: XCircle,
    color: "bg-red-500",
    label: dictTeamStatus.UNAVAILABLE,
  },
  MAINTENANCE: {
    icon: Wrench,
    color: "bg-orange-500",
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
        "cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-700",
        isSelected &&
        "ring-2 ring-blue-500 shadow-md border-blue-300 dark:border-blue-700",
      )}
      onClick={handleCardClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1">
            {/* Team Avatar */}
            <Avatar className="h-10 w-10">
              {/*TODO: Add team avatar */}
              {/* <AvatarImage src={team.leader?.avatar} /> */}
              <AvatarFallback className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                {getInitials(team.teamName)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              {/* Team Name */}
              <CardTitle className="text-base font-semibold truncate">
                {team.teamName}
              </CardTitle>

              {/* Status Badge */}
              <Badge
                variant="secondary"
                className={cn(
                  "mt-1 gap-1 text-xs",
                  statusConfig.color,
                  "text-white",
                )}
              >
                <StatusIcon className="h-3 w-3" />
                {statusConfig.label}
              </Badge>
            </div>
          </div>

          {/* More Options Button */}
          {showActions && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={(e) => handleActionClick("menu", e)}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <Separator className="my-2" />

      <CardContent className="pt-3">
        <div className="space-y-2">
          {/* Leader Info */}
          {team.leader && (
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <Users className="h-4 w-4" />
              <span className="truncate">
                Đội trưởng: {team.leader.fullName}
              </span>
            </div>
          )}

          {/* Member Count */}
          {team.memberCount !== undefined && (
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <Users className="h-4 w-4" />
              <span>{team.memberCount} thành viên</span>
            </div>
          )}

          {/* Created At */}
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            <Calendar className="h-4 w-4" />
            <span>Ngày tạo: {formatCreatedAt()}</span>
          </div>

          {/* Description (truncated) */}
          {team.description && (
            <p className="text-sm text-slate-500 dark:text-slate-500 line-clamp-2">
              {team.description}
            </p>
          )}
        </div>

        {/* Quick Actions */}
        {showActions && (
          <div className="mt-4 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-1 text-xs"
              onClick={(e) => handleActionClick("change_status", e)}
            >
              <Clock className="h-3 w-3" />
              Đổi trạng thái
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-1 text-xs"
              onClick={(e) => handleActionClick("assign_mission", e)}
            >
              <MapPin className="h-3 w-3" />
              Phân công
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 text-xs"
              onClick={(e) => handleActionClick("view_details", e)}
            >
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
