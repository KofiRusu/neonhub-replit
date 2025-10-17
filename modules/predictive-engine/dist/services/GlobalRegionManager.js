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
exports.GlobalRegionManager = void 0;
const AWSIntegration_1 = require("./AWSIntegration");
const GCPIntegration_1 = require("./GCPIntegration");
const AzureIntegration_1 = require("./AzureIntegration");
const winston = __importStar(require("winston"));
class GlobalRegionManager {
    constructor() {
        this.regions = new Map();
        this.logger = winston.createLogger({
            level: 'info',
            format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
            transports: [
                new winston.transports.Console(),
                new winston.transports.File({ filename: 'global-region-manager.log' })
            ]
        });
    }
    async initializeCloudProviders(awsConfig, gcpConfig, azureConfig) {
        try {
            if (awsConfig) {
                this.awsIntegration = new AWSIntegration_1.AWSIntegration(awsConfig.accessKeyId, awsConfig.secretAccessKey, awsConfig.region);
                const awsRegions = await this.awsIntegration.getRegions();
                awsRegions.forEach(region => this.regions.set(`aws-${region.name}`, region));
            }
            if (gcpConfig) {
                this.gcpIntegration = new GCPIntegration_1.GCPIntegration(gcpConfig.projectId, gcpConfig.serviceAccountKey, gcpConfig.region);
                const gcpRegions = await this.gcpIntegration.getRegions();
                gcpRegions.forEach(region => this.regions.set(`gcp-${region.name}`, region));
            }
            if (azureConfig) {
                this.azureIntegration = new AzureIntegration_1.AzureIntegration(azureConfig.subscriptionId, azureConfig.tenantId, azureConfig.clientId, azureConfig.clientSecret, azureConfig.region);
                await this.azureIntegration.authenticate();
                const azureLocations = await this.azureIntegration.getLocations();
                azureLocations.forEach(location => this.regions.set(`azure-${location.name}`, location));
            }
            this.logger.info('Global region manager initialized with cloud providers');
        }
        catch (error) {
            this.logger.error('Failed to initialize cloud providers', error);
            throw error;
        }
    }
    async discoverServices() {
        const allServices = [];
        try {
            if (this.awsIntegration) {
                const ec2Instances = await this.awsIntegration.getEC2Instances();
                const ecsClusters = await this.awsIntegration.getECSClusters();
                const lambdaFunctions = await this.awsIntegration.getLambdaFunctions();
                allServices.push(...ec2Instances.map(inst => ({
                    id: inst.id,
                    name: inst.id,
                    type: 'compute',
                    region: inst.region,
                    status: inst.state,
                    tags: inst.tags
                })));
                allServices.push(...ecsClusters);
                allServices.push(...lambdaFunctions);
            }
            if (this.gcpIntegration) {
                const computeInstances = await this.gcpIntegration.getComputeInstances();
                const cloudRunServices = await this.gcpIntegration.getCloudRunServices();
                const cloudFunctions = await this.gcpIntegration.getCloudFunctions();
                allServices.push(...computeInstances.map(inst => ({
                    id: inst.id,
                    name: inst.id,
                    type: 'compute',
                    region: inst.region,
                    status: inst.state,
                    tags: inst.tags
                })));
                allServices.push(...cloudRunServices);
                allServices.push(...cloudFunctions);
            }
            if (this.azureIntegration) {
                const vmInstances = await this.azureIntegration.getVMInstances();
                const aksClusters = await this.azureIntegration.getAKSClusters();
                const functions = await this.azureIntegration.getFunctions();
                allServices.push(...vmInstances.map(inst => ({
                    id: inst.id,
                    name: inst.id,
                    type: 'compute',
                    region: inst.region,
                    status: inst.state,
                    tags: inst.tags
                })));
                allServices.push(...aksClusters);
                allServices.push(...functions);
            }
            this.logger.info(`Discovered ${allServices.length} services across all cloud providers`);
            return allServices;
        }
        catch (error) {
            this.logger.error('Failed to discover services', error);
            throw error;
        }
    }
    async getGlobalMetrics(startTime, endTime) {
        const allMetrics = [];
        try {
            if (this.awsIntegration) {
                const awsMetrics = await this.awsIntegration.getCloudWatchMetrics('AWS/EC2', 'CPUUtilization', [], startTime, endTime);
                allMetrics.push(...awsMetrics);
            }
            if (this.gcpIntegration) {
                const gcpMetrics = await this.gcpIntegration.getCloudMonitoringMetrics('resource.type=gce_instance', startTime, endTime);
                allMetrics.push(...gcpMetrics);
            }
            if (this.azureIntegration) {
                const azureMetrics = await this.azureIntegration.getAzureMonitorMetrics(`/subscriptions/${this.azureIntegration['subscriptionId']}/resourceGroups/default`, ['Percentage CPU'], startTime, endTime);
                allMetrics.push(...azureMetrics);
            }
            return allMetrics;
        }
        catch (error) {
            this.logger.error('Failed to get global metrics', error);
            throw error;
        }
    }
    async executeGlobalScaling(decision) {
        try {
            const { provider, region, serviceId } = decision;
            switch (provider) {
                case 'aws':
                    if (decision.serviceId.includes('ecs')) {
                        await this.awsIntegration?.scaleECSService('default', serviceId, decision.targetReplicas);
                    }
                    else {
                        const instances = await this.awsIntegration?.getEC2Instances({ 'tag:Service': serviceId });
                        if (instances && instances.length > 0) {
                            await this.awsIntegration?.scaleEC2Instances(instances.map(i => i.id), decision.targetReplicas);
                        }
                    }
                    break;
                case 'gcp':
                    if (decision.serviceId.includes('run')) {
                        await this.gcpIntegration?.scaleCloudRunService(serviceId, decision.targetReplicas, decision.targetReplicas * 2);
                    }
                    else {
                        await this.gcpIntegration?.scaleComputeInstances(serviceId, `${region}-a`, decision.targetReplicas);
                    }
                    break;
                case 'azure':
                    if (decision.serviceId.includes('aks')) {
                        await this.azureIntegration?.scaleAKSNodePool('default', serviceId.replace('-aks', ''), 'default', decision.targetReplicas);
                    }
                    else {
                        await this.azureIntegration?.scaleVMScaleSet('default', serviceId, decision.targetReplicas);
                    }
                    break;
            }
            this.logger.info(`Executed global scaling: ${provider}/${region}/${serviceId} -> ${decision.targetReplicas} replicas`);
        }
        catch (error) {
            this.logger.error('Failed to execute global scaling', error);
            throw error;
        }
    }
    async handleFailover(primaryRegion, decision) {
        try {
            if (!decision.failoverRegions || decision.failoverRegions.length === 0) {
                throw new Error('No failover regions specified');
            }
            this.logger.warn(`Initiating failover from ${primaryRegion} to ${decision.failoverRegions[0]}`);
            // Scale down primary region
            const primaryDecision = { ...decision, targetReplicas: 0 };
            await this.executeGlobalScaling(primaryDecision);
            // Scale up failover region
            const failoverDecision = {
                ...decision,
                region: decision.failoverRegions[0],
                targetReplicas: decision.targetReplicas
            };
            await this.executeGlobalScaling(failoverDecision);
            // Update DNS/routing if geo-distribution is configured
            if (this.geoConfig) {
                await this.updateGeoDistribution({
                    ...this.geoConfig,
                    trafficDistribution: {
                        ...this.geoConfig.trafficDistribution,
                        [primaryRegion]: 0,
                        [decision.failoverRegions[0]]: 1
                    }
                });
            }
            this.logger.info(`Failover completed: ${primaryRegion} -> ${decision.failoverRegions[0]}`);
        }
        catch (error) {
            this.logger.error('Failed to handle failover', error);
            throw error;
        }
    }
    async optimizeGeoDistribution(config) {
        try {
            this.geoConfig = config;
            // Calculate optimal distribution based on latency and load
            const optimalDistribution = await this.calculateOptimalDistribution(config);
            // Update traffic distribution
            await this.updateGeoDistribution({
                ...config,
                trafficDistribution: optimalDistribution
            });
            this.logger.info('Geo-distribution optimized', { optimalDistribution });
        }
        catch (error) {
            this.logger.error('Failed to optimize geo-distribution', error);
            throw error;
        }
    }
    async integrateWithFederation(federationConfig) {
        try {
            this.federationCoordination = federationConfig;
            // Register with federation coordinator
            // This would integrate with the federation module's FederationManager
            this.logger.info('Integrated with federation coordinator', { federationId: federationConfig.federationId });
        }
        catch (error) {
            this.logger.error('Failed to integrate with federation', error);
            throw error;
        }
    }
    async calculateOptimalDistribution(config) {
        const distribution = {};
        // Simple latency-based distribution
        const totalLatency = config.regions.reduce((sum, region) => {
            const latency = config.latencyThresholds[region.name] || 100;
            return sum + (1 / latency); // Inverse relationship
        }, 0);
        config.regions.forEach(region => {
            const latency = config.latencyThresholds[region.name] || 100;
            distribution[region.name] = (1 / latency) / totalLatency;
        });
        return distribution;
    }
    async updateGeoDistribution(config) {
        // This would integrate with actual load balancers/CDNs
        // For now, just log the intended distribution
        this.logger.info('Updating geo-distribution', {
            trafficDistribution: config.trafficDistribution,
            latencyThresholds: config.latencyThresholds
        });
    }
    getAvailableRegions() {
        return Array.from(this.regions.values());
    }
    getFederationStatus() {
        return this.federationCoordination;
    }
    getGeoConfig() {
        return this.geoConfig;
    }
}
exports.GlobalRegionManager = GlobalRegionManager;
//# sourceMappingURL=GlobalRegionManager.js.map