import { PerformanceMetrics, ReinforcementLearningState, ScalingDecision } from '../types';
import { BaselineLoader } from '../utils/baselineLoader';
import * as winston from 'winston';

export class AdaptiveAgent {
  private logger: winston.Logger;
  private qTable: Map<string, Map<string, number>> = new Map();
  private learningRate: number = 0.1;
  private discountFactor: number = 0.9;
  private explorationRate: number = 0.1;
  private baselineMetrics!: PerformanceMetrics;
  private kpiWeights: {
    latency: number;
    errorRate: number;
    conversion: number;
    uptime: number;
    cost: number;
  };

  constructor(kpiWeights?: Partial<AdaptiveAgent['kpiWeights']>) {
    this.kpiWeights = {
      latency: 0.3,
      errorRate: 0.25,
      conversion: 0.2,
      uptime: 0.15,
      cost: 0.1,
      ...kpiWeights
    };

    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'adaptive-agent.log' })
      ]
    });
  }

  async initialize(): Promise<void> {
    try {
      this.baselineMetrics = await BaselineLoader.loadV31Baseline();
      this.logger.info('Adaptive agent initialized with v3.1 baseline metrics');
    } catch (error) {
      this.logger.error('Failed to load baseline metrics for adaptive agent', error);
      throw error;
    }
  }

  calculateReward(currentMetrics: PerformanceMetrics, action: ScalingDecision): number {
    // Calculate reward based on KPI improvements vs baseline
    const latencyScore = Math.max(0, 1 - (currentMetrics.latency.apiResponseTimeAvg / this.baselineMetrics.latency.apiResponseTimeAvg));
    const errorScore = Math.max(0, 1 - (currentMetrics.errors.apiErrorRate / this.baselineMetrics.errors.apiErrorRate));
    const conversionScore = Math.min(1, currentMetrics.conversions.conversionRate / this.baselineMetrics.conversions.conversionRate);
    const uptimeScore = currentMetrics.infrastructure.uptimePercentage / 100;

    // Cost penalty based on scaling action (more replicas = higher cost)
    const costPenalty = Math.max(0, (action.targetReplicas - 1) * 0.05);

    const reward = (
      this.kpiWeights.latency * latencyScore +
      this.kpiWeights.errorRate * errorScore +
      this.kpiWeights.conversion * conversionScore +
      this.kpiWeights.uptime * uptimeScore -
      this.kpiWeights.cost * costPenalty
    );

    return Math.max(-1, Math.min(1, reward)); // Clamp between -1 and 1
  }

  getStateKey(state: ReinforcementLearningState): string {
    // Create a discretized state representation
    const trafficLevel = this.discretizeValue(state.currentMetrics.traffic.totalPageViews, [10000, 50000, 100000]);
    const latencyLevel = this.discretizeValue(state.currentMetrics.latency.apiResponseTimeAvg, [500, 800, 1200]);
    const errorLevel = this.discretizeValue(state.currentMetrics.errors.apiErrorRate, [0.01, 0.05, 0.1]);
    const conversionLevel = this.discretizeValue(state.currentMetrics.conversions.conversionRate, [0.01, 0.05, 0.1]);

    return `${trafficLevel}_${latencyLevel}_${errorLevel}_${conversionLevel}`;
  }

  chooseAction(state: ReinforcementLearningState): ScalingDecision {
    const stateKey = this.getStateKey(state);

    // Initialize Q-table for new state
    if (!this.qTable.has(stateKey)) {
      this.qTable.set(stateKey, new Map([
        ['scale_up', 0],
        ['scale_down', 0],
        ['no_action', 0]
      ]));
    }

    const qValues = this.qTable.get(stateKey)!;

    // Epsilon-greedy action selection
    if (Math.random() < this.explorationRate) {
      // Explore: random action
      const actions = ['scale_up', 'scale_down', 'no_action'];
      const randomAction = actions[Math.floor(Math.random() * actions.length)] as 'scale_up' | 'scale_down' | 'no_action';

      return {
        action: randomAction,
        targetReplicas: this.getTargetReplicasForAction(randomAction, state),
        reason: 'Exploratory action selection',
        confidence: 0.5,
        predictedLoad: this.calculatePredictedLoad(state)
      };
    } else {
      // Exploit: best known action
      let bestAction: 'scale_up' | 'scale_down' | 'no_action' = 'no_action';
      let bestValue = -Infinity;

      for (const [action, value] of qValues.entries()) {
        if (value > bestValue) {
          bestValue = value;
          bestAction = action as 'scale_up' | 'scale_down' | 'no_action';
        }
      }

      return {
        action: bestAction,
        targetReplicas: this.getTargetReplicasForAction(bestAction, state),
        reason: 'Exploitative action selection based on learned Q-values',
        confidence: Math.min(0.95, Math.max(0.5, bestValue)),
        predictedLoad: this.calculatePredictedLoad(state)
      };
    }
  }

  updateQValue(state: ReinforcementLearningState, action: ScalingDecision, reward: number, nextState: ReinforcementLearningState): void {
    const stateKey = this.getStateKey(state);
    const nextStateKey = this.getStateKey(nextState);

    const qValues = this.qTable.get(stateKey);
    if (!qValues) return;

    const currentQ = qValues.get(action.action) || 0;

    // Get max Q-value for next state
    const nextQValues = this.qTable.get(nextStateKey);
    const maxNextQ = nextQValues ? Math.max(...Array.from(nextQValues.values())) : 0;

    // Q-learning update
    const newQ = currentQ + this.learningRate * (reward + this.discountFactor * maxNextQ - currentQ);

    qValues.set(action.action, newQ);

    this.logger.debug(`Updated Q-value for state ${stateKey}, action ${action.action}: ${currentQ} -> ${newQ}`);
  }

  adaptWeightsBasedOnPerformance(recentRewards: number[]): void {
    if (recentRewards.length < 10) return;

    const avgReward = recentRewards.reduce((a, b) => a + b, 0) / recentRewards.length;

    // Adjust exploration rate based on performance
    if (avgReward > 0.7) {
      this.explorationRate = Math.max(0.01, this.explorationRate * 0.9); // Reduce exploration
    } else if (avgReward < 0.3) {
      this.explorationRate = Math.min(0.3, this.explorationRate * 1.1); // Increase exploration
    }

    this.logger.info(`Adapted exploration rate to ${this.explorationRate} based on average reward ${avgReward}`);
  }

  getLearningStats(): {
    statesLearned: number;
    explorationRate: number;
    averageQValue: number;
  } {
    let totalQValues = 0;
    let qValueSum = 0;

    for (const qValues of this.qTable.values()) {
      for (const qValue of qValues.values()) {
        totalQValues++;
        qValueSum += qValue;
      }
    }

    return {
      statesLearned: this.qTable.size,
      explorationRate: this.explorationRate,
      averageQValue: totalQValues > 0 ? qValueSum / totalQValues : 0
    };
  }

  private discretizeValue(value: number, thresholds: number[]): number {
    for (let i = 0; i < thresholds.length; i++) {
      if (value <= thresholds[i]) {
        return i;
      }
    }
    return thresholds.length;
  }

  private getTargetReplicasForAction(action: 'scale_up' | 'scale_down' | 'no_action', state: ReinforcementLearningState): number {
    const currentReplicas = 1; // This should come from actual deployment state

    switch (action) {
      case 'scale_up':
        return Math.min(currentReplicas + 1, 10); // Max 10 replicas
      case 'scale_down':
        return Math.max(currentReplicas - 1, 1); // Min 1 replica
      case 'no_action':
      default:
        return currentReplicas;
    }
  }

  private calculatePredictedLoad(state: ReinforcementLearningState): number {
    // Simple load prediction based on current metrics
    const trafficLoad = state.currentMetrics.traffic.totalPageViews / this.baselineMetrics.traffic.totalPageViews;
    const latencyLoad = state.currentMetrics.latency.apiResponseTimeAvg / this.baselineMetrics.latency.apiResponseTimeAvg;

    return (trafficLoad + latencyLoad) / 2;
  }

  saveModel(filePath: string): void {
    // In a real implementation, this would serialize the Q-table to disk
    this.logger.info(`Saving adaptive agent model to ${filePath}`);
  }

  loadModel(filePath: string): void {
    // In a real implementation, this would deserialize the Q-table from disk
    this.logger.info(`Loading adaptive agent model from ${filePath}`);
  }
}