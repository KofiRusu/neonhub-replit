export { FederationManager, FederationConfig } from './FederationManager';
export * from './types';
export { WebSocketServer } from './websocket/WebSocketServer';
export { WebSocketClient } from './websocket/WebSocketClient';
export { GRPCServer } from './grpc/GRPCServer';
export { GRPCClient } from './grpc/GRPCClient';
export { AuthManager, AuthResult } from './auth/AuthManager';
export { FederatedLearningCoordinator } from './federated-learning/FederatedLearningCoordinator';
export { SecureAggregation } from './federated-learning/SecureAggregation';
export { ModelValidation } from './federated-learning/ModelValidation';
export { ParticipantManager } from './federated-learning/ParticipantManager';
export { DifferentialPrivacy } from './privacy/DifferentialPrivacy';
export { PrivacyBudgetManager } from './privacy/PrivacyBudgetManager';
export { HomomorphicEncryption } from './crypto/HomomorphicEncryption';
export { SecureMultiPartyComputation } from './crypto/SecureMultiPartyComputation';
export { KeyManager } from './crypto/KeyManager';
export { Logger } from './utils/Logger';
export { ConsoleLogger } from './utils/Logger';
export { ConnectionPool } from './utils/ConnectionPool';
export { LoadBalancer, LoadBalancingStrategy } from './utils/LoadBalancer';
export { HealthChecker } from './utils/HealthChecker';
export { AIXProtocolManager, AIXConfig } from './aix/AIXProtocolManager';
export { ModelCompression } from './aix/ModelCompression';
export { IntelligenceAggregator } from './aix/IntelligenceAggregator';
export { ModelEvaluator } from './aix/ModelEvaluator';
/**
 * Federated Governance Integration Manager
 * Integrates global orchestration, AI governance, and eco-optimization into federation workflows
 */
export declare class FederatedGovernanceIntegration {
    private federationManager;
    private orchestrator?;
    private aiGovernance?;
    private ecoOptimizer?;
    constructor(config: {
        federationManager: any;
        orchestrator?: any;
        aiGovernance?: any;
        ecoOptimizer?: any;
    });
    /**
     * Route federated learning task to optimal nodes with governance checks
     */
    routeFederatedTask(task: {
        modelId: string;
        participants: string[];
        priority: 'low' | 'medium' | 'high';
    }): Promise<{
        route: any;
        governance?: any;
        energyImpact?: any;
    }>;
    /**
     * Monitor federated learning session with integrated governance
     */
    monitorFederatedSession(sessionId: string): Promise<{
        health: any;
        governance: any;
        sustainability: any;
    }>;
    /**
     * Optimize federated learning round with sustainability considerations
     */
    optimizeFederatedRound(round: {
        roundNumber: number;
        participants: string[];
        modelSize: number;
    }): Promise<{
        optimized: boolean;
        recommendations: string[];
        energySavings?: number;
    }>;
    /**
     * Get integrated system status
     */
    getSystemStatus(): {
        federation: boolean;
        orchestration: boolean;
        governance: boolean;
        sustainability: boolean;
    };
}
//# sourceMappingURL=index.d.ts.map