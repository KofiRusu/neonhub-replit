import Stripe from 'stripe';
import { prisma } from '../../db/prisma.js';
import { logger } from '../../lib/logger.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-09-30.clover',
  typescript: true,
});

// Plan configurations
export const PLANS = {
  free: {
    name: 'Free',
    priceId: process.env.STRIPE_PRICE_FREE || '',
    productId: process.env.STRIPE_PRODUCT_FREE || '',
    limits: {
      campaigns: 5,
      emails: 1000,
      socialPosts: 100,
      agentCalls: 100,
    },
  },
  pro: {
    name: 'Pro',
    priceId: process.env.STRIPE_PRICE_PRO || '',
    productId: process.env.STRIPE_PRODUCT_PRO || '',
    limits: {
      campaigns: 50,
      emails: 50000,
      socialPosts: 5000,
      agentCalls: 5000,
    },
  },
  enterprise: {
    name: 'Enterprise',
    priceId: process.env.STRIPE_PRICE_ENTERPRISE || '',
    productId: process.env.STRIPE_PRODUCT_ENTERPRISE || '',
    limits: {
      campaigns: 999999,
      emails: 999999,
      socialPosts: 999999,
      agentCalls: 999999,
    },
  },
} as const;

export class BillingService {
  // Create or get Stripe customer
  async getOrCreateCustomer(userId: string, email: string): Promise<string> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { stripeCustomerId: true },
    });

    if (user?.stripeCustomerId) {
      return user.stripeCustomerId;
    }

    const customer = await stripe.customers.create({
      email,
      metadata: { userId },
    });

    await prisma.user.update({
      where: { id: userId },
      data: { stripeCustomerId: customer.id },
    });

    logger.info({ customerId: customer.id, userId }, 'Stripe customer created');

    return customer.id;
  }

  // Create checkout session for subscription
  async createCheckoutSession(params: {
    userId: string;
    email: string;
    plan: keyof typeof PLANS;
    successUrl: string;
    cancelUrl: string;
  }): Promise<{ url: string }> {
    const customerId = await this.getOrCreateCustomer(params.userId, params.email);
    const planConfig = PLANS[params.plan];

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: planConfig.priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      metadata: {
        userId: params.userId,
        plan: params.plan,
      },
    });

    logger.info({ sessionId: session.id, plan: params.plan }, 'Checkout session created');

    return { url: session.url! };
  }

  // Create portal session for managing subscription
  async createPortalSession(userId: string, returnUrl: string): Promise<{ url: string }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { stripeCustomerId: true },
    });

    if (!user?.stripeCustomerId) {
      throw new Error('No Stripe customer found');
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: returnUrl,
    });

    logger.info({ sessionId: session.id, userId }, 'Portal session created');

    return { url: session.url };
  }

  // Check usage limits
  async checkLimit(
    userId: string,
    resourceType: 'campaign' | 'email' | 'social_post' | 'agent_call'
  ): Promise<{ allowed: boolean; limit: number; used: number }> {
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription) {
      // No subscription = free tier limits
      const limits = PLANS.free.limits;
      const limitMap = {
        campaign: limits.campaigns,
        email: limits.emails,
        social_post: limits.socialPosts,
        agent_call: limits.agentCalls,
      };
      return { allowed: false, limit: limitMap[resourceType], used: 0 };
    }

    const usedMap = {
      campaign: subscription.campaignsUsed,
      email: subscription.emailsSent,
      social_post: subscription.socialPosts,
      agent_call: subscription.agentCalls,
    };

    const limitMap = {
      campaign: subscription.campaignLimit,
      email: subscription.emailLimit,
      social_post: subscription.socialLimit,
      agent_call: subscription.agentCallLimit,
    };

    const used = usedMap[resourceType];
    const limit = limitMap[resourceType];

    return {
      allowed: used < limit,
      limit,
      used,
    };
  }

  // Track usage
  async trackUsage(params: {
    userId: string;
    resourceType: 'campaign' | 'email' | 'social_post' | 'agent_call';
    resourceId?: string;
    quantity?: number;
  }): Promise<void> {
    const subscription = await prisma.subscription.findUnique({
      where: { userId: params.userId },
    });

    if (!subscription) {
      logger.warn({ userId: params.userId }, 'Tracking usage for user without subscription');
      return;
    }

    // Create usage record
    await prisma.usageRecord.create({
      data: {
        subscriptionId: subscription.id,
        resourceType: params.resourceType,
        resourceId: params.resourceId,
        quantity: params.quantity || 1,
        timestamp: new Date(),
      },
    });

    // Update subscription counters
    const updateMap = {
      campaign: { campaignsUsed: { increment: params.quantity || 1 } },
      email: { emailsSent: { increment: params.quantity || 1 } },
      social_post: { socialPosts: { increment: params.quantity || 1 } },
      agent_call: { agentCalls: { increment: params.quantity || 1 } },
    };

    await prisma.subscription.update({
      where: { id: subscription.id },
      data: updateMap[params.resourceType],
    });

    logger.info(
      { userId: params.userId, resourceType: params.resourceType, quantity: params.quantity || 1 },
      'Usage tracked'
    );
  }

  // Get subscription details
  async getSubscription(userId: string) {
    return prisma.subscription.findUnique({
      where: { userId },
      include: {
        invoices: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });
  }

  // Cancel subscription
  async cancelSubscription(userId: string, cancelAtPeriodEnd: boolean = true): Promise<void> {
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription) {
      throw new Error('No subscription found');
    }

    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: cancelAtPeriodEnd,
    });

    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        cancelAtPeriodEnd,
        canceledAt: cancelAtPeriodEnd ? new Date() : null,
      },
    });

    logger.info({ userId, cancelAtPeriodEnd }, 'Subscription cancellation updated');
  }

  // Verify webhook signature
  constructWebhookEvent(payload: string | Buffer, signature: string): Stripe.Event {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET not configured');
    }

    return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  }
}

export const billingService = new BillingService();
export { stripe };

// Helper functions for backward compatibility with old billing.ts
export function isStripeLive(): boolean {
  return !!(
    process.env.STRIPE_SECRET_KEY &&
    process.env.STRIPE_WEBHOOK_SECRET &&
    process.env.STRIPE_SECRET_KEY.startsWith('sk_live_')
  );
}

export async function createCheckoutSession(params: {
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  userId: string;
  userEmail: string;
}): Promise<{ url: string }> {
  const customerId = await billingService.getOrCreateCustomer(params.userId, params.userEmail);

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [
      {
        price: params.priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: {
      userId: params.userId,
    },
  });

  return { url: session.url! };
}

export async function createPortalSession(params: {
  customerId: string;
  returnUrl: string;
}): Promise<{ url: string }> {
  const session = await stripe.billingPortal.sessions.create({
    customer: params.customerId,
    return_url: params.returnUrl,
  });

  return { url: session.url };
}
