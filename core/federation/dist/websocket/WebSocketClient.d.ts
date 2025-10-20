import { EventEmitter } from 'events';
import { FederationMessage, ConnectionConfig } from '../types';
import { Logger } from '../utils/Logger';
import { AuthManager } from '../auth/AuthManager';
export declare class WebSocketClient extends EventEmitter {
    private ws;
    private config;
    private reconnectConfig;
    private logger;
    private authManager;
    private nodeId;
    private reconnectAttempts;
    private reconnectTimer;
    private isConnecting;
    private lastHeartbeat;
    private heartbeatTimer;
    constructor(nodeId: string, config: ConnectionConfig, logger: Logger, authManager: AuthManager);
    connect(): Promise<void>;
    private buildConnectionUrl;
    private getAuthHeaders;
    private handleMessage;
    private handleReconnection;
    private startHeartbeat;
    private stopHeartbeat;
    send(message: FederationMessage): boolean;
    disconnect(): Promise<void>;
    isConnected(): boolean;
    getReconnectAttempts(): number;
}
//# sourceMappingURL=WebSocketClient.d.ts.map