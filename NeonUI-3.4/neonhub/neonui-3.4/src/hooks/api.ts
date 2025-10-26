'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, ApiResponse } from '@/lib/api';

// Types based on the API schema
export interface User {
  id: string;
  email: string;
  name?: string;
  image?: string;
  createdAt: string;
}

export interface Campaign {
  id: string;
  userId: string;
  name: string;
  type: string;
  status: string;
  config: any;
  schedule?: any;
  budget?: any;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignMetrics {
  opens: number;
  clicks: number;
  conversions: number;
  impressions: number;
  engagement: number;
  roi: number;
}

export interface AnalyticsData {
  executiveSummary: any;
  brandVoiceKpis: any;
}

// Auth hooks
export function useCurrentUser() {
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const response = await apiClient.get<User>('/auth/me');
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.post('/auth/logout');
      return response.data;
    },
    onSuccess: () => {
      // Clear all queries on logout
      queryClient.clear();
      // Redirect to login page
      window.location.href = '/auth/login';
    },
  });
}

// Campaign hooks
export function useCampaigns(params?: { status?: string; type?: string }) {
  return useQuery({
    queryKey: ['campaigns', params],
    queryFn: async () => {
      const response = await apiClient.get<Campaign[]>('/campaigns', params);
      return response.data.data;
    },
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function useCampaign(id: string) {
  return useQuery({
    queryKey: ['campaign', id],
    queryFn: async () => {
      const response = await apiClient.get<Campaign>(`/campaigns/${id}`);
      return response.data.data;
    },
    enabled: !!id,
    staleTime: 30 * 1000,
  });
}

export function useCampaignMetrics(id: string) {
  return useQuery({
    queryKey: ['campaign', id, 'metrics'],
    queryFn: async () => {
      const response = await apiClient.get<CampaignMetrics>(`/campaigns/${id}/analytics`);
      return response.data.data;
    },
    enabled: !!id,
    staleTime: 60 * 1000, // 1 minute
  });
}

export function useCreateCampaign() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: {
      name: string;
      type: string;
      config: any;
    }) => {
      const response = await apiClient.post<Campaign>('/campaigns', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });
}

export function useUpdateCampaign(id: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Partial<Campaign>) => {
      const response = await apiClient.put<Campaign>(`/campaigns/${id}`, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign', id] });
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });
}

export function useDeleteCampaign() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.delete(`/campaigns/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });
}

export function useUpdateCampaignStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await apiClient.patch<Campaign>(`/campaigns/${id}/status`, { status });
      return response.data.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['campaign', id] });
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });
}

// Analytics hooks
export function useExecutiveSummary(notes?: string) {
  return useQuery({
    queryKey: ['analytics', 'executive-summary', notes],
    queryFn: async () => {
      const response = await apiClient.post<any>('/analytics/executive-summary', { notes });
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useBrandVoiceKpis() {
  return useQuery({
    queryKey: ['analytics', 'brand-voice-kpis'],
    queryFn: async () => {
      const response = await apiClient.get<any>('/analytics/brand-voice-kpis');
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Settings hooks
export function useUserSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const response = await apiClient.get<any>('/settings');
      return response.data.data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (settings: any) => {
      const response = await apiClient.put('/settings', settings);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
  });
}

// Generic hook for custom queries
export function useApiQuery<T>(
  queryKey: any[],
  url: string,
  params?: any,
  options?: any
) {
  return useQuery({
    queryKey,
    queryFn: async () => {
      const response = await apiClient.get<T>(url, params);
      return response.data.data;
    },
    ...options,
  });
}

// Generic hook for custom mutations
export function useApiMutation<T, V = any>(
  url: string,
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'POST',
  invalidateQueries?: any[]
) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (variables?: V) => {
      let response;
      switch (method) {
        case 'POST':
          response = await apiClient.post<T>(url, variables);
          break;
        case 'PUT':
          response = await apiClient.put<T>(url, variables);
          break;
        case 'PATCH':
          response = await apiClient.patch<T>(url, variables);
          break;
        case 'DELETE':
          response = await apiClient.delete<T>(url);
          break;
        default:
          throw new Error(`Unsupported method: ${method}`);
      }
      return response.data.data;
    },
    onSuccess: () => {
      if (invalidateQueries) {
        invalidateQueries.forEach(queryKey => {
          queryClient.invalidateQueries({ queryKey });
        });
      }
    },
  });
}