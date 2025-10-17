import { EventEmitter } from 'events';
import { ScalingConfig, ScalingDecision, ScalingAction, Logger } from '../types';
export declare class AutoScalingService extends EventEmitter {
    private config;
    private logger;
    private scalingTask?;
    private lastScalingAction;
    private scalingHistory;
    private isRunning;
    constructor(config: ScalingConfig, logger: Logger);
    start(): Promise<void>;
    stop(): Promise<void>;
    private evaluateScalingNeeds;
    private analyzeScalingConditions;
    private executeScalingDecision;
    private scaleUp;
    private scaleDown;
    manualScale(action: ScalingAction, targetNodes: string[], reason: string): Promise<void>;
    getScalingHistory(limit?: number): ScalingDecision[];
    getScalingStats(): any;
    isWithinCooldown(nodeId: string): boolean;
    predictScalingNeeds(): ScalingDecision[];
    updateScalingThresholds(scaleUpThreshold: number, scaleDownThreshold: number): void;
}
//# sourceMappingURL=AutoScalingService.d.ts.map