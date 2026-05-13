"use client";

import { useState } from "react";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Loader2, Bell, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useDispatcherRequestsQuery,
  useRescueTeamsQuery,
  useMissionsQuery,
} from "@/lib/api/dispatcher-queries";
import { DispatcherSidebar, type DispatcherView } from "@/components/dispatcher/DispatcherSidebar";
import { DispatcherOverview } from "@/components/dispatcher/DispatcherOverview";
import { RequestsTable } from "@/components/dispatcher/RequestsTable";
import { MissionsPanel } from "@/components/dispatcher/MissionsPanel";
import { TeamsPanel } from "@/components/dispatcher/TeamsPanel";
import { AnalyticsPanel } from "@/components/dispatcher/AnalyticsPanel";
import type { RequestSummary } from "@/lib/api/types";

const VIEW_TITLES: Record<DispatcherView, string> = {
  requests: "Yêu cầu cứu trợ",
  missions: "Nhiệm vụ",
  teams: "Đội cứu hộ",
  analytics: "Phân tích",
};

export default function DispatcherDashboard() {
  const [activeView, setActiveView] = useState<DispatcherView>("requests");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedRequest, setSelectedRequest] =
    useState<RequestSummary | null>(null);

  const requestsQuery = useDispatcherRequestsQuery({
    pageNumber: 1,
    pageSize: 100,
  });
  const teamsQuery = useRescueTeamsQuery();
  const missionsQuery = useMissionsQuery();

  const allRequests = requestsQuery.data?.items ?? [];
  const teams = teamsQuery.data ?? [];
  const missions = missionsQuery.data ?? [];

  const filteredRequests =
    statusFilter === "ALL"
      ? allRequests
      : allRequests.filter((r) => r.status === statusFilter);

  const isLoading = requestsQuery.isLoading;

  if (isLoading) {
    return (
      <>
        <DispatcherSidebar
          activeView={activeView}
          onViewChange={setActiveView}
          counts={{ requests: 0, missions: 0, teams: 0 }}
        />
        <SidebarInset>
          <div className="flex items-center justify-center h-full">
            <Loader2 className="size-8 animate-spin text-blue-500" />
            <span className="ml-3 text-slate-500 font-medium">
              Đang tải dữ liệu...
            </span>
          </div>
        </SidebarInset>
      </>
    );
  }

  return (
    <>
      {/* SIDEBAR */}
      <DispatcherSidebar
        activeView={activeView}
        onViewChange={setActiveView}
        counts={{
          requests: allRequests.length,
          missions: missions.length,
          teams: teams.length,
        }}
      />

      {/* MAIN CONTENT */}
      <SidebarInset>
        {/* TOP HEADER BAR */}
        <header className="flex items-center justify-between h-14 px-4 border-b bg-white/80 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-3">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="h-5" />
            <h2 className="text-sm font-bold text-slate-800 tracking-tight">
              {VIEW_TITLES[activeView]}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="relative rounded-full text-slate-500 hover:text-slate-800"
            >
              <Settings className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="relative rounded-full text-slate-500 hover:text-slate-800"
            >
              <Bell className="size-4" />
              <span className="absolute top-2 right-2 size-2 bg-red-500 rounded-full" />
            </Button>
            <div className="ml-2 size-8 rounded-full bg-blue-600 border-2 border-blue-400 flex items-center justify-center text-white cursor-pointer hover:bg-blue-500 transition shadow-sm">
              <span className="text-[10px] font-bold">AD</span>
            </div>
          </div>
        </header>

        {/* SCROLLABLE CONTENT AREA */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50/80">
          {/* STATS OVERVIEW */}
          <DispatcherOverview
            requests={allRequests}
            teams={teams}
            missions={missions}
          />

          {/* ACTIVE VIEW CONTENT */}
          <div className="mt-5">
            {activeView === "requests" && (
              <RequestsTable
                requests={filteredRequests}
                allRequests={allRequests}
                teams={teams}
                statusFilter={statusFilter}
                onStatusFilterChange={setStatusFilter}
                selectedRequest={selectedRequest}
                onSelectRequest={setSelectedRequest}
              />
            )}

            {activeView === "missions" && (
              <MissionsPanel
                missions={missions}
                teams={teams}
                requests={allRequests}
              />
            )}

            {activeView === "teams" && <TeamsPanel teams={teams} />}

            {activeView === "analytics" && (
              <AnalyticsPanel
                requests={allRequests}
                missions={missions}
                teams={teams}
              />
            )}
          </div>
        </div>
      </SidebarInset>
    </>
  );
}
