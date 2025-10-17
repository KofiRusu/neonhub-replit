import { EventEmitter } from 'events';
import axios from 'axios';
import * as cron from 'node-cron';
import { v4 as uuidv4 } from 'uuid';
import {
  DiscoveryConfig,
  GlobalNodeInfo,
  GlobalOrchestratorError,
  GlobalOrchestratorErrorCode,
  Logger
} from '../types';

export class NodeDiscoveryService extends EventEmitter {
  private config: DiscoveryConfig;
  private logger: Logger;
  private discoveredNodes: Map<string, GlobalNodeInfo> = new Map();
  private discoveryTask?: cron.ScheduledTask;
  private heartbeatTask?: cron.ScheduledTask;
  private isRunning = false;

  constructor(config: DiscoveryConfig, logger: Logger) {
    super();
    this.config = config;
    this.logger = logger;
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      return;
    }

    try {
      this.logger.info('Starting node discovery service');

      // Start discovery polling
      if (this.config.enabled) {
        this.discoveryTask = cron.schedule(`*/${Math.floor(this.config.discoveryInterval / 60000)} * * * *`, () => {
          this.performDiscovery();
        });

        // Start heartbeat monitoring
        this.heartbeatTask = cron.schedule(`*/${Math.floor(this.config.heartbeatInterval / 60000)} * * * *`, () => {
          this.sendHeartbeats();
        });
      }

      this.isRunning = true;
      this.logger.info('Node discovery service started successfully');

      // Perform initial discovery
      await this.performDiscovery();
    } catch (error) {
      this.logger.error('Failed to start node discovery service', error);
      throw new GlobalOrchestratorError(
        GlobalOrchestratorErrorCode.DISCOVERY_FAILED,
        'Failed to start discovery service',
        undefined,
        undefined,
        { originalError: error.message }
      );
    }
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    try {
      this.logger.info('Stopping node discovery service');

      if (this.discoveryTask) {
        this.discoveryTask.destroy();
      }

      if (this.heartbeatTask) {
        this.heartbeatTask.destroy();
      }

      this.discoveredNodes.clear();
      this.isRunning = false;
      this.logger.info('Node discovery service stopped successfully');
    } catch (error) {
      this.logger.error('Error stopping node discovery service', error);
    }
  }

  private async performDiscovery(): Promise<void> {
    if (!this.config.serviceRegistryUrl) {
      this.logger.debug('No service registry URL configured, skipping discovery');
      return;
    }

    try {
      this.logger.debug('Performing node discovery');

      const response = await axios.get(`${this.config.serviceRegistryUrl}/nodes`, {
        timeout: 5000,
        headers: {
          'User-Agent': 'GlobalOrchestrator-Discovery/1.0'
        }
      });

      const nodes: GlobalNodeInfo[] = response.data.nodes || [];

      for (const node of nodes) {
        await this.registerNode(node);
      }

      this.logger.info(`Discovery completed, found ${nodes.length} nodes`);
    } catch (error) {
      this.logger.warn('Discovery request failed', { error: error.message });
    }
  }

  private async registerNode(nodeInfo: GlobalNodeInfo): Promise<void> {
    try {
      const existingNode = this.discoveredNodes.get(nodeInfo.nodeId);

      if (existingNode) {
        // Update existing node
        Object.assign(existingNode, nodeInfo);
        existingNode.lastHealthCheck = Date.now();
        this.logger.debug(`Updated existing node: ${nodeInfo.nodeId}`);
      } else {
        // Register new node
        nodeInfo.lastHealthCheck = Date.now();
        this.discoveredNodes.set(nodeInfo.nodeId, nodeInfo);
        this.emit('nodeDiscovered', nodeInfo);
        this.logger.info(`Discovered new node: ${nodeInfo.nodeId} in federation ${nodeInfo.federationId}`);
      }
    } catch (error) {
      this.logger.error(`Failed to register node ${nodeInfo.nodeId}`, error);
    }
  }

  private async sendHeartbeats(): Promise<void> {
    const now = Date.now();
    const timeoutThreshold = now - this.config.nodeTimeout;

    for (const [nodeId, node] of this.discoveredNodes) {
      try {
        // Check if node has timed out
        if (node.lastHealthCheck < timeoutThreshold) {
          this.logger.warn(`Node ${nodeId} has timed out`);
          this.discoveredNodes.delete(nodeId);
          this.emit('nodeLost', node);
          continue;
        }

        // Send heartbeat to node
        await this.sendHeartbeatToNode(node);
      } catch (error) {
        this.logger.warn(`Failed to send heartbeat to node ${nodeId}`, { error: error.message });
      }
    }
  }

  private async sendHeartbeatToNode(node: GlobalNodeInfo): Promise<void> {
    try {
      const heartbeatPayload = {
        orchestratorId: 'global-orchestrator',
        timestamp: Date.now(),
        sequence: uuidv4()
      };

      await axios.post(`http://${node.address}:${node.port}/heartbeat`, heartbeatPayload, {
        timeout: 2000
      });

      node.lastHealthCheck = Date.now();
      this.logger.debug(`Heartbeat sent to node ${node.nodeId}`);
    } catch (error) {
      this.logger.debug(`Heartbeat failed for node ${node.nodeId}`, { error: error.message });
      throw error;
    }
  }

  getDiscoveredNodes(): GlobalNodeInfo[] {
    return Array.from(this.discoveredNodes.values());
  }

  getNodesByFederation(federationId: string): GlobalNodeInfo[] {
    return Array.from(this.discoveredNodes.values())
      .filter(node => node.federationId === federationId);
  }

  getNodeById(nodeId: string): GlobalNodeInfo | undefined {
    return this.discoveredNodes.get(nodeId);
  }

  async manuallyRegisterNode(nodeInfo: GlobalNodeInfo): Promise<void> {
    await this.registerNode(nodeInfo);
  }

  async unregisterNode(nodeId: string): Promise<void> {
    const node = this.discoveredNodes.get(nodeId);
    if (node) {
      this.discoveredNodes.delete(nodeId);
      this.emit('nodeUnregistered', node);
      this.logger.info(`Manually unregistered node: ${nodeId}`);
    }
  }

  getDiscoveryStats(): any {
    const nodes = Array.from(this.discoveredNodes.values());
    const federations = new Set(nodes.map(n => n.federationId));

    return {
      totalNodes: nodes.length,
      totalFederations: federations.size,
      nodesByFederation: Object.fromEntries(
        Array.from(federations).map(fedId => [
          fedId,
          nodes.filter(n => n.federationId === fedId).length
        ])
      ),
      lastDiscovery: Date.now()
    };
  }
}