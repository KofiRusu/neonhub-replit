/**
 * Person Graph Module - Identity resolution and memory operations
 * @module modules/person
 */

import type { HTTPClient } from '../client';
import type {
  Person,
  Identity,
  Consent,
  Note,
  Topic,
  Memory,
  PartialIdentity,
  PersonResolutionResult,
  ConsentUpdate,
  MemoryOpts,
} from '../types/agentic';

export class PersonModule {
  constructor(private readonly client: HTTPClient) {}

  /**
   * Resolve a person by partial identity (email, phone, handle)
   *
   * @example
   * ```typescript
   * const result = await client.person.resolve({
   *   email: 'user@example.com'
   * });
   * console.log(result.person.id); // per_123abc
   * ```
   */
  async resolve(identity: PartialIdentity): Promise<PersonResolutionResult> {
    return this.client.post<PersonResolutionResult>('/api/person/resolve', {
      body: identity,
    });
  }

  /**
   * Get a person by ID
   */
  async get(personId: string): Promise<Person> {
    return this.client.get<Person>(`/api/person/${personId}`);
  }

  /**
   * List all persons in workspace
   */
  async list(opts?: {
    workspaceId: string;
    limit?: number;
    offset?: number;
  }): Promise<{ persons: Person[]; total: number }> {
    return this.client.get('/api/person', { query: opts });
  }

  /**
   * Get all identities for a person
   */
  async getIdentities(personId: string): Promise<Identity[]> {
    return this.client.get<Identity[]>(`/api/person/${personId}/identities`);
  }

  /**
   * Add a new identity to a person
   */
  async addIdentity(
    personId: string,
    identity: Omit<Identity, 'id' | 'personId' | 'createdAt' | 'updatedAt'>
  ): Promise<Identity> {
    return this.client.post<Identity>(`/api/person/${personId}/identities`, {
      body: identity,
    });
  }

  /**
   * Get personal memory for a person
   *
   * @example
   * ```typescript
   * const memories = await client.person.getMemory('per_123', {
   *   kinds: ['fact', 'intent'],
   *   limit: 10,
   *   query: 'product interest'
   * });
   * ```
   */
  async getMemory(personId: string, opts?: MemoryOpts): Promise<Memory[]> {
    return this.client.get<Memory[]>(`/api/person/${personId}/memory`, {
      query: opts,
    });
  }

  /**
   * Add a memory for a person
   */
  async addMemory(
    personId: string,
    memory: {
      kind: string;
      text: string;
      confidence?: number;
      metadata?: Record<string, any>;
    }
  ): Promise<Memory> {
    return this.client.post<Memory>(`/api/person/${personId}/memory`, {
      body: memory,
    });
  }

  /**
   * Get topics (interests) for a person
   */
  async getTopics(personId: string): Promise<Topic[]> {
    return this.client.get<Topic[]>(`/api/person/${personId}/topics`);
  }

  /**
   * Update topic weight for a person
   */
  async updateTopic(
    personId: string,
    topic: string,
    weight: number
  ): Promise<Topic> {
    return this.client.post<Topic>(`/api/person/${personId}/topics`, {
      body: { topic, weight },
    });
  }

  /**
   * Get consent status for a person
   */
  async getConsent(personId: string, channel?: string): Promise<Consent[]> {
    return this.client.get<Consent[]>(`/api/person/${personId}/consent`, {
      query: channel ? { channel } : undefined,
    });
  }

  /**
   * Update consent for a person
   *
   * @example
   * ```typescript
   * await client.person.updateConsent('per_123', {
   *   channel: 'email',
   *   scope: 'marketing',
   *   status: 'granted',
   *   source: 'form'
   * });
   * ```
   */
  async updateConsent(
    personId: string,
    consent: ConsentUpdate
  ): Promise<Consent> {
    return this.client.post<Consent>(`/api/person/${personId}/consent`, {
      body: consent,
    });
  }

  /**
   * Get notes for a person
   */
  async getNotes(personId: string): Promise<Note[]> {
    return this.client.get<Note[]>(`/api/person/${personId}/notes`);
  }

  /**
   * Add a note for a person
   */
  async addNote(
    personId: string,
    content: string,
    metadata?: Record<string, any>
  ): Promise<Note> {
    return this.client.post<Note>(`/api/person/${personId}/notes`, {
      body: { content, metadata },
    });
  }

  /**
   * Merge two persons (combine their identities and data)
   */
  async merge(sourceId: string, targetId: string): Promise<Person> {
    return this.client.post<Person>('/api/person/merge', {
      body: { sourceId, targetId },
    });
  }

  /**
   * Search persons by name, email, or other fields
   */
  async search(query: {
    workspaceId: string;
    q: string;
    limit?: number;
  }): Promise<{ persons: Person[]; total: number }> {
    return this.client.get('/api/person/search', { query });
  }
}

