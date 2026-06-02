'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { UserAccountMenu } from '@/components/shared/UserAccountMenu'
import {
    NotificationBell,
    NotificationItem,
} from '@/components/shared/NotificationBell'
import {
    useDispatcherRequestsQuery,
    useRescueTeamsQuery,
    useMissionsQuery,
} from '@/lib/api/features/requests/dispatcher.queries'
import {
    DispatcherSidebar,
    type DispatcherView,
} from '@/components/dashboards/dispatcher/DispatcherSidebar'
import { DispatcherOverview } from '@/components/dashboards/dispatcher/DispatcherOverview'
import { RequestsTable } from '@/components/dashboards/dispatcher/RequestsTable'
import { MissionsPanel } from '@/components/dashboards/dispatcher/MissionsPanel'
import { TeamsPanel } from '@/components/dashboards/dispatcher/TeamsPanel'
import { AnalyticsPanel } from '@/components/dashboards/dispatcher/AnalyticsPanel'
import type { RequestSummary } from '@/lib/api/types'

const VIEW_TITLES: Record<DispatcherView, string> = {
    requests: 'Yêu cầu cứu trợ',
    missions: 'Nhiệm vụ',
    teams: 'Đội cứu hộ',
    analytics: 'Phân tích',
}

export default function DispatcherDashboard() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const pathname = usePathname()

    const viewParam = searchParams?.get('view') as DispatcherView | null
    const teamIdParam = searchParams?.get('teamId')
    const requestIdParam = searchParams?.get('requestId')

    const [activeView, setActiveView] = useState<DispatcherView>('requests')
    const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null)

    const [statusFilter, setStatusFilter] = useState<string>('PENDING')
    const [selectedRequest, setSelectedRequest] =
        useState<RequestSummary | null>(null)

    const requestsQuery = useDispatcherRequestsQuery({
        pageNumber: 1,
        pageSize: 100,
    })
    const teamsQuery = useRescueTeamsQuery()
    const missionsQuery = useMissionsQuery()

    const allRequests = requestsQuery.data?.items ?? []
    const teams = teamsQuery.data ?? []
    const missions = missionsQuery.data ?? []

    // Sync URL params to local state then clean up URL
    useEffect(() => {
        let shouldReplace = false

        if (viewParam && VIEW_TITLES[viewParam as DispatcherView]) {
            setActiveView(viewParam as DispatcherView)
            shouldReplace = true
        }

        if (teamIdParam) {
            setSelectedTeamId(teamIdParam)
            shouldReplace = true
        }

        if (requestIdParam && allRequests.length > 0) {
            const matched = allRequests.find(r => r.id === requestIdParam)
            if (matched) {
                setSelectedRequest(matched)
                setActiveView('requests')
                setStatusFilter('ALL')
                shouldReplace = true
            }
        }

        if (shouldReplace) {
            router.replace(pathname, { scroll: false })
        }
    }, [viewParam, teamIdParam, requestIdParam, allRequests, pathname, router])

    const filteredRequests =
        statusFilter === 'ALL'
            ? allRequests
            : allRequests.filter(r => r.status === statusFilter)

    const pendingRequestsCount = allRequests.filter(
        r => r.status === 'PENDING'
    ).length

    const RECENT_THRESHOLD_MS = 30 * 60 * 1000
    const now = Date.now()

    const recentMissionUpdates = missions.filter(m => {
        if (m.status !== 'EN_ROUTE' && m.status !== 'ABORTED') return false
        const ts = m.updateAt || m.createdAt
        if (!ts) return false
        const elapsed =
            now -
            new Date(
                ts.endsWith('Z') || ts.includes('+') ? ts : ts + 'Z'
            ).getTime()
        return elapsed >= 0 && elapsed <= RECENT_THRESHOLD_MS
    })

    const dispatcherNotifications: NotificationItem[] = [
        ...allRequests
            .filter(r => r.status === 'PENDING')
            .map(req => ({
                id: `req_${req.id}`,
                title: (
                    <p className="text-sm font-bold text-blue-600">
                        Có yêu cầu cứu trợ mới!
                    </p>
                ),
                description: (
                    <p className="text-xs text-slate-500">
                        Chờ điều phối đội cứu hộ.
                    </p>
                ),
                timestamp: req.createdAt || new Date().toISOString(),
                onClick: () => setActiveView('requests'),
            })),
        ...recentMissionUpdates.map(mission => {
            const teamName =
                mission.rescueTeam?.teamName ||
                teams.find(t => t.id === mission.rescueTeamId)?.teamName ||
                'cứu hộ'
            const isAccepted = mission.status === 'EN_ROUTE'
            return {
                id: `mis_${mission.id}_${mission.status}`,
                title: (
                    <p
                        className={`text-sm font-bold ${isAccepted ? 'text-emerald-600' : 'text-rose-600'}`}
                    >
                        {isAccepted
                            ? '✅ Nhiệm vụ đã được tiếp nhận'
                            : '❌ Nhiệm vụ bị từ chối'}
                    </p>
                ),
                description: (
                    <p className="text-xs text-slate-500 truncate w-full">
                        Đội{' '}
                        <span className="font-semibold text-slate-700">
                            {teamName}
                        </span>{' '}
                        vừa phản hồi
                    </p>
                ),
                timestamp:
                    mission.updateAt ||
                    mission.createdAt ||
                    new Date().toISOString(),
                onClick: () => setActiveView('missions'),
            }
        }),
    ]

    const isLoading = requestsQuery.isLoading

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
        )
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
                        <NotificationBell
                            items={dispatcherNotifications}
                            onItemClick={item => {
                                if (item.onClick) item.onClick()
                            }}
                        />
                        <UserAccountMenu avatarSize="sm" />
                    </div>
                </header>

                {/* SCROLLABLE CONTENT AREA */}
                <div className="flex-1 overflow-hidden flex flex-col p-4 md:p-6 bg-slate-50/80">
                    {/* STATS OVERVIEW */}
                    <DispatcherOverview
                        requests={allRequests}
                        teams={teams}
                        missions={missions}
                    />

                    {/* ACTIVE VIEW CONTENT */}
                    <div className="mt-4 flex-1 min-h-0">
                        {activeView === 'requests' && (
                            <RequestsTable
                                requests={filteredRequests}
                                allRequests={allRequests}
                                teams={teams}
                                statusFilter={statusFilter}
                                onStatusFilterChange={setStatusFilter}
                                selectedRequest={selectedRequest}
                                onSelectRequest={setSelectedRequest}
                                missions={missions}
                            />
                        )}

                        {activeView === 'missions' && (
                            <MissionsPanel
                                missions={missions}
                                teams={teams}
                                requests={allRequests}
                            />
                        )}

                        {activeView === 'teams' && (
                            <TeamsPanel
                                teams={teams}
                                requests={allRequests}
                                missions={missions}
                                initialTeamId={selectedTeamId}
                            />
                        )}

                        {activeView === 'analytics' && (
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
    )
}
