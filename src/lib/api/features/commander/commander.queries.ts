import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { commanderApi } from "./commander.api";

export const commanderKeys = {
  all: ["commander"] as const,
  approvals: () => [...commanderKeys.all, "approvals"] as const,
  users: () => [...commanderKeys.all, "users"] as const,
  usersList: (params: Record<string, any>) => [...commanderKeys.users(), "list", params] as const,
};

export function usePendingApprovals() {
  return useQuery({
    queryKey: commanderKeys.approvals(),
    queryFn: async () => {
      const res = await commanderApi.getPendingApprovals();
      return res.data;
    },
    staleTime: 30 * 1000,
  });
}

export function useSystemAccounts(params?: { search?: string; role?: string }) {
  return useQuery({
    queryKey: commanderKeys.usersList(params || {}),
    queryFn: async () => {
      const res = await commanderApi.getSystemAccounts(params);
      return res; // Assuming data needs parsing
    },
  });
}

export function useApproveAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => commanderApi.approveAccount(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: commanderKeys.approvals() });
    },
  });
}

export function useRejectAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => commanderApi.rejectAccount(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: commanderKeys.approvals() });
    },
  });
}

export function useToggleAccountStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, isActive }: { userId: string; isActive: boolean }) => 
      commanderApi.toggleAccountStatus(userId, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: commanderKeys.users() });
    },
  });
}
