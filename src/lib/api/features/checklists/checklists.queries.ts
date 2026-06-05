import { useMutation, useQueryClient } from '@tanstack/react-query'
import { checklistsApi, CreateChecklistPayload, CreateChecklistItemPayload, UpdateChecklistItemPayload } from './checklists.api'
import { apiQueryKeys } from '../../query-keys'

export function useCreateChecklist() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (payload: CreateChecklistPayload) => checklistsApi.createChecklist(payload),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: apiQueryKeys.missions.detail(variables.missionId),
            })
        },
    })
}

export function useDeleteChecklist(missionId: string) {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (id: string) => checklistsApi.deleteChecklist(id),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: apiQueryKeys.missions.detail(missionId),
            })
        },
    })
}

export function useCreateChecklistItem(missionId: string) {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ checklistId, payload }: { checklistId: string; payload: CreateChecklistItemPayload }) =>
            checklistsApi.createChecklistItem(checklistId, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: apiQueryKeys.missions.detail(missionId),
            })
        },
    })
}

export function useUpdateChecklistItem(missionId: string) {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ itemId, payload }: { itemId: string; payload: UpdateChecklistItemPayload }) =>
            checklistsApi.updateChecklistItem(itemId, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: apiQueryKeys.missions.detail(missionId),
            })
        },
    })
}

export function useDeleteChecklistItem(missionId: string) {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (itemId: string) => checklistsApi.deleteChecklistItem(itemId),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: apiQueryKeys.missions.detail(missionId),
            })
        },
    })
}
