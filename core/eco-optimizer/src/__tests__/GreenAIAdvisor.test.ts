import { GreenAIAdvisor } from '../ai/GreenAIAdvisor';
import { GreenAIMetrics } from '../types';

describe('GreenAIAdvisor', () => {
  let advisor: GreenAIAdvisor;
  const mockLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
  };

  beforeEach(() => {
    advisor = new GreenAIAdvisor(mockLogger);
    jest.clearAllMocks();
  });

  describe('analyzeModel', () => {
    it('should generate recommendations for high-energy models', async () => {
      const metrics: GreenAIMetrics = {
        modelId: 'model-123',
        modelName: 'Large Language Model',
        trainingEnergy: 250,
        trainingCarbon: 125,
        inferenceEnergy: 15,
        inferenceCarbon: 7.5,
        efficiency: 0.6,
        parameters: 2e9,
        flops: 5e15
      };

      const recommendations = await advisor.analyzeModel(metrics);

      expect(recommendations).toBeDefined();
      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations[0]).toHaveProperty('type');
      expect(recommendations[0]).toHaveProperty('priority');
      expect(recommendations[0]).toHaveProperty('impact');
    });

    it('should prioritize high-priority recommendations', async () => {
      const metrics: GreenAIMetrics = {
        modelId: 'model-456',
        modelName: 'Efficient Model',
        trainingEnergy: 50,
        trainingCarbon: 25,
        inferenceEnergy: 5,
        inferenceCarbon: 2.5,
        efficiency: 0.9,
        parameters: 5e8,
        flops: 1e14
      };

      const recommendations = await advisor.analyzeModel(metrics);

      // First recommendation should be highest priority
      if (recommendations.length > 1) {
        const priorities = { HIGH: 3, MEDIUM: 2, LOW: 1 };
        expect(priorities[recommendations[0].priority])
          .toBeGreaterThanOrEqual(priorities[recommendations[1].priority]);
      }
    });
  });

  describe('calculateEfficiencyScore', () => {
    it('should calculate efficiency score between 0-100', () => {
      const metrics: GreenAIMetrics = {
        modelId: 'model-789',
        modelName: 'Test Model',
        trainingEnergy: 100,
        trainingCarbon: 50,
        inferenceEnergy: 10,
        inferenceCarbon: 5,
        efficiency: 0.8,
        parameters: 1e9,
        flops: 1e15
      };

      const score = advisor.calculateEfficiencyScore(metrics);

      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  describe('compareModels', () => {
    it('should compare two models and identify winner', async () => {
      const model1: GreenAIMetrics = {
        modelId: 'model-1',
        modelName: 'Efficient Model',
        trainingEnergy: 50,
        trainingCarbon: 25,
        inferenceEnergy: 5,
        inferenceCarbon: 2.5,
        efficiency: 0.9,
        parameters: 5e8,
        flops: 1e14
      };

      const model2: GreenAIMetrics = {
        modelId: 'model-2',
        modelName: 'Heavy Model',
        trainingEnergy: 200,
        trainingCarbon: 100,
        inferenceEnergy: 20,
        inferenceCarbon: 10,
        efficiency: 0.6,
        parameters: 3e9,
        flops: 5e15
      };

      await advisor.analyzeModel(model1);
      await advisor.analyzeModel(model2);

      const comparison = advisor.compareModels('model-1', 'model-2');

      expect(comparison).toBeDefined();
      expect(comparison!.winner).toBe('model-1');
      expect(comparison!.comparison).toHaveProperty('trainingEnergy');
      expect(comparison!.comparison).toHaveProperty('inferenceEnergy');
      expect(comparison!.comparison).toHaveProperty('carbon');
    });
  });
});