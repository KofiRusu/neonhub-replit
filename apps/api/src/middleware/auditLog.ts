import { Response, NextFunction } from 'express';
import { type AuthRequest } from './auth.js';
import { audit, getClientIP } from '../lib/audit.js';

/**
 * Audit middleware factory
 * Creates middleware that logs actions after successful responses
 */
export function auditMiddleware(action: string) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    const ip = getClientIP(req);
    const userId = req.user?.id;

    // Log after request completes
    const originalJson = res.json.bind(res);
    res.json = function (body: any) {
      // Audit on success (2xx/3xx status codes)
      if (res.statusCode < 400) {
        audit({
          userId,
          ip,
          action,
          resource: req.params.id || req.params.provider || undefined,
          metadata: {
            method: req.method,
            path: req.path,
            status: res.statusCode,
          },
        }).catch(() => {}); // Fire and forget
      }
      return originalJson(body);
    };

    next();
  };
}