export { NeuralNetwork } from './neural/NeuralNetwork';
export { FeedbackLoopManager } from './neural/FeedbackLoopManager';
export { TopologyAdapter } from './adaptation/TopologyAdapter';
export { AdaptiveLearner } from './learning/AdaptiveLearner';
export * from './types';
import { NeuralConfig, AdaptationConfig, LearningContext, CognitiveState } from './types';
export declare class CognitiveInfrastructure {
    private neuralNetwork;
    private feedbackManager;
    private topologyAdapter;
    private adaptiveLearner;
    private isActive;
    constructor(neuralConfig: NeuralConfig, adaptationConfig: AdaptationConfig, learningContext: LearningContext);
    startCognitiveProcessing(): Promise<void>;
    stopCognitiveProcessing(): Promise<void>;
    processData(data: any[], labels: any[], epochs?: number): Promise<any>;
    predict(input: any): number[];
    getCognitiveState(): CognitiveState;
    getLearningMetrics(): any;
    addFeedbackLoop(loop: any): void;
    getFeedbackLoops(): any[];
    getTopologyStats(): any;
    getSystemHealth(): 'healthy' | 'adapting' | 'critical';
}
//# sourceMappingURL=index.d.ts.map