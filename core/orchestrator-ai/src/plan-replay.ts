import { v4 as uuidv4 } from 'uuid';
import pino from 'pino';
import { PlanReplayEntry } from './types.js';

const logger = pino({ name: 'plan-replay' });

/**
 * Records and replays plan execution for debugging and analysis
 */
export class PlanReplay {
  private entries: Map<string, PlanReplayEntry[]> = new Map();

  /**
   * Record an event
   */
  async record(
    planId: string,
    event: PlanReplayEntry['event'],
    data: unknown
  ): Promise<void> {
    const entry: PlanReplayEntry = {
      id: `entry_${uuidv4()}`,
      planId,
      timestamp: new Date().toISOString(),
      event,
      data,
    };

    if (!this.entries.has(planId)) {
      this.entries.set(planId, []);
    }

    this.entries.get(planId)!.push(entry);

    logger.info({ planId, event }, 'Event recorded');
  }

  /**
   * Get all entries for a plan
   */
  getEntries(planId: string): PlanReplayEntry[] {
    return this.entries.get(planId) || [];
  }

  /**
   * Get entries by event type
   */
  getEntriesByEvent(
    planId: string,
    event: PlanReplayEntry['event']
  ): PlanReplayEntry[] {
    const entries = this.entries.get(planId) || [];
    return entries.filter((e) => e.event === event);
  }

  /**
   * Get timeline for a plan
   */
  getTimeline(planId: string): Array<{
    timestamp: string;
    event: string;
    duration?: number;
  }> {
    const entries = this.getEntries(planId);
    const timeline: Array<{ timestamp: string; event: string; duration?: number }> = [];

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const nextEntry = entries[i + 1];

      let duration: number | undefined;
      if (nextEntry) {
        const current = new Date(entry.timestamp).getTime();
        const next = new Date(nextEntry.timestamp).getTime();
        duration = next - current;
      }

      timeline.push({
        timestamp: entry.timestamp,
        event: entry.event,
        duration,
      });
    }

    return timeline;
  }

  /**
   * Replay execution for debugging
   */
  async replay(
    planId: string,
    onEvent?: (entry: PlanReplayEntry) => void | Promise<void>
  ): Promise<void> {
    logger.info({ planId }, 'Replaying plan execution');

    const entries = this.getEntries(planId);

    for (const entry of entries) {
      logger.info({ event: entry.event, timestamp: entry.timestamp }, 'Replay event');

      if (onEvent) {
        await onEvent(entry);
      }

      // Small delay for visualization
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    logger.info({ planId, events: entries.length }, 'Replay completed');
  }

  /**
   * Get execution statistics
   */
  getStats(planId: string): {
    totalEvents: number;
    totalDuration: number;
    eventCounts: Record<string, number>;
    averageStepDuration: number;
  } {
    const entries = this.getEntries(planId);

    if (entries.length === 0) {
      return {
        totalEvents: 0,
        totalDuration: 0,
        eventCounts: {},
        averageStepDuration: 0,
      };
    }

    const eventCounts: Record<string, number> = {};
    for (const entry of entries) {
      eventCounts[entry.event] = (eventCounts[entry.event] || 0) + 1;
    }

    const startTime = new Date(entries[0].timestamp).getTime();
    const endTime = new Date(entries[entries.length - 1].timestamp).getTime();
    const totalDuration = endTime - startTime;

    // Calculate average step duration
    const stepCompletedEvents = entries.filter((e) => e.event === 'step_completed');
    const stepStartedEvents = entries.filter((e) => e.event === 'step_started');
    
    let totalStepDuration = 0;
    let stepCount = 0;

    for (const completed of stepCompletedEvents) {
      const started = stepStartedEvents.find(
        (s) => (s.data as any)?.step?.id === (completed.data as any)?.stepId
      );
      
      if (started) {
        const duration =
          new Date(completed.timestamp).getTime() - new Date(started.timestamp).getTime();
        totalStepDuration += duration;
        stepCount++;
      }
    }

    const averageStepDuration = stepCount > 0 ? totalStepDuration / stepCount : 0;

    return {
      totalEvents: entries.length,
      totalDuration,
      eventCounts,
      averageStepDuration,
    };
  }

  /**
   * Export entries as JSON
   */
  export(planId: string): string {
    const entries = this.getEntries(planId);
    return JSON.stringify(entries, null, 2);
  }

  /**
   * Import entries from JSON
   */
  import(planId: string, json: string): void {
    const entries = JSON.parse(json) as PlanReplayEntry[];
    this.entries.set(planId, entries);
    logger.info({ planId, count: entries.length }, 'Entries imported');
  }

  /**
   * Clear entries for a plan
   */
  clear(planId: string): void {
    this.entries.delete(planId);
    logger.info({ planId }, 'Entries cleared');
  }

  /**
   * Clear all entries
   */
  clearAll(): void {
    this.entries.clear();
    logger.info('All entries cleared');
  }

  /**
   * Get plans with entries
   */
  getPlans(): string[] {
    return Array.from(this.entries.keys());
  }
}

