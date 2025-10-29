import type { BudgetAllocation, BudgetLedger, BudgetProfile } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { logger } from "../lib/logger.js";
import type { BudgetLedgerRequest, BudgetObjectivePlan } from "../types/agentic.js";
import { normalizeChannel, DEFAULT_CHANNEL } from "../types/agentic.js";

const DEFAULT_PROFILE_NAME = "LoopDrive Default";

async function getOrCreateBudgetProfile(organizationId: string): Promise<BudgetProfile> {
  return prisma.budgetProfile.upsert({
    where: {
      organizationId_name: {
        organizationId,
        name: DEFAULT_PROFILE_NAME,
      },
    },
    create: {
      organizationId,
      name: DEFAULT_PROFILE_NAME,
      currency: "usd",
    },
    update: {},
  });
}

function selectPrimaryChannel(objectives: BudgetObjectivePlan[]): string {
  if (!objectives.length) return DEFAULT_CHANNEL;
  const primary = objectives.reduce((winner, candidate) => (candidate.amount > winner.amount ? candidate : winner), objectives[0]);
  return normalizeChannel(primary.channel ?? DEFAULT_CHANNEL, DEFAULT_CHANNEL);
}

function serializeObjectives(objectives: BudgetObjectivePlan[]): Prisma.JsonArray {
  return objectives.map((objective) => {
    const entry: Record<string, unknown> = {
      objectiveId: objective.objectiveId,
      amount: objective.amount,
    };
    if (objective.channel) {
      entry.channel = normalizeChannel(objective.channel, DEFAULT_CHANNEL);
    }
    if (typeof objective.priority === "number") {
      entry.priority = objective.priority;
    }
    return entry;
  }) as Prisma.JsonArray;
}

export const BudgetService = {
  async plan(workspaceId: string, objectives: BudgetObjectivePlan[]): Promise<BudgetAllocation> {
    if (!objectives.length) {
      throw new Error("At least one objective is required to plan budget");
    }

    return prisma.$transaction(async (tx) => {
      const profile = await getOrCreateBudgetProfile(workspaceId);
      const totalAmount = objectives.reduce((sum, objective) => sum + Math.max(objective.amount, 0), 0);

      if (totalAmount <= 0) {
        throw new Error("Budget amount must be greater than zero");
      }

      const allocation = await tx.budgetAllocation.create({
        data: {
          organizationId: workspaceId,
          budgetProfileId: profile.id,
          channel: selectPrimaryChannel(objectives),
          amount: totalAmount,
          metadata: {
            objectives: serializeObjectives(objectives),
          } as Prisma.JsonObject,
        },
      });

      await tx.budgetProfile.update({
        where: { id: profile.id },
        data: {
          reserved: (profile.reserved ?? 0) + totalAmount,
        },
      });

      return allocation;
    });
  },

  async execute(allocationId: string): Promise<void> {
    const allocation = await prisma.budgetAllocation.findUnique({
      where: { id: allocationId },
      include: { budgetProfile: true },
    });

    if (!allocation) {
      throw new Error(`Budget allocation not found for id ${allocationId}`);
    }

    if (allocation.status === "executing" || allocation.status === "completed") {
      logger.debug({ allocationId }, "Allocation already executing or completed");
      return;
    }

    await prisma.$transaction(async (tx) => {
      await tx.budgetAllocation.update({
        where: { id: allocation.id },
        data: { status: "executing" },
      });

      await tx.budgetProfile.update({
        where: { id: allocation.budgetProfileId },
        data: {
          reserved: Math.max((allocation.budgetProfile.reserved ?? 0) - allocation.amount, 0),
          spent: (allocation.budgetProfile.spent ?? 0) + allocation.amount,
        },
      });

      await tx.budgetLedger.create({
        data: {
          organizationId: allocation.organizationId,
          budgetProfileId: allocation.budgetProfileId,
          allocationId: allocation.id,
          entryType: "debit",
          amount: allocation.amount,
          currency: allocation.currency,
          metadata: {
            status: "executing",
            channel: allocation.channel,
          } as Prisma.JsonObject,
        },
      });
    });
  },

  async reconcile(allocationId: string): Promise<void> {
    const allocation = await prisma.budgetAllocation.findUnique({ where: { id: allocationId } });
    if (!allocation) {
      throw new Error(`Budget allocation not found for id ${allocationId}`);
    }

    if (allocation.status === "completed") {
      return;
    }

    await prisma.$transaction(async (tx) => {
      await tx.budgetAllocation.update({
        where: { id: allocation.id },
        data: { status: "completed" },
      });

      await tx.budgetLedger.create({
        data: {
          organizationId: allocation.organizationId,
          budgetProfileId: allocation.budgetProfileId,
          allocationId: allocation.id,
          entryType: "settlement",
          amount: allocation.amount,
          currency: allocation.currency,
          metadata: {
            status: "completed",
          } as Prisma.JsonObject,
        },
      });
    });
  },

  async getLedger(workspaceId: string, dateRange: BudgetLedgerRequest): Promise<BudgetLedger[]> {
    return prisma.budgetLedger.findMany({
      where: {
        organizationId: workspaceId,
        occurredAt: {
          gte: dateRange.start,
          lte: dateRange.end,
        },
      },
      orderBy: { occurredAt: "desc" },
    });
  },
};
