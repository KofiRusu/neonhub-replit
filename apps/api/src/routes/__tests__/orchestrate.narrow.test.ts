import { describe, it, expect } from '@jest/globals';
import { formatOrchestrateResponse } from '../../routes/orchestrate.js';
import type { OrchestratorResponse } from '../../services/orchestration/types.js';


describe('formatOrchestrateResponse', () => {
  it('returns success payload for ok responses', () => {
    const response: OrchestratorResponse = { ok: true, data: { message: 'ok' } };

    const result = formatOrchestrateResponse(response, { agent: 'AdAgent', intent: 'generate' });

    expect(result.status).toBe(200);
    expect(result.body).toMatchObject({
      success: true,
      status: 'completed',
      agent: 'AdAgent',
      data: { message: 'ok' },
    });
  });

  it('maps error responses with appropriate defaults', () => {
    const response: OrchestratorResponse = { ok: false, error: 'unauthorized', code: 'UNAUTHENTICATED' };

    const result = formatOrchestrateResponse(response, { intent: 'generate' });

    expect(result.status).toBe(401);
    expect(result.body).toMatchObject({
      success: false,
      status: 'failed',
      error: { code: 'UNAUTHENTICATED', message: 'unauthorized' },
    });
  });
});
