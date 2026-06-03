export interface RescueTeamJoinRequestDTO {
  id: string;
  rescuerId: string;
  rescuerName: string;
  rescuerEmail: string;
  rescuerPhone: string;
  rescuerAvatar: string;
  rescueTeamId: string;
  teamName: string;
  status: number; // 0 = Pending, 1 = Approved, 2 = Rejected
  message: string | null;
  createdAt: string;
}

export interface CreateJoinRequestInput {
  rescueTeamId: string;
  message?: string;
}
