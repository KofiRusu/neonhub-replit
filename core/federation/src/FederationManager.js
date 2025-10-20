"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FederationManager = void 0;
const events_1 = require("events");
const types_1 = require("./types");
const Logger_1 = require("./utils/Logger");
const AuthManager_1 = require("./auth/AuthManager");
const WebSocketServer_1 = require("./websocket/WebSocketServer");
const WebSocketClient_1 = require("./websocket/WebSocketClient");
const GRPCServer_1 = require("./grpc/GRPCServer");
const GRPCClient_1 = require("./grpc/GRPCClient");
const ConnectionPool_1 = require("./utils/ConnectionPool");
const LoadBalancer_1 = require("./utils/LoadBalancer");
const HealthChecker_1 = require("./utils/HealthChecker");
const FederatedLearningCoordinator_1 = require("./federated-learning/FederatedLearningCoordinator");
const SecureAggregation_1 = require("./federated-learning/SecureAggregation");
const ModelValidation_1 = require("./federated-learning/ModelValidation");
const ParticipantManager_1 = require("./federated-learning/ParticipantManager");
const PrivacyBudgetManager_1 = require("./privacy/PrivacyBudgetManager");
const HomomorphicEncryption_1 = require("./crypto/HomomorphicEncryption");
const KeyManager_1 = require("./crypto/KeyManager");
const SecureMultiPartyComputation_1 = require("./crypto/SecureMultiPartyComputation");
const AIXProtocolManager_1 = require("./aix/AIXProtocolManager");
const ModelCompression_1 = require("./aix/ModelCompression");
const IntelligenceAggregator_1 = require("./aix/IntelligenceAggregator");
const ModelEvaluator_1 = require("./aix/ModelEvaluator");
class FederationManager extends events_1.EventEmitter {
    constructor(config) {
        super();
        this.wsServer = null;
        this.grpcServer = null;
        this.wsClients = new Map();
        this.grpcClients = new Map();
        this.isRunning = false;
        this.config = config;
        this.logger = config.logger || new Logger_1.ConsoleLogger();
        this.authManager = new AuthManager_1.AuthManager(this.config.wsConfig.auth || { enabled: false, type: 'jwt' }, this.logger);
        this.connectionPool = new ConnectionPool_1.ConnectionPool(this.config.poolConfig, this.config.wsConfig, this.logger, this.authManager);
        this.loadBalancer = new LoadBalancer_1.LoadBalancer(this.config.loadBalancingStrategy, this.logger, this.connectionPool);
        this.healthChecker = new HealthChecker_1.HealthChecker(this.config.healthCheckConfig, this.logger);
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
    async start() {
        if (this.isRunning) {
            return;
        }
        try {
            this.logger.info(`Starting federation manager for node ${this.config.nodeId}`);
            // Start servers
            this.wsServer = new WebSocketServer_1.WebSocketServer(this.config.wsConfig, this.logger, this.authManager);
            this.grpcServer = new GRPCServer_1.GRPCServer(this.config.grpcConfig, this.logger);
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
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error('Failed to start federation manager', error);
            throw new types_1.FederationError(types_1.FederationErrorCode.CONNECTION_FAILED, message);
        }
    }
    async stop() {
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
        }
        catch (error) {
            this.logger.error('Error stopping federation manager', error);
            throw error;
        }
    }
    async connectToNode(nodeInfo) {
        try {
            // Add to load balancer and health checker
            this.loadBalancer.addNode(nodeInfo);
            this.healthChecker.addNode(nodeInfo);
            // Create clients
            const wsClient = new WebSocketClient_1.WebSocketClient(nodeInfo.nodeId, {
                host: nodeInfo.address,
                port: nodeInfo.port,
                tls: { enabled: false }, // Would be configured
                auth: this.config.wsConfig.auth,
                reconnect: { enabled: true, maxAttempts: 5, initialDelay: 1000, maxDelay: 10000, backoffMultiplier: 2 }
            }, this.logger, this.authManager);
            const grpcClient = new GRPCClient_1.GRPCClient(nodeInfo.nodeId, {
                host: nodeInfo.address,
                port: 9090, // Default gRPC port
                tls: { enabled: false }
            }, this.logger);
            // Connect clients
            await Promise.all([
                wsClient.connect(),
                grpcClient.connect()
            ]);
            this.wsClients.set(nodeInfo.nodeId, wsClient);
            this.grpcClients.set(nodeInfo.nodeId, grpcClient);
            this.logger.info(`Connected to node ${nodeInfo.nodeId}`);
            this.emit('nodeConnected', nodeInfo);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(`Failed to connect to node ${nodeInfo.nodeId}`, error);
            throw new types_1.FederationError(types_1.FederationErrorCode.CONNECTION_FAILED, message);
        }
    }
    async disconnectFromNode(nodeId) {
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
        }
        catch (error) {
            this.logger.error(`Error disconnecting from node ${nodeId}`, error);
            throw error;
        }
    }
    async sendMessage(message) {
        try {
            this.updateMetrics(message);
            // Determine target node
            let targetNodeId = message.targetNodeId;
            if (!targetNodeId) {
                targetNodeId = this.loadBalancer.selectNode() || undefined;
                if (!targetNodeId) {
                    throw new types_1.FederationError(types_1.FederationErrorCode.NODE_UNAVAILABLE, 'No available nodes');
                }
            }
            // Get connection from pool
            const connection = await this.connectionPool.getConnection(targetNodeId);
            // Send via WebSocket
            const wsClient = connection.wsClient;
            if (wsClient) {
                const success = wsClient.send(message);
                if (!success) {
                    throw new types_1.FederationError(types_1.FederationErrorCode.CONNECTION_FAILED, 'Failed to send WebSocket message');
                }
            }
            // Send via gRPC if needed
            const grpcClient = connection.grpcClient;
            if (grpcClient && message.priority >= types_1.MessagePriority.HIGH) {
                await grpcClient.sendMessage(message);
            }
            this.connectionPool.releaseConnection(connection.id);
            this.metrics.messagesSent++;
            this.metrics.bytesSent += JSON.stringify(message).length;
        }
        catch (error) {
            this.metrics.errorsTotal++;
            this.logger.error('Error sending message', error);
            throw error;
        }
    }
    broadcastMessage(message) {
        if (this.wsServer) {
            this.wsServer.broadcast(message);
        }
        this.metrics.messagesSent++;
        this.metrics.bytesSent += JSON.stringify(message).length;
    }
    getConnectedNodes() {
        return this.wsServer?.getConnectedNodes() || [];
    }
    getMetrics() {
        return { ...this.metrics };
    }
    initializeMetrics() {
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
    updateMetrics(message) {
        this.metrics.messagesReceived++;
        this.metrics.bytesReceived += JSON.stringify(message).length;
    }
    setupEventHandlers() {
        // WebSocket server events
        if (this.wsServer) {
            this.wsServer.on('message', (message) => {
                this.updateMetrics(message);
                this.handleFederatedLearningMessage(message);
                this.handleAIXMessage(message);
                this.emit('message', message);
            });
            this.wsServer.on('nodeConnected', (nodeInfo) => {
                this.emit('nodeConnected', nodeInfo);
            });
            this.wsServer.on('nodeDisconnected', (nodeInfo) => {
                this.emit('nodeDisconnected', nodeInfo);
            });
        }
        // WebSocket client events
        this.wsClients.forEach((client, nodeId) => {
            client.on('message', (message) => {
                this.updateMetrics(message);
                this.handleFederatedLearningMessage(message);
                this.handleAIXMessage(message);
                this.emit('message', message);
            });
            client.on('connected', () => {
                this.logger.info(`WebSocket client connected to ${nodeId}`);
            });
            client.on('disconnected', (code, reason) => {
                this.logger.warn(`WebSocket client disconnected from ${nodeId}: ${code} - ${reason}`);
            });
        });
        // Health checker events
        this.healthChecker.on('nodeHealthy', (nodeId) => {
            this.logger.info(`Node ${nodeId} is now healthy`);
            this.emit('nodeHealthy', nodeId);
        });
        this.healthChecker.on('nodeUnhealthy', (nodeId, error) => {
            this.logger.warn(`Node ${nodeId} is now unhealthy: ${error}`);
            this.emit('nodeUnhealthy', nodeId, error);
        });
    }
    /**
     * Initialize federated learning components
     */
    initializeFederatedLearning() {
        if (!this.config.federatedLearning)
            return;
        this.logger.info('Initializing federated learning components');
        this.homomorphicEncryption = new HomomorphicEncryption_1.HomomorphicEncryption(this.logger);
        this.keyManager = new KeyManager_1.KeyManager(this.logger);
        this.smpc = new SecureMultiPartyComputation_1.SecureMultiPartyComputation(this.logger);
        this.privacyBudgetManager = new PrivacyBudgetManager_1.PrivacyBudgetManager(this.logger);
        this.participantManager = new ParticipantManager_1.ParticipantManager(this.logger);
        this.modelValidation = new ModelValidation_1.ModelValidation(this.logger);
        this.secureAggregation = new SecureAggregation_1.SecureAggregation(this.logger, this.homomorphicEncryption);
        this.flCoordinator = new FederatedLearningCoordinator_1.FederatedLearningCoordinator(this.logger);
        // Set up event handlers for FL coordinator
        this.setupFederatedLearningEventHandlers();
    }
    /**
     * Initialize AI Intelligence Exchange components
     */
    initializeAIX() {
        if (!this.config.aix)
            return;
        this.logger.info('Initializing AIX components');
        this.aixProtocolManager = new AIXProtocolManager_1.AIXProtocolManager(this.config.aix, this.logger);
        this.modelCompression = new ModelCompression_1.ModelCompression(this.logger);
        this.intelligenceAggregator = new IntelligenceAggregator_1.IntelligenceAggregator(this.logger);
        this.modelEvaluator = new ModelEvaluator_1.ModelEvaluator(this.logger);
        // Set up event handlers for AIX
        this.setupAIXEventHandlers();
    }
    /**
     * Handle federated learning messages
     */
    handleFederatedLearningMessage(message) {
        if (!this.flCoordinator)
            return;
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
    handleAIXMessage(message) {
        if (!this.aixProtocolManager)
            return;
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
    async handleGradientUpdate(message) {
        if (!this.flCoordinator || !this.privacyBudgetManager)
            return;
        try {
            const gradientUpdate = message.payload;
            await this.flCoordinator.submitGradientUpdate(message.sourceNodeId, gradientUpdate, message.id);
        }
        catch (error) {
            this.logger.error(`Error handling gradient update: ${error}`);
        }
    }
    /**
     * Handle model update messages
     */
    async handleModelUpdate(message) {
        if (!this.flCoordinator || !this.modelValidation)
            return;
        try {
            const modelUpdate = message.payload;
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
        }
        catch (error) {
            this.logger.error(`Error handling model update: ${error}`);
        }
    }
    /**
     * Handle participant registration
     */
    handleParticipantRegistration(message) {
        if (!this.participantManager || !this.privacyBudgetManager)
            return;
        try {
            const participant = message.payload;
            this.participantManager.registerParticipant(participant);
            this.privacyBudgetManager.registerParticipant(participant.nodeId, participant.privacyBudget);
            this.logger.info(`Registered participant ${participant.nodeId} for federated learning`);
        }
        catch (error) {
            this.logger.error(`Error registering participant: ${error}`);
        }
    }
    /**
     * Handle key exchange messages
     */
    handleKeyExchange(message) {
        if (!this.keyManager)
            return;
        try {
            const keyExchange = message.payload; // KeyExchangeRequest
            const exchangeId = this.keyManager.initiateKeyExchange(keyExchange);
            this.logger.info(`Initiated key exchange ${exchangeId} for ${keyExchange.keyId}`);
        }
        catch (error) {
            this.logger.error(`Error handling key exchange: ${error}`);
        }
    }
    /**
     * Handle secure computation requests
     */
    async handleSecureComputation(message) {
        if (!this.smpc)
            return;
        try {
            const computationRequest = message.payload; // SecureComputationRequest
            const result = await this.smpc.performComputation(computationRequest);
            this.logger.info(`Completed secure computation ${computationRequest.computationId}`);
        }
        catch (error) {
            this.logger.error(`Error in secure computation: ${error}`);
        }
    }
    /**
     * Set up federated learning event handlers
     */
    setupFederatedLearningEventHandlers() {
        if (!this.flCoordinator)
            return;
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
    startFederatedLearningRound(config) {
        if (!this.flCoordinator) {
            this.logger.warn('Federated learning not enabled');
            return null;
        }
        return this.flCoordinator.startAggregationRound(config);
    }
    /**
     * Get federated learning statistics
     */
    getFederatedLearningStats() {
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
    getAIXStats() {
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
    setupAIXEventHandlers() {
        if (!this.aixProtocolManager)
            return;
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
    handleModelSummaryExchange(message) {
        // Implementation for model summary exchange
        this.logger.info(`Processing model summary exchange from ${message.sourceNodeId}`);
    }
    /**
     * Handle knowledge distillation messages
     */
    handleKnowledgeDistillation(message) {
        // Implementation for knowledge distillation
        this.logger.info(`Processing knowledge distillation request from ${message.sourceNodeId}`);
    }
    /**
     * Handle intelligence aggregation messages
     */
    handleIntelligenceAggregation(message) {
        // Implementation for intelligence aggregation
        this.logger.info(`Processing intelligence aggregation request from ${message.sourceNodeId}`);
    }
    /**
     * Handle marketplace bid messages
     */
    handleMarketplaceBid(message) {
        // Implementation for marketplace bids
        this.logger.info(`Processing marketplace bid from ${message.sourceNodeId}`);
    }
    /**
     * Handle model evaluation request messages
     */
    handleModelEvaluationRequest(message) {
        // Implementation for model evaluation requests
        this.logger.info(`Processing model evaluation request from ${message.sourceNodeId}`);
    }
    /**
     * Handle evaluation result messages
     */
    handleEvaluationResult(message) {
        // Implementation for evaluation results
        this.logger.info(`Processing evaluation result from ${message.sourceNodeId}`);
    }
}
exports.FederationManager = FederationManager;
//# sourceMappingURL=FederationManager.js.map