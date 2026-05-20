"use client";

import { useState, useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import StatusFilter from "./StatusFilter";
import TeamCard from "./TeamCard";
import { useRescueTeams } from "@/lib/api/dashboards/comander-queries";
import type { TeamStatus, RescueTeamSummary } from "@/lib/api/types";
import { Search, RefreshCw, AlertCircle } from "lucide-react";

/**
 * Component Rescue Teams List cho Command Center
 *
 * NHIỆM VỤ CỦA FILE:
 * - Container component hiển thị danh sách Rescue Teams
 * - Fetch data từ API sử dụng React Query hook
 * - Filter teams theo status và search term
 * - Render danh sách TeamCard components
 * - Handle selection, hover, và action callbacks
 * - Hiển thị loading, error, và empty states
 *
 * DATA FLOW:
 * 1. Component mount → useRescueTeams() hook fetch data
 * 2. Hook gọi API → Backend SQL với ORDER BY CreatedAt DESC
 * 3. Response trả về → Component filter và render
 * 4. User filter/search → Component filter local data
 * 5. User select/hover team → Callbacks truyền lên parent
 *
 * CƠ CHẾ REALTIME:
 * - useRescueTeams có refetchInterval: 30000 → auto update mỗi 30s
 * - Khi backend data thay đổi → React Query refetch → Component re-render
 * - Status badges tự động update khi data thay đổi
 *
 * LEAFLET MAP INTEGRATION:
 * - onSelect callback: khi user select team → parent map flyTo marker
 * - onHover callback: khi user hover team → parent map highlight marker
 * - Props truyền từ Command Center component
 */

interface RescueTeamsListProps {
  selectedTeamId?: string;
  onSelectTeam?: (teamId: string) => void;
  onHoverTeam?: (teamId: string | null) => void;
  onTeamAction?: (action: string, teamId: string) => void;
}

export default function RescueTeamsList({
  selectedTeamId,
  onSelectTeam,
  onHoverTeam,
  onTeamAction,
}: RescueTeamsListProps) {
  // Local state cho filter và search
  const [statusFilter, setStatusFilter] = useState<TeamStatus | "ALL">("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch teams từ API với React Query
  const {
    data: teams,
    isLoading,
    isError,
    error,
    refetch,
  } = useRescueTeams({
    status: statusFilter === "ALL" ? undefined : statusFilter,
  });

  /**
   * Hàm calculateCounts
   *
   * Mục đích: Tính số lượng teams theo từng status cho filter badges
   *
   * Logic:
   * 1. Lấy tất cả teams (không filter)
   * 2. Đếm số teams theo từng status
   * 3. Return object với counts
   *
   * Tại sao dùng useMemo:
   * - Chỉ tính lại khi teams thay đổi
   * - Tránh tính toán thừa trên mỗi render
   */
  const counts = useMemo(() => {
    if (!teams || teams.length === 0) {
      return {
        ALL: 0,
        AVAILABLE: 0,
        ON_MISSION: 0,
        UNAVAILABLE: 0,
        MAINTENANCE: 0,
      };
    }

    return {
      ALL: teams.length,
      AVAILABLE: teams.filter((t) => t.status === "AVAILABLE").length,
      ON_MISSION: teams.filter((t) => t.status === "ON_MISSION").length,
      UNAVAILABLE: teams.filter((t) => t.status === "UNAVAILABLE").length,
      MAINTENANCE: teams.filter((t) => t.status === "MAINTENANCE").length,
    };
  }, [teams]);

  /**
   * Hàm filteredTeams
   *
   * Mục đích: Filter teams theo status và search term
   *
   * Logic:
   * 1. Nếu statusFilter !== "ALL" → filter theo status
   * 2. Nếu searchTerm không rỗng → filter theo name hoặc leader name
   * 3. Return filtered array
   *
   * Tại sao dùng useMemo:
   * - Chỉ filter lại khi statusFilter, searchTerm, hoặc teams thay đổi
   * - Tránh filter thừa trên mỗi render
   */
  const filteredTeams = useMemo(() => {
    if (!teams || teams.length === 0) return [];

    let result = [...teams];

    // Filter theo status (nếu không phải ALL)
    if (statusFilter !== "ALL") {
      result = result.filter((team) => team.status === statusFilter);
    }

    // Filter theo search term
    if (searchTerm.trim()) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(
        (team) =>
          team.teamName.toLowerCase().includes(lowerSearch) ||
          team.leader?.fullName?.toLowerCase().includes(lowerSearch) ||
          team.description?.toLowerCase().includes(lowerSearch),
      );
    }

    return result;
  }, [teams, statusFilter, searchTerm]);

  /**
   * Hàm handleFilterChange
   * 
   * Mục đích: Xử lý khi user thay đổi status filter
   * 
   * Logic:
   * 1. Update statusFilter state
   * 2. useRescueTeams sẽ tự động refetch với filter mới
   * 
   * Data Flow:
   * User Click Filter → handleFilterChange("AVAILABLE")
                   → setStatusFilter("AVAILABLE")
                   → useRescueTeams({ status: "AVAILABLE" })
                   → React Query refetch với filter
                   → Component re-render với filtered data
   */
  const handleFilterChange = (status: TeamStatus | "ALL") => {
    setStatusFilter(status);
  };

  /**
   * Hàm handleSearchChange
   *
   * Mục đích: Xử lý khi user nhập search term
   *
   * Logic:
   * 1. Update searchTerm state
   * 2. filteredTeams sẽ tự động filter local data
   *
   * Note: Search là local filter, không gọi API
   */
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
  };

  /**
   * Hàm handleSelectTeam
   *
   * Mục đích: Xử lý khi user select một team
   *
   * Logic:
   * 1. Gọi onSelectTeam callback với teamId
   * 2. Parent component sẽ update selectedTeam và map
   */
  const handleSelectTeam = (teamId: string) => {
    if (onSelectTeam) {
      onSelectTeam(teamId);
    }
  };

  /**
   * Hàm handleHoverTeam
   *
   * Mục đích: Xử lý khi user hover vào/ra team card
   *
   * Logic:
   * 1. Gọi onHoverTeam callback với teamId hoặc null
   * 2. Parent component sẽ highlight/unhighlight map marker
   */
  const handleHoverTeam = (teamId: string | null) => {
    if (onHoverTeam) {
      onHoverTeam(teamId);
    }
  };

  /**
   * Hàm handleTeamAction
   *
   * Mục đích: Xử lý khi user click action button trên team card
   *
   * Logic:
   * 1. Gọi onTeamAction callback với action type và teamId
   * 2. Parent component sẽ mở dialog hoặc gọi API
   */
  const handleTeamAction = (action: string, teamId: string) => {
    if (onTeamAction) {
      onTeamAction(action, teamId);
    }
  };

  // Loading State
  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-24" />
        </div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      </div>
    );
  }

  // Error State
  if (isError) {
    return (
      <Alert variant="destructive" className="m-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Lỗi tải dữ liệu</AlertTitle>
        <AlertDescription>
          {error instanceof Error
            ? error.message
            : "Không thể tải danh sách đội cứu hộ"}
          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => refetch()}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Thử lại
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // Empty State
  if (!teams || teams.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <AlertCircle className="h-12 w-12 text-slate-400 mb-4" />
        <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">
          Không có đội cứu hộ
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-500">
          Chưa có đội cứu hộ nào trong hệ thống
        </p>
      </div>
    );
  }

  // Filtered Empty State
  if (filteredTeams.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <Search className="h-12 w-12 text-slate-400 mb-4" />
        <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">
          Không tìm thấy đội cứu hộ
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-500">
          Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={() => {
            setStatusFilter("ALL");
            setSearchTerm("");
          }}
        >
          Xóa bộ lọc
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header với Search và Refresh */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 shrink-0 bg-white z-10">
        <div className="flex items-center gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Tìm kiếm theo tên, đội trưởng..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            title="Làm mới"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {/* Status Filter */}
        <StatusFilter
          selectedStatus={statusFilter}
          onFilterChange={handleFilterChange}
          counts={counts}
        />
      </div>

      {/* Team List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0 bg-slate-50/50">
        {filteredTeams.map((team) => (
          <TeamCard
            key={team.id}
            team={team}
            isSelected={selectedTeamId === team.id}
            onSelect={handleSelectTeam}
            onHover={handleHoverTeam}
            onAction={handleTeamAction}
          />
        ))}
      </div>

      {/* Footer với count */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 text-sm text-slate-500 dark:text-slate-500 shrink-0 bg-white">
        Hiển thị {filteredTeams.length} / {teams.length} đội cứu hộ
      </div>
    </div>
  );
}
