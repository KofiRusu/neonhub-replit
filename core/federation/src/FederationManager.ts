import { EventEmitter } from 'events';
import {
  FederationMessage,
  ConnectionConfig,
  HealthCheckConfig,
  PoolConfig,
  FederationMetrics,
  NodeInfo,
  FederationError,
  FederationErrorCode,
  MessagePriority,
  AggregationConfig,
  ModelUpdate,
  GradientUpdate,
  ParticipantInfo
} from './types';
import { Logger } from './utils/Logger';
import { ConsoleLogger } from './utils/Logger';
import { AuthManager } from './auth/AuthManager';
import { WebSocketServer } from './websocket/WebSocketServer';
import { WebSocketClient } from './websocket/WebSocketClient';
import { GRPCServer } from './grpc/GRPCServer';
import { GRPCClient } from './grpc/GRPCClient';
import { ConnectionPool } from './utils/ConnectionPool';
import { LoadBalancer, LoadBalancingStrategy } from './utils/LoadBalancer';
import { HealthChecker } from './utils/HealthChecker';
import { FederatedLearningCoordinator } from './federated-learning/FederatedLearningCoordinator';
import { SecureAggregation } from './federated-learning/SecureAggregation';
import { ModelValidation } from './federated-learning/ModelValidation';
import { ParticipantManager } from './federated-learning/ParticipantManager';
import { PrivacyBudgetManager } from './privacy/PrivacyBudgetManager';
import { HomomorphicEncryption } from './crypto/HomomorphicEncryption';
import { KeyManager } from './crypto/KeyManager';
import { SecureMultiPartyComputation } from './crypto/SecureMultiPartyComputation';
import { AIXProtocolManager, AIXConfig } from './aix/AIXProtocolManager';
import { ModelCompression } from './aix/ModelCompression';
import { IntelligenceAggregator } from './aix/IntelligenceAggregator';
import { ModelEvaluator } from './aix/ModelEvaluator';

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

export class FederationManager extends EventEmitter {
  private config: FederationConfig;
  private logger: Logger;
  private authManager: AuthManager;
  private wsServer: WebSocketServer | null = null;
  private grpcServer: GRPCServer | null = null;
  private wsClients: Map<string, WebSocketClient> = new Map();
  private grpcClients: Map<string, GRPCClient> = new Map();
  private connectionPool: ConnectionPool;
  private loadBalancer: LoadBalancer;
  private healthChecker: HealthChecker;
  private metrics: FederationMetrics;
  private isRunning = false;

  // Federated Learning components
  private flCoordinator?: FederatedLearningCoordinator;
  private secureAggregation?: SecureAggregation;
  private modelValidation?: ModelValidation;
  private participantManager?: ParticipantManager;
  private privacyBudgetManager?: PrivacyBudgetManager;
  private homomorphicEncryption?: HomomorphicEncryption;
  private keyManager?: KeyManager;
  private smpc?: SecureMultiPartyComputation;

  // AI Intelligence Exchange components
  private aixProtocolManager?: AIXProtocolManager;
  private modelCompression?: ModelCompression;
  private intelligenceAggregator?: IntelligenceAggregator;
  private modelEvaluator?: ModelEvaluator;

  constructor(config: FederationConfig) {
    super();
    this.config = config;
    this.logger = config.logger || new ConsoleLogger();
    this.authManager = new AuthManager(this.config.wsConfig.auth || { enabled: false, type: 'jwt' }, this.logger);
    this.connectionPool = new ConnectionPool(
      this.config.poolConfig,
      this.config.wsConfig,
      this.logger,
      this.authManager
    );
    this.loadBalancer = new LoadBalancer(
      this.config.loadBalancingStrategy,
      this.logger,
      this.connectionPool
    );
    this.healthChecker = new HealthChecker(this.config.healthCheckConfig, this.logger);
    this.metrics = this.initializeMetrics();

    this.setupEventHandlers();

    // Initialize federated learning components if enabled
    if (this.config.federatedLearning?.enabled) {
      this.initializeFederatedLearning();
    }

    // Initialize AIX components if enabled
    if (this.config.aix?.enabled) {
      this.initializeAIX();
    }
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      return;
    }

