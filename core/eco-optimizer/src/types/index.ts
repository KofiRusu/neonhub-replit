/**
 * Types and interfaces for the Eco-Optimizer module
 */

// Cloud Provider Types
export enum CloudProvider {
  AWS = 'AWS',
  AZURE = 'AZURE',
  GCP = 'GCP',
  HYBRID = 'HYBRID'
}

export enum ResourceType {
  COMPUTE = 'COMPUTE',
  STORAGE = 'STORAGE',
  NETWORK = 'NETWORK',
  DATABASE = 'DATABASE',
  ML_TRAINING = 'ML_TRAINING',
  ML_INFERENCE = 'ML_INFERENCE'
}

export enum EnergySource {
  RENEWABLE = 'RENEWABLE',
  FOSSIL = 'FOSSIL',
  NUCLEAR = 'NUCLEAR',
  MIXED = 'MIXED',
  UNKNOWN = 'UNKNOWN'
}

// Energy Monitoring Types
export interface EnergyMetrics {
  timestamp: Date;
  provider: CloudProvider;
  region: string;
  resourceType: ResourceType;
  energyConsumption: number; // kWh
  powerUsage: number; // Watts
  efficiency: number; // PUE (Power Usage Effectiveness)
  source: EnergySource;
}

export interface EnergyUsageData {
  total: number;
  byProvider: Record<CloudProvider, number>;
  byResourceType: Record<ResourceType, number>;
  byRegion: Record<string, number>;
  timeRange: {
    start: Date;
    end: Date;
  };
}

// Carbon Footprint Types
export interface CarbonEmissionFactor {
  provider: CloudProvider;
  region: string;
  gCO2ePerKWh: number; // grams of CO2 equivalent per kWh
  source: string;
  lastUpdated: Date;
}

export interface CarbonFootprint {
  totalEmissions: number; // kg CO2e
  emissionsByProvider: Record<CloudProvider, number>;
  emissionsByResourceType: Record<ResourceType, number>;
  emissionsByRegion: Record<string, number>;
  offset: number; // kg CO2e offset
  netEmissions: number; // kg CO2e after offsets
}

export interface CarbonReport {
  period: {
    start: Date;
    end: Date;
  };
  footprint: CarbonFootprint;
  trends: {
    change: number; // percentage change from previous period
    projection: number; // projected emissions for next period
  };
  recommendations: string[];
}

// Resource Optimization Types
export interface ResourceUtilization {
  resourceId: string;
  resourceType: ResourceType;
  provider: CloudProvider;
  region: string;
  utilizationRate: number; // 0-100%
  averageUtilization: number;
  peakUtilization: number;
  idleTime: number; // hours
  cost: number; // USD
}

export interface OptimizationRecommendation {
  id: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  category: 'RIGHTSIZING' | 'SCHEDULING' | 'MIGRATION' | 'CONSOLIDATION' | 'SHUTDOWN';
  resourceId: string;
  currentState: string;
  recommendedState: string;
  estimatedSavings: {
    energy: number; // kWh
    cost: number; // USD
    carbon: number; // kg CO2e
  };
  implementationEffort: 'LOW' | 'MEDIUM' | 'HIGH';
  description: string;
  actionItems: string[];
}

export interface OptimizationResult {
  recommendations: OptimizationRecommendation[];
  totalPotentialSavings: {
    energy: number;
    cost: number;
    carbon: number;
  };
  implementationRoadmap: {
    phase: string;
    recommendations: string[];
    estimatedDuration: string;
  }[];
}

// Efficiency Analysis Types
export interface EfficiencyMetrics {
  overallEfficiency: number; // 0-100%
  energyEfficiency: number; // 0-100%
  costEfficiency: number; // 0-100%
  carbonEfficiency: number; // 0-100%
  pue: number; // Power Usage Effectiveness
  cue: number; // Carbon Usage Effectiveness
  wue: number; // Water Usage Effectiveness
}

export interface EfficiencyBenchmark {
  category: string;
  metric: string;
  currentValue: number;
  industryAverage: number;
  bestInClass: number;
  percentile: number;
  status: 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'BELOW_AVERAGE' | 'POOR';
}

