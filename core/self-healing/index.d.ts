import { AgentIntelligenceBus } from '../aib';
import { FederationManager } from '../federation';
export interface DiagnosticResult {
    component: string;
    status: 'healthy' | 'degraded' | 'failed';
    error?: string;
    metrics: Record<string, any>;
    timestamp: Date;
}
export interface RepairAction {
    id: string;
    component: string;
    action: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    estimatedDuration: number;
    success: boolean;
    timestamp: Date;
    tenantId?: string;
}
export interface TenantConfig {
    id: string;
    name: string;
    resourceQuotas: {
        cpu: number;
        memory: number;
        storage: number;
        networkBandwidth: number;
    };
    isolationLevel: 'network' | 'resource' | 'data' | 'full';
    policies: TenantPolicy[];
    federationEnabled: boolean;
    crossTenantSharing: boolean;
}
export interface TenantPolicy {
    id: string;
    name: string;
    type: 'health-check' | 'repair' | 'monitoring' | 'alerting' | 'migration';
    rules: Record<string, any>;
    priority: 'low' | 'medium' | 'high' | 'critical';
    enabled: boolean;
}
export interface TenantIsolationContext {
    tenantId: string;
    networkNamespace?: string;
    resourceLimits: Record<string, number>;
    dataPartitions: string[];
    securityContext: {
        encryptionKey: string;
        accessPolicies: string[];
    };
}
export interface MultiTenantDiagnosticResult extends DiagnosticResult {
    tenantId: string;
    isolationContext: TenantIsolationContext;
    crossTenantImpact: boolean;
}
export interface TenantResourceUsage {
    tenantId: string;
    currentUsage: {
        cpu: number;
        memory: number;
        storage: number;
        network: number;
    };
    quotas: {
        cpu: number;
        memory: number;
        storage: number;
        networkBandwidth: number;
    };
    timestamp: Date;
}
export declare class SelfHealingManager {
    private aib;
    private federationManager?;
    private diagnostics;
    private repairHistory;
    private isMonitoring;
    private tenantConfigs;
    private tenantIsolationContexts;
    private tenantResourceUsage;
    private tenantCommunicationChannels;
    private tenantPolicies;
    constructor(aib: AgentIntelligenceBus, federationManager?: FederationManager);
    private setupMonitoring;
    startMonitoring(): Promise<void>;
    stopMonitoring(): Promise<void>;
    private performSystemHealthCheck;
    private checkComponentHealth;
    private checkDatabaseHealth;
    private checkAPIHealth;
    private checkAgentsHealth;
    private checkMessageQueueHealth;
    private attemptAutoRepair;
    private determineRepairAction;
    private executeRepairAction;
    private handleAgentError;
    private handleHealthCheck;
    private handleTenantHealthCheck;
    private handleTenantResourceUsage;
    private performTenantHealthChecks;
    private checkTenantHealth;
    private checkResourceQuotaCompliance;
    private createDefaultIsolationContext;
    private attemptTenantAutoRepair;
    private determineTenantRepairAction;
    private executeTenantRepairAction;
    getDiagnostics(): DiagnosticResult[];
    getRepairHistory(): RepairAction[];
    getSystemHealth(): 'healthy' | 'degraded' | 'critical';
    registerTenant(config: TenantConfig): void;
    unregisterTenant(tenantId: string): void;
    private createTenantIsolationContext;
    getTenantHealth(tenantId: string): MultiTenantDiagnosticResult | null;
    getTenantResourceUsage(tenantId: string): TenantResourceUsage | null;
    migrateTenant(tenantId: string, targetCluster: string): Promise<void>;
    failoverTenant(tenantId: string, targetCluster: string): Promise<void>;
    private executeTenantPolicy;
    createSecureTenantChannel(tenantId: string, peerTenantId: string): void;
    getTenantDiagnostics(): MultiTenantDiagnosticResult[];
    getAllTenantConfigs(): TenantConfig[];
    updateTenantResourceQuotas(tenantId: string, quotas: Partial<TenantConfig['resourceQuotas']>): void;
}
//# sourceMappingURL=index.d.ts.map