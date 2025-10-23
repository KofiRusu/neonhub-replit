import { BehaviorSubject } from 'rxjs';
export class FeedbackLoopManager {
    constructor(neuralNetwork) {
        this.feedbackLoops = new Map();
        this.metricsSubject = new BehaviorSubject(null);
        this.adaptationThreshold = 0.1;
        this.maxFeedbackStrength = 1.0;
        this.neuralNetwork = neuralNetwork;
    }
    addFeedbackLoop(loop) {
        this.feedbackLoops.set(loop.id, loop);
    }
    removeFeedbackLoop(loopId) {
        this.feedbackLoops.delete(loopId);
    }
    updateFeedbackStrength(loopId, strength) {
        const loop = this.feedbackLoops.get(loopId);
        if (loop) {
            loop.strength = Math.max(0, Math.min(this.maxFeedbackStrength, strength));
        }
    }
    processFeedback(input, target, currentMetrics) {
        // Calculate prediction error
        const prediction = this.neuralNetwork.forward(input);
        const error = this.calculateError(prediction, target);
        // Process feedback loops
        for (const loop of this.feedbackLoops.values()) {
            if (!loop.active)
                continue;
            const feedbackSignal = this.generateFeedbackSignal(loop, error, currentMetrics);
            this.applyFeedbackToNetwork(loop, feedbackSignal);
        }
        // Update adaptation metrics
        const newMetrics = this.calculateAdaptationMetrics(error, currentMetrics);
        this.metricsSubject.next(newMetrics);
    }
    calculateError(prediction, target) {
        let totalError = 0;
        for (let i = 0; i < prediction.length; i++) {
            totalError += Math.pow(prediction[i] - target[i], 2);
        }
        return totalError / prediction.length;
    }
    generateFeedbackSignal(loop, error, metrics) {
        let signal = 0;
        switch (loop.type) {
            case 'positive':
                // Amplify successful adaptations
                signal = error < this.adaptationThreshold ? loop.strength : -loop.strength * 0.5;
                break;
            case 'negative':
                // Dampen unstable behavior
                signal = metrics.stability < 0.8 ? -loop.strength : 0;
                break;
            case 'neutral':
                // Balanced feedback based on convergence
                signal = (metrics.convergence - 0.5) * loop.strength;
                break;
        }
        return signal;
    }
    applyFeedbackToNetwork(loop, signal) {
        // Apply feedback to specific network components
        const targetNode = this.neuralNetwork.nodes.get(loop.target);
        if (targetNode) {
            // Adjust node bias based on feedback
            targetNode.bias += signal * 0.01;
            // Adjust connection weights
            for (const [connectionId, weight] of targetNode.weights) {
                const connection = this.neuralNetwork.connections.get(connectionId);
                if (connection) {
                    connection.weight += signal * 0.001;
                    targetNode.weights.set(connectionId, connection.weight);
                }
            }
        }
    }
    calculateAdaptationMetrics(error, previousMetrics) {
        const accuracy = Math.max(0, 1 - error);
        const loss = error;
        const convergence = this.calculateConvergence(error, previousMetrics);
        const stability = this.calculateStability(error, previousMetrics);
        const adaptability = this.calculateAdaptability(convergence, stability);
        const timestamp = new Date();
        return {
            accuracy,
            loss,
            convergence,
            stability,
            adaptability,
            timestamp
        };
    }
    calculateConvergence(currentError, previousMetrics) {
        if (!previousMetrics)
            return 0.5;
        const errorImprovement = previousMetrics.loss - currentError;
        const convergenceRate = Math.max(0, Math.min(1, errorImprovement / previousMetrics.loss));
        return previousMetrics.convergence * 0.9 + convergenceRate * 0.1;
    }
    calculateStability(currentError, previousMetrics) {
        if (!previousMetrics)
            return 0.5;
        const errorVariance = Math.abs(currentError - previousMetrics.loss);
        const stabilityScore = Math.max(0, 1 - errorVariance / previousMetrics.loss);
        return previousMetrics.stability * 0.95 + stabilityScore * 0.05;
    }
    calculateAdaptability(convergence, stability) {
        // Adaptability is a balance between convergence speed and stability
        return (convergence * 0.7) + (stability * 0.3);
    }
    getFeedbackLoops() {
        return Array.from(this.feedbackLoops.values());
    }
    getAdaptationMetrics() {
        return this.metricsSubject;
    }
    getActiveFeedbackLoops() {
        return Array.from(this.feedbackLoops.values()).filter(loop => loop.active);
    }
    enableFeedbackLoop(loopId) {
        const loop = this.feedbackLoops.get(loopId);
        if (loop) {
            loop.active = true;
        }
    }
    disableFeedbackLoop(loopId) {
        const loop = this.feedbackLoops.get(loopId);
        if (loop) {
            loop.active = false;
        }
    }
    resetFeedbackLoops() {
        for (const loop of this.feedbackLoops.values()) {
            loop.strength = 0.5; // Reset to neutral strength
        }
    }
    getFeedbackLoopStats() {
        const activeLoops = this.getActiveFeedbackLoops();
        const totalStrength = activeLoops.reduce((sum, loop) => sum + loop.strength, 0);
        return {
            totalLoops: this.feedbackLoops.size,
            activeLoops: activeLoops.length,
            averageStrength: activeLoops.length > 0 ? totalStrength / activeLoops.length : 0,
            positiveLoops: activeLoops.filter(l => l.type === 'positive').length,
            negativeLoops: activeLoops.filter(l => l.type === 'negative').length,
            neutralLoops: activeLoops.filter(l => l.type === 'neutral').length
        };
    }
}
//# sourceMappingURL=FeedbackLoopManager.js.map