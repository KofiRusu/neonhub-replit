import { ScalingDecision, PerformanceMetrics } from '../types';
export declare class KubernetesAutoscaler {
    private k8sConfig;
    private appsApi;
    private logger;
    private neonHubApiUrl;
    private prometheusUrl;
    constructor(neonHubApiUrl: string, prometheusUrl: string);
    getCurrentMetrics(): Promise<PerformanceMetrics>;
    getPrometheusMetrics(query: string): Promise<any>;
    scaleDeployment(namespace: string, deploymentName: string, decision: ScalingDecision): Promise<void>;
    getDeploymentStatus(namespace: string, deploymentName: string): Promise<any>;
    checkZeroDowntimeScaling(namespace: string, deploymentName: string): Promise<boolean>;
    getResourceUtilization(namespace: string, deploymentName: string): Promise<{
        cpu: number;
        memory: number;
        pods: number;
    }>;
    private getPodCount;
    private waitForRollout;
    createHorizontalPodAutoscaler(namespace: string, deploymentName: string, minReplicas: number, maxReplicas: number, targetCPUUtilizationPercentage: number): Promise<void>;
}
//# sourceMappingURL=KubernetesAutoscaler.d.ts.map