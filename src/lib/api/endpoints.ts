export const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5074/api";

export const apiRoutes = {
  auth: {
    register: "/auth/register",
    login: "/auth/login",
    profile: "/auth/profile",
    avatar: "/auth/avatar",
    forgotPassword: "/auth/forgot-password",
    resetPassword: "/auth/reset-password",
    contact: "/auth/contact",
  },
  users: "/users",
  locations: "/locations",
  requests: "/requests",
  rescueTeams: "/rescueteam",
  missions: "/missions",
  reports: "/reports",
  roles: "/roles",
} as const;

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
    members: (teamId: string) => `${apiRoutes.rescueTeams}/${teamId}/members`,
    member: (teamId: string, memberId: string) =>
      `${apiRoutes.rescueTeams}/${teamId}/member/${memberId}`,
    missions: (teamId: string) => `${apiRoutes.rescueTeams}/${teamId}/missions`,
    memberDashboard: () => `${apiRoutes.rescueTeams}/member/dashboard`,
  },
  missions: {
    byId: (missionId: string) => `${apiRoutes.missions}/${missionId}`,
    status: (missionId: string) => `${apiRoutes.missions}/${missionId}/status`,
    finish: (missionId: string) => `${apiRoutes.missions}/${missionId}/finish`,
    abort: (missionId: string) => `${apiRoutes.missions}/${missionId}/abort`,
    history: (missionId: string) =>
      `${apiRoutes.missions}/${missionId}/history`,
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
} as const;
