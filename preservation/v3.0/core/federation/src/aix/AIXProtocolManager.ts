import { EventEmitter } from 'events';
import {
  ModelSummary,
  IntelligenceSharingRequest,
  IntelligenceSharingType,
  KnowledgeDistillationRequest,
  IntelligenceAggregationRequest,
  IntelligenceAggregationAlgorithm,
  ModelVersion,
  PrivacyPolicy,
  IntelligenceMarketplaceBid,
  ModelEvaluationRequest,
  EvaluationResult,
  CompressionConfig,
  AIXMessageType,
  FederationMessage,
  FederationMessageType,
  MessagePriority,
  NodeInfo
} from '../types';
import { Logger } from '../utils/Logger';
import { ConsoleLogger } from '../utils/Logger';

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

export class AIXProtocolManager extends EventEmitter {
  private config: AIXConfig;
  private logger: Logger;
  private modelRegistry: Map<string, ModelSummary> = new Map();
  private activeRequests: Map<string, IntelligenceSharingRequest> = new Map();
  private marketplaceBids: Map<string, IntelligenceMarketplaceBid[]> = new Map();
  private evaluationResults: Map<string, EvaluationResult> = new Map();
  private privacyPolicies: Map<string, PrivacyPolicy> = new Map();

  constructor(config: AIXConfig, logger?: Logger) {
    super();
    this.config = config;
    this.logger = logger || new ConsoleLogger();
    this.setupEventHandlers();
  }

  /**
   * Register a model in the AIX registry
   */
  registerModel(modelSummary: ModelSummary): void {
    this.modelRegistry.set(modelSummary.modelId, modelSummary);
    this.logger.info(`Registered model ${modelSummary.modelId} v${modelSummary.version}`);
    this.emit('modelRegistered', modelSummary);
  }

  /**
   * Get model summary by ID
   */
  getModelSummary(modelId: string): ModelSummary | undefined {
    return this.modelRegistry.get(modelId);
  }

  /**
   * List all registered models
   */
  listModels(): ModelSummary[] {
    return Array.from(this.modelRegistry.values());
  }

  /**
   * Request intelligence sharing
   */
  async requestIntelligenceSharing(
    request: IntelligenceSharingRequest
  ): Promise<string> {
    if (this.activeRequests.size >= this.config.sharing.maxConcurrentRequests) {
      throw new Error('Maximum concurrent sharing requests exceeded');
    }

    // Check privacy policy compliance
    const policy = this.privacyPolicies.get(request.requesterNodeId);
    if (!this.checkPrivacyCompliance(request, policy)) {
      throw new Error('Request violates privacy policy');
    }

    this.activeRequests.set(request.requestId, request);

    // Create federation message
    const message: FederationMessage = {
      id: request.requestId,
      type: FederationMessageType.INTELLIGENCE_SHARING_REQUEST,
      payload: request,
      timestamp: Date.now(),
      sourceNodeId: request.requesterNodeId,
      priority: MessagePriority.NORMAL
    };

    this.emit('sharingRequestCreated', { request, message });
    return request.requestId;
  }

  /**
   * Handle incoming intelligence sharing request
   */
  async handleIntelligenceSharingRequest(
    message: FederationMessage
  ): Promise<void> {
    const request = message.payload as IntelligenceSharingRequest;

    try {
      // Validate request
      if (!this.validateSharingRequest(request)) {
        this.logger.warn(`Invalid sharing request from ${message.sourceNodeId}`);
        return;
      }

      // Check local privacy policy
      const localPolicy = this.privacyPolicies.get(message.targetNodeId || '');
      if (!this.checkPrivacyCompliance(request, localPolicy)) {
        this.logger.warn(`Sharing request violates local privacy policy`);
        return;
      }

      // Process based on sharing type
      switch (request.sharingType) {
        case IntelligenceSharingType.MODEL_SUMMARY:
          await this.handleModelSummaryRequest(request, message);
          break;
        case IntelligenceSharingType.GRADIENTS:
          await this.handleGradientSharingRequest(request, message);
          break;
        case IntelligenceSharingType.KNOWLEDGE_DISTILLATION:
          await this.handleKnowledgeDistillationRequest(request, message);
          break;
        default:
          this.logger.warn(`Unsupported sharing type: ${request.sharingType}`);
      }

      this.emit('sharingRequestProcessed', request);
    } catch (error) {
      this.logger.error(`Error processing sharing request: ${error}`);
    }
  }

