/**
 * Budgeting System Types
 * Types for budget allocation, rules, and simulation
 */

export interface BudgetPlan {
  /** Total budget cap */
  totalBudget: number;
  
  /** Currency code (USD, EUR, etc.) */
  currency: string;
  
  /** Budget allocation period */
  period: {
    start: Date;
    end: Date;
  };
  
  /** Pacing strategy */
  pacing: 'even' | 'accelerated' | 'front_loaded' | 'back_loaded';
  
  /** Channel allocations */
  channels: ChannelBudget[];
  
  /** Allocation rules */
  rules?: AllocationRule[];
}

export interface ChannelBudget {
  /** Channel identifier */
  channel: string;
  
  /** Minimum allocation (optional) */
  minAllocation?: number;
  
  /** Maximum allocation (optional) */
  maxAllocation?: number;
  
  /** Priority weight (1-10) */
  priority: number;
  
  /** Historical performance */
  historicalROI?: number;
}

export interface AllocationRule {
  /** Rule identifier */
  id: string;
  
  /** Rule type */
  type: 'priority' | 'roi_based' | 'time_of_day' | 'seasonal' | 'custom';
  
  /** Rule configuration */
  config: Record<string, unknown>;
  
  /** Rule weight/importance */
  weight: number;
}

export interface AllocationResult {
  /** Total allocated */
  totalAllocated: number;
  
  /** Channel allocations */
  allocations: {
    channel: string;
    amount: number;
    percentage: number;
    reasoning: string[];
  }[];
  
  /** Decision reasoning */
  reasoning: ReasoningStep[];
  
  /** Estimated outcomes */
  estimates: {
    totalReach: number;
    expectedROI: number;
    confidence: number;
  };
  
  /** Calculation timestamp */
  calculatedAt: Date;
}

export interface ReasoningStep {
  /** Step number */
  step: number;
  
  /** Rule applied */
  rule: string;
  
  /** Decision made */
  decision: string;
  
  /** Impact on allocation */
  impact: {
    channel: string;
    adjustment: number;
    reason: string;
  }[];
}

export interface SimulationInput {
  /** Budget plan to simulate */
  plan: BudgetPlan;
  
  /** Number of simulation iterations */
  iterations?: number;
  
  /** Confidence level (0.90, 0.95, 0.99) */
  confidenceLevel?: number;
  
  /** Variance factors */
  variance?: {
    roiVariance?: number;
    costVariance?: number;
    reachVariance?: number;
  };
}

export interface SimulationResult {
  /** Simulated scenarios */
  scenarios: {
    iteration: number;
    allocation: AllocationResult;
    projectedReach: number;
    projectedROI: number;
    projectedCost: number;
  }[];
  
  /** Statistical summary */
  summary: {
    meanROI: number;
    medianROI: number;
    minROI: number;
    maxROI: number;
    stdDevROI: number;
    
    meanReach: number;
    medianReach: number;
    minReach: number;
    maxReach: number;
    
    confidenceInterval: {
      lower: number;
      upper: number;
      level: number;
    };
  };
  
  /** Recommendations */
  recommendations: string[];
}


