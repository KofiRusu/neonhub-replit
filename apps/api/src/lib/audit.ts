import { prisma } from '../db/prisma.js';
import { logger } from './logger.js';

export interface AuditParams {
  userId?: string | null;
  ip?: string | null;
  action: string;
  resource?: string;
  metadata?: Record<string, any>;
}

/**
 * Create an audit log entry
 * Async operation - failures are logged but don't interrupt the request
 */
export async function audit(params: AuditParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId || undefined,
        ip: params.ip || undefined,
        action: params.action,
        resource: params.resource,
        metadata: params.metadata,
      },
    });
  } catch (error) {
    logger.error({ error, params }, 'Audit log failed');
  }
}

/**
 * Helper to extract client IP from Express request
 */
export function getClientIP(req: any): string {
  return (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() 
    || req.socket.remoteAddress 
    || 'unknown';
}