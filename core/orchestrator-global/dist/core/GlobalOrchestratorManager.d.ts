import { EventEmitter } from 'events';
import { GlobalOrchestratorConfig, GlobalMetrics, OrchestratorMessage, RoutingDecision, GlobalTopology } from '../types';
export declare class GlobalOrchestratorManager extends EventEmitter {
    private config;
    private logger;
    private discoveryService;
    private healthService;
    private routingService;
    private scalingService;
    private failoverService;
    private configManager;
    private globalTopology;
    private isRunning;
    private startTime;
    constructor(config: GlobalOrchestratorConfig);
    start(): Promise<void>;
    stop(): Promise<void>;
    routeMessage(message: OrchestratorMessage): Promise<RoutingDecision>;
    handleNodeFailure(nodeId: string, reason: string): Promise<void>;
    recoverNode(nodeId: string): Promise<void>;
    getGlobalTopology(): GlobalTopology;
    getGlobalMetrics(): GlobalMetrics;
    private setupEventHandlers;
    private updateTopology;
    updateConfiguration(updates: Partial<GlobalOrchestratorConfig>): Promise<void>;
    getConfiguration(): GlobalOrchestratorConfig;
    manualScaling(action: 'scale_up' | 'scale_down', targetNodes: string[], reason: string): Promise<void>;
    manualFailover(groupId: string, targetNodeId: string, reason: string): Promise<void>;
    registerFederationManager(federationId: string, endpoint: string, auth: any): Promise<void>;
    unregisterFederationManager(federationId: string): Promise<void>;
    getServiceHealth(): any;
    performHealthCheck(): Promise<boolean>;
}
//# sourceMappingURL=GlobalOrchestratorManager.d.ts.map