import { Logger } from '../types';
export declare class ConsoleLogger implements Logger {
    private prefix;
    constructor(prefix?: string);
    info(message: string, meta?: any): void;
    warn(message: string, meta?: any): void;
    error(message: string, error?: Error, meta?: any): void;
    debug(message: string, meta?: any): void;
}
export declare class RedisLogger implements Logger {
    private redis;
    private keyPrefix;
    constructor(redisClient: any, keyPrefix?: string);
    private log;
    info(message: string, meta?: any): Promise<void>;
    warn(message: string, meta?: any): Promise<void>;
    error(message: string, error?: Error, meta?: any): Promise<void>;
    debug(message: string, meta?: any): Promise<void>;
    getLogs(level: string, limit?: number): Promise<any[]>;
}
//# sourceMappingURL=Logger.d.ts.map