import { BehaviorSubject } from 'rxjs';
export class AdaptiveLearner {
    constructor(neuralNetwork, feedbackManager, topologyAdapter, learningContext) {
        this.cognitiveStateSubject = new BehaviorSubject(null);
        this.neuralNetwork = neuralNetwork;
        this.feedbackManager = feedbackManager;
        this.topologyAdapter = topologyAdapter;
        this.learningContext = learningContext;
        this.cognitiveState = {
            awareness: 0.5,
            confidence: 0.5,
            uncertainty: 0.5,
            adaptability: 0.5,
            learningProgress: 0,
            lastUpdate: new Date()
        };
    }
    async trainAdaptive(data, labels, epochs = 100) {
        const metrics = [];
        const batchSize = this.learningContext.batchSize;
        for (let epoch = 0; epoch < epochs; epoch++) {
            let epochLoss = 0;
            let epochAccuracy = 0;
            // Process data in batches
            for (let i = 0; i < data.length; i += batchSize) {
                const batchData = data.slice(i, i + batchSize);
                const batchLabels = labels.slice(i, i + batchSize);
                const batchMetrics = await this.trainBatch(batchData, batchLabels);
                epochLoss += batchMetrics.loss;
                epochAccuracy += batchMetrics.accuracy;
            }
            // Calculate epoch metrics
            const avgLoss = epochLoss / Math.ceil(data.length / batchSize);
            const avgAccuracy = epochAccuracy / Math.ceil(data.length / batchSize);
            const epochMetrics = {
                accuracy: avgAccuracy,
                loss: avgLoss,
                convergence: this.calculateConvergence(avgLoss),
                stability: this.calculateStability(avgLoss),
                adaptability: this.calculateAdaptability(),
                timestamp: new Date()
            };
            metrics.push(epochMetrics);
            // Update cognitive state
            this.updateCognitiveState(epochMetrics);
            // Apply topology adaptation
            const adapted = this.topologyAdapter.adaptTopology(this.neuralNetwork.fitness, epoch);
            if (adapted) {
                this.cognitiveState.adaptability += 0.01; // Increase adaptability after topology change
            }
            // Process feedback loops
            this.feedbackManager.processFeedback(data[Math.floor(Math.random() * data.length)], [labels[Math.floor(Math.random() * labels.length)]], epochMetrics);
            // Emit cognitive state update
            this.cognitiveStateSubject.next(this.cognitiveState);
        }
        return metrics;
    }
    async trainBatch(batchData, batchLabels) {
        let totalLoss = 0;
        let correct = 0;
        for (let i = 0; i < batchData.length; i++) {
            const input = Array.isArray(batchData[i]) ? batchData[i] : [batchData[i]];
            const target = Array.isArray(batchLabels[i]) ? batchLabels[i] : [batchLabels[i]];
            // Forward pass
            const output = this.neuralNetwork.forward(input);
            // Calculate loss
            const loss = this.calculateLoss(output, target);
            totalLoss += loss;
            // Calculate accuracy
            const predicted = output.map((o) => o > 0.5 ? 1 : 0);
            const actual = target;
            if (this.arraysEqual(predicted, actual)) {
                correct++;
            }
            // Backward pass
            this.neuralNetwork.backward(target, this.learningContext.learningRate);
        }
        return {
            loss: totalLoss / batchData.length,
            accuracy: correct / batchData.length
        };
    }
    calculateLoss(output, target) {
        let loss = 0;
        for (let i = 0; i < output.length; i++) {
            loss += Math.pow(output[i] - target[i], 2);
        }
        return loss / output.length;
    }
    arraysEqual(a, b) {
        if (a.length !== b.length)
            return false;
        return a.every((val, index) => val === b[index]);
    }
    calculateConvergence(currentLoss) {
        // Simple convergence metric based on loss trend
        const recentLosses = this.getRecentLosses();
        if (recentLosses.length < 2)
            return 0.5;
        const recentAvg = recentLosses.reduce((sum, loss) => sum + loss, 0) / recentLosses.length;
        const improvement = recentAvg - currentLoss;
        return Math.max(0, Math.min(1, improvement / recentAvg));
    }
    calculateStability(currentLoss) {
        // Stability based on loss variance
        const recentLosses = this.getRecentLosses();
        if (recentLosses.length < 2)
            return 0.5;
        const mean = recentLosses.reduce((sum, loss) => sum + loss, 0) / recentLosses.length;
        const variance = recentLosses.reduce((sum, loss) => sum + Math.pow(loss - mean, 2), 0) / recentLosses.length;
        const stdDev = Math.sqrt(variance);
        return Math.max(0, Math.min(1, 1 - (stdDev / mean)));
    }
    calculateAdaptability() {
        // Adaptability based on topology changes and feedback effectiveness
        const topologyChanges = this.topologyAdapter.getTopologyHistory().length;
        const activeFeedbackLoops = this.feedbackManager.getActiveFeedbackLoops().length;
        return Math.min(1, (topologyChanges * 0.1) + (activeFeedbackLoops * 0.2));
    }
    updateCognitiveState(metrics) {
        // Update awareness based on accuracy
        this.cognitiveState.awareness = metrics.accuracy;
        // Update confidence based on stability
        this.cognitiveState.confidence = metrics.stability;
        // Update uncertainty as inverse of confidence
        this.cognitiveState.uncertainty = 1 - metrics.stability;
        // Update adaptability
        this.cognitiveState.adaptability = metrics.adaptability;
        // Update learning progress
        this.cognitiveState.learningProgress = Math.min(1, this.cognitiveState.learningProgress + 0.01);
        this.cognitiveState.lastUpdate = new Date();
    }
    getRecentLosses() {
        // This would track recent losses in a real implementation
        // For now, return a mock array
        return [0.5, 0.4, 0.3, 0.2, 0.1];
    }
    predict(input) {
        const inputArray = Array.isArray(input) ? input : [input];
        return this.neuralNetwork.forward(inputArray);
    }
    getCognitiveState() {
        return { ...this.cognitiveState };
    }
    getCognitiveStateObservable() {
        return this.cognitiveStateSubject.asObservable();
    }
    getLearningMetrics() {
        return {
            networkComplexity: this.topologyAdapter.getTopologyComplexity(),
            topologyChanges: this.topologyAdapter.getTopologyHistory().length,
            activeFeedbackLoops: this.feedbackManager.getActiveFeedbackLoops().length,
            cognitiveState: this.cognitiveState
        };
    }
    resetLearning() {
        this.cognitiveState = {
            awareness: 0.5,
            confidence: 0.5,
            uncertainty: 0.5,
            adaptability: 0.5,
            learningProgress: 0,
            lastUpdate: new Date()
        };
        this.topologyAdapter.resetTopologyHistory();
        this.feedbackManager.resetFeedbackLoops();
    }
}
//# sourceMappingURL=AdaptiveLearner.js.map