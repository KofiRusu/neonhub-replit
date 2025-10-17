import { NeonHubPredictiveEngine, PerformanceMetrics } from '@neonhub/predictive-engine';

let predictiveEngine: NeonHubPredictiveEngine | null = null;

export async function getPredictiveEngine(): Promise<NeonHubPredictiveEngine> {
  if (!predictiveEngine) {
    predictiveEngine = new NeonHubPredictiveEngine();
    await predictiveEngine.initialize();
  }
  return predictiveEngine;
}

export async function processMetricsForScaling(currentMetrics: PerformanceMetrics) {
  const engine = await getPredictiveEngine();
  return await engine.processMetrics(currentMetrics);
}

export async function executeAutoScaling(decision: any, namespace = 'default', deploymentName = 'neonhub-api') {
  const engine = await getPredictiveEngine();
  return await engine.executeScaling(decision, namespace, deploymentName);
}

export async function getPredictiveEngineHealth() {
  const engine = await getPredictiveEngine();
  return await engine.getSystemHealth();
}

export async function getAdaptiveAgentStats() {
  const engine = await getPredictiveEngine();
  return engine.getAdaptiveAgentStats();
}

export async function getBaselineMetrics() {
  const engine = await getPredictiveEngine();
  return engine.getBaselineMetrics();
}