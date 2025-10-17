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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AWSIntegration = void 0;
const winston = __importStar(require("winston"));
const axios_1 = __importDefault(require("axios"));
class AWSIntegration {
    constructor(accessKeyId, secretAccessKey, region = 'us-east-1') {
        this.accessKeyId = accessKeyId;
        this.secretAccessKey = secretAccessKey;
        this.region = region;
        this.baseUrl = `https://ec2.${region}.amazonaws.com`;
        this.logger = winston.createLogger({
            level: 'info',
            format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
            transports: [
                new winston.transports.Console(),
                new winston.transports.File({ filename: 'aws-integration.log' })
            ]
        });
    }
    async getRegions() {
        try {
            // AWS API call to describe regions
            const response = await this.makeAWSCall('DescribeRegions', {});
            return response.Regions.map((region) => ({
                name: region.RegionName,
                displayName: region.RegionName,
                continent: this.getContinentFromRegion(region.RegionName),
                latitude: this.getRegionCoordinates(region.RegionName).lat,
                longitude: this.getRegionCoordinates(region.RegionName).lng,
                availabilityZones: [] // Would need separate call to get AZs
            }));
        }
        catch (error) {
            this.logger.error('Failed to get AWS regions', error);
            throw error;
        }
    }
    async getEC2Instances(filters) {
        try {
            const params = {};
            if (filters) {
                params.Filters = Object.entries(filters).map(([name, value]) => ({
                    Name: name,
                    Values: [value]
                }));
            }
            const response = await this.makeAWSCall('DescribeInstances', params);
            const instances = [];
            for (const reservation of response.Reservations || []) {
                for (const instance of reservation.Instances || []) {
                    instances.push({
                        id: instance.InstanceId,
                        type: instance.InstanceType,
                        region: instance.Placement?.AvailabilityZone?.slice(0, -1) || this.region,
                        availabilityZone: instance.Placement?.AvailabilityZone || '',
                        state: instance.State?.Name?.toLowerCase() || 'unknown',
                        launchTime: new Date(instance.LaunchTime),
                        publicIp: instance.PublicIpAddress,
                        privateIp: instance.PrivateIpAddress,
                        tags: instance.Tags?.reduce((acc, tag) => {
                            acc[tag.Key] = tag.Value;
                            return acc;
                        }, {}) || {}
                    });
                }
            }
            return instances;
        }
        catch (error) {
            this.logger.error('Failed to get EC2 instances', error);
            throw error;
        }
    }
    async scaleEC2Instances(instanceIds, targetCount) {
        try {
            if (targetCount > instanceIds.length) {
                // Launch new instances
                const instancesToLaunch = targetCount - instanceIds.length;
                await this.launchEC2Instances(instancesToLaunch);
            }
            else if (targetCount < instanceIds.length) {
                // Terminate excess instances
                const instancesToTerminate = instanceIds.slice(targetCount);
                await this.terminateEC2Instances(instancesToTerminate);
            }
            this.logger.info(`Scaled EC2 instances to ${targetCount} instances`);
        }
        catch (error) {
            this.logger.error('Failed to scale EC2 instances', error);
            throw error;
        }
    }
    async getECSClusters() {
        try {
            const response = await this.makeECSCall('ListClusters', {});
            const clusterArns = response.clusterArns || [];
            const services = [];
            for (const clusterArn of clusterArns) {
                const clusterName = clusterArn.split('/').pop() || '';
                const servicesResponse = await this.makeECSCall('ListServices', { cluster: clusterName });
                const serviceArns = servicesResponse.serviceArns || [];
                for (const serviceArn of serviceArns) {
                    const serviceName = serviceArn.split('/').pop() || '';
                    const serviceDetails = await this.makeECSCall('DescribeServices', {
                        cluster: clusterName,
                        services: [serviceName]
                    });
                    const service = serviceDetails.services?.[0];
                    if (service) {
                        services.push({
                            id: service.serviceArn,
                            name: service.serviceName,
                            type: 'container',
                            region: this.region,
                            status: service.status?.toLowerCase() || 'unknown',
                            replicas: service.desiredCount,
                            tags: service.tags?.reduce((acc, tag) => {
                                acc[tag.Key] = tag.Value;
                                return acc;
                            }, {}) || {}
                        });
                    }
                }
            }
            return services;
        }
        catch (error) {
            this.logger.error('Failed to get ECS clusters', error);
            throw error;
        }
    }
    async scaleECSService(clusterName, serviceName, desiredCount) {
        try {
            await this.makeECSCall('UpdateService', {
                cluster: clusterName,
                service: serviceName,
                desiredCount
            });
            this.logger.info(`Scaled ECS service ${serviceName} to ${desiredCount} tasks`);
        }
        catch (error) {
            this.logger.error(`Failed to scale ECS service ${serviceName}`, error);
            throw error;
        }
    }
    async getLambdaFunctions() {
        try {
            const response = await this.makeLambdaCall('ListFunctions', {});
            return response.Functions?.map((func) => ({
                id: func.FunctionArn,
                name: func.FunctionName,
                type: 'function',
                region: this.region,
                status: 'running', // Lambda functions are always "running" if they exist
                tags: func.Tags || {}
            })) || [];
        }
        catch (error) {
            this.logger.error('Failed to get Lambda functions', error);
            throw error;
        }
    }
    async getCloudWatchMetrics(namespace, metricName, dimensions, startTime, endTime) {
        try {
            const response = await this.makeCloudWatchCall('GetMetricData', {
                MetricDataQueries: [{
                        Id: 'm1',
                        MetricStat: {
                            Metric: {
                                Namespace: namespace,
                                MetricName: metricName,
                                Dimensions: dimensions
                            },
                            Period: 300,
                            Stat: 'Average'
                        }
                    }],
                StartTime: startTime.toISOString(),
                EndTime: endTime.toISOString()
            });
            return response.MetricDataResults?.[0]?.Timestamps?.map((timestamp, index) => ({
                timestamp: new Date(timestamp),
                region: this.region,
                serviceId: dimensions.find(d => d.Name === 'InstanceId' || d.Name === 'FunctionName')?.Value || '',
                cpuUtilization: metricName === 'CPUUtilization' ? response.MetricDataResults[0].Values[index] : 0,
                memoryUtilization: metricName === 'MemoryUtilization' ? response.MetricDataResults[0].Values[index] : 0,
                networkIn: 0,
                networkOut: 0,
                diskReadOps: 0,
                diskWriteOps: 0,
                latency: 0,
                errorRate: 0,
                requestCount: 0
            })) || [];
        }
        catch (error) {
            this.logger.error('Failed to get CloudWatch metrics', error);
            throw error;
        }
    }
    async getSpotInstancePrices(instanceTypes) {
        try {
            const response = await this.makeAWSCall('DescribeSpotPriceHistory', {
                InstanceTypes: instanceTypes,
                ProductDescriptions: ['Linux/UNIX'],
                StartTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
                EndTime: new Date().toISOString()
            });
            const optimizations = [];
            const spotPrices = response.SpotPriceHistory || [];
            for (const instanceType of instanceTypes) {
                const spotPrice = spotPrices
                    .filter((price) => price.InstanceType === instanceType)
                    .sort((a, b) => parseFloat(a.SpotPrice) - parseFloat(b.SpotPrice))[0];
                if (spotPrice) {
                    const onDemandPrice = await this.getOnDemandPrice(instanceType);
                    const savings = ((onDemandPrice - parseFloat(spotPrice.SpotPrice)) / onDemandPrice) * 100;
                    optimizations.push({
                        instanceType,
                        spotPrice: parseFloat(spotPrice.SpotPrice),
                        onDemandPrice,
                        savingsPercentage: savings,
                        availability: 0.95, // Approximate
                        interruptionRate: 0.05 // Approximate
                    });
                }
            }
            return optimizations;
        }
        catch (error) {
            this.logger.error('Failed to get spot instance prices', error);
            throw error;
        }
    }
    async createAutoScalingGroup(config) {
        try {
            await this.makeAWSCall('CreateAutoScalingGroup', {
                AutoScalingGroupName: `${config.serviceId}-asg`,
                LaunchConfigurationName: config.serviceId,
                MinSize: config.minInstances,
                MaxSize: config.maxInstances,
                DesiredCapacity: config.minInstances,
                AvailabilityZones: [`${this.region}a`, `${this.region}b`]
            });
            // Create scaling policies
            if (config.targetCPUUtilization) {
                await this.makeAWSCall('PutScalingPolicy', {
                    AutoScalingGroupName: `${config.serviceId}-asg`,
                    PolicyName: 'TargetTracking-CPU',
                    PolicyType: 'TargetTrackingScaling',
                    TargetTrackingConfiguration: {
                        TargetValue: config.targetCPUUtilization,
                        PredefinedMetricSpecification: {
                            PredefinedMetricType: 'ASGAverageCPUUtilization'
                        }
                    }
                });
            }
            this.logger.info(`Created auto scaling group for ${config.serviceId}`);
        }
        catch (error) {
            this.logger.error(`Failed to create auto scaling group for ${config.serviceId}`, error);
            throw error;
        }
    }
    async launchEC2Instances(count) {
        await this.makeAWSCall('RunInstances', {
            ImageId: 'ami-0abcdef1234567890', // Would need to be configured
            MinCount: count,
            MaxCount: count,
            InstanceType: 't3.medium'
        });
    }
    async terminateEC2Instances(instanceIds) {
        await this.makeAWSCall('TerminateInstances', {
            InstanceIds: instanceIds
        });
    }
    async getOnDemandPrice(instanceType) {
        // This would require calling the Pricing API
        // For now, return approximate values
        const priceMap = {
            't3.medium': 0.0416,
            't3.large': 0.0832,
            'm5.large': 0.096,
            'c5.large': 0.085
        };
        return priceMap[instanceType] || 0.1;
    }
    async makeAWSCall(action, params) {
        // Simplified AWS API call - in real implementation would use AWS SDK
        const response = await axios_1.default.post(this.baseUrl, {
            Action: action,
            Version: '2016-11-15',
            ...params
        }, {
            headers: {
                'Authorization': `AWS4-HMAC-SHA256 Credential=${this.accessKeyId}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
        return response.data;
    }
    async makeECSCall(action, params) {
        const response = await axios_1.default.post(`https://ecs.${this.region}.amazonaws.com`, {
            Action: action,
            Version: '2014-11-13',
            ...params
        }, {
            headers: {
                'Authorization': `AWS4-HMAC-SHA256 Credential=${this.accessKeyId}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
        return response.data;
    }
    async makeLambdaCall(action, params) {
        const response = await axios_1.default.post(`https://lambda.${this.region}.amazonaws.com/2015-03-31/functions`, params, {
            headers: {
                'Authorization': `AWS4-HMAC-SHA256 Credential=${this.accessKeyId}`,
                'Content-Type': 'application/json'
            }
        });
        return response.data;
    }
    async makeCloudWatchCall(action, params) {
        const response = await axios_1.default.post(`https://monitoring.${this.region}.amazonaws.com`, {
            Action: action,
            Version: '2010-08-01',
            ...params
        }, {
            headers: {
                'Authorization': `AWS4-HMAC-SHA256 Credential=${this.accessKeyId}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
        return response.data;
    }
    getContinentFromRegion(region) {
        const continentMap = {
            'us-east-1': 'North America',
            'us-west-1': 'North America',
            'eu-west-1': 'Europe',
            'eu-central-1': 'Europe',
            'ap-southeast-1': 'Asia',
            'ap-northeast-1': 'Asia'
        };
        return continentMap[region] || 'Unknown';
    }
    getRegionCoordinates(region) {
        const coordinates = {
            'us-east-1': { lat: 39.0438, lng: -77.4874 },
            'us-west-1': { lat: 37.7749, lng: -122.4194 },
            'eu-west-1': { lat: 53.3498, lng: -6.2603 },
            'eu-central-1': { lat: 50.1109, lng: 8.6821 },
            'ap-southeast-1': { lat: 1.3521, lng: 103.8198 },
            'ap-northeast-1': { lat: 35.6762, lng: 139.6503 }
        };
        return coordinates[region] || { lat: 0, lng: 0 };
    }
}
exports.AWSIntegration = AWSIntegration;
//# sourceMappingURL=AWSIntegration.js.map