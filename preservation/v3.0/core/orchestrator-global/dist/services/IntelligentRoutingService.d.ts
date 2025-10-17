import { EventEmitter } from 'events';
import { RoutingConfig, GlobalNodeInfo, RoutingDecision, OrchestratorMessage, Logger } from '../types';
export declare class IntelligentRoutingService extends EventEmitter {
    private config;
    private logger;
    private routingTable;
    private nodeLoadCache;
    private geographicRoutingTable;
    private adaptiveMetrics;
    constructor(config: RoutingConfig, logger: Logger);
    initialize(nodes: GlobalNodeInfo[]): Promise<void>;
    private buildRoutingTable;
    private buildGeographicRoutingTable;
    routeMessage(message: OrchestratorMessage): Promise<RoutingDecision>;
    private determineTargetFederation;
    private applyRoutingAlgorithm;
    private roundRobinRouting;
    private leastConnectionsRouting;
    private leastResponseTimeRouting;
    private geographicRouting;
    private adaptiveRouting;
    private weightedRoundRobinRouting;
    private calculateAdaptiveScore;
    private updateAdaptiveMetrics;
    updateNodeLoad(nodeId: string, load: number): void;
    addNode(node: GlobalNodeInfo): void;
    removeNode(nodeId: string): void;
    getRoutingTable(): Map<string, RoutingDecision[]>;
    getRoutingStats(): any;
}
//# sourceMappingURL=IntelligentRoutingService.d.ts.map