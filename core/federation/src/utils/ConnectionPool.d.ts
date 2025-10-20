import { EventEmitter } from 'events';
import { ConnectionConfig, PoolConfig } from '../types';
import { Logger } from './Logger';
import { WebSocketClient } from '../websocket/WebSocketClient';
import { GRPCClient } from '../grpc/GRPCClient';
import { AuthManager } from '../auth/AuthManager';
interface PooledConnection {
    id: string;
    nodeId: string;
    wsClient?: WebSocketClient;
    grpcClient?: GRPCClient;
    lastUsed: number;
    created: number;
    active: boolean;
}
export declare class ConnectionPool extends EventEmitter {
    private config;
    private logger;
    private authManager;
    private connections;
    private availableConnections;
    private waitingQueue;
    constructor(config: PoolConfig, connectionConfig: ConnectionConfig, logger: Logger, authManager: AuthManager);
    getConnection(nodeId: string): Promise<PooledConnection>;
    private findAvailableConnection;
    private createConnection;
    private waitForConnection;
    releaseConnection(connectionId: string): void;
    removeConnection(connectionId: string): Promise<void>;
    cleanup(): Promise<void>;
    getStats(): {
        total: number;
        active: number;
        available: number;
        waiting: number;
    };
    shutdown(): Promise<void>;
}
export {};
//# sourceMappingURL=ConnectionPool.d.ts.map