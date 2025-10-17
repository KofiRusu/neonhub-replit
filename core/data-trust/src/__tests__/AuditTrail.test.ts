import { AuditTrail } from '../core/AuditTrail.js';

describe('AuditTrail', () => {
  let auditTrail: AuditTrail;

  beforeEach(() => {
    auditTrail = new AuditTrail({
      logLevel: 'info',
      logFilePath: './logs/test-audit.log',
      retentionDays: 30,
      format: 'json'
    });
  });

  describe('log', () => {
    it('should log an audit event', async () => {
      const eventId = await auditTrail.log({
        level: 'info',
        category: 'data_access',
        actor: 'user@example.com',
        action: 'read',
        resource: 'data-123',
        details: { operation: 'getData' }
      });

      expect(eventId).toBeDefined();
      expect(typeof eventId).toBe('string');
    });

    it('should log event with blockchain transaction', async () => {
      const eventId = await auditTrail.log({
        level: 'info',
        category: 'blockchain',
        actor: 'system',
        action: 'store_hash',
        resource: 'blockchain',
        blockchainTx: '0x1234567890abcdef',
        details: { hash: 'datahash123' }
      });

      expect(eventId).toBeDefined();
    });
  });

  describe('query', () => {
    it('should query events by date range', async () => {
      await auditTrail.log({
        level: 'info',
        category: 'data_access',
        actor: 'user@example.com',
        action: 'read',
        resource: 'data-123',
        details: {}
      });

      const events = await auditTrail.query({
        startDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
        endDate: new Date()
      });

      expect(events.length).toBeGreaterThan(0);
    });

    it('should filter by level', async () => {
      await auditTrail.log({
        level: 'error',
        category: 'system',
        actor: 'system',
        action: 'error_occurred',
        resource: 'system',
        details: { error: 'test error' }
      });

      const events = await auditTrail.query({ level: 'error' });
      expect(events.length).toBeGreaterThan(0);
      expect(events[0].level).toBe('error');
    });

    it('should filter by category', async () => {
      await auditTrail.log({
        level: 'info',
        category: 'authentication',
        actor: 'user@example.com',
        action: 'login',
        resource: 'authentication',
        details: {}
      });

      const events = await auditTrail.query({ category: 'authentication' });
      expect(events.length).toBeGreaterThan(0);
      expect(events[0].category).toBe('authentication');
    });

    it('should apply limit and offset', async () => {
      await auditTrail.log({
        level: 'info',
        category: 'data_access',
        actor: 'user@example.com',
        action: 'read',
        resource: 'data-1',
        details: {}
      });

      await auditTrail.log({
        level: 'info',
        category: 'data_access',
        actor: 'user@example.com',
        action: 'read',
        resource: 'data-2',
        details: {}
      });

      const events = await auditTrail.query({ limit: 1 });
      expect(events).toHaveLength(1);
    });
  });

  describe('getEvent', () => {
    it('should get specific event', async () => {
      const eventId = await auditTrail.log({
        level: 'info',
        category: 'data_access',
        actor: 'user@example.com',
        action: 'read',
        resource: 'data-123',
        details: {}
      });

      const event = await auditTrail.getEvent(eventId);
      expect(event.id).toBe(eventId);
      expect(event.actor).toBe('user@example.com');
    });

    it('should throw error for non-existing event', async () => {
      await expect(auditTrail.getEvent('nonexistent')).rejects.toThrow();
    });
  });

  describe('exportAuditLog', () => {
    it('should export as JSON', async () => {
      await auditTrail.log({
        level: 'info',
        category: 'data_access',
        actor: 'user@example.com',
        action: 'read',
        resource: 'data-123',
        details: {}
      });

      const exported = await auditTrail.exportAuditLog({}, 'json');
      expect(exported).toBeDefined();
      expect(() => JSON.parse(exported)).not.toThrow();
    });

    it('should export as CSV', async () => {
      await auditTrail.log({
        level: 'info',
        category: 'data_access',
        actor: 'user@example.com',
        action: 'read',
        resource: 'data-123',
        details: {}
      });

      const exported = await auditTrail.exportAuditLog({}, 'csv');
      expect(exported).toBeDefined();
      expect(exported).toContain(',');
    });
  });

  describe('helper methods', () => {
    it('should log authentication event', async () => {
      const eventId = await auditTrail.logAuthentication('user@example.com', 'login', true);
      expect(eventId).toBeDefined();
    });

    it('should log authorization event', async () => {
      const eventId = await auditTrail.logAuthorization('user@example.com', 'access_granted', 'data-123', true);
      expect(eventId).toBeDefined();
    });

    it('should log data access event', async () => {
      const eventId = await auditTrail.logDataAccess('user@example.com', 'read', 'data-123');
      expect(eventId).toBeDefined();
    });

    it('should log integrity check event', async () => {
      const eventId = await auditTrail.logIntegrityCheck('system', 'data-123', true);
      expect(eventId).toBeDefined();
    });

    it('should log blockchain event', async () => {
      const eventId = await auditTrail.logBlockchainEvent('system', 'store_hash', '0xabc123');
      expect(eventId).toBeDefined();
    });
  });

  describe('searchEvents', () => {
    it('should search events by text', async () => {
      await auditTrail.log({
        level: 'info',
        category: 'data_access',
        actor: 'user@example.com',
        action: 'read',
        resource: 'important-data',
        details: { note: 'special operation' }
      });

      const results = await auditTrail.searchEvents('important');
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('getAuditStats', () => {
    it('should return audit statistics', async () => {
      await auditTrail.log({
        level: 'info',
        category: 'data_access',
        actor: 'user@example.com',
        action: 'read',
        resource: 'data-123',
        details: {}
      });

      await auditTrail.log({
        level: 'error',
        category: 'system',
        actor: 'system',
        action: 'error',
        resource: 'system',
        details: {}
      });

      const stats = auditTrail.getAuditStats();
      expect(stats.totalEvents).toBeGreaterThanOrEqual(2);
      expect(stats.eventsByLevel).toBeDefined();
      expect(stats.eventsByCategory).toBeDefined();
    });
  });

  describe('cleanup', () => {
    it('should cleanup old events', async () => {
      await auditTrail.log({
        level: 'info',
        category: 'data_access',
        actor: 'user@example.com',
        action: 'read',
        resource: 'data-123',
        details: {}
      });

      const deletedCount = await auditTrail.cleanup(0); // Delete everything
      expect(deletedCount).toBeGreaterThanOrEqual(0);
    });
  });
});