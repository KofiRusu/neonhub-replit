/**
 * Stripe Service
 * Handles all Stripe-related operations
 */

import Stripe from "stripe";
import { logger } from "../../lib/logger.js";

// Initialize Stripe (only if key is present)
const stripeKey = process.env.STRIPE_SECRET_KEY;
const isStripeConfigured = !!stripeKey;

let stripe: Stripe | null = null;

if (isStripeConfigured) {
  stripe = new Stripe(stripeKey!, {
    apiVersion: "2025-09-30.clover",
    typescript: true,
  });
  logger.info("Stripe initialized in test mode");
} else {
  logger.warn("STRIPE_SECRET_KEY not found - billing will use sandbox mode");
}

/**
 * Check if Stripe is configured
 */
export function isStripeLive(): boolean {
  return isStripeConfigured;
}

/**
 * Get or create Stripe customer for a user
 */
export async function getOrCreateCustomer(userId: string, email: string): Promise<string> {
  if (!stripe) {
    throw new Error("Stripe not configured");
  }

  // TODO: Check if customer already exists in database
  // const existingCustomer = await prisma.user.findUnique({ where: { id: userId } });
  // if (existingCustomer?.stripeCustomerId) return existingCustomer.stripeCustomerId;

  // For now, create a new customer each time (in real app, cache this)
  const customer = await stripe.customers.create({
    email,
    metadata: {
      userId,
    },
  });

  logger.info({ customerId: customer.id, userId }, "Stripe customer created");

  // TODO: Save customer.id to database
  // await prisma.user.update({ where: { id: userId }, data: { stripeCustomerId: customer.id } });

  return customer.id;
}

/**
 * List invoices for a customer
 */
export async function listInvoices(customerId: string): Promise<Stripe.Invoice[]> {
  if (!stripe) {
    return [];
  }

  try {
    const invoices = await stripe.invoices.list({
      customer: customerId,
      limit: 10,
    });

    return invoices.data;
  } catch (error) {
    logger.error({ error, customerId }, "Failed to fetch Stripe invoices");
    return [];
  }
}

/**
 * Create a checkout session for subscription
 */
export async function createCheckoutSession(params: {
  priceId: string;
  customerId?: string;
  successUrl: string;
  cancelUrl: string;
  userId?: string;
  userEmail?: string;
}): Promise<Stripe.Checkout.Session> {
  if (!stripe) {
    throw new Error("Stripe not configured");
  }

  const { priceId, customerId, successUrl, cancelUrl, userId, userEmail } = params;

  let customer = customerId;

  // Create customer if not provided
  if (!customer && userId && userEmail) {
    customer = await getOrCreateCustomer(userId, userEmail);
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    customer: customer,
    metadata: {
      userId: userId || "",
    },
  });

  logger.info({ sessionId: session.id, priceId, userId }, "Checkout session created");

  return session;
}

/**
 * Create a billing portal session
 */
export async function createPortalSession(params: {
  customerId: string;
  returnUrl: string;
}): Promise<Stripe.BillingPortal.Session> {
  if (!stripe) {
    throw new Error("Stripe not configured");
  }

  const { customerId, returnUrl } = params;

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  logger.info({ sessionId: session.id, customerId }, "Billing portal session created");

  return session;
}

/**
 * Get current subscription for a customer
 */
export async function getSubscription(customerId: string): Promise<Stripe.Subscription | null> {
  if (!stripe) {
    return null;
  }

  try {
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    return subscriptions.data[0] || null;
  } catch (error) {
    logger.error({ error, customerId }, "Failed to fetch subscription");
    return null;
  }
}

/**
 * Verify webhook signature
 */
export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string,
): Stripe.Event {
  if (!stripe) {
    throw new Error("Stripe not configured");
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new Error("STRIPE_WEBHOOK_SECRET not configured");
  }

  return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
}

export { stripe };

