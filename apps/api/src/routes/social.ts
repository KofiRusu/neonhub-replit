import { Router } from "express";
import { z } from "zod";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";
import { socialMessagingAgent, type SocialDMArgs } from "../agents/SocialMessagingAgent.js";
import { ok, fail } from "../lib/http.js";
import { prisma } from "../lib/prisma.js";
import { EventIntakeService } from "../services/event-intake.service.js";

export const socialRouter: Router = Router();

const platformSchema = z.enum(["instagram", "x", "reddit", "whatsapp"]);

const sendSchema = z.object({
  personId: z.string().min(1),
  objective: z.string().min(1),
  brandId: z.string().min(1),
});

const inboundSchema = z.object({
  handle: z.string().min(1),
  message: z.string().min(1),
  brandId: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

socialRouter.post("/:platform/dm", requireAuth, async (req: AuthRequest, res) => {
  try {
    const platform = platformSchema.parse(req.params.platform);
    const payload = sendSchema.parse(req.body ?? {});
    const args: SocialDMArgs = {
      personId: payload.personId,
      objective: payload.objective,
      brandId: payload.brandId,
      platform,
      operatorId: req.user?.id,
    };
    await socialMessagingAgent.sendDM(args);
    return res.status(202).json(ok({ status: "queued" }));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json(fail(error.errors[0]?.message ?? "Invalid request").body);
    }
    const message = error instanceof Error ? error.message : "Failed to send direct message";
    return res.status(message.includes("Consent") ? 403 : 500).json(fail(message).body);
  }
});

socialRouter.post("/:platform/inbound", async (req, res) => {
  try {
    const platform = platformSchema.parse(req.params.platform);
    const payload = inboundSchema.parse(req.body ?? {});

    const identity = await prisma.identity.findFirst({
      where: {
        type: "handle",
        value: payload.handle.toLowerCase(),
        channel: platform,
      },
      select: {
        personId: true,
        person: {
          select: { organizationId: true },
        },
      },
    });

    if (!identity?.personId || !identity.person) {
      return res.status(404).json(fail("Person not found for inbound handle").body);
    }

    await EventIntakeService.ingest({
      organizationId: identity.person.organizationId,
      personId: identity.personId,
      channel: "dm",
      type: "reply",
      payload: {
        platform,
        handle: payload.handle,
        message: payload.message,
      },
      metadata: payload.metadata ?? {},
      source: `${platform}-webhook`,
    });

    return res.json(ok({ received: true }));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json(fail(error.errors[0]?.message ?? "Invalid inbound payload").body);
    }
    const message = error instanceof Error ? error.message : "Failed to process inbound DM";
    return res.status(500).json(fail(message).body);
  }
});

export default socialRouter;
