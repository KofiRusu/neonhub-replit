import * as winston from 'winston';
import axios from 'axios';
export class GCPIntegration {
    constructor(projectId, serviceAccountKey, region = 'us-central1') {
        this.projectId = projectId;
        this.serviceAccountKey = serviceAccountKey;
        this.region = region;
        this.baseUrl = 'https://compute.googleapis.com/compute/v1';
        this.logger = winston.createLogger({
            level: 'info',
            format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
            transports: [
                new winston.transports.Console(),
                new winston.transports.File({ filename: 'gcp-integration.log' })
            ]
        });
    }
    async getRegions() {
        try {
            const response = await this.makeGCPCall(`projects/${this.projectId}/regions`);
            return response.items.map((region) => ({
                name: region.name,
                displayName: region.name,
                continent: this.getContinentFromRegion(region.name),
                latitude: 0, // GCP doesn't provide coordinates in regions API
                longitude: 0,
                availabilityZones: region.zones?.map((zone) => zone.split('/').pop() || '') || []
            }));
        }
        catch (error) {
            this.logger.error('Failed to get GCP regions', error);
            throw error;
        }
    }
    async getComputeInstances(zone) {
        try {
            const targetZone = zone || `${this.region}-a`;
            const response = await this.makeGCPCall(`projects/${this.projectId}/zones/${targetZone}/instances`);
            return response.items?.map((instance) => ({
                id: instance.name,
                type: instance.machineType?.split('/').pop() || '',
                region: this.region,
                availabilityZone: targetZone,
                state: instance.status?.toLowerCase() || 'unknown',
                launchTime: new Date(instance.creationTimestamp),
                publicIp: instance.networkInterfaces?.[0]?.accessConfigs?.[0]?.natIP,
                privateIp: instance.networkInterfaces?.[0]?.networkIP,
                tags: instance.tags?.items?.reduce((acc, tag) => {
                    acc[tag] = tag;
                    return acc;
                }, {}) || {}
            })) || [];
        }
        catch (error) {
            this.logger.error('Failed to get Compute Engine instances', error);
            throw error;
        }
    }
    async scaleComputeInstances(instanceGroupName, zone, targetSize) {
        try {
            await this.makeGCPCall(`projects/${this.projectId}/zones/${zone}/instanceGroupManagers/${instanceGroupName}/resize`, 'POST', { size: targetSize });
            this.logger.info(`Scaled Compute Engine instance group ${instanceGroupName} to ${targetSize} instances`);
        }
        catch (error) {
            this.logger.error(`Failed to scale Compute Engine instance group ${instanceGroupName}`, error);
            throw error;
        }
    }
    async getCloudRunServices() {
        try {
            const response = await this.makeGCPCall(`projects/${this.projectId}/locations/${this.region}/services`);
            return response.services?.map((service) => ({
                id: service.name,
                name: service.name?.split('/').pop() || '',
                type: 'container',
                region: this.region,
                status: service.conditions?.[0]?.status === 'True' ? 'running' : 'failed',
                replicas: 1, // Cloud Run uses revision-based scaling
                tags: service.labels || {}
            })) || [];
        }
        catch (error) {
            this.logger.error('Failed to get Cloud Run services', error);
            throw error;
        }
    }
    async scaleCloudRunService(serviceName, minInstances, maxInstances) {
        try {
            await this.makeGCPCall(`projects/${this.projectId}/locations/${this.region}/services/${serviceName}`, 'PATCH', {
                scaling: {
                    minInstanceCount: minInstances,
                    maxInstanceCount: maxInstances
                }
            });
            this.logger.info(`Scaled Cloud Run service ${serviceName} to min: ${minInstances}, max: ${maxInstances}`);
        }
        catch (error) {
            this.logger.error(`Failed to scale Cloud Run service ${serviceName}`, error);
            throw error;
        }
    }
    async getCloudFunctions() {
        try {
            const response = await this.makeGCPCall(`projects/${this.projectId}/locations/${this.region}/functions`);
            return response.functions?.map((func) => ({
                id: func.name,
                name: func.name?.split('/').pop() || '',
                type: 'function',
                region: this.region,
                status: func.status === 'ACTIVE' ? 'running' : 'failed',
                tags: func.labels || {}
            })) || [];
        }
        catch (error) {
            this.logger.error('Failed to get Cloud Functions', error);
            throw error;
        }
    }
    async getCloudMonitoringMetrics(filter, startTime, endTime) {
        try {
            const response = await this.makeMonitoringCall('timeSeries:list', 'POST', {
                filter,
                interval: {
                    startTime: startTime.toISOString(),
                    endTime: endTime.toISOString()
                },
                aggregation: {
                    alignmentPeriod: '300s',
                    perSeriesAligner: 'ALIGN_MEAN'
                }
            });
            return response.timeSeries?.map((series) => ({
                timestamp: new Date(series.points?.[0]?.interval?.endTime || Date.now()),
                region: this.region,
                serviceId: series.resource?.labels?.instance_name || '',
                cpuUtilization: this.extractMetricValue(series, 'compute.googleapis.com/instance/cpu/utilization'),
                memoryUtilization: this.extractMetricValue(series, 'compute.googleapis.com/instance/memory/utilization'),
                networkIn: 0,
                networkOut: 0,
                diskReadOps: 0,
                diskWriteOps: 0,
                latency: this.extractMetricValue(series, 'run.googleapis.com/request_latencies'),
                errorRate: this.extractMetricValue(series, 'run.googleapis.com/request_count', 'ERROR'),
                requestCount: this.extractMetricValue(series, 'run.googleapis.com/request_count')
            })) || [];
        }
        catch (error) {
            this.logger.error('Failed to get Cloud Monitoring metrics', error);
            throw error;
        }
    }
    async getSpotInstancePrices(instanceTypes) {
        try {
            // GCP uses preemptible instances instead of spot instances
            const optimizations = [];
            for (const instanceType of instanceTypes) {
                const onDemandPrice = await this.getOnDemandPrice(instanceType);
                const preemptiblePrice = onDemandPrice * 0.006; // Approximate preemptible discount
                optimizations.push({
                    instanceType,
                    spotPrice: preemptiblePrice,
                    onDemandPrice,
                    savingsPercentage: 80, // GCP preemptible instances are ~80% cheaper
                    availability: 0.8, // Lower availability due to preemption
                    interruptionRate: 0.3 // Higher interruption rate
                });
            }
            return optimizations;
        }
        catch (error) {
            this.logger.error('Failed to get preemptible instance prices', error);
            throw error;
        }
    }
    async createInstanceGroup(config) {
        try {
            const zone = `${this.region}-a`;
            // Create instance template first
            const templateResponse = await this.makeGCPCall(`projects/${this.projectId}/global/instanceTemplates`, 'POST', {
                name: `${config.serviceId}-template`,
                properties: {
                    machineType: 'n1-standard-1',
                    disks: [{
                            boot: true,
                            initializeParams: {
                                sourceImage: 'projects/debian-cloud/global/images/family/debian-10'
                            }
                        }],
                    networkInterfaces: [{
                            network: 'global/networks/default'
                        }]
                }
            });
            // Create managed instance group
            await this.makeGCPCall(`projects/${this.projectId}/zones/${zone}/instanceGroupManagers`, 'POST', {
                name: `${config.serviceId}-mig`,
                baseInstanceName: config.serviceId,
                instanceTemplate: templateResponse.selfLink,
                targetSize: config.minInstances,
                autoscalingPolicy: {
                    minNumReplicas: config.minInstances,
                    maxNumReplicas: config.maxInstances,
                    cpuUtilization: {
                        utilizationTarget: (config.targetCPUUtilization || 0.6) / 100
                    },
                    cooldownPeriodSec: config.cooldownPeriod
                }
            });
            this.logger.info(`Created managed instance group for ${config.serviceId}`);
        }
        catch (error) {
            this.logger.error(`Failed to create instance group for ${config.serviceId}`, error);
            throw error;
        }
    }
    async createCloudRunAutoscaling(serviceName, config) {
        try {
            await this.makeGCPCall(`projects/${this.projectId}/locations/${this.region}/services/${serviceName}`, 'PATCH', {
                scaling: {
                    minInstanceCount: config.minInstances,
                    maxInstanceCount: config.maxInstances
                }
            });
            this.logger.info(`Created autoscaling for Cloud Run service ${serviceName}`);
        }
        catch (error) {
            this.logger.error(`Failed to create autoscaling for Cloud Run service ${serviceName}`, error);
            throw error;
        }
    }
    async getOnDemandPrice(instanceType) {
        // Simplified pricing - in real implementation would call Billing API
        const priceMap = {
            'n1-standard-1': 0.0475,
            'n1-standard-2': 0.0950,
            'n1-highmem-2': 0.1184,
            'n1-highcpu-2': 0.0764
        };
        return priceMap[instanceType] || 0.1;
    }
    extractMetricValue(series, metricType, filterValue) {
        if (series.metric?.type === metricType) {
            const point = series.points?.[0];
            if (point && (!filterValue || series.metric?.labels?.response_code === filterValue)) {
                return point.value?.doubleValue || point.value?.int64Value || 0;
            }
        }
        return 0;
    }
    async makeGCPCall(endpoint, method = 'GET', data) {
        const url = `${this.baseUrl}/${endpoint}`;
        const response = await axios({
            method,
            url,
            headers: {
                'Authorization': `Bearer ${await this.getAccessToken()}`,
                'Content-Type': 'application/json'
            },
            data
        });
        return response.data;
    }
    async makeMonitoringCall(endpoint, method = 'GET', data) {
        const url = `https://monitoring.googleapis.com/v3/${endpoint}`;
        const response = await axios({
            method,
            url,
            headers: {
                'Authorization': `Bearer ${await this.getAccessToken()}`,
                'Content-Type': 'application/json'
            },
            data
        });
        return response.data;
    }
    async getAccessToken() {
        // In real implementation, this would use the service account key to get an access token
        // For now, return a placeholder
        return 'ya29.placeholder_token';
    }
    getContinentFromRegion(region) {
        const continentMap = {
            'us-central1': 'North America',
            'us-east1': 'North America',
            'us-west1': 'North America',
            'europe-west1': 'Europe',
            'europe-west2': 'Europe',
            'asia-east1': 'Asia',
            'asia-southeast1': 'Asia'
        };
        return continentMap[region] || 'Unknown';
    }
}
//# sourceMappingURL=GCPIntegration.js.map