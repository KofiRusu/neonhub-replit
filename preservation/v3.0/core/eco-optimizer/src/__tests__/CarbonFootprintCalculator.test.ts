import { CarbonFootprintCalculator } from '../carbon/CarbonFootprintCalculator';
import { CloudProvider, ResourceType, EnergyUsageData } from '../types';

describe('CarbonFootprintCalculator', () => {
  let calculator: CarbonFootprintCalculator;
  const mockLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
  };

  beforeEach(() => {
    calculator = new CarbonFootprintCalculator(mockLogger);
    jest.clearAllMocks();
  });

  describe('calculateFootprint', () => {
    it('should calculate carbon footprint from energy usage', async () => {
      const energyUsage: EnergyUsageData = {
        total: 1000,
        byProvider: {
          [CloudProvider.AWS]: 600,
          [CloudProvider.AZURE]: 300,
          [CloudProvider.GCP]: 100,
          [CloudProvider.HYBRID]: 0
        },
        byResourceType: {
          [ResourceType.COMPUTE]: 500,
          [ResourceType.STORAGE]: 200,
          [ResourceType.NETWORK]: 100,
          [ResourceType.DATABASE]: 150,
          [ResourceType.ML_TRAINING]: 50,
          [ResourceType.ML_INFERENCE]: 0
        },
        byRegion: {
          'us-east-1': 500,
          'eu-west-1': 300,
          'ap-southeast-1': 200
        },
        timeRange: {
          start: new Date('2024-01-01'),
          end: new Date('2024-01-31')
        }
      };

      const footprint = await calculator.calculateFootprint(energyUsage);

      expect(footprint).toBeDefined();
      expect(footprint.totalEmissions).toBeGreaterThan(0);
      expect(footprint.netEmissions).toBe(footprint.totalEmissions);
      expect(footprint.offset).toBe(0);
    });
  });

  describe('generateReport', () => {
    it('should generate carbon report with trends', async () => {
      const currentFootprint = {
        totalEmissions: 500,
        emissionsByProvider: {
          [CloudProvider.AWS]: 300,
          [CloudProvider.AZURE]: 150,
          [CloudProvider.GCP]: 50,
          [CloudProvider.HYBRID]: 0
        },
        emissionsByResourceType: {
          [ResourceType.COMPUTE]: 250,
          [ResourceType.STORAGE]: 100,
          [ResourceType.NETWORK]: 50,
          [ResourceType.DATABASE]: 75,
          [ResourceType.ML_TRAINING]: 25,
          [ResourceType.ML_INFERENCE]: 0
        },
        emissionsByRegion: {
          'us-east-1': 300,
          'eu-west-1': 200
        },
        offset: 0,
        netEmissions: 500
      };

      const report = await calculator.generateReport(currentFootprint);

      expect(report).toBeDefined();
      expect(report.footprint).toEqual(currentFootprint);
      expect(report.recommendations).toBeDefined();
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('applyOffset', () => {
    it('should apply carbon offset to footprint', () => {
      const footprint = {
        totalEmissions: 500,
        emissionsByProvider: {
          [CloudProvider.AWS]: 300,
          [CloudProvider.AZURE]: 150,
          [CloudProvider.GCP]: 50,
          [CloudProvider.HYBRID]: 0
        },
        emissionsByResourceType: {
          [ResourceType.COMPUTE]: 500,
          [ResourceType.STORAGE]: 0,
          [ResourceType.NETWORK]: 0,
          [ResourceType.DATABASE]: 0,
          [ResourceType.ML_TRAINING]: 0,
          [ResourceType.ML_INFERENCE]: 0
        },
        emissionsByRegion: {},
        offset: 0,
        netEmissions: 500
      };

      const offsetFootprint = calculator.applyOffset(footprint, 200);

      expect(offsetFootprint.offset).toBe(200);
      expect(offsetFootprint.netEmissions).toBe(300);
    });
  });
});