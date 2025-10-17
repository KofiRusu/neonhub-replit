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
import { NeuralConfig, AdaptationConfig, LearningContext, CognitiveState } from './types';

export class CognitiveInfrastructure {
  private neuralNetwork: NeuralNetwork;
  private feedbackManager: FeedbackLoopManager;
  private topologyAdapter: TopologyAdapter;
  private adaptiveLearner: AdaptiveLearner;
  private isActive = false;

  constructor(
    neuralConfig: NeuralConfig,
    adaptationConfig: AdaptationConfig,
    learningContext: LearningContext
  ) {
    // Initialize neural network
    this.neuralNetwork = new NeuralNetwork(neuralConfig);

    // Initialize feedback loop manager
    this.feedbackManager = new FeedbackLoopManager(this.neuralNetwork);

    // Initialize topology adapter
    this.topologyAdapter = new TopologyAdapter(this.neuralNetwork, adaptationConfig);

    // Initialize adaptive learner
    this.adaptiveLearner = new AdaptiveLearner(
      this.neuralNetwork,
      this.feedbackManager,
      this.topologyAdapter,
      learningContext
    );
  }

  public async startCognitiveProcessing(): Promise<void> {
    this.isActive = true;
    console.log('Cognitive Infrastructure started');
  }

  public async stopCognitiveProcessing(): Promise<void> {
    this.isActive = false;
    console.log('Cognitive Infrastructure stopped');
  }

  public async processData(data: any[], labels: any[], epochs: number = 100): Promise<any> {
    if (!this.isActive) {
      throw new Error('Cognitive Infrastructure is not active');
    }

    return await this.adaptiveLearner.trainAdaptive(data, labels, epochs);
  }

  public predict(input: any): number[] {
    return this.adaptiveLearner.predict(input);
  }

  public getCognitiveState(): CognitiveState {
    return this.adaptiveLearner.getCognitiveState();
  }

  public getLearningMetrics(): any {
    return this.adaptiveLearner.getLearningMetrics();
  }

  public addFeedbackLoop(loop: any): void {
    this.feedbackManager.addFeedbackLoop(loop);
  }

  public getFeedbackLoops(): any[] {
    return this.feedbackManager.getFeedbackLoops();
  }

  public getTopologyStats(): any {
    return this.topologyAdapter.getTopologyStats();
  }

  public getSystemHealth(): 'healthy' | 'adapting' | 'critical' {
    const state = this.getCognitiveState();
    const metrics = this.getLearningMetrics();

    if (state.uncertainty > 0.8 || metrics.cognitiveState.confidence < 0.3) {
      return 'critical';
    } else if (metrics.topologyChanges > 10 || state.adaptability > 0.7) {
      return 'adapting';
    } else {
      return 'healthy';
    }
  }
}