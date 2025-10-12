import { Router, Request, Response } from "express";
import bodyParser from "body-parser";
import { constructWebhookEvent } from "../services/billing/stripe.js";
import { logger } from "../lib/logger.js";

export const stripeWebhookRouter = Router();

/**
 * Stripe webhook handler
 * Requires raw body for signature verification
 */
stripeWebhookRouter.post(
  "/billing/webhook",
  bodyParser.raw({ type: "application/json" }),
  async (req: Request, res: Response) => {
    const signature = req.headers["stripe-signature"];

    if (!signature || typeof signature !== "string") {
      logger.warn("Stripe webhook called without signature");
      return res.status(400).send("Missing signature");
    }

    try {
      // Verify webhook signature
      const event = constructWebhookEvent(req.body, signature);

      logger.info({ type: event.type, id: event.id }, "Stripe webhook received");

      // Handle different event types
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object;
          logger.info({ sessionId: session.id }, "Checkout completed");
          
          // TODO: Update user subscription in database
          // const userId = session.metadata?.userId;
          // if (userId) {
          //   await prisma.user.update({
          //     where: { id: userId },
          //     data: {
          //       stripeCustomerId: session.customer as string,
          //       subscriptionStatus: 'active',
          //     },
          //   });
          // }
          break;
        }

        case "customer.subscription.updated": {
          const subscription = event.data.object;
          logger.info({ subscriptionId: subscription.id }, "Subscription updated");
          
          // TODO: Update subscription status in database
          // const customerId = subscription.customer as string;
          // await prisma.user.update({
          //   where: { stripeCustomerId: customerId },
          //   data: {
          //     subscriptionStatus: subscription.status,
          //     subscriptionId: subscription.id,
          //   },
          // });
          break;
        }

        case "customer.subscription.deleted": {
          const subscription = event.data.object;
          logger.info({ subscriptionId: subscription.id }, "Subscription cancelled");
          
          // TODO: Mark subscription as cancelled
          // const customerId = subscription.customer as string;
          // await prisma.user.update({
          //   where: { stripeCustomerId: customerId },
          //   data: { subscriptionStatus: 'cancelled' },
          // });
          break;
        }

        case "invoice.paid": {
          const invoice = event.data.object;
          logger.info({ invoiceId: invoice.id }, "Invoice paid");
          
          // TODO: Record payment in database
          // Store invoice details for user history
          break;
        }

        case "invoice.payment_failed": {
          const invoice = event.data.object;
          logger.warn({ invoiceId: invoice.id }, "Invoice payment failed");
          
          // TODO: Notify user of failed payment
          // Send email alert
          break;
        }

        default:
          logger.debug({ type: event.type }, "Unhandled webhook event");
      }

      // Return 200 to acknowledge receipt
      res.json({ received: true });
    } catch (error) {
      logger.error({ error }, "Stripe webhook error");
      res.status(400).send(`Webhook Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  },
);

export default stripeWebhookRouter;

