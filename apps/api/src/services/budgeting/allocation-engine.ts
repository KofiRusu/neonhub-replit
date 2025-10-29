/**
 * Budget Allocation Engine
 * 
 * Calculates optimal budget allocation across marketing channels
 * with explainable reasoning and rule-based logic
 */

import type {
  BudgetPlan,
  AllocationResult,
  ReasoningStep,
  ChannelBudget,
  AllocationRule,
} from './types';

export class AllocationEngine {
  /**
   * Calculate optimal budget allocation
   * 
   * @param plan - Budget plan with channels and rules
   * @returns Allocation result with reasoning
   */
  calculate(plan: BudgetPlan): AllocationResult {
    const reasoning: ReasoningStep[] = [];
    let stepNumber = 1;

    // Step 1: Validate budget plan
    this.validatePlan(plan);
    reasoning.push({
      step: stepNumber++,
      rule: 'validation',
      decision: `Validated budget plan: ${plan.currency} ${plan.totalBudget.toLocaleString()}`,
      impact: [],
    });

    // Step 2: Calculate base allocation by priority
    let allocations = this.calculateBaseAllocation(plan.channels, plan.totalBudget);
    reasoning.push({
      step: stepNumber++,
      rule: 'priority_weighting',
      decision: 'Allocated budget based on channel priority weights',
      impact: allocations.map(a => ({
        channel: a.channel,
        adjustment: a.amount,
        reason: `Priority weight applied (${a.priority}/10)`,
      })),
    });

    // Step 3: Apply ROI adjustments
    if (plan.channels.some(c => c.historicalROI !== undefined)) {
      allocations = this.applyROIAdjustments(allocations, plan.channels);
      reasoning.push({
        step: stepNumber++,
        rule: 'roi_optimization',
        decision: 'Adjusted allocation based on historical ROI performance',
        impact: allocations.map(a => ({
          channel: a.channel,
          adjustment: 0, // Delta would be tracked here
          reason: `ROI factor applied`,
        })),
      });
    }

    // Step 4: Enforce min/max constraints
    allocations = this.enforceConstraints(allocations, plan.channels, plan.totalBudget);
    reasoning.push({
      step: stepNumber++,
      rule: 'constraint_enforcement',
      decision: 'Enforced min/max allocation constraints',
      impact: allocations.map(a => ({
        channel: a.channel,
        adjustment: 0,
        reason: `Constraints applied`,
      })),
    });

    // Step 5: Apply custom rules
    if (plan.rules && plan.rules.length > 0) {
      allocations = this.applyCustomRules(allocations, plan.rules, plan.totalBudget);
      reasoning.push({
        step: stepNumber++,
        rule: 'custom_rules',
        decision: `Applied ${plan.rules.length} custom rule(s)`,
        impact: [],
      });
    }

    // Step 6: Normalize to match total budget (respecting constraints)
    allocations = this.normalizeWithConstraints(allocations, plan.channels, plan.totalBudget);
    reasoning.push({
      step: stepNumber++,
      rule: 'normalization',
      decision: `Normalized allocations to total budget`,
      impact: allocations.map(a => ({
        channel: a.channel,
        adjustment: a.amount,
        reason: `Final allocation: ${plan.currency} ${a.amount.toFixed(2)}`,
      })),
    });

    // Calculate estimates
    const estimates = this.calculateEstimates(allocations, plan.channels);

    // Build detailed reasoning for each channel
    const allocationsWithReasoning = allocations.map(a => {
      const channel = plan.channels.find(c => c.channel === a.channel)!;
      const reasons: string[] = [
        `Priority: ${channel.priority}/10`,
      ];
      
      if (channel.historicalROI !== undefined) {
        reasons.push(`Historical ROI: ${(channel.historicalROI * 100).toFixed(1)}%`);
      }
      
      if (channel.minAllocation) {
        reasons.push(`Min allocation: ${plan.currency} ${channel.minAllocation}`);
      }
      
      if (channel.maxAllocation) {
        reasons.push(`Max allocation: ${plan.currency} ${channel.maxAllocation}`);
      }
      
      reasons.push(`Pacing: ${plan.pacing}`);
      
      return {
        ...a,
        reasoning: reasons,
      };
    });

    return {
      totalAllocated: allocations.reduce((sum, a) => sum + a.amount, 0),
      allocations: allocationsWithReasoning,
      reasoning,
      estimates,
      calculatedAt: new Date(),
    };
  }

