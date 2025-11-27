/**
 * Orchestrator Persistence Integration Test
 * Validates that agent runs are persisted to database
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { orchestrate, registerAgent, clearRegistry } from '../services/orchestration/index.js';
import type { AgentName, OrchestratorRequest, OrchestratorResponse } from '../services/orchestration/types.js';

// Import mock Prisma client (CommonJS for Jest compatibility)
const { mockPrismaClient, resetMockData } = require('../__mocks__/prisma.js');

const TEST_AGENT: AgentName = "ContentAgent";
const FAIL_AGENT: AgentName = "EmailAgent";
const SEO_TEST_AGENT: AgentName = "SEOAgent";

describe('Orchestrator AgentRun Persistence', () => {
  beforeEach(() => {
    resetMockData();
    jest.clearAllMocks();
    clearRegistry();
  });

  it('should create AgentRun record when executing agent', async () => {
    const handlerResponse: OrchestratorResponse = {
      ok: true,
      data: { message: 'Draft generated' },
    };

    registerAgent(TEST_AGENT, {
      handle: async () => handlerResponse,
    });

    const request: OrchestratorRequest = {
      agent: TEST_AGENT,
      intent: 'generate-draft',
      payload: {
        topic: 'AI Marketing Trends',
        targetLength: 500,
      },
      context: {
        userId: 'test-user-id',
        organizationId: 'test-org-id',
        requestId: 'test-req-123',
      },
    };

    // Execute the orchestrator
    const response = await orchestrate(request);

    const runs = await mockPrismaClient.agentRun.findMany({ where: { organizationId: 'test-org-id' } });
    expect(runs).toHaveLength(1);
    const run = runs[0];

    expect(run.status).toBe('SUCCESS');
    expect(run.organizationId).toBe('test-org-id');
    expect(run.meta).toMatchObject({ intent: 'generate-draft', userId: 'test-user-id' });
    expect(run.metrics).toMatchObject({ intent: 'generate-draft' });

    expect(response).toEqual({ ok: true, data: { message: 'Draft generated' } });
  });

  it('should record failure status when agent execution fails', async () => {
    registerAgent(FAIL_AGENT, {
      handle: async () => {
        throw new Error('Agent execution failed');
      },
    });

    const request: OrchestratorRequest = {
      agent: FAIL_AGENT,
      intent: 'invalid-intent',
      payload: {},
      context: {
        userId: 'test-user-id',
        organizationId: 'test-org-id',
      },
    };

    try {
      await orchestrate(request);
    } catch (_error) {
      // Expected to fail
    }

    const failedRuns = await mockPrismaClient.agentRun.findMany({ where: { organizationId: 'test-org-id' } });
    expect(failedRuns).toHaveLength(1);
    expect(failedRuns[0].status).toBe('FAILED');
  });

  it('should track duration metrics in AgentRunMetric', async () => {
    registerAgent(TEST_AGENT, {
      handle: async () => ({
        ok: true,
        data: { processed: true },
      }),
    });

    const request: OrchestratorRequest = {
      agent: TEST_AGENT,
      intent: 'generate-draft',
      payload: { topic: 'Test Topic' },
      context: {
        userId: 'test-user-id',
        organizationId: 'test-org-id',
      },
    };

    await orchestrate(request);

    const runs = await mockPrismaClient.agentRun.findMany({ where: { organizationId: 'test-org-id' } });
    expect(runs[0].metrics).toMatchObject({ intent: 'generate-draft' });
  });

  it('should handle missing organizationId gracefully', async () => {
    registerAgent(TEST_AGENT, {
      handle: async () => ({
        ok: true,
        data: { fallback: true },
      }),
    });

    const request: OrchestratorRequest = {
      agent: TEST_AGENT,
      intent: 'generate-draft',
      payload: { topic: 'Test' },
      context: {
        userId: 'test-user-id',
        // organizationId missing
      },
    };

    const response = await orchestrate(request);

    // Should execute without persistence
    expect(response).toBeDefined();
    
    // AgentRun.create should not be called without organizationId
    expect(mockPrismaClient.agentRun.create).not.toHaveBeenCalled();
  });

  it('should store intent and objective in AgentRun', async () => {
    registerAgent(SEO_TEST_AGENT, {
      handle: async () => ({
        ok: true,
        data: { audit: true },
      }),
    });

    const request: OrchestratorRequest = {
      agent: SEO_TEST_AGENT,
      intent: 'seo-audit',
      payload: { url: 'https://example.com' },
      context: {
        userId: 'test-user-id',
        organizationId: 'test-org-id',
      },
    };

    await orchestrate(request);

    const runs = await mockPrismaClient.agentRun.findMany({ where: { organizationId: 'test-org-id' } });
    const seoRun = runs.find((run: any) => run.objective === 'seo-audit');
    expect(seoRun?.meta).toMatchObject({ intent: 'seo-audit' });
    expect(seoRun?.objective).toBeDefined();
  });
});
