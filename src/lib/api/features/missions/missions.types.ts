export type MissionStatus = "ASSIGNED" | "EN_ROUTE" | "ON_SITE" | "IN_PROGRESS" | "COMPLETED" | "ABORTED";

export interface MissionSummary {
  id: string;
  requestId: string;
  dispatcherId?: string;
  rescueTeamId: string;
  status: MissionStatus;
  startTime?: string;
  endTime?: string | null;
  createdAt?: string;
}

export interface CreateMissionInput {
  requestId: string;
  dispatcherId: string;
  rescueTeamId: string;
}

export interface UpdateMissionStatusInput {
  status: MissionStatus;
  changedById: string;
  note?: string;
}

export interface MissionTimelineItem {
  id: string;
  missionId: string;
  fromStatus: MissionStatus;
  toStatus: MissionStatus;
  changedById: string;
  note?: string;
  changedBy?: {
    id: string;
    fullName: string;
    email?: string;
  };
  createdAt: string;
}
