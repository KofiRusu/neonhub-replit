import { ProvenanceTracker } from '../core/ProvenanceTracker.js';

describe('ProvenanceTracker', () => {
  let tracker: ProvenanceTracker;

  beforeEach(() => {
    tracker = new ProvenanceTracker();
  });

  describe('recordEvent', () => {
    it('should record a provenance event', async () => {
      const eventId = await tracker.recordEvent({
        dataId: 'test-data-1',
        eventType: 'CREATED',
        actor: 'user@example.com',
        timestamp: new Date(),
        currentHash: 'hash123',
        metadata: { source: 'upload' }
      });

      expect(eventId).toBeDefined();
      expect(typeof eventId).toBe('string');
    });
  });

  describe('getProvenance', () => {
    it('should get provenance for existing data', async () => {
      await tracker.recordEvent({
        dataId: 'test-data-1',
        eventType: 'CREATED',
        actor: 'user@example.com',
        timestamp: new Date(),
        currentHash: 'hash123',
        metadata: { source: 'upload' }
      });

      const provenance = await tracker.getProvenance('test-data-1');
      expect(provenance).toBeDefined();
      expect(provenance.dataId).toBe('test-data-1');
      expect(provenance.owner).toBe('user@example.com');
      expect(provenance.lineage).toHaveLength(1);
    });

    it('should throw error for non-existing data', async () => {
      await expect(tracker.getProvenance('nonexistent')).rejects.toThrow();
    });
  });

  describe('getEventHistory', () => {
    it('should get event history', async () => {
      await tracker.recordEvent({
        dataId: 'test-data-1',
        eventType: 'CREATED',
        actor: 'user@example.com',
        timestamp: new Date(),
        currentHash: 'hash123',
        metadata: {}
      });

      await tracker.recordEvent({
        dataId: 'test-data-1',
        eventType: 'MODIFIED',
        actor: 'user@example.com',
        timestamp: new Date(),
        previousHash: 'hash123',
        currentHash: 'hash456',
        metadata: {}
      });

      const history = await tracker.getEventHistory('test-data-1');
      expect(history).toHaveLength(2);
      expect(history[0].eventType).toBe('MODIFIED');
      expect(history[1].eventType).toBe('CREATED');
    });

    it('should limit results when specified', async () => {
      await tracker.recordEvent({
        dataId: 'test-data-1',
        eventType: 'CREATED',
        actor: 'user@example.com',
        timestamp: new Date(),
        currentHash: 'hash123',
        metadata: {}
      });

      await tracker.recordEvent({
        dataId: 'test-data-1',
        eventType: 'MODIFIED',
        actor: 'user@example.com',
        timestamp: new Date(),
        previousHash: 'hash123',
        currentHash: 'hash456',
        metadata: {}
      });

      const history = await tracker.getEventHistory('test-data-1', 1);
      expect(history).toHaveLength(1);
    });
  });

  describe('updateDataHash', () => {
    it('should update data hash', async () => {
      await tracker.recordEvent({
        dataId: 'test-data-1',
        eventType: 'CREATED',
        actor: 'user@example.com',
        timestamp: new Date(),
        currentHash: 'hash123',
        metadata: {}
      });

      await tracker.updateDataHash('test-data-1', 'newhash456', 'user@example.com');

      const provenance = await tracker.getProvenance('test-data-1');
      expect(provenance.currentHash).toBe('newhash456');
    });
  });

  describe('transferOwnership', () => {
    it('should transfer ownership', async () => {
      await tracker.recordEvent({
        dataId: 'test-data-1',
        eventType: 'CREATED',
        actor: 'user@example.com',
        timestamp: new Date(),
        currentHash: 'hash123',
        metadata: {}
      });

      await tracker.transferOwnership('test-data-1', 'newowner@example.com', 'user@example.com');

      const provenance = await tracker.getProvenance('test-data-1');
      expect(provenance.owner).toBe('newowner@example.com');
    });

    it('should reject transfer from non-owner', async () => {
      await tracker.recordEvent({
        dataId: 'test-data-1',
        eventType: 'CREATED',
        actor: 'user@example.com',
        timestamp: new Date(),
        currentHash: 'hash123',
        metadata: {}
      });

      await expect(
        tracker.transferOwnership('test-data-1', 'newowner@example.com', 'wronguser@example.com')
      ).rejects.toThrow();
    });
  });

  describe('verifyIntegrity', () => {
    it('should verify data integrity', async () => {
      await tracker.recordEvent({
        dataId: 'test-data-1',
        eventType: 'CREATED',
        actor: 'user@example.com',
        timestamp: new Date(),
        currentHash: 'hash123',
        metadata: {}
      });

      const isValid = await tracker.verifyIntegrity('test-data-1', 'hash123');
      expect(isValid).toBe(true);

      const isInvalid = await tracker.verifyIntegrity('test-data-1', 'wronghash');
      expect(isInvalid).toBe(false);
    });
  });

  describe('getDataByOwner', () => {
    it('should get data by owner', async () => {
      await tracker.recordEvent({
        dataId: 'test-data-1',
        eventType: 'CREATED',
        actor: 'user@example.com',
        timestamp: new Date(),
        currentHash: 'hash123',
        metadata: {}
      });

      await tracker.recordEvent({
        dataId: 'test-data-2',
        eventType: 'CREATED',
        actor: 'user@example.com',
        timestamp: new Date(),
        currentHash: 'hash456',
        metadata: {}
      });

      const ownedData = tracker.getDataByOwner('user@example.com');
      expect(ownedData).toContain('test-data-1');
      expect(ownedData).toContain('test-data-2');
    });
  });
});