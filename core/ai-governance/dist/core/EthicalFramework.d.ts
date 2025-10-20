import { EventEmitter } from 'events';
import { EthicalAssessment, EthicalPrinciple, EthicalFrameworkConfig, AuditSubject } from '../types/index.js';
export declare class EthicalFramework extends EventEmitter {
    private principles;
    private config;
    private auditLogger;
    constructor(config: EthicalFrameworkConfig, auditLogger?: any);
    /**
     * Initialize default ethical principles
     */
    private initializePrinciples;
    /**
     * Assess ethical implications of a subject/action
     */
    assessEthicalImpact(subject: AuditSubject, context?: Record<string, any>): Promise<EthicalAssessment>;
    /**
     * Evaluate a specific ethical principle
     */
    private evaluatePrinciple;
    /**
     * Evaluate beneficence principle
     */
    private evaluateBeneficence;
    /**
     * Evaluate non-maleficence principle
     */
    private evaluateNonMaleficence;
    /**
     * Evaluate autonomy principle
     */
    private evaluateAutonomy;
    /**
     * Evaluate justice principle
     */
    private evaluateJustice;
    /**
     * Evaluate transparency principle
     */
    private evaluateTransparency;
    /**
     * Evaluate privacy principle
     */
    private evaluatePrivacy;
    /**
     * Identify ethical concerns from principle evaluations
     */
    private identifyConcerns;
    /**
     * Generate recommendations based on assessment
     */
    private generateRecommendations;
    /**
     * Update ethical principles configuration
     */
    updatePrinciples(newPrinciples: EthicalPrinciple[]): void;
    /**
     * Get current ethical principles
     */
    getPrinciples(): EthicalPrinciple[];
    /**
     * Check if assessment passes threshold
     */
    passesThreshold(assessment: EthicalAssessment): boolean;
}
//# sourceMappingURL=EthicalFramework.d.ts.map