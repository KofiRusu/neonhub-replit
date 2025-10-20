"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DifferentialPrivacy = void 0;
class DifferentialPrivacy {
    constructor(logger) {
        this.logger = logger;
    }
    /**
     * Adds Gaussian noise to gradients for differential privacy
     */
    addGaussianNoise(gradients, epsilon, delta, sensitivity = 1.0) {
        const sigma = Math.sqrt(2 * Math.log(1.25 / delta)) * (sensitivity / epsilon);
        this.logger.debug(`Adding Gaussian noise with sigma=${sigma} for ε=${epsilon}, δ=${delta}`);
        return gradients.map(layer => layer.map(gradient => {
            const noise = this.generateGaussianNoise(0, sigma);
            return gradient + noise;
        }));
    }
    /**
     * Adds Laplacian noise to gradients for differential privacy
     */
    addLaplacianNoise(gradients, epsilon, sensitivity = 1.0) {
        const scale = sensitivity / epsilon;
        this.logger.debug(`Adding Laplacian noise with scale=${scale} for ε=${epsilon}`);
        return gradients.map(layer => layer.map(gradient => {
            const noise = this.generateLaplacianNoise(scale);
            return gradient + noise;
        }));
    }
    /**
     * Clips gradients to bound sensitivity
     */
    clipGradients(gradients, maxNorm) {
        const norm = this.computeL2Norm(gradients);
        if (norm > maxNorm) {
            const scale = maxNorm / norm;
            this.logger.debug(`Clipping gradients with scale=${scale}, original norm=${norm}`);
            return gradients.map(layer => layer.map(g => g * scale));
        }
        return gradients;
    }
    /**
     * Computes L2 norm of gradients
     */
    computeL2Norm(gradients) {
        let sum = 0;
        for (const layer of gradients) {
            for (const gradient of layer) {
                sum += gradient * gradient;
            }
        }
        return Math.sqrt(sum);
    }
    /**
     * Generates Gaussian noise with given mean and standard deviation
     */
    generateGaussianNoise(mean, std) {
        // Box-Muller transform
        const u1 = Math.random();
        const u2 = Math.random();
        const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
        return z0 * std + mean;
    }
    /**
     * Generates Laplacian noise with given scale
     */
    generateLaplacianNoise(scale) {
        const u = Math.random() - 0.5;
        return -scale * Math.sign(u) * Math.log(1 - 2 * Math.abs(u));
    }
    /**
     * Updates privacy budget after applying DP
     */
    updatePrivacyBudget(budget, epsilon, delta) {
        const newUsedBudget = budget.usedBudget + epsilon;
        if (newUsedBudget > budget.maxBudget) {
            this.logger.warn(`Privacy budget exceeded: ${newUsedBudget} > ${budget.maxBudget}`);
        }
        return {
            ...budget,
            epsilon: Math.min(budget.epsilon, epsilon),
            delta: Math.min(budget.delta, delta),
            usedBudget: newUsedBudget,
            lastUpdated: Date.now()
        };
    }
    /**
     * Checks if privacy budget allows the operation
     */
    canApplyDP(budget, requiredEpsilon) {
        return (budget.usedBudget + requiredEpsilon) <= budget.maxBudget;
    }
}
exports.DifferentialPrivacy = DifferentialPrivacy;
//# sourceMappingURL=DifferentialPrivacy.js.map