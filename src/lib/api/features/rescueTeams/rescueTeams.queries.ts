import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { rescueTeamsApi } from './rescueTeams.api'
import {
    CreateRescueTeamInput,
    RescueTeamQueryParams,
} from './rescueTeams.types'

export const rescueTeamKeys = {
    all: ['rescue-teams'] as const,
    lists: () => [...rescueTeamKeys.all, 'list'] as const,
    list: (params: RescueTeamQueryParams) =>
        [...rescueTeamKeys.lists(), params] as const,
    details: () => [...rescueTeamKeys.all, 'detail'] as const,
    detail: (id: string) => [...rescueTeamKeys.details(), id] as const,
    members: (id: string) => [...rescueTeamKeys.detail(id), 'members'] as const,
    missions: (id: string) =>
        [...rescueTeamKeys.detail(id), 'missions'] as const,
}

export function useRescueTeams(params: RescueTeamQueryParams = {}) {
    return useQuery({
        queryKey: rescueTeamKeys.list(params),
        queryFn: async () => {
            const res = await rescueTeamsApi.list(params)
            return res.data
        },
        staleTime: 60 * 1000,
    })
}

export function useRescueTeamDetail(teamId: string) {
    return useQuery({
        queryKey: rescueTeamKeys.detail(teamId),
        queryFn: async () => {
            const res = await rescueTeamsApi.detail(teamId)
            return res.data
        },
        enabled: !!teamId,
    })
}

export function useRescueTeamMembers(teamId: string) {
    return useQuery({
        queryKey: rescueTeamKeys.members(teamId),
        queryFn: async () => {
            const res = await rescueTeamsApi.members(teamId)
            return res.data
        },
        enabled: !!teamId,
    })
}
