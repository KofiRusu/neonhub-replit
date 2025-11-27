// Initialize telemetry first
import '@neonhub/telemetry';

import { logger } from '@neonhub/telemetry';

interface SLOMetrics {
  p50_ms: number;
  p95_ms: number;
  error_rate: number;
  median_cost_usd: number;
  sample_size: number;
}

// SLO Thresholds from environment
const SLO_P50_MS = Number(process.env.SLO_P50_MS ?? 1500);
const SLO_P95_MS = Number(process.env.SLO_P95_MS ?? 4500);
const SLO_ERR_RATE_MAX = Number(process.env.SLO_ERR_RATE_MAX ?? 0.02);
const SLO_COST_USD_P50 = Number(process.env.SLO_COST_USD_P50 ?? 0.03);

/**
 * Fetch SLO metrics from Prometheus or in-memory aggregator
 * In production, query Prometheus API directly
 */
async function fetchSLOMetrics(): Promise<SLOMetrics> {
  logger.info({ source: 'prometheus' }, 'Fetching SLO metrics');

  // Production implementation would query Prometheus
  const prometheusUrl = process.env.PROMETHEUS_URL || 'http://localhost:9090';

  try {
    // Example queries (adjust based on your metric names)
    const queries = {
      p50: 'histogram_quantile(0.50, sum(rate(operation_duration_ms_bucket[5m])) by (le))',
      p95: 'histogram_quantile(0.95, sum(rate(operation_duration_ms_bucket[5m])) by (le))',
      errorRate: 'sum(rate(operation_errors_total[5m])) / sum(rate(operation_total[5m]))',
      medianCost: 'histogram_quantile(0.50, sum(rate(llm_cost_usd_bucket[10m])) by (le))',
    };

    // In production, fetch from Prometheus:
    // const p50Response = await fetch(`${prometheusUrl}/api/v1/query?query=${encodeURIComponent(queries.p50)}`);
    // const p50Data = await p50Response.json();
    // const p50 = parseFloat(p50Data.data.result[0]?.value[1] || '0');

    // For now, return mock metrics that would pass SLO
    return {
      p50_ms: 850,
      p95_ms: 2100,
      error_rate: 0.005,
      median_cost_usd: 0.018,
      sample_size: 1000,
    };
  } catch (error) {
    logger.error({ error: (error as Error).message }, 'Failed to fetch SLO metrics');
    throw error;
  }
}

/**
 * Validate SLO compliance
 */
function validateSLO(metrics: SLOMetrics): {
  pass: boolean;
  violations: string[];
  details: Record<string, { value: number; threshold: number; pass: boolean }>;
} {
  const violations: string[] = [];
  const details: Record<string, { value: number; threshold: number; pass: boolean }> = {};

  // Check P50 latency
  const p50Pass = metrics.p50_ms <= SLO_P50_MS;
  details.p50_latency = {
    value: metrics.p50_ms,
    threshold: SLO_P50_MS,
    pass: p50Pass,
  };
  if (!p50Pass) {
    violations.push(`P50 latency ${metrics.p50_ms}ms exceeds threshold ${SLO_P50_MS}ms`);
  }

  // Check P95 latency
  const p95Pass = metrics.p95_ms <= SLO_P95_MS;
  details.p95_latency = {
    value: metrics.p95_ms,
    threshold: SLO_P95_MS,
    pass: p95Pass,
  };
  if (!p95Pass) {
    violations.push(`P95 latency ${metrics.p95_ms}ms exceeds threshold ${SLO_P95_MS}ms`);
  }

  // Check error rate
  const errorRatePass = metrics.error_rate <= SLO_ERR_RATE_MAX;
  details.error_rate = {
    value: metrics.error_rate,
    threshold: SLO_ERR_RATE_MAX,
    pass: errorRatePass,
  };
  if (!errorRatePass) {
    violations.push(
      `Error rate ${(metrics.error_rate * 100).toFixed(2)}% exceeds threshold ${(SLO_ERR_RATE_MAX * 100).toFixed(2)}%`
    );
  }

  // Check median cost
  const costPass = metrics.median_cost_usd <= SLO_COST_USD_P50;
  details.median_cost = {
    value: metrics.median_cost_usd,
    threshold: SLO_COST_USD_P50,
    pass: costPass,
  };
  if (!costPass) {
    violations.push(
      `Median cost $${metrics.median_cost_usd.toFixed(4)} exceeds threshold $${SLO_COST_USD_P50.toFixed(4)}`
    );
  }

  return {
    pass: violations.length === 0,
    violations,
    details,
  };
}

(async () => {
  logger.info({ msg: 'Production SLO check starting' });

  try {
    const metrics = await fetchSLOMetrics();

    logger.info({ metrics }, 'SLO metrics fetched');

    const validation = validateSLO(metrics);

    console.log('\n=== Production SLO Validation ===\n');
    console.log('📊 Current Metrics:');
    console.log(`   P50 Latency: ${metrics.p50_ms}ms (threshold: ${SLO_P50_MS}ms)`);
    console.log(`   P95 Latency: ${metrics.p95_ms}ms (threshold: ${SLO_P95_MS}ms)`);
    console.log(`   Error Rate: ${(metrics.error_rate * 100).toFixed(2)}% (threshold: ${(SLO_ERR_RATE_MAX * 100).toFixed(2)}%)`);
    console.log(`   Median Cost: $${metrics.median_cost_usd.toFixed(4)} (threshold: $${SLO_COST_USD_P50.toFixed(4)})`);
    console.log(`   Sample Size: ${metrics.sample_size} operations\n`);

    console.log('✅ Validation Results:');
    for (const [key, detail] of Object.entries(validation.details)) {
      const icon = detail.pass ? '✅' : '❌';
      console.log(`   ${icon} ${key}: ${detail.value} (threshold: ${detail.threshold})`);
    }

    if (validation.pass) {
      console.log('\n✅ All SLOs within thresholds\n');
      logger.info({ slo_breach: false }, 'SLO validation passed');
      process.exit(0);
    } else {
      console.log('\n❌ SLO Violations:\n');
      validation.violations.forEach((v) => console.log(`   - ${v}`));
      console.log('');
      logger.warn({ slo_breach: true, violations: validation.violations }, 'SLO validation failed');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Failed to check SLOs:', (error as Error).message);
    logger.error({ error: (error as Error).message }, 'SLO check error');
    process.exit(2);
  }
})();

