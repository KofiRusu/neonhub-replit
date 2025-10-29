import { Router, type Request, type Response, raw } from "express";
import { logger } from "../lib/logger.js";

export const stripeWebhookRouter: Router = Router();

stripeWebhookRouter.post(
  "/",
  raw({ type: "application/json" }),
  async (req: Request, res: Response) => {
    logger.info({ hasSignature: Boolean(req.headers["stripe-signature"]) }, "Stripe webhook stub invoked");
    res.json({ received: true, stubbed: true });
  }
);

export default stripeWebhookRouter;
