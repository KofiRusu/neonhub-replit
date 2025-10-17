import { IntelligenceAggregationRequest, IntelligenceAggregationAlgorithm, ModelSummary } from '../types';
import { Logger } from '../utils/Logger';
import { ConsoleLogger } from '../utils/Logger';

export class IntelligenceAggregator {
  private logger: Logger;

  constructor(logger?: Logger) {
    this.logger = logger || new ConsoleLogger();
  }

  /**
   * Aggregate intelligence from multiple models
   */
  async aggregateIntelligence(
    request: IntelligenceAggregationRequest,
    modelSummaries: ModelSummary[]
  ): Promise<ModelSummary> {
    switch (request.algorithm) {
      case IntelligenceAggregationAlgorithm.FED_AVG:
        return this.federatedAverage(modelSummaries, request.weights);

      case IntelligenceAggregationAlgorithm.ENSEMBLE_AVERAGE:
        return this.ensembleAverage(modelSummaries, request.weights);

      case IntelligenceAggregationAlgorithm.STACKED_GENERALIZATION:
        return this.stackedGeneralization(modelSummaries);

      case IntelligenceAggregationAlgorithm.META_LEARNING_AGGREGATION:
        return this.metaLearningAggregation(modelSummaries);

      default:
        throw new Error(`Unsupported aggregation algorithm: ${request.algorithm}`);
    }
  }

