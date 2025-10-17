"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisLogger = exports.ConsoleLogger = void 0;
class ConsoleLogger {
    constructor(prefix = '[GlobalOrchestrator]') {
        this.prefix = prefix;
    }
    info(message, meta) {
        console.log(`${this.prefix} ${new Date().toISOString()} INFO: ${message}`, meta || '');
    }
    warn(message, meta) {
        console.warn(`${this.prefix} ${new Date().toISOString()} WARN: ${message}`, meta || '');
    }
    error(message, error, meta) {
        console.error(`${this.prefix} ${new Date().toISOString()} ERROR: ${message}`, error?.stack || error || '', meta || '');
    }
    debug(message, meta) {
        if (process.env.NODE_ENV === 'development') {
            console.debug(`${this.prefix} ${new Date().toISOString()} DEBUG: ${message}`, meta || '');
        }
    }
}
exports.ConsoleLogger = ConsoleLogger;
class RedisLogger {
    constructor(redisClient, keyPrefix = 'orchestrator:logs') {
        this.redis = redisClient;
        this.keyPrefix = keyPrefix;
    }
    async log(level, message, meta) {
        try {
            const logEntry = {
                timestamp: Date.now(),
                level,
                message,
                meta: meta || {}
            };
            await this.redis.lpush(`${this.keyPrefix}:${level}`, JSON.stringify(logEntry));
            await this.redis.ltrim(`${this.keyPrefix}:${level}`, 0, 999); // Keep last 1000 entries
            // Also log to console for immediate visibility
            console.log(`[${level.toUpperCase()}] ${message}`, meta || '');
        }
        catch (error) {
            console.error('Failed to write to Redis log:', error);
        }
    }
    async info(message, meta) {
        await this.log('info', message, meta);
    }
    async warn(message, meta) {
        await this.log('warn', message, meta);
    }
    async error(message, error, meta) {
        await this.log('error', message, { ...meta, error: error?.message, stack: error?.stack });
    }
    async debug(message, meta) {
        if (process.env.NODE_ENV === 'development') {
            await this.log('debug', message, meta);
        }
    }
    async getLogs(level, limit = 100) {
        try {
            const logs = await this.redis.lrange(`${this.keyPrefix}:${level}`, 0, limit - 1);
            return logs.map((log) => JSON.parse(log));
        }
        catch (error) {
            console.error('Failed to retrieve logs from Redis:', error);
            return [];
        }
    }
}
exports.RedisLogger = RedisLogger;
//# sourceMappingURL=Logger.js.map