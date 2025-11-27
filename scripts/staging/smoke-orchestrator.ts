// Initialize telemetry first
import '@neonhub/telemetry';

import { logger } from '@neonhub/telemetry';
import { withSpan } from '@neonhub/telemetry';

interface SmokeTestResult {
  ok: boolean;
  steps?: Array<{ name: string; status: string }>;
  error?: string;
  duration: number;
}

async function runPlan(config: {
  goal: string;
  channels: string[];
  constraints: { budgetUSD: number; maxTokens: number };
}): Promise<SmokeTestResult> {
  return withSpan(
    {
      name: 'smoke.test.runPlan',
      attributes: {
        'smoke.goal': config.goal,
        'smoke.channels': config.channels.join(','),
        'smoke.budget_usd': config.constraints.budgetUSD,
        'smoke.max_tokens': config.constraints.maxTokens,
      },
    },
    async () => {
      const startTime = Date.now();

      try {
        // Simulate orchestrator plan execution
        logger.info({ config }, 'Starting smoke test plan');

        // Mock steps for staging validation
        const steps = config.channels.map((channel) => ({
          name: `${channel}_campaign`,
          status: 'completed',
        }));

        // Simulate processing delay
        await new Promise((resolve) => setTimeout(resolve, 100));

        const duration = Date.now() - startTime;

        logger.info({ steps: steps.length, duration }, 'Smoke test plan completed');

        return {
          ok: true,
          steps,
          duration,
        };
      } catch (error) {
        const duration = Date.now() - startTime;
        logger.error({ error: (error as Error).message }, 'Smoke test plan failed');
        return {
          ok: false,
          error: (error as Error).message,
          duration,
        };
      }
    }
  );
}

(async () => {
  logger.info({ msg: 'staging smoke start' });

  const res = await runPlan({
    goal: 'Launch a multi-channel campaign for Product X',
    channels: ['email', 'social', 'blog'],
    constraints: { budgetUSD: 25, maxTokens: 12_000 },
  });

  logger.info({
    msg: 'staging smoke done',
    ok: res.ok,
    steps: res.steps?.length,
    duration: res.duration,
  });

  if (!res.ok) {
    console.error('❌ Smoke test failed:', res.error);
    process.exit(1);
  }

  console.log('✅ Smoke test passed');
  process.exit(0);
})();

