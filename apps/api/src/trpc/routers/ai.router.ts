import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc.js";
import { runPipeline } from "../../ai/workflows/pipeline";
import { executeTask, executePreview } from "../../ai/core/orchestrator";
import type { TaskSpec } from "../../ai/core/reason";
// @ts-ignore prisma may be unavailable during air-gap
import { prisma } from "../../db/prisma.js";

const TaskSpecZ = z.object({
  objective: z.string().min(3),
  audience: z.string().optional(),
  channel: z.enum(["blog", "email", "social"]).optional(),
  tone: z.string().optional(),
});

export const aiRouter = createTRPCRouter({
  runPreview: publicProcedure.input(TaskSpecZ).query(async ({ input }) => {
    const result = await executePreview(input as TaskSpec);
    return { ok: true, ...result };
  }),

  runTask: publicProcedure
    .input(
      TaskSpecZ.extend({
        agentName: z.string().default("ContentAgent"),
        orgId: z.string().default("org_DEV"),
      }),
    )
    .mutation(async ({ input }) => {
      if (!prisma || !prisma.agentRun) {
        return { ok: false, error: "Database not available in this environment" };
      }
      const { orgId, agentName, ...task } = input;
      const res = await executeTask(prisma, orgId, agentName, task as TaskSpec);
      return { ok: true, ...res };
    }),
});
