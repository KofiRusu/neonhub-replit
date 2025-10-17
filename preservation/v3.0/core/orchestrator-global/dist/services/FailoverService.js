"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FailoverService = void 0;
const events_1 = require("events");
const types_1 = require("../types");
class FailoverService extends events_1.EventEmitter {
    constructor(config, logger) {
        super();
        this.failoverGroups = new Map();
        this.activeFailovers = new Map();
        this.nodeHealthStatus = new Map();
        this.config = config;
        this.logger = logger;
    }
    initializeFailoverGroups(groups) {
        for (const group of groups) {
            this.failoverGroups.set(group.groupId, group);
            this.logger.info(`Initialized failover group: ${group.groupId}`);
        }
    }
    async handleNodeFailure(nodeId, failureReason) {
        try {
            this.logger.warn(`Handling node failure: ${nodeId}, reason: ${failureReason}`);
            // Mark node as unhealthy
            this.nodeHealthStatus.set(nodeId, false);
            // Find failover groups containing this node
            const affectedGroups = Array.from(this.failoverGroups.values())
                .filter(group => group.primaryNodeId === nodeId || group.backupNodeIds.includes(nodeId));
            for (const group of affectedGroups) {
                await this.initiateFailover(group, nodeId, failureReason);
            }
        }
        catch (error) {
            this.logger.error('Failed to handle node failure', error);
            throw new types_1.GlobalOrchestratorError(types_1.GlobalOrchestratorErrorCode.FAILOVER_FAILED, 'Failed to handle node failure', nodeId, undefined, { originalError: error.message });
        }
    }
    async initiateFailover(group, failedNodeId, reason) {
        if (!this.config.enabled) {
            this.logger.info('Failover disabled, skipping failover initiation');
            return;
        }
        const failoverEvent = {
            type: this.determineFailoverType(group, failedNodeId),
            primaryNodeId: group.primaryNodeId,
            backupNodeId: this.selectBackupNode(group, failedNodeId),
            reason,
            timestamp: Date.now()
        };
        // Check if failover is already in progress for this group
        if (this.activeFailovers.has(group.groupId)) {
            this.logger.warn(`Failover already in progress for group ${group.groupId}`);
            return;
        }
        this.activeFailovers.set(group.groupId, failoverEvent);
        this.logger.info(`Initiating failover for group ${group.groupId}: ${failedNodeId} -> ${failoverEvent.backupNodeId}`);
        try {
            // Execute failover
            await this.executeFailover(failoverEvent, group);
            // Update group state
            if (failoverEvent.type === types_1.FailoverType.AUTOMATIC) {
                group.primaryNodeId = failoverEvent.backupNodeId;
                // Remove the new primary from backup list and add failed node as backup
                group.backupNodeIds = group.backupNodeIds.filter(id => id !== failoverEvent.backupNodeId);
                if (!group.backupNodeIds.includes(failedNodeId)) {
                    group.backupNodeIds.push(failedNodeId);
                }
            }
            this.emit('failoverCompleted', failoverEvent, group);
            this.logger.info(`Failover completed for group ${group.groupId}`);
        }
        catch (error) {
            this.logger.error(`Failover failed for group ${group.groupId}`, error);
            this.emit('failoverFailed', failoverEvent, group, error);
            throw error;
        }
        finally {
            this.activeFailovers.delete(group.groupId);
        }
    }
    determineFailoverType(group, failedNodeId) {
        if (group.failoverStrategy === 'automatic' && this.config.autoRecovery) {
            return types_1.FailoverType.AUTOMATIC;
        }
        return types_1.FailoverType.MANUAL;
    }
    selectBackupNode(group, failedNodeId) {
        // Find the healthiest backup node
        const availableBackups = group.backupNodeIds.filter(nodeId => {
            const isHealthy = this.nodeHealthStatus.get(nodeId) !== false; // Default to healthy if unknown
            return isHealthy && nodeId !== failedNodeId;
        });
        if (availableBackups.length === 0) {
            throw new types_1.GlobalOrchestratorError(types_1.GlobalOrchestratorErrorCode.FAILOVER_FAILED, 'No healthy backup nodes available', failedNodeId);
        }
        // For now, return the first available backup
        // In a real implementation, this could consider load, priority, etc.
        return availableBackups[0];
    }
    async executeFailover(failoverEvent, group) {
        this.logger.info(`Executing failover: ${failoverEvent.primaryNodeId} -> ${failoverEvent.backupNodeId}`);
        // This would involve:
        // 1. Transferring active connections
        // 2. Migrating state/data if needed
        // 3. Updating routing tables
        // 4. Notifying dependent services
        // Simulate failover execution time
        await new Promise(resolve => setTimeout(resolve, 2000));
        // Update health status
        this.nodeHealthStatus.set(failoverEvent.backupNodeId, true);
        failoverEvent.recoveryTime = Date.now() - failoverEvent.timestamp;
        this.logger.info(`Failover executed in ${failoverEvent.recoveryTime}ms`);
    }
    async manualFailover(groupId, targetNodeId, reason) {
        const group = this.failoverGroups.get(groupId);
        if (!group) {
            throw new types_1.GlobalOrchestratorError(types_1.GlobalOrchestratorErrorCode.FAILOVER_FAILED, `Failover group ${groupId} not found`);
        }
        if (!group.backupNodeIds.includes(targetNodeId) && group.primaryNodeId !== targetNodeId) {
            throw new types_1.GlobalOrchestratorError(types_1.GlobalOrchestratorErrorCode.FAILOVER_FAILED, `Node ${targetNodeId} is not a valid failover target for group ${groupId}`);
        }
        const failoverEvent = {
            type: types_1.FailoverType.MANUAL,
            primaryNodeId: group.primaryNodeId,
            backupNodeId: targetNodeId,
            reason,
            timestamp: Date.now()
        };
        await this.executeFailover(failoverEvent, group);
        // Update group state for manual failover
        group.primaryNodeId = targetNodeId;
        this.emit('manualFailoverCompleted', failoverEvent, group);
    }
    async recoverNode(nodeId) {
        try {
            this.logger.info(`Attempting to recover node: ${nodeId}`);
            // Mark node as healthy
            this.nodeHealthStatus.set(nodeId, true);
            // Find groups where this node is a backup
            const affectedGroups = Array.from(this.failoverGroups.values())
                .filter(group => group.backupNodeIds.includes(nodeId));
            for (const group of affectedGroups) {
                // Optionally trigger failback if configured
                if (this.config.autoRecovery) {
                    await this.attemptFailback(group, nodeId);
                }
            }
            this.emit('nodeRecovered', nodeId);
            this.logger.info(`Node recovery completed: ${nodeId}`);
        }
        catch (error) {
            this.logger.error(`Failed to recover node ${nodeId}`, error);
            throw new types_1.GlobalOrchestratorError(types_1.GlobalOrchestratorErrorCode.FAILOVER_FAILED, 'Failed to recover node', nodeId, undefined, { originalError: error.message });
        }
    }
    async attemptFailback(group, recoveredNodeId) {
        // This would implement failback logic to restore original primary
        // For now, just log the attempt
        this.logger.info(`Attempting failback for group ${group.groupId} to node ${recoveredNodeId}`);
    }
    getFailoverGroups() {
        return Array.from(this.failoverGroups.values());
    }
    getActiveFailovers() {
        return Array.from(this.activeFailovers.values());
    }
    getNodeHealthStatus(nodeId) {
        return this.nodeHealthStatus.get(nodeId) ?? true; // Default to healthy
    }
    updateNodeHealth(nodeId, isHealthy) {
        const previousStatus = this.nodeHealthStatus.get(nodeId);
        this.nodeHealthStatus.set(nodeId, isHealthy);
        if (previousStatus !== isHealthy) {
            this.emit(isHealthy ? 'nodeHealthy' : 'nodeUnhealthy', nodeId);
        }
    }
    getFailoverStats() {
        const completedFailovers = this.getActiveFailovers().filter(f => f.recoveryTime);
        const averageRecoveryTime = completedFailovers.length > 0
            ? completedFailovers.reduce((sum, f) => sum + (f.recoveryTime || 0), 0) / completedFailovers.length
            : 0;
        return {
            totalGroups: this.failoverGroups.size,
            activeFailovers: this.activeFailovers.size,
            totalFailoverEvents: completedFailovers.length,
            averageRecoveryTime,
            enabled: this.config.enabled,
            autoRecovery: this.config.autoRecovery,
            lastUpdated: Date.now()
        };
    }
    createFailoverGroup(group) {
        const groupId = `failover-group-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newGroup = { ...group, groupId };
        this.failoverGroups.set(groupId, newGroup);
        this.logger.info(`Created failover group: ${groupId}`);
        return groupId;
    }
    removeFailoverGroup(groupId) {
        if (this.failoverGroups.delete(groupId)) {
            this.logger.info(`Removed failover group: ${groupId}`);
        }
    }
}
exports.FailoverService = FailoverService;
//# sourceMappingURL=FailoverService.js.map