  /**
   * Federated averaging of model weights
   */
  private federatedAverage(
    models: ModelSummary[],
    weights?: number[]
  ): ModelSummary {
    if (models.length === 0) {
      throw new Error('No models provided for aggregation');
    }

    const baseModel = models[0];
    const aggregatedWeights: Record<string, number[][]> = {};

    // Use equal weights if not provided
    const modelWeights = weights || models.map(() => 1 / models.length);

    // Aggregate weights for each layer
    for (const layerName of Object.keys(baseModel.layers.reduce((acc, layer) => {
      if (layer.weights) acc[layer.name] = layer.weights;
      return acc;
    }, {} as Record<string, number[][]>))) {

      const layerWeights = models
        .map((model, index) => ({
          weights: model.layers.find(l => l.name === layerName)?.weights,
          weight: modelWeights[index]
        }))
        .filter(item => item.weights);

      if (layerWeights.length > 0) {
        aggregatedWeights[layerName] = this.averageWeights(
          layerWeights.map(item => item.weights!),
          layerWeights.map(item => item.weight)
        );
      }
    }

    // Create aggregated model summary
    const aggregatedModel: ModelSummary = {
      ...baseModel,
      modelId: `aggregated_${Date.now()}`,
      version: '1.0.0',
      layers: baseModel.layers.map(layer => ({
        ...layer,
        weights: aggregatedWeights[layer.name]
      })),
      performance: this.aggregatePerformance(models),
      metadata: {
        ...baseModel.metadata,
        description: `Aggregated from ${models.length} models using FedAvg`,
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
    };

    this.logger.info(`Aggregated ${models.length} models using federated averaging`);
    return aggregatedModel;
  }

  /**
   * Ensemble averaging for model predictions
   */
  private ensembleAverage(
    models: ModelSummary[],
    weights?: number[]
  ): ModelSummary {
    const baseModel = models[0];
    const modelWeights = weights || models.map(() => 1 / models.length);

    // Aggregate performance metrics
    const aggregatedPerformance = this.aggregatePerformance(models);

    const aggregatedModel: ModelSummary = {
      ...baseModel,
      modelId: `ensemble_${Date.now()}`,
      version: '1.0.0',
      performance: aggregatedPerformance,
      metadata: {
        ...baseModel.metadata,
        description: `Ensemble of ${models.length} models`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        tags: [...(baseModel.metadata.tags || []), 'ensemble']
      }
    };

    this.logger.info(`Created ensemble from ${models.length} models`);
    return aggregatedModel;
  }

  /**
   * Stacked generalization aggregation
   */
  private stackedGeneralization(models: ModelSummary[]): ModelSummary {
    const baseModel = models[0];

    // Create a meta-model that learns to combine predictions
    const metaModel: ModelSummary = {
      ...baseModel,
      modelId: `stacked_${Date.now()}`,
      version: '1.0.0',
      architecture: 'stacked_generalization',
      layers: [
        {
          name: 'meta_layer',
          type: 'dense',
          inputShape: [models.length],
          outputShape: [1],
          parameters: models.length * 10, // Simplified
          weights: this.initializeMetaWeights(models.length)
        }
      ],
      performance: this.aggregatePerformance(models),
      metadata: {
        ...baseModel.metadata,
        description: `Stacked generalization of ${models.length} models`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        tags: [...(baseModel.metadata.tags || []), 'stacked', 'meta-learning']
      }
    };

    this.logger.info(`Created stacked generalization model from ${models.length} base models`);
    return metaModel;
  }

  /**
   * Meta-learning aggregation
   */
  private metaLearningAggregation(models: ModelSummary[]): ModelSummary {
    const baseModel = models[0];

    // Extract meta-features from models
    const metaFeatures = models.map(model => ({
      accuracy: model.performance.accuracy,
      loss: model.performance.loss,
      parameters: model.parameters,
      trainingTime: model.metadata.trainingTime
    }));

    // Create meta-learner model
    const metaLearner: ModelSummary = {
      ...baseModel,
      modelId: `meta_learner_${Date.now()}`,
      version: '1.0.0',
      architecture: 'meta_learning_aggregator',
      layers: [
        {
          name: 'meta_features',
          type: 'dense',
          inputShape: [4], // accuracy, loss, parameters, trainingTime
          outputShape: [models.length],
          parameters: 4 * models.length,
          weights: this.initializeMetaWeights(4, models.length)
        }
      ],
      performance: this.aggregatePerformance(models),
      metadata: {
        ...baseModel.metadata,
        description: `Meta-learning aggregator for ${models.length} models`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        tags: [...(baseModel.metadata.tags || []), 'meta-learning', 'aggregator']
      }
    };

    this.logger.info(`Created meta-learning aggregator for ${models.length} models`);
    return metaLearner;
  }

  /**
   * Average weights across models
   */
  private averageWeights(
    weightMatrices: number[][][],
    weights: number[]
  ): number[][] {
    if (weightMatrices.length === 0) return [];

    const result: number[][] = [];
    const rows = weightMatrices[0].length;
    const cols = weightMatrices[0][0]?.length || 0;

    for (let i = 0; i < rows; i++) {
      result[i] = [];
      for (let j = 0; j < cols; j++) {
        let sum = 0;
        let totalWeight = 0;

        for (let k = 0; k < weightMatrices.length; k++) {
          if (weightMatrices[k][i] && weightMatrices[k][i][j] !== undefined) {
            sum += weightMatrices[k][i][j] * weights[k];
            totalWeight += weights[k];
          }
        }

        result[i][j] = totalWeight > 0 ? sum / totalWeight : 0;
      }
    }

    return result;
  }

  /**
   * Aggregate performance metrics
   */
  private aggregatePerformance(models: ModelSummary[]): any {
    const performances = models.map(m => m.performance);

    return {
      accuracy: performances.reduce((sum, p) => sum + p.accuracy, 0) / performances.length,
      loss: performances.reduce((sum, p) => sum + p.loss, 0) / performances.length,
      f1Score: performances
        .filter(p => p.f1Score)
        .reduce((sum, p) => sum + (p.f1Score || 0), 0) / performances.filter(p => p.f1Score).length || undefined,
      datasetSize: Math.max(...performances.map(p => p.datasetSize)),
      trainingEpochs: Math.max(...performances.map(p => p.trainingEpochs)),
      validationMetrics: this.aggregateValidationMetrics(performances)
    };
  }

  /**
   * Aggregate validation metrics
   */
  private aggregateValidationMetrics(performances: any[]): Record<string, number> {
    const allMetrics: Record<string, number[]> = {};

    performances.forEach(perf => {
      if (perf.validationMetrics) {
        Object.entries(perf.validationMetrics).forEach(([key, value]) => {
          if (!allMetrics[key]) allMetrics[key] = [];
          allMetrics[key].push(value as number);
        });
      }
    });

    const aggregated: Record<string, number> = {};
    Object.entries(allMetrics).forEach(([key, values]) => {
      aggregated[key] = values.reduce((sum, val) => sum + val, 0) / values.length;
    });

    return aggregated;
  }

  /**
   * Initialize meta weights for meta-learning
   */
  private initializeMetaWeights(inputSize: number, outputSize: number = 1): number[][] {
    const weights: number[][] = [];

    for (let i = 0; i < inputSize; i++) {
      weights[i] = [];
      for (let j = 0; j < outputSize; j++) {
        // Initialize with small random values
        weights[i][j] = (Math.random() - 0.5) * 0.1;
      }
    }

    return weights;
  }

  /**
   * Validate aggregation request
   */
  validateAggregationRequest(request: IntelligenceAggregationRequest): boolean {
    return !!(
      request.aggregationId &&
      request.modelIds &&
      request.modelIds.length > 0 &&
      request.algorithm &&
      request.minParticipants > 0
    );
  }
}