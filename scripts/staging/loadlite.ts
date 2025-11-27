// Initialize telemetry first
import '@neonhub/telemetry';

import os from 'os';
import pLimit from 'p-limit';
import { logger, withSpan } from '@neonhub/telemetry';

interface LoadTestResult {
  ok: boolean;
  duration: number;
}

async function runPlan(config: {
  goal: string;
  channels: string[];
  constraints: { maxTokens: number };
}): Promise<LoadTestResult> {
  return withSpan(
    {
      name: 'loadlite.runPlan',
      attributes: {
        'load.goal': config.goal,
        'load.channels': config.channels.join(','),
        'load.max_tokens': config.constraints.maxTokens,
      },
    },
    async () => {
      const startTime = Date.now();

      try {
        // Simulate plan execution
        await new Promise((resolve) => setTimeout(resolve, Math.random() * 200 + 50));

        const duration = Date.now() - startTime;

        return { ok: true, duration };
      } catch (error) {
        const duration = Date.now() - startTime;
        logger.error({ error: (error as Error).message }, 'Load test plan failed');
        return { ok: false, duration };
      }
    }
  );
}

(async () => {
  const limit = pLimit(4);
  const N = Number(process.env.LOAD_LITE_N ?? 12);

  logger.info({ msg: 'Load lite test starting', concurrent: 4, totalJobs: N });

  const startTime = Date.now();

  const jobs = Array.from({ length: N }, (_, i) =>
    limit(async () => {
      const r = await runPlan({
        goal: `LoadLite ${i}`,
        channels: ['email'],
        constraints: { maxTokens: 4000 },
      });

      if (!r.ok) {
        throw new Error('plan failed');
      }

      return r;
    })
  );

  const results = await Promise.allSettled(jobs);

  const ok = results.filter((r) => r.status === 'fulfilled').length;
  const fail = results.length - ok;
  const totalDuration = Date.now() - startTime;
  const successRate = (ok / results.length) * 100;

  // Calculate SLO metrics
  const durations = results
    .filter((r) => r.status === 'fulfilled')
    .map((r) => (r as PromiseFulfilledResult<LoadTestResult>).value.duration)
    .sort((a, b) => a - b);

  const p50 = durations[Math.floor(durations.length * 0.5)] || 0;
  const p95 = durations[Math.floor(durations.length * 0.95)] || 0;

  const summary = {
    ok,
    fail,
    successRate: successRate.toFixed(2) + '%',
    totalDuration,
    cpu: os.cpus().length,
    slo: {
      p50_ms: p50,
      p95_ms: p95,
      error_rate: (fail / results.length).toFixed(4),
    },
  };

  console.log(JSON.stringify(summary, null, 2));

  logger.info({ summary }, 'Load lite test completed');

  // Check SLO thresholds
  const SLO_P50_MS = Number(process.env.SLO_P50_MS ?? 1500);
  const SLO_P95_MS = Number(process.env.SLO_P95_MS ?? 4500);
  const SLO_ERR_RATE_MAX = Number(process.env.SLO_ERR_RATE_MAX ?? 0.02);

  const sloPass =
    p50 <= SLO_P50_MS &&
    p95 <= SLO_P95_MS &&
    fail / results.length <= SLO_ERR_RATE_MAX &&
    successRate >= 90;

  if (!sloPass) {
    console.error('❌ SLO validation failed');
    console.error(`  P50: ${p50}ms (max: ${SLO_P50_MS}ms)`);
    console.error(`  P95: ${p95}ms (max: ${SLO_P95_MS}ms)`);
    console.error(`  Error rate: ${(fail / results.length).toFixed(4)} (max: ${SLO_ERR_RATE_MAX})`);
    console.error(`  Success rate: ${successRate}% (min: 90%)`);
    process.exit(1);
  }

  console.log('✅ Load lite test passed with SLO validation');
  process.exit(fail ? 1 : 0);
})();

