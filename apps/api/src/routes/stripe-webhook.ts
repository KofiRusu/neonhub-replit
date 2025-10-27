import { Router, type Request, type Response } from "express";
import bodyParser from "body-parser";
import { logger } from "../lib/logger.js";

export const stripeWebhookRouter = Router();

stripeWebhookRouter.post(
  "/",
  bodyParser.raw({ type: "application/json" }),
  async (req: Request, res: Response) => {
    logger.info({ hasSignature: Boolean(req.headers["stripe-signature"]) }, "Stripe webhook stub invoked");
    res.json({ received: true, stubbed: true });
  }
);

export default stripeWebhookRouter;
