"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoadBalancer = exports.LoadBalancingStrategy = void 0;
const events_1 = require("events");
const types_1 = require("../types");
var LoadBalancingStrategy;
(function (LoadBalancingStrategy) {
    LoadBalancingStrategy["ROUND_ROBIN"] = "round_robin";
    LoadBalancingStrategy["LEAST_CONNECTIONS"] = "least_connections";
    LoadBalancingStrategy["RANDOM"] = "random";
    LoadBalancingStrategy["WEIGHTED"] = "weighted";
})(LoadBalancingStrategy || (exports.LoadBalancingStrategy = LoadBalancingStrategy = {}));
class LoadBalancer extends events_1.EventEmitter {
    constructor(strategy, logger, connectionPool) {
        super();
        this.nodes = new Map();
        this.roundRobinIndex = 0;
        this.healthCheckInterval = null;
        this.strategy = strategy;
        this.logger = logger;
        this.connectionPool = connectionPool;
    }
    addNode(nodeInfo) {
        const stats = {
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
    removeNode(nodeId) {
        this.nodes.delete(nodeId);
        this.logger.info(`Removed node ${nodeId} from load balancer`);
    }
    updateNodeStats(nodeId, stats) {
        const nodeStats = this.nodes.get(nodeId);
        if (nodeStats) {
            Object.assign(nodeStats, stats);
        }
    }
    selectNode() {
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
    selectRoundRobin(nodes) {
        const node = nodes[this.roundRobinIndex % nodes.length];
        this.roundRobinIndex = (this.roundRobinIndex + 1) % nodes.length;
        return node.nodeId;
    }
    selectLeastConnections(nodes) {
        let minConnections = Infinity;
        let selectedNode = null;
        for (const node of nodes) {
            if (node.activeConnections < minConnections) {
                minConnections = node.activeConnections;
                selectedNode = node;
            }
        }
        return selectedNode.nodeId;
    }
    selectRandom(nodes) {
        const randomIndex = Math.floor(Math.random() * nodes.length);
        return nodes[randomIndex].nodeId;
    }
    selectWeighted(nodes) {
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
    calculateWeight(nodeInfo) {
        // Calculate weight based on node capabilities and status
        let weight = 1;
        if (nodeInfo.capabilities.includes(types_1.NodeCapability.COMPUTE)) {
            weight += 2;
        }
        if (nodeInfo.capabilities.includes(types_1.NodeCapability.STORAGE)) {
            weight += 1;
        }
        if (nodeInfo.capabilities.includes(types_1.NodeCapability.COORDINATION)) {
            weight += 1;
        }
        return weight;
    }
    startHealthChecks(interval = 30000) {
        this.healthCheckInterval = setInterval(async () => {
            await this.performHealthChecks();
        }, interval);
    }
    stopHealthChecks() {
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
            this.healthCheckInterval = null;
        }
    }
    async performHealthChecks() {
        const healthCheckPromises = Array.from(this.nodes.entries()).map(async ([nodeId, stats]) => {
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
            }
            catch (error) {
                stats.healthy = false;
                stats.lastHealthCheck = Date.now();
                this.logger.error(`Health check failed for node ${nodeId}`, error);
                this.emit('nodeUnhealthy', nodeId);
            }
        });
        await Promise.allSettled(healthCheckPromises);
    }
    getNodeStats() {
        return Array.from(this.nodes.values());
    }
    getHealthyNodes() {
        return Array.from(this.nodes.values())
            .filter(node => node.healthy)
            .map(node => node.nodeId);
    }
    getStats() {
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
exports.LoadBalancer = LoadBalancer;
//# sourceMappingURL=LoadBalancer.js.map