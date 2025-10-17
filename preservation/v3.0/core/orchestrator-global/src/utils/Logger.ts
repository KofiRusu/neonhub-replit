import { Logger } from '../types';

export class ConsoleLogger implements Logger {
  private prefix: string;

  constructor(prefix: string = '[GlobalOrchestrator]') {
    this.prefix = prefix;
  }

  info(message: string, meta?: any): void {
    console.log(`${this.prefix} ${new Date().toISOString()} INFO: ${message}`, meta || '');
  }

  warn(message: string, meta?: any): void {
    console.warn(`${this.prefix} ${new Date().toISOString()} WARN: ${message}`, meta || '');
  }

  error(message: string, error?: Error, meta?: any): void {
    console.error(`${this.prefix} ${new Date().toISOString()} ERROR: ${message}`, error?.stack || error || '', meta || '');
  }

  debug(message: string, meta?: any): void {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`${this.prefix} ${new Date().toISOString()} DEBUG: ${message}`, meta || '');
    }
  }
}

export class RedisLogger implements Logger {
  private redis: any;
  private keyPrefix: string;

  constructor(redisClient: any, keyPrefix: string = 'orchestrator:logs') {
    this.redis = redisClient;
    this.keyPrefix = keyPrefix;
  }

  private async log(level: string, message: string, meta?: any): Promise<void> {
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
    } catch (error) {
      console.error('Failed to write to Redis log:', error);
    }
  }

  async info(message: string, meta?: any): Promise<void> {
    await this.log('info', message, meta);
  }

  async warn(message: string, meta?: any): Promise<void> {
    await this.log('warn', message, meta);
  }

  async error(message: string, error?: Error, meta?: any): Promise<void> {
    await this.log('error', message, { ...meta, error: error?.message, stack: error?.stack });
  }

  async debug(message: string, meta?: any): Promise<void> {
    if (process.env.NODE_ENV === 'development') {
      await this.log('debug', message, meta);
    }
  }

  async getLogs(level: string, limit: number = 100): Promise<any[]> {
    try {
      const logs = await this.redis.lrange(`${this.keyPrefix}:${level}`, 0, limit - 1);
      return logs.map((log: string) => JSON.parse(log));
    } catch (error) {
      console.error('Failed to retrieve logs from Redis:', error);
      return [];
    }
  }
}