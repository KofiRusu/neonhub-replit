export type CampaignType = 'email' | 'social' | 'multi-channel';
export type CampaignStatus = 'draft' | 'scheduled' | 'active' | 'paused' | 'completed';
export type SocialPlatform = 'twitter' | 'linkedin' | 'facebook' | 'instagram';

export interface CampaignConfig {
  channels: string[];
  targeting?: {
    audience?: string;
    tags?: string[];
  };
  budget?: {
    total: number;
    currency: string;
  };
}

export interface CampaignSchedule {
  startDate: Date;
  endDate?: Date;
  timezone?: string;
}

export interface EmailSequenceMetrics {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  converted: number;
  bounced: number;
  unsubscribed?: number;
  openRate?: number;
  clickRate?: number;
  conversionRate?: number;
}

export interface SocialPostMetrics {
  impressions: number;
  likes: number;
  shares: number;
  comments: number;
  clicks: number;
  reach?: number;
  engagementRate?: number;
}

export interface ABTestVariant {
  id: string;
  name: string;
  subject?: string;
  body?: string;
  weight?: number;
}

export interface ABTestMetrics {
  variants: Array<{
    variantId: string;
    sent: number;
    opened: number;
    clicked: number;
    converted: number;
    openRate: number;
    clickRate: number;
    conversionRate: number;
  }>;
  winner?: string;
  confidence?: number;
}

export interface Campaign {
  id: string;
  userId: string;
  name: string;
  type: CampaignType;
  status: CampaignStatus;
  config: CampaignConfig;
  schedule?: CampaignSchedule;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailSequence {
  id: string;
  campaignId: string;
  subject: string;
  body: string;
  variant?: string;
  scheduledFor?: Date;
  sentAt?: Date;
  metrics?: EmailSequenceMetrics;
  createdAt: Date;
}

export interface SocialPost {
  id: string;
  campaignId: string;
  platform: SocialPlatform;
  content: string;
  mediaUrls?: string[];
  variant?: string;
  scheduledFor?: Date;
  publishedAt?: Date;
  externalId?: string;
  metrics?: SocialPostMetrics;
  createdAt: Date;
}

export interface ABTest {
  id: string;
  campaignId: string;
  name: string;
  variants: ABTestVariant[];
  winner?: string;
  metrics: ABTestMetrics;
  startedAt: Date;
  completedAt?: Date;
}