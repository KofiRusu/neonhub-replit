import { EfficiencyAnalyzer } from '../analysis/EfficiencyAnalyzer';
import { EnergyMetrics, CloudProvider, ResourceType, EnergySource } from '../types';

describe('EfficiencyAnalyzer', () => {
  let analyzer: EfficiencyAnalyzer;
  const mockLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
  };

  beforeEach(() => {
    analyzer = new EfficiencyAnalyzer(mockLogger);
    jest.clearAllMocks();
  });

  describe('calculateEfficiencyMetrics', () => {
    it('should calculate efficiency metrics from energy data', async () => {
      const energyMetrics: EnergyMetrics[] = [
        {
          timestamp: new Date(),
          provider: CloudProvider.AWS,
          region: 'us-east-1',
          resourceType: ResourceType.COMPUTE,
          energyConsumption: 100,
          powerUsage: 1000,
          efficiency: 1.2,
          source: EnergySource.MIXED
        }
      ];

      const result = await analyzer.calculateEfficiencyMetrics(energyMetrics);

      expect(result).toBeDefined();
      expect(result.pue).toBe(1.2);
      expect(result.overallEfficiency).toBeGreaterThan(0);
      expect(result.overallEfficiency).toBeLessThanOrEqual(100);
    });

    it('should handle empty energy metrics', async () => {
      const result = await analyzer.calculateEfficiencyMetrics([]);

      expect(result).toBeDefined();
      expect(result.pue).toBe(1.5); // Default fallback
    });
  });

  describe('generateBenchmarks', () => {
    it('should generate efficiency benchmarks', () => {
      const metrics = {
        overallEfficiency: 80,
        energyEfficiency: 75,
        costEfficiency: 70,
        carbonEfficiency: 65,
        pue: 1.3,
        cue: 0.5,
        wue: 1.8
      };

      const benchmarks = analyzer.generateBenchmarks(metrics);

      expect(benchmarks).toBeDefined();
      expect(benchmarks.length).toBeGreaterThan(0);
      expect(benchmarks[0]).toHaveProperty('category');
      expect(benchmarks[0]).toHaveProperty('metric');
      expect(benchmarks[0]).toHaveProperty('currentValue');
      expect(benchmarks[0]).toHaveProperty('industryAverage');
      expect(benchmarks[0]).toHaveProperty('bestInClass');
      expect(benchmarks[0]).toHaveProperty('status');
    });
  });

  describe('analyzeEfficiency', () => {
    it('should perform full efficiency analysis', async () => {
      const energyMetrics: EnergyMetrics[] = [
        {
          timestamp: new Date(),
          provider: CloudProvider.AWS,
          region: 'us-east-1',
          resourceType: ResourceType.COMPUTE,
          energyConsumption: 100,
          powerUsage: 1000,
          efficiency: 1.2,
          source: EnergySource.MIXED
        }
      ];

      const analysis = await analyzer.analyzeEfficiency(energyMetrics);

      expect(analysis).toBeDefined();
      expect(analysis.timestamp).toBeInstanceOf(Date);
      expect(analysis.metrics).toBeDefined();
      expect(analysis.benchmarks).toBeDefined();
      expect(analysis.trends).toBeDefined();
      expect(analysis.alerts).toBeDefined();
    });
  });

  describe('getEfficiencyScore', () => {
    it('should return efficiency score between 0 and 100', () => {
      const metrics = {
        overallEfficiency: 85,
        energyEfficiency: 80,
        costEfficiency: 75,
        carbonEfficiency: 70,
        pue: 1.2,
        cue: 0.5,
        wue: 1.5
      };

      const score = analyzer.getEfficiencyScore(metrics);

      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
      expect(score).toBe(85);
    });
  });

  describe('compareEfficiency', () => {
    it('should compare two efficiency metrics', () => {
      const current = {
        overallEfficiency: 85,
        energyEfficiency: 80,
        costEfficiency: 75,
        carbonEfficiency: 70,
        pue: 1.2,
        cue: 0.5,
        wue: 1.5
      };

      const previous = {
        overallEfficiency: 75,
        energyEfficiency: 70,
        costEfficiency: 65,
        carbonEfficiency: 60,
        pue: 1.4,
        cue: 0.6,
        wue: 1.8
      };

      const comparison = analyzer.compareEfficiency(current, previous);

      expect(comparison).toBeDefined();
      expect(comparison.improved).toBe(true);
      expect(comparison.change).toBeGreaterThan(0);
      expect(comparison.details).toHaveProperty('overall');
      expect(comparison.details).toHaveProperty('energy');
      expect(comparison.details).toHaveProperty('cost');
      expect(comparison.details).toHaveProperty('carbon');
    });
  });
});