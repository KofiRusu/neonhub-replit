import { Response, NextFunction } from 'express';
import { type AuthRequest } from './auth.js';
import { logger } from '../lib/logger.js';

/**
 * Parse admin IP allowlist from environment variable
 */
const allowed = new Set(
  (process.env.ADMIN_IP_ALLOWLIST || '').split(',').map(s => s.trim()).filter(Boolean)
);

/**
 * Admin IP allowlist middleware
 * Only allows admin operations from pre-configured IP addresses
 */
export function adminIPGuard(req: AuthRequest, res: Response, next: NextFunction) {
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() 
    || req.socket.remoteAddress 
    || '';

  if (!allowed.size) {
    logger.warn('ADMIN_IP_ALLOWLIST not configured - allowing all IPs');
    return next();
  }

  if (allowed.has(ip)) {
    return next();
  }

  logger.warn({ ip, allowed: Array.from(allowed) }, 'Admin access blocked');
  return res.status(403).json({ error: 'Admin IP not allowed' });
}