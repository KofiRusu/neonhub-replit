export { NeuralNetwork } from './neural/NeuralNetwork';
export { FeedbackLoopManager } from './neural/FeedbackLoopManager';
export { TopologyAdapter } from './adaptation/TopologyAdapter';
export { AdaptiveLearner } from './learning/AdaptiveLearner';
// Types
export * from './types';
// Cognitive Infrastructure Manager - Main orchestrator
import { NeuralNetwork } from './neural/NeuralNetwork';
import { FeedbackLoopManager } from './neural/FeedbackLoopManager';
import { TopologyAdapter } from './adaptation/TopologyAdapter';
import { AdaptiveLearner } from './learning/AdaptiveLearner';
export class CognitiveInfrastructure {
    constructor(neuralConfig, adaptationConfig, learningContext) {
        this.isActive = false;
        // Initialize neural network
        this.neuralNetwork = new NeuralNetwork(neuralConfig);
        // Initialize feedback loop manager
        this.feedbackManager = new FeedbackLoopManager(this.neuralNetwork);
        // Initialize topology adapter
        this.topologyAdapter = new TopologyAdapter(this.neuralNetwork, adaptationConfig);
        // Initialize adaptive learner
        this.adaptiveLearner = new AdaptiveLearner(this.neuralNetwork, this.feedbackManager, this.topologyAdapter, learningContext);
    }
    async startCognitiveProcessing() {
        this.isActive = true;
        console.log('Cognitive Infrastructure started');
    }
    async stopCognitiveProcessing() {
        this.isActive = false;
        console.log('Cognitive Infrastructure stopped');
    }
    async processData(data, labels, epochs = 100) {
        if (!this.isActive) {
            throw new Error('Cognitive Infrastructure is not active');
        }
        return await this.adaptiveLearner.trainAdaptive(data, labels, epochs);
    }
    predict(input) {
        return this.adaptiveLearner.predict(input);
    }
    getCognitiveState() {
        return this.adaptiveLearner.getCognitiveState();
    }
    getLearningMetrics() {
        return this.adaptiveLearner.getLearningMetrics();
    }
    addFeedbackLoop(loop) {
        this.feedbackManager.addFeedbackLoop(loop);
    }
    getFeedbackLoops() {
        return this.feedbackManager.getFeedbackLoops();
    }
    getTopologyStats() {
        return this.topologyAdapter.getTopologyStats();
    }
    getSystemHealth() {
        const state = this.getCognitiveState();
        const metrics = this.getLearningMetrics();
        if (state.uncertainty > 0.8 || metrics.cognitiveState.confidence < 0.3) {
            return 'critical';
        }
        else if (metrics.topologyChanges > 10 || state.adaptability > 0.7) {
            return 'adapting';
        }
        else {
            return 'healthy';
        }
    }
}
//# sourceMappingURL=index.js.map