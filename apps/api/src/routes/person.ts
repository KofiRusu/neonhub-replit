import { Prisma } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";
import { PersonService } from "../services/person.service.js";
import { ok, fail } from "../lib/http.js";
import { IdentityDescriptorSchema } from "../types/agentic.js";
import { prisma } from "../lib/prisma.js";

export const personRouter: Router = Router();

const memoryQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(50).optional(),
  since: z.string().datetime().optional(),
  includeVectors: z.coerce.boolean().optional(),
  includeEvents: z.coerce.boolean().optional(),
});

const consentSchema = z.object({
  channel: z.string().min(1),
  status: z.enum(["granted", "revoked", "denied", "pending"]),
  source: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
  expiresAt: z.string().datetime().optional(),
});

personRouter.post("/resolve", requireAuth, async (req: AuthRequest, res) => {
  try {
    const payload = IdentityDescriptorSchema.parse(req.body ?? {});
    const personId = await PersonService.resolve(payload);
    return res.status(201).json(ok({ personId }));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json(fail(error.errors[0]?.message ?? "Invalid request").body);
    }
    const message = error instanceof Error ? error.message : "Failed to resolve person";
    return res.status(500).json(fail(message).body);
  }
});

personRouter.get("/:id/memory", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const query = memoryQuerySchema.parse(req.query);
    const memories = await PersonService.getMemory(id, {
      limit: query.limit,
      since: query.since ? new Date(query.since) : undefined,
      includeVectors: query.includeVectors,
      includeEvents: query.includeEvents,
    });
    return res.json(ok(memories));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json(fail(error.errors[0]?.message ?? "Invalid query").body);
    }
    const message = error instanceof Error ? error.message : "Failed to retrieve memory";
    return res.status(500).json(fail(message).body);
  }
});

personRouter.get("/:id/topics", requireAuth, async (req: AuthRequest, res) => {
  try {
    const topics = await prisma.topic.findMany({
      where: { personId: req.params.id },
      orderBy: { weight: "desc" },
      select: {
        id: true,
        name: true,
        weight: true,
        updatedAt: true,
      },
    });
    return res.json(ok(topics));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load topics";
    return res.status(500).json(fail(message).body);
  }
});

personRouter.post("/:id/consent", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { channel, status, source, metadata, expiresAt } = consentSchema.parse(req.body ?? {});
    const person = await prisma.person.findUnique({
      where: { id: req.params.id },
      select: { organizationId: true },
    });

    if (!person) {
      return res.status(404).json(fail("Person not found").body);
    }

    const consent = await prisma.consent.create({
      data: {
        personId: req.params.id,
        organizationId: person.organizationId,
        channel,
        status,
        source: source ?? "manual",
        metadata: (metadata ?? {}) as Prisma.JsonObject,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      },
    });
    return res.status(201).json(ok(consent));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json(fail(error.errors[0]?.message ?? "Invalid request").body);
    }
    const message = error instanceof Error ? error.message : "Failed to update consent";
    return res.status(500).json(fail(message).body);
  }
});

export default personRouter;
