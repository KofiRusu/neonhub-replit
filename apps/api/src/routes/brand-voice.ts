import { Router } from "express";
import { z } from "zod";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";
import { BrandVoiceService } from "../services/brand-voice.service.js";
import { ok, fail } from "../lib/http.js";
import { normalizeChannel, DEFAULT_CHANNEL } from "../types/agentic.js";
import type { ComposeArgs } from "../types/agentic.js";

export const brandVoiceRouter: Router = Router();

const composeSchema = z.object({
  channel: z.enum(["email", "sms", "dm", "post"]),
  objective: z.string().min(1),
  personId: z.string().min(1),
  brandId: z.string().min(1),
  constraints: z.record(z.unknown()).optional(),
});

const guardrailSchema = z.object({
  text: z.string().min(1),
  channel: z.string().min(1),
  brandId: z.string().min(1),
});

brandVoiceRouter.post("/compose", requireAuth, async (req: AuthRequest, res) => {
  try {
    const payload = composeSchema.parse(req.body ?? {});
    const composeArgs: ComposeArgs = {
      channel: normalizeChannel(payload.channel, DEFAULT_CHANNEL),
      objective: payload.objective,
      personId: payload.personId,
      brandId: payload.brandId,
      constraints: payload.constraints,
    };
    const result = await BrandVoiceService.compose(composeArgs);
    return res.json(ok(result));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json(fail(error.errors[0]?.message ?? "Invalid request").body);
    }
    const message = error instanceof Error ? error.message : "Failed to compose brand voice";
    return res.status(500).json(fail(message).body);
  }
});

brandVoiceRouter.post("/guardrail", requireAuth, async (req: AuthRequest, res) => {
  try {
    const payload = guardrailSchema.parse(req.body ?? {});
    const result = await BrandVoiceService.guardrail(payload.text, payload.channel, payload.brandId);
    return res.json(ok(result));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json(fail(error.errors[0]?.message ?? "Invalid request").body);
    }
    const message = error instanceof Error ? error.message : "Failed to evaluate guardrail";
    return res.status(500).json(fail(message).body);
  }
});

brandVoiceRouter.get("/prompt/:useCase", requireAuth, async (req: AuthRequest, res) => {
  try {
    const paramsSchema = z.object({
      useCase: z.string().min(1),
    });
    const { useCase } = paramsSchema.parse(req.params);
    const brandIdSchema = z.object({ brandId: z.string().min(1) });
    const { brandId } = brandIdSchema.parse(req.query);
    const result = await BrandVoiceService.getPromptPack(useCase, brandId);
    return res.json(ok(result));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json(fail(error.errors[0]?.message ?? "Invalid request").body);
    }
    const message = error instanceof Error ? error.message : "Failed to load prompt pack";
    return res.status(message.includes("not found") ? 404 : 500).json(fail(message).body);
  }
});

export default brandVoiceRouter;
