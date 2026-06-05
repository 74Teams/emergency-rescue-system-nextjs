"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  ClipboardList,
  LifeBuoy,
  LogOut,
  Rocket,
  Settings,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type DispatcherView = "requests" | "missions" | "teams" | "analytics";

interface NavItem {
  id: DispatcherView;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  count?: number;
}

interface DispatcherSidebarProps {
  activeView: DispatcherView;
  onViewChange: (view: DispatcherView) => void;
  counts: {
    requests: number;
    missions: number;
    teams: number;
  };
}

export function DispatcherSidebar({
  activeView,
  onViewChange,
  counts,
}: DispatcherSidebarProps) {
  const navItems: NavItem[] = [
    {
      id: "requests",
      label: "Yêu cầu cứu trợ",
      icon: ClipboardList,
      count: counts.requests,
    },
    {
      id: "missions",
      label: "Nhiệm vụ",
      icon: Rocket,
      count: counts.missions,
    },
    {
      id: "teams",
      label: "Đội cứu hộ",
      icon: Users,
      count: counts.teams,
    },
    {
      id: "analytics",
      label: "Phân tích",
      icon: BarChart3,
    },
  ];

  return (
    <div className="dispatcher-sidebar">
      <Sidebar collapsible="icon" className="border-r-0">
        {/* ── HEADER ── */}
        <SidebarHeader className="px-4 py-5 group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:py-3">
          <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center group cursor-pointer hover:opacity-95 transition-opacity">
            <div className="relative flex shrink-0 items-center justify-center size-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25">
              <LifeBuoy className="size-5 stroke-[2.5] transition-transform duration-500 group-hover:rotate-90" />
            </div>
            <div className="flex flex-col justify-center group-data-[collapsible=icon]:hidden">
              <span className="text-base font-black tracking-tight leading-none text-white">
                Rescue<span className="text-emerald-400">System</span>
              </span>
              <span className="text-[9px] font-semibold text-emerald-400/80 uppercase tracking-[0.2em] leading-none mt-1.5">
                Trung tâm điều phối
              </span>
            </div>
          </div>
        </SidebarHeader>

        <SidebarSeparator className="opacity-30" />

        {/* ── NAVIGATION ── */}
        <SidebarContent className="px-2 py-3">
          <SidebarGroup>
            <SidebarGroupLabel>Quản lý</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      isActive={activeView === item.id}
                      onClick={() => onViewChange(item.id)}
                      tooltip={item.label}
                      size="default"
                      className={cn(
                        "cursor-pointer h-10 rounded-lg font-medium text-white/70 transition-all",
                        "hover:text-white",
                        activeView === item.id && "text-white font-semibold",
                      )}
                    >
                      <item.icon />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                    {item.count !== undefined && item.count > 0 && (
                      <SidebarMenuBadge>{item.count}</SidebarMenuBadge>
                    )}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        {/* ── FOOTER ── */}
        <SidebarFooter className="px-2 pb-4">
          <SidebarSeparator className="opacity-30 mb-2" />
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip="Cài đặt"
                className="cursor-pointer h-9 rounded-lg text-white/60 hover:text-white font-medium"
              >
                <Settings />
                <span>Cài đặt</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip="Đăng xuất"
                className="cursor-pointer h-9 rounded-lg text-red-400/80 hover:text-red-300 hover:bg-red-500/10 font-medium"
              >
                <LogOut />
                <span>Đăng xuất</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>

        <SidebarRail />
      </Sidebar>
    </div>
  );
}