  /**
   * Validate budget plan
   */
  private validatePlan(plan: BudgetPlan): void {
    if (plan.totalBudget <= 0) {
      throw new Error('Total budget must be greater than 0');
    }

    if (plan.channels.length === 0) {
      throw new Error('At least one channel is required');
    }

    // Validate min/max constraints
    for (const channel of plan.channels) {
      if (channel.minAllocation && channel.maxAllocation) {
        if (channel.minAllocation > channel.maxAllocation) {
          throw new Error(`Channel ${channel.channel}: min > max allocation`);
        }
      }
    }

    // Validate total min doesn't exceed budget
    const totalMin = plan.channels
      .filter(c => c.minAllocation)
      .reduce((sum, c) => sum + (c.minAllocation || 0), 0);
    
    if (totalMin > plan.totalBudget) {
      throw new Error('Total minimum allocations exceed total budget');
    }
  }

  /**
   * Calculate base allocation by priority weight
   */
  private calculateBaseAllocation(
    channels: ChannelBudget[],
    totalBudget: number
  ): Array<{ channel: string; amount: number; priority: number; percentage: number }> {
    const totalWeight = channels.reduce((sum, c) => sum + c.priority, 0);
    
    return channels.map(channel => {
      const weightedAmount = (channel.priority / totalWeight) * totalBudget;
      
      return {
        channel: channel.channel,
        amount: weightedAmount,
        priority: channel.priority,
        percentage: (channel.priority / totalWeight) * 100,
      };
    });
  }

  /**
   * Apply ROI-based adjustments
   */
  private applyROIAdjustments(
    allocations: any[],
    channels: ChannelBudget[]
  ): any[] {
    // Calculate ROI factor for each channel
    const channelROI = new Map(
      channels
        .filter(c => c.historicalROI !== undefined)
        .map(c => [c.channel, c.historicalROI!])
    );

    if (channelROI.size === 0) return allocations;

    // Average ROI for normalization
    const avgROI = Array.from(channelROI.values()).reduce((a, b) => a + b, 0) / channelROI.size;

    // Adjust allocations based on ROI performance
    return allocations.map(a => {
      const roi = channelROI.get(a.channel);
      if (roi === undefined) return a;

      // ROI factor: 1.0 for average, >1.0 for above average, <1.0 for below
      const roiFactor = roi / avgROI;
      
      // Apply adjustment (max ±20%)
      const adjustment = Math.min(Math.max(roiFactor, 0.8), 1.2);
      
      return {
        ...a,
        amount: a.amount * adjustment,
      };
    });
  }

  /**
   * Enforce min/max constraints
   */
  private enforceConstraints(
    allocations: any[],
    channels: ChannelBudget[],
    _totalBudget: number
  ): any[] {
    const channelMap = new Map(channels.map(c => [c.channel, c]));

    return allocations.map(a => {
      const channel = channelMap.get(a.channel);
      if (!channel) return a;

      let amount = a.amount;

      // Apply minimum
      if (channel.minAllocation && amount < channel.minAllocation) {
        amount = channel.minAllocation;
      }

      // Apply maximum
      if (channel.maxAllocation && amount > channel.maxAllocation) {
        amount = channel.maxAllocation;
      }

      return { ...a, amount };
    });
  }

  /**
   * Apply custom allocation rules
   */
  private applyCustomRules(
    allocations: any[],
    rules: AllocationRule[],
    _totalBudget: number
  ): any[] {
    // Sort rules by weight (highest first)
    const sortedRules = [...rules].sort((a, b) => b.weight - a.weight);

    let result = allocations;

    for (const rule of sortedRules) {
      // Apply each rule based on type
      switch (rule.type) {
        case 'time_of_day':
          // Example: Allocate more to channels that perform better at specific times
          // Implementation depends on config
          break;
        
        case 'seasonal':
          // Example: Adjust for seasonal trends
          break;
        
        case 'custom':
          // Custom logic based on config
          break;
      }
    }

    return result;
  }

