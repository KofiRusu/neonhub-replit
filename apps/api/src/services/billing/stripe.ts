import { URLSearchParams } from "url"
import { prisma } from "../../db/prisma.js"
import { logger } from "../../lib/logger.js"

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || ""

const resolveEnv = (candidates: readonly string[]): string => {
  for (const key of candidates) {
    const value = process.env[key]
    if (value && value.length > 0) {
      return value
    }
  }
  return ""
}

if (!STRIPE_SECRET_KEY) {
  logger.warn("STRIPE_SECRET_KEY is not configured – billing API will operate in sandbox mode")
}

async function stripeRequest<T>(path: string, params: Record<string, string>, method: "POST" | "GET" = "POST") {
  if (!STRIPE_SECRET_KEY) {
    throw new Error("Stripe secret key not configured")
  }

  const url = `https://api.stripe.com/v1/${path}`
  const body = new URLSearchParams(params)

  let response: Response
  try {
    response = await fetch(method === "GET" ? `${url}?${body.toString()}` : url, {
      method,
      headers: {
        Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: method === "GET" ? undefined : body.toString(),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown fetch error"
    throw new Error(`Failed to reach Stripe API (${path}): ${message}`)
  }

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Stripe API error ${response.status}: ${text}`)
  }

  return (await response.json()) as T
}

const PLAN_PRICE_KEYS = {
  starter: ["STRIPE_PRICE_ID_STARTER", "STRIPE_PRICE_STARTER", "STRIPE_PRICE_FREE"],
  pro: ["STRIPE_PRICE_ID_PRO", "STRIPE_PRICE_PRO"],
  enterprise: ["STRIPE_PRICE_ID_ENTERPRISE", "STRIPE_PRICE_ENTERPRISE"],
} as const

const PLAN_PRODUCT_KEYS = {
  starter: ["STRIPE_PRODUCT_STARTER", "STRIPE_PRODUCT_FREE"],
  pro: ["STRIPE_PRODUCT_PRO"],
  enterprise: ["STRIPE_PRODUCT_ENTERPRISE"],
} as const

export const PLANS = {
  starter: {
    name: "Starter",
    priceId: resolveEnv(PLAN_PRICE_KEYS.starter),
    productId: resolveEnv(PLAN_PRODUCT_KEYS.starter),
    limits: {
      campaigns: 5,
      emails: 1000,
      socialPosts: 100,
      agentCalls: 100,
    },
  },
  pro: {
    name: "Pro",
    priceId: resolveEnv(PLAN_PRICE_KEYS.pro),
    productId: resolveEnv(PLAN_PRODUCT_KEYS.pro),
    limits: {
      campaigns: 50,
      emails: 50000,
      socialPosts: 5000,
      agentCalls: 5000,
    },
  },
  enterprise: {
    name: "Enterprise",
    priceId: resolveEnv(PLAN_PRICE_KEYS.enterprise),
    productId: resolveEnv(PLAN_PRODUCT_KEYS.enterprise),
    limits: {
      campaigns: 999999,
      emails: 999999,
      socialPosts: 999999,
      agentCalls: 999999,
    },
  },
} as const

const findPlanByPriceId = (priceId: string | undefined) => {
  if (!priceId) return undefined
  return (Object.entries(PLANS) as Array<[keyof typeof PLANS, (typeof PLANS)[keyof typeof PLANS]]>).find(
    ([, config]) => config.priceId === priceId,
  )?.[0]
}

const logMissingPlanConfig = () => {
  const missingPlans = Object.entries(PLANS)
    .filter(([, config]) => !config.priceId || !config.productId)
    .map(([key]) => key)
  if (missingPlans.length > 0) {
    logger.warn(
      { missingPlans },
      "Stripe plan configuration incomplete – checkout sessions will fail for these plans",
    )
  }
}

logMissingPlanConfig()

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
    plan?: keyof typeof PLANS
    priceId?: string
    successUrl: string
    cancelUrl: string
  }): Promise<{ url: string }> {
    const customerId = await this.getOrCreateCustomer(params.userId, params.email)
    const planKey = params.plan ?? findPlanByPriceId(params.priceId)
    const planConfig = planKey ? PLANS[planKey] : undefined
    const priceId = params.priceId ?? planConfig?.priceId

    if (!priceId) {
      throw new Error(`Price ID not configured for plan ${params.plan ?? "custom"}`)
    }

    const session = await stripeRequest<{ url: string | null }>("checkout/sessions", {
      mode: "subscription",
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      customer: customerId,
      "line_items[0][price]": priceId,
      "line_items[0][quantity]": "1",
      "metadata[userId]": params.userId,
      ...(planKey ? { "metadata[plan]": planKey } : {}),
    })

    if (!session.url) {
      throw new Error("Stripe checkout session did not include URL")
    }

    logger.info({ plan: planKey ?? "custom", priceId, userId: params.userId }, "Stripe checkout session created")
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
      const limits = PLANS.starter.limits
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
