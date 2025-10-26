import { URLSearchParams } from "url"
import { prisma } from "../../db/prisma.js"
import { logger } from "../../lib/logger.js"

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || ""

if (!STRIPE_SECRET_KEY) {
  logger.warn("STRIPE_SECRET_KEY is not configured – billing API will operate in sandbox mode")
}

async function stripeRequest<T>(path: string, params: Record<string, string>, method: "POST" | "GET" = "POST") {
  if (!STRIPE_SECRET_KEY) {
    throw new Error("Stripe secret key not configured")
  }

  const url = `https://api.stripe.com/v1/${path}`
  const body = new URLSearchParams(params)

  const response = await fetch(method === "GET" ? `${url}?${body.toString()}` : url, {
    method,
    headers: {
      Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: method === "GET" ? undefined : body.toString(),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Stripe API error ${response.status}: ${text}`)
  }

  return (await response.json()) as T
}

export const PLANS = {
  free: {
    name: "Free",
    priceId: process.env.STRIPE_PRICE_FREE || "",
    productId: process.env.STRIPE_PRODUCT_FREE || "",
    limits: {
      campaigns: 5,
      emails: 1000,
      socialPosts: 100,
      agentCalls: 100,
    },
  },
  pro: {
    name: "Pro",
    priceId: process.env.STRIPE_PRICE_PRO || "",
    productId: process.env.STRIPE_PRODUCT_PRO || "",
    limits: {
      campaigns: 50,
      emails: 50000,
      socialPosts: 5000,
      agentCalls: 5000,
    },
  },
  enterprise: {
    name: "Enterprise",
    priceId: process.env.STRIPE_PRICE_ENTERPRISE || "",
    productId: process.env.STRIPE_PRODUCT_ENTERPRISE || "",
    limits: {
      campaigns: 999999,
      emails: 999999,
      socialPosts: 999999,
      agentCalls: 999999,
    },
  },
} as const

export class BillingService {
  async getOrCreateCustomer(userId: string, email: string): Promise<string> {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { stripeCustomerId: true } })
    if (user?.stripeCustomerId) {
      return user.stripeCustomerId
    }

    const customer = await stripeRequest<{ id: string }>("customers", {
      email,
      "metadata[userId]": userId,
    })

    await prisma.user.update({ where: { id: userId }, data: { stripeCustomerId: customer.id } })
    logger.info({ customerId: customer.id, userId }, "Stripe customer created")
    return customer.id
  }

  async createCheckoutSession(params: {
    userId: string
    email: string
    plan: keyof typeof PLANS
    successUrl: string
    cancelUrl: string
  }): Promise<{ url: string }> {
    const customerId = await this.getOrCreateCustomer(params.userId, params.email)
    const planConfig = PLANS[params.plan]

    if (!planConfig.priceId) {
      throw new Error(`Price ID not configured for plan ${params.plan}`)
    }

    const session = await stripeRequest<{ url: string | null }>("checkout/sessions", {
      mode: "subscription",
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      customer: customerId,
      "line_items[0][price]": planConfig.priceId,
      "line_items[0][quantity]": "1",
      "metadata[userId]": params.userId,
      "metadata[plan]": params.plan,
    })

    if (!session.url) {
      throw new Error("Stripe checkout session did not include URL")
    }

    logger.info({ plan: params.plan, userId: params.userId }, "Stripe checkout session created")
    return { url: session.url }
  }

  async createPortalSession(userId: string, returnUrl: string): Promise<{ url: string }> {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { stripeCustomerId: true } })
    if (!user?.stripeCustomerId) {
      throw new Error("No Stripe customer found")
    }

    const session = await stripeRequest<{ url: string }>("billing_portal/sessions", {
      customer: user.stripeCustomerId,
      return_url: returnUrl,
    })

    return { url: session.url }
  }

  async checkLimit(
    userId: string,
    resourceType: "campaign" | "email" | "social_post" | "agent_call"
  ): Promise<{ allowed: boolean; limit: number; used: number }> {
    const subscription = await prisma.subscription.findUnique({ where: { userId } })
    if (!subscription) {
      const limits = PLANS.free.limits
      const limitMap = {
        campaign: limits.campaigns,
        email: limits.emails,
        social_post: limits.socialPosts,
        agent_call: limits.agentCalls,
      }
      return { allowed: false, limit: limitMap[resourceType], used: 0 }
    }

    const usedMap = {
      campaign: subscription.campaignsUsed,
      email: subscription.emailsSent,
      social_post: subscription.socialPosts,
      agent_call: subscription.agentCalls,
    }

    const limitMap = {
      campaign: subscription.campaignLimit,
      email: subscription.emailLimit,
      social_post: subscription.socialLimit,
      agent_call: subscription.agentCallLimit,
    }

    return {
      allowed: usedMap[resourceType] < limitMap[resourceType],
      limit: limitMap[resourceType],
      used: usedMap[resourceType],
    }
  }

  async trackUsage(params: {
    userId: string
    resourceType: "campaign" | "email" | "social_post" | "agent_call"
    resourceId?: string
    quantity?: number
  }): Promise<void> {
    const subscription = await prisma.subscription.findUnique({ where: { userId: params.userId } })
    if (!subscription) {
      logger.warn({ userId: params.userId }, "Tracking usage for user without subscription")
      return
    }

    await prisma.usageRecord.create({
      data: {
        subscriptionId: subscription.id,
        resourceType: params.resourceType,
        resourceId: params.resourceId,
        quantity: params.quantity ?? 1,
        timestamp: new Date(),
      },
    })

    const fieldMap = {
      campaign: "campaignsUsed",
      email: "emailsSent",
      social_post: "socialPosts",
      agent_call: "agentCalls",
    } as const

    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        [fieldMap[params.resourceType]]: {
          increment: params.quantity ?? 1,
        },
      },
    })
  }
}

export const billingService = new BillingService()
