import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Email, Response, Analytics } from "@/types/email";

export function useEmails(priority?: string, sentiment?: string) {
  const params = new URLSearchParams();
  if (priority) params.append("priority", priority);
  if (sentiment) params.append("sentiment", sentiment);
  
  const queryString = params.toString();
  const url = `/api/emails${queryString ? `?${queryString}` : ""}`;
  
  return useQuery<Email[]>({
    queryKey: ["/api/emails", priority, sentiment],
    queryFn: async () => {
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch emails");
      return res.json();
    }
  });
}

export function useEmail(id: string) {
  return useQuery<Email>({
    queryKey: ["/api/emails", id],
    enabled: !!id,
  });
}

export function useEmailResponses(emailId: string) {
  return useQuery<Response[]>({
    queryKey: ["/api/emails", emailId, "responses"],
    enabled: !!emailId,
  });
}

export function useGenerateResponse() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (emailId: string) => {
      const res = await apiRequest("POST", `/api/emails/${emailId}/responses`);
      return res.json();
    },
    onSuccess: (_, emailId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/emails", emailId, "responses"] });
    }
  });
}

export function useSendResponse() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (responseId: string) => {
      const res = await apiRequest("POST", `/api/responses/${responseId}/send`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/emails"] });
    }
  });
}

export function useResolveEmail() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (emailId: string) => {
      const res = await apiRequest("POST", `/api/emails/${emailId}/resolve`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/emails"] });
    }
  });
}

export function useSyncEmails() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/sync");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/emails"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics"] });
    }
  });
}

export function useTodayAnalytics() {
  return useQuery<Analytics>({
    queryKey: ["/api/analytics", "today"],
  });
}
