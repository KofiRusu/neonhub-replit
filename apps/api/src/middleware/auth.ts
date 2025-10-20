import { Request, Response, NextFunction } from 'express';
import { prisma } from '../db/prisma.js';

// Simple token-based auth (since NextAuth is in web app, not API)
// API uses Bearer tokens or session cookies forwarded from web

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    name?: string | null;
  };
}

export async function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    // Check Authorization header or session cookie
    const authHeader = req.headers.authorization;
    const sessionCookie = req.cookies?.['next-auth.session-token'] || req.cookies?.['__Secure-next-auth.session-token'];
    
    if (!authHeader && !sessionCookie) {
      return res.status(401).json({ error: 'Unauthorized - No credentials provided' });
    }
    
    // Option 1: Bearer token (for API keys)
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      // Verify token against database or JWT
      // For now, implement basic session lookup
      const session = await prisma.session.findFirst({
        where: { sessionToken: token },
        include: { user: true },
      });
      
      if (!session || session.expires < new Date()) {
        return res.status(401).json({ error: 'Invalid or expired token' });
      }
      
      req.user = {
        id: session.user.id,
        email: session.user.email!,
        name: session.user.name,
      };
    }
    
    // Option 2: Session cookie (forwarded from Next.js)
    else if (sessionCookie) {
      const session = await prisma.session.findUnique({
        where: { sessionToken: sessionCookie },
        include: { user: true },
      });
      
      if (!session || session.expires < new Date()) {
        return res.status(401).json({ error: 'Invalid or expired session' });
      }
      
      req.user = {
        id: session.user.id,
        email: session.user.email!,
        name: session.user.name,
      };
    }
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ error: 'Authentication failed' });
  }
}

// Optional middleware
export async function optionalAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    await requireAuth(req, res, () => {});
  } catch {
    // Ignore errors, just don't set req.user
  }
  next();
}