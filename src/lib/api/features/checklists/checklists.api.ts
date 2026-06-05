import { apiRequest } from '../../client'
import { apiRoutes, apiRouteBuilders } from '../../endpoints'
import { ApiResponse } from '../../common/common.types'

export interface CreateChecklistPayload {
    title: string
    missionId: string
}

export interface CreateChecklistItemPayload {
    description: string
}

export interface UpdateChecklistItemPayload {
    description: string
    isCheck: boolean
}

export const checklistsApi = {
    createChecklist(payload: CreateChecklistPayload) {
        return apiRequest<ApiResponse<{ id: string }>>({
            method: 'POST',
            url: apiRoutes.checklists,
            data: payload,
        })
    },

    deleteChecklist(id: string) {
        return apiRequest<ApiResponse<null>>({
            method: 'DELETE',
            url: apiRouteBuilders.checklists.byId(id),
        })
    },

    createChecklistItem(checklistId: string, payload: CreateChecklistItemPayload) {
        return apiRequest<ApiResponse<{ id: string }>>({
            method: 'POST',
            url: apiRouteBuilders.checklists.items(checklistId),
            data: payload,
        })
    },

    updateChecklistItem(itemId: string, payload: UpdateChecklistItemPayload) {
        return apiRequest<ApiResponse<null>>({
            method: 'PUT',
            url: apiRouteBuilders.checklists.itemById(itemId),
            data: payload,
        })
    },

    deleteChecklistItem(itemId: string) {
        return apiRequest<ApiResponse<null>>({
            method: 'DELETE',
            url: apiRouteBuilders.checklists.itemById(itemId),
        })
    },
}
