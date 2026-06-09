import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { missionsApi } from './missions.api'
import { PaginationQuery } from '../../common/common.types'
import { CreateMissionInput, UpdateMissionStatusInput } from './missions.types'

export const missionKeys = {
    all: ['missions'] as const,
    lists: () => [...missionKeys.all, 'list'] as const,
    list: (params: Record<string, any>) =>
        [...missionKeys.lists(), params] as const,
    details: () => [...missionKeys.all, 'detail'] as const,
    detail: (id: string) => [...missionKeys.details(), id] as const,
    history: (id: string) => [...missionKeys.detail(id), 'history'] as const,
}

export function useMissions(
    params: PaginationQuery & { status?: string } = {}
) {
    return useQuery({
        queryKey: missionKeys.list(params),
        queryFn: async () => {
            const res = await missionsApi.list(params)
            return res.data
        },
        staleTime: 30 * 1000,
    })
}

export function useMissionDetail(missionId: string) {
    return useQuery({
        queryKey: missionKeys.detail(missionId),
        queryFn: async () => {
            const res = await missionsApi.detail(missionId)
            return res.data
        },
        enabled: !!missionId,
    })
}

export function useCreateMission() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (data: CreateMissionInput) => missionsApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: missionKeys.lists() })
        },
    })
}

export function useUpdateMissionStatus() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({
            missionId,
            payload,
        }: {
            missionId: string
            payload: UpdateMissionStatusInput
        }) => missionsApi.updateStatus(missionId, payload),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: missionKeys.lists() })
            queryClient.invalidateQueries({
                queryKey: missionKeys.detail(variables.missionId),
            })
            queryClient.invalidateQueries({
                queryKey: missionKeys.history(variables.missionId),
            })
        },
    })
}

export function useMissionHistory(missionId: string) {
    return useQuery({
        queryKey: missionKeys.history(missionId),
        queryFn: async () => {
            const res = await missionsApi.history(missionId)
            return res.data
        },
        enabled: !!missionId,
    })
}

export function useAddMissionHistory() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({
            missionId,
            payload,
        }: {
            missionId: string
            payload: { changedById?: string; note: string }
        }) => missionsApi.addHistory(missionId, payload),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: missionKeys.history(variables.missionId),
            })
        },
    })
}

export function useFinishMission() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({
            missionId,
            payload,
        }: {
            missionId: string
            payload: { changedById: string; note?: string }
        }) => missionsApi.finish(missionId, payload),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: missionKeys.lists() })
            queryClient.invalidateQueries({
                queryKey: missionKeys.detail(variables.missionId),
            })
            queryClient.invalidateQueries({
                queryKey: missionKeys.history(variables.missionId),
            })
        },
    })
}

export function useAbortMission() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({
            missionId,
            payload,
        }: {
            missionId: string
            payload: { changedById: string; note?: string }
        }) => missionsApi.abort(missionId, payload),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: missionKeys.lists() })
            queryClient.invalidateQueries({
                queryKey: missionKeys.detail(variables.missionId),
            })
            queryClient.invalidateQueries({
                queryKey: missionKeys.history(variables.missionId),
            })
        },
    })
}

export function useDeleteMissionMutation() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (missionId: string) => missionsApi.remove(missionId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: missionKeys.lists() })
            queryClient.invalidateQueries({ queryKey: ['requests'] })
        },
    })
}

