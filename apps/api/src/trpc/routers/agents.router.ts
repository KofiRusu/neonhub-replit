/**
 * Agents tRPC Router
 * Type-safe procedures for agent operations
 */

import { Prisma } from "@prisma/client";
import { z } from "zod";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "../trpc.js";

export const agentsRouter = createTRPCRouter({
  /**
   * List all agents
   */
  list: publicProcedure
    .input(
      z.object({
        organizationId: z.string().optional(),
        status: z.enum(['DRAFT', 'ACTIVE', 'PAUSED', 'DISABLED']).optional(),
        limit: z.number().min(1).max(100).default(10),
        offset: z.number().min(0).default(0),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const where = {
        ...(input?.organizationId && { organizationId: input.organizationId }),
        ...(input?.status && { status: input.status }),
      };

      const agents = await ctx.prisma.agent.findMany({
        where,
        take: input?.limit || 10,
        skip: input?.offset || 0,
        orderBy: { createdAt: 'desc' },
      });

      return agents;
    }),

  /**
   * Get agent by ID
   */
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const agent = await ctx.prisma.agent.findUnique({
        where: { id: input.id },
        include: {
          capabilities: true,
          configs: true,
        },
      });

      if (!agent) {
        throw new Error('Agent not found');
      }

      return agent;
    }),

  /**
   * Execute an agent
   */
  execute: protectedProcedure
    .input(
      z.object({
        agent: z.string(),
        input: z.record(z.unknown()),
        organizationId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Create agent job
      const job = await ctx.prisma.agentJob.create({
        data: {
          agent: input.agent,
          input: input.input as Prisma.JsonValue,
          status: 'queued',
          organizationId: input.organizationId,
          createdById: ctx.user.id,
        },
      });

      // TODO: Trigger actual agent execution asynchronously
      // For now, return the queued job
      return job;
    }),

  /**
   * Get agent job status
   */
  getJobStatus: protectedProcedure
    .input(z.object({ jobId: z.string() }))
    .query(async ({ ctx, input }) => {
      const job = await ctx.prisma.agentJob.findUnique({
        where: { id: input.jobId },
      });

      if (!job) {
        throw new Error('Job not found');
      }

      return job;
    }),

  /**
   * List agent jobs
   */
  listJobs: protectedProcedure
    .input(
      z.object({
        agent: z.string().optional(),
        status: z.string().optional(),
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const where = {
        createdById: ctx.user.id,
        ...(input?.agent && { agent: input.agent }),
        ...(input?.status && { status: input.status }),
      };

      const jobs = await ctx.prisma.agentJob.findMany({
        where,
        take: input?.limit || 20,
        skip: input?.offset || 0,
        orderBy: { createdAt: 'desc' },
      });

      return jobs;
    }),
});
