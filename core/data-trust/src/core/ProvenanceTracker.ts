import { v4 as uuidv4 } from 'uuid';
import {
  ProvenanceEvent,
  DataProvenance,
  ProvenanceTrackerInterface,
  ProvenanceError,
  ProvenanceEventType
} from '../types/index.js';

export class ProvenanceTracker implements ProvenanceTrackerInterface {
  private provenanceStore: Map<string, DataProvenance> = new Map();
  private eventStore: Map<string, ProvenanceEvent[]> = new Map();

  /**
   * Record a new provenance event
   */
  async recordEvent(event: Omit<ProvenanceEvent, 'id'>): Promise<string> {
    try {
      const eventId = uuidv4();
      const fullEvent: ProvenanceEvent = {
        id: eventId,
        ...event
      };

      // Store event
      if (!this.eventStore.has(event.dataId)) {
        this.eventStore.set(event.dataId, []);
      }
      this.eventStore.get(event.dataId)!.push(fullEvent);

      // Update or create provenance record
      await this.updateProvenanceRecord(event.dataId, fullEvent);

      return eventId;
    } catch (error) {
      throw new ProvenanceError(
        'Failed to record provenance event',
        { originalError: error, event }
      );
    }
  }

  /**
   * Get complete provenance for a data item
   */
  async getProvenance(dataId: string): Promise<DataProvenance> {
    const provenance = this.provenanceStore.get(dataId);
    if (!provenance) {
      throw new ProvenanceError(`Provenance not found for data ID: ${dataId}`);
    }
    return { ...provenance };
  }

  /**
   * Get event history for a data item
   */
  async getEventHistory(dataId: string, limit?: number): Promise<ProvenanceEvent[]> {
    const events = this.eventStore.get(dataId) || [];
    const sortedEvents = events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    if (limit && limit > 0) {
      return sortedEvents.slice(0, limit);
    }

    return sortedEvents;
  }

  /**
   * Update data hash and record change event
   */
  async updateDataHash(dataId: string, newHash: string, actor: string): Promise<void> {
    try {
      const currentProvenance = this.provenanceStore.get(dataId);
      if (!currentProvenance) {
        throw new ProvenanceError(`Data provenance not found: ${dataId}`);
      }

      await this.recordEvent({
        dataId,
        eventType: 'MODIFIED',
        actor,
        timestamp: new Date(),
        previousHash: currentProvenance.currentHash,
        currentHash: newHash,
        metadata: {
          changeType: 'hash_update',
          previousHash: currentProvenance.currentHash
        }
      });
    } catch (error) {
      throw new ProvenanceError(
        'Failed to update data hash',
        { originalError: error, dataId, newHash, actor }
      );
    }
  }

  /**
   * Transfer ownership of data
   */
  async transferOwnership(dataId: string, newOwner: string, actor: string): Promise<void> {
    try {
      const currentProvenance = this.provenanceStore.get(dataId);
      if (!currentProvenance) {
        throw new ProvenanceError(`Data provenance not found: ${dataId}`);
      }

      if (currentProvenance.owner !== actor) {
        throw new ProvenanceError(`Only current owner can transfer ownership: ${actor}`);
      }

      await this.recordEvent({
        dataId,
        eventType: 'TRANSFERRED',
        actor,
        timestamp: new Date(),
        previousHash: currentProvenance.currentHash,
        currentHash: currentProvenance.currentHash, // Hash doesn't change on transfer
        metadata: {
          transferType: 'ownership',
          previousOwner: currentProvenance.owner,
          newOwner
        }
      });
    } catch (error) {
      throw new ProvenanceError(
        'Failed to transfer ownership',
        { originalError: error, dataId, newOwner, actor }
      );
    }
  }

  /**
   * Record data access event
   */
  async recordAccess(dataId: string, actor: string, accessType: string = 'read'): Promise<void> {
    try {
      const currentProvenance = this.provenanceStore.get(dataId);
      if (!currentProvenance) {
        throw new ProvenanceError(`Data provenance not found: ${dataId}`);
      }

      await this.recordEvent({
        dataId,
        eventType: 'ACCESSED',
        actor,
        timestamp: new Date(),
        previousHash: currentProvenance.currentHash,
        currentHash: currentProvenance.currentHash, // Hash doesn't change on access
        metadata: {
          accessType,
          accessLocation: 'system'
        }
      });
    } catch (error) {
      throw new ProvenanceError(
        'Failed to record access event',
        { originalError: error, dataId, actor, accessType }
      );
    }
  }

