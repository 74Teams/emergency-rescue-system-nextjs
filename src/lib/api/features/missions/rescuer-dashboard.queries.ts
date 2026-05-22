import type {
  RescuerActiveMission,
  RescuerDashboardData,
} from "@/types/dashboards/rescuer";
import type { RequestPriority } from "@/types/request";
import { authApi, requestsApi, rescueTeamsApi } from "../../services";
import { getStoredUser } from "../../storage";
import type {
  MissionStatus,
  PriorityLevel,
  ProfileResponse,
  RequestSummary,
} from "../../types";
import { normalizeMission, normalizeRequest } from "../requests/dispatcher.queries";

const numericPriorityToRequest: Record<number, RequestPriority> = {
  1: "CRITICAL",
  2: "HIGH",
  3: "MEDIUM",
  4: "LOW",
};

const inactiveMissionStatuses = new Set(["COMPLETED", "ABORTED", "CANCELED"]);

type TeamSummary = { id: string; teamName?: string; name?: string };
type TeamMember = { id: string; email?: string; userId?: string };
type TeamMissionRow = {
  id: string;
  requestId: string;
  description?: string;
  status: MissionStatus | number | string;
  endTime?: string | null;
};

function extractArray<T>(data: T[] | { items?: T[] } | unknown): T[] {
  if (Array.isArray(data)) {
    return data;
  }
  if (data && typeof data === "object" && "items" in data) {
    const items = (data as { items?: T[] }).items;
    return Array.isArray(items) ? items : [];
  }
  return [];
}

function extractTeams(data: unknown): TeamSummary[] {
  return extractArray<TeamSummary>(data);
}

function isActiveMission(mission: TeamMissionRow) {
  if (mission.endTime) {
    return false;
  }

  const normalized = normalizeMission({
    id: mission.id,
    requestId: mission.requestId,
    rescueTeamId: "",
    status: mission.status as MissionStatus,
  });

  return !inactiveMissionStatuses.has(normalized.status);
}

async function findUserTeam(userId: string, email: string) {
  const teamsResponse = await rescueTeamsApi.list();
  const teams = extractTeams(teamsResponse.data);

  for (const team of teams) {
    const membersResponse = await rescueTeamsApi.members(team.id);
    const members = extractArray<TeamMember>(membersResponse.data);
    const isMember = members.some(
      (member) =>
        member.id === userId ||
        member.userId === userId ||
        (email && member.email?.toLowerCase() === email.toLowerCase()),
    );

    if (isMember) {
      return {
        teamId: team.id,
        teamName: team.teamName ?? team.name ?? "Đội cứu hộ",
      };
    }
  }

  return null;
}

function mapPriority(
  priority: RequestSummary["priority"] | number,
): RequestPriority {
  if (typeof priority === "number") {
    return numericPriorityToRequest[priority] ?? "MEDIUM";
  }

  const map: Record<PriorityLevel, RequestPriority> = {
    CRITICAL: "CRITICAL",
    HIGH: "HIGH",
    MEDIUM: "MEDIUM",
    LOW: "LOW",
  };

  return map[priority as PriorityLevel] ?? "MEDIUM";
}

function mapActiveMission(
  mission: TeamMissionRow,
  request: RequestSummary,
): RescuerActiveMission | null {
  const normalizedMission = normalizeMission({
    id: mission.id,
    requestId: mission.requestId,
    rescueTeamId: "",
    status: mission.status as MissionStatus,
  });

  const location = request.location;
  if (!location) {
    return null;
  }

  const requestedBy = request.requestedBy;

  return {
    id: mission.id,
    title:
      mission.description?.trim() ||
      request.description?.trim() ||
      "Nhiệm vụ cứu hộ",
    status: normalizedMission.status as RescuerActiveMission["status"],
    priority: mapPriority(request.priority),
    victims: requestedBy
      ? [
          {
            id: requestedBy.id,
            fullName: requestedBy.fullName,
            age: 0,
            phoneNumber: requestedBy.phoneNumber ?? "",
            email: requestedBy.email ?? "",
            condition: request.description || "Chưa rõ tình trạng",
          },
        ]
      : [],
    location: {
      id: location.id,
      latitude: location.latitude,
      longitude: location.longitude,
      address: location.address,
      landmark: location.landmark,
    },
  };
}

export async function fetchRescuerDashboardData(): Promise<RescuerDashboardData> {
  const storedUser = getStoredUser();
  const profileResponse = await authApi.profile();
  const profile = profileResponse.data as ProfileResponse & {
    rescueTeamId?: string;
    teamName?: string;
  };
  const userId = profile.id;
  const email = profile.email ?? storedUser?.email ?? "";
  const fullName =
    profile.fullName ?? storedUser?.fullName ?? "Thành viên cứu hộ";

  let membership: { teamId: string; teamName: string } | null = null;
  if (profile.rescueTeamId) {
    membership = {
      teamId: profile.rescueTeamId,
      teamName: profile.teamName ?? "",
    };
  } else {
    membership = await findUserTeam(userId, email);
  }

  let activeMission: RescuerActiveMission | null = null;

  if (membership) {
    const missionsResponse = await rescueTeamsApi.missions(membership.teamId);
    const missions = extractArray<TeamMissionRow>(missionsResponse.data);
    const activeSummary = missions.find(isActiveMission);

    if (activeSummary?.requestId) {
      const requestResponse = await requestsApi.detail(activeSummary.requestId);
      const request = normalizeRequest(requestResponse.data);
      activeMission = mapActiveMission(activeSummary, request);
    }
  }

  return {
    profile: {
      id: userId,
      userId,
      fullName,
      specialty:
        profile.roles?.join(", ") ||
        storedUser?.roles?.join(", ") ||
        "Cứu hộ viên",
      avatarUrl:
        storedUser?.avatarUrl ||
        (profile as { avatar?: string }).avatar ||
        undefined,
    },
    dutyStatus: {
      isOnline: true,
      statusCode: activeMission ? "ON_MISSION" : "READY",
      lastUpdated: new Date().toISOString(),
    },
    notifications: [],
    activeMission,
    team: membership ? { name: membership.teamName } : undefined,
  };
}
