import { EventEmitter } from 'events';
import { SelfHealingManager, RepairAction } from '../../../self-healing';
import { Anomaly } from '../types';
export interface SelfHealingTrigger {
    id: string;
    anomaly: Anomaly;
    action: RepairAction;
    triggeredAt: Date;
    status: 'pending' | 'executing' | 'completed' | 'failed';
    result?: any;
}
export declare class QASelfHealingIntegration extends EventEmitter {
    private selfHealingManager;
    private activeTriggers;
    private logger;
    constructor(selfHealingManager: SelfHealingManager);
    private setupEventHandlers;
    triggerSelfHealing(anomaly: Anomaly): Promise<SelfHealingTrigger>;
    private determineRepairAction;
    private getEstimatedDuration;
    private simulateRepairExecution;
    private handleRepairCompleted;
    private handleRepairFailed;
    getSystemHealth(): Promise<'healthy' | 'degraded' | 'critical'>;
    getActiveTriggers(): SelfHealingTrigger[];
    getTriggerHistory(hours?: number): SelfHealingTrigger[];
    forceRepair(component: string, actionType: 'restart' | 'scale' | 'rollback' | 'patch' | 'reconfigure'): Promise<SelfHealingTrigger>;
    getRepairSuccessRate(hours?: number): number;
    getAnomalyResponseTime(): number;
    clearOldTriggers(hours?: number): void;
}
//# sourceMappingURL=QASelfHealingIntegration.d.ts.map