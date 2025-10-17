/**
 * Global Orchestration Integration Service
 * Provides API integration layer for the @neonhub/orchestrator-global module
 */

import { GlobalOrchestratorManager } from '@neonhub/orchestrator-global';
import { logger } from '../../lib/logger.js';

let orchestratorManager: GlobalOrchestratorManager | null = null;

/**
 * Initialize the Global Orchestrator Manager
 */
export async function initializeOrchestrator(config?: any): Promise<GlobalOrchestratorManager> {
  if (orchestratorManager) {
    return orchestratorManager;
  }

  try {
    const defaultConfig = {
      nodeDiscovery: {
        discoveryInterval: 30000,
        heartbeatTimeout: 90000,
        maxRetries: 3
      },
      healthMonitoring: {
        checkInterval: 15000,
        unhealthyThreshold: 3,
        recoveryThreshold: 2
      },
      routing: {
        algorithm: 'weighted-round-robin' as const,
        loadBalancingStrategy: 'least-connections' as const
      },
      autoScaling: {
        enabled: true,
        minReplicas: 2,
        maxReplicas: 10,
        targetCPUUtilization: 70,
        targetMemoryUtilization: 80,
        scaleUpCooldown: 300,
        scaleDownCooldown: 600
      },
      failover: {
        enabled: true,
        maxRetries: 3,
        retryDelay: 1000,
        healthCheckInterval: 10000
      }
    };

    const fullConfig = { ...defaultConfig, ...config };
    
    orchestratorManager = new GlobalOrchestratorManager(fullConfig);
    await orchestratorManager.initialize();
    
    logger.info('Global Orchestrator Manager initialized successfully');
    return orchestratorManager;
  } catch (error) {
    logger.error({ error }, 'Failed to initialize Global Orchestrator Manager');
    throw error;
  }
}

/**
 * Get the Global Orchestrator Manager instance
 */
export async function getOrchestratorManager(): Promise<GlobalOrchestratorManager> {
  if (!orchestratorManager) {
    return await initializeOrchestrator();
  }
  return orchestratorManager;
}

/**
 * Register a new node in the orchestration network
 */
export async function registerNode(node: {
  id: string;
  region: string;
  endpoint: string;
  capabilities: string[];
  metadata?: Record<string, any>;
}): Promise<void> {
  try {
    const manager = await getOrchestratorManager();
    await manager.nodeDiscovery.registerNode(node);
    logger.info({ nodeId: node.id }, 'Node registered successfully');
  } catch (error) {
    logger.error({ error, node }, 'Failed to register node');
    throw new Error('Failed to register node');
  }
}

/**
 * Discover available nodes in a region
 */
export async function discoverNodes(region?: string): Promise<any[]> {
  try {
    const manager = await getOrchestratorManager();
    const nodes = await manager.nodeDiscovery.discoverNodes(region);
    return nodes;
  } catch (error) {
    logger.error({ error, region }, 'Failed to discover nodes');
    throw new Error('Failed to discover nodes');
  }
}

/**
 * Route a request to the optimal node
 */
export async function routeRequest(request: {
  requestId: string;
  sourceRegion: string;
  priority: 'low' | 'medium' | 'high';
  payload: any;
}): Promise<{
  targetNode: any;
  route: any;
  latency: number;
}> {
  try {
    const manager = await getOrchestratorManager();
    const routing = await manager.routingService.routeRequest(request);
    
    return {
      targetNode: routing.targetNode,
      route: routing.route,
      latency: routing.estimatedLatency || 0
    };
  } catch (error) {
    logger.error({ error, request }, 'Failed to route request');
    throw new Error('Failed to route request');
  }
}

/**
 * Get system health status
 */
export async function getSystemHealth(): Promise<{
  overall: string;
  nodes: any[];
  metrics: any;
}> {
  try {
    const manager = await getOrchestratorManager();
    const health = await manager.healthMonitoring.getSystemHealth();
    
    return {
      overall: health.overall,
      nodes: health.nodes,
      metrics: health.metrics
    };
  } catch (error) {
    logger.error({ error }, 'Failed to get system health');
    throw new Error('Failed to retrieve system health');
  }
}

/**
 * Trigger auto-scaling evaluation
 */
export async function evaluateScaling(metrics: {
  cpuUtilization: number;
  memoryUtilization: number;
  requestRate: number;
}): Promise<{
  action: 'scale-up' | 'scale-down' | 'maintain';
  currentReplicas: number;
  targetReplicas: number;
  reason: string;
}> {
  try {
    const manager = await getOrchestratorManager();
    const decision = await manager.autoScaling.evaluateScaling(metrics);
    
    return {
      action: decision.action,
      currentReplicas: decision.currentReplicas,
      targetReplicas: decision.targetReplicas,
      reason: decision.reason
    };
  } catch (error) {
    logger.error({ error, metrics }, 'Failed to evaluate scaling');
    throw new Error('Failed to evaluate auto-scaling');
  }
}

/**
 * Execute failover to backup node
 */
export async function executeFailover(nodeId: string): Promise<{
  success: boolean;
  backupNode: any;
  message: string;
}> {
  try {
    const manager = await getOrchestratorManager();
    const result = await manager.failover.executeFailover(nodeId);
    
    return {
      success: result.success,
      backupNode: result.backupNode,
      message: result.message || 'Failover executed successfully'
    };
  } catch (error) {
    logger.error({ error, nodeId }, 'Failed to execute failover');
    throw new Error('Failed to execute failover');
  }
}

/**
 * Get orchestration metrics
 */
export async function getOrchestrationMetrics(): Promise<{
  totalNodes: number;
  healthyNodes: number;
  activeRequests: number;
  totalRequestsHandled: number;
  averageLatency: number;
}> {
  try {
    const manager = await getOrchestratorManager();
    const metrics = await manager.getMetrics();
    
    return {
      totalNodes: metrics.totalNodes,
      healthyNodes: metrics.healthyNodes,
      activeRequests: metrics.activeRequests || 0,
      totalRequestsHandled: metrics.totalRequestsHandled || 0,
      averageLatency: metrics.averageLatency || 0
    };
  } catch (error) {
    logger.error({ error }, 'Failed to get orchestration metrics');
    throw new Error('Failed to retrieve orchestration metrics');
  }
}

/**
 * Update orchestration configuration
 */
export async function updateConfiguration(config: any): Promise<void> {
  try {
    const manager = await getOrchestratorManager();
    await manager.configManager.updateConfig(config);
    logger.info('Orchestration configuration updated');
  } catch (error) {
    logger.error({ error, config }, 'Failed to update configuration');
    throw new Error('Failed to update configuration');
  }
}

/**
 * Shutdown the orchestrator manager
 */
export async function shutdownOrchestrator(): Promise<void> {
  if (orchestratorManager) {
    await orchestratorManager.shutdown();
    orchestratorManager = null;
    logger.info('Global Orchestrator Manager shut down');
  }
}