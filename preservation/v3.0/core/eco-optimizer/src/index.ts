/**
 * Eco-Optimizer Module
 * Energy usage tracking and resource efficiency optimization for sustainable operations
 * 
 * @module @neonhub/eco-optimizer
 */

// Export types
export * from './types';

// Export components
export { EnergyMonitor } from './monitoring/EnergyMonitor';
export { CarbonFootprintCalculator } from './carbon/CarbonFootprintCalculator';
export { ResourceOptimizer } from './optimization/ResourceOptimizer';
export { EfficiencyAnalyzer } from './analysis/EfficiencyAnalyzer';
export { SustainabilityReporter } from './reporting/SustainabilityReporter';
export { GreenAIAdvisor } from './ai/GreenAIAdvisor';

// Re-export commonly used types for convenience
export type {
  CloudProvider,
  ResourceType,
  EnergySource,
  EnergyMetrics,
  EnergyUsageData,
  CarbonFootprint,
  CarbonReport,
  ResourceUtilization,
  OptimizationRecommendation,
  OptimizationResult,
  EfficiencyMetrics,
  EfficiencyAnalysis,
  SustainabilityReport,
  SustainabilityGoal,
  GreenAIMetrics,
  GreenAIRecommendation,
  EcoOptimizerConfig,
  Logger
} from './types';