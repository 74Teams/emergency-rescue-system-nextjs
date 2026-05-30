"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { TeamStatus } from "@/lib/api/types";
import { CheckCircle2, Clock, XCircle, Wrench, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { dictTeamStatus } from "@/constants/dictionary";

/**
 * Component Status Filter cho Command Center
 *
 * NHIỆM VỤ CỦA FILE:
 * - Hiển thị các button filter theo trạng thái của Rescue Teams
 * - Cho phép user chọn filter để lọc danh sách teams
 * - Highlight filter đang được chọn
 * - Cung cấp callback khi filter thay đổi
 *
 * DATA FLOW:
 * 1. User click vào filter button (ví dụ: "Available")
 * 2. Component gọi onFilterChange callback với status mới
 * 3. Parent component (RescueTeamsList) nhận status mới
 * 4. Parent component gọi useRescueTeams({ status: "AVAILABLE" })
 * 5. React Query refetch data với filter mới
 * 6. Component re-render với data đã filter
 *
 * CƠ CHẾ REALTIME:
 * - Không có realtime trực tiếp trong component này
 * - Realtime được handle bởi parent component thông qua React Query
 * - Khi filter thay đổi, React Query tự động refetch
 *
 */

//TODO: REMOVE ALL
interface StatusFilterProps {
  selectedStatus?: TeamStatus | "ALL";
  onFilterChange: (status: TeamStatus | "ALL") => void;
  counts?: {
    ALL: number;
    AVAILABLE: number;
    ON_MISSION: number;
    UNAVAILABLE: number;
    MAINTENANCE: number;
  };
}

// Mapping status sang icon và label
const STATUS_CONFIG = {
  ALL: {
    label: "Tất cả",
    icon: Layers,
    color: "bg-slate-500",
    hoverColor: "hover:bg-slate-600",
  },
  AVAILABLE: {
    label: dictTeamStatus.AVAILABLE,
    icon: CheckCircle2,
    color: "bg-green-500",
    hoverColor: "hover:bg-green-600",
  },
  ON_MISSION: {
    label: dictTeamStatus.ON_MISSION,
    icon: Clock,
    color: "bg-blue-500",
    hoverColor: "hover:bg-blue-600",
  },
  UNAVAILABLE: {
    label: dictTeamStatus.UNAVAILABLE,
    icon: XCircle,
    color: "bg-red-500",
    hoverColor: "hover:bg-red-600",
  },
  MAINTENANCE: {
    label: dictTeamStatus.MAINTENANCE,
    icon: Wrench,
    color: "bg-orange-500",
    hoverColor: "hover:bg-orange-600",
  },
};

export default function StatusFilter({
  selectedStatus = "ALL",
  onFilterChange,
  counts,
}: StatusFilterProps) {
  /**
   * Hàm handleFilterClick
   *
   * Mục đích: Xử lý khi user click vào filter button
   *
   * Logic:
   * 1. Kiểm tra nếu click vào filter đang chọn → không làm gì
   * 2. Nếu click vào filter khác → gọi onFilterChange với status mới
   * 3. Parent component sẽ nhận callback và update filter state
   *
   * Data Flow:
   * User Click → handleFilterClick → onFilterChange(status)
   * → Parent Component → useRescueTeams({ status }) → API Call
   */
  const handleFilterClick = (status: TeamStatus | "ALL") => {
    if (status === selectedStatus) return;
    onFilterChange(status);
  };

  /**
   * Hàm renderFilterButton
   *
   * Mục đích: Render một filter button với styling phù hợp
   *
   * Logic:
   * 1. Lấy config cho status từ STATUS_CONFIG
   * 2. Xác định nếu đang selected → dùng active styling
   * 3. Nếu không selected → dùng inactive styling
   * 4. Hiển thị icon, label, và count badge (nếu có)
   *
   * Tại sao dùng function riêng:
   * - Tránh lặp code khi render 5 buttons
   * - Dễ maintain và thay đổi styling
   * - Reusable logic
   */
  const renderFilterButton = (status: TeamStatus | "ALL") => {
    const config = STATUS_CONFIG[status];
    const Icon = config.icon;
    const isSelected = selectedStatus === status;
    const count = counts?.[status] ?? 0;

    return (
      <Button
        variant={isSelected ? "default" : "outline"}
        size="sm"
        onClick={() => handleFilterClick(status)}
        className={cn(
          "relative gap-2 transition-all duration-200",
          isSelected
            ? `${config.color} text-white shadow-md`
            : "hover:bg-slate-100 dark:hover:bg-slate-800",
        )}
      >
        <Icon className="h-4 w-4" />
        <span className="hidden sm:inline">{config.label}</span>

        {/* Count Badge */}
        {count > 0 && (
          <Badge
            variant={isSelected ? "secondary" : "default"}
            className={cn(
              "ml-1 h-5 min-w-[20px] px-1 text-xs",
              isSelected ? "bg-white/20" : "bg-slate-200 dark:bg-slate-700",
            )}
          >
            {count}
          </Badge>
        )}
      </Button>
    );
  };

  return (
    <div className="flex flex-wrap items-center gap-2 p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
      <span className="text-sm font-medium text-slate-600 dark:text-slate-400 mr-2">
        Lọc theo trạng thái:
      </span>

      {/* Render tất cả filter buttons */}
      {renderFilterButton("ALL")}
      {renderFilterButton("AVAILABLE")}
      {renderFilterButton("ON_MISSION")}
      {renderFilterButton("UNAVAILABLE")}
      {renderFilterButton("MAINTENANCE")}
    </div>
  );
}
