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
exports.HealthMonitoringService = void 0;
const events_1 = require("events");
const axios_1 = __importDefault(require("axios"));
const cron = __importStar(require("node-cron"));
const types_1 = require("../types");
class HealthMonitoringService extends events_1.EventEmitter {
    constructor(config, logger) {
        super();
        this.nodeHealthStatus = new Map();
        this.nodeMetrics = new Map();
        this.isRunning = false;
        this.config = config;
        this.logger = logger;
    }
    async start() {
        if (this.isRunning) {
            return;
        }
        try {
            this.logger.info('Starting health monitoring service');
            if (this.config.enabled) {
                // Start health check polling
                this.healthCheckTask = cron.schedule(`*/${Math.floor(this.config.checkInterval / 60000)} * * * *`, () => {
                    this.performHealthChecks();
                });
                // Start metrics collection
                this.metricsCollectionTask = cron.schedule(`*/${Math.floor(this.config.metricsCollectionInterval / 60000)} * * * *`, () => {
                    this.collectMetrics();
                });
            }
            this.isRunning = true;
            this.logger.info('Health monitoring service started successfully');
        }
        catch (error) {
            this.logger.error('Failed to start health monitoring service', error);
            throw new types_1.GlobalOrchestratorError(types_1.GlobalOrchestratorErrorCode.HEALTH_CHECK_FAILED, 'Failed to start health monitoring service', undefined, undefined, { originalError: error.message });
        }
    }
    async stop() {
        if (!this.isRunning) {
            return;
        }
        try {
            this.logger.info('Stopping health monitoring service');
            if (this.healthCheckTask) {
                this.healthCheckTask.destroy();
            }
            if (this.metricsCollectionTask) {
                this.metricsCollectionTask.destroy();
            }
            this.nodeHealthStatus.clear();
            this.nodeMetrics.clear();
            this.isRunning = false;
            this.logger.info('Health monitoring service stopped successfully');
        }
        catch (error) {
            this.logger.error('Error stopping health monitoring service', error);
        }
    }
    async performHealthChecks() {
        // This would be called with a list of nodes to check
        // For now, we'll implement the logic to check individual nodes
        this.logger.debug('Performing health checks');
    }
    async checkNodeHealth(node) {
        try {
            const healthCheckUrl = `http://${node.address}:${node.port}/health`;
            const response = await axios_1.default.get(healthCheckUrl, {
                timeout: this.config.timeout,
                headers: {
                    'User-Agent': 'GlobalOrchestrator-HealthCheck/1.0'
                }
            });
            const isHealthy = response.status === 200 && response.data.status === 'healthy';
            const newStatus = isHealthy ? types_1.HealthStatus.HEALTHY : types_1.HealthStatus.UNHEALTHY;
            const previousStatus = this.nodeHealthStatus.get(node.nodeId);
            if (previousStatus !== newStatus) {
                this.nodeHealthStatus.set(node.nodeId, newStatus);
                this.emit(isHealthy ? 'nodeHealthy' : 'nodeUnhealthy', node, previousStatus);
                this.logger.info(`Node ${node.nodeId} health status changed: ${previousStatus} -> ${newStatus}`);
            }
            node.healthStatus = newStatus;
            node.lastHealthCheck = Date.now();
            return newStatus;
        }
        catch (error) {
            const newStatus = types_1.HealthStatus.UNHEALTHY;
            const previousStatus = this.nodeHealthStatus.get(node.nodeId);
            if (previousStatus !== newStatus) {
                this.nodeHealthStatus.set(node.nodeId, newStatus);
                this.emit('nodeUnhealthy', node, previousStatus, error.message);
                this.logger.warn(`Node ${node.nodeId} health check failed: ${error.message}`);
            }
            node.healthStatus = newStatus;
            node.lastHealthCheck = Date.now();
            return newStatus;
        }
    }
    async collectMetrics() {
        // This would collect metrics from all known nodes
        this.logger.debug('Collecting node metrics');
    }
    async collectNodeMetrics(node) {
        try {
            const metricsUrl = `http://${node.address}:${node.port}/metrics`;
            const response = await axios_1.default.get(metricsUrl, {
                timeout: 5000,
                headers: {
                    'User-Agent': 'GlobalOrchestrator-Metrics/1.0'
                }
            });
            const metrics = {
                ...response.data,
                timestamp: Date.now()
            };
            // Store metrics history (keep last 100 entries)
            const nodeMetricsHistory = this.nodeMetrics.get(node.nodeId) || [];
            nodeMetricsHistory.push(metrics);
            if (nodeMetricsHistory.length > 100) {
                nodeMetricsHistory.shift();
            }
            this.nodeMetrics.set(node.nodeId, nodeMetricsHistory);
            // Update node load metrics
            node.loadMetrics = metrics;
            this.logger.debug(`Collected metrics for node ${node.nodeId}`);
            return metrics;
        }
        catch (error) {
            this.logger.warn(`Failed to collect metrics for node ${node.nodeId}: ${error.message}`);
            return null;
        }
    }
    getNodeHealthStatus(nodeId) {
        return this.nodeHealthStatus.get(nodeId) || types_1.HealthStatus.UNKNOWN;
    }
    getNodeMetrics(nodeId, limit = 10) {
        const metrics = this.nodeMetrics.get(nodeId) || [];
        return metrics.slice(-limit);
    }
    getAllNodeHealthStatuses() {
        return new Map(this.nodeHealthStatus);
    }
    getHealthyNodes() {
        return Array.from(this.nodeHealthStatus.entries())
            .filter(([, status]) => status === types_1.HealthStatus.HEALTHY)
            .map(([nodeId]) => nodeId);
    }
    getUnhealthyNodes() {
        return Array.from(this.nodeHealthStatus.entries())
            .filter(([, status]) => status === types_1.HealthStatus.UNHEALTHY)
            .map(([nodeId]) => nodeId);
    }
    getHealthSummary() {
        const statuses = Array.from(this.nodeHealthStatus.values());
        const healthy = statuses.filter(s => s === types_1.HealthStatus.HEALTHY).length;
        const unhealthy = statuses.filter(s => s === types_1.HealthStatus.UNHEALTHY).length;
        const degraded = statuses.filter(s => s === types_1.HealthStatus.DEGRADED).length;
        const unknown = statuses.filter(s => s === types_1.HealthStatus.UNKNOWN).length;
        return {
            totalNodes: statuses.length,
            healthy,
            unhealthy,
            degraded,
            unknown,
            overallHealth: unhealthy === 0 ? 'healthy' : degraded === 0 ? 'degraded' : 'unhealthy',
            lastUpdated: Date.now()
        };
    }
    updateNodeHealth(nodeId, isHealthy) {
        const status = isHealthy ? types_1.HealthStatus.HEALTHY : types_1.HealthStatus.UNHEALTHY;
        this.nodeHealthStatus.set(nodeId, status);
        this.logger.debug(`Updated health status for node ${nodeId}: ${status}`);
    }
    calculateAverageLoad(nodeIds) {
        let nodesToCheck = nodeIds;
        if (!nodesToCheck) {
            nodesToCheck = Array.from(this.nodeMetrics.keys());
        }
        const allMetrics = [];
        for (const nodeId of nodesToCheck) {
            const metrics = this.nodeMetrics.get(nodeId);
            if (metrics && metrics.length > 0) {
                allMetrics.push(metrics[metrics.length - 1]); // Get latest metrics
            }
        }
        if (allMetrics.length === 0) {
            return null;
        }
        return {
            cpuUsage: allMetrics.reduce((sum, m) => sum + m.cpuUsage, 0) / allMetrics.length,
            memoryUsage: allMetrics.reduce((sum, m) => sum + m.memoryUsage, 0) / allMetrics.length,
            activeConnections: Math.round(allMetrics.reduce((sum, m) => sum + m.activeConnections, 0) / allMetrics.length),
            requestRate: allMetrics.reduce((sum, m) => sum + m.requestRate, 0) / allMetrics.length,
            errorRate: allMetrics.reduce((sum, m) => sum + m.errorRate, 0) / allMetrics.length,
            responseTime: allMetrics.reduce((sum, m) => sum + m.responseTime, 0) / allMetrics.length,
            timestamp: Date.now()
        };
    }
}
exports.HealthMonitoringService = HealthMonitoringService;
//# sourceMappingURL=HealthMonitoringService.js.map