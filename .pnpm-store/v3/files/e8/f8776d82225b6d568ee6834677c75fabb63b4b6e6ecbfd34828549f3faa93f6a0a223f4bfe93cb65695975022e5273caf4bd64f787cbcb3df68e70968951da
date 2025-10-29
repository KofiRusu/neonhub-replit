import { PerformanceMetrics, ReinforcementLearningState, ScalingDecision } from '../types';
export declare class AdaptiveAgent {
    private logger;
    private qTable;
    private learningRate;
    private discountFactor;
    private explorationRate;
    private baselineMetrics;
    private kpiWeights;
    constructor(kpiWeights?: Partial<AdaptiveAgent['kpiWeights']>);
    initialize(): Promise<void>;
    calculateReward(currentMetrics: PerformanceMetrics, action: ScalingDecision): number;
    getStateKey(state: ReinforcementLearningState): string;
    chooseAction(state: ReinforcementLearningState): ScalingDecision;
    updateQValue(state: ReinforcementLearningState, action: ScalingDecision, reward: number, nextState: ReinforcementLearningState): void;
    adaptWeightsBasedOnPerformance(recentRewards: number[]): void;
    getLearningStats(): {
        statesLearned: number;
        explorationRate: number;
        averageQValue: number;
    };
    private discretizeValue;
    private getTargetReplicasForAction;
    private calculatePredictedLoad;
    saveModel(filePath: string): void;
    loadModel(filePath: string): void;
}
//# sourceMappingURL=AdaptiveAgent.d.ts.map