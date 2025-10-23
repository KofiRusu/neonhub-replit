import { LearningContext, CognitiveState, AdaptationMetrics } from '../types';
import { NeuralNetwork } from '../neural/NeuralNetwork';
import { FeedbackLoopManager } from '../neural/FeedbackLoopManager';
import { TopologyAdapter } from '../adaptation/TopologyAdapter';
export declare class AdaptiveLearner {
    private neuralNetwork;
    private feedbackManager;
    private topologyAdapter;
    private cognitiveState;
    private learningContext;
    private cognitiveStateSubject;
    constructor(neuralNetwork: NeuralNetwork, feedbackManager: FeedbackLoopManager, topologyAdapter: TopologyAdapter, learningContext: LearningContext);
    trainAdaptive(data: any[], labels: any[], epochs?: number): Promise<AdaptationMetrics[]>;
    private trainBatch;
    private calculateLoss;
    private arraysEqual;
    private calculateConvergence;
    private calculateStability;
    private calculateAdaptability;
    private updateCognitiveState;
    private getRecentLosses;
    predict(input: any): number[];
    getCognitiveState(): CognitiveState;
    getCognitiveStateObservable(): any;
    getLearningMetrics(): {
        networkComplexity: number;
        topologyChanges: number;
        activeFeedbackLoops: number;
        cognitiveState: CognitiveState;
    };
    resetLearning(): void;
}
//# sourceMappingURL=AdaptiveLearner.d.ts.map