export interface EfficiencyAnalysis {
  timestamp: Date;
  metrics: EfficiencyMetrics;
  benchmarks: EfficiencyBenchmark[];
  trends: {
    metric: string;
    change: number;
    trend: 'IMPROVING' | 'STABLE' | 'DECLINING';
  }[];
  alerts: {
    severity: 'CRITICAL' | 'WARNING' | 'INFO';
    message: string;
    metric: string;
  }[];
}

// Sustainability Reporting Types
export interface SustainabilityGoal {
  id: string;
  name: string;
  target: number;
  current: number;
  unit: string;
  deadline: Date;
  progress: number; // 0-100%
  status: 'ON_TRACK' | 'AT_RISK' | 'OFF_TRACK' | 'ACHIEVED';
}

export interface SustainabilityReport {
  reportId: string;
  generatedAt: Date;
  period: {
    start: Date;
    end: Date;
  };
  summary: {
    totalEnergyConsumption: number;
    totalCarbonEmissions: number;
    renewableEnergyPercentage: number;
    costSavings: number;
    efficiencyImprovement: number;
  };
  goals: SustainabilityGoal[];
  achievements: string[];
  challenges: string[];
  nextSteps: string[];
  certifications: {
    name: string;
    status: 'ACHIEVED' | 'IN_PROGRESS' | 'PENDING';
    date?: Date;
  }[];
}

// Green AI Types
export interface GreenAIMetrics {
  modelId: string;
  modelName: string;
  trainingEnergy: number; // kWh
  trainingCarbon: number; // kg CO2e
  inferenceEnergy: number; // kWh per 1000 requests
  inferenceCarbon: number; // kg CO2e per 1000 requests
  efficiency: number; // performance per watt
  parameters: number;
  flops: number;
}

export interface GreenAIRecommendation {
  id: string;
  type: 'MODEL_OPTIMIZATION' | 'INFRASTRUCTURE' | 'SCHEDULING' | 'QUANTIZATION' | 'PRUNING';
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  description: string;
  impact: {
    energyReduction: number; // percentage
    carbonReduction: number; // percentage
    performanceImpact: number; // percentage (negative means degradation)
  };
  implementation: {
    difficulty: 'EASY' | 'MODERATE' | 'COMPLEX';
    estimatedTime: string;
    steps: string[];
  };
}

// Configuration Types
export interface EcoOptimizerConfig {
  cloudProviders: {
    provider: CloudProvider;
    credentials: {
      accessKeyId?: string;
      secretAccessKey?: string;
      subscriptionId?: string;
      projectId?: string;
    };
    regions: string[];
  }[];
  monitoring: {
    interval: number; // minutes
    enableRealTime: boolean;
    retentionDays: number;
  };
  optimization: {
    enableAutoOptimization: boolean;
    optimizationThreshold: number; // minimum efficiency percentage to trigger optimization
    approvalRequired: boolean;
  };
  reporting: {
    schedule: 'DAILY' | 'WEEKLY' | 'MONTHLY';
    recipients: string[];
    format: 'PDF' | 'HTML' | 'JSON';
  };
  goals: {
    carbonNeutralityDate?: Date;
    renewableEnergyTarget: number; // percentage
    efficiencyTarget: number; // percentage
    costReductionTarget: number; // percentage
  };
}

// Logger Interface
export interface Logger {
  info(message: string, meta?: any): void;
  warn(message: string, meta?: any): void;
  error(message: string, meta?: any): void;
  debug(message: string, meta?: any): void;
}

// Error Types
export class EcoOptimizerError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'EcoOptimizerError';
  }
}

export class CloudProviderError extends EcoOptimizerError {
  constructor(message: string, public provider: CloudProvider, details?: any) {
    super(message, 'CLOUD_PROVIDER_ERROR', details);
    this.name = 'CloudProviderError';
  }
}

export class DataCollectionError extends EcoOptimizerError {
  constructor(message: string, details?: any) {
    super(message, 'DATA_COLLECTION_ERROR', details);
    this.name = 'DataCollectionError';
  }
}

export class OptimizationError extends EcoOptimizerError {
  constructor(message: string, details?: any) {
    super(message, 'OPTIMIZATION_ERROR', details);
    this.name = 'OptimizationError';
  }
}