import { Request, Response, NextFunction } from 'express';

/**
 * Parse CORS origins from environment variable
 */
const parseOrigins = (env: string | undefined): Set<string> => {
  if (!env) return new Set();
  return new Set(env.split(',').map(s => s.trim()).filter(Boolean));
};

const allowed = parseOrigins(process.env.CORS_ORIGIN);

/**
 * Strict CORS middleware
 * Only allows requests from pre-configured origins
 */
export function strictCORS(req: Request, res: Response, next: NextFunction) {
  const origin = req.headers.origin || '';

  if (allowed.has(origin)) {
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  }

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // Block unknown origins
  if (origin && !allowed.has(origin)) {
    return res.status(403).json({ error: 'CORS blocked' });
  }

  next();
}