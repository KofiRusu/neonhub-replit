import { EventEmitter } from 'events';
import { FederationMessage, ConnectionConfig } from '../types';
import { Logger } from '../utils/Logger';
export declare class GRPCClient extends EventEmitter {
    private client;
    private config;
    private logger;
    private nodeId;
    constructor(nodeId: string, config: ConnectionConfig, logger: Logger);
    connect(): Promise<void>;
    private createClientCredentials;
    private createProtoFile;
    sendMessage(message: FederationMessage): Promise<boolean>;
    getNodeInfo(nodeId: string): Promise<any>;
    healthCheck(): Promise<any>;
    disconnect(): Promise<void>;
}
//# sourceMappingURL=GRPCClient.d.ts.map