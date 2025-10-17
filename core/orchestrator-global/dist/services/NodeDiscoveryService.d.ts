import { EventEmitter } from 'events';
import { DiscoveryConfig, GlobalNodeInfo, Logger } from '../types';
export declare class NodeDiscoveryService extends EventEmitter {
    private config;
    private logger;
    private discoveredNodes;
    private discoveryTask?;
    private heartbeatTask?;
    private isRunning;
    constructor(config: DiscoveryConfig, logger: Logger);
    start(): Promise<void>;
    stop(): Promise<void>;
    private performDiscovery;
    private registerNode;
    private sendHeartbeats;
    private sendHeartbeatToNode;
    getDiscoveredNodes(): GlobalNodeInfo[];
    getNodesByFederation(federationId: string): GlobalNodeInfo[];
    getNodeById(nodeId: string): GlobalNodeInfo | undefined;
    manuallyRegisterNode(nodeInfo: GlobalNodeInfo): Promise<void>;
    unregisterNode(nodeId: string): Promise<void>;
    getDiscoveryStats(): any;
}
//# sourceMappingURL=NodeDiscoveryService.d.ts.map