import { EventEmitter } from 'events';
import {
  GlobalOrchestratorConfig,
  GlobalNodeInfo,
  GlobalMetrics,
  OrchestratorMessage,
  RoutingDecision,
  GlobalTopology,
  Logger,
  ConsoleLogger,
  GlobalOrchestratorError,
  GlobalOrchestratorErrorCode
} from '../types';
import { NodeDiscoveryService } from '../services/NodeDiscoveryService';
import { HealthMonitoringService } from '../services/HealthMonitoringService';
import { IntelligentRoutingService } from '../services/IntelligentRoutingService';
import { AutoScalingService } from '../services/AutoScalingService';
import { FailoverService } from '../services/FailoverService';
import { ConfigurationManager } from '../services/ConfigurationManager';

export class GlobalOrchestratorManager extends EventEmitter {
  private config: GlobalOrchestratorConfig;
  private logger: Logger;

  // Core services
  private discoveryService: NodeDiscoveryService;
  private healthService: HealthMonitoringService;
  private routingService: IntelligentRoutingService;
  private scalingService: AutoScalingService;
  private failoverService: FailoverService;
  private configManager: ConfigurationManager;

  // State
  private globalTopology: GlobalTopology;
  private isRunning = false;
  private startTime: number = 0;

  constructor(config: GlobalOrchestratorConfig) {
    super();
    this.config = config;
    this.logger = config.logger || new ConsoleLogger();

    // Initialize services
    this.discoveryService = new NodeDiscoveryService(this.config.discovery, this.logger);
    this.healthService = new HealthMonitoringService(this.config.healthMonitoring, this.logger);
    this.routingService = new IntelligentRoutingService(this.config.routing, this.logger);
    this.scalingService = new AutoScalingService(this.config.scaling, this.logger);
    this.failoverService = new FailoverService(this.config.failover, this.logger);
    this.configManager = new ConfigurationManager('./config/orchestrator-config.json', this.logger);

    // Initialize topology
    this.globalTopology = {
      federations: [],
      routingTable: new Map(),
      scalingPolicies: [],
      failoverGroups: [],
      lastUpdated: Date.now()
    };

    this.setupEventHandlers();
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      return;
    }