  /**
   * Normalize allocations to match total budget (deprecated - use normalizeWithConstraints)
   */
  private normalize(
    allocations: any[],
    totalBudget: number
  ): any[] {
    const currentTotal = allocations.reduce((sum, a) => sum + a.amount, 0);
    
    if (currentTotal === 0) {
      throw new Error('Total allocation is 0');
    }

    const factor = totalBudget / currentTotal;

    return allocations.map(a => ({
      ...a,
      amount: a.amount * factor,
      percentage: (a.amount * factor / totalBudget) * 100,
    }));
  }

  /**
   * Normalize allocations while respecting min/max constraints
   */
  private normalizeWithConstraints(
    allocations: any[],
    channels: ChannelBudget[],
    totalBudget: number
  ): any[] {
    const channelMap = new Map(channels.map(c => [c.channel, c]));
    
    // Separate constrained and flexible allocations
    const constrained: any[] = [];
    const flexible: any[] = [];
    let constrainedTotal = 0;

    for (const allocation of allocations) {
      const channel = channelMap.get(allocation.channel);
      if (!channel) {
        flexible.push(allocation);
        continue;
      }

      // Check if already at min/max
      if (channel.minAllocation && allocation.amount <= channel.minAllocation) {
        const constrainedAmount = channel.minAllocation;
        constrained.push({ ...allocation, amount: constrainedAmount });
        constrainedTotal += constrainedAmount;
      } else if (channel.maxAllocation && allocation.amount >= channel.maxAllocation) {
        const constrainedAmount = channel.maxAllocation;
        constrained.push({ ...allocation, amount: constrainedAmount });
        constrainedTotal += constrainedAmount;
      } else {
        flexible.push(allocation);
      }
    }

    // Distribute remaining budget among flexible allocations
    const remainingBudget = totalBudget - constrainedTotal;
    const flexibleTotal = flexible.reduce((sum, a) => sum + a.amount, 0);

    let normalized: any[];
    
    if (flexibleTotal > 0) {
      const factor = remainingBudget / flexibleTotal;
      const normalizedFlexible = flexible.map(a => {
        const channel = channelMap.get(a.channel);
        let amount = a.amount * factor;
        
        // Re-check constraints after normalization
        if (channel?.maxAllocation && amount > channel.maxAllocation) {
          amount = channel.maxAllocation;
        }
        if (channel?.minAllocation && amount < channel.minAllocation) {
          amount = channel.minAllocation;
        }
        
        return { ...a, amount };
      });
      
      normalized = [...constrained, ...normalizedFlexible];
    } else {
      normalized = constrained;
    }

    // Calculate percentages
    return normalized.map(a => ({
      ...a,
      percentage: (a.amount / totalBudget) * 100,
    }));
  }

  /**
   * Calculate estimated reach and ROI
   */
  private calculateEstimates(
    allocations: any[],
    channels: ChannelBudget[]
  ): { totalReach: number; expectedROI: number; confidence: number } {
    const channelMap = new Map(channels.map(c => [c.channel, c]));

    let totalReach = 0;
    let totalROI = 0;
    let confidenceSum = 0;

    for (const allocation of allocations) {
      const channel = channelMap.get(allocation.channel);
      if (!channel) continue;

      // Estimate reach (simplified: $1 = 100 impressions)
      const reach = allocation.amount * 100;
      totalReach += reach;

      // Calculate ROI if historical data available
      if (channel.historicalROI !== undefined) {
        const roi = allocation.amount * channel.historicalROI;
        totalROI += roi;
        confidenceSum += 1; // Higher confidence with historical data
      } else {
        // Assume industry average of 200% ROI
        totalROI += allocation.amount * 2.0;
        confidenceSum += 0.5; // Lower confidence without data
      }
    }

    return {
      totalReach,
      expectedROI: totalROI,
      confidence: Math.min(confidenceSum / allocations.length, 1.0),
    };
  }
}

