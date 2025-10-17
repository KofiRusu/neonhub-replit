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
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.FederationIntegration = exports.GeoDistributionManager = exports.WorkloadPatternAnalyzer = exports.UnifiedScalingAPI = exports.CostOptimizer = exports.GlobalRegionManager = exports.AzureIntegration = exports.GCPIntegration = exports.AWSIntegration = exports.BaselineLoader = exports.AdaptiveAgent = exports.KubernetesAutoscaler = exports.PredictiveEngine = exports.NeonHubPredictiveEngine = void 0;
const PredictiveEngine_1 = require("./core/PredictiveEngine");
Object.defineProperty(exports, "PredictiveEngine", { enumerable: true, get: function () { return PredictiveEngine_1.PredictiveEngine; } });
const KubernetesAutoscaler_1 = require("./services/KubernetesAutoscaler");
Object.defineProperty(exports, "KubernetesAutoscaler", { enumerable: true, get: function () { return KubernetesAutoscaler_1.KubernetesAutoscaler; } });
const AdaptiveAgent_1 = require("./models/AdaptiveAgent");
Object.defineProperty(exports, "AdaptiveAgent", { enumerable: true, get: function () { return AdaptiveAgent_1.AdaptiveAgent; } });
const baselineLoader_1 = require("./utils/baselineLoader");
Object.defineProperty(exports, "BaselineLoader", { enumerable: true, get: function () { return baselineLoader_1.BaselineLoader; } });
const AWSIntegration_1 = require("./services/AWSIntegration");
Object.defineProperty(exports, "AWSIntegration", { enumerable: true, get: function () { return AWSIntegration_1.AWSIntegration; } });
const GCPIntegration_1 = require("./services/GCPIntegration");
Object.defineProperty(exports, "GCPIntegration", { enumerable: true, get: function () { return GCPIntegration_1.GCPIntegration; } });
const AzureIntegration_1 = require("./services/AzureIntegration");
Object.defineProperty(exports, "AzureIntegration", { enumerable: true, get: function () { return AzureIntegration_1.AzureIntegration; } });
const GlobalRegionManager_1 = require("./services/GlobalRegionManager");
Object.defineProperty(exports, "GlobalRegionManager", { enumerable: true, get: function () { return GlobalRegionManager_1.GlobalRegionManager; } });
const CostOptimizer_1 = require("./services/CostOptimizer");
Object.defineProperty(exports, "CostOptimizer", { enumerable: true, get: function () { return CostOptimizer_1.CostOptimizer; } });
const UnifiedScalingAPI_1 = require("./services/UnifiedScalingAPI");
Object.defineProperty(exports, "UnifiedScalingAPI", { enumerable: true, get: function () { return UnifiedScalingAPI_1.UnifiedScalingAPI; } });
const WorkloadPatternAnalyzer_1 = require("./services/WorkloadPatternAnalyzer");
Object.defineProperty(exports, "WorkloadPatternAnalyzer", { enumerable: true, get: function () { return WorkloadPatternAnalyzer_1.WorkloadPatternAnalyzer; } });
const GeoDistributionManager_1 = require("./services/GeoDistributionManager");
Object.defineProperty(exports, "GeoDistributionManager", { enumerable: true, get: function () { return GeoDistributionManager_1.GeoDistributionManager; } });
const FederationIntegration_1 = require("./services/FederationIntegration");
Object.defineProperty(exports, "FederationIntegration", { enumerable: true, get: function () { return FederationIntegration_1.FederationIntegration; } });
const dotenv = __importStar(require("dotenv"));
// Load environment variables
dotenv.config();
class NeonHubPredictiveEngine {
    constructor() {
        this.isInitialized = false;
        const thresholds = {
            trafficSpikeThreshold: parseFloat(process.env.TRAFFIC_SPIKE_THRESHOLD || '1.5'),
            latencyDegradationThreshold: parseFloat(process.env.LATENCY_DEGRADATION_THRESHOLD || '1.2'),
            errorRateThreshold: parseFloat(process.env.ERROR_RATE_THRESHOLD || '0.05'),
            conversionDropThreshold: parseFloat(process.env.CONVERSION_DROP_THRESHOLD || '0.8'),
            cpuUtilizationThreshold: parseFloat(process.env.CPU_UTILIZATION_THRESHOLD || '0.8'),
            memoryUtilizationThreshold: parseFloat(process.env.MEMORY_UTILIZATION_THRESHOLD || '0.85')
        };
        this.predictiveEngine = new PredictiveEngine_1.PredictiveEngine(thresholds);
        const neonHubApiUrl = process.env.NEONHUB_API_URL || 'http://localhost:3001';
        const prometheusUrl = process.env.PROMETHEUS_URL || 'http://localhost:9090';
        this.kubernetesAutoscaler = new KubernetesAutoscaler_1.KubernetesAutoscaler(neonHubApiUrl, prometheusUrl);
        this.adaptiveAgent = new AdaptiveAgent_1.AdaptiveAgent();
        // Initialize cloud integrations
        this.globalRegionManager = new GlobalRegionManager_1.GlobalRegionManager();
        this.costOptimizer = new CostOptimizer_1.CostOptimizer();
        this.unifiedScalingAPI = new UnifiedScalingAPI_1.UnifiedScalingAPI(this.globalRegionManager, this.costOptimizer, this.predictiveEngine);
        this.workloadPatternAnalyzer = new WorkloadPatternAnalyzer_1.WorkloadPatternAnalyzer();
        this.geoDistributionManager = new GeoDistributionManager_1.GeoDistributionManager(this.globalRegionManager);
        this.federationIntegration = new FederationIntegration_1.FederationIntegration(this.globalRegionManager);
    }
    async initialize() {
        if (this.isInitialized)
            return;
        try {
            await this.predictiveEngine.initialize();
            await this.adaptiveAgent.initialize();
            // Initialize cloud integrations if credentials are provided
            const awsConfig = this.getAWSConfig();
            const gcpConfig = this.getGCPConfig();
            const azureConfig = this.getAzureConfig();
            if (awsConfig || gcpConfig || azureConfig) {
                await this.globalRegionManager.initializeCloudProviders(awsConfig, gcpConfig, azureConfig);
                // Initialize cost optimizer with integrations
                const awsIntegration = awsConfig ? new AWSIntegration_1.AWSIntegration(awsConfig.accessKeyId, awsConfig.secretAccessKey, awsConfig.region) : undefined;
                const gcpIntegration = gcpConfig ? new GCPIntegration_1.GCPIntegration(gcpConfig.projectId, gcpConfig.serviceAccountKey, gcpConfig.region) : undefined;
                const azureIntegration = azureConfig ? new AzureIntegration_1.AzureIntegration(azureConfig.subscriptionId, azureConfig.tenantId, azureConfig.clientId, azureConfig.clientSecret, azureConfig.region) : undefined;
                this.costOptimizer = new CostOptimizer_1.CostOptimizer(awsIntegration, gcpIntegration, azureIntegration);
                this.unifiedScalingAPI = new UnifiedScalingAPI_1.UnifiedScalingAPI(this.globalRegionManager, this.costOptimizer, this.predictiveEngine);
            }
            this.isInitialized = true;
            console.log('NeonHub Predictive Engine v3.2 with Cloud Integrations initialized successfully');
        }
        catch (error) {
            console.error('Failed to initialize predictive engine:', error);
            throw error;
        }
    }
    async processMetrics(currentMetrics) {
        if (!this.isInitialized) {
            throw new Error('Predictive engine not initialized');
        }
        // Update historical data
        this.predictiveEngine.updateHistoricalData(currentMetrics);
        // Create reinforcement learning state
        const rlState = {
            currentMetrics,
            historicalMetrics: this.predictiveEngine.getHistoricalData(),
            scalingActions: [], // This would be populated from actual scaling history
            reward: 0
        };
        // Get adaptive agent decision
        const agentDecision = this.adaptiveAgent.chooseAction(rlState);
        // Get predictive engine decision
        const predictiveDecision = await this.predictiveEngine.makeScalingDecision(currentMetrics);
        // Combine decisions (weighted average)
        const combinedDecision = {
            action: agentDecision.confidence > predictiveDecision.confidence ? agentDecision.action : predictiveDecision.action,
            targetReplicas: Math.round((agentDecision.targetReplicas * agentDecision.confidence + predictiveDecision.targetReplicas * predictiveDecision.confidence) / (agentDecision.confidence + predictiveDecision.confidence)),
            reason: `Combined decision: Agent (${agentDecision.confidence.toFixed(2)}) + Predictive (${predictiveDecision.confidence.toFixed(2)})`,
            confidence: Math.max(agentDecision.confidence, predictiveDecision.confidence),
            predictedLoad: (agentDecision.predictedLoad + predictiveDecision.predictedLoad) / 2
        };
        return combinedDecision;
    }
    async executeScaling(decision, namespace = 'default', deploymentName = 'neonhub-api') {
        if (decision.action === 'no_action') {
            console.log('No scaling action required');
            return;
        }
        try {
            await this.kubernetesAutoscaler.scaleDeployment(namespace, deploymentName, decision);
            // Verify zero-downtime scaling
            const isZeroDowntime = await this.kubernetesAutoscaler.checkZeroDowntimeScaling(namespace, deploymentName);
            if (!isZeroDowntime) {
                console.warn('Zero-downtime scaling verification failed');
            }
            console.log(`Successfully executed scaling: ${decision.action} to ${decision.targetReplicas} replicas`);
        }
        catch (error) {
            console.error('Failed to execute scaling:', error);
            throw error;
        }
    }
    async getSystemHealth() {
        const health = {
            predictiveEngine: this.isInitialized,
            kubernetesAutoscaler: true, // Would implement actual health check
            adaptiveAgent: this.isInitialized,
            overall: this.isInitialized
        };
        return health;
    }
    getAdaptiveAgentStats() {
        return this.adaptiveAgent.getLearningStats();
    }
    getBaselineMetrics() {
        return this.predictiveEngine.getBaselineMetrics();
    }
    // Cloud integration methods
    async configureCloudProviders(awsConfig, gcpConfig, azureConfig) {
        await this.globalRegionManager.initializeCloudProviders(awsConfig, gcpConfig, azureConfig);
    }
    async setupGeoDistribution(config) {
        await this.geoDistributionManager.configureGeoDistribution(config);
    }
    async connectToFederation(config) {
        await this.federationIntegration.connectToFederation(config);
    }
    async scaleAcrossProviders(provider, region, serviceId, targetReplicas, options) {
        return await this.unifiedScalingAPI.scaleAcrossProviders(provider, region, serviceId, targetReplicas, options);
    }
    async getGlobalHealthStatus() {
        return await this.unifiedScalingAPI.getGlobalHealthStatus();
    }
    // Utility methods for external integration
    static async loadBaselineMetrics() {
        return await baselineLoader_1.BaselineLoader.loadV31Baseline();
    }
    static async validateMetrics(metrics) {
        return baselineLoader_1.BaselineLoader.validateBaseline(metrics);
    }
    getAWSConfig() {
        const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
        const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
        const region = process.env.AWS_REGION || 'us-east-1';
        if (accessKeyId && secretAccessKey) {
            return { accessKeyId, secretAccessKey, region };
        }
        return undefined;
    }
    getGCPConfig() {
        const projectId = process.env.GCP_PROJECT_ID;
        const serviceAccountKey = process.env.GCP_SERVICE_ACCOUNT_KEY;
        const region = process.env.GCP_REGION || 'us-central1';
        if (projectId && serviceAccountKey) {
            return { projectId, serviceAccountKey, region };
        }
        return undefined;
    }
    getAzureConfig() {
        const subscriptionId = process.env.AZURE_SUBSCRIPTION_ID;
        const tenantId = process.env.AZURE_TENANT_ID;
        const clientId = process.env.AZURE_CLIENT_ID;
        const clientSecret = process.env.AZURE_CLIENT_SECRET;
        const region = process.env.AZURE_REGION || 'eastus';
        if (subscriptionId && tenantId && clientId && clientSecret) {
            return { subscriptionId, tenantId, clientId, clientSecret, region };
        }
        return undefined;
    }
}
exports.NeonHubPredictiveEngine = NeonHubPredictiveEngine;
// Default export for easy importing
exports.default = NeonHubPredictiveEngine;
//# sourceMappingURL=index.js.map