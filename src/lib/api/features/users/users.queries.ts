import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usersApi } from "./users.api";
import { PaginationQuery } from "../../common/common.types";
import { CreateUserRequest, UpdateUserRequest } from "./users.types";

// qk-factory-pattern
export const userKeys = {
  all: ["users"] as const,
  lists: () => [...userKeys.all, "list"] as const,
  list: (params: PaginationQuery) => [...userKeys.lists(), params] as const,
  details: () => [...userKeys.all, "detail"] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
};

export function useUsers(params: PaginationQuery = {}) {
  return useQuery({
    queryKey: userKeys.list(params),
    queryFn: async () => {
      const res = await usersApi.list(params);
      return res.data;
    },
    staleTime: 60 * 1000,
  });
}

export function useUserDetail(userId: string) {
  return useQuery({
    queryKey: userKeys.detail(userId),
    queryFn: async () => {
      const res = await usersApi.detail(userId);
      return res.data;
    },
    enabled: !!userId,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateUserRequest) => usersApi.create(data),
    onSuccess: () => {
      // mut-invalidate-queries
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: UpdateUserRequest }) => 
      usersApi.update(userId, data),
    onSuccess: (_, variables) => {
      // mut-invalidate-queries
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      queryClient.invalidateQueries({ queryKey: userKeys.detail(variables.userId) });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (userId: string) => usersApi.remove(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
}
