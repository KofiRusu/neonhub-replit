import { EventEmitter } from 'events';
import { NodeInfo, FederationError, FederationErrorCode, NodeCapability } from '../types';
import { Logger } from './Logger';
import { ConnectionPool } from './ConnectionPool';

export enum LoadBalancingStrategy {
  ROUND_ROBIN = 'round_robin',
  LEAST_CONNECTIONS = 'least_connections',
  RANDOM = 'random',
  WEIGHTED = 'weighted',
}

interface NodeStats {
  nodeId: string;
  activeConnections: number;
  successRate: number;
  averageResponseTime: number;
  weight: number;
  lastHealthCheck: number;
  healthy: boolean;
}

export class LoadBalancer extends EventEmitter {
  private nodes: Map<string, NodeStats> = new Map();
  private strategy: LoadBalancingStrategy;
  private logger: Logger;
  private connectionPool: ConnectionPool;
  private roundRobinIndex = 0;
  private healthCheckInterval: NodeJS.Timeout | null = null;

  constructor(
    strategy: LoadBalancingStrategy,
    logger: Logger,
    connectionPool: ConnectionPool
  ) {
    super();
    this.strategy = strategy;
    this.logger = logger;
    this.connectionPool = connectionPool;
  }

  addNode(nodeInfo: NodeInfo): void {
    const stats: NodeStats = {
      nodeId: nodeInfo.nodeId,
      activeConnections: 0,
      successRate: 1.0,
      averageResponseTime: 0,
      weight: this.calculateWeight(nodeInfo),
      lastHealthCheck: Date.now(),
      healthy: nodeInfo.status === 'online',
    };

    this.nodes.set(nodeInfo.nodeId, stats);
    this.logger.info(`Added node ${nodeInfo.nodeId} to load balancer`);
  }

  removeNode(nodeId: string): void {
    this.nodes.delete(nodeId);
    this.logger.info(`Removed node ${nodeId} from load balancer`);
  }

  updateNodeStats(nodeId: string, stats: Partial<NodeStats>): void {
    const nodeStats = this.nodes.get(nodeId);
    if (nodeStats) {
      Object.assign(nodeStats, stats);
    }
  }

  selectNode(): string | null {
    const healthyNodes = Array.from(this.nodes.values()).filter(node => node.healthy);

    if (healthyNodes.length === 0) {
      this.logger.warn('No healthy nodes available');
      return null;
    }

    switch (this.strategy) {
      case LoadBalancingStrategy.ROUND_ROBIN:
        return this.selectRoundRobin(healthyNodes);
      case LoadBalancingStrategy.LEAST_CONNECTIONS:
        return this.selectLeastConnections(healthyNodes);
      case LoadBalancingStrategy.RANDOM:
        return this.selectRandom(healthyNodes);
      case LoadBalancingStrategy.WEIGHTED:
        return this.selectWeighted(healthyNodes);
      default:
        return this.selectRoundRobin(healthyNodes);
    }
  }

  private selectRoundRobin(nodes: NodeStats[]): string {
    const node = nodes[this.roundRobinIndex % nodes.length];
    this.roundRobinIndex = (this.roundRobinIndex + 1) % nodes.length;
    return node.nodeId;
  }

  private selectLeastConnections(nodes: NodeStats[]): string {
    let minConnections = Infinity;
    let selectedNode: NodeStats | null = null;

    for (const node of nodes) {
      if (node.activeConnections < minConnections) {
        minConnections = node.activeConnections;
        selectedNode = node;
      }
    }

    return selectedNode!.nodeId;
  }

  private selectRandom(nodes: NodeStats[]): string {
    const randomIndex = Math.floor(Math.random() * nodes.length);
    return nodes[randomIndex].nodeId;
  }

  private selectWeighted(nodes: NodeStats[]): string {
    const totalWeight = nodes.reduce((sum, node) => sum + node.weight, 0);
    let random = Math.random() * totalWeight;

    for (const node of nodes) {
      random -= node.weight;
      if (random <= 0) {
        return node.nodeId;
      }
    }

    // Fallback to first node
    return nodes[0].nodeId;
  }

  private calculateWeight(nodeInfo: NodeInfo): number {
    // Calculate weight based on node capabilities and status
    let weight = 1;

    if (nodeInfo.capabilities.includes(NodeCapability.COMPUTE)) {
      weight += 2;
    }

    if (nodeInfo.capabilities.includes(NodeCapability.STORAGE)) {
      weight += 1;
    }

    if (nodeInfo.capabilities.includes(NodeCapability.COORDINATION)) {
      weight += 1;
    }

    return weight;
  }

  startHealthChecks(interval: number = 30000): void {
    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthChecks();
    }, interval);
  }

  stopHealthChecks(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  private async performHealthChecks(): Promise<void> {
    const healthCheckPromises = Array.from(this.nodes.entries()).map(
      async ([nodeId, stats]) => {
        try {
          const connection = await this.connectionPool.getConnection(nodeId);
          const healthResult = await connection.grpcClient?.healthCheck();

          const isHealthy = healthResult?.healthy === true;
          stats.healthy = isHealthy;
          stats.lastHealthCheck = Date.now();

          if (!isHealthy) {
            this.logger.warn(`Node ${nodeId} health check failed`);
            this.emit('nodeUnhealthy', nodeId);
          }

          this.connectionPool.releaseConnection(connection.id);
        } catch (error) {
          stats.healthy = false;
          stats.lastHealthCheck = Date.now();
          this.logger.error(`Health check failed for node ${nodeId}`, error);
          this.emit('nodeUnhealthy', nodeId);
        }
      }
    );

    await Promise.allSettled(healthCheckPromises);
  }

  getNodeStats(): NodeStats[] {
    return Array.from(this.nodes.values());
  }

  getHealthyNodes(): string[] {
    return Array.from(this.nodes.values())
      .filter(node => node.healthy)
      .map(node => node.nodeId);
  }

  getStats(): {
    totalNodes: number;
    healthyNodes: number;
    unhealthyNodes: number;
    strategy: LoadBalancingStrategy;
  } {
    const totalNodes = this.nodes.size;
    const healthyNodes = Array.from(this.nodes.values()).filter(node => node.healthy).length;

    return {
      totalNodes,
      healthyNodes,
      unhealthyNodes: totalNodes - healthyNodes,
      strategy: this.strategy,
    };
  }
}