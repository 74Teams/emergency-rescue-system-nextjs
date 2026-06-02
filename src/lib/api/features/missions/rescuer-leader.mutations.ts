'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { missionsApi } from '../../services'
import { getStoredUser } from '../../storage'
import { apiQueryKeys } from '../../query-keys'
import type { MissionStatus } from '../../types'

/** Map chuỗi status → số int mà backend mong đợi */
const missionStatusToNumber: Record<MissionStatus, number> = {
    ASSIGNED: 1,
    EN_ROUTE: 2,
    ON_SITE: 3,
    IN_PROGRESS: 4,
    COMPLETED: 5,
    ABORTED: 6,
}

function getNumericStatus(status: MissionStatus): MissionStatus {
    return missionStatusToNumber[status] as unknown as MissionStatus
}

function invalidateTeamQueries(
    queryClient: ReturnType<typeof useQueryClient>,
    teamId?: string
) {
    queryClient.invalidateQueries({ queryKey: apiQueryKeys.dashboards.rescuer() })
    queryClient.invalidateQueries({ queryKey: apiQueryKeys.missions.all })
    if (teamId) {
        queryClient.invalidateQueries({
            queryKey: apiQueryKeys.rescueTeams.missions(teamId),
        })
        queryClient.invalidateQueries({
            queryKey: apiQueryKeys.rescueTeams.detail(teamId),
        })
    }
}

/**
 * Hook tiếp nhận nhiệm vụ: ASSIGNED → EN_ROUTE
 * Phía backend sẽ tự động: Request → IN_PROGRESS, Team → ON_MISSION
 */
export function useAcceptMissionMutation() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({
            missionId,
            teamId,
            note = 'Đội trưởng xác nhận tiếp nhận nhiệm vụ',
        }: {
            missionId: string
            teamId?: string
            note?: string
        }) => {
            const user = getStoredUser()
            if (!user?.id) throw new Error('Chưa đăng nhập')

            return missionsApi.updateStatus(missionId, {
                status: getNumericStatus('EN_ROUTE'),
                changedById: user.id,
                note,
            })
        },
        onSuccess: (_, variables) => {
            invalidateTeamQueries(queryClient, variables.teamId)
        },
    })
}

/**
 * Hook từ chối nhiệm vụ: abort khi còn ASSIGNED
 * Phía backend sẽ tự động: Request → CANCELED, Team → AVAILABLE
 */
export function useRejectMissionMutation() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({
            missionId,
            teamId,
            note = 'Đội trưởng từ chối nhiệm vụ',
        }: {
            missionId: string
            teamId?: string
            note?: string
        }) => {
            const user = getStoredUser()
            if (!user?.id) throw new Error('Chưa đăng nhập')

            return missionsApi.abort(missionId, {
                changedById: user.id,
                note,
            })
        },
        onSuccess: (_, variables) => {
            invalidateTeamQueries(queryClient, variables.teamId)
        },
    })
}

/**
 * Hook cập nhật tiến trình nhiệm vụ: EN_ROUTE → ON_SITE → IN_PROGRESS
 */
export function useUpdateMissionProgressMutation() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({
            missionId,
            status,
            teamId,
            note = '',
        }: {
            missionId: string
            status: MissionStatus
            teamId?: string
            note?: string
        }) => {
            const user = getStoredUser()
            if (!user?.id) throw new Error('Chưa đăng nhập')

            return missionsApi.updateStatus(missionId, {
                status: getNumericStatus(status),
                changedById: user.id,
                note,
            })
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: apiQueryKeys.missions.detail(variables.missionId),
            })
            queryClient.invalidateQueries({
                queryKey: apiQueryKeys.missions.history(variables.missionId),
            })
            invalidateTeamQueries(queryClient, variables.teamId)
        },
    })
}

/**
 * Hook hoàn thành nhiệm vụ: → COMPLETED
 * Phía backend sẽ tự động: Request → COMPLETED, Team → AVAILABLE
 */
export function useFinishMissionMutation() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({
            missionId,
            teamId,
            note = 'Hoàn thành nhiệm vụ',
        }: {
            missionId: string
            teamId?: string
            note?: string
        }) => {
            const user = getStoredUser()
            if (!user?.id) throw new Error('Chưa đăng nhập')

            return missionsApi.finish(missionId, {
                changedById: user.id,
                note,
            })
        },
        onSuccess: (_, variables) => {
            invalidateTeamQueries(queryClient, variables.teamId)
        },
    })
}

/**
 * Hook hủy nhiệm vụ từ bất kỳ trạng thái nào (trừ COMPLETED/ABORTED)
 * Phía backend sẽ tự động: Request → CANCELED, Team → AVAILABLE
 */
export function useAbortMissionMutation() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({
            missionId,
            teamId,
            note = 'Đội trưởng hủy nhiệm vụ',
        }: {
            missionId: string
            teamId?: string
            note?: string
        }) => {
            const user = getStoredUser()
            if (!user?.id) throw new Error('Chưa đăng nhập')

            return missionsApi.abort(missionId, {
                changedById: user.id,
                note,
            })
        },
        onSuccess: (_, variables) => {
            invalidateTeamQueries(queryClient, variables.teamId)
        },
    })
}

export function useAddMissionHistoryMutation() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({
            missionId,
            note,
        }: {
            missionId: string
            note: string
        }) => {
            const user = getStoredUser()
            if (!user?.id) throw new Error('Chưa đăng nhập')

            return missionsApi.addHistory(missionId, { changedById: user.id, note })
        },
        onSuccess: (_, { missionId }) => {
            queryClient.invalidateQueries({
                queryKey: apiQueryKeys.missions.history(missionId),
            })
        },
    })
}
