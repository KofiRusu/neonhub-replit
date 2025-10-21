import { createClient } from 'redis';
import { logger } from './logger.js';

const windowMs = 60_000; // 1 minute
const maxPerIp = 60;
const maxPerUser = 120;

let _client: ReturnType<typeof createClient> | null = null;

/**
 * Get or create Redis client for rate limiting
 */
let hasLoggedFallback = false;

async function getClient() {
  const nodeEnv = (process.env.NODE_ENV ?? 'development').toLowerCase();

  if (nodeEnv !== 'production') {
    if (!hasLoggedFallback) {
      logger.info(`Rate limiter using in-memory store (env: ${nodeEnv})`);
      hasLoggedFallback = true;
    }
    return null;
  }

  if (!_client) {
    const url = process.env.RATE_LIMIT_REDIS_URL;
    if (!url) {
      const errMsg = 'RATE_LIMIT_REDIS_URL must be configured in production';
      logger.error(errMsg);
      throw new Error(errMsg);
    }
    
    try {
      _client = createClient({ url });
      _client.on('error', (e) => logger.error('Redis error', e));
      await _client.connect();
    } catch (error) {
      logger.error('Failed to connect to Redis:', error);
      // In production, throw error; strict behavior preserved
      throw new Error('Redis connection failed in production');
    }
  }
  return _client;
}

export interface LimitResult {
  allowed: boolean;
  remaining: number;
  resetMs: number;
  scope?: 'ip' | 'user' | 'ok';
}

/**
 * Check rate limit for a specific key
 */
export async function checkLimit(key: string, limit = maxPerIp): Promise<LimitResult> {
  const client = await getClient();
  
  // Fallback to in-memory if Redis unavailable
  if (!client) {
    return inMemoryCheckLimit(key, limit);
  }

  const now = Date.now();
  const windowKey = `ratelimit:${key}:${Math.floor(now / windowMs)}`;
  
  const countResult = await client.incr(windowKey);
  const count = typeof countResult === 'string' ? parseInt(countResult, 10) : countResult;
  
  if (count === 1) {
    await client.pExpire(windowKey, windowMs);
  }
  
  const remaining = Math.max(0, limit - count);
  const resetMs = windowMs - (now % windowMs);
  
  return {
    allowed: count <= limit,
    remaining,
    resetMs,
  };
}

/**
 * Check rate limits for both IP and user
 */
export async function rateLimitFor(ip?: string, userId?: string): Promise<LimitResult> {
  const ipKey = `ip:${ip ?? 'unknown'}`;
  const userKey = userId ? `user:${userId}` : null;

  const ipRes = await checkLimit(ipKey, maxPerIp);
  if (!ipRes.allowed) {
    return { ...ipRes, scope: 'ip' };
  }

  if (userKey) {
    const uRes = await checkLimit(userKey, maxPerUser);
    if (!uRes.allowed) {
      return { ...uRes, scope: 'user' };
    }
  }

  return {
    allowed: true,
    remaining: Math.min(ipRes.remaining, maxPerUser),
    resetMs: ipRes.resetMs,
    scope: 'ok',
  };
}

// In-memory fallback (simple, non-distributed)
type MemoryWindow = { count: number; resetAt: number };
type RateLimiterGlobal = typeof globalThis & {
  __neonhub_rateLimiterStore?: Map<string, MemoryWindow>;
};

const MEMORY_STORE_KEY = '__neonhub_rateLimiterStore' as const;
const globalObject = globalThis as RateLimiterGlobal;

const inMemoryStore: Map<string, MemoryWindow> =
  globalObject[MEMORY_STORE_KEY] ?? new Map<string, MemoryWindow>();

if (!globalObject[MEMORY_STORE_KEY]) {
  globalObject[MEMORY_STORE_KEY] = inMemoryStore;
}

function inMemoryCheckLimit(key: string, limit: number): LimitResult {
  const now = Date.now();
  const windowStart = Math.floor(now / windowMs) * windowMs;
  const resetAt = windowStart + windowMs;
  
  const existing = inMemoryStore.get(key);
  if (!existing || existing.resetAt <= now) {
    inMemoryStore.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: limit - 1, resetMs: windowMs };
  }

  existing.count += 1;
  const remaining = Math.max(0, limit - existing.count);
  
  return {
    allowed: existing.count <= limit,
    remaining,
    resetMs: resetAt - now,
  };
}

export function resetInMemoryRateLimiter() {
  inMemoryStore.clear();
  hasLoggedFallback = false;
}
