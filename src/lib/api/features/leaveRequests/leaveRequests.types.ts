export type LeaveRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export interface LeaveRequestDTO {
    id: string
    rescuerId: string
    rescuerName: string
    rescuerAvatar: string
    teamId: string
    leaderId: string | null
    startTime: string
    endTime: string
    reason: string
    note: string | null
    status: LeaveRequestStatus
    createdAt: string
    updatedAt: string
}

export interface CreateLeaveRequestPayload {
    startTime: string
    endTime: string
    reason: string
}

export interface ApproveLeaveRequestPayload {
    note?: string
}

export interface RejectLeaveRequestPayload {
    note: string
}
