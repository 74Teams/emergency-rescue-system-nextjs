import { apiRequest } from '../../client'
import { apiRoutes, apiRouteBuilders } from '../../endpoints'
import { ApiResponse, PaginationQuery } from '../../common/common.types'
import { toBackendPagination } from '../../pagination'
import {
    MissionSummary,
    CreateMissionInput,
    UpdateMissionStatusInput,
    MissionTimelineItem,
} from './missions.types'

export const missionsApi = {
    create(payload: CreateMissionInput) {
        return apiRequest<ApiResponse<{ id: string }>>({
            method: 'POST',
            url: apiRoutes.missions,
            data: payload,
        })
    },
    list(params?: PaginationQuery & { status?: string }) {
        return apiRequest<ApiResponse<MissionSummary[]>>({
            method: 'GET',
            url: apiRoutes.missions,
            params: {
                ...toBackendPagination(params),
                Status: params?.status,
            },
        })
    },
    detail(missionId: string) {
        return apiRequest<
            ApiResponse<MissionSummary & { request?: any; rescueTeam?: any }>
        >({
            method: 'GET',
            url: apiRouteBuilders.missions.byId(missionId),
        })
    },
    updateStatus(missionId: string, payload: UpdateMissionStatusInput) {
        return apiRequest<ApiResponse<null>>({
            method: 'PUT',
            url: apiRouteBuilders.missions.status(missionId),
            data: payload,
        })
    },
    finish(
        missionId: string,
        payload: Pick<UpdateMissionStatusInput, 'changedById' | 'note'>
    ) {
        return apiRequest<ApiResponse<null>>({
            method: 'PUT',
            url: apiRouteBuilders.missions.finish(missionId),
            data: payload,
        })
    },
    abort(
        missionId: string,
        payload: Pick<UpdateMissionStatusInput, 'changedById' | 'note'>
    ) {
        return apiRequest<ApiResponse<null>>({
            method: 'PUT',
            url: apiRouteBuilders.missions.abort(missionId),
            data: payload,
        })
    },
    history(missionId: string) {
        return apiRequest<ApiResponse<MissionTimelineItem[]>>({
            method: 'GET',
            url: apiRouteBuilders.missions.history(missionId),
        })
    },
}
