/**
 * tRPC Initialization
 * Sets up tRPC with middleware, procedures, and error handling
 */

import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { AuthUser, Context } from "./context.js";

/**
 * Initialize tRPC with context and transformer
 */
const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof Error && error.cause.name === 'ZodError'
            ? error.cause
            : null,
      },
    };
  },
});

/**
 * Export reusable router and procedure builders
 */
export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

/**
 * Protected procedure - requires authentication
 */
const requireUser = t.middleware(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You must be logged in to access this resource',
    });
  }
  
  return next({
    ctx: {
      ...ctx,
      user: ctx.user as AuthUser,
    },
  });
});

/**
 * Protected procedure builder that ensures the requester is authenticated.
 * Using `publicProcedure.use` keeps the exported type stable for consumers and tests.
 */
type ProcedureBuilder = typeof publicProcedure;

export const protectedProcedure: ProcedureBuilder = publicProcedure.use(requireUser);

/**
 * Middleware for request logging and timing
 */
export const loggerMiddleware = t.middleware(async ({ path, type, next }) => {
  const start = Date.now();
  const result = await next();
  const durationMs = Date.now() - start;
  
  console.log(`[tRPC] ${type} ${path} - ${durationMs}ms`);
  
  return result;
}) as any;

/**
 * Procedure with logging
 */
export const loggedProcedure = t.procedure.use(loggerMiddleware) as any;
