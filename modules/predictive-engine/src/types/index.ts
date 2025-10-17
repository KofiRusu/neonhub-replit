export interface PerformanceMetrics {
  traffic: {
    totalPageViews: number;
    uniqueVisitors: number;
    dailyAveragePageViews: number;
    peakDailyPageViews: number;
    bounceRate: number;
    sessionDurationAvg: number;
  };
  latency: {
    apiResponseTimeAvg: number;
    apiResponseTimeP95: number;
    pageLoadTimeAvg: number;
    pageLoadTimeP95: number;
    jobProcessingLatencyAvg: number;
    jobProcessingLatencyP95: number;
  };
  errors: {
    apiErrorRate: number;
    jobFailureRate: number;
    totalErrors: number;
    criticalErrors: number;
    errorTrends: Record<string, number>;
  };
  conversions: {
    totalConversions: number;
    conversionRate: number;
    clickThroughRate: number;
    openRate: number;
    funnelDropOff: {
      pageViewToClick: number;
      clickToConversion: number;
    };
  };
  kpis: {
    brandVoiceToneConsistency: number;
    contentReadabilityScore: number;
    recentCampaignWins: number;
    complianceAlerts: number;
    seoGrowthRate: number;
    contentCadenceTargetMet: boolean;
    agentJobSuccessRate: number;
    userSatisfactionScore: number;
  };
  infrastructure: {
    uptimePercentage: number;
    cpuUtilizationAvg: number;
    memoryUtilizationAvg: number;
    databaseConnectionPoolUtilization: number;
    cdnHitRate: number;
  };
  security: {
    sslRating: string;
    failedLoginAttempts: number;
    rateLimitViolations: number;
    vulnerabilityScansPassed: boolean;
    dataEncryptionCompliance: boolean;
  };
}

export interface PredictiveThresholds {
  trafficSpikeThreshold: number;
  latencyDegradationThreshold: number;
  errorRateThreshold: number;
  conversionDropThreshold: number;
  cpuUtilizationThreshold: number;
  memoryUtilizationThreshold: number;
}

export interface ScalingDecision {
  action: 'scale_up' | 'scale_down' | 'no_action';
  targetReplicas: number;
  reason: string;
  confidence: number;
  predictedLoad: number;
}

export interface ReinforcementLearningState {
  currentMetrics: PerformanceMetrics;
  historicalMetrics: PerformanceMetrics[];
  scalingActions: ScalingDecision[];
  reward: number;
}

export interface MLModelConfig {
  algorithm: string;
  hyperparameters: Record<string, any>;
  trainingDataSize: number;
  validationSplit: number;
  features: string[];
  target: string;
}

export interface PredictionResult {
  predictedValue: number;
  confidence: number;
  upperBound: number;
  lowerBound: number;
  timestamp: Date;
  modelVersion: string;
}

export interface BenchmarkReport {
  version: string;
  baselineVersion: string;
  metrics: PerformanceMetrics;
  predictions: PredictionResult[];
  accuracy: number;
  improvement: number;
  generatedAt: Date;
}

// Cloud Provider Types
export type CloudProvider = 'aws' | 'gcp' | 'azure';

export interface CloudRegion {
  name: string;
  displayName: string;
  continent: string;
  latitude: number;
  longitude: number;
  availabilityZones: string[];
}

export interface CloudInstance {
  id: string;
  type: string;
  region: string;
  availabilityZone: string;
  state: 'running' | 'stopped' | 'terminated' | 'pending';
  launchTime: Date;
  publicIp?: string;
  privateIp: string;
  tags: Record<string, string>;
}

export interface CloudService {
  id: string;
  name: string;
  type: 'compute' | 'container' | 'function' | 'database' | 'storage';
  region: string;
  status: 'running' | 'stopped' | 'failed' | 'scaling';
  replicas?: number;
  cpuUtilization?: number;
  memoryUtilization?: number;
  cost?: number;
  tags: Record<string, string>;
}

export interface CloudMetrics {
  timestamp: Date;
  region: string;
  serviceId: string;
  cpuUtilization: number;
  memoryUtilization: number;
  networkIn: number;
  networkOut: number;
  diskReadOps: number;
  diskWriteOps: number;
  latency: number;
  errorRate: number;
  requestCount: number;
}

export interface ScalingPolicy {
  provider: CloudProvider;
  serviceId: string;
  region: string;
  minInstances: number;
  maxInstances: number;
  targetCPUUtilization?: number;
  targetMemoryUtilization?: number;
  cooldownPeriod: number;
  scalingAdjustment: number;
}

export interface CostOptimization {
  instanceType: string;
  spotPrice?: number;
  onDemandPrice: number;
  savingsPercentage: number;
  availability: number;
  interruptionRate: number;
}

export interface GlobalScalingDecision extends ScalingDecision {
  provider: CloudProvider;
  region: string;
  serviceId: string;
  failoverRegions?: string[];
  costOptimized: boolean;
  geoDistributed: boolean;
}

export interface FederationCoordination {
  federationId: string;
  regions: string[];
  leaderRegion: string;
  syncInterval: number;
  consensusThreshold: number;
}

export interface WorkloadPattern {
  patternId: string;
  name: string;
  description: string;
  timeRange: {
    start: Date;
    end: Date;
  };
  metrics: {
    avgLoad: number;
    peakLoad: number;
    minLoad: number;
    loadVariance: number;
  };
  predictions: PredictionResult[];
  confidence: number;
}

export interface GeoDistributionConfig {
  regions: CloudRegion[];
  trafficDistribution: Record<string, number>;
  latencyThresholds: Record<string, number>;
  failoverStrategy: 'active-passive' | 'active-active' | 'round-robin';
  healthCheckInterval: number;
}