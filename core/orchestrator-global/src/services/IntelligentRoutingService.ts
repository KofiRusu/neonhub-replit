import { EventEmitter } from 'events';
import {
  RoutingConfig,
  GlobalNodeInfo,
  RoutingDecision,
  RoutingAlgorithm,
  LoadBalancingStrategy,
  OrchestratorMessage,
  GlobalOrchestratorError,
  GlobalOrchestratorErrorCode,
  Logger
} from '../types';

export class IntelligentRoutingService extends EventEmitter {
  private config: RoutingConfig;
  private logger: Logger;
  private routingTable: Map<string, RoutingDecision[]> = new Map();
  private nodeLoadCache: Map<string, number> = new Map();
  private geographicRoutingTable: Map<string, string[]> = new Map();
  private adaptiveMetrics: Map<string, number[]> = new Map();

  constructor(config: RoutingConfig, logger: Logger) {
    super();
    this.config = config;
    this.logger = logger;
  }

  async initialize(nodes: GlobalNodeInfo[]): Promise<void> {
    this.logger.info('Initializing intelligent routing service');

    // Build initial routing table
    this.buildRoutingTable(nodes);

    // Initialize geographic routing if enabled
    if (this.config.geoRoutingEnabled) {
      this.buildGeographicRoutingTable(nodes);
    }

    this.logger.info('Intelligent routing service initialized');
  }

  private buildRoutingTable(nodes: GlobalNodeInfo[]): void {
    // Group nodes by federation
    const nodesByFederation = new Map<string, GlobalNodeInfo[]>();

    for (const node of nodes) {
      if (!nodesByFederation.has(node.federationId)) {
        nodesByFederation.set(node.federationId, []);
      }
      nodesByFederation.get(node.federationId)!.push(node);
    }

    // Build routing decisions for each federation
    for (const [federationId, federationNodes] of nodesByFederation) {
      const decisions: RoutingDecision[] = federationNodes.map(node => ({
        targetNodeId: node.nodeId,
        federationId,
        reason: 'initial_routing_table',
        confidence: 1.0,
        alternatives: federationNodes.filter(n => n.nodeId !== node.nodeId).map(n => n.nodeId),
        timestamp: Date.now()
      }));

      this.routingTable.set(federationId, decisions);
    }
  }

  private buildGeographicRoutingTable(nodes: GlobalNodeInfo[]): void {
    // Group nodes by region
    const nodesByRegion = new Map<string, GlobalNodeInfo[]>();

    for (const node of nodes) {
      if (!nodesByRegion.has(node.region)) {
        nodesByRegion.set(node.region, []);
      }
      nodesByRegion.get(node.region)!.push(node);
    }

    // Create geographic routing preferences
    for (const [region, regionNodes] of nodesByRegion) {
      this.geographicRoutingTable.set(region, regionNodes.map(n => n.nodeId));
    }
  }

  async routeMessage(message: OrchestratorMessage): Promise<RoutingDecision> {
    try {
      let targetFederationId = message.targetFederationId;

      // Determine target federation if not specified
      if (!targetFederationId) {
        targetFederationId = this.determineTargetFederation(message);
      }

      // Get available routing decisions for the federation
      const routingDecisions = this.routingTable.get(targetFederationId);
      if (!routingDecisions || routingDecisions.length === 0) {
        throw new GlobalOrchestratorError(
          GlobalOrchestratorErrorCode.ROUTING_FAILED,
          `No routing decisions available for federation ${targetFederationId}`
        );
      }

      // Apply routing algorithm
      const decision = await this.applyRoutingAlgorithm(routingDecisions, message);

      // Update adaptive metrics if enabled
      if (this.config.adaptiveRouting) {
        this.updateAdaptiveMetrics(decision.targetNodeId, message);
      }

      this.emit('messageRouted', decision, message);
      this.logger.debug(`Routed message ${message.id} to node ${decision.targetNodeId}`);

      return decision;
    } catch (error) {
      this.logger.error('Failed to route message', error as Error);
      throw error;
    }
  }

  private determineTargetFederation(message: OrchestratorMessage): string {
    // Simple logic: route based on message priority or content
    // In a real implementation, this would use more sophisticated logic
    const federations = Array.from(this.routingTable.keys());

    if (federations.length === 0) {
      throw new GlobalOrchestratorError(
        GlobalOrchestratorErrorCode.ROUTING_FAILED,
        'No federations available for routing'
      );
    }

    // For now, return the first federation
    // This could be enhanced with load balancing, geographic routing, etc.
    return federations[0];
  }

  private async applyRoutingAlgorithm(
    routingDecisions: RoutingDecision[],
    message: OrchestratorMessage
  ): Promise<RoutingDecision> {
    switch (this.config.algorithm) {
      case RoutingAlgorithm.ROUND_ROBIN:
        return this.roundRobinRouting(routingDecisions);

      case RoutingAlgorithm.LEAST_CONNECTIONS:
        return this.leastConnectionsRouting(routingDecisions);

      case RoutingAlgorithm.LEAST_RESPONSE_TIME:
        return this.leastResponseTimeRouting(routingDecisions);

      case RoutingAlgorithm.GEOGRAPHIC:
        return this.geographicRouting(routingDecisions, message);

      case RoutingAlgorithm.ADAPTIVE:
        return this.adaptiveRouting(routingDecisions, message);

      default:
        return this.weightedRoundRobinRouting(routingDecisions);
    }
  }

