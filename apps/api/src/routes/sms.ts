import { Router } from "express";
import { z } from "zod";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";
import { smsAgent, type TwilioWebhook, type SmsSendArgs } from "../agents/SMSAgent.js";
import { ok, fail } from "../lib/http.js";

export const smsRouter: Router = Router();

const sendSchema = z.object({
  personId: z.string().min(1),
  objective: z.string().min(1),
  brandId: z.string().min(1),
});

smsRouter.post("/send", requireAuth, async (req: AuthRequest, res) => {
  try {
    const payload = sendSchema.parse(req.body ?? {});
    const args: SmsSendArgs = {
      personId: payload.personId,
      objective: payload.objective,
      brandId: payload.brandId,
      operatorId: req.user?.id,
    };
    await smsAgent.send(args);
    return res.status(202).json(ok({ status: "queued" }));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json(fail(error.errors[0]?.message ?? "Invalid request").body);
    }
    const message = error instanceof Error ? error.message : "Failed to send SMS";
    return res.status(message.includes("consent") ? 403 : 500).json(fail(message).body);
  }
});

smsRouter.post("/inbound", async (req, res) => {
  try {
    const inbound = req.body as TwilioWebhook;
    await smsAgent.parseReply(inbound);
    return res.json(ok({ received: true }));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to process inbound SMS";
    return res.status(500).json(fail(message).body);
  }
});

export default smsRouter;
