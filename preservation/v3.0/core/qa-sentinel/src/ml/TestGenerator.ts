import * as tf from '@tensorflow/tfjs-node';
import { mean, std, min, max } from 'stats-lite';
import { TestCase, FailurePattern, TelemetryData, QASentinelConfig } from '../types';

export class MLTestGenerator {
  private model: tf.Sequential | null = null;
  private config: QASentinelConfig;
  private trainingData: Array<{ features: number[], label: number }> = [];
  private featureStats: Map<string, { mean: number, std: number }> = new Map();

  constructor(config: QASentinelConfig) {
    this.config = config;
  }

  async initialize(): Promise<void> {
    // Create a simple neural network for test case generation
    this.model = tf.sequential({
      layers: [
        tf.layers.dense({ inputShape: [10], units: 64, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({ units: 32, activation: 'relu' }),
        tf.layers.dense({ units: 1, activation: 'sigmoid' })
      ]
    });

    this.model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'binaryCrossentropy',
      metrics: ['accuracy']
    });
  }

  async train(telemetryData: TelemetryData[], failurePatterns: FailurePattern[]): Promise<void> {
    if (!this.model) await this.initialize();

    // Prepare training data
    this.trainingData = [];

    // Calculate feature statistics
    this.calculateFeatureStats(telemetryData);

    // Generate training examples from telemetry and failure patterns
    for (const pattern of failurePatterns) {
      const features = this.extractFeatures(pattern, telemetryData);
      const label = pattern.riskScore > 0.7 ? 1 : 0; // High risk = needs test

      this.trainingData.push({ features, label });
    }

    // Add negative examples (normal patterns)
    const normalPatterns = this.generateNormalPatterns(telemetryData);
    for (const pattern of normalPatterns) {
      const features = this.extractFeatures(pattern, telemetryData);
      this.trainingData.push({ features, label: 0 });
    }

    if (this.trainingData.length > 0) {
      const { features, labels } = this.prepareTrainingData();

      await this.model.fit(features, labels, {
        epochs: 50,
        batchSize: 32,
        validationSplit: 0.2,
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            if (epoch % 10 === 0) {
              console.log(`Epoch ${epoch}: loss = ${logs?.loss}, accuracy = ${logs?.acc}`);
            }
          }
        }
      });
    }
  }

  private calculateFeatureStats(telemetryData: TelemetryData[]): void {
    const metricsByType = new Map<string, number[]>();

    for (const data of telemetryData) {
      if (!metricsByType.has(data.metric)) {
        metricsByType.set(data.metric, []);
      }
      metricsByType.get(data.metric)!.push(data.value);
    }

    for (const [metric, values] of metricsByType) {
      if (values.length > 1) {
        this.featureStats.set(metric, {
          mean: mean(values),
          std: std(values)
        });
      }
    }
  }

  private extractFeatures(pattern: FailurePattern, telemetryData: TelemetryData[]): number[] {
    const features: number[] = [];

    // Risk score
    features.push(pattern.riskScore);

    // Frequency (normalized)
    features.push(Math.min(pattern.frequency / 100, 1));

    // Related metrics statistics
    for (const metric of pattern.relatedMetrics.slice(0, 5)) {
      const metricData = telemetryData.filter(d => d.metric === metric);
      if (metricData.length > 0) {
        const values = metricData.map(d => d.value);
        features.push(mean(values), std(values), min(values), max(values));
      } else {
        features.push(0, 0, 0, 0);
      }
    }

    // Pad to fixed size
    while (features.length < 10) {
      features.push(0);
    }

    return features.slice(0, 10);
  }

  private generateNormalPatterns(telemetryData: TelemetryData[]): FailurePattern[] {
    const patterns: FailurePattern[] = [];
    const components = [...new Set(telemetryData.map(d => d.component))];

    for (const component of components) {
      patterns.push({
        id: `normal-${component}`,
        component,
        errorType: 'none',
        frequency: 0,
        lastOccurred: new Date(),
        relatedMetrics: [],
        riskScore: 0,
        suggestedTests: []
      });
    }

    return patterns;
  }

  private prepareTrainingData(): { features: tf.Tensor, labels: tf.Tensor } {
    const features = tf.tensor2d(this.trainingData.map(d => d.features));
    const labels = tf.tensor1d(this.trainingData.map(d => d.label));

    return { features, labels };
  }

  async generateTest(component: string, telemetryData: TelemetryData[]): Promise<TestCase | null> {
    if (!this.model) return null;

    // Create a mock failure pattern for prediction
    const mockPattern: FailurePattern = {
      id: `predict-${Date.now()}`,
      component,
      errorType: 'predicted',
      frequency: 1,
      lastOccurred: new Date(),
      relatedMetrics: ['response_time', 'error_rate'],
      riskScore: 0.5,
      suggestedTests: []
    };

    const features = this.extractFeatures(mockPattern, telemetryData);
    const inputTensor = tf.tensor2d([features]);

    const prediction = this.model.predict(inputTensor) as tf.Tensor;
    const confidence = (await prediction.data())[0];

    inputTensor.dispose();
    prediction.dispose();

    if (confidence > this.config.testGeneration.confidenceThreshold) {
      return this.createTestFromPrediction(component, confidence, telemetryData);
    }

    return null;
  }

  private createTestFromPrediction(component: string, confidence: number, telemetryData: TelemetryData[]): TestCase {
    const testId = `ml-test-${component}-${Date.now()}`;

    return {
      id: testId,
      name: `ML Generated Test: ${component} Resilience`,
      description: `Automatically generated test for ${component} based on ML analysis of telemetry patterns`,
      category: 'integration',
      priority: confidence > 0.8 ? 'high' : 'medium',
      component,
      scenario: {
        preconditions: [
          `${component} service is operational`,
          'Telemetry collection is active'
        ],
        steps: [
          {
            id: '1',
            description: `Simulate load on ${component}`,
            action: 'simulate_load',
            parameters: { component, duration: 30000 },
            expectedDuration: 30000
          },
          {
            id: '2',
            description: 'Monitor system metrics during load',
            action: 'monitor_metrics',
            parameters: { metrics: ['response_time', 'error_rate', 'cpu_usage'] },
            expectedDuration: 5000
          }
        ],
        assertions: [
          {
            type: 'less',
            target: 'error_rate',
            value: 0.05,
            tolerance: 0.01
          },
          {
            type: 'greater',
            target: 'response_time',
            value: 100
          }
        ]
      },
      expectedResult: { resilient: true, errorRate: '< 5%', responseTime: '< 2000ms' },
      timeout: 60000,
      tags: ['ml-generated', 'resilience', 'load-test', component],
      generatedBy: 'ml',
      confidence,
      createdAt: new Date(),
      executionCount: 0,
      successRate: 0
    };
  }

  async predictTestNeed(component: string, currentMetrics: Record<string, number>): Promise<number> {
    if (!this.model) return 0;

    // Create features from current metrics
    const features = this.createFeaturesFromMetrics(component, currentMetrics);
    const inputTensor = tf.tensor2d([features]);

    const prediction = this.model.predict(inputTensor) as tf.Tensor;
    const confidence = (await prediction.data())[0];

    inputTensor.dispose();
    prediction.dispose();

    return confidence;
  }

  private createFeaturesFromMetrics(component: string, metrics: Record<string, number>): number[] {
    const features: number[] = [];

    // Risk score (estimated)
    features.push(0.5);

    // Frequency (estimated)
    features.push(0.1);

    // Metric statistics
    for (const [metric, value] of Object.entries(metrics)) {
      const stats = this.featureStats.get(metric);
      if (stats) {
        const normalizedValue = (value - stats.mean) / stats.std;
        features.push(normalizedValue, stats.std, Math.min(value, 100), Math.max(value, 0));
      } else {
        features.push(value, 1, value, value);
      }
    }

    // Pad to fixed size
    while (features.length < 10) {
      features.push(0);
    }

    return features.slice(0, 10);
  }

  getModelStats(): { accuracy?: number, loss?: number, trained: boolean } {
    return {
      trained: this.model !== null,
      // In a real implementation, you'd track these during training
      accuracy: undefined,
      loss: undefined
    };
  }

  async saveModel(path: string): Promise<void> {
    if (this.model) {
      await this.model.save(`file://${path}`);
    }
  }

  async loadModel(path: string): Promise<void> {
    try {
      this.model = await tf.loadLayersModel(`file://${path}`);
      this.model.compile({
        optimizer: tf.train.adam(0.001),
        loss: 'binaryCrossentropy',
        metrics: ['accuracy']
      });
    } catch (error) {
      console.error('Failed to load ML model:', error);
    }
  }
}