  /**
   * Initiate knowledge distillation
   */
  async initiateKnowledgeDistillation(
    distillationRequest: KnowledgeDistillationRequest
  ): Promise<string> {
    const message: FederationMessage = {
      id: `kd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: FederationMessageType.KNOWLEDGE_DISTILLATION,
      payload: distillationRequest,
      timestamp: Date.now(),
      sourceNodeId: distillationRequest.teacherModelId.split('_')[0], // Extract node ID
      priority: MessagePriority.HIGH
    };

    this.emit('knowledgeDistillationInitiated', { request: distillationRequest, message });
    return message.id;
  }

  /**
   * Request intelligence aggregation
   */
  async requestIntelligenceAggregation(
    aggregationRequest: IntelligenceAggregationRequest
  ): Promise<string> {
    const message: FederationMessage = {
      id: aggregationRequest.aggregationId,
      type: FederationMessageType.INTELLIGENCE_AGGREGATION,
      payload: aggregationRequest,
      timestamp: Date.now(),
      sourceNodeId: 'coordinator', // Would be set by coordinator
      priority: MessagePriority.HIGH
    };

    this.emit('aggregationRequestCreated', { request: aggregationRequest, message });
    return aggregationRequest.aggregationId;
  }

  /**
   * Submit marketplace bid
   */
  async submitMarketplaceBid(bid: IntelligenceMarketplaceBid): Promise<void> {
    if (!this.config.marketplace.enabled) {
      throw new Error('Marketplace not enabled');
    }

    const modelBids = this.marketplaceBids.get(bid.modelId) || [];
    modelBids.push(bid);
    this.marketplaceBids.set(bid.modelId, modelBids);

    const message: FederationMessage = {
      id: bid.bidId,
      type: FederationMessageType.MARKETPLACE_BID,
      payload: bid,
      timestamp: bid.timestamp,
      sourceNodeId: bid.bidderNodeId,
      priority: MessagePriority.NORMAL
    };

    this.emit('marketplaceBidSubmitted', { bid, message });
  }

  /**
   * Request model evaluation
   */
  async requestModelEvaluation(
    evaluationRequest: ModelEvaluationRequest
  ): Promise<string> {
    const message: FederationMessage = {
      id: evaluationRequest.evaluationId,
      type: FederationMessageType.MODEL_EVALUATION_REQUEST,
      payload: evaluationRequest,
      timestamp: Date.now(),
      sourceNodeId: evaluationRequest.evaluatorNodeId,
      priority: MessagePriority.NORMAL
    };

    this.emit('evaluationRequestCreated', { request: evaluationRequest, message });
    return evaluationRequest.evaluationId;
  }

  /**
   * Submit evaluation result
   */
  async submitEvaluationResult(result: EvaluationResult): Promise<void> {
    this.evaluationResults.set(result.evaluationId, result);

    const message: FederationMessage = {
      id: `result_${result.evaluationId}`,
      type: FederationMessageType.EVALUATION_RESULT,
      payload: result,
      timestamp: result.timestamp,
      sourceNodeId: result.evaluatorNodeId,
      priority: MessagePriority.NORMAL
    };

    this.emit('evaluationResultSubmitted', { result, message });
  }

  /**
   * Compress model data
   */
  async compressModelData(
    modelData: any,
    config: CompressionConfig
  ): Promise<any> {
    // Implementation would include actual compression logic
    // For now, return placeholder
    this.logger.info(`Compressing model data with ${config.algorithm}`);
    return {
      ...modelData,
      compressed: true,
      compressionConfig: config,
      originalSize: JSON.stringify(modelData).length
    };
  }

  /**
   * Decompress model data
   */
  async decompressModelData(compressedData: any): Promise<any> {
    // Implementation would include actual decompression logic
    this.logger.info('Decompressing model data');
    const { compressed, compressionConfig, originalSize, ...data } = compressedData;
    return data;
  }

  /**
   * Check model version compatibility
   */
  checkModelCompatibility(
    modelVersion: ModelVersion,
    targetFramework?: string
  ): boolean {
    if (targetFramework && !modelVersion.compatibility.supportedArchitectures.includes(targetFramework)) {
      return false;
    }

    // Additional compatibility checks would go here
    return !modelVersion.breaking;
  }

  /**
   * Set privacy policy for a node
   */
  setPrivacyPolicy(nodeId: string, policy: PrivacyPolicy): void {
    this.privacyPolicies.set(nodeId, policy);
    this.logger.info(`Updated privacy policy for node ${nodeId}`);
    this.emit('privacyPolicyUpdated', { nodeId, policy });
  }

  /**
   * Get active sharing requests
   */
  getActiveRequests(): IntelligenceSharingRequest[] {
    return Array.from(this.activeRequests.values());
  }

  /**
   * Get marketplace bids for a model
   */
  getMarketplaceBids(modelId: string): IntelligenceMarketplaceBid[] {
    return this.marketplaceBids.get(modelId) || [];
  }

  /**
   * Get evaluation results
   */
  getEvaluationResults(modelId: string): EvaluationResult[] {
    return Array.from(this.evaluationResults.values())
      .filter(result => result.modelId === modelId);
  }

  /**
   * Clean up expired requests and data
   */
  cleanup(): void {
    const now = Date.now();

    // Clean up expired sharing requests
    this.activeRequests.forEach((request, id) => {
      if (request.expiresAt && request.expiresAt < now) {
        this.activeRequests.delete(id);
      }
    });

    // Clean up expired marketplace bids
    this.marketplaceBids.forEach((bids, modelId) => {
      const activeBids = bids.filter((bid: IntelligenceMarketplaceBid) => bid.expiresAt > now);
      if (activeBids.length === 0) {
        this.marketplaceBids.delete(modelId);
      } else {
        this.marketplaceBids.set(modelId, activeBids);
      }
    });

    this.logger.info('AIX cleanup completed');
  }

  private setupEventHandlers(): void {
    // Set up periodic cleanup
    setInterval(() => this.cleanup(), 300000); // 5 minutes
  }

  private checkPrivacyCompliance(
    request: IntelligenceSharingRequest,
    policy?: PrivacyPolicy
  ): boolean {
    if (!policy) return true; // No policy means allow

    const rule = policy.sharingRules.find(r => r.dataType === request.sharingType);
    if (!rule) return false;

    // Check if requester is allowed
    if (!rule.allowedRecipients.includes('*') &&
        !rule.allowedRecipients.includes(request.requesterNodeId)) {
      return false;
    }

    // Check privacy level compatibility
    const privacyLevels = ['public', 'restricted', 'private', 'confidential'];
    const requestLevel = privacyLevels.indexOf(request.privacyLevel.toLowerCase());
    const ruleLevel = privacyLevels.indexOf(rule.dataType.toLowerCase());

    return requestLevel <= ruleLevel;
  }

  private validateSharingRequest(request: IntelligenceSharingRequest): boolean {
    return !!(
      request.requestId &&
      request.requesterNodeId &&
      request.modelId &&
      request.sharingType &&
      request.purpose &&
      request.timestamp
    );
  }

  private async handleModelSummaryRequest(
    request: IntelligenceSharingRequest,
    message: FederationMessage
  ): Promise<void> {
    const modelSummary = this.modelRegistry.get(request.modelId);
    if (!modelSummary) {
      this.logger.warn(`Model ${request.modelId} not found for sharing request`);
      return;
    }

    // Compress if requested
    let payload = modelSummary;
    if (this.config.compression.enableQuantization) {
      payload = await this.compressModelData(modelSummary, {
        algorithm: 'quantization' as any,
        level: 1,
        quantizationBits: 8
      });
    }

    const responseMessage: FederationMessage = {
      id: `response_${message.id}`,
      type: FederationMessageType.MODEL_SUMMARY_EXCHANGE,
      payload,
      timestamp: Date.now(),
      sourceNodeId: message.targetNodeId || '',
      targetNodeId: message.sourceNodeId,
      priority: MessagePriority.NORMAL
    };

    this.emit('modelSummaryShared', { request, modelSummary, message: responseMessage });
  }

  private async handleGradientSharingRequest(
    request: IntelligenceSharingRequest,
    message: FederationMessage
  ): Promise<void> {
    // Implementation for gradient sharing
    this.logger.info(`Processing gradient sharing request for model ${request.modelId}`);
    // Would integrate with federated learning coordinator
  }

  private async handleKnowledgeDistillationRequest(
    request: IntelligenceSharingRequest,
    message: FederationMessage
  ): Promise<void> {
    // Implementation for knowledge distillation
    this.logger.info(`Processing knowledge distillation request for model ${request.modelId}`);
    // Would create distillation task
  }
}