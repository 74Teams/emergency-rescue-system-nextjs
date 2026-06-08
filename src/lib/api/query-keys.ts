export * from './features/auth/auth.queries'
export * from './features/joinRequests/joinRequest.queries'
export * from './features/commander/commander.queries'
export * from './features/contacts/contacts.queries'
export * from './features/locations/locations.queries'
export * from './features/missions/missions.queries'
export * from './features/reports/reports.queries'
export * from './features/requests/requests.queries'
export * from './features/rescueTeams/rescueTeams.queries'
export * from './features/roles/roles.queries'
export * from './features/users/users.queries'
export * from './features/checklists/checklists.queries'

export const apiQueryKeys = {
    auth: {
        profile: ['auth', 'profile'] as const,
    },
    users: {
        all: ['users'] as const,
        detail: (userId: string) => ['users', userId] as const,
    },
    locations: {
        all: ['locations'] as const,
        detail: (locationId: string) => ['locations', locationId] as const,
    },
    requests: {
        all: ['requests'] as const,
        citizen: (params?: { pageSize?: number }) =>
            ['requests', 'citizen', params] as const,
        dispatcher: (params?: object) =>
            ['requests', 'dispatcher', params] as const,
        detail: (requestId: string) => ['requests', requestId] as const,
        history: (requestId: string) =>
            ['requests', requestId, 'history'] as const,
    },
    rescueTeams: {
        all: ['rescue-teams'] as const,
        list: (params?: object) => ['rescue-teams', 'list', params] as const,
        detail: (teamId: string) => ['rescue-teams', teamId] as const,
        members: (teamId: string) =>
            ['rescue-teams', teamId, 'members'] as const,
        missions: (teamId: string) =>
            ['rescue-teams', teamId, 'missions'] as const,
    },
    dashboards: {
        citizen: ['dashboards', 'citizen'] as const,
        rescuer: () => ['dashboards', 'rescuer'] as const,
        dispatcher: ['dashboards', 'dispatcher'] as const,
    },
    missions: {
        all: ['missions'] as const,
        detail: (missionId: string) => ['missions', 'detail', missionId] as const,
        history: (missionId: string) =>
            ['missions', 'detail', missionId, 'history'] as const,
    },
    checklists: {
        all: ['checklists'] as const,
        detail: (checklistId: string) => ['checklists', checklistId] as const,
    },
    reports: {
        all: ['reports'] as const,
        detail: (reportId: string) => ['reports', reportId] as const,
        byMission: (missionId: string) =>
            ['reports', 'mission', missionId] as const,
    },
    contacts: {
        all: ['contacts'] as const,
        detail: (contactId: string) => ['contacts', contactId] as const,
    },
    roles: {
        all: ['roles'] as const,
        detail: (roleId: string) => ['roles', roleId] as const,
    },
    joinRequests: {
        myStatus: ['join-requests', 'my-status'] as const,
        pending: (teamId?: string) => ['join-requests', 'pending', teamId] as const,
    },
} as const
