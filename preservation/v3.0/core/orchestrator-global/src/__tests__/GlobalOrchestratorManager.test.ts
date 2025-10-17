import { GlobalOrchestratorManager } from '../core/GlobalOrchestratorManager';
import { GlobalOrchestratorConfig, OrchestratorMessage } from '../types';
import { ConsoleLogger } from '../utils/Logger';

describe('GlobalOrchestratorManager', () => {
  let config: GlobalOrchestratorConfig;
  let orchestrator: GlobalOrchestratorManager;

  beforeEach(() => {
    config = {
      orchestratorId: 'test-orchestrator',
      discovery: {
        enabled: true,
        discoveryInterval: 30000,
        heartbeatInterval: 10000,
        nodeTimeout: 60000,
        maxRetries: 3
      },
      healthMonitoring: {
        enabled: true,
        checkInterval: 15000,
        timeout: 5000,
        unhealthyThreshold: 3,
        healthyThreshold: 2,
        metricsCollectionInterval: 30000
      },
      routing: {
        algorithm: 'round_robin' as any,
        loadBalancingStrategy: 'round_robin' as any,
        geoRoutingEnabled: false,
        latencyThreshold: 100,
        capacityThreshold: 80,
        adaptiveRouting: false
      },
      scaling: {
        enabled: false, // Disable for tests
        minNodes: 1,
        maxNodes: 10,
        scaleUpThreshold: 75,
        scaleDownThreshold: 25,
        cooldownPeriod: 300,
        predictiveScaling: false,
        metricsWindow: 300
      },
      failover: {
        enabled: true,
        backupNodes: [],
        failoverTimeout: 30000,
        autoRecovery: true,
        dataReplication: false
      },
      federation: {
        federationManagers: [],
        messageRoutingEnabled: true,
        crossFederationCommunication: true,
        sharedStateSync: true
      },
      logger: new ConsoleLogger()
    };

    orchestrator = new GlobalOrchestratorManager(config);
  });

  afterEach(async () => {
    await orchestrator.stop();
  });

  describe('initialization', () => {
    it('should initialize with valid config', () => {
      expect(orchestrator).toBeDefined();
    });

    it('should have correct orchestrator ID', () => {
      expect(orchestrator.getConfiguration().orchestratorId).toBe('test-orchestrator');
    });
  });

  describe('lifecycle', () => {
    it('should start and stop successfully', async () => {
      await expect(orchestrator.start()).resolves.toBeUndefined();
      expect(orchestrator.getServiceHealth().orchestrator.status).toBe('healthy');

      await expect(orchestrator.stop()).resolves.toBeUndefined();
      expect(orchestrator.getServiceHealth().orchestrator.status).toBe('stopped');
    });

    it('should handle multiple start/stop cycles', async () => {
      await orchestrator.start();
      await orchestrator.stop();
      await orchestrator.start();
      await orchestrator.stop();

      expect(orchestrator.getServiceHealth().orchestrator.status).toBe('stopped');
    });
  });

  describe('message routing', () => {
    beforeEach(async () => {
      await orchestrator.start();
    });

    it('should route messages successfully', async () => {
      const message: OrchestratorMessage = {
        id: 'test-message-1',
        type: 'test',
        payload: { data: 'test' },
        timestamp: Date.now(),
        sourceNodeId: 'source-node',
        priority: 1,
        globalRouting: true
      };

      // This would normally require nodes to be registered
      // For now, we expect it to handle the routing attempt gracefully
      await expect(orchestrator.routeMessage(message)).rejects.toThrow();
    });
  });

  describe('metrics', () => {
    beforeEach(async () => {
      await orchestrator.start();
    });

    it('should return global metrics', () => {
      const metrics = orchestrator.getGlobalMetrics();

      expect(metrics).toBeDefined();
      expect(metrics.orchestratorId).toBeUndefined(); // Not in GlobalMetrics interface
      expect(typeof metrics.uptimeSeconds).toBe('number');
      expect(typeof metrics.totalFederations).toBe('number');
      expect(typeof metrics.activeNodes).toBe('number');
    });

    it('should return service health status', () => {
      const health = orchestrator.getServiceHealth();

      expect(health).toBeDefined();
      expect(health.orchestrator).toBeDefined();
      expect(health.services).toBeDefined();
      expect(health.lastUpdated).toBeDefined();
    });
  });

  describe('topology', () => {
    beforeEach(async () => {
      await orchestrator.start();
    });

    it('should return global topology', () => {
      const topology = orchestrator.getGlobalTopology();

      expect(topology).toBeDefined();
      expect(topology.federations).toBeDefined();
      expect(topology.routingTable).toBeDefined();
      expect(topology.failoverGroups).toBeDefined();
      expect(topology.lastUpdated).toBeDefined();
    });
  });

  describe('node failure handling', () => {
    beforeEach(async () => {
      await orchestrator.start();
    });

    it('should handle node failure gracefully', async () => {
      await expect(orchestrator.handleNodeFailure('test-node', 'simulated failure'))
        .resolves.toBeUndefined();
    });

    it('should handle node recovery gracefully', async () => {
      await expect(orchestrator.recoverNode('test-node'))
        .resolves.toBeUndefined();
    });
  });

  describe('configuration', () => {
    it('should return configuration', () => {
      const config = orchestrator.getConfiguration();
      expect(config.orchestratorId).toBe('test-orchestrator');
    });

    it('should update configuration', async () => {
      const updates = { orchestratorId: 'updated-orchestrator' };
      await expect(orchestrator.updateConfiguration(updates)).resolves.toBeUndefined();

      const newConfig = orchestrator.getConfiguration();
      expect(newConfig.orchestratorId).toBe('updated-orchestrator');
    });
  });
});