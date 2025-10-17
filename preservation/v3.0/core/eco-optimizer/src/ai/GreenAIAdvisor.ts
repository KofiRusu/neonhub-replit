import {
  GreenAIMetrics,
  GreenAIRecommendation,
  Logger,
  DataCollectionError
} from '../types';

/**
 * GreenAIAdvisor - Provides recommendations for sustainable AI/ML operations
 * Focuses on reducing energy consumption and carbon footprint of AI workloads
 */
export class GreenAIAdvisor {
  private logger: Logger;
  private modelMetrics: Map<string, GreenAIMetrics> = new Map();

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Analyze AI model and generate green recommendations
   */
  async analyzeModel(metrics: GreenAIMetrics): Promise<GreenAIRecommendation[]> {
    try {
      this.logger.info(`Analyzing model: ${metrics.modelName}`);
      
      // Store metrics
      this.modelMetrics.set(metrics.modelId, metrics);

      const recommendations: GreenAIRecommendation[] = [];

      // Check training energy consumption
      if (metrics.trainingEnergy > 100) {
        recommendations.push(...this.getTrainingOptimizationRecommendations(metrics));
      }

      // Check inference efficiency
      if (metrics.inferenceEnergy > 10) {
        recommendations.push(...this.getInferenceOptimizationRecommendations(metrics));
      }

      // Check model size
      if (metrics.parameters > 1e9) {
        recommendations.push(...this.getModelCompressionRecommendations(metrics));
      }

      // Check carbon footprint
      if (metrics.trainingCarbon > 50) {
        recommendations.push(...this.getCarbonReductionRecommendations(metrics));
      }

      // General green AI best practices
      recommendations.push(...this.getGeneralRecommendations(metrics));

      // Sort by priority
      recommendations.sort((a, b) => {
        const priorityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });

      this.logger.info(`Generated ${recommendations.length} recommendations for ${metrics.modelName}`);
      return recommendations;
    } catch (error) {
      this.logger.error('Error analyzing model', error);
      throw new DataCollectionError('Failed to analyze model', error);
    }
  }

  /**
   * Get training optimization recommendations
   */
  private getTrainingOptimizationRecommendations(metrics: GreenAIMetrics): GreenAIRecommendation[] {
    const recommendations: GreenAIRecommendation[] = [];

    recommendations.push({
      id: `training-schedule-${metrics.modelId}`,
      type: 'SCHEDULING',
      priority: 'HIGH',
      title: 'Schedule Training During Low-Carbon Hours',
      description: 'Training consumes significant energy. Schedule training jobs during hours when grid carbon intensity is lowest (typically overnight or during high renewable energy generation periods).',
      impact: {
        energyReduction: 0,
        carbonReduction: 30,
        performanceImpact: 0
      },
      implementation: {
        difficulty: 'EASY',
        estimatedTime: '1-2 hours',
        steps: [
          'Analyze grid carbon intensity patterns for your region',
          'Identify optimal training windows',
          'Implement job scheduling automation',
          'Monitor and adjust schedule based on results'
        ]
      }
    });

    recommendations.push({
      id: `training-region-${metrics.modelId}`,
      type: 'INFRASTRUCTURE',
      priority: 'MEDIUM',
      title: 'Train in Green Regions',
      description: 'Select cloud regions with high renewable energy availability for training workloads.',
      impact: {
        energyReduction: 0,
        carbonReduction: 40,
        performanceImpact: -5
      },
      implementation: {
        difficulty: 'MODERATE',
        estimatedTime: '2-4 hours',
        steps: [
          'Identify regions with renewable energy',
          'Assess data transfer costs and latency',
          'Configure training pipeline for target region',
          'Validate performance and adjust if needed'
        ]
      }
    });

    return recommendations;
  }

  /**
   * Get inference optimization recommendations
   */
  private getInferenceOptimizationRecommendations(metrics: GreenAIMetrics): GreenAIRecommendation[] {
    const recommendations: GreenAIRecommendation[] = [];

    recommendations.push({
      id: `inference-batching-${metrics.modelId}`,
      type: 'MODEL_OPTIMIZATION',
      priority: 'HIGH',
      title: 'Implement Dynamic Batching',
      description: 'Group multiple inference requests together to improve GPU utilization and reduce per-request energy consumption.',
      impact: {
        energyReduction: 25,
        carbonReduction: 25,
        performanceImpact: 5
      },
      implementation: {
        difficulty: 'MODERATE',
        estimatedTime: '4-8 hours',
        steps: [
          'Analyze request patterns',
          'Implement batching logic with configurable parameters',
          'Set appropriate batch size and timeout',
          'Monitor latency and throughput',
          'Optimize batch parameters based on metrics'
        ]
      }
    });

    return recommendations;
  }

