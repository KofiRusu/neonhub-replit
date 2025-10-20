export interface Logger {
    info(message: string, meta?: any): void;
    warn(message: string, meta?: any): void;
    error(message: string, error?: any): void;
    debug(message: string, meta?: any): void;
}
export declare class ConsoleLogger implements Logger {
    info(message: string, meta?: any): void;
    warn(message: string, meta?: any): void;
    error(message: string, error?: any): void;
    debug(message: string, meta?: any): void;
}
//# sourceMappingURL=Logger.d.ts.map