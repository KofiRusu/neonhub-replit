import { prisma } from '../db/prisma.js';
import { logger } from './logger.js';
import type { Prisma } from '@prisma/client';

export interface AuditParams {
  userId?: string | null;
  organizationId?: string | null;
  actorType?: string | null;
  resourceId?: string | null;
  resourceType?: string | null;
  requestHash?: string | null;
  ip?: string | null;
  action: string;
  metadata?: Record<string, any>;
}

/**
 * Create an audit log entry
 * Async operation - failures are logged but don't interrupt the request
 */
export async function audit(params: AuditParams): Promise<void> {
  try {
    const metadata = params.metadata && Object.keys(params.metadata).length > 0
      ? (params.metadata as Prisma.InputJsonValue)
      : undefined;

    await prisma.auditLog.create({
      data: {
        userId: params.userId || undefined,
        organizationId: params.organizationId || undefined,
        actorType: params.actorType || undefined,
        resourceId: params.resourceId || undefined,
        resourceType: params.resourceType || undefined,
        requestHash: params.requestHash || undefined,
        ip: params.ip || undefined,
        action: params.action,
        metadata,
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
