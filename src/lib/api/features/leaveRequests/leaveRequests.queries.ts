import { useQuery } from '@tanstack/react-query'
import { leaveRequestsApi } from './leaveRequests.api'

export const leaveRequestsKeys = {
    all: ['leave-requests'] as const,
    mine: () => [...leaveRequestsKeys.all, 'mine'] as const,
    team: (teamId: string) => [...leaveRequestsKeys.all, 'team', teamId] as const,
}

export const useMyLeaveRequests = () => {
    return useQuery({
        queryKey: leaveRequestsKeys.mine(),
        queryFn: async () => {
            const res = await leaveRequestsApi.getMyRequests()
            const data = res.data || []
            return data.map((item: any) => ({
                ...item,
                status: item.status === 0 ? 'PENDING' : item.status === 1 ? 'APPROVED' : item.status === 2 ? 'REJECTED' : item.status
            }))
        },
    })
}

export const useTeamLeaveRequests = (teamId: string | null) => {
    return useQuery({
        queryKey: leaveRequestsKeys.team(teamId!),
        queryFn: async () => {
            const res = await leaveRequestsApi.getTeamRequests(teamId!)
            const data = res.data || []
            return data.map((item: any) => ({
                ...item,
                status: item.status === 0 ? 'PENDING' : item.status === 1 ? 'APPROVED' : item.status === 2 ? 'REJECTED' : item.status
            }))
        },
        enabled: !!teamId,
    })
}
