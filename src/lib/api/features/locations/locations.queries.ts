import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { locationsApi } from "./locations.api";
import { PaginationQuery } from "../../common/common.types";
import { CreateLocationRequest } from "./locations.types";

export const locationKeys = {
  all: ["locations"] as const,
  lists: () => [...locationKeys.all, "list"] as const,
  list: (params: PaginationQuery) => [...locationKeys.lists(), params] as const,
  details: () => [...locationKeys.all, "detail"] as const,
  detail: (id: string) => [...locationKeys.details(), id] as const,
};

export function useLocations(params: PaginationQuery = {}) {
  return useQuery({
    queryKey: locationKeys.list(params),
    queryFn: async () => {
      const res = await locationsApi.list(params);
      return res.data;
    },
    staleTime: 60 * 1000,
  });
}

export function useLocationDetail(locationId: string) {
  return useQuery({
    queryKey: locationKeys.detail(locationId),
    queryFn: async () => {
      const res = await locationsApi.detail(locationId);
      return res.data;
    },
    enabled: !!locationId,
  });
}

export function useCreateLocation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateLocationRequest) => locationsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: locationKeys.lists() });
    },
  });
}

export function useUpdateLocation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ locationId, data }: { locationId: string; data: Partial<CreateLocationRequest> }) => 
      locationsApi.update(locationId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: locationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: locationKeys.detail(variables.locationId) });
    },
  });
}

export function useDeleteLocation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (locationId: string) => locationsApi.remove(locationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: locationKeys.lists() });
    },
  });
}
