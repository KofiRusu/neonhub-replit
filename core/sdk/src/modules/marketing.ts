import type { HTTPClient } from '../client';
import type {
  MarketingCampaign,
  MarketingLead,
  MarketingMetrics,
  ListParams,
} from '../types';

/**
 * Marketing operations
 */
export class MarketingModule {
  constructor(private client: HTTPClient) {}

  /**
   * Get marketing metrics
   */
  async getMetrics(params?: { startDate?: string; endDate?: string }): Promise<MarketingMetrics> {
    return this.client.get<MarketingMetrics>('/marketing/metrics', { query: params });
  }

  /**
   * List marketing campaigns
   */
  async listCampaigns(params?: ListParams): Promise<MarketingCampaign[]> {
    return this.client.get<MarketingCampaign[]>('/marketing/campaigns', { query: params });
  }

  /**
   * Get marketing campaign by ID
   */
  async getCampaign(id: string): Promise<MarketingCampaign> {
    return this.client.get<MarketingCampaign>(`/marketing/campaigns/${id}`);
  }

  /**
   * List leads
   */
  async listLeads(params?: ListParams & {
    status?: string;
    source?: string;
    grade?: string;
  }): Promise<MarketingLead[]> {
    return this.client.get<MarketingLead[]>('/marketing/leads', { query: params });
  }

  /**
   * Get lead by ID
   */
  async getLead(id: string): Promise<MarketingLead> {
    return this.client.get<MarketingLead>(`/marketing/leads/${id}`);
  }

  /**
   * Update lead
   */
  async updateLead(id: string, updates: Partial<MarketingLead>): Promise<MarketingLead> {
    return this.client.put<MarketingLead>(`/marketing/leads/${id}`, { body: updates });
  }
}

