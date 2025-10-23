import * as k8s from '@kubernetes/client-node';
import axios from 'axios';
import * as winston from 'winston';
export class KubernetesAutoscaler {
    constructor(neonHubApiUrl, prometheusUrl) {
        this.k8sConfig = new k8s.KubeConfig();
        this.k8sConfig.loadFromDefault();
        this.appsApi = this.k8sConfig.makeApiClient(k8s.AppsV1Api);
        this.neonHubApiUrl = neonHubApiUrl;
        this.prometheusUrl = prometheusUrl;
        this.logger = winston.createLogger({
            level: 'info',
            format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
            transports: [
                new winston.transports.Console(),
                new winston.transports.File({ filename: 'kubernetes-autoscaler.log' })
            ]
        });
    }
    async getCurrentMetrics() {
        try {
            // Fetch metrics from NeonHub API
            const response = await axios.get(`${this.neonHubApiUrl}/api/metrics/current`);
            return response.data;
        }
        catch (error) {
            this.logger.error('Failed to fetch current metrics from NeonHub API', error);
            throw error;
        }
    }
    async getPrometheusMetrics(query) {
        try {
            const response = await axios.get(`${this.prometheusUrl}/api/v1/query`, {
                params: { query }
            });
            return response.data;
        }
        catch (error) {
            this.logger.error('Failed to query Prometheus', error);
            throw error;
        }
    }
    async scaleDeployment(namespace, deploymentName, decision) {
        try {
            // Get current deployment
            const deployment = await this.appsApi.readNamespacedDeployment(deploymentName, namespace);
            if (!deployment.body.spec?.replicas) {
                throw new Error('Deployment replicas not found');
            }
            const currentReplicas = deployment.body.spec.replicas;
            const newReplicas = decision.targetReplicas;
            if (currentReplicas === newReplicas) {
                this.logger.info(`No scaling needed for ${deploymentName}, already at ${currentReplicas} replicas`);
                return;
            }
            // Update deployment replicas
            deployment.body.spec.replicas = newReplicas;
            await this.appsApi.replaceNamespacedDeployment(deploymentName, namespace, deployment.body);
            this.logger.info(`Scaled deployment ${deploymentName} from ${currentReplicas} to ${newReplicas} replicas. Reason: ${decision.reason}`);
            // Wait for rollout to complete
            await this.waitForRollout(namespace, deploymentName);
        }
        catch (error) {
            this.logger.error(`Failed to scale deployment ${deploymentName}`, error);
            throw error;
        }
    }
    async getDeploymentStatus(namespace, deploymentName) {
        try {
            const deployment = await this.appsApi.readNamespacedDeploymentStatus(deploymentName, namespace);
            return deployment.body;
        }
        catch (error) {
            this.logger.error(`Failed to get deployment status for ${deploymentName}`, error);
            throw error;
        }
    }
    async checkZeroDowntimeScaling(namespace, deploymentName) {
        try {
            const status = await this.getDeploymentStatus(namespace, deploymentName);
            const availableReplicas = status.status?.availableReplicas || 0;
            const desiredReplicas = status.status?.replicas || 0;
            const readyReplicas = status.status?.readyReplicas || 0;
            // Check if all desired replicas are available and ready
            const isZeroDowntime = availableReplicas === desiredReplicas && readyReplicas === desiredReplicas;
            if (!isZeroDowntime) {
                this.logger.warn(`Zero-downtime scaling check failed for ${deploymentName}: available=${availableReplicas}, desired=${desiredReplicas}, ready=${readyReplicas}`);
            }
            return isZeroDowntime;
        }
        catch (error) {
            this.logger.error(`Failed to check zero-downtime scaling for ${deploymentName}`, error);
            return false;
        }
    }
    async getResourceUtilization(namespace, deploymentName) {
        try {
            // Query Prometheus for resource utilization
            const cpuQuery = `sum(rate(container_cpu_usage_seconds_total{namespace="${namespace}",pod=~"${deploymentName}-.*"}[5m]))`;
            const memoryQuery = `sum(container_memory_usage_bytes{namespace="${namespace}",pod=~"${deploymentName}-.*"})`;
            const [cpuResult, memoryResult] = await Promise.all([
                this.getPrometheusMetrics(cpuQuery),
                this.getPrometheusMetrics(memoryQuery)
            ]);
            const cpu = cpuResult.data?.result?.[0]?.value?.[1] || 0;
            const memory = memoryResult.data?.result?.[0]?.value?.[1] || 0;
            // Get pod count
            const pods = await this.getPodCount(namespace, deploymentName);
            return { cpu: parseFloat(cpu), memory: parseFloat(memory), pods };
        }
        catch (error) {
            this.logger.error(`Failed to get resource utilization for ${deploymentName}`, error);
            return { cpu: 0, memory: 0, pods: 0 };
        }
    }
    async getPodCount(namespace, deploymentName) {
        try {
            const k8sCore = this.k8sConfig.makeApiClient(k8s.CoreV1Api);
            const pods = await k8sCore.listNamespacedPod(namespace, undefined, undefined, undefined, `app=${deploymentName}`);
            return pods.body.items.filter((pod) => pod.status?.phase === 'Running' &&
                pod.status?.conditions?.some((cond) => cond.type === 'Ready' && cond.status === 'True')).length;
        }
        catch (error) {
            this.logger.error(`Failed to get pod count for ${deploymentName}`, error);
            return 0;
        }
    }
    async waitForRollout(namespace, deploymentName, timeoutMs = 300000) {
        const startTime = Date.now();
        while (Date.now() - startTime < timeoutMs) {
            const isReady = await this.checkZeroDowntimeScaling(namespace, deploymentName);
            if (isReady) {
                this.logger.info(`Rollout completed successfully for ${deploymentName}`);
                return;
            }
            // Wait 10 seconds before checking again
            await new Promise(resolve => setTimeout(resolve, 10000));
        }
        throw new Error(`Rollout timeout for deployment ${deploymentName}`);
    }
    async createHorizontalPodAutoscaler(namespace, deploymentName, minReplicas, maxReplicas, targetCPUUtilizationPercentage) {
        try {
            const autoscalingApi = this.k8sConfig.makeApiClient(k8s.AutoscalingV2Api);
            const hpa = {
                apiVersion: 'autoscaling/v2',
                kind: 'HorizontalPodAutoscaler',
                metadata: {
                    name: `${deploymentName}-hpa`,
                    namespace
                },
                spec: {
                    scaleTargetRef: {
                        apiVersion: 'apps/v1',
                        kind: 'Deployment',
                        name: deploymentName
                    },
                    minReplicas,
                    maxReplicas,
                    metrics: [{
                            type: 'Resource',
                            resource: {
                                name: 'cpu',
                                target: {
                                    type: 'Utilization',
                                    averageUtilization: targetCPUUtilizationPercentage
                                }
                            }
                        }]
                }
            };
            await autoscalingApi.createNamespacedHorizontalPodAutoscaler(namespace, hpa);
            this.logger.info(`Created HPA for deployment ${deploymentName}`);
        }
        catch (error) {
            this.logger.error(`Failed to create HPA for ${deploymentName}`, error);
            throw error;
        }
    }
}
//# sourceMappingURL=KubernetesAutoscaler.js.map