  /**
   * Get model compression recommendations
   */
  private getModelCompressionRecommendations(metrics: GreenAIMetrics): GreenAIRecommendation[] {
    const recommendations: GreenAIRecommendation[] = [];

    recommendations.push({
      id: `quantization-${metrics.modelId}`,
      type: 'QUANTIZATION',
      priority: 'HIGH',
      title: 'Apply Model Quantization',
      description: 'Reduce model precision from FP32 to INT8 or mixed precision to decrease model size and energy consumption with minimal accuracy loss.',
      impact: {
        energyReduction: 40,
        carbonReduction: 40,
        performanceImpact: -2
      },
      implementation: {
        difficulty: 'MODERATE',
        estimatedTime: '1-2 days',
        steps: [
          'Evaluate current model accuracy baseline',
          'Apply post-training quantization',
          'Validate accuracy on test set',
          'If accuracy loss > 1%, consider quantization-aware training',
          'Deploy quantized model and monitor performance'
        ]
      }
    });

    recommendations.push({
      id: `pruning-${metrics.modelId}`,
      type: 'PRUNING',
      priority: 'MEDIUM',
      title: 'Prune Redundant Parameters',
      description: 'Remove unnecessary neural network connections to reduce model size and computational requirements.',
      impact: {
        energyReduction: 30,
        carbonReduction: 30,
        performanceImpact: -3
      },
      implementation: {
        difficulty: 'COMPLEX',
        estimatedTime: '3-5 days',
        steps: [
          'Analyze layer importance and redundancy',
          'Apply structured or unstructured pruning',
          'Fine-tune pruned model',
          'Validate accuracy retention',
          'Iterate pruning ratio if needed'
        ]
      }
    });

    return recommendations;
  }

  /**
   * Get carbon reduction recommendations
   */
  private getCarbonReductionRecommendations(metrics: GreenAIMetrics): GreenAIRecommendation[] {
    return [{
      id: `carbon-aware-${metrics.modelId}`,
      type: 'INFRASTRUCTURE',
      priority: 'HIGH',
      title: 'Implement Carbon-Aware Computing',
      description: 'Dynamically shift workloads based on real-time grid carbon intensity data.',
      impact: {
        energyReduction: 0,
        carbonReduction: 35,
        performanceImpact: -5
      },
      implementation: {
        difficulty: 'COMPLEX',
        estimatedTime: '1-2 weeks',
        steps: [
          'Integrate with carbon intensity APIs',
          'Implement workload scheduling logic',
          'Set carbon intensity thresholds',
          'Configure multi-region fallbacks',
          'Monitor carbon savings and adjust policies'
        ]
      }
    }];
  }

  /**
   * Get general green AI recommendations
   */
  private getGeneralRecommendations(metrics: GreenAIMetrics): GreenAIRecommendation[] {
    return [
      {
        id: `monitoring-${metrics.modelId}`,
        type: 'INFRASTRUCTURE',
        priority: 'MEDIUM',
        title: 'Implement Energy Monitoring',
        description: 'Add comprehensive energy and carbon tracking to all AI workloads.',
        impact: {
          energyReduction: 0,
          carbonReduction: 0,
          performanceImpact: 0
        },
        implementation: {
          difficulty: 'EASY',
          estimatedTime: '2-4 hours',
          steps: [
            'Instrument training and inference code',
            'Collect energy metrics',
            'Set up monitoring dashboards',
            'Create alerts for anomalies'
          ]
        }
      },
      {
        id: `resource-scaling-${metrics.modelId}`,
        type: 'INFRASTRUCTURE',
        priority: 'MEDIUM',
        title: 'Optimize Resource Allocation',
        description: 'Right-size compute resources to match actual workload requirements.',
        impact: {
          energyReduction: 20,
          carbonReduction: 20,
          performanceImpact: 0
        },
        implementation: {
          difficulty: 'EASY',
          estimatedTime: '1-2 hours',
          steps: [
            'Profile actual resource utilization',
            'Identify over-provisioned resources',
            'Adjust instance types and counts',
            'Implement auto-scaling policies'
          ]
        }
      }
    ];
  }

  /**
   * Calculate model efficiency score
   */
  calculateEfficiencyScore(metrics: GreenAIMetrics): number {
    // Score from 0-100, higher is better
    const parameterScore = Math.max(0, 100 - (metrics.parameters / 1e10) * 10);
    const energyScore = Math.max(0, 100 - (metrics.trainingEnergy / 1000) * 10);
    const carbonScore = Math.max(0, 100 - (metrics.trainingCarbon / 500) * 10);
    
    return (parameterScore + energyScore + carbonScore) / 3;
  }

  /**
   * Compare models for efficiency
   */
  compareModels(modelId1: string, modelId2: string): {
    winner: string;
    comparison: Record<string, { model1: number; model2: number; better: string }>;
  } | null {
    const model1 = this.modelMetrics.get(modelId1);
    const model2 = this.modelMetrics.get(modelId2);

    if (!model1 || !model2) {
      this.logger.warn('One or both models not found for comparison');
      return null;
    }

    const comparison = {
      trainingEnergy: {
        model1: model1.trainingEnergy,
        model2: model2.trainingEnergy,
        better: model1.trainingEnergy < model2.trainingEnergy ? model1.modelId : model2.modelId
      },
      inferenceEnergy: {
        model1: model1.inferenceEnergy,
        model2: model2.inferenceEnergy,
        better: model1.inferenceEnergy < model2.inferenceEnergy ? model1.modelId : model2.modelId
      },
      carbon: {
        model1: model1.trainingCarbon,
        model2: model2.trainingCarbon,
        better: model1.trainingCarbon < model2.trainingCarbon ? model1.modelId : model2.modelId
      }
    };

    const score1 = this.calculateEfficiencyScore(model1);
    const score2 = this.calculateEfficiencyScore(model2);

    return {
      winner: score1 > score2 ? model1.modelId : model2.modelId,
      comparison
    };
  }

  /**
   * Get model metrics
   */
  getModelMetrics(modelId: string): GreenAIMetrics | undefined {
    return this.modelMetrics.get(modelId);
  }

  /**
   * Get all tracked models
   */
  getAllModels(): GreenAIMetrics[] {
    return Array.from(this.modelMetrics.values());
  }
}