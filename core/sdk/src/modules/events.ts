/**
 * Events Module - Query event stream
 * @module modules/events
 */

import type { HTTPClient } from '../client';
import type {
  Event,
  EventFilters,
  EventStats,
  TimelineOpts,
  TimelineResponse,
} from '../types/agentic';

export class EventsModule {
  constructor(private readonly client: HTTPClient) {}

  /**
   * Query events with filters
   *
   * @example
   * ```typescript
   * const events = await client.events.query({
   *   workspaceId: 'ws_123',
   *   personId: 'per_456',
   *   types: ['email.opened', 'email.clicked'],
   *   dateFrom: new Date('2025-01-01'),
   *   limit: 50
   * });
   * ```
   */
  async query(filters: EventFilters): Promise<Event[]> {
    return this.client.post<Event[]>('/events/query', {
      body: filters,
    });
  }

  /**
   * Get event by ID
   */
  async get(eventId: string): Promise<Event> {
    return this.client.get<Event>(`/events/${eventId}`);
  }

  /**
   * Get person timeline (events + memory)
   *
   * @example
   * ```typescript
   * const timeline = await client.events.timeline('per_123', {
   *   channels: ['email', 'sms'],
   *   dateFrom: new Date('2025-01-01'),
   *   includeMemory: true,
   *   limit: 100
   * });
   *
   * timeline.events.forEach(event => {
   *   console.log(`${event.type} at ${event.ts}`);
   * });
   * ```
   */
  async timeline(personId: string, opts?: TimelineOpts): Promise<TimelineResponse> {
    return this.client.get<TimelineResponse>('/events/timeline', {
      query: personId
        ? {
            personId,
            ...opts,
            dateFrom: opts?.dateFrom?.toISOString(),
            dateTo: opts?.dateTo?.toISOString(),
          }
        : undefined,
    });
  }

  /**
   * Backwards compatible alias (deprecated)
   */
  async getTimeline(personId: string, opts?: TimelineOpts): Promise<TimelineResponse> {
    return this.timeline(personId, opts);
  }

  /**
   * Get event statistics
   */
  async getStats(
    workspaceId: string,
    range: { from: Date; to: Date }
  ): Promise<EventStats> {
    return this.client.get<EventStats>('/events/stats', {
      query: {
        workspaceId,
        from: range.from.toISOString(),
        to: range.to.toISOString(),
      },
    });
  }

  /**
   * Ingest external event
   */
  async ingest(event: Omit<Event, 'id' | 'ts'>): Promise<Event> {
    return this.client.post<Event>('/events', {
      body: event,
    });
  }

  /**
   * Batch ingest events
   */
  async ingestBatch(events: Omit<Event, 'id' | 'ts'>[]): Promise<{
    ingested: number;
    failed: number;
  }> {
    return this.client.post('/events/batch', {
      body: { events },
    });
  }

  /**
   * Stream events (SSE)
   *
   * @example
   * ```typescript
   * const stream = client.events.stream({
   *   workspaceId: 'ws_123',
   *   types: ['email.opened', 'conversion.purchase']
   * });
   *
   * for await (const event of stream) {
   *   console.log('New event:', event);
   * }
   * ```
   */
  stream(_filters: Omit<EventFilters, 'limit' | 'offset'>): AsyncGenerator<Event> {
    // This would use EventSource or similar for SSE
    // Implementation would depend on the client setup
    throw new Error('stream() not yet implemented - requires SSE support');
  }

  /**
   * Get conversion funnel
   */
  async getFunnel(
    workspaceId: string,
    steps: string[],
    opts?: {
      personId?: string;
      dateFrom?: Date;
      dateTo?: Date;
    }
  ): Promise<{
    steps: Array<{
      event: string;
      count: number;
      conversionRate: number;
    }>;
  }> {
    return this.client.post('/events/funnel', {
      body: { workspaceId, steps, ...opts },
    });
  }

  /**
   * Get event attribution
   */
  async getAttribution(
    conversionEventId: string
  ): Promise<{
    conversion: Event;
    touchpoints: Event[];
    model: string;
    weights: Record<string, number>;
  }> {
    return this.client.get(`/events/${conversionEventId}/attribution`);
  }
}
