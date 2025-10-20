import { Logger } from '../utils/Logger';
import { PrivacyBudget } from '../types';
export declare class PrivacyBudgetManager {
    private logger;
    private participantBudgets;
    constructor(logger: Logger);
    /**
     * Registers a participant's privacy budget
     */
    registerParticipant(nodeId: string, initialBudget: PrivacyBudget): void;
    /**
     * Checks if a participant can afford a privacy operation
     */
    canAffordOperation(nodeId: string, requiredEpsilon: number): boolean;
    /**
     * Consumes privacy budget for an operation
     */
    consumeBudget(nodeId: string, epsilon: number, delta?: number): boolean;
    /**
     * Gets the current privacy budget for a participant
     */
    getBudget(nodeId: string): PrivacyBudget | undefined;
    /**
     * Updates a participant's privacy budget
     */
    updateBudget(nodeId: string, updates: Partial<PrivacyBudget>): void;
    /**
     * Resets a participant's privacy budget (for new epochs/training rounds)
     */
    resetBudget(nodeId: string, newMaxBudget?: number): void;
    /**
     * Gets all participants with low privacy budget
     */
    getLowBudgetParticipants(thresholdRatio?: number): string[];
    /**
     * Calculates the remaining privacy budget for a participant
     */
    getRemainingBudget(nodeId: string): number;
    /**
     * Calculates the privacy budget usage ratio for a participant
     */
    getBudgetUsageRatio(nodeId: string): number;
    /**
     * Gets privacy budget statistics across all participants
     */
    getBudgetStatistics(): {
        totalParticipants: number;
        averageUsageRatio: number;
        lowBudgetParticipants: number;
        exhaustedParticipants: number;
    };
    /**
     * Removes a participant's privacy budget
     */
    removeParticipant(nodeId: string): void;
}
//# sourceMappingURL=PrivacyBudgetManager.d.ts.map