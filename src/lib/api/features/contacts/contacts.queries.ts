import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { contactsApi } from "./contacts.api";
import { CreateContactInput } from "./contacts.types";

export const contactKeys = {
  all: ["contacts"] as const,
  lists: () => [...contactKeys.all, "list"] as const,
  details: () => [...contactKeys.all, "detail"] as const,
  detail: (id: string) => [...contactKeys.details(), id] as const,
};

export function useContacts() {
  return useQuery({
    queryKey: contactKeys.lists(),
    queryFn: async () => {
      const res = await contactsApi.list();
      return res.data;
    },
    staleTime: 60 * 1000,
  });
}

export function useContactDetail(contactId: string) {
  return useQuery({
    queryKey: contactKeys.detail(contactId),
    queryFn: async () => {
      const res = await contactsApi.detail(contactId);
      return res.data;
    },
    enabled: !!contactId,
  });
}

export function useCreateContact() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateContactInput) => contactsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contactKeys.lists() });
    },
  });
}

export function useUpdateContact() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ contactId, data }: { contactId: string; data: CreateContactInput }) => 
      contactsApi.update(contactId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: contactKeys.lists() });
      queryClient.invalidateQueries({ queryKey: contactKeys.detail(variables.contactId) });
    },
  });
}

export function useDeleteContact() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (contactId: string) => contactsApi.remove(contactId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contactKeys.lists() });
    },
  });
}
