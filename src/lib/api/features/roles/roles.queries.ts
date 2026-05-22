import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { rolesApi } from "./roles.api";
import { CreateRoleInput } from "./roles.types";

export const roleKeys = {
  all: ["roles"] as const,
  lists: () => [...roleKeys.all, "list"] as const,
  details: () => [...roleKeys.all, "detail"] as const,
  detail: (id: string) => [...roleKeys.details(), id] as const,
};

export function useRoles() {
  return useQuery({
    queryKey: roleKeys.lists(),
    queryFn: async () => {
      const res = await rolesApi.list();
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useRoleDetail(roleId: string) {
  return useQuery({
    queryKey: roleKeys.detail(roleId),
    queryFn: async () => {
      const res = await rolesApi.detail(roleId);
      return res.data;
    },
    enabled: !!roleId,
  });
}

export function useCreateRole() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateRoleInput) => rolesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleKeys.lists() });
    },
  });
}

export function useUpdateRole() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ roleId, data }: { roleId: string; data: CreateRoleInput }) => 
      rolesApi.update(roleId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: roleKeys.lists() });
      queryClient.invalidateQueries({ queryKey: roleKeys.detail(variables.roleId) });
    },
  });
}

export function useDeleteRole() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (roleId: string) => rolesApi.remove(roleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleKeys.lists() });
    },
  });
}
