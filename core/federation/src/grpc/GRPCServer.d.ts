import { EventEmitter } from 'events';
import { ConnectionConfig } from '../types';
import { Logger } from '../utils/Logger';
export declare class GRPCServer extends EventEmitter {
    private server;
    private config;
    private logger;
    private services;
    constructor(config: ConnectionConfig, logger: Logger);
    start(): Promise<void>;
    private loadServices;
    private createServerCredentials;
    private createProtoFile;
    private handleSendMessage;
    private handleGetNodeInfo;
    private handleHealthCheck;
    private handleStreamMessages;
    stop(): Promise<void>;
}
//# sourceMappingURL=GRPCServer.d.ts.map