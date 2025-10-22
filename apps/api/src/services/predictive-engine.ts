import { NeonHubPredictiveEngine } from '@neonhub/predictive-engine';

// Initialize the predictive engine
const predictiveEngine = new NeonHubPredictiveEngine();
let isInitialized = false;

// Initialize the engine on first use
async function ensureInitialized() {
  if (!isInitialized) {
    await predictiveEngine.initialize();
    isInitialized = true;
  }
}

/**
 * Process metrics for scaling decisions
 */
export async function processMetricsForScaling(metrics: any) {
  try {
    await ensureInitialized();
    return await predictiveEngine.processMetrics(metrics);
  } catch (error) {
    console.error('Error processing metrics for scaling:', error);
    throw error;
  }
}

/**
 * Execute auto-scaling based on decision
 */
export async function executeAutoScaling(decision: any, namespace?: string, deploymentName?: string) {
  try {
    await ensureInitialized();
    return await predictiveEngine.executeScaling(decision, namespace, deploymentName);
  } catch (error) {
    console.error('Error executing auto-scaling:', error);
    throw error;
  }
}

/**
 * Get predictive engine health status
 */
export async function getPredictiveEngineHealth() {
  try {
    await ensureInitialized();
    return await predictiveEngine.getSystemHealth();
  } catch (error) {
    console.error('Error getting predictive engine health:', error);
    throw error;
  }
}

/**
 * Get adaptive agent statistics
 */
export function getAdaptiveAgentStats() {
  try {
    return predictiveEngine.getAdaptiveAgentStats();
  } catch (error) {
    console.error('Error getting adaptive agent stats:', error);
    throw error;
  }
}

/**
 * Get baseline performance metrics
 */
export async function getBaselineMetrics() {
  try {
    await ensureInitialized();
    return predictiveEngine.getBaselineMetrics();
  } catch (error) {
    console.error('Error getting baseline metrics:', error);
    throw error;
  }
}