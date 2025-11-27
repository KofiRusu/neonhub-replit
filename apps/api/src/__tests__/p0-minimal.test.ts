/**
 * P0 Hardening - Minimal Validation (No Heavy Imports)
 * Tests that validate P0 deliverables exist without loading app code
 */

import { describe, it, expect } from '@jest/globals';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const ROOT = join(__dirname, '../..');

describe('P0 Hardening - File Existence', () => {
  describe('Mock Connectors', () => {
    it('should have MockConnector.ts file', () => {
      const path = join(ROOT, 'src/connectors/mock/MockConnector.ts');
      expect(existsSync(path)).toBe(true);
    });

    it('should have mock connector index', () => {
      const path = join(ROOT, 'src/connectors/mock/index.ts');
      expect(existsSync(path)).toBe(true);
      
      const content = readFileSync(path, 'utf-8');
      expect(content).toContain('getMockConnector');
      expect(content).toContain('useMockConnectors');
      expect(content).toContain('USE_MOCK_CONNECTORS');
    });

    it('should export all 17 connector types', () => {
      const path = join(ROOT, 'src/connectors/mock/MockConnector.ts');
      const content = readFileSync(path, 'utf-8');
      
      const requiredConnectors = [
        'MockEmailConnector',
        'MockSMSConnector',
        'MockSlackConnector',
        'MockStripeConnector',
        'MockWhatsAppConnector',
        'MockInstagramConnector',
        'MockFacebookConnector',
        'MockLinkedInConnector',
        'MockXConnector',
        'MockGoogleAdsConnector',
        'MockGA4Connector',
        'MockGSCConnector',
        'MockShopifyConnector',
        'MockDiscordConnector',
        'MockRedditConnector',
        'MockTikTokConnector',
        'MockYouTubeConnector',
      ];

      requiredConnectors.forEach((connector) => {
        expect(content).toContain(`class ${connector}`);
      });
    });
  });

  describe('Test Infrastructure', () => {
    it('should have test setup file', () => {
      const path = join(ROOT, 'src/__tests__/setup.ts');
      expect(existsSync(path)).toBe(true);
    });

    it('should have Prisma mock', () => {
      const path = join(ROOT, 'src/__mocks__/prisma.ts');
      expect(existsSync(path)).toBe(true);
      
      const content = readFileSync(path, 'utf-8');
      expect(content).toContain('mockPrismaClient');
      expect(content).toContain('resetMockData');
    });

    it('should have jest setup file', () => {
      const path = join(ROOT, 'jest.setup.ts');
      expect(existsSync(path)).toBe(true);
      
      const content = readFileSync(path, 'utf-8');
      expect(content).toContain('USE_MOCK_CONNECTORS');
    });

    it('should have P0 jest config', () => {
      const path = join(ROOT, 'jest.config.p0.js');
      expect(existsSync(path)).toBe(true);
    });
  });

  describe('Metrics Library', () => {
    it('should have metrics.ts file', () => {
      const path = join(ROOT, 'src/lib/metrics.ts');
      expect(existsSync(path)).toBe(true);
      
      const content = readFileSync(path, 'utf-8');
      expect(content).toContain('agentRunsTotal');
      expect(content).toContain('agentRunDuration');
      expect(content).toContain('circuitBreakerFailures');
      expect(content).toContain('recordHttpRequest');
    });

    it('should have /metrics endpoint in server', () => {
      const path = join(ROOT, 'src/server.ts');
      const content = readFileSync(path, 'utf-8');
      
      expect(content).toContain('app.get("/metrics"');
      expect(content).toContain('getMetrics');
    });
  });

  describe('AgentRun Persistence', () => {
    it('should have executeAgentRun helper', () => {
      const path = join(ROOT, 'src/agents/utils/agent-run.ts');
      expect(existsSync(path)).toBe(true);
      
      const content = readFileSync(path, 'utf-8');
      expect(content).toContain('export async function executeAgentRun');
      expect(content).toContain('startRun');
      expect(content).toContain('finishRun');
    });

    it('should use executeAgentRun in orchestrator', () => {
      const path = join(ROOT, 'src/services/orchestration/router.ts');
      const content = readFileSync(path, 'utf-8');
      
      expect(content).toContain('import { executeAgentRun }');
      expect(content).toContain('await executeAgentRun(');
    });
  });

  describe('CI/CD', () => {
    it('should have P0 hardening workflow', () => {
      const path = join(ROOT, '../../.github/workflows/ci-p0-hardening.yml');
      expect(existsSync(path)).toBe(true);
      
      const content = readFileSync(path, 'utf-8');
      expect(content).toContain('USE_MOCK_CONNECTORS');
      expect(content).toContain('/metrics');
    });
  });

  describe('Environment Configuration', () => {
    it('should have USE_MOCK_CONNECTORS in env schema', () => {
      const path = join(ROOT, 'src/config/env.ts');
      const content = readFileSync(path, 'utf-8');
      
      expect(content).toContain('USE_MOCK_CONNECTORS');
      expect(content).toContain('z.coerce.boolean()');
    });
  });

  describe('Documentation', () => {
    const docs = [
      '../../docs/P0_HARDENING_SUMMARY.md',
      '../../docs/OBSERVABILITY_GUIDE.md',
      '../../reports/WEEK1_COMPLETION_AUDIT.md',
    ];

    docs.forEach((doc) => {
      it(`should have ${doc.split('/').pop()}`, () => {
        const path = join(ROOT, doc);
        expect(existsSync(path)).toBe(true);
      });
    });
  });
});

describe('P0 Hardening - Environment Variables', () => {
  it('should have USE_MOCK_CONNECTORS enabled', () => {
    expect(process.env.USE_MOCK_CONNECTORS).toBe('true');
  });

  it('should be in test mode', () => {
    expect(process.env.NODE_ENV).toBe('test');
  });
});
