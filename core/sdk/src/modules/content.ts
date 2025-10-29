import type { HTTPClient } from '../client';
import type { Content, ContentDraft, ContentGenerateInput, ListParams } from '../types';

/**
 * Content operations
 */
export class ContentModule {
  constructor(private client: HTTPClient) {}

  /**
   * Generate new content
   */
  async generate(input: ContentGenerateInput): Promise<ContentDraft> {
    return this.client.post<ContentDraft>('/content/generate', { body: input });
  }

  /**
   * List content drafts
   */
  async listDrafts(params?: ListParams): Promise<ContentDraft[]> {
    return this.client.get<ContentDraft[]>('/content/drafts', { query: params });
  }

  /**
   * Get content draft by ID
   */
  async getDraft(id: string): Promise<ContentDraft> {
    return this.client.get<ContentDraft>(`/content/drafts/${id}`);
  }

  /**
   * Update content draft
   */
  async updateDraft(id: string, updates: Partial<ContentDraft>): Promise<ContentDraft> {
    return this.client.put<ContentDraft>(`/content/drafts/${id}`, { body: updates });
  }

  /**
   * Delete content draft
   */
  async deleteDraft(id: string): Promise<void> {
    return this.client.delete<void>(`/content/drafts/${id}`);
  }

  /**
   * List published content
   */
  async list(params?: ListParams): Promise<Content[]> {
    return this.client.get<Content[]>('/content', { query: params });
  }

  /**
   * Get content by ID
   */
  async get(id: string): Promise<Content> {
    return this.client.get<Content>(`/content/${id}`);
  }

  /**
   * Publish content draft
   */
  async publish(draftId: string): Promise<Content> {
    return this.client.post<Content>(`/content/drafts/${draftId}/publish`);
  }
}

