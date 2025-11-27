/**
 * Mock Transport for SDK Testing and UI Development
 * Use this while backend APIs are being built
 */

import type { Transport } from '../client';

/**
 * Create a mock transport with sample responses
 */
export const createMockTransport = (): Transport => {
  return async ({ url, method, body }) => {
    console.log('[Mock Transport]', method, url, body ? `(${JSON.stringify(body).substring(0, 50)}...)` : '');

    // Unified orchestrator mock
    if (url.endsWith('/orchestrate') && method === 'POST') {
      const intent = body?.intent ?? 'mock-intent';
      const agent = body?.agent ?? 'ContentAgent';
      return {
        success: true,
        status: 'completed',
        agent,
        intent,
        runId: `run_${Date.now()}`,
        data: {
          message: `Mock response for ${intent}`,
          payloadEcho: body?.payload ?? null,
        },
        timestamp: new Date().toISOString(),
      };
    }

    // Brand Voice Compose
    if (url.includes('/brand-voice/compose') && method === 'POST') {
      const { channel, objective } = body || {};
      const subjectLines =
        channel === 'email'
          ? [
              `Quick question about your ${objective}`,
              `Idea for boosting ${objective}`,
            ]
          : [];
      const htmlVariants =
        channel === 'email'
          ? [
              `<p>Hey there! Saw ${objective} on your roadmap—want the 3-step playbook we used last week?</p>`,
              `<p>Got a quick idea that could trim 3 hrs/week from your ${objective} workflow. Interested?</p>`,
            ]
          : [];
      const defaultBody =
        channel === 'sms'
          ? `Hey! Got a quick idea that can unblock your ${objective}. Want the 30-sec rundown?`
          : `Hi there,\n\nI noticed you're focused on ${objective}. I've got a quick workflow that might save your team time this week.\n\nWant me to send the highlights?\n\n— NeonHub`;
      return {
        subjectLines,
        htmlVariants,
        textVariants: channel === 'email' ? undefined : [defaultBody],
        body: defaultBody,
        meta: {
          model: 'gpt-5-preview (mock)',
          tokensUsed: 310,
          latencyMs: 950,
          source: 'mock-transport',
        },
      };
    }

    // Brand Voice Guardrail
    if (url.includes('/brand-voice/guardrail') && method === 'POST') {
      const { text } = body || {};
      const hasPII = text?.includes('@') || text?.includes('555-');
      return {
        safe: !hasPII,
        violations: hasPII ? ['pii_detected'] : [],
        redacted: hasPII ? text.replace(/[\w.-]+@[\w.-]+/g, '[EMAIL]').replace(/\d{3}-\d{3}-\d{4}/g, '[PHONE]') : undefined,
        details: {
          checks: ['toxicity', 'pii', 'spam', 'compliance'],
          duration: 45,
        },
      };
    }

    // Person Resolve
    if (url.includes('/person/resolve') && method === 'POST') {
      const { email, phone, handle } = body || {};
      return {
        person: {
          id: `per_${Date.now()}`,
          workspaceId: 'ws_demo',
          firstName: 'Jane',
          lastName: 'Doe',
          email: email || 'jane.doe@example.com',
          phone: phone || '+15551234567',
          createdAt: new Date().toISOString(),
        },
        identities: [
          email && { type: 'email', value: email, verified: true },
          phone && { type: 'phone', value: phone, verified: false },
          handle && { type: 'instagram', value: handle, verified: false },
        ].filter(Boolean),
        matchedOn: email ? ['email'] : phone ? ['phone'] : ['handle'],
        confidence: 1.0,
      };
    }

    // Person Memory
    if (url.includes('/person/') && url.includes('/memory') && method === 'GET') {
      return [
        {
          id: 'mem_1',
          kind: 'fact',
          text: 'Interested in marketing automation tools. Currently uses HubSpot.',
          confidence: 0.9,
          createdAt: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          id: 'mem_2',
          kind: 'intent',
          text: 'Looking to improve email open rates and reduce manual work.',
          confidence: 0.85,
          createdAt: new Date(Date.now() - 172800000).toISOString(),
        },
        {
          id: 'mem_3',
          kind: 'objection',
          text: 'Concerned about budget and implementation time.',
          confidence: 0.7,
          createdAt: new Date(Date.now() - 259200000).toISOString(),
        },
      ];
    }

    // Person Consent
    if (url.includes('/person/') && url.includes('/consent')) {
      if (method === 'GET') {
        return [
          {
            id: 'consent_1',
            personId: url.split('/')[2],
            channel: 'email',
            scope: 'marketing',
            status: 'granted',
            source: 'form',
            grantedAt: new Date(Date.now() - 86400000 * 30).toISOString(),
            createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
          },
        ];
      }
      if (method === 'POST') {
        return {
          id: 'consent_new',
          ...body,
          createdAt: new Date().toISOString(),
        };
      }
    }

    // Send Email
    if (url.includes('/email/send') && method === 'POST') {
      return {
        id: `send_email_${Date.now()}`,
        status: 'queued',
        personId: body?.personId ?? body?.to,
        channel: 'email',
        sentAt: null,
        metadata: { mock: true },
      };
    }

    // Send SMS
    if (url.includes('/sms/send') && method === 'POST') {
      return {
        id: `send_sms_${Date.now()}`,
        status: 'queued',
        personId: body?.personId ?? body?.to,
        channel: 'sms',
        sentAt: null,
        metadata: { mock: true },
      };
    }

    // Send DM
    if (url.includes('/social/') && url.includes('/dm') && method === 'POST') {
      const platform = url.split('/social/')[1]?.split('/')[0];
      return {
        id: `send_dm_${platform}_${Date.now()}`,
        status: 'queued',
        personId: body?.personId ?? body?.to,
        channel: platform,
        sentAt: null,
        metadata: { mock: true },
      };
    }

    // Send Status
    if (url.includes('/send/') && url.includes('/status') && method === 'GET') {
      const sendId = url.split('/send/')[1]?.split('/')[0];
      return {
        id: sendId,
        status: 'delivered',
        events: [
          {
            id: 'evt_1',
            type: 'email.sent',
            ts: new Date(Date.now() - 3600000),
            payload: {},
          },
          {
            id: 'evt_2',
            type: 'email.delivered',
            ts: new Date(Date.now() - 3500000),
            payload: {},
          },
        ],
        lastUpdated: new Date().toISOString(),
      };
    }

    // Events Timeline
    if (url.includes('/events/timeline')) {
      return {
        events: [
          {
            id: 'evt_1',
            type: 'email.sent',
            channel: 'email',
            ts: new Date(Date.now() - 86400000),
            payload: { subject: 'Quick question about your workflow' },
          },
          {
            id: 'evt_2',
            type: 'email.opened',
            channel: 'email',
            ts: new Date(Date.now() - 82800000),
            payload: {},
          },
          {
            id: 'evt_3',
            type: 'email.clicked',
            channel: 'email',
            ts: new Date(Date.now() - 82700000),
            payload: { url: 'https://example.com/demo' },
          },
        ],
      };
    }

    // Budget Plan
    if (url.includes('/budget/plan') && method === 'POST') {
      const { objectives, constraints } = body || {};
      return {
        id: `plan_${Date.now()}`,
        workspaceId: body?.workspaceId || 'ws_demo',
        strategy: 'bandit',
        channels: [
          {
            channel: 'email',
            objective: objectives?.[0]?.type || 'demo_book',
            budget: Math.floor((constraints?.totalBudget || 500000) * 0.4),
            estimatedReach: 2500,
            estimatedImpressions: 2500,
            estimatedClicks: 375,
            estimatedConversions: 56,
            estimatedROAS: 3.2,
            confidence: 0.85,
          },
          {
            channel: 'sms',
            objective: objectives?.[0]?.type || 'demo_book',
            budget: Math.floor((constraints?.totalBudget || 500000) * 0.3),
            estimatedReach: 1000,
            estimatedImpressions: 1000,
            estimatedClicks: 180,
            estimatedConversions: 32,
            estimatedROAS: 2.8,
            confidence: 0.78,
          },
          {
            channel: 'instagram',
            objective: objectives?.[0]?.type || 'demo_book',
            budget: Math.floor((constraints?.totalBudget || 500000) * 0.3),
            estimatedReach: 800,
            estimatedImpressions: 800,
            estimatedClicks: 120,
            estimatedConversions: 22,
            estimatedROAS: 2.6,
            confidence: 0.72,
          },
        ],
        totalBudget: constraints?.totalBudget || 500000,
        predictions: {
          totalConversions: 110,
          totalRevenue: 165000,
          averageROAS: 2.9,
          riskLevel: 'medium',
          modelConfidence: 0.78,
        },
        status: 'draft',
        createdAt: new Date().toISOString(),
      };
    }

    // Budget Wallet
    if (url.includes('/budget/wallet') && method === 'GET') {
      return {
        id: 'wallet_demo',
        workspaceId: url.split('/wallet/')[1],
        balance: 1250000, // $12,500 in cents
        currency: 'usd',
        status: 'active',
        createdAt: new Date(Date.now() - 86400000 * 90).toISOString(),
      };
    }

    // Default fallback
    console.warn('[Mock Transport] No mock for:', method, url);
    return {
      ok: true,
      message: 'Mock response - implement handler for this endpoint',
      url,
      method,
      body,
    };
  };
};

/**
 * Default mock transport instance
 */
export const mockTransport = createMockTransport();