  /**
   * Record data validation event
   */
  async recordValidation(
    dataId: string,
    actor: string,
    validationResult: boolean,
    details?: Record<string, unknown>
  ): Promise<void> {
    try {
      const currentProvenance = this.provenanceStore.get(dataId);
      if (!currentProvenance) {
        throw new ProvenanceError(`Data provenance not found: ${dataId}`);
      }

      await this.recordEvent({
        dataId,
        eventType: 'VALIDATED',
        actor,
        timestamp: new Date(),
        previousHash: currentProvenance.currentHash,
        currentHash: currentProvenance.currentHash, // Hash doesn't change on validation
        metadata: {
          validationResult,
          validationType: 'integrity_check',
          ...details
        }
      });
    } catch (error) {
      throw new ProvenanceError(
        'Failed to record validation event',
        { originalError: error, dataId, actor, validationResult }
      );
    }
  }

  /**
   * Get lineage path for data
   */
  async getLineage(dataId: string): Promise<ProvenanceEvent[]> {
    const events = await this.getEventHistory(dataId);
    return events.filter(event =>
      event.eventType === 'CREATED' ||
      event.eventType === 'MODIFIED' ||
      event.eventType === 'TRANSFERRED'
    );
  }

  /**
   * Check if data has been tampered with
   */
  async verifyIntegrity(dataId: string, currentHash: string): Promise<boolean> {
    try {
      const provenance = await this.getProvenance(dataId);
      return provenance.currentHash === currentHash;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get all data IDs owned by an actor
   */
  getDataByOwner(owner: string): string[] {
    const ownedData: string[] = [];
    for (const [dataId, provenance] of this.provenanceStore) {
      if (provenance.owner === owner) {
        ownedData.push(dataId);
      }
    }
    return ownedData;
  }

  /**
   * Get all data IDs accessed by an actor
   */
  async getDataAccessedBy(actor: string): Promise<string[]> {
    const accessedData: Set<string> = new Set();

    for (const [dataId, events] of this.eventStore) {
      const hasAccess = events.some(event =>
        event.actor === actor && event.eventType === 'ACCESSED'
      );
      if (hasAccess) {
        accessedData.add(dataId);
      }
    }

    return Array.from(accessedData);
  }

  /**
   * Export provenance data
   */
  async exportProvenance(dataId: string, format: 'json' | 'csv' = 'json'): Promise<string> {
    const provenance = await this.getProvenance(dataId);
    const events = await this.getEventHistory(dataId);

    if (format === 'csv') {
      const headers = ['id', 'eventType', 'actor', 'timestamp', 'currentHash', 'metadata'];
      const rows = events.map(event => [
        event.id,
        event.eventType,
        event.actor,
        event.timestamp.toISOString(),
        event.currentHash,
        JSON.stringify(event.metadata)
      ]);

      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }

    return JSON.stringify({
      provenance,
      events
    }, null, 2);
  }

  /**
   * Update provenance record based on event
   */
  private async updateProvenanceRecord(dataId: string, event: ProvenanceEvent): Promise<void> {
    let provenance = this.provenanceStore.get(dataId);

    if (!provenance) {
      // Create new provenance record
      provenance = {
        dataId,
        originalHash: event.currentHash,
        currentHash: event.currentHash,
        createdAt: event.timestamp,
        lastModified: event.timestamp,
        owner: event.actor,
        lineage: [event],
        blockchainRecords: [],
        metadata: event.metadata
      };
    } else {
      // Update existing record
      provenance.currentHash = event.currentHash;
      provenance.lastModified = event.timestamp;
      provenance.lineage.push(event);

      // Update owner if this is a transfer event
      if (event.eventType === 'TRANSFERRED' && event.metadata.newOwner) {
        provenance.owner = String(event.metadata.newOwner);
      }

      // Update metadata
      provenance.metadata = { ...provenance.metadata, ...event.metadata };
    }

    this.provenanceStore.set(dataId, provenance);
  }

  /**
   * Clean up old provenance data
   */
  async cleanup(retentionDays: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    let deletedCount = 0;

    for (const [dataId, events] of this.eventStore) {
      const filteredEvents = events.filter(event => event.timestamp >= cutoffDate);
      if (filteredEvents.length === 0) {
        this.eventStore.delete(dataId);
        this.provenanceStore.delete(dataId);
        deletedCount++;
      } else {
        this.eventStore.set(dataId, filteredEvents);
      }
    }

    return deletedCount;
  }
}
