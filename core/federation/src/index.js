"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FederatedGovernanceIntegration = exports.ModelEvaluator = exports.IntelligenceAggregator = exports.ModelCompression = exports.AIXProtocolManager = exports.HealthChecker = exports.LoadBalancingStrategy = exports.LoadBalancer = exports.ConnectionPool = exports.ConsoleLogger = exports.KeyManager = exports.SecureMultiPartyComputation = exports.HomomorphicEncryption = exports.PrivacyBudgetManager = exports.DifferentialPrivacy = exports.ParticipantManager = exports.ModelValidation = exports.SecureAggregation = exports.FederatedLearningCoordinator = exports.AuthManager = exports.GRPCClient = exports.GRPCServer = exports.WebSocketClient = exports.WebSocketServer = exports.FederationManager = void 0;
// Main exports
var FederationManager_1 = require("./FederationManager");
Object.defineProperty(exports, "FederationManager", { enumerable: true, get: function () { return FederationManager_1.FederationManager; } });
// Types and interfaces
__exportStar(require("./types"), exports);
// WebSocket components
var WebSocketServer_1 = require("./websocket/WebSocketServer");
Object.defineProperty(exports, "WebSocketServer", { enumerable: true, get: function () { return WebSocketServer_1.WebSocketServer; } });
var WebSocketClient_1 = require("./websocket/WebSocketClient");
Object.defineProperty(exports, "WebSocketClient", { enumerable: true, get: function () { return WebSocketClient_1.WebSocketClient; } });
// gRPC components
var GRPCServer_1 = require("./grpc/GRPCServer");
Object.defineProperty(exports, "GRPCServer", { enumerable: true, get: function () { return GRPCServer_1.GRPCServer; } });
var GRPCClient_1 = require("./grpc/GRPCClient");
Object.defineProperty(exports, "GRPCClient", { enumerable: true, get: function () { return GRPCClient_1.GRPCClient; } });
// Authentication
var AuthManager_1 = require("./auth/AuthManager");
Object.defineProperty(exports, "AuthManager", { enumerable: true, get: function () { return AuthManager_1.AuthManager; } });
// Federated Learning components
var FederatedLearningCoordinator_1 = require("./federated-learning/FederatedLearningCoordinator");
Object.defineProperty(exports, "FederatedLearningCoordinator", { enumerable: true, get: function () { return FederatedLearningCoordinator_1.FederatedLearningCoordinator; } });
var SecureAggregation_1 = require("./federated-learning/SecureAggregation");
Object.defineProperty(exports, "SecureAggregation", { enumerable: true, get: function () { return SecureAggregation_1.SecureAggregation; } });
var ModelValidation_1 = require("./federated-learning/ModelValidation");
Object.defineProperty(exports, "ModelValidation", { enumerable: true, get: function () { return ModelValidation_1.ModelValidation; } });
var ParticipantManager_1 = require("./federated-learning/ParticipantManager");
Object.defineProperty(exports, "ParticipantManager", { enumerable: true, get: function () { return ParticipantManager_1.ParticipantManager; } });
// Privacy components
var DifferentialPrivacy_1 = require("./privacy/DifferentialPrivacy");
Object.defineProperty(exports, "DifferentialPrivacy", { enumerable: true, get: function () { return DifferentialPrivacy_1.DifferentialPrivacy; } });
var PrivacyBudgetManager_1 = require("./privacy/PrivacyBudgetManager");
Object.defineProperty(exports, "PrivacyBudgetManager", { enumerable: true, get: function () { return PrivacyBudgetManager_1.PrivacyBudgetManager; } });
// Cryptographic components
var HomomorphicEncryption_1 = require("./crypto/HomomorphicEncryption");
Object.defineProperty(exports, "HomomorphicEncryption", { enumerable: true, get: function () { return HomomorphicEncryption_1.HomomorphicEncryption; } });
var SecureMultiPartyComputation_1 = require("./crypto/SecureMultiPartyComputation");
Object.defineProperty(exports, "SecureMultiPartyComputation", { enumerable: true, get: function () { return SecureMultiPartyComputation_1.SecureMultiPartyComputation; } });
var KeyManager_1 = require("./crypto/KeyManager");
Object.defineProperty(exports, "KeyManager", { enumerable: true, get: function () { return KeyManager_1.KeyManager; } });
var Logger_1 = require("./utils/Logger");
Object.defineProperty(exports, "ConsoleLogger", { enumerable: true, get: function () { return Logger_1.ConsoleLogger; } });
var ConnectionPool_1 = require("./utils/ConnectionPool");
Object.defineProperty(exports, "ConnectionPool", { enumerable: true, get: function () { return ConnectionPool_1.ConnectionPool; } });
var LoadBalancer_1 = require("./utils/LoadBalancer");
Object.defineProperty(exports, "LoadBalancer", { enumerable: true, get: function () { return LoadBalancer_1.LoadBalancer; } });
Object.defineProperty(exports, "LoadBalancingStrategy", { enumerable: true, get: function () { return LoadBalancer_1.LoadBalancingStrategy; } });
var HealthChecker_1 = require("./utils/HealthChecker");
Object.defineProperty(exports, "HealthChecker", { enumerable: true, get: function () { return HealthChecker_1.HealthChecker; } });
// AI Intelligence Exchange (AIX) components
var AIXProtocolManager_1 = require("./aix/AIXProtocolManager");
Object.defineProperty(exports, "AIXProtocolManager", { enumerable: true, get: function () { return AIXProtocolManager_1.AIXProtocolManager; } });
var ModelCompression_1 = require("./aix/ModelCompression");
Object.defineProperty(exports, "ModelCompression", { enumerable: true, get: function () { return ModelCompression_1.ModelCompression; } });
var IntelligenceAggregator_1 = require("./aix/IntelligenceAggregator");
Object.defineProperty(exports, "IntelligenceAggregator", { enumerable: true, get: function () { return IntelligenceAggregator_1.IntelligenceAggregator; } });
var ModelEvaluator_1 = require("./aix/ModelEvaluator");
Object.defineProperty(exports, "ModelEvaluator", { enumerable: true, get: function () { return ModelEvaluator_1.ModelEvaluator; } });
// ============================================================================
// V6.0 GOVERNANCE INTEGRATIONS
// ============================================================================
/**
 * Federated Governance Integration Manager
 * Integrates global orchestration, AI governance, and eco-optimization into federation workflows
 */