  private roundRobinRouting(routingDecisions: RoutingDecision[]): RoutingDecision {
    // Simple round-robin implementation
    const index = Math.floor(Math.random() * routingDecisions.length);
    return routingDecisions[index];
  }

  private leastConnectionsRouting(routingDecisions: RoutingDecision[]): RoutingDecision {
    // Find node with least connections
    let bestDecision = routingDecisions[0];
    let minLoad = this.nodeLoadCache.get(bestDecision.targetNodeId) || 0;

    for (const decision of routingDecisions) {
      const load = this.nodeLoadCache.get(decision.targetNodeId) || 0;
      if (load < minLoad) {
        minLoad = load;
        bestDecision = decision;
      }
    }

    return bestDecision;
  }

  private leastResponseTimeRouting(routingDecisions: RoutingDecision[]): RoutingDecision {
    // This would require response time metrics
    // For now, fall back to least connections
    return this.leastConnectionsRouting(routingDecisions);
  }

  private geographicRouting(routingDecisions: RoutingDecision[], message: OrchestratorMessage): RoutingDecision {
    // Try to route to nodes in the same region first
    // This is a simplified implementation
    return this.roundRobinRouting(routingDecisions);
  }

  private adaptiveRouting(routingDecisions: RoutingDecision[], message: OrchestratorMessage): RoutingDecision {
    // Use adaptive metrics to make routing decisions
    let bestDecision = routingDecisions[0];
    let bestScore = this.calculateAdaptiveScore(bestDecision.targetNodeId);

    for (const decision of routingDecisions) {
      const score = this.calculateAdaptiveScore(decision.targetNodeId);
      if (score > bestScore) {
        bestScore = score;
        bestDecision = decision;
      }
    }

    return bestDecision;
  }

  private weightedRoundRobinRouting(routingDecisions: RoutingDecision[]): RoutingDecision {
    // Calculate weights based on node health/capacity
    const weights = routingDecisions.map(decision => {
      const load = this.nodeLoadCache.get(decision.targetNodeId) || 0;
      return Math.max(1, 100 - load); // Higher weight for lower load
    });

    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    let random = Math.random() * totalWeight;

    for (let i = 0; i < routingDecisions.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return routingDecisions[i];
      }
    }

    return routingDecisions[0];
  }

  private calculateAdaptiveScore(nodeId: string): number {
    const metrics = this.adaptiveMetrics.get(nodeId) || [];
    if (metrics.length === 0) return 0.5; // Default score

    // Calculate average success rate or performance metric
    const average = metrics.reduce((sum, metric) => sum + metric, 0) / metrics.length;
    return Math.max(0, Math.min(1, average)); // Normalize to 0-1
  }

  private updateAdaptiveMetrics(nodeId: string, message: OrchestratorMessage): void {
    // This would be called when routing results are known
    // For now, just maintain a simple success metric
    const metrics = this.adaptiveMetrics.get(nodeId) || [];
    metrics.push(0.9); // Assume 90% success rate for demo

    // Keep only recent metrics
    if (metrics.length > 100) {
      metrics.shift();
    }

    this.adaptiveMetrics.set(nodeId, metrics);
  }

  updateNodeLoad(nodeId: string, load: number): void {
    this.nodeLoadCache.set(nodeId, load);
  }

  addNode(node: GlobalNodeInfo): void {
    const federationDecisions = this.routingTable.get(node.federationId) || [];
    const newDecision: RoutingDecision = {
      targetNodeId: node.nodeId,
      federationId: node.federationId,
      reason: 'node_added',
      confidence: 1.0,
      alternatives: federationDecisions.map(d => d.targetNodeId),
      timestamp: Date.now()
    };

    federationDecisions.push(newDecision);
    this.routingTable.set(node.federationId, federationDecisions);

    // Update geographic routing if enabled
    if (this.config.geoRoutingEnabled) {
      const regionNodes = this.geographicRoutingTable.get(node.region) || [];
      if (!regionNodes.includes(node.nodeId)) {
        regionNodes.push(node.nodeId);
        this.geographicRoutingTable.set(node.region, regionNodes);
      }
    }

    this.logger.info(`Added node ${node.nodeId} to routing table`);
  }

  removeNode(nodeId: string): void {
    // Find and remove from routing table
    for (const [federationId, decisions] of this.routingTable) {
      const filteredDecisions = decisions.filter(d => d.targetNodeId !== nodeId);
      if (filteredDecisions.length !== decisions.length) {
        this.routingTable.set(federationId, filteredDecisions);
        this.logger.info(`Removed node ${nodeId} from routing table for federation ${federationId}`);
      }
    }

    // Remove from geographic routing
    for (const [region, nodes] of this.geographicRoutingTable) {
      const filteredNodes = nodes.filter(id => id !== nodeId);
      if (filteredNodes.length !== nodes.length) {
        this.geographicRoutingTable.set(region, filteredNodes);
      }
    }

    // Clean up caches
    this.nodeLoadCache.delete(nodeId);
    this.adaptiveMetrics.delete(nodeId);
  }

  getRoutingTable(): Map<string, RoutingDecision[]> {
    return new Map(this.routingTable);
  }

  getRoutingStats(): any {
    const totalDecisions = Array.from(this.routingTable.values())
      .reduce((sum, decisions) => sum + decisions.length, 0);

    return {
      totalFederations: this.routingTable.size,
      totalRoutingDecisions: totalDecisions,
      algorithm: this.config.algorithm,
      adaptiveRoutingEnabled: this.config.adaptiveRouting,
      geoRoutingEnabled: this.config.geoRoutingEnabled,
      lastUpdated: Date.now()
    };
  }
}