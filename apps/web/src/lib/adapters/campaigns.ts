import { http } from "../api";

export interface CampaignConfig {
  channels?: string[];
  targeting?: {
    audience?: string;
    tags?: string[];
  };
  budget?: {
    total?: number;
    currency?: string;
  };
}

export interface Campaign {
  id: string;
  userId: string;
  name: string;
  type: 'email' | 'social' | 'multi-channel';
  status: 'draft' | 'scheduled' | 'active' | 'paused' | 'completed';
  config: CampaignConfig;
  schedule?: {
    startDate: string;
    endDate?: string;
  };
  createdAt: string;
  updatedAt: string;
  _count?: {
    emailSequences: number;
    socialPosts: number;
    abTests: number;
  };
}

export interface CampaignMetrics {
  campaign: {
    id: string;
    name: string;
    type: string;
    status: string;
    createdAt: string;
  };
  email: {
    sent: number;
    opened: number;
    clicked: number;
    converted: number;
    openRate: number;
    clickRate: number;
    conversionRate: number;
  };
  social: {
    totalPosts: number;
    totalPublished: number;
    byPlatform: Array<{
      platform: string;
      posts: number;
      published: number;
      totalImpressions: number;
      totalLikes: number;
      totalShares: number;
      totalComments: number;
      totalClicks: number;
    }>;
  };
  abTests: Array<{
    id: string;
    name: string;
    winner?: string;
    metrics: Record<string, unknown>;
  }>;
}

export interface ScheduledEmail {
  id: string;
  day: number;
  scheduledFor: string;
}

export interface ScheduledPost {
  id: string;
  platform: string;
  scheduledFor: string;
}

export interface ScheduleCampaignResult {
  jobId: string;
  scheduled: {
    emails: ScheduledEmail[];
    posts: ScheduledPost[];
  };
}

export async function getCampaigns(filters?: {
  status?: string;
  type?: string;
}): Promise<{ success: boolean; data: Campaign[]; meta: { total: number } }> {
  const params = new URLSearchParams();
  if (filters?.status) params.append('status', filters.status);
  if (filters?.type) params.append('type', filters.type);
  
  const queryString = params.toString();
  const path = queryString ? `campaigns?${queryString}` : 'campaigns';
  
  return http<{ success: boolean; data: Campaign[]; meta: { total: number } }>(path);
}

export async function getCampaign(id: string): Promise<{ success: boolean; data: Campaign }> {
  return http<{ success: boolean; data: Campaign }>(`campaigns/${id}`);
}

export async function createCampaign(data: {
  name: string;
  type: 'email' | 'social' | 'multi-channel';
  config: CampaignConfig;
}): Promise<{ success: boolean; data: { jobId: string; campaignId: string } }> {
  return http<{ success: boolean; data: { jobId: string; campaignId: string } }>('campaigns', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateCampaign(id: string, data: {
  name?: string;
  status?: string;
  config?: CampaignConfig;
}): Promise<{ success: boolean; data: Campaign }> {
  return http<{ success: boolean; data: Campaign }>(`campaigns/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteCampaign(id: string): Promise<{ success: boolean; message: string }> {
  return http<{ success: boolean; message: string }>(`campaigns/${id}`, {
    method: 'DELETE',
  });
}

export async function scheduleCampaign(id: string, schedule: {
  startDate: string;
  endDate?: string;
  emailSequence?: Array<{
    day: number;
    subject: string;
    body: string;
  }>;
  socialPosts?: Array<{
    platform: string;
    content: string;
    scheduledFor: string;
  }>;
}): Promise<{ success: boolean; data: ScheduleCampaignResult }> {
  return http<{ success: boolean; data: ScheduleCampaignResult }>(`campaigns/${id}/schedule`, {
    method: 'POST',
    body: JSON.stringify(schedule),
  });
}

export async function getCampaignAnalytics(id: string): Promise<{ success: boolean; data: CampaignMetrics }> {
  return http<{ success: boolean; data: CampaignMetrics }>(`campaigns/${id}/analytics`);
}

export async function runABTest(id: string, variants: Array<{
  subject: string;
  body: string;
}>): Promise<{ success: boolean; data: { jobId: string; testId: string } }> {
  return http<{ success: boolean; data: { jobId: string; testId: string } }>(`campaigns/${id}/ab-test`, {
    method: 'POST',
    body: JSON.stringify({ variants }),
  });
}

export async function optimizeCampaign(id: string, optimizationGoals: string[]): Promise<{
  success: boolean;
  data: { jobId: string; recommendations: string[] };
}> {
  return http<{ success: boolean; data: { jobId: string; recommendations: string[] } }>(
    `campaigns/${id}/optimize`,
    {
      method: 'POST',
      body: JSON.stringify({ optimizationGoals }),
    }
  );
}

export async function updateCampaignStatus(id: string, status: string): Promise<{
  success: boolean;
  data: Campaign;
}> {
  return http<{ success: boolean; data: Campaign }>(`campaigns/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}
