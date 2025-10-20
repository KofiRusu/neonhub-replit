import { Logger } from '../utils/Logger';
import { PrivacyBudget } from '../types';
export declare class DifferentialPrivacy {
    private logger;
    constructor(logger: Logger);
    /**
     * Adds Gaussian noise to gradients for differential privacy
     */
    addGaussianNoise(gradients: number[][], epsilon: number, delta: number, sensitivity?: number): number[][];
    /**
     * Adds Laplacian noise to gradients for differential privacy
     */
    addLaplacianNoise(gradients: number[][], epsilon: number, sensitivity?: number): number[][];
    /**
     * Clips gradients to bound sensitivity
     */
    clipGradients(gradients: number[][], maxNorm: number): number[][];
    /**
     * Computes L2 norm of gradients
     */
    private computeL2Norm;
    /**
     * Generates Gaussian noise with given mean and standard deviation
     */
    private generateGaussianNoise;
    /**
     * Generates Laplacian noise with given scale
     */
    private generateLaplacianNoise;
    /**
     * Updates privacy budget after applying DP
     */
    updatePrivacyBudget(budget: PrivacyBudget, epsilon: number, delta: number): PrivacyBudget;
    /**
     * Checks if privacy budget allows the operation
     */
    canApplyDP(budget: PrivacyBudget, requiredEpsilon: number): boolean;
}
//# sourceMappingURL=DifferentialPrivacy.d.ts.map