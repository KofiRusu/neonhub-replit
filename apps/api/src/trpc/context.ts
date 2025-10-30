/**
 * tRPC Context
 * Defines the context available to all tRPC procedures
 */

import type { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { logger } from "../lib/logger.js";

const prisma = new PrismaClient();

export interface CreateContextOptions {
  req: Request;
  res: Response;
}

export type AuthUser = {
  id: string;
  organizationId?: string | null;
  [key: string]: unknown;
};

export type Context = {
  prisma: PrismaClient;
  req: Request;
  res: Response;
  user: AuthUser | null;
  logger: typeof logger;
};

/**
 * Creates context for tRPC procedures
 * This context is available to all procedures and includes:
 * - Prisma client for database access
 * - Express request/response objects
 * - User authentication info (if available)
 */
export async function createContext({ req, res }: CreateContextOptions): Promise<Context> {
  const user = ((req as unknown as { user?: AuthUser }).user ?? null) as AuthUser | null;

  return {
    prisma,
    req,
    res,
    user,
    logger,
  };
}
