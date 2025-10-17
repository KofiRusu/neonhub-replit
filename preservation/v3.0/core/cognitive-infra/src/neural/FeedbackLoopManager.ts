import { FeedbackLoop, NeuralNetwork, AdaptationMetrics } from '../types';
import { Subject, BehaviorSubject } from 'rxjs';

export class FeedbackLoopManager {
  private feedbackLoops: Map<string, FeedbackLoop> = new Map();
  private neuralNetwork: NeuralNetwork;
  private metricsSubject = new BehaviorSubject<AdaptationMetrics | null>(null);
  private adaptationThreshold = 0.1;
  private maxFeedbackStrength = 1.0;

  constructor(neuralNetwork: NeuralNetwork) {
    this.neuralNetwork = neuralNetwork;
  }

  public addFeedbackLoop(loop: FeedbackLoop): void {
    this.feedbackLoops.set(loop.id, loop);
  }

  public removeFeedbackLoop(loopId: string): void {
    this.feedbackLoops.delete(loopId);
  }

  public updateFeedbackStrength(loopId: string, strength: number): void {
    const loop = this.feedbackLoops.get(loopId);
    if (loop) {
      loop.strength = Math.max(0, Math.min(this.maxFeedbackStrength, strength));
    }
  }

  public processFeedback(input: number[], target: number[], currentMetrics: AdaptationMetrics): void {
    // Calculate prediction error
    const prediction = (this.neuralNetwork as any).forward(input);
    const error = this.calculateError(prediction, target);

    // Process feedback loops
    for (const loop of this.feedbackLoops.values()) {
      if (!loop.active) continue;

      const feedbackSignal = this.generateFeedbackSignal(loop, error, currentMetrics);
      this.applyFeedbackToNetwork(loop, feedbackSignal);
    }

    // Update adaptation metrics
    const newMetrics = this.calculateAdaptationMetrics(error, currentMetrics);
    this.metricsSubject.next(newMetrics);
  }

  private calculateError(prediction: number[], target: number[]): number {
    let totalError = 0;
    for (let i = 0; i < prediction.length; i++) {
      totalError += Math.pow(prediction[i] - target[i], 2);
    }
    return totalError / prediction.length;
  }

  private generateFeedbackSignal(loop: FeedbackLoop, error: number, metrics: AdaptationMetrics): number {
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

  private applyFeedbackToNetwork(loop: FeedbackLoop, signal: number): void {
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

  private calculateAdaptationMetrics(error: number, previousMetrics: AdaptationMetrics): AdaptationMetrics {
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

  private calculateConvergence(currentError: number, previousMetrics: AdaptationMetrics): number {
    if (!previousMetrics) return 0.5;

    const errorImprovement = previousMetrics.loss - currentError;
    const convergenceRate = Math.max(0, Math.min(1, errorImprovement / previousMetrics.loss));

    return previousMetrics.convergence * 0.9 + convergenceRate * 0.1;
  }

  private calculateStability(currentError: number, previousMetrics: AdaptationMetrics): number {
    if (!previousMetrics) return 0.5;

    const errorVariance = Math.abs(currentError - previousMetrics.loss);
    const stabilityScore = Math.max(0, 1 - errorVariance / previousMetrics.loss);

    return previousMetrics.stability * 0.95 + stabilityScore * 0.05;
  }

  private calculateAdaptability(convergence: number, stability: number): number {
    // Adaptability is a balance between convergence speed and stability
    return (convergence * 0.7) + (stability * 0.3);
  }

  public getFeedbackLoops(): FeedbackLoop[] {
    return Array.from(this.feedbackLoops.values());
  }

  public getAdaptationMetrics(): Subject<AdaptationMetrics | null> {
    return this.metricsSubject;
  }

  public getActiveFeedbackLoops(): FeedbackLoop[] {
    return Array.from(this.feedbackLoops.values()).filter(loop => loop.active);
  }

  public enableFeedbackLoop(loopId: string): void {
    const loop = this.feedbackLoops.get(loopId);
    if (loop) {
      loop.active = true;
    }
  }

  public disableFeedbackLoop(loopId: string): void {
    const loop = this.feedbackLoops.get(loopId);
    if (loop) {
      loop.active = false;
    }
  }

  public resetFeedbackLoops(): void {
    for (const loop of this.feedbackLoops.values()) {
      loop.strength = 0.5; // Reset to neutral strength
    }
  }

  public getFeedbackLoopStats(): { [key: string]: any } {
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