    try {
      this.logger.info(`Starting Global Orchestrator Manager: ${this.config.orchestratorId}`);

      // Initialize configuration
      await this.configManager.initialize();

      // Start all services
      await Promise.all([
        this.discoveryService.start(),
        this.healthService.start(),
        this.scalingService.start()
      ]);

      // Initialize routing with discovered nodes
      const discoveredNodes = this.discoveryService.getDiscoveredNodes();
      await this.routingService.initialize(discoveredNodes);

      this.startTime = Date.now();
      this.isRunning = true;

      this.logger.info('Global Orchestrator Manager started successfully');
      this.emit('started');
    } catch (error) {
      this.logger.error('Failed to start Global Orchestrator Manager', error as Error);
      throw new GlobalOrchestratorError(
        GlobalOrchestratorErrorCode.CONFIGURATION_ERROR,
        'Failed to start orchestrator manager',
        undefined,
        undefined,
        { originalError: (error as Error).message }
      );
    }
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    try {
      this.logger.info('Stopping Global Orchestrator Manager');

      // Stop all services
      await Promise.all([
        this.discoveryService.stop(),
        this.healthService.stop(),
        this.scalingService.stop()
      ]);

      this.configManager.destroy();
      this.isRunning = false;

      this.logger.info('Global Orchestrator Manager stopped successfully');
      this.emit('stopped');
    } catch (error) {
      this.logger.error('Error stopping Global Orchestrator Manager', error as Error);
    }
  }

  async routeMessage(message: OrchestratorMessage): Promise<RoutingDecision> {
    try {
      this.logger.debug(`Routing message: ${message.id} (${message.type})`);

      const decision = await this.routingService.routeMessage(message);

      // Update topology
      this.updateTopology();

      return decision;
    } catch (error) {
      this.logger.error('Failed to route message', error as Error);
      throw new GlobalOrchestratorError(
        GlobalOrchestratorErrorCode.ROUTING_FAILED,
        'Failed to route message',
        undefined,
        undefined,
        { messageId: message.id, originalError: (error as Error).message }
      );
    }
  }

  async handleNodeFailure(nodeId: string, reason: string): Promise<void> {
    try {
      this.logger.warn(`Handling node failure: ${nodeId}, reason: ${reason}`);

      // Update health status
      this.healthService.updateNodeHealth(nodeId, false);

      // Trigger failover
      await this.failoverService.handleNodeFailure(nodeId, reason);

      // Update routing
      this.routingService.removeNode(nodeId);

      // Trigger scaling evaluation
      // This would be called by the scaling service based on policies

      this.updateTopology();
      this.emit('nodeFailed', nodeId, reason);
    } catch (error) {
      this.logger.error(`Failed to handle node failure for ${nodeId}`, error as Error);
    }
  }

  async recoverNode(nodeId: string): Promise<void> {
    try {
      this.logger.info(`Recovering node: ${nodeId}`);

      // Update health status
      this.healthService.updateNodeHealth(nodeId, true);

      // Recover from failover
      await this.failoverService.recoverNode(nodeId);

      // Re-add to routing
      const node = this.discoveryService.getNodeById(nodeId);
      if (node) {
        this.routingService.addNode(node);
      }

      this.updateTopology();
      this.emit('nodeRecovered', nodeId);
    } catch (error) {
      this.logger.error(`Failed to recover node ${nodeId}`, error as Error);
    }
  }

  getGlobalTopology(): GlobalTopology {
    return { ...this.globalTopology };
  }

  getGlobalMetrics(): GlobalMetrics {
    const discoveryStats = this.discoveryService.getDiscoveryStats();
    const healthSummary = this.healthService.getHealthSummary();
    const routingStats = this.routingService.getRoutingStats();
    const scalingStats = this.scalingService.getScalingStats();
    const failoverStats = this.failoverService.getFailoverStats();

    return {
      messagesSent: 0, // Would be tracked
      messagesReceived: 0, // Would be tracked
      bytesSent: 0, // Would be tracked
      bytesReceived: 0, // Would be tracked
      connectionsActive: 0, // Would be tracked
      connectionsTotal: 0, // Would be tracked
      errorsTotal: 0, // Would be tracked
      latencyMs: 0, // Would be tracked
      uptimeSeconds: Math.floor((Date.now() - this.startTime) / 1000),
      totalFederations: discoveryStats.totalFederations,
      activeNodes: discoveryStats.totalNodes,
      routingDecisions: routingStats.totalRoutingDecisions,
      scalingEvents: scalingStats.totalScalingEvents,
      failoverEvents: failoverStats.totalFailoverEvents || 0,
      crossFederationMessages: 0, // Would be tracked
      averageLatency: 0, // Would be calculated
      errorRate: 0, // Would be calculated
      uptimePercentage: healthSummary.overallHealth === 'healthy' ? 100 : 95 // Simplified
    };
  }

  private setupEventHandlers(): void {
    // Discovery service events
    this.discoveryService.on('nodeDiscovered', (node: GlobalNodeInfo) => {
      this.logger.info(`Node discovered: ${node.nodeId} in federation ${node.federationId}`);
      this.routingService.addNode(node);
      this.updateTopology();
      this.emit('nodeDiscovered', node);
    });

    this.discoveryService.on('nodeLost', (node: GlobalNodeInfo) => {
      this.logger.warn(`Node lost: ${node.nodeId}`);
      this.routingService.removeNode(node.nodeId);
      this.updateTopology();
      this.emit('nodeLost', node);
    });

    // Health monitoring events
    this.healthService.on('nodeHealthy', (nodeId: string) => {
      this.logger.info(`Node healthy: ${nodeId}`);
      this.emit('nodeHealthy', nodeId);
    });

    this.healthService.on('nodeUnhealthy', (nodeId: string, reason: string) => {
      this.logger.warn(`Node unhealthy: ${nodeId}, reason: ${reason}`);
      this.handleNodeFailure(nodeId, reason);
    });

    // Scaling service events
    this.scalingService.on('scalingExecuted', (decision) => {
      this.logger.info(`Scaling executed: ${decision.action} for nodes: ${decision.targetNodes.join(', ')}`);
      this.updateTopology();
      this.emit('scalingExecuted', decision);
    });

    // Failover service events
    this.failoverService.on('failoverCompleted', (event, group) => {
      this.logger.info(`Failover completed: ${event.primaryNodeId} -> ${event.backupNodeId}`);
      this.updateTopology();
      this.emit('failoverCompleted', event, group);
    });

    // Configuration events
    this.configManager.on('configUpdated', (config) => {
      this.logger.info('Configuration updated');
      this.config = config;
      this.emit('configUpdated', config);
    });
  }

  private updateTopology(): void {
    const federations = new Map<string, GlobalNodeInfo[]>();

    // Group nodes by federation
    for (const node of this.discoveryService.getDiscoveredNodes()) {
      if (!federations.has(node.federationId)) {
        federations.set(node.federationId, []);
      }
      federations.get(node.federationId)!.push(node);
    }

    this.globalTopology = {
      federations: Array.from(federations.entries()).map(([federationId, nodes]) => ({
        federationId,
        nodes,
        leaderNodeId: nodes.find(n => n.capabilities.includes('federation_coordination'))?.nodeId,
        lastSync: Date.now(),
        capabilities: nodes.flatMap(n => n.capabilities),
        status: 'active' as any // Would be determined by federation state
      })),
      routingTable: this.routingService.getRoutingTable(),
      scalingPolicies: [], // Would be managed separately
      failoverGroups: this.failoverService.getFailoverGroups(),
      lastUpdated: Date.now()
    };

    this.emit('topologyUpdated', this.globalTopology);
  }

  // Administrative methods
  async updateConfiguration(updates: Partial<GlobalOrchestratorConfig>): Promise<void> {
    await this.configManager.updateConfig(updates);
  }

  getConfiguration(): GlobalOrchestratorConfig {
    return this.configManager.getConfig();
  }

  async manualScaling(action: 'scale_up' | 'scale_down', targetNodes: string[], reason: string): Promise<void> {
    await this.scalingService.manualScale(action as any, targetNodes, reason);
  }

  async manualFailover(groupId: string, targetNodeId: string, reason: string): Promise<void> {
    await this.failoverService.manualFailover(groupId, targetNodeId, reason);
  }

  // Integration with federation infrastructure
  async registerFederationManager(federationId: string, endpoint: string, auth: any): Promise<void> {
    // This would integrate with the federation manager
    this.logger.info(`Registering federation manager: ${federationId} at ${endpoint}`);
    // Implementation would add to config.federation.federationManagers
  }

  async unregisterFederationManager(federationId: string): Promise<void> {
    this.logger.info(`Unregistering federation manager: ${federationId}`);
    // Implementation would remove from config.federation.federationManagers
  }

  // Monitoring and diagnostics
  getServiceHealth(): any {
    return {
      orchestrator: {
        status: this.isRunning ? 'healthy' : 'stopped',
        uptime: this.isRunning ? Date.now() - this.startTime : 0
      },
      services: {
        discovery: 'healthy', // Would check actual service health
        health: 'healthy',
        routing: 'healthy',
        scaling: 'healthy',
        failover: 'healthy',
        config: 'healthy'
      },
      lastUpdated: Date.now()
    };
  }

  async performHealthCheck(): Promise<boolean> {
    try {
      // Check all services
      const servicesHealthy = [
        // Add actual health checks for each service
      ].every(healthy => healthy);

      return servicesHealthy;
    } catch (error) {
      this.logger.error('Health check failed', error as Error);
      return false;
    }
  }
}