import { LearningContext, CognitiveState, AdaptationMetrics } from '../types';
import { NeuralNetwork } from '../neural/NeuralNetwork';
import { FeedbackLoopManager } from '../neural/FeedbackLoopManager';
import { TopologyAdapter } from '../adaptation/TopologyAdapter';
import { BehaviorSubject } from 'rxjs';

export class AdaptiveLearner {
  private neuralNetwork: NeuralNetwork;
  private feedbackManager: FeedbackLoopManager;
  private topologyAdapter: TopologyAdapter;
  private cognitiveState: CognitiveState;
  private learningContext: LearningContext;
  private cognitiveStateSubject = new BehaviorSubject<CognitiveState | null>(null);

  constructor(
    neuralNetwork: NeuralNetwork,
    feedbackManager: FeedbackLoopManager,
    topologyAdapter: TopologyAdapter,
    learningContext: LearningContext
  ) {
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

  public async trainAdaptive(data: any[], labels: any[], epochs: number = 100): Promise<AdaptationMetrics[]> {
    const metrics: AdaptationMetrics[] = [];
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

      const epochMetrics: AdaptationMetrics = {
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
      this.feedbackManager.processFeedback(
        data[Math.floor(Math.random() * data.length)],
        [labels[Math.floor(Math.random() * labels.length)]],
        epochMetrics
      );

      // Emit cognitive state update
      this.cognitiveStateSubject.next(this.cognitiveState);
    }

    return metrics;
  }

  private async trainBatch(batchData: any[], batchLabels: any[]): Promise<{ loss: number; accuracy: number }> {
    let totalLoss = 0;
    let correct = 0;

    for (let i = 0; i < batchData.length; i++) {
      const input = Array.isArray(batchData[i]) ? batchData[i] : [batchData[i]];
      const target = Array.isArray(batchLabels[i]) ? batchLabels[i] : [batchLabels[i]];

      // Forward pass
      const output = (this.neuralNetwork as any).forward(input);

      // Calculate loss
      const loss = this.calculateLoss(output, target);
      totalLoss += loss;

      // Calculate accuracy
      const predicted = output.map((o: number) => o > 0.5 ? 1 : 0);
      const actual = target;
      if (this.arraysEqual(predicted, actual)) {
        correct++;
      }

      // Backward pass
      (this.neuralNetwork as any).backward(target, this.learningContext.learningRate);
    }

    return {
      loss: totalLoss / batchData.length,
      accuracy: correct / batchData.length
    };
  }

  private calculateLoss(output: number[], target: number[]): number {
    let loss = 0;
    for (let i = 0; i < output.length; i++) {
      loss += Math.pow(output[i] - target[i], 2);
    }
    return loss / output.length;
  }

  private arraysEqual(a: number[], b: number[]): boolean {
    if (a.length !== b.length) return false;
    return a.every((val, index) => val === b[index]);
  }

  private calculateConvergence(currentLoss: number): number {
    // Simple convergence metric based on loss trend
    const recentLosses = this.getRecentLosses();
    if (recentLosses.length < 2) return 0.5;

    const recentAvg = recentLosses.reduce((sum, loss) => sum + loss, 0) / recentLosses.length;
    const improvement = recentAvg - currentLoss;

    return Math.max(0, Math.min(1, improvement / recentAvg));
  }

  private calculateStability(currentLoss: number): number {
    // Stability based on loss variance
    const recentLosses = this.getRecentLosses();
    if (recentLosses.length < 2) return 0.5;

    const mean = recentLosses.reduce((sum, loss) => sum + loss, 0) / recentLosses.length;
    const variance = recentLosses.reduce((sum, loss) => sum + Math.pow(loss - mean, 2), 0) / recentLosses.length;
    const stdDev = Math.sqrt(variance);

    return Math.max(0, Math.min(1, 1 - (stdDev / mean)));
  }

  private calculateAdaptability(): number {
    // Adaptability based on topology changes and feedback effectiveness
    const topologyChanges = this.topologyAdapter.getTopologyHistory().length;
    const activeFeedbackLoops = this.feedbackManager.getActiveFeedbackLoops().length;

    return Math.min(1, (topologyChanges * 0.1) + (activeFeedbackLoops * 0.2));
  }

  private updateCognitiveState(metrics: AdaptationMetrics): void {
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

  private getRecentLosses(): number[] {
    // This would track recent losses in a real implementation
    // For now, return a mock array
    return [0.5, 0.4, 0.3, 0.2, 0.1];
  }

  public predict(input: any): number[] {
    const inputArray = Array.isArray(input) ? input : [input];
    return (this.neuralNetwork as any).forward(inputArray);
  }

  public getCognitiveState(): CognitiveState {
    return { ...this.cognitiveState };
  }

  public getCognitiveStateObservable() {
    return this.cognitiveStateSubject.asObservable();
  }

  public getLearningMetrics(): {
    networkComplexity: number;
    topologyChanges: number;
    activeFeedbackLoops: number;
    cognitiveState: CognitiveState;
  } {
    return {
      networkComplexity: this.topologyAdapter.getTopologyComplexity(),
      topologyChanges: this.topologyAdapter.getTopologyHistory().length,
      activeFeedbackLoops: this.feedbackManager.getActiveFeedbackLoops().length,
      cognitiveState: this.cognitiveState
    };
  }

  public resetLearning(): void {
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