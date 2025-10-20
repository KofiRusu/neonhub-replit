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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CognitiveInfrastructure = exports.AdaptiveLearner = exports.TopologyAdapter = exports.FeedbackLoopManager = exports.NeuralNetwork = void 0;
var NeuralNetwork_1 = require("./neural/NeuralNetwork");
Object.defineProperty(exports, "NeuralNetwork", { enumerable: true, get: function () { return NeuralNetwork_1.NeuralNetwork; } });
var FeedbackLoopManager_1 = require("./neural/FeedbackLoopManager");
Object.defineProperty(exports, "FeedbackLoopManager", { enumerable: true, get: function () { return FeedbackLoopManager_1.FeedbackLoopManager; } });
var TopologyAdapter_1 = require("./adaptation/TopologyAdapter");
Object.defineProperty(exports, "TopologyAdapter", { enumerable: true, get: function () { return TopologyAdapter_1.TopologyAdapter; } });
var AdaptiveLearner_1 = require("./learning/AdaptiveLearner");
Object.defineProperty(exports, "AdaptiveLearner", { enumerable: true, get: function () { return AdaptiveLearner_1.AdaptiveLearner; } });
// Types
__exportStar(require("./types"), exports);
// Cognitive Infrastructure Manager - Main orchestrator
const NeuralNetwork_2 = require("./neural/NeuralNetwork");
const FeedbackLoopManager_2 = require("./neural/FeedbackLoopManager");
const TopologyAdapter_2 = require("./adaptation/TopologyAdapter");
const AdaptiveLearner_2 = require("./learning/AdaptiveLearner");
class CognitiveInfrastructure {
    constructor(neuralConfig, adaptationConfig, learningContext) {
        this.isActive = false;
        // Initialize neural network
        this.neuralNetwork = new NeuralNetwork_2.NeuralNetwork(neuralConfig);
        // Initialize feedback loop manager
        this.feedbackManager = new FeedbackLoopManager_2.FeedbackLoopManager(this.neuralNetwork);
        // Initialize topology adapter
        this.topologyAdapter = new TopologyAdapter_2.TopologyAdapter(this.neuralNetwork, adaptationConfig);
        // Initialize adaptive learner
        this.adaptiveLearner = new AdaptiveLearner_2.AdaptiveLearner(this.neuralNetwork, this.feedbackManager, this.topologyAdapter, learningContext);
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
exports.CognitiveInfrastructure = CognitiveInfrastructure;
//# sourceMappingURL=index.js.map