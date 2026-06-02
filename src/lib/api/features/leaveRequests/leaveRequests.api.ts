import { apiClient } from '@/lib/api/client'
import type { ApiResponse } from '@/lib/api/common/common.types'
import type {
    LeaveRequestDTO,
    CreateLeaveRequestPayload,
    ApproveLeaveRequestPayload,
    RejectLeaveRequestPayload
} from './leaveRequests.types'

export const leaveRequestsApi = {
    // Rescuer creates a leave request
    create: async (data: CreateLeaveRequestPayload) => {
        const res = await apiClient.post<ApiResponse<{ id: string }>>('/leave-requests', data)
        return res.data
    },

    // Rescuer gets their own leave requests
    getMyRequests: async () => {
        const res = await apiClient.get<ApiResponse<LeaveRequestDTO[]>>('/leave-requests/me')
        return res.data
    },

    // Leader gets leave requests of their team
    getTeamRequests: async (teamId: string) => {
        const res = await apiClient.get<ApiResponse<LeaveRequestDTO[]>>(`/leave-requests/team/${teamId}`)
        return res.data
    },

    // Leader approves a leave request
    approve: async (id: string, data: ApproveLeaveRequestPayload) => {
        const res = await apiClient.put<ApiResponse<unknown>>(`/leave-requests/${id}/approve`, data)
        return res.data
    },

    // Leader rejects a leave request
    reject: async (id: string, data: RejectLeaveRequestPayload) => {
        const res = await apiClient.put<ApiResponse<unknown>>(`/leave-requests/${id}/reject`, data)
        return res.data
    }
}
