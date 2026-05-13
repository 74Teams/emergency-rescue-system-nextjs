export const apiQueryKeys = {
  auth: {
    profile: ["auth", "profile"] as const,
  },
  users: {
    all: ["users"] as const,
    detail: (userId: string) => ["users", userId] as const,
  },
  locations: {
    all: ["locations"] as const,
    detail: (locationId: string) => ["locations", locationId] as const,
  },
  requests: {
    all: ["requests"] as const,
    detail: (requestId: string) => ["requests", requestId] as const,
    history: (requestId: string) => ["requests", requestId, "history"] as const,
  },
  rescueTeams: {
    all: ["rescue-teams"] as const,
    detail: (teamId: string) => ["rescue-teams", teamId] as const,
    members: (teamId: string) => ["rescue-teams", teamId, "members"] as const,
    missions: (teamId: string) => ["rescue-teams", teamId, "missions"] as const,
    memberDashboard: () => ["rescue-teams", "member-dashboard"] as const,
  },
  missions: {
    all: ["missions"] as const,
    detail: (missionId: string) => ["missions", missionId] as const,
    history: (missionId: string) => ["missions", missionId, "history"] as const,
  },
  reports: {
    all: ["reports"] as const,
    detail: (reportId: string) => ["reports", reportId] as const,
    byMission: (missionId: string) =>
      ["reports", "mission", missionId] as const,
  },
  contacts: {
    all: ["contacts"] as const,
    detail: (contactId: string) => ["contacts", contactId] as const,
  },
  roles: {
    all: ["roles"] as const,
    detail: (roleId: string) => ["roles", roleId] as const,
  },
} as const;
