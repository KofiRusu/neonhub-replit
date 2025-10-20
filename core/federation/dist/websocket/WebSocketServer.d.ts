import { EventEmitter } from 'events';
import { FederationMessage, ConnectionConfig, NodeInfo } from '../types';
import { Logger } from '../utils/Logger';
import { AuthManager } from '../auth/AuthManager';
export declare class WebSocketServer extends EventEmitter {
    private wss;
    private config;
    private logger;
    private authManager;
    private connections;
    private nodeRegistry;
    constructor(config: ConnectionConfig, logger: Logger, authManager: AuthManager);
    start(): Promise<void>;
    private createTLSServer;
    private handleConnection;
    private authenticateConnection;
    private handleMessage;
    private validateMessage;
    private handleDisconnection;
    sendToNode(nodeId: string, message: FederationMessage): boolean;
    broadcast(message: FederationMessage, excludeNodeId?: string): void;
    private sendError;
    getConnectedNodes(): NodeInfo[];
    stop(): Promise<void>;
}
//# sourceMappingURL=WebSocketServer.d.ts.map