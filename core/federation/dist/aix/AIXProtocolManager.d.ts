import { EventEmitter } from 'events';
import { ModelSummary, IntelligenceSharingRequest, KnowledgeDistillationRequest, IntelligenceAggregationRequest, ModelVersion, PrivacyPolicy, IntelligenceMarketplaceBid, ModelEvaluationRequest, EvaluationResult, CompressionConfig, FederationMessage } from '../types';
import { Logger } from '../utils/Logger';
export interface AIXConfig {
    enabled: boolean;
    compression: {
        defaultAlgorithm: string;
        maxCompressionRatio: number;
        enableQuantization: boolean;
    };
    marketplace: {
        enabled: boolean;
        biddingTimeout: number;
        maxConcurrentBids: number;
    };
    evaluation: {
        enabled: boolean;
        benchmarkTimeout: number;
        crossValidationFolds: number;
    };
    sharing: {
        defaultPrivacyLevel: string;
        maxConcurrentRequests: number;
        requestTimeout: number;
    };
}
export declare class AIXProtocolManager extends EventEmitter {
    private config;
    private logger;
    private modelRegistry;
    private activeRequests;
    private marketplaceBids;
    private evaluationResults;
    private privacyPolicies;
    constructor(config: AIXConfig, logger?: Logger);
    /**
     * Register a model in the AIX registry
     */
    registerModel(modelSummary: ModelSummary): void;
    /**
     * Get model summary by ID
     */
    getModelSummary(modelId: string): ModelSummary | undefined;
    /**
     * List all registered models
     */
    listModels(): ModelSummary[];
    /**
     * Request intelligence sharing
     */
    requestIntelligenceSharing(request: IntelligenceSharingRequest): Promise<string>;
    /**
     * Handle incoming intelligence sharing request
     */
    handleIntelligenceSharingRequest(message: FederationMessage): Promise<void>;
    /**
     * Initiate knowledge distillation
     */
    initiateKnowledgeDistillation(distillationRequest: KnowledgeDistillationRequest): Promise<string>;
    /**
     * Request intelligence aggregation
     */
    requestIntelligenceAggregation(aggregationRequest: IntelligenceAggregationRequest): Promise<string>;
    /**
     * Submit marketplace bid
     */
    submitMarketplaceBid(bid: IntelligenceMarketplaceBid): Promise<void>;
    /**
     * Request model evaluation
     */
    requestModelEvaluation(evaluationRequest: ModelEvaluationRequest): Promise<string>;
    /**
     * Submit evaluation result
     */
    submitEvaluationResult(result: EvaluationResult): Promise<void>;
    /**
     * Compress model data
     */
    compressModelData(modelData: any, config: CompressionConfig): Promise<any>;
    /**
     * Decompress model data
     */
    decompressModelData(compressedData: any): Promise<any>;
    /**
     * Check model version compatibility
     */
    checkModelCompatibility(modelVersion: ModelVersion, targetFramework?: string): boolean;
    /**
     * Set privacy policy for a node
     */
    setPrivacyPolicy(nodeId: string, policy: PrivacyPolicy): void;
    /**
     * Get active sharing requests
     */
    getActiveRequests(): IntelligenceSharingRequest[];
    /**
     * Get marketplace bids for a model
     */
    getMarketplaceBids(modelId: string): IntelligenceMarketplaceBid[];
    /**
     * Get evaluation results
     */
    getEvaluationResults(modelId: string): EvaluationResult[];
    /**
     * Clean up expired requests and data
     */
    cleanup(): void;
    private setupEventHandlers;
    private checkPrivacyCompliance;
    private validateSharingRequest;
    private handleModelSummaryRequest;
    private handleGradientSharingRequest;
    private handleKnowledgeDistillationRequest;
}
//# sourceMappingURL=AIXProtocolManager.d.ts.map