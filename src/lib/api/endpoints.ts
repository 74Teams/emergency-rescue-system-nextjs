export const apiBaseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:5074/api'

export const apiRoutes = {
    auth: {
        register: '/auth/register',
        login: '/auth/login',
        profile: '/auth/profile',
        avatar: '/auth/avatar',
        forgotPassword: '/auth/forgot-password',
        resetPassword: '/auth/reset-password',
        contact: '/auth/contact',
        refresh: '/auth/refresh',
        selectRole: '/auth/select-role',
    },
    users: '/users',
    commander: 'commander',
    locations: 'Location',
    requests: '/requests',
    rescueTeams: '/RescueTeam',
    missions: '/missions',
    reports: '/reports',
    roles: '/roles',
    joinRequests: '/rescueteam/join-requests',
    checklists: '/checklist',
} as const

export const apiRouteBuilders = {
    users: {
        byId: (userId: string) => `${apiRoutes.users}/${userId}`,
    },
    locations: {
        byId: (locationId: string) => `${apiRoutes.locations}/${locationId}`,
    },
    requests: {
        byId: (requestId: string) => `${apiRoutes.requests}/${requestId}`,
        changeStatus: (requestId: string) =>
            `${apiRoutes.requests}/${requestId}/status`,
        history: (requestId: string) =>
            `${apiRoutes.requests}/${requestId}/history`,
    },
    rescueTeams: {
        byId: (teamId: string) => `${apiRoutes.rescueTeams}/${teamId}`,
        status: (teamId: string, newStatus: string) =>
            `${apiRoutes.rescueTeams}/${teamId}/status/${newStatus}`,
        members: (teamId: string) =>
            `${apiRoutes.rescueTeams}/${teamId}/members`,
        member: (teamId: string, memberId: string) =>
            `${apiRoutes.rescueTeams}/${teamId}/member/${memberId}`,
        missions: (teamId: string) =>
            `${apiRoutes.rescueTeams}/${teamId}/missions`,
    },
    missions: {
        byId: (missionId: string) => `${apiRoutes.missions}/${missionId}`,
        status: (missionId: string) =>
            `${apiRoutes.missions}/${missionId}/status`,
        finish: (missionId: string) =>
            `${apiRoutes.missions}/${missionId}/finish`,
        abort: (missionId: string) =>
            `${apiRoutes.missions}/${missionId}/abort`,
        history: (missionId: string) =>
            `${apiRoutes.missions}/${missionId}/history`,
    },
    checklists: {
        byId: (checklistId: string) => `${apiRoutes.checklists}/${checklistId}`,
        items: (checklistId: string) => `${apiRoutes.checklists}/${checklistId}/items`,
        itemById: (itemId: string) => `${apiRoutes.checklists}/items/${itemId}`,
    },
    reports: {
        byId: (reportId: string) => `${apiRoutes.reports}/${reportId}`,
        exportPdf: (reportId: string) =>
            `${apiRoutes.reports}/${reportId}/export-pdf`,
        byMission: (missionId: string) =>
            `${apiRoutes.reports}/mission/${missionId}`,
    },
    roles: {
        byId: (roleId: string) => `${apiRoutes.roles}/${roleId}`,
    },
    commander: {
        approvals: {
            pending: `${apiRoutes.commander}/approvals/pending`,
            rejected: `${apiRoutes.commander}/approvals/rejected`,
            approve: (userId: string) =>
                `${apiRoutes.commander}/approvals/${userId}`,
            reject: (userId: string) =>
                `${apiRoutes.commander}/approvals/${userId}/reject`,
        },
        users: {
            list: `${apiRoutes.commander}/users`,
            toggleStatus: (userId: string) =>
                `${apiRoutes.commander}/users/${userId}/status`,
        },
    },
    joinRequests: {
        myStatus: `${apiRoutes.joinRequests}/my-status`,
        pending: (teamId?: string) =>
            teamId ? `${apiRoutes.joinRequests}/pending?teamId=${teamId}` : `${apiRoutes.joinRequests}/pending`,
        approve: (requestId: string) =>
            `${apiRoutes.joinRequests}/${requestId}/approve`,
        reject: (requestId: string) =>
            `${apiRoutes.joinRequests}/${requestId}/reject`,
    },
} as const
