import { Router, Request, Response } from 'express';
import bodyParser from 'body-parser';
import { prisma } from '../db/prisma.js';
import { logger } from '../lib/logger.js';
import { billingService, PLANS } from '../services/billing/stripe.js';
import type Stripe from 'stripe';

export const stripeWebhookRouter = Router();

/**
 * Stripe webhook handler
 * Requires raw body for signature verification
 */
stripeWebhookRouter.post(
  '/',
  bodyParser.raw({ type: 'application/json' }),
  async (req: Request, res: Response) => {
    const signature = req.headers['stripe-signature'];

    if (!signature || typeof signature !== 'string') {
      logger.warn('Stripe webhook called without signature');
      return res.status(400).send('Missing signature');
    }

    try {
      // Verify webhook signature
      const event = billingService.constructWebhookEvent(req.body, signature);

      logger.info({ type: event.type, id: event.id }, 'Stripe webhook received');

      // Handle different event types
      switch (event.type) {
        case 'checkout.session.completed':
          await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
          break;

        case 'customer.subscription.updated':
          await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
          break;

        case 'customer.subscription.deleted':
          await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
          break;

        case 'invoice.paid':
          await handleInvoicePaid(event.data.object as Stripe.Invoice);
          break;

        case 'invoice.payment_failed':
          await handleInvoiceFailed(event.data.object as Stripe.Invoice);
          break;

        default:
          logger.debug({ type: event.type }, 'Unhandled webhook event');
      }

      // Return 200 to acknowledge receipt
      res.json({ received: true });
    } catch (error) {
      logger.error({ error }, 'Stripe webhook error');
      res.status(400).send(`Webhook Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
);

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const { userId, plan } = session.metadata!;
  const planConfig = PLANS[plan as keyof typeof PLANS];

  // Retrieve the subscription from Stripe
  const stripe = await import('stripe');
  const stripeInstance = new stripe.default(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2025-09-30.clover',
  });

  const subscription = await stripeInstance.subscriptions.retrieve(session.subscription as string);
  
  // Type assertion for Stripe API properties
  const subData = subscription as any;

  await prisma.subscription.create({
    data: {
      userId,
      stripeCustomerId: session.customer as string,
      stripeSubscriptionId: subscription.id,
      stripePriceId: planConfig.priceId,
      stripeProductId: planConfig.productId,
      plan,
      status: subscription.status,
      currentPeriodStart: new Date(subData.current_period_start * 1000),
      currentPeriodEnd: new Date(subData.current_period_end * 1000),
      campaignLimit: planConfig.limits.campaigns,
      emailLimit: planConfig.limits.emails,
      socialLimit: planConfig.limits.socialPosts,
      agentCallLimit: planConfig.limits.agentCalls,
    },
  });

  logger.info({ userId, plan }, 'Subscription created from checkout');
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const subData = subscription as any;
  
  await prisma.subscription.update({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      status: subscription.status,
      currentPeriodStart: new Date(subData.current_period_start * 1000),
      currentPeriodEnd: new Date(subData.current_period_end * 1000),
      cancelAtPeriodEnd: subData.cancel_at_period_end,
    },
  });

  logger.info({ subscriptionId: subscription.id, status: subscription.status }, 'Subscription updated');
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  await prisma.subscription.update({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      status: 'canceled',
      canceledAt: new Date(),
    },
  });

  logger.info({ subscriptionId: subscription.id }, 'Subscription deleted');
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const sub = await prisma.subscription.findUnique({
    where: { stripeCustomerId: invoice.customer as string },
  });

  if (!sub) {
    logger.warn({ customerId: invoice.customer }, 'Invoice paid but no subscription found');
    return;
  }

  const invoiceData = invoice as any;
  
  await prisma.invoice.upsert({
    where: { stripeInvoiceId: invoice.id },
    create: {
      subscriptionId: sub.id,
      stripeInvoiceId: invoice.id,
      stripePaymentIntentId: invoiceData.payment_intent as string | null,
      amountDue: invoiceData.amount_due,
      amountPaid: invoiceData.amount_paid,
      currency: invoice.currency,
      status: invoice.status!,
      invoicePdf: invoiceData.invoice_pdf || null,
      hostedInvoiceUrl: invoiceData.hosted_invoice_url || null,
      paidAt: invoiceData.status_transitions?.paid_at
        ? new Date(invoiceData.status_transitions.paid_at * 1000)
        : null,
    },
    update: {
      status: invoice.status!,
      amountPaid: invoiceData.amount_paid,
      paidAt: invoiceData.status_transitions?.paid_at
        ? new Date(invoiceData.status_transitions.paid_at * 1000)
        : null,
    },
  });

  logger.info({ invoiceId: invoice.id, subscriptionId: sub.id }, 'Invoice paid');
}

async function handleInvoiceFailed(invoice: Stripe.Invoice) {
  const sub = await prisma.subscription.findUnique({
    where: { stripeCustomerId: invoice.customer as string },
  });

  if (!sub) {
    logger.warn({ customerId: invoice.customer }, 'Invoice failed but no subscription found');
    return;
  }

  await prisma.subscription.update({
    where: { id: sub.id },
    data: { status: 'past_due' },
  });

  logger.warn(
    { invoiceId: invoice.id, customerId: invoice.customer, subscriptionId: sub.id },
    'Invoice payment failed'
  );

  // TODO: Send notification email to user about failed payment
}

export default stripeWebhookRouter;
