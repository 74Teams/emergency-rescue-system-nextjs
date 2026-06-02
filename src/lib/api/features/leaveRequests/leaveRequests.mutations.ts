import { useMutation, useQueryClient } from '@tanstack/react-query'
import { leaveRequestsApi } from './leaveRequests.api'
import { leaveRequestsKeys } from './leaveRequests.queries'
import type { 
    CreateLeaveRequestPayload, 
    ApproveLeaveRequestPayload, 
    RejectLeaveRequestPayload 
} from './leaveRequests.types'

export const useCreateLeaveRequest = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (data: CreateLeaveRequestPayload) => leaveRequestsApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: leaveRequestsKeys.mine() })
        },
    })
}

export const useApproveLeaveRequest = (teamId: string) => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: ApproveLeaveRequestPayload }) =>
            leaveRequestsApi.approve(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: leaveRequestsKeys.team(teamId) })
        },
    })
}

export const useRejectLeaveRequest = (teamId: string) => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: RejectLeaveRequestPayload }) =>
            leaveRequestsApi.reject(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: leaveRequestsKeys.team(teamId) })
        },
    })
}
