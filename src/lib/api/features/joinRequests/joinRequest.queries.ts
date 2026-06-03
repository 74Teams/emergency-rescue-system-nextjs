import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { joinRequestsApi } from './joinRequest.api'
import { CreateJoinRequestInput } from './joinRequest.types'

export const joinRequestKeys = {
    all: ['join-requests'] as const,
    myStatus: () => [...joinRequestKeys.all, 'my-status'] as const,
    pending: (teamId?: string) => [...joinRequestKeys.all, 'pending', teamId] as const,
}

export function useRescuerJoinRequestStatus(enabled: boolean = true) {
    return useQuery({
        queryKey: joinRequestKeys.myStatus(),
        queryFn: async () => {
            const res = await joinRequestsApi.getMyStatus()
            return res.data
        },
        enabled,
    })
}

export function useTeamJoinRequests(teamId?: string) {
    return useQuery({
        queryKey: joinRequestKeys.pending(teamId),
        queryFn: async () => {
            const res = await joinRequestsApi.getPending(teamId)
            return res.data
        },
    })
}

export function useCreateJoinRequest() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (payload: CreateJoinRequestInput) => joinRequestsApi.create(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: joinRequestKeys.myStatus() })
        },
    })
}

export function useApproveJoinRequest() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (requestId: string) => joinRequestsApi.approve(requestId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: joinRequestKeys.all })
            queryClient.invalidateQueries({ queryKey: ['auth', 'profile'] })
            queryClient.invalidateQueries({ queryKey: ['rescue-teams'] })
        },
    })
}

export function useRejectJoinRequest() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (requestId: string) => joinRequestsApi.reject(requestId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: joinRequestKeys.all })
        },
    })
}
