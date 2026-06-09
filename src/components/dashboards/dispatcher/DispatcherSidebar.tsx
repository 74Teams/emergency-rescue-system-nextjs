'use client'

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
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
    SidebarRail,
    SidebarSeparator,
} from '@/components/ui/sidebar'
import { Badge } from '@/components/ui/badge'
import {
    BarChart3,
    ClipboardList,
    LifeBuoy,
    LogOut,
    Rocket,
    Settings,
    Users,
    Map as MapIcon,
    List as ListIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export type DispatcherView =
    | 'requests-list'
    | 'requests-map'
    | 'missions'
    | 'teams'
    | 'analytics'

interface DispatcherSidebarProps {
    activeView: DispatcherView
    onViewChange: (view: DispatcherView) => void
    counts: {
        requests: number
        missions: number
        teams: number
    }
}

export function DispatcherSidebar({
    activeView,
    onViewChange,
    counts,
}: DispatcherSidebarProps) {
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
                                Rescue
                                <span className="text-emerald-400">System</span>
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
                                {/* Yêu cầu cứu trợ với 2 Submenu con */}
                                <SidebarMenuItem>
                                    <SidebarMenuButton
                                        isActive={
                                            activeView === 'requests-list' ||
                                            activeView === 'requests-map'
                                        }
                                        tooltip="Yêu cầu cứu trợ"
                                        size="default"
                                        className={cn(
                                            'cursor-pointer h-10 rounded-lg font-medium text-white/70 transition-all hover:text-white',
                                            (activeView === 'requests-list' ||
                                                activeView ===
                                                    'requests-map') &&
                                                'text-white font-semibold'
                                        )}
                                    >
                                        <ClipboardList />
                                        <span>Yêu cầu cứu trợ</span>
                                    </SidebarMenuButton>

                                    <SidebarMenuSub className="border-l border-emerald-500/20 pl-2 ml-4 flex flex-col gap-1 mt-1 group-data-[collapsible=icon]:hidden">
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton
                                                isActive={
                                                    activeView ===
                                                    'requests-list'
                                                }
                                                onClick={() =>
                                                    onViewChange(
                                                        'requests-list'
                                                    )
                                                }
                                                className={cn(
                                                    'cursor-pointer text-white/60 hover:text-white transition-colors py-1.5 h-8 flex items-center justify-between rounded-md px-2 w-full',
                                                    activeView ===
                                                        'requests-list' &&
                                                        'text-emerald-400 font-bold bg-white/5'
                                                )}
                                            >
                                                <div className="flex items-center gap-1.5">
                                                    <ListIcon className="size-3.5" />
                                                    <span>Danh sách</span>
                                                </div>
                                                {counts.requests > 0 && (
                                                    <span className="bg-emerald-500/10 text-emerald-400 text-[10px] px-1.5 py-0.5 rounded-full font-bold ml-2">
                                                        {counts.requests}
                                                    </span>
                                                )}
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>

                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton
                                                isActive={
                                                    activeView ===
                                                    'requests-map'
                                                }
                                                onClick={() =>
                                                    onViewChange('requests-map')
                                                }
                                                className={cn(
                                                    'cursor-pointer text-white/60 hover:text-white transition-colors py-1.5 h-8 flex items-center gap-1.5 rounded-md px-2 w-full',
                                                    activeView ===
                                                        'requests-map' &&
                                                        'text-emerald-400 font-bold bg-white/5'
                                                )}
                                            >
                                                <MapIcon className="size-3.5" />
                                                <span>Bản đồ</span>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                    </SidebarMenuSub>
                                </SidebarMenuItem>

                                {/* Nhiệm vụ */}
                                <SidebarMenuItem>
                                    <SidebarMenuButton
                                        isActive={activeView === 'missions'}
                                        onClick={() => onViewChange('missions')}
                                        tooltip="Nhiệm vụ"
                                        size="default"
                                        className={cn(
                                            'cursor-pointer h-10 rounded-lg font-medium text-white/70 transition-all hover:text-white',
                                            activeView === 'missions' &&
                                                'text-white font-semibold'
                                        )}
                                    >
                                        <Rocket />
                                        <span>Nhiệm vụ</span>
                                    </SidebarMenuButton>
                                    {counts.missions > 0 && (
                                        <SidebarMenuBadge>
                                            {counts.missions}
                                        </SidebarMenuBadge>
                                    )}
                                </SidebarMenuItem>

                                {/* Đội cứu hộ */}
                                <SidebarMenuItem>
                                    <SidebarMenuButton
                                        isActive={activeView === 'teams'}
                                        onClick={() => onViewChange('teams')}
                                        tooltip="Đội cứu hộ"
                                        size="default"
                                        className={cn(
                                            'cursor-pointer h-10 rounded-lg font-medium text-white/70 transition-all hover:text-white',
                                            activeView === 'teams' &&
                                                'text-white font-semibold'
                                        )}
                                    >
                                        <Users />
                                        <span>Đội cứu hộ</span>
                                    </SidebarMenuButton>
                                    {counts.teams > 0 && (
                                        <SidebarMenuBadge>
                                            {counts.teams}
                                        </SidebarMenuBadge>
                                    )}
                                </SidebarMenuItem>

                                {/* Phân tích */}
                                <SidebarMenuItem>
                                    <SidebarMenuButton
                                        isActive={activeView === 'analytics'}
                                        onClick={() =>
                                            onViewChange('analytics')
                                        }
                                        tooltip="Phân tích"
                                        size="default"
                                        className={cn(
                                            'cursor-pointer h-10 rounded-lg font-medium text-white/70 transition-all hover:text-white',
                                            activeView === 'analytics' &&
                                                'text-white font-semibold'
                                        )}
                                    >
                                        <BarChart3 />
                                        <span>Phân tích</span>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                </SidebarContent>

                <SidebarRail />
            </Sidebar>
        </div>
    )
}
