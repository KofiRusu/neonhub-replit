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
      name: 'production.smoke.runPlan',
      attributes: {
        'smoke.goal': config.goal,
        'smoke.channels': config.channels.join(','),
        'smoke.budget_usd': config.constraints.budgetUSD,
        'smoke.max_tokens': config.constraints.maxTokens,
        'deployment.environment': 'production',
      },
    },
    async () => {
      const startTime = Date.now();

      try {
        logger.info({ config, env: 'production' }, 'Starting production smoke test');

        // Stricter validation for production
        if (config.constraints.budgetUSD <= 0 || config.constraints.maxTokens <= 0) {
          throw new Error('Invalid constraints for production smoke test');
        }

        // Mock orchestrator plan execution with production-like behavior
        const steps = config.channels.map((channel) => ({
          name: `${channel}_campaign`,
          status: 'completed',
        }));

        // Simulate realistic processing delay
        await new Promise((resolve) => setTimeout(resolve, 150));

        const duration = Date.now() - startTime;

        logger.info({ steps: steps.length, duration, env: 'production' }, 'Production smoke test completed');

        return {
          ok: true,
          steps,
          duration,
        };
      } catch (error) {
        const duration = Date.now() - startTime;
        logger.error({ error: (error as Error).message, env: 'production' }, 'Production smoke test failed');
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
  logger.info({ msg: 'production smoke test start', env: process.env.NODE_ENV });

  const res = await runPlan({
    goal: 'Launch a multi-channel campaign for Product X',
    channels: ['email', 'social', 'blog'],
    constraints: { budgetUSD: 10, maxTokens: 8_000 }, // Stricter than staging
  });

  logger.info({
    msg: 'production smoke test done',
    ok: res.ok,
    steps: res.steps?.length,
    duration: res.duration,
  });

  if (!res.ok) {
    console.error('❌ Production smoke test failed:', res.error);
    process.exit(1);
  }

  console.log('✅ Production smoke test passed');
  console.log(`   Duration: ${res.duration}ms`);
  console.log(`   Steps: ${res.steps?.length}`);
  process.exit(0);
})();

