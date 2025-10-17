import {
  CloudProvider,
  CloudRegion,
  CloudInstance,
  CloudService,
  CloudMetrics,
  ScalingPolicy,
  CostOptimization,
  GlobalScalingDecision
} from '../types';
import * as winston from 'winston';
import axios from 'axios';

export class GCPIntegration {
  private logger: winston.Logger;
  private projectId: string;
  private serviceAccountKey: string;
  private region: string;
  private baseUrl: string;

  constructor(projectId: string, serviceAccountKey: string, region: string = 'us-central1') {
    this.projectId = projectId;
    this.serviceAccountKey = serviceAccountKey;
    this.region = region;
    this.baseUrl = 'https://compute.googleapis.com/compute/v1';

    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'gcp-integration.log' })
      ]
    });
  }

  async getRegions(): Promise<CloudRegion[]> {
    try {
      const response = await this.makeGCPCall(`projects/${this.projectId}/regions`);
      return response.items.map((region: any) => ({
        name: region.name,
        displayName: region.name,
        continent: this.getContinentFromRegion(region.name),
        latitude: 0, // GCP doesn't provide coordinates in regions API
        longitude: 0,
        availabilityZones: region.zones?.map((zone: string) => zone.split('/').pop() || '') || []
      }));
    } catch (error) {
      this.logger.error('Failed to get GCP regions', error);
      throw error;
    }
  }

  async getComputeInstances(zone?: string): Promise<CloudInstance[]> {
    try {
      const targetZone = zone || `${this.region}-a`;
      const response = await this.makeGCPCall(`projects/${this.projectId}/zones/${targetZone}/instances`);

      return response.items?.map((instance: any) => ({
        id: instance.name,
        type: instance.machineType?.split('/').pop() || '',
        region: this.region,
        availabilityZone: targetZone,
        state: instance.status?.toLowerCase() || 'unknown',
        launchTime: new Date(instance.creationTimestamp),
        publicIp: instance.networkInterfaces?.[0]?.accessConfigs?.[0]?.natIP,
        privateIp: instance.networkInterfaces?.[0]?.networkIP,
        tags: instance.tags?.items?.reduce((acc: Record<string, string>, tag: string) => {
          acc[tag] = tag;
          return acc;
        }, {}) || {}
      })) || [];
    } catch (error) {
      this.logger.error('Failed to get Compute Engine instances', error);
      throw error;
    }
  }

  async scaleComputeInstances(instanceGroupName: string, zone: string, targetSize: number): Promise<void> {
    try {
      await this.makeGCPCall(
        `projects/${this.projectId}/zones/${zone}/instanceGroupManagers/${instanceGroupName}/resize`,
        'POST',
        { size: targetSize }
      );

      this.logger.info(`Scaled Compute Engine instance group ${instanceGroupName} to ${targetSize} instances`);
    } catch (error) {
      this.logger.error(`Failed to scale Compute Engine instance group ${instanceGroupName}`, error);
      throw error;
    }
  }

  async getCloudRunServices(): Promise<CloudService[]> {
    try {
      const response = await this.makeGCPCall(`projects/${this.projectId}/locations/${this.region}/services`);

      return response.services?.map((service: any) => ({
        id: service.name,
        name: service.name?.split('/').pop() || '',
        type: 'container',
        region: this.region,
        status: service.conditions?.[0]?.status === 'True' ? 'running' : 'failed',
        replicas: 1, // Cloud Run uses revision-based scaling
        tags: service.labels || {}
      })) || [];
    } catch (error) {
      this.logger.error('Failed to get Cloud Run services', error);
      throw error;
    }
  }

  async scaleCloudRunService(serviceName: string, minInstances: number, maxInstances: number): Promise<void> {
    try {
      await this.makeGCPCall(
        `projects/${this.projectId}/locations/${this.region}/services/${serviceName}`,
        'PATCH',
        {
          scaling: {
            minInstanceCount: minInstances,
            maxInstanceCount: maxInstances
          }
        }
      );

      this.logger.info(`Scaled Cloud Run service ${serviceName} to min: ${minInstances}, max: ${maxInstances}`);
    } catch (error) {
      this.logger.error(`Failed to scale Cloud Run service ${serviceName}`, error);
      throw error;
    }
  }

  async getCloudFunctions(): Promise<CloudService[]> {
    try {
      const response = await this.makeGCPCall(`projects/${this.projectId}/locations/${this.region}/functions`);

      return response.functions?.map((func: any) => ({
        id: func.name,
        name: func.name?.split('/').pop() || '',
        type: 'function',
        region: this.region,
        status: func.status === 'ACTIVE' ? 'running' : 'failed',
        tags: func.labels || {}
      })) || [];
    } catch (error) {
      this.logger.error('Failed to get Cloud Functions', error);
      throw error;
    }
  }

  async getCloudMonitoringMetrics(filter: string, startTime: Date, endTime: Date): Promise<CloudMetrics[]> {
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

      return response.timeSeries?.map((series: any) => ({
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
    } catch (error) {
      this.logger.error('Failed to get Cloud Monitoring metrics', error);
      throw error;
    }
  }

  async getSpotInstancePrices(instanceTypes: string[]): Promise<CostOptimization[]> {
    try {
      // GCP uses preemptible instances instead of spot instances
      const optimizations: CostOptimization[] = [];

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
    } catch (error) {
      this.logger.error('Failed to get preemptible instance prices', error);
      throw error;
    }
  }

  async createInstanceGroup(config: ScalingPolicy): Promise<void> {
    try {
      const zone = `${this.region}-a`;

      // Create instance template first
      const templateResponse = await this.makeGCPCall(
        `projects/${this.projectId}/global/instanceTemplates`,
        'POST',
        {
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
        }
      );

      // Create managed instance group
      await this.makeGCPCall(
        `projects/${this.projectId}/zones/${zone}/instanceGroupManagers`,
        'POST',
        {
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
        }
      );

      this.logger.info(`Created managed instance group for ${config.serviceId}`);
    } catch (error) {
      this.logger.error(`Failed to create instance group for ${config.serviceId}`, error);
      throw error;
    }
  }

  async createCloudRunAutoscaling(serviceName: string, config: ScalingPolicy): Promise<void> {
    try {
      await this.makeGCPCall(
        `projects/${this.projectId}/locations/${this.region}/services/${serviceName}`,
        'PATCH',
        {
          scaling: {
            minInstanceCount: config.minInstances,
            maxInstanceCount: config.maxInstances
          }
        }
      );

      this.logger.info(`Created autoscaling for Cloud Run service ${serviceName}`);
    } catch (error) {
      this.logger.error(`Failed to create autoscaling for Cloud Run service ${serviceName}`, error);
      throw error;
    }
  }

  private async getOnDemandPrice(instanceType: string): Promise<number> {
    // Simplified pricing - in real implementation would call Billing API
    const priceMap: Record<string, number> = {
      'n1-standard-1': 0.0475,
      'n1-standard-2': 0.0950,
      'n1-highmem-2': 0.1184,
      'n1-highcpu-2': 0.0764
    };
    return priceMap[instanceType] || 0.1;
  }

  private extractMetricValue(series: any, metricType: string, filterValue?: string): number {
    if (series.metric?.type === metricType) {
      const point = series.points?.[0];
      if (point && (!filterValue || series.metric?.labels?.response_code === filterValue)) {
        return point.value?.doubleValue || point.value?.int64Value || 0;
      }
    }
    return 0;
  }

  private async makeGCPCall(endpoint: string, method: string = 'GET', data?: any): Promise<any> {
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

  private async makeMonitoringCall(endpoint: string, method: string = 'GET', data?: any): Promise<any> {
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

  private async getAccessToken(): Promise<string> {
    // In real implementation, this would use the service account key to get an access token
    // For now, return a placeholder
    return 'ya29.placeholder_token';
  }

  private getContinentFromRegion(region: string): string {
    const continentMap: Record<string, string> = {
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