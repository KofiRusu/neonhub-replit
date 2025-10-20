import { Response, NextFunction } from 'express';
import { type AuthRequest } from './auth.js';
import { rateLimitFor } from '../lib/rateLimiter.js';
import { logger } from '../lib/logger.js';

/**
 * Global rate limit middleware
 * Limits by IP (60/min) and authenticated user (120/min)
 */
export async function rateLimit(req: AuthRequest, res: Response, next: NextFunction) {
  // Feature flag to disable
  if (process.env.DISABLE_RATE_LIMIT === 'true') {
    return next();
  }

  try {
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() 
      || req.socket.remoteAddress;
    const userId = req.user?.id;

    const result = await rateLimitFor(ip, userId);

    if (!result.allowed) {
      logger.warn({ ip, userId, scope: result.scope }, 'Rate limit exceeded');
      return res.status(429).json({
        error: 'Too many requests',
        scope: result.scope,
        retryAfter: Math.ceil(result.resetMs / 1000),
      });
    }

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', result.scope === 'user' ? '120' : '60');
    res.setHeader('X-RateLimit-Remaining', String(result.remaining));
    res.setHeader('X-RateLimit-Reset', String(Date.now() + result.resetMs));

    next();
  } catch (error) {
    logger.error({ error }, 'Rate limit check failed');
    // Fail open - allow request
    next();
  }
}

/**
 * Stricter rate limit for auth endpoints (10 per minute per IP)
 */
export async function authRateLimit(req: AuthRequest, res: Response, next: NextFunction) {
  if (process.env.DISABLE_RATE_LIMIT === 'true') {
    return next();
  }

  try {
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() 
      || req.socket.remoteAddress;

    const result = await rateLimitFor(ip);
    const strictLimit = 10;

    if (result.remaining < (60 - strictLimit)) {
      return res.status(429).json({
        error: 'Too many login attempts',
        retryAfter: Math.ceil(result.resetMs / 1000),
      });
    }

    next();
  } catch (error) {
    logger.error({ error }, 'Auth rate limit failed');
    next();
  }
}