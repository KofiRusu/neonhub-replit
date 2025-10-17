import { Logger } from '../utils/Logger';
import { PrivacyBudget, ParticipantInfo } from '../types';

export class PrivacyBudgetManager {
  private logger: Logger;
  private participantBudgets: Map<string, PrivacyBudget> = new Map();

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Registers a participant's privacy budget
   */
  registerParticipant(nodeId: string, initialBudget: PrivacyBudget): void {
    this.participantBudgets.set(nodeId, { ...initialBudget });
    this.logger.info(`Registered privacy budget for participant ${nodeId}: ε=${initialBudget.epsilon}, δ=${initialBudget.delta}`);
  }

  /**
   * Checks if a participant can afford a privacy operation
   */
  canAffordOperation(nodeId: string, requiredEpsilon: number): boolean {
    const budget = this.participantBudgets.get(nodeId);
    if (!budget) {
      this.logger.warn(`No privacy budget found for participant ${nodeId}`);
      return false;
    }

    const canAfford = (budget.usedBudget + requiredEpsilon) <= budget.maxBudget;
    this.logger.debug(`Participant ${nodeId} can afford ε=${requiredEpsilon}: ${canAfford}`);
    return canAfford;
  }

  /**
   * Consumes privacy budget for an operation
   */
  consumeBudget(nodeId: string, epsilon: number, delta: number = 0): boolean {
    const budget = this.participantBudgets.get(nodeId);
    if (!budget) {
      this.logger.error(`No privacy budget found for participant ${nodeId}`);
      return false;
    }

    if (!this.canAffordOperation(nodeId, epsilon)) {
      this.logger.warn(`Participant ${nodeId} cannot afford privacy operation ε=${epsilon}`);
      return false;
    }

    budget.usedBudget += epsilon;
    budget.epsilon = Math.min(budget.epsilon, epsilon);
    budget.delta = Math.min(budget.delta, delta);
    budget.lastUpdated = Date.now();

    this.logger.info(`Consumed privacy budget for ${nodeId}: used=${budget.usedBudget}/${budget.maxBudget}`);
    return true;
  }

  /**
   * Gets the current privacy budget for a participant
   */
  getBudget(nodeId: string): PrivacyBudget | undefined {
    return this.participantBudgets.get(nodeId);
  }

  /**
   * Updates a participant's privacy budget
   */
  updateBudget(nodeId: string, updates: Partial<PrivacyBudget>): void {
    const budget = this.participantBudgets.get(nodeId);
    if (budget) {
      Object.assign(budget, updates);
      budget.lastUpdated = Date.now();
      this.logger.debug(`Updated privacy budget for ${nodeId}`);
    }
  }

  /**
   * Resets a participant's privacy budget (for new epochs/training rounds)
   */
  resetBudget(nodeId: string, newMaxBudget?: number): void {
    const budget = this.participantBudgets.get(nodeId);
    if (budget) {
      budget.usedBudget = 0;
      if (newMaxBudget !== undefined) {
        budget.maxBudget = newMaxBudget;
      }
      budget.lastUpdated = Date.now();
      this.logger.info(`Reset privacy budget for ${nodeId}`);
    }
  }

  /**
   * Gets all participants with low privacy budget
   */
  getLowBudgetParticipants(thresholdRatio: number = 0.8): string[] {
    const lowBudget: string[] = [];

    this.participantBudgets.forEach((budget, nodeId) => {
      const usageRatio = budget.usedBudget / budget.maxBudget;
      if (usageRatio >= thresholdRatio) {
        lowBudget.push(nodeId);
      }
    });

    return lowBudget;
  }

  /**
   * Calculates the remaining privacy budget for a participant
   */
  getRemainingBudget(nodeId: string): number {
    const budget = this.participantBudgets.get(nodeId);
    return budget ? budget.maxBudget - budget.usedBudget : 0;
  }

  /**
   * Calculates the privacy budget usage ratio for a participant
   */
  getBudgetUsageRatio(nodeId: string): number {
    const budget = this.participantBudgets.get(nodeId);
    return budget ? budget.usedBudget / budget.maxBudget : 1;
  }

  /**
   * Gets privacy budget statistics across all participants
   */
  getBudgetStatistics(): {
    totalParticipants: number;
    averageUsageRatio: number;
    lowBudgetParticipants: number;
    exhaustedParticipants: number;
  } {
    const budgets = Array.from(this.participantBudgets.values());
    const totalParticipants = budgets.length;
    const averageUsageRatio = budgets.reduce((sum, b) => sum + (b.usedBudget / b.maxBudget), 0) / totalParticipants;
    const lowBudgetParticipants = budgets.filter(b => (b.usedBudget / b.maxBudget) >= 0.8).length;
    const exhaustedParticipants = budgets.filter(b => b.usedBudget >= b.maxBudget).length;

    return {
      totalParticipants,
      averageUsageRatio,
      lowBudgetParticipants,
      exhaustedParticipants
    };
  }

  /**
   * Removes a participant's privacy budget
   */
  removeParticipant(nodeId: string): void {
    this.participantBudgets.delete(nodeId);
    this.logger.info(`Removed privacy budget for participant ${nodeId}`);
  }
}