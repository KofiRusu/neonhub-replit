export interface TestCase {
  id: string;
  name: string;
  description: string;
  category: TestCategory;
  priority: TestPriority;
  component: string;
  scenario: TestScenario;
  expectedResult: any;
  timeout: number;
  tags: string[];
  generatedBy: 'manual' | 'ml' | 'telemetry';
  confidence: number;
  createdAt: Date;
  lastExecuted?: Date;
  executionCount: number;
  successRate: number;
}

export interface TestExecution {
  id: string;
  testCaseId: string;
  status: 'pending' | 'running' | 'passed' | 'failed' | 'skipped';
  duration: number;
  error?: string;
  metrics: Record<string, any>;
  environment: TestEnvironment;
  timestamp: Date;
}

export interface TestScenario {
  preconditions: string[];
  steps: TestStep[];
  assertions: Assertion[];
  cleanup?: string[];
}

export interface TestStep {
  id: string;
  description: string;
  action: string;
  parameters: Record<string, any>;
  expectedDuration: number;
}

export interface Assertion {
  type: 'equal' | 'contains' | 'greater' | 'less' | 'exists' | 'not-exists';
  target: string;
  value: any;
  tolerance?: number;
}

export interface BenchmarkResult {
  id: string;
  buildId: string;
  baselineVersion: string;
  metrics: PerformanceMetrics;
  anomalies: Anomaly[];
  comparison: BenchmarkComparison;
  timestamp: Date;
}

export interface PerformanceMetrics {
  responseTime: {
    avg: number;
    p95: number;
    p99: number;
    min: number;
    max: number;
  };
  throughput: {
    requestsPerSecond: number;
    concurrentUsers: number;
  };
  errorRate: number;
  memoryUsage: number;
  cpuUsage: number;
  networkIO: {
    bytesIn: number;
    bytesOut: number;
  };
}

export interface Anomaly {
  id: string;
  type: 'performance' | 'error' | 'resource' | 'behavior';
  severity: 'low' | 'medium' | 'high' | 'critical';
  metric: string;
  expectedValue: number;
  actualValue: number;
  deviation: number;
  confidence: number;
  timestamp: Date;
}

export interface BenchmarkComparison {
  baseline: PerformanceMetrics;
  current: PerformanceMetrics;
  delta: Record<string, number>;
  regressionDetected: boolean;
  improvementAreas: string[];
}

export interface TelemetryData {
  component: string;
  metric: string;
  value: number;
  timestamp: Date;
  tags: Record<string, string>;
  context: Record<string, any>;
}

export interface FailurePattern {
  id: string;
  component: string;
  errorType: string;
  frequency: number;
  lastOccurred: Date;
  relatedMetrics: string[];
  riskScore: number;
  suggestedTests: string[];
}

export interface MLModelConfig {
  type: 'regression' | 'classification' | 'clustering';
  features: string[];
  target: string;
  algorithm: string;
  hyperparameters: Record<string, any>;
  trainingDataSize: number;
  accuracy: number;
  lastTrained: Date;
}

export interface QASentinelConfig {
  enabled: boolean;
  monitoring: {
    interval: number;
    alertThresholds: Record<string, number>;
  };
  testGeneration: {
    mlModelPath: string;
    confidenceThreshold: number;
    maxTestsPerRun: number;
  };
  benchmarking: {
    baselineVersion: string;
    anomalyThreshold: number;
    performanceThresholds: Record<string, number>;
  };
  anomalyDetection: {
    algorithms: string[];
    sensitivity: number;
    falsePositiveRate: number;
  };
  selfHealing: {
    enabled: boolean;
    autoRepair: boolean;
    escalationThreshold: number;
  };
  ci: {
    preMergeValidation: boolean;
    gateThreshold: number;
    auditTrail: boolean;
  };
}

export interface TestEnvironment {
  platform: string;
  version: string;
  configuration: Record<string, any>;
  resources: {
    cpu: number;
    memory: number;
    disk: number;
  };
}

export type TestCategory =
  | 'unit'
  | 'integration'
  | 'e2e'
  | 'performance'
  | 'security'
  | 'accessibility'
  | 'compatibility';

export type TestPriority = 'low' | 'medium' | 'high' | 'critical';

export interface SelfHealingAction {
  id: string;
  type: 'restart' | 'scale' | 'rollback' | 'patch' | 'reconfigure';
  component: string;
  parameters: Record<string, any>;
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedDuration: number;
  success: boolean;
  timestamp: Date;
}

export interface CIDIntegration {
  pipelineId: string;
  stage: string;
  status: 'pending' | 'running' | 'success' | 'failure';
  qaResults: QAResults;
  timestamp: Date;
}

export interface QAResults {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  coverage: number;
  performanceScore: number;
  anomaliesDetected: number;
  selfHealingTriggered: number;
  duration: number;
  recommendations: string[];
}