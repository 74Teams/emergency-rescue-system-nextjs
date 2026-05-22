import { PaginationQuery } from "../../common/common.types";

export type TeamStatus = "AVAILABLE" | "ON_MISSION" | "UNAVAILABLE" | "MAINTENANCE";

export interface RescueTeamSummary {
  id: string;
  teamName: string;
  status: TeamStatus;
  description?: string;
  baseLocation: {
    latitude: number;
    longitude: number;
    address?: string;
    landmark?: string;
  };
  leaderId?: string;
  leader?: {
    id: string;
    fullName: string;
    email?: string;
  };
  memberCount?: number;
  createdAt?: string;
}

export interface CreateRescueTeamInput {
  teamName: string;
  teamLeaderId: string;
  description?: string;
  baseLocationId?: string;
  memberIds?: string[];
}

export interface TeamMemberSummary {
  id: string;
  userId: string;
  teamId: string;
  joinDate?: string;
  user?: {
    id: string;
    fullName: string;
    email?: string;
    phoneNumber?: string;
  };
}

export interface RescueTeamMemberDTO {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  avatar?: string;
  isActive: boolean;
}

export interface RescueTeamQueryParams extends PaginationQuery {
  status?: TeamStatus;
  search?: string;
}
