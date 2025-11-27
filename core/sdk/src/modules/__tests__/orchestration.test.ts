import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { OrchestrationModule } from '../orchestration';
import type { HTTPClient } from '../../client';

const mockClient = (response: any) => {
  const post = jest.fn(() => Promise.resolve(response)) as unknown as HTTPClient["post"];
  return { post } as unknown as HTTPClient;
};

describe('OrchestrationModule', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('executes orchestration via shared contract', async () => {
    const mockResponse = {
      success: true,
      status: 'completed',
      agent: 'SEOAgent',
      intent: 'seo-audit',
      data: { ok: true },
      timestamp: new Date().toISOString(),
    };
    const client = mockClient(mockResponse);

    const module = new OrchestrationModule(client);
    const result = await module.execute({
      intent: 'seo-audit',
      payload: { keyword: 'ai automation' },
    });

    expect(client.post).toHaveBeenCalledWith('/orchestrate', {
      body: { intent: 'seo-audit', payload: { keyword: 'ai automation' } },
    });
    expect(result).toEqual(mockResponse);
  });

  it('throws when backend returns invalid envelope', async () => {
    const client = mockClient({});
    const module = new OrchestrationModule(client);

    await expect(module.execute({ intent: 'seo-audit' })).rejects.toThrow();
  });

  it('supports executeIntent helper', async () => {
    const mockResponse = {
      success: true,
      status: 'completed',
      agent: 'SupportAgent',
      intent: 'support',
      data: { reply: 'ok' },
      timestamp: new Date().toISOString(),
    };
    const client = mockClient(mockResponse);
    const module = new OrchestrationModule(client);

    await module.executeIntent(
      'support',
      { notes: 'Customer stuck' },
      { agent: 'SupportAgent', context: { organizationId: 'org_123' } },
    );

    expect(client.post).toHaveBeenCalledWith('/orchestrate', {
      body: {
        intent: 'support',
        payload: { notes: 'Customer stuck' },
        agent: 'SupportAgent',
        context: { organizationId: 'org_123' },
      },
    });
  });

  it('passes through typed error envelopes', async () => {
    const mockResponse = {
      success: false,
      status: 'failed',
      agent: 'SupportAgent',
      intent: 'support',
      error: {
        code: 'RATE_LIMITED',
        message: 'Too many calls',
      },
      timestamp: new Date().toISOString(),
    };
    const client = mockClient(mockResponse);

    const module = new OrchestrationModule(client);
    const result = await module.execute({ intent: 'support', context: { userId: 'user_1' } });
    expect(result).toEqual(mockResponse);
  });
});