    try {
      this.logger.info(`Starting federation manager for node ${this.config.nodeId}`);

      // Start servers
      this.wsServer = new WebSocketServer(this.config.wsConfig, this.logger, this.authManager);
      this.grpcServer = new GRPCServer(this.config.grpcConfig, this.logger);

      await Promise.all([
        this.wsServer.start(),
        this.grpcServer.start()
      ]);

      // Start health checking
      this.healthChecker.start();
      this.loadBalancer.startHealthChecks();

      this.isRunning = true;
      this.logger.info('Federation manager started successfully');
      this.emit('started');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Failed to start federation manager', error as Error);
      throw new FederationError(FederationErrorCode.CONNECTION_FAILED, message);
    }
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    try {
      this.logger.info('Stopping federation manager');

      // Stop health checking
      this.healthChecker.stop();
      this.loadBalancer.stopHealthChecks();

      // Stop servers
      await Promise.all([
        this.wsServer?.stop(),
        this.grpcServer?.stop()
      ]);

      // Disconnect all clients
      await Promise.all([
        ...Array.from(this.wsClients.values()).map(client => client.disconnect()),
        ...Array.from(this.grpcClients.values()).map(client => client.disconnect())
      ]);

      // Shutdown connection pool
      await this.connectionPool.shutdown();

      this.wsClients.clear();
      this.grpcClients.clear();

      this.isRunning = false;
      this.logger.info('Federation manager stopped successfully');
      this.emit('stopped');
    } catch (error) {
      this.logger.error('Error stopping federation manager', error);
      throw error;
    }
  }

  async connectToNode(nodeInfo: NodeInfo): Promise<void> {
    try {
      // Add to load balancer and health checker
      this.loadBalancer.addNode(nodeInfo);
      this.healthChecker.addNode(nodeInfo);

      // Create clients
      const wsClient = new WebSocketClient(
        nodeInfo.nodeId,
        {
          host: nodeInfo.address,
          port: nodeInfo.port,
          tls: { enabled: false }, // Would be configured
          auth: this.config.wsConfig.auth,
          reconnect: { enabled: true, maxAttempts: 5, initialDelay: 1000, maxDelay: 10000, backoffMultiplier: 2 }
        },
        this.logger,
        this.authManager
      );

      const grpcClient = new GRPCClient(
        nodeInfo.nodeId,
        {
          host: nodeInfo.address,
          port: 9090, // Default gRPC port
          tls: { enabled: false }
        },
        this.logger
      );

      // Connect clients
      await Promise.all([
        wsClient.connect(),
        grpcClient.connect()
      ]);

      this.wsClients.set(nodeInfo.nodeId, wsClient);
      this.grpcClients.set(nodeInfo.nodeId, grpcClient);

      this.logger.info(`Connected to node ${nodeInfo.nodeId}`);
      this.emit('nodeConnected', nodeInfo);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to connect to node ${nodeInfo.nodeId}`, error as Error);
      throw new FederationError(FederationErrorCode.CONNECTION_FAILED, message);
    }
  }

  async disconnectFromNode(nodeId: string): Promise<void> {
    try {
      // Disconnect clients
      const wsClient = this.wsClients.get(nodeId);
      const grpcClient = this.grpcClients.get(nodeId);

      await Promise.all([
        wsClient?.disconnect(),
        grpcClient?.disconnect()
      ]);

      // Remove from collections
      this.wsClients.delete(nodeId);
      this.grpcClients.delete(nodeId);
      this.loadBalancer.removeNode(nodeId);
      this.healthChecker.removeNode(nodeId);

      this.logger.info(`Disconnected from node ${nodeId}`);
      this.emit('nodeDisconnected', nodeId);
    } catch (error) {
      this.logger.error(`Error disconnecting from node ${nodeId}`, error);
      throw error;
    }
  }

  async sendMessage(message: FederationMessage): Promise<void> {
    try {
      this.updateMetrics(message);

      // Determine target node
      let targetNodeId: string | undefined = message.targetNodeId;
      if (!targetNodeId) {
        targetNodeId = this.loadBalancer.selectNode() || undefined;
        if (!targetNodeId) {
          throw new FederationError(FederationErrorCode.NODE_UNAVAILABLE, 'No available nodes');
        }
      }

      // Get connection from pool
      const connection = await this.connectionPool.getConnection(targetNodeId);

      // Send via WebSocket
      const wsClient = connection.wsClient;
      if (wsClient) {
        const success = wsClient.send(message);
        if (!success) {
          throw new FederationError(FederationErrorCode.CONNECTION_FAILED, 'Failed to send WebSocket message');
        }
      }

      // Send via gRPC if needed
      const grpcClient = connection.grpcClient;
      if (grpcClient && message.priority >= MessagePriority.HIGH) {
        await grpcClient.sendMessage(message);
      }

      this.connectionPool.releaseConnection(connection.id);
      this.metrics.messagesSent++;
      this.metrics.bytesSent += JSON.stringify(message).length;

    } catch (error) {
      this.metrics.errorsTotal++;
      this.logger.error('Error sending message', error);
      throw error;
    }
  }

  broadcastMessage(message: FederationMessage): void {
    if (this.wsServer) {
      this.wsServer.broadcast(message);
    }
    this.metrics.messagesSent++;
    this.metrics.bytesSent += JSON.stringify(message).length;
  }

  getConnectedNodes(): NodeInfo[] {
    return this.wsServer?.getConnectedNodes() || [];
  }

  getMetrics(): FederationMetrics {
    return { ...this.metrics };
  }

  private initializeMetrics(): FederationMetrics {
    return {
      messagesSent: 0,
      messagesReceived: 0,
      bytesSent: 0,
      bytesReceived: 0,
      connectionsActive: 0,
      connectionsTotal: 0,
      errorsTotal: 0,
      latencyMs: 0,
      uptimeSeconds: 0,
    };
  }

  private updateMetrics(message: FederationMessage): void {
    this.metrics.messagesReceived++;
    this.metrics.bytesReceived += JSON.stringify(message).length;
  }

  private setupEventHandlers(): void {
    // WebSocket server events
    if (this.wsServer) {
      this.wsServer.on('message', (message: FederationMessage) => {
        this.updateMetrics(message);
        this.handleFederatedLearningMessage(message);
        this.handleAIXMessage(message);
        this.emit('message', message);
      });

      this.wsServer.on('nodeConnected', (nodeInfo: NodeInfo) => {
        this.emit('nodeConnected', nodeInfo);
      });

      this.wsServer.on('nodeDisconnected', (nodeInfo: NodeInfo) => {
        this.emit('nodeDisconnected', nodeInfo);
      });
    }

    // WebSocket client events
    this.wsClients.forEach((client, nodeId) => {
      client.on('message', (message: FederationMessage) => {
        this.updateMetrics(message);
        this.handleFederatedLearningMessage(message);
        this.handleAIXMessage(message);
        this.emit('message', message);
      });

      client.on('connected', () => {
        this.logger.info(`WebSocket client connected to ${nodeId}`);
      });

      client.on('disconnected', (code: number, reason: string) => {
        this.logger.warn(`WebSocket client disconnected from ${nodeId}: ${code} - ${reason}`);
      });
    });

    // Health checker events
    this.healthChecker.on('nodeHealthy', (nodeId: string) => {
      this.logger.info(`Node ${nodeId} is now healthy`);
      this.emit('nodeHealthy', nodeId);
    });

    this.healthChecker.on('nodeUnhealthy', (nodeId: string, error: string) => {
      this.logger.warn(`Node ${nodeId} is now unhealthy: ${error}`);
      this.emit('nodeUnhealthy', nodeId, error);
    });
  }

  /**
   * Initialize federated learning components
   */
  private initializeFederatedLearning(): void {
    if (!this.config.federatedLearning) return;

    this.logger.info('Initializing federated learning components');

    this.homomorphicEncryption = new HomomorphicEncryption(this.logger);
    this.keyManager = new KeyManager(this.logger);
    this.smpc = new SecureMultiPartyComputation(this.logger);
    this.privacyBudgetManager = new PrivacyBudgetManager(this.logger);
    this.participantManager = new ParticipantManager(this.logger);
    this.modelValidation = new ModelValidation(this.logger);
    this.secureAggregation = new SecureAggregation(this.logger, this.homomorphicEncryption);
    this.flCoordinator = new FederatedLearningCoordinator(this.logger);

    // Set up event handlers for FL coordinator
    this.setupFederatedLearningEventHandlers();
  }

  /**
   * Initialize AI Intelligence Exchange components
   */
  private initializeAIX(): void {
    if (!this.config.aix) return;

    this.logger.info('Initializing AIX components');

    this.aixProtocolManager = new AIXProtocolManager(this.config.aix, this.logger);
    this.modelCompression = new ModelCompression(this.logger);
    this.intelligenceAggregator = new IntelligenceAggregator(this.logger);
    this.modelEvaluator = new ModelEvaluator(this.logger);

    // Set up event handlers for AIX
    this.setupAIXEventHandlers();
  }

  /**
   * Handle federated learning messages
   */
  private handleFederatedLearningMessage(message: FederationMessage): void {
    if (!this.flCoordinator) return;

    switch (message.type) {
      case 'gradient_update':
        this.handleGradientUpdate(message);
        break;
      case 'model_update':
        this.handleModelUpdate(message);
        break;
      case 'participant_registration':
        this.handleParticipantRegistration(message);
        break;
      case 'key_exchange':
        this.handleKeyExchange(message);
        break;
      case 'secure_computation':
        this.handleSecureComputation(message);
        break;
    }
  }

  /**
   * Handle AIX messages
   */
  private handleAIXMessage(message: FederationMessage): void {
    if (!this.aixProtocolManager) return;

    switch (message.type) {
      case 'model_summary_exchange':
        this.handleModelSummaryExchange(message);
        break;
      case 'intelligence_sharing_request':
        this.aixProtocolManager.handleIntelligenceSharingRequest(message);
        break;
      case 'knowledge_distillation':
        this.handleKnowledgeDistillation(message);
        break;
      case 'intelligence_aggregation':
        this.handleIntelligenceAggregation(message);
        break;
      case 'marketplace_bid':
        this.handleMarketplaceBid(message);
        break;
      case 'model_evaluation_request':
        this.handleModelEvaluationRequest(message);
        break;
      case 'evaluation_result':
        this.handleEvaluationResult(message);
        break;
    }
  }

  /**
   * Handle gradient update messages
   */
  private async handleGradientUpdate(message: FederationMessage): Promise<void> {
    if (!this.flCoordinator || !this.privacyBudgetManager) return;

    try {
      const gradientUpdate = message.payload as GradientUpdate;
      await this.flCoordinator.submitGradientUpdate(message.sourceNodeId, gradientUpdate, message.id);
    } catch (error) {
      this.logger.error(`Error handling gradient update: ${error}`);
    }
  }

  /**
   * Handle model update messages
   */
  private async handleModelUpdate(message: FederationMessage): Promise<void> {
    if (!this.flCoordinator || !this.modelValidation) return;

    try {
      const modelUpdate = message.payload as ModelUpdate;

      // Validate model
      const validation = this.modelValidation.validateModelUpdate(modelUpdate);
      if (!validation.isValid) {
        this.logger.warn(`Invalid model update from ${message.sourceNodeId}: ${validation.reason}`);
        return;
      }

      // Check for poisoning
      const poisoningResults = this.modelValidation.detectPoisoning([modelUpdate]);
      const poisoningResult = poisoningResults.find(r => r.nodeId === message.sourceNodeId);

      if (poisoningResult?.isPoisoned) {
        this.logger.warn(`Poisoned model detected from ${message.sourceNodeId}, confidence: ${poisoningResult.confidence}`);
        // Could trigger participant suspension here
      }

      await this.flCoordinator.submitModelUpdate(message.sourceNodeId, modelUpdate, message.id);
    } catch (error) {
      this.logger.error(`Error handling model update: ${error}`);
    }
  }

  /**
   * Handle participant registration
   */
  private handleParticipantRegistration(message: FederationMessage): void {
    if (!this.participantManager || !this.privacyBudgetManager) return;

    try {
      const participant = message.payload as ParticipantInfo;
      this.participantManager.registerParticipant(participant);
      this.privacyBudgetManager.registerParticipant(participant.nodeId, participant.privacyBudget);

      this.logger.info(`Registered participant ${participant.nodeId} for federated learning`);
    } catch (error) {
      this.logger.error(`Error registering participant: ${error}`);
    }
  }

  /**
   * Handle key exchange messages
   */
  private handleKeyExchange(message: FederationMessage): void {
    if (!this.keyManager) return;

    try {
      const keyExchange = message.payload as any; // KeyExchangeRequest
      const exchangeId = this.keyManager.initiateKeyExchange(keyExchange);
      this.logger.info(`Initiated key exchange ${exchangeId} for ${keyExchange.keyId}`);
    } catch (error) {
      this.logger.error(`Error handling key exchange: ${error}`);
    }
  }

  /**
   * Handle secure computation requests
   */
  private async handleSecureComputation(message: FederationMessage): Promise<void> {
    if (!this.smpc) return;

    try {
      const computationRequest = message.payload as any; // SecureComputationRequest
      const result = await this.smpc.performComputation(computationRequest);
      this.logger.info(`Completed secure computation ${computationRequest.computationId}`);
    } catch (error) {
      this.logger.error(`Error in secure computation: ${error}`);
    }
  }

  /**
   * Set up federated learning event handlers
   */
  private setupFederatedLearningEventHandlers(): void {
    if (!this.flCoordinator) return;

    this.flCoordinator.on('roundStarted', (round) => {
      this.logger.info(`Federated learning round ${round.roundId} started`);
      this.emit('flRoundStarted', round);
    });

    this.flCoordinator.on('roundCompleted', (round) => {
      this.logger.info(`Federated learning round ${round.roundId} completed`);
      this.emit('flRoundCompleted', round);
    });

    this.flCoordinator.on('participantRegistered', (participant) => {
      this.emit('flParticipantRegistered', participant);
    });

    this.flCoordinator.on('gradientUpdateReceived', (data) => {
      this.emit('flGradientUpdateReceived', data);
    });

    this.flCoordinator.on('modelUpdateReceived', (data) => {
      this.emit('flModelUpdateReceived', data);
    });
  }

  /**
   * Start a federated learning round
   */
  startFederatedLearningRound(config: AggregationConfig): string | null {
    if (!this.flCoordinator) {
      this.logger.warn('Federated learning not enabled');
      return null;
    }

    return this.flCoordinator.startAggregationRound(config);
  }

  /**
   * Get federated learning statistics
   */
  getFederatedLearningStats(): any {
    if (!this.participantManager || !this.privacyBudgetManager || !this.keyManager) {
      return null;
    }

    return {
      participants: this.participantManager.getParticipantStatistics(),
      privacyBudget: this.privacyBudgetManager.getBudgetStatistics(),
      keys: this.keyManager.getKeyStatistics(),
      activeRounds: this.flCoordinator?.getActiveRounds().length || 0
    };
  }

  /**
   * Get AIX statistics
   */
  getAIXStats(): any {
    if (!this.aixProtocolManager) {
      return null;
    }

    return {
      activeRequests: this.aixProtocolManager.getActiveRequests().length,
      marketplaceBids: this.aixProtocolManager.getMarketplaceBids('all').length,
      evaluationResults: this.aixProtocolManager.getEvaluationResults('all').length,
      registeredModels: this.aixProtocolManager.listModels().length
    };
  }

  /**
   * Set up AIX event handlers
   */
  private setupAIXEventHandlers(): void {
    if (!this.aixProtocolManager) return;

    this.aixProtocolManager.on('sharingRequestCreated', (data) => {
      this.emit('aixSharingRequestCreated', data);
    });

    this.aixProtocolManager.on('modelSummaryShared', (data) => {
      this.emit('aixModelSummaryShared', data);
    });

    this.aixProtocolManager.on('marketplaceBidSubmitted', (data) => {
      this.emit('aixMarketplaceBidSubmitted', data);
    });

    this.aixProtocolManager.on('evaluationRequestCreated', (data) => {
      this.emit('aixEvaluationRequestCreated', data);
    });

    this.aixProtocolManager.on('evaluationResultSubmitted', (data) => {
      this.emit('aixEvaluationResultSubmitted', data);
    });
  }

  /**
   * Handle model summary exchange messages
   */
  private handleModelSummaryExchange(message: FederationMessage): void {
    // Implementation for model summary exchange
    this.logger.info(`Processing model summary exchange from ${message.sourceNodeId}`);
  }

  /**
   * Handle knowledge distillation messages
   */
  private handleKnowledgeDistillation(message: FederationMessage): void {
    // Implementation for knowledge distillation
    this.logger.info(`Processing knowledge distillation request from ${message.sourceNodeId}`);
  }

  /**
   * Handle intelligence aggregation messages
   */
  private handleIntelligenceAggregation(message: FederationMessage): void {
    // Implementation for intelligence aggregation
    this.logger.info(`Processing intelligence aggregation request from ${message.sourceNodeId}`);
  }

  /**
   * Handle marketplace bid messages
   */
  private handleMarketplaceBid(message: FederationMessage): void {
    // Implementation for marketplace bids
    this.logger.info(`Processing marketplace bid from ${message.sourceNodeId}`);
  }

  /**
   * Handle model evaluation request messages
   */
  private handleModelEvaluationRequest(message: FederationMessage): void {
    // Implementation for model evaluation requests
    this.logger.info(`Processing model evaluation request from ${message.sourceNodeId}`);
  }

  /**
   * Handle evaluation result messages
   */
  private handleEvaluationResult(message: FederationMessage): void {
    // Implementation for evaluation results
    this.logger.info(`Processing evaluation result from ${message.sourceNodeId}`);
  }
}