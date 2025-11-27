/**
 * Security Audit Logging Middleware
 * Logs authentication-critical actions for compliance and forensics
 */

import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../db/prisma.js';
import { logger } from '../lib/logger.js';

export enum AuditAction {
  // Authentication
  LOGIN = 'auth.login',
  LOGOUT = 'auth.logout',
  PASSWORD_CHANGE = 'auth.password_change',
  MFA_ENABLE = 'auth.mfa_enable',
  MFA_DISABLE = 'auth.mfa_disable',
  
  // OAuth
  OAUTH_CONNECT = 'oauth.connect',
  OAUTH_DISCONNECT = 'oauth.disconnect',
  OAUTH_REFRESH = 'oauth.refresh_token',
  
  // Sensitive Operations
  CONNECTOR_CREATE = 'connector.create',
  CONNECTOR_DELETE = 'connector.delete',
  CONNECTOR_AUTH = 'connector.authorize',
  
  // Billing
  BILLING_UPDATE = 'billing.update_plan',
  BILLING_CANCEL = 'billing.cancel',
  PAYMENT_METHOD_ADD = 'billing.payment_method_add',
  
  // Agent Orchestration
  AGENT_EXECUTE = 'agent.execute',
  AGENT_CONFIG_UPDATE = 'agent.config_update',
  
  // Administration
  USER_INVITE = 'admin.user_invite',
  USER_REMOVE = 'admin.user_remove',
  ROLE_CHANGE = 'admin.role_change',
  ORG_DELETE = 'admin.organization_delete',
}

interface AuditLogEntry {
  userId?: string;
  organizationId?: string;
  action: AuditAction;
  resource?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Log security-sensitive action
 */
export async function logSecurityAudit(entry: AuditLogEntry): Promise<void> {
  try {
    // Log to application logger
    logger.info(
      {
        audit: true,
        userId: entry.userId,
        organizationId: entry.organizationId,
        action: entry.action,
        resource: entry.resource,
        ip: entry.ipAddress,
      },
      `Security audit: ${entry.action}`
    );

    // Store in database (if audit table exists)
    // await prisma.securityAuditLog.create({
    //   data: {
    //     userId: entry.userId,
    //     organizationId: entry.organizationId,
    //     action: entry.action,
    //     resource: entry.resource,
    //     details: entry.details || {},
    //     ipAddress: entry.ipAddress,
    //     userAgent: entry.userAgent,
    //   },
    // });
  } catch (error) {
    // Never fail request due to audit logging error
    logger.error({ error, entry }, 'Failed to log security audit');
  }
}

/**
 * Middleware to auto-log sensitive actions
 */
export function auditSecurityAction(action: AuditAction, getResource?: (req: Request) => string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const userId = (req as any).user?.id;
    const organizationId = (req as any).user?.organizationId;
    const resource = getResource ? getResource(req) : req.path;

    // Log at start of request
    await logSecurityAudit({
      userId,
      organizationId,
      action,
      resource,
      details: {
        method: req.method,
        body: sanitizeBody(req.body),
        query: req.query,
      },
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.get('user-agent'),
    });

    // Continue to handler
    next();
  };
}

/**
 * Sanitize request body for audit logs (remove sensitive fields)
 */
function sanitizeBody(body: any): any {
  if (!body || typeof body !== 'object') {
    return body;
  }

  const sanitized = { ...body };
  const sensitiveFields = [
    'password',
    'token',
    'secret',
    'apiKey',
    'api_key',
    'accessToken',
    'refreshToken',
    'authorization',
  ];

  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  }

  return sanitized;
}

