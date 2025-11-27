/**
 * RBAC (Role-Based Access Control) Middleware
 * Enforces role-based permissions on sensitive routes
 */

import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../db/prisma.js';
import { logger } from '../lib/logger.js';

export enum Role {
  OWNER = 'owner',
  ADMIN = 'admin',
  EDITOR = 'editor',
  VIEWER = 'viewer',
}

const ROLE_HIERARCHY: Record<Role, number> = {
  [Role.OWNER]: 4,
  [Role.ADMIN]: 3,
  [Role.EDITOR]: 2,
  [Role.VIEWER]: 1,
};

/**
 * Check if user has minimum required role
 */
function hasRole(userRole: Role, requiredRole: Role): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

/**
 * Get user's role in organization
 */
async function getUserRole(userId: string, organizationId: string): Promise<Role | null> {
  const membership = await prisma.organizationMembership.findFirst({
    where: {
      userId,
      organizationId,
      status: 'active',
    },
    select: {
      role: true,
    },
  });

  if (!membership) {
    return null;
  }

  // Map database role to Role enum
  const roleMap: Record<string, Role> = {
    owner: Role.OWNER,
    admin: Role.ADMIN,
    editor: Role.EDITOR,
    viewer: Role.VIEWER,
    member: Role.VIEWER, // Default members are viewers
  };

  return roleMap[String(membership.role).toLowerCase()] || Role.VIEWER;
}

/**
 * Require minimum role middleware factory
 */
export function requireRole(minimumRole: Role) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.id;
      const organizationId = (req as any).user?.organizationId;

      if (!userId) {
        logger.warn({ path: req.path }, 'RBAC check failed: no userId');
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (!organizationId) {
        logger.warn({ userId, path: req.path }, 'RBAC check failed: no organizationId');
        return res.status(403).json({ error: 'No organization context' });
      }

      const userRole = await getUserRole(userId, organizationId);

      if (!userRole) {
        logger.warn({ userId, organizationId, path: req.path }, 'RBAC check failed: not a member');
        return res.status(403).json({ error: 'Not a member of this organization' });
      }

      if (!hasRole(userRole, minimumRole)) {
        logger.warn(
          { userId, userRole, requiredRole: minimumRole, path: req.path },
          'RBAC check failed: insufficient permissions'
        );
        return res.status(403).json({ 
          error: 'Insufficient permissions',
          required: minimumRole,
          actual: userRole,
        });
      }

      // Store role in request for downstream use
      (req as any).user.role = userRole;

      logger.debug({ userId, role: userRole, path: req.path }, 'RBAC check passed');
      next();
    } catch (error) {
      logger.error({ error }, 'RBAC middleware error');
      res.status(500).json({ error: 'Authorization check failed' });
    }
  };
}

/**
 * Convenience middleware for common role requirements
 */
export const requireOwner = requireRole(Role.OWNER);
export const requireAdmin = requireRole(Role.ADMIN);
export const requireEditor = requireRole(Role.EDITOR);
export const requireViewer = requireRole(Role.VIEWER); // Alias for requireAuth essentially
