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
Object.defineProperty(exports, "__esModule", { value: true });
exports.QASelfHealingIntegration = void 0;
const events_1 = require("events");
const winston = __importStar(require("winston"));
class QASelfHealingIntegration extends events_1.EventEmitter {
    constructor(selfHealingManager) {
        super();
        this.activeTriggers = new Map();
        this.selfHealingManager = selfHealingManager;
        this.logger = winston.createLogger({
            level: 'info',
            format: winston.format.combine(winston.format.timestamp(), winston.format.errors({ stack: true }), winston.format.json()),
            defaultMeta: { service: 'qa-self-healing-integration' },
            transports: [
                new winston.transports.File({ filename: 'logs/qa-self-healing.log' }),
                new winston.transports.Console({
                    format: winston.format.simple()
                })
            ]
        });
        this.setupEventHandlers();
    }
    setupEventHandlers() {
        // Listen to self-healing manager events
        this.selfHealingManager.on('repair:completed', this.handleRepairCompleted.bind(this));
        this.selfHealingManager.on('repair:failed', this.handleRepairFailed.bind(this));
    }
    async triggerSelfHealing(anomaly) {
        this.logger.info('Triggering self-healing for anomaly', { anomalyId: anomaly.id, type: anomaly.type });
        // Determine appropriate repair action based on anomaly
        const repairAction = this.determineRepairAction(anomaly);
        const trigger = {
            id: `qa-trigger-${Date.now()}-${Math.random()}`,
            anomaly,
            action: repairAction,
            triggeredAt: new Date(),
            status: 'pending'
        };
        this.activeTriggers.set(trigger.id, trigger);
        try {
            // Execute the repair action
            trigger.status = 'executing';
            // Note: In a real implementation, we would call the appropriate method
            // from SelfHealingManager. For now, we'll simulate the execution.
            await this.simulateRepairExecution(repairAction);
            trigger.status = 'completed';
            trigger.result = { success: true, message: 'Repair completed successfully' };
            this.logger.info('Self-healing completed successfully', { triggerId: trigger.id });
        }
        catch (error) {
            trigger.status = 'failed';
            trigger.result = { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
            this.logger.error('Self-healing failed', { triggerId: trigger.id, error });
        }
        this.emit('self-healing:completed', trigger);
        return trigger;
    }
    determineRepairAction(anomaly) {
        let actionType = 'restart';
        let component = 'unknown';
        let priority = 'medium';
        // Determine component from anomaly metric
        if (anomaly.metric.includes('api') || anomaly.metric.includes('response_time')) {
            component = 'api';
        }
        else if (anomaly.metric.includes('database') || anomaly.metric.includes('db')) {
            component = 'database';
        }
        else if (anomaly.metric.includes('agent')) {
            component = 'agents';
        }
        else if (anomaly.metric.includes('cpu') || anomaly.metric.includes('memory')) {
            component = 'infrastructure';
        }
        // Determine action type and priority based on anomaly type and severity
        switch (anomaly.type) {
            case 'performance':
                if (anomaly.severity === 'critical') {
                    actionType = 'restart';
                    priority = 'critical';
                }
                else if (anomaly.severity === 'high') {
                    actionType = 'scale';
                    priority = 'high';
                }
                else {
                    actionType = 'reconfigure';
                    priority = 'medium';
                }
                break;
            case 'error':
                if (anomaly.severity === 'critical') {
                    actionType = 'rollback';
                    priority = 'critical';
                }
                else {
                    actionType = 'restart';
                    priority = 'high';
                }
                break;
            case 'resource':
                if (anomaly.severity === 'critical') {
                    actionType = 'scale';
                    priority = 'critical';
                }
                else {
                    actionType = 'reconfigure';
                    priority = 'medium';
                }
                break;
            case 'behavior':
                actionType = 'patch';
                priority = 'low';
                break;
        }
        return {
            id: `repair-${Date.now()}`,
            component,
            action: actionType,
            priority,
            estimatedDuration: this.getEstimatedDuration(actionType, priority),
            success: false,
            timestamp: new Date()
        };
    }
    getEstimatedDuration(actionType, priority) {
        const baseDurations = {
            restart: 30000, // 30 seconds
            scale: 120000, // 2 minutes
            rollback: 300000, // 5 minutes
            patch: 60000, // 1 minute
            reconfigure: 45000 // 45 seconds
        };
        const baseDuration = baseDurations[actionType] || 30000;
        // Adjust duration based on priority
        const priorityMultiplier = {
            low: 0.8,
            medium: 1.0,
            high: 1.2,
            critical: 1.5
        };
        return baseDuration * (priorityMultiplier[priority] || 1.0);
    }
    async simulateRepairExecution(action) {
        // Simulate repair execution time
        await new Promise(resolve => setTimeout(resolve, action.estimatedDuration));
        // Simulate success/failure (90% success rate)
        if (Math.random() > 0.1) {
            action.success = true;
        }
        else {
            throw new Error(`Simulated repair failure for ${action.component}`);
        }
    }
    handleRepairCompleted(event) {
        this.logger.info('Repair completed event received', { event });
        // Find related QA trigger
        const relatedTrigger = Array.from(this.activeTriggers.values())
            .find(trigger => trigger.action.id === event.repairId);
        if (relatedTrigger) {
            relatedTrigger.status = 'completed';
            relatedTrigger.result = event.result;
            this.emit('qa-repair:completed', relatedTrigger);
        }
    }
    handleRepairFailed(event) {
        this.logger.error('Repair failed event received', { event });
        // Find related QA trigger
        const relatedTrigger = Array.from(this.activeTriggers.values())
            .find(trigger => trigger.action.id === event.repairId);
        if (relatedTrigger) {
            relatedTrigger.status = 'failed';
            relatedTrigger.result = { error: event.error };
            this.emit('qa-repair:failed', relatedTrigger);
        }
    }
    async getSystemHealth() {
        return this.selfHealingManager.getSystemHealth();
    }
    getActiveTriggers() {
        return Array.from(this.activeTriggers.values());
    }
    getTriggerHistory(hours = 24) {
        const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
        return Array.from(this.activeTriggers.values())
            .filter(trigger => trigger.triggeredAt >= cutoff);
    }
    async forceRepair(component, actionType) {
        this.logger.info('Forcing repair action', { component, actionType });
        const mockAnomaly = {
            id: `forced-${Date.now()}`,
            type: 'behavior',
            severity: 'medium',
            metric: `${component}_forced`,
            expectedValue: 0,
            actualValue: 1,
            deviation: 1,
            confidence: 1.0,
            timestamp: new Date()
        };
        const repairAction = {
            id: `forced-repair-${Date.now()}`,
            component,
            action: actionType,
            priority: 'high',
            estimatedDuration: this.getEstimatedDuration(actionType, 'high'),
            success: false,
            timestamp: new Date()
        };
        const trigger = {
            id: `forced-trigger-${Date.now()}`,
            anomaly: mockAnomaly,
            action: repairAction,
            triggeredAt: new Date(),
            status: 'pending'
        };
        this.activeTriggers.set(trigger.id, trigger);
        try {
            trigger.status = 'executing';
            await this.simulateRepairExecution(repairAction);
            trigger.status = 'completed';
            trigger.result = { success: true, message: 'Forced repair completed' };
        }
        catch (error) {
            trigger.status = 'failed';
            trigger.result = { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
        this.emit('self-healing:completed', trigger);
        return trigger;
    }
    getRepairSuccessRate(hours = 24) {
        const recentTriggers = this.getTriggerHistory(hours);
        const completedTriggers = recentTriggers.filter(t => t.status === 'completed');
        return recentTriggers.length > 0 ? completedTriggers.length / recentTriggers.length : 0;
    }
    getAnomalyResponseTime() {
        const completedTriggers = Array.from(this.activeTriggers.values())
            .filter(t => t.status === 'completed');
        if (completedTriggers.length === 0)
            return 0;
        const totalResponseTime = completedTriggers.reduce((sum, trigger) => {
            return sum + (trigger.result?.duration || 0);
        }, 0);
        return totalResponseTime / completedTriggers.length;
    }
    clearOldTriggers(hours = 24) {
        const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
        for (const [id, trigger] of this.activeTriggers) {
            if (trigger.triggeredAt < cutoff) {
                this.activeTriggers.delete(id);
            }
        }
        this.logger.info('Cleared old triggers', { cutoff: cutoff.toISOString() });
    }
}
exports.QASelfHealingIntegration = QASelfHealingIntegration;
//# sourceMappingURL=QASelfHealingIntegration.js.map