class FederatedGovernanceIntegration {
    constructor(config) {
        this.federationManager = config.federationManager;
        this.orchestrator = config.orchestrator;
        this.aiGovernance = config.aiGovernance;
        this.ecoOptimizer = config.ecoOptimizer;
    }
    /**
     * Route federated learning task to optimal nodes with governance checks
     */
    async routeFederatedTask(task) {
        const result = { route: null };
        // Use global orchestrator for intelligent routing
        if (this.orchestrator) {
            try {
                const routing = await this.orchestrator.routingService.routeRequest({
                    requestId: task.modelId,
                    sourceRegion: 'global',
                    payload: task,
                    priority: task.priority
                });
                result.route = routing;
            }
            catch (error) {
                console.warn('Orchestrator routing failed:', error);
            }
        }
        // Check AI governance policies
        if (this.aiGovernance) {
            try {
                const evaluation = await this.aiGovernance.policyEnforcer.evaluateAction({
                    action: 'federated_learning',
                    context: {
                        modelId: task.modelId,
                        participants: task.participants
                    }
                });
                result.governance = evaluation;
            }
            catch (error) {
                console.warn('AI governance check failed:', error);
            }
        }
        // Assess environmental impact
        if (this.ecoOptimizer) {
            try {
                const resources = task.participants.map((p) => ({
                    type: 'compute',
                    provider: 'aws',
                    instanceType: 't3.large',
                    region: 'us-east-1',
                    utilizationPercent: 75
                }));
                const optimization = await this.ecoOptimizer.resourceOptimizer.optimizeResourceAllocation(resources);
                result.energyImpact = optimization;
            }
            catch (error) {
                console.warn('Eco optimization failed:', error);
            }
        }
        return result;
    }
    /**
     * Monitor federated learning session with integrated governance
     */
    async monitorFederatedSession(sessionId) {
        const status = {
            health: {},
            governance: {},
            sustainability: {}
        };
        // Get orchestration health
        if (this.orchestrator) {
            try {
                status.health = await this.orchestrator.healthMonitoring.getSystemHealth();
            }
            catch (error) {
                status.health = { error: String(error) };
            }
        }
        // Get governance status
        if (this.aiGovernance) {
            try {
                status.governance = this.aiGovernance.getHealthStatus();
            }
            catch (error) {
                status.governance = { error: String(error) };
            }
        }
        // Get sustainability metrics
        if (this.ecoOptimizer) {
            try {
                const metrics = await this.ecoOptimizer.energyMonitor.getCurrentMetrics();
                status.sustainability = metrics;
            }
            catch (error) {
                status.sustainability = { error: String(error) };
            }
        }
        return status;
    }
    /**
     * Optimize federated learning round with sustainability considerations
     */
    async optimizeFederatedRound(round) {
        const recommendations = [];
        let energySavings = 0;
        // Get eco-optimization recommendations
        if (this.ecoOptimizer) {
            try {
                const advice = await this.ecoOptimizer.greenAIAdvisor.analyzeModel({
                    modelName: `federation-round-${round.roundNumber}`,
                    parameters: round.modelSize,
                    trainingData: round.participants.length * 1000,
                    framework: 'pytorch',
                    accelerator: 'gpu'
                });
                recommendations.push(...advice.recommendations.map((r) => r.action));
                energySavings = advice.metrics.estimatedEnergySavings || 0;
            }
            catch (error) {
                console.warn('Green AI analysis failed:', error);
            }
        }
        return {
            optimized: recommendations.length > 0,
            recommendations,
            energySavings
        };
    }
    /**
     * Get integrated system status
     */
    getSystemStatus() {
        return {
            federation: !!this.federationManager,
            orchestration: !!this.orchestrator,
            governance: !!this.aiGovernance,
            sustainability: !!this.ecoOptimizer
        };
    }
}
exports.FederatedGovernanceIntegration = FederatedGovernanceIntegration;
//# sourceMappingURL=index.js.map