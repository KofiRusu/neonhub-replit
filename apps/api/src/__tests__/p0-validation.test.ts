/**
 * P0 Hardening Validation Tests
 * Focused tests to prove P0 objectives are met
 */

import { describe, it, expect } from '@jest/globals';

describe('P0 Hardening - Core Validation', () => {
  describe('Environment Configuration', () => {
    it('should have USE_MOCK_CONNECTORS enabled in test mode', () => {
      expect(process.env.USE_MOCK_CONNECTORS).toBe('true');
    });

    it('should have NODE_ENV set to test', () => {
      expect(process.env.NODE_ENV).toBe('test');
    });

    it('should have DATABASE_URL configured', () => {
      expect(process.env.DATABASE_URL).toBeDefined();
      expect(process.env.DATABASE_URL).toContain('postgresql://');
    });
  });

  describe('Metrics Library', () => {
    it('should export required metric functions', async () => {
      const metricsModule = await import('../lib/metrics.js');
      
      expect(metricsModule.recordAgentRun).toBeDefined();
      expect(metricsModule.recordCircuitBreakerFailure).toBeDefined();
      expect(metricsModule.recordHttpRequest).toBeDefined();
      expect(metricsModule.getMetrics).toBeDefined();
    });

    it('should have agent run metrics registered', async () => {
      const { agentRunsTotal, agentRunDuration } = await import('../lib/metrics.js');
      
      expect(agentRunsTotal).toBeDefined();
      expect(agentRunDuration).toBeDefined();
    });

    it('should generate metrics output', async () => {
      const { getMetrics } = await import('../lib/metrics.js');
      const output = await getMetrics();
      
      expect(output).toContain('# HELP');
      expect(output).toContain('# TYPE');
    });
  });

  describe('Mock Connectors', () => {
    it('should create all 17 mock connectors', async () => {
      const { getMockConnector } = await import('../connectors/mock/index.js');
      
      const connectorTypes = [
        'EMAIL', 'SMS', 'SLACK', 'STRIPE', 'WHATSAPP',
        'INSTAGRAM', 'FACEBOOK', 'LINKEDIN', 'X',
        'GOOGLE_ADS', 'GOOGLE_ANALYTICS', 'GOOGLE_SEARCH_CONSOLE',
        'SHOPIFY', 'DISCORD', 'REDDIT', 'TIKTOK', 'YOUTUBE'
      ] as const;

      connectorTypes.forEach((type) => {
        const connector = getMockConnector(type);
        expect(connector).toBeDefined();
        expect(connector.connectorType).toBe(type);
      });
    });

    it('should use mocks when flag is enabled', async () => {
      const { useMockConnectors } = await import('../connectors/mock/index.js');
      expect(useMockConnectors()).toBe(true);
    });
  });

  describe('Orchestrator Types', () => {
    it('should export orchestration types', async () => {
      const types = await import('../services/orchestration/types.js');
      
      expect(types.AGENT_DEFINITIONS).toBeDefined();
      expect(Object.keys(types.AGENT_DEFINITIONS).length).toBeGreaterThan(5);
    });
  });

  describe('AgentRun Helper', () => {
    it('should export executeAgentRun function', async () => {
      const { executeAgentRun } = await import('../agents/utils/agent-run.js');
      expect(executeAgentRun).toBeDefined();
      expect(typeof executeAgentRun).toBe('function');
    });
  });
});

