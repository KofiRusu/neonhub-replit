import { EventEmitter } from 'events';
import { FederationMessage, ConnectionConfig, HealthCheckConfig, PoolConfig, FederationMetrics, NodeInfo, AggregationConfig } from './types';
import { Logger } from './utils/Logger';
import { LoadBalancingStrategy } from './utils/LoadBalancer';
import { AIXConfig } from './aix/AIXProtocolManager';
export interface FederationConfig {
    nodeId: string;
    wsConfig: ConnectionConfig;
    grpcConfig: ConnectionConfig;
    poolConfig: PoolConfig;
    healthCheckConfig: HealthCheckConfig;
    loadBalancingStrategy: LoadBalancingStrategy;
    logger?: Logger;
    federatedLearning?: {
        enabled: boolean;
        privacyBudget: {
            epsilon: number;
            delta: number;
            maxBudget: number;
        };
        aggregation: {
            algorithm: 'fed_avg' | 'fed_prox' | 'secure_aggregation';
            minParticipants: number;
            maxParticipants: number;
            timeoutMs: number;
        };
    };
    aix?: AIXConfig;
}
export declare class FederationManager extends EventEmitter {
    private config;
    private logger;
    private authManager;
    private wsServer;
    private grpcServer;
    private wsClients;
    private grpcClients;
    private connectionPool;
    private loadBalancer;
    private healthChecker;
    private metrics;
    private isRunning;
    private flCoordinator?;
    private secureAggregation?;
    private modelValidation?;
    private participantManager?;
    private privacyBudgetManager?;
    private homomorphicEncryption?;
    private keyManager?;
    private smpc?;
    private aixProtocolManager?;
    private modelCompression?;
    private intelligenceAggregator?;
    private modelEvaluator?;
    constructor(config: FederationConfig);
    start(): Promise<void>;
    stop(): Promise<void>;
    connectToNode(nodeInfo: NodeInfo): Promise<void>;
    disconnectFromNode(nodeId: string): Promise<void>;
    sendMessage(message: FederationMessage): Promise<void>;
    broadcastMessage(message: FederationMessage): void;
    getConnectedNodes(): NodeInfo[];
    getMetrics(): FederationMetrics;
    private initializeMetrics;
    private updateMetrics;
    private setupEventHandlers;
    /**
     * Initialize federated learning components
     */
    private initializeFederatedLearning;
    /**
     * Initialize AI Intelligence Exchange components
     */
    private initializeAIX;
    /**
     * Handle federated learning messages
     */
    private handleFederatedLearningMessage;
    /**
     * Handle AIX messages
     */
    private handleAIXMessage;
    /**
     * Handle gradient update messages
     */
    private handleGradientUpdate;
    /**
     * Handle model update messages
     */
    private handleModelUpdate;
    /**
     * Handle participant registration
     */
    private handleParticipantRegistration;
    /**
     * Handle key exchange messages
     */
    private handleKeyExchange;
    /**
     * Handle secure computation requests
     */
    private handleSecureComputation;
    /**
     * Set up federated learning event handlers
     */
    private setupFederatedLearningEventHandlers;
    /**
     * Start a federated learning round
     */
    startFederatedLearningRound(config: AggregationConfig): string | null;
    /**
     * Get federated learning statistics
     */
    getFederatedLearningStats(): any;
    /**
     * Get AIX statistics
     */
    getAIXStats(): any;
    /**
     * Set up AIX event handlers
     */
    private setupAIXEventHandlers;
    /**
     * Handle model summary exchange messages
     */
    private handleModelSummaryExchange;
    /**
     * Handle knowledge distillation messages
     */
    private handleKnowledgeDistillation;
    /**
     * Handle intelligence aggregation messages
     */
    private handleIntelligenceAggregation;
    /**
     * Handle marketplace bid messages
     */
    private handleMarketplaceBid;
    /**
     * Handle model evaluation request messages
     */
    private handleModelEvaluationRequest;
    /**
     * Handle evaluation result messages
     */
    private handleEvaluationResult;
}
//# sourceMappingURL=FederationManager.d.ts.map