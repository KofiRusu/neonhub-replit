import { EventEmitter } from 'events';
import { FederationError, FederationErrorCode } from '../types';
import { GRPCClient } from '../grpc/GRPCClient';
export class HealthChecker extends EventEmitter {
    constructor(config, logger) {
        super();
        this.healthStatuses = new Map();
        this.checkInterval = null;
        this.grpcClients = new Map();
        this.config = config;
        this.logger = logger;
    }
    start() {
        this.logger.info('Starting health checker');
        this.checkInterval = setInterval(() => {
            this.performHealthChecks();
        }, this.config.interval);
    }
    stop() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
        this.logger.info('Stopped health checker');
    }
    addNode(nodeInfo) {
        const status = {
            nodeId: nodeInfo.nodeId,
            healthy: true,
            lastCheck: 0,
            consecutiveFailures: 0,
            responseTime: 0,
        };
        this.healthStatuses.set(nodeInfo.nodeId, status);
        // Create gRPC client for health checks
        const grpcClient = new GRPCClient(nodeInfo.nodeId, {
            host: nodeInfo.address,
            port: 9090, // Default gRPC port
            tls: { enabled: false } // Would be configured based on node settings
        }, this.logger);
        this.grpcClients.set(nodeInfo.nodeId, grpcClient);
        this.logger.info(`Added node ${nodeInfo.nodeId} to health checker`);
    }
    removeNode(nodeId) {
        this.healthStatuses.delete(nodeId);
        const grpcClient = this.grpcClients.get(nodeId);
        if (grpcClient) {
            grpcClient.disconnect();
            this.grpcClients.delete(nodeId);
        }
        this.logger.info(`Removed node ${nodeId} from health checker`);
    }
    async performHealthChecks() {
        const checkPromises = Array.from(this.healthStatuses.entries()).map(async ([nodeId, status]) => {
            await this.checkNodeHealth(nodeId, status);
        });
        await Promise.allSettled(checkPromises);
    }
    async checkNodeHealth(nodeId, status) {
        const grpcClient = this.grpcClients.get(nodeId);
        if (!grpcClient) {
            this.logger.warn(`No gRPC client found for node ${nodeId}`);
            return;
        }
        const startTime = Date.now();
        try {
            const result = await this.performHealthCheck(grpcClient);
            const responseTime = Date.now() - startTime;
            status.lastCheck = Date.now();
            status.responseTime = responseTime;
            status.error = undefined;
            if (result.healthy) {
                status.healthy = true;
                status.consecutiveFailures = 0;
                this.logger.debug(`Node ${nodeId} is healthy (response time: ${responseTime}ms)`);
            }
            else {
                this.handleUnhealthyNode(nodeId, status, 'Health check returned unhealthy');
            }
        }
        catch (error) {
            const responseTime = Date.now() - startTime;
            const message = error instanceof Error ? error.message : 'Unknown error';
            status.responseTime = responseTime;
            status.lastCheck = Date.now();
            status.error = message;
            this.handleUnhealthyNode(nodeId, status, message);
        }
    }
    async performHealthCheck(grpcClient) {
        try {
            const result = await grpcClient.healthCheck();
            return { healthy: result.healthy };
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            throw new FederationError(FederationErrorCode.HEALTH_CHECK_FAILED, message);
        }
    }
    handleUnhealthyNode(nodeId, status, error) {
        status.consecutiveFailures++;
        this.logger.warn(`Node ${nodeId} health check failed (${status.consecutiveFailures}/${this.config.unhealthyThreshold}): ${error}`);
        if (status.consecutiveFailures >= this.config.unhealthyThreshold) {
            if (status.healthy) {
                status.healthy = false;
                this.emit('nodeUnhealthy', nodeId, error);
                this.logger.error(`Node ${nodeId} marked as unhealthy`);
            }
        }
        else if (status.consecutiveFailures >= this.config.healthyThreshold) {
            // Node was unhealthy but has recovered
            if (!status.healthy) {
                status.healthy = true;
                status.consecutiveFailures = 0;
                this.emit('nodeHealthy', nodeId);
                this.logger.info(`Node ${nodeId} recovered and marked as healthy`);
            }
        }
    }
    isNodeHealthy(nodeId) {
        const status = this.healthStatuses.get(nodeId);
        return status?.healthy ?? false;
    }
    getHealthStatus(nodeId) {
        return this.healthStatuses.get(nodeId) || null;
    }
    getAllHealthStatuses() {
        return Array.from(this.healthStatuses.values());
    }
    getHealthyNodes() {
        return Array.from(this.healthStatuses.values())
            .filter(status => status.healthy)
            .map(status => status.nodeId);
    }
    getUnhealthyNodes() {
        return Array.from(this.healthStatuses.values())
            .filter(status => !status.healthy)
            .map(status => status.nodeId);
    }
    getStats() {
        const statuses = Array.from(this.healthStatuses.values());
        const totalNodes = statuses.length;
        const healthyNodes = statuses.filter(s => s.healthy).length;
        const averageResponseTime = statuses.length > 0
            ? statuses.reduce((sum, s) => sum + s.responseTime, 0) / statuses.length
            : 0;
        return {
            totalNodes,
            healthyNodes,
            unhealthyNodes: totalNodes - healthyNodes,
            averageResponseTime,
        };
    }
}
//# sourceMappingURL=HealthChecker.js.map