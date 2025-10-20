import { FeedbackLoop, NeuralNetwork, AdaptationMetrics } from '../types';
import { Subject } from 'rxjs';
export declare class FeedbackLoopManager {
    private feedbackLoops;
    private neuralNetwork;
    private metricsSubject;
    private adaptationThreshold;
    private maxFeedbackStrength;
    constructor(neuralNetwork: NeuralNetwork);
    addFeedbackLoop(loop: FeedbackLoop): void;
    removeFeedbackLoop(loopId: string): void;
    updateFeedbackStrength(loopId: string, strength: number): void;
    processFeedback(input: number[], target: number[], currentMetrics: AdaptationMetrics): void;
    private calculateError;
    private generateFeedbackSignal;
    private applyFeedbackToNetwork;
    private calculateAdaptationMetrics;
    private calculateConvergence;
    private calculateStability;
    private calculateAdaptability;
    getFeedbackLoops(): FeedbackLoop[];
    getAdaptationMetrics(): Subject<AdaptationMetrics | null>;
    getActiveFeedbackLoops(): FeedbackLoop[];
    enableFeedbackLoop(loopId: string): void;
    disableFeedbackLoop(loopId: string): void;
    resetFeedbackLoops(): void;
    getFeedbackLoopStats(): {
        [key: string]: any;
    };
}
//# sourceMappingURL=FeedbackLoopManager.d.ts.map