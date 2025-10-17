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

export class AzureIntegration {
  private logger: winston.Logger;
  private subscriptionId: string;
  private tenantId: string;
  private clientId: string;
  private clientSecret: string;
  private region: string;
  private baseUrl: string;
  private accessToken: string = '';

  constructor(subscriptionId: string, tenantId: string, clientId: string, clientSecret: string, region: string = 'eastus') {
    this.subscriptionId = subscriptionId;
    this.tenantId = tenantId;
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.region = region;
    this.baseUrl = 'https://management.azure.com';

    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'azure-integration.log' })
      ]
    });
  }

  async authenticate(): Promise<void> {
    try {
      const response = await axios.post(
        `https://login.microsoftonline.com/${this.tenantId}/oauth2/v2.0/token`,
        new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: this.clientId,
          client_secret: this.clientSecret,
          scope: 'https://management.azure.com/.default'
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      this.accessToken = response.data.access_token;
      this.logger.info('Successfully authenticated with Azure');
    } catch (error) {
      this.logger.error('Failed to authenticate with Azure', error);
      throw error;
    }
  }

  async getLocations(): Promise<CloudRegion[]> {
    try {
      await this.ensureAuthenticated();
      const response = await this.makeAzureCall(`subscriptions/${this.subscriptionId}/locations`);

      return response.value.map((location: any) => ({
        name: location.name,
        displayName: location.displayName,
        continent: this.getContinentFromLocation(location.name),
        latitude: location.metadata?.latitude || 0,
        longitude: location.metadata?.longitude || 0,
        availabilityZones: [] // Azure availability zones are per resource
      }));
    } catch (error) {
      this.logger.error('Failed to get Azure locations', error);
      throw error;
    }
  }

  async getVMInstances(resourceGroup?: string): Promise<CloudInstance[]> {
    try {
      await this.ensureAuthenticated();
      const rg = resourceGroup || 'default';
      const response = await this.makeAzureCall(`subscriptions/${this.subscriptionId}/resourceGroups/${rg}/providers/Microsoft.Compute/virtualMachines`);

      return response.value?.map((vm: any) => ({
        id: vm.name,
        type: vm.properties?.hardwareProfile?.vmSize || '',
        region: vm.location,
        availabilityZone: vm.properties?.availabilitySet?.id?.split('/').pop() || '',
        state: vm.properties?.provisioningState?.toLowerCase() || 'unknown',
        launchTime: new Date(vm.properties?.timeCreated || Date.now()),
        publicIp: '', // Would need separate call to network interfaces
        privateIp: '', // Would need separate call to network interfaces
        tags: vm.tags || {}
      })) || [];
    } catch (error) {
      this.logger.error('Failed to get Azure VM instances', error);
      throw error;
    }
  }

  async scaleVMScaleSet(resourceGroup: string, scaleSetName: string, capacity: number): Promise<void> {
    try {
      await this.ensureAuthenticated();
      await this.makeAzureCall(
        `subscriptions/${this.subscriptionId}/resourceGroups/${resourceGroup}/providers/Microsoft.Compute/virtualMachineScaleSets/${scaleSetName}`,
        'PATCH',
        {
          sku: {
            capacity
          }
        }
      );

      this.logger.info(`Scaled Azure VM scale set ${scaleSetName} to ${capacity} instances`);
    } catch (error) {
      this.logger.error(`Failed to scale Azure VM scale set ${scaleSetName}`, error);
      throw error;
    }
  }

  async getAKSClusters(resourceGroup?: string): Promise<CloudService[]> {
    try {
      await this.ensureAuthenticated();
      const rg = resourceGroup || 'default';
      const response = await this.makeAzureCall(`subscriptions/${this.subscriptionId}/resourceGroups/${rg}/providers/Microsoft.ContainerService/managedClusters`);

      return response.value?.map((cluster: any) => ({
        id: cluster.id,
        name: cluster.name,
        type: 'container',
        region: cluster.location,
        status: cluster.properties?.provisioningState?.toLowerCase() || 'unknown',
        replicas: cluster.properties?.agentPoolProfiles?.[0]?.count || 0,
        tags: cluster.tags || {}
      })) || [];
    } catch (error) {
      this.logger.error('Failed to get AKS clusters', error);
      throw error;
    }
  }

  async scaleAKSNodePool(resourceGroup: string, clusterName: string, nodePoolName: string, count: number): Promise<void> {
    try {
      await this.ensureAuthenticated();
      await this.makeAzureCall(
        `subscriptions/${this.subscriptionId}/resourceGroups/${resourceGroup}/providers/Microsoft.ContainerService/managedClusters/${clusterName}/agentPools/${nodePoolName}`,
        'PUT',
        {
          properties: {
            count
          }
        }
      );

      this.logger.info(`Scaled AKS node pool ${nodePoolName} to ${count} nodes`);
    } catch (error) {
      this.logger.error(`Failed to scale AKS node pool ${nodePoolName}`, error);
      throw error;
    }
  }

  async getFunctions(resourceGroup?: string): Promise<CloudService[]> {
    try {
      await this.ensureAuthenticated();
      const rg = resourceGroup || 'default';
      const response = await this.makeAzureCall(`subscriptions/${this.subscriptionId}/resourceGroups/${rg}/providers/Microsoft.Web/sites`);

      return response.value?.filter((site: any) =>
        site.kind?.includes('functionapp')
      ).map((func: any) => ({
        id: func.id,
        name: func.name,
        type: 'function',
        region: func.location,
        status: func.properties?.state?.toLowerCase() || 'unknown',
        tags: func.tags || {}
      })) || [];
    } catch (error) {
      this.logger.error('Failed to get Azure Functions', error);
      throw error;
    }
  }

  async getAzureMonitorMetrics(resourceId: string, metricNames: string[], startTime: Date, endTime: Date): Promise<CloudMetrics[]> {
    try {
      await this.ensureAuthenticated();

      const metrics: CloudMetrics[] = [];
      for (const metricName of metricNames) {
        const response = await this.makeAzureCall(
          `${resourceId}/providers/microsoft.insights/metrics`,
          'GET',
          null,
          {
            'metricnames': metricName,
            'timespan': `${startTime.toISOString()}/${endTime.toISOString()}`,
            'aggregation': 'Average',
            'interval': 'PT5M'
          }
        );

        if (response.value?.[0]?.timeseries?.[0]?.data) {
          const data = response.value[0].timeseries[0].data;
          data.forEach((point: any) => {
            metrics.push({
              timestamp: new Date(point.timeStamp),
              region: this.region,
              serviceId: resourceId.split('/').pop() || '',
              cpuUtilization: metricName === 'Percentage CPU' ? point.average : 0,
              memoryUtilization: metricName === 'Available Memory Bytes' ? (1 - (point.average || 0) / 100) : 0,
              networkIn: metricName === 'Network In Total' ? point.average || 0 : 0,
              networkOut: metricName === 'Network Out Total' ? point.average || 0 : 0,
              diskReadOps: 0,
              diskWriteOps: 0,
              latency: 0,
              errorRate: 0,
              requestCount: metricName === 'Requests' ? point.average || 0 : 0
            });
          });
        }
      }

      return metrics;
    } catch (error) {
      this.logger.error('Failed to get Azure Monitor metrics', error);
      throw error;
    }
  }

  async getSpotInstancePrices(vmSizes: string[]): Promise<CostOptimization[]> {
    try {
      await this.ensureAuthenticated();

      const optimizations: CostOptimization[] = [];
      for (const vmSize of vmSizes) {
        // Get spot pricing from Azure Retail Prices API
        const response = await axios.get(
          'https://prices.azure.com/api/retail/prices',
          {
            params: {
              '$filter': `serviceName eq 'Virtual Machines' and armRegionName eq '${this.region}' and skuName eq '${vmSize}' and priceType eq 'Consumption'`
            }
          }
        );

        const spotPrices = response.data.Items?.filter((item: any) => item.meterName?.includes('Spot'));
        const onDemandPrices = response.data.Items?.filter((item: any) => !item.meterName?.includes('Spot'));

        if (spotPrices?.length > 0 && onDemandPrices?.length > 0) {
          const spotPrice = spotPrices[0].retailPrice;
          const onDemandPrice = onDemandPrices[0].retailPrice;
          const savings = ((onDemandPrice - spotPrice) / onDemandPrice) * 100;

          optimizations.push({
            instanceType: vmSize,
            spotPrice,
            onDemandPrice,
            savingsPercentage: savings,
            availability: 0.8, // Azure spot instances have good availability
            interruptionRate: 0.2
          });
        }
      }

      return optimizations;
    } catch (error) {
      this.logger.error('Failed to get spot instance prices', error);
      throw error;
    }
  }

  async createVMScaleSet(resourceGroup: string, config: ScalingPolicy): Promise<void> {
    try {
      await this.ensureAuthenticated();

      await this.makeAzureCall(
        `subscriptions/${this.subscriptionId}/resourceGroups/${resourceGroup}/providers/Microsoft.Compute/virtualMachineScaleSets/${config.serviceId}`,
        'PUT',
        {
          location: this.region,
          sku: {
            name: 'Standard_DS1_v2',
            tier: 'Standard',
            capacity: config.minInstances
          },
          properties: {
            upgradePolicy: {
              mode: 'Automatic'
            },
            virtualMachineProfile: {
              storageProfile: {
                imageReference: {
                  publisher: 'Canonical',
                  offer: 'UbuntuServer',
                  sku: '18.04-LTS',
                  version: 'latest'
                }
              },
              osProfile: {
                computerNamePrefix: config.serviceId,
                adminUsername: 'azureuser',
                adminPassword: 'P@ssw0rd123!' // In real implementation, use secure method
              },
              networkProfile: {
                networkInterfaceConfigurations: [{
                  name: `${config.serviceId}-nic`,
                  properties: {
                    primary: true,
                    ipConfigurations: [{
                      name: `${config.serviceId}-ipconfig`,
                      properties: {
                        subnet: {
                          id: `/subscriptions/${this.subscriptionId}/resourceGroups/${resourceGroup}/providers/Microsoft.Network/virtualNetworks/default/subnets/default`
                        }
                      }
                    }]
                  }
                }]
              }
            }
          }
        }
      );

      // Create autoscale settings
      await this.createAutoScaleSettings(resourceGroup, config);

      this.logger.info(`Created Azure VM scale set for ${config.serviceId}`);
    } catch (error) {
      this.logger.error(`Failed to create VM scale set for ${config.serviceId}`, error);
      throw error;
    }
  }

  private async createAutoScaleSettings(resourceGroup: string, config: ScalingPolicy): Promise<void> {
    await this.makeAzureCall(
      `subscriptions/${this.subscriptionId}/resourceGroups/${resourceGroup}/providers/microsoft.insights/autoscalesettings/${config.serviceId}-autoscale`,
      'PUT',
      {
        location: this.region,
        properties: {
          name: `${config.serviceId}-autoscale`,
          targetResourceUri: `/subscriptions/${this.subscriptionId}/resourceGroups/${resourceGroup}/providers/Microsoft.Compute/virtualMachineScaleSets/${config.serviceId}`,
          enabled: true,
          profiles: [{
            name: 'default',
            capacity: {
              minimum: config.minInstances.toString(),
              maximum: config.maxInstances.toString(),
              default: config.minInstances.toString()
            },
            rules: [{
              metricTrigger: {
                metricName: 'Percentage CPU',
                metricNamespace: 'Microsoft.Compute/virtualMachineScaleSets',
                operator: 'GreaterThan',
                statistic: 'Average',
                threshold: (config.targetCPUUtilization || 70),
                timeAggregation: 'Average',
                timeGrain: 'PT1M',
                timeWindow: 'PT5M'
              },
              scaleAction: {
                direction: 'Increase',
                type: 'ChangeCount',
                value: '1',
                cooldown: `${config.cooldownPeriod}M`
              }
            }]
          }]
        }
      }
    );
  }

  private async ensureAuthenticated(): Promise<void> {
    if (!this.accessToken) {
      await this.authenticate();
    }
  }

  private async makeAzureCall(endpoint: string, method: string = 'GET', data?: any, params?: any): Promise<any> {
    const url = `${this.baseUrl}/${endpoint}`;
    const config: any = {
      method,
      url,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      }
    };

    if (data) config.data = data;
    if (params) config.params = params;

    const response = await axios(config);
    return response.data;
  }

  private getContinentFromLocation(location: string): string {
    const continentMap: Record<string, string> = {
      'eastus': 'North America',
      'westus': 'North America',
      'centralus': 'North America',
      'westeurope': 'Europe',
      'northeurope': 'Europe',
      'eastasia': 'Asia',
      'southeastasia': 'Asia'
    };
    return continentMap[location] || 'Unknown';
  }
}