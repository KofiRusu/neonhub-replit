import { describe, it, expect } from '@jest/globals';
import { formatOrchestrateResponse } from '../../routes/orchestrate.js';
import type { OrchestratorResponse } from '../../services/orchestration/types.js';

describe('formatOrchestrateResponse', () => {
  it('returns success payload for ok responses', () => {
    const response: OrchestratorResponse = { ok: true, data: { message: 'ok' } };

    const result = formatOrchestrateResponse(response);

    expect(result.status).toBe(200);
    expect(result.body).toMatchObject({ success: true, data: { message: 'ok' } });
  });

  it('maps error responses with appropriate defaults', () => {
    const response: OrchestratorResponse = { ok: false, error: 'unauthorized', code: 'UNAUTHENTICATED' };

    const result = formatOrchestrateResponse(response);

    expect(result.status).toBe(401);
    expect(result.body).toMatchObject({ success: false, error: 'unauthorized', code: 'UNAUTHENTICATED' });
  });
});
