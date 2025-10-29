import type { HTTPClient } from '../client';
import type { Campaign, CampaignMetric, CampaignCreateInput, ListParams } from '../types';

/**
 * Campaign operations
 */
export class CampaignsModule {
  constructor(private client: HTTPClient) {}

  /**
   * Create a new campaign
   */
  async create(input: CampaignCreateInput): Promise<Campaign> {
    return this.client.post<Campaign>('/campaign', { body: input });
  }

  /**
   * List campaigns
   */
  async list(params?: ListParams): Promise<Campaign[]> {
    return this.client.get<Campaign[]>('/campaign', { query: params });
  }

  /**
   * Get campaign by ID
   */
  async get(id: string): Promise<Campaign> {
    return this.client.get<Campaign>(`/campaign/${id}`);
  }

  /**
   * Update campaign
   */
  async update(id: string, updates: Partial<Campaign>): Promise<Campaign> {
    return this.client.put<Campaign>(`/campaign/${id}`, { body: updates });
  }

  /**
   * Delete campaign
   */
  async delete(id: string): Promise<void> {
    return this.client.delete<void>(`/campaign/${id}`);
  }

  /**
   * Get campaign metrics
   */
  async getMetrics(campaignId: string): Promise<CampaignMetric[]> {
    return this.client.get<CampaignMetric[]>(`/campaign/${campaignId}/metrics`);
  }

  /**
   * Start campaign
   */
  async start(campaignId: string): Promise<Campaign> {
    return this.client.post<Campaign>(`/campaign/${campaignId}/start`);
  }

  /**
   * Pause campaign
   */
  async pause(campaignId: string): Promise<Campaign> {
    return this.client.post<Campaign>(`/campaign/${campaignId}/pause`);
  }

  /**
   * Stop campaign
   */
  async stop(campaignId: string): Promise<Campaign> {
    return this.client.post<Campaign>(`/campaign/${campaignId}/stop`);
  }
}

