"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodeDiscoveryService = void 0;
const events_1 = require("events");
const axios_1 = __importDefault(require("axios"));
const cron = __importStar(require("node-cron"));
const uuid_1 = require("uuid");
const types_1 = require("../types");
class NodeDiscoveryService extends events_1.EventEmitter {
    constructor(config, logger) {
        super();
        this.discoveredNodes = new Map();
        this.isRunning = false;
        this.config = config;
        this.logger = logger;
    }
    async start() {
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
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error('Failed to start node discovery service', error);
            throw new types_1.GlobalOrchestratorError(types_1.GlobalOrchestratorErrorCode.DISCOVERY_FAILED, 'Failed to start discovery service', undefined, undefined, { originalError: message });
        }
    }
    async stop() {
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
        }
        catch (error) {
            this.logger.error('Error stopping node discovery service', error);
        }
    }
    async performDiscovery() {
        if (!this.config.serviceRegistryUrl) {
            this.logger.debug('No service registry URL configured, skipping discovery');
            return;
        }
        try {
            this.logger.debug('Performing node discovery');
            const response = await axios_1.default.get(`${this.config.serviceRegistryUrl}/nodes`, {
                timeout: 5000,
                headers: {
                    'User-Agent': 'GlobalOrchestrator-Discovery/1.0'
                }
            });
            const nodes = response.data.nodes || [];
            for (const node of nodes) {
                await this.registerNode(node);
            }
            this.logger.info(`Discovery completed, found ${nodes.length} nodes`);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            this.logger.warn('Discovery request failed', { error: message });
        }
    }
    async registerNode(nodeInfo) {
        try {
            const existingNode = this.discoveredNodes.get(nodeInfo.nodeId);
            if (existingNode) {
                // Update existing node
                Object.assign(existingNode, nodeInfo);
                existingNode.lastHealthCheck = Date.now();
                this.logger.debug(`Updated existing node: ${nodeInfo.nodeId}`);
            }
            else {
                // Register new node
                nodeInfo.lastHealthCheck = Date.now();
                this.discoveredNodes.set(nodeInfo.nodeId, nodeInfo);
                this.emit('nodeDiscovered', nodeInfo);
                this.logger.info(`Discovered new node: ${nodeInfo.nodeId} in federation ${nodeInfo.federationId}`);
            }
        }
        catch (error) {
            this.logger.error(`Failed to register node ${nodeInfo.nodeId}`, error);
        }
    }
    async sendHeartbeats() {
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
            }
            catch (error) {
                const message = error instanceof Error ? error.message : 'Unknown error';
                this.logger.warn(`Failed to send heartbeat to node ${nodeId}`, { error: message });
            }
        }
    }
    async sendHeartbeatToNode(node) {
        try {
            const heartbeatPayload = {
                orchestratorId: 'global-orchestrator',
                timestamp: Date.now(),
                sequence: (0, uuid_1.v4)()
            };
            await axios_1.default.post(`http://${node.address}:${node.port}/heartbeat`, heartbeatPayload, {
                timeout: 2000
            });
            node.lastHealthCheck = Date.now();
            this.logger.debug(`Heartbeat sent to node ${node.nodeId}`);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            this.logger.debug(`Heartbeat failed for node ${node.nodeId}`, { error: message });
            throw error;
        }
    }
    getDiscoveredNodes() {
        return Array.from(this.discoveredNodes.values());
    }
    getNodesByFederation(federationId) {
        return Array.from(this.discoveredNodes.values())
            .filter(node => node.federationId === federationId);
    }
    getNodeById(nodeId) {
        return this.discoveredNodes.get(nodeId);
    }
    async manuallyRegisterNode(nodeInfo) {
        await this.registerNode(nodeInfo);
    }
    async unregisterNode(nodeId) {
        const node = this.discoveredNodes.get(nodeId);
        if (node) {
            this.discoveredNodes.delete(nodeId);
            this.emit('nodeUnregistered', node);
            this.logger.info(`Manually unregistered node: ${nodeId}`);
        }
    }
    getDiscoveryStats() {
        const nodes = Array.from(this.discoveredNodes.values());
        const federations = new Set(nodes.map(n => n.federationId));
        return {
            totalNodes: nodes.length,
            totalFederations: federations.size,
            nodesByFederation: Object.fromEntries(Array.from(federations).map(fedId => [
                fedId,
                nodes.filter(n => n.federationId === fedId).length
            ])),
            lastDiscovery: Date.now()
        };
    }
}
exports.NodeDiscoveryService = NodeDiscoveryService;
//# sourceMappingURL=NodeDiscoveryService.js.map