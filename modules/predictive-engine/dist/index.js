import { PredictiveEngine } from './core/PredictiveEngine';
import { KubernetesAutoscaler } from './services/KubernetesAutoscaler';
import { AdaptiveAgent } from './models/AdaptiveAgent';
import { BaselineLoader } from './utils/baselineLoader';
import { AWSIntegration } from './services/AWSIntegration';
import { GCPIntegration } from './services/GCPIntegration';
import { AzureIntegration } from './services/AzureIntegration';
import { GlobalRegionManager } from './services/GlobalRegionManager';
import { CostOptimizer } from './services/CostOptimizer';
import { UnifiedScalingAPI } from './services/UnifiedScalingAPI';
import { WorkloadPatternAnalyzer } from './services/WorkloadPatternAnalyzer';
import { GeoDistributionManager } from './services/GeoDistributionManager';
import { FederationIntegration } from './services/FederationIntegration';
import * as dotenv from 'dotenv';
// Load environment variables
dotenv.config();
export class NeonHubPredictiveEngine {
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
        this.predictiveEngine = new PredictiveEngine(thresholds);
        const neonHubApiUrl = process.env.NEONHUB_API_URL || 'http://localhost:3001';
        const prometheusUrl = process.env.PROMETHEUS_URL || 'http://localhost:9090';
        this.kubernetesAutoscaler = new KubernetesAutoscaler(neonHubApiUrl, prometheusUrl);
        this.adaptiveAgent = new AdaptiveAgent();
        // Initialize cloud integrations
        this.globalRegionManager = new GlobalRegionManager();
        this.costOptimizer = new CostOptimizer();
        this.unifiedScalingAPI = new UnifiedScalingAPI(this.globalRegionManager, this.costOptimizer, this.predictiveEngine);
        this.workloadPatternAnalyzer = new WorkloadPatternAnalyzer();
        this.geoDistributionManager = new GeoDistributionManager(this.globalRegionManager);
        this.federationIntegration = new FederationIntegration(this.globalRegionManager);
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
                const awsIntegration = awsConfig ? new AWSIntegration(awsConfig.accessKeyId, awsConfig.secretAccessKey, awsConfig.region) : undefined;
                const gcpIntegration = gcpConfig ? new GCPIntegration(gcpConfig.projectId, gcpConfig.serviceAccountKey, gcpConfig.region) : undefined;
                const azureIntegration = azureConfig ? new AzureIntegration(azureConfig.subscriptionId, azureConfig.tenantId, azureConfig.clientId, azureConfig.clientSecret, azureConfig.region) : undefined;
                this.costOptimizer = new CostOptimizer(awsIntegration, gcpIntegration, azureIntegration);
                this.unifiedScalingAPI = new UnifiedScalingAPI(this.globalRegionManager, this.costOptimizer, this.predictiveEngine);
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
        return await BaselineLoader.loadV31Baseline();
    }
    static async validateMetrics(metrics) {
        return BaselineLoader.validateBaseline(metrics);
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
// Export individual components for advanced usage
export { PredictiveEngine, KubernetesAutoscaler, AdaptiveAgent, BaselineLoader, AWSIntegration, GCPIntegration, AzureIntegration, GlobalRegionManager, CostOptimizer, UnifiedScalingAPI, WorkloadPatternAnalyzer, GeoDistributionManager, FederationIntegration };
// Default export for easy importing
export default NeonHubPredictiveEngine;
//# sourceMappingURL=index.js.map