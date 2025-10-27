import { Router } from "express"
import { z } from "zod"
import { ok, fail } from "../lib/http"
import { getAuthenticatedUser } from "../lib/requestUser.js"
import { billingService, PLANS } from "../services/billing/stripe.js"
import { prisma } from "../db/prisma.js"
import { ValidationError } from "../lib/errors.js"

export const billingRouter = Router()

const checkoutSchema = z.object({
  plan: z.enum(["free", "pro", "enterprise"]),
  successUrl: z.string().url("Invalid success URL"),
  cancelUrl: z.string().url("Invalid cancel URL"),
})

const portalSchema = z.object({
  returnUrl: z.string().url("Invalid return URL"),
})

billingRouter.get("/billing/plan", async (req, res) => {
  try {
    const user = getAuthenticatedUser(req)
    const subscription = await prisma.subscription.findUnique({ where: { userId: user.id } })

    const planKey = (subscription?.plan as keyof typeof PLANS) ?? "free"
    const planConfig = PLANS[planKey]

    return res.json(ok({
      plan: planKey,
      displayName: planConfig.name,
      priceId: planConfig.priceId,
      productId: planConfig.productId,
      limits: planConfig.limits,
      status: subscription?.status ?? (planKey === "free" ? "active" : "inactive"),
      currentPeriod: subscription
        ? {
            start: subscription.currentPeriodStart.toISOString(),
            end: subscription.currentPeriodEnd.toISOString(),
          }
        : null,
      cancelAtPeriodEnd: subscription?.cancelAtPeriodEnd ?? false,
    }))
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch billing plan"
    return res.status(500).json(fail(message).body)
  }
})

billingRouter.get("/billing/usage", async (req, res) => {
  try {
    const user = getAuthenticatedUser(req)
    const subscription = await prisma.subscription.findUnique({ where: { userId: user.id } })

    if (!subscription) {
      const limits = PLANS.free.limits
      return res.json(
        ok({
          campaigns: { used: 0, total: limits.campaigns },
          emails: { used: 0, total: limits.emails },
          socialPosts: { used: 0, total: limits.socialPosts },
          agentCalls: { used: 0, total: limits.agentCalls },
        })
      )
    }

    return res.json(
      ok({
        campaigns: { used: subscription.campaignsUsed, total: subscription.campaignLimit },
        emails: { used: subscription.emailsSent, total: subscription.emailLimit },
        socialPosts: { used: subscription.socialPosts, total: subscription.socialLimit },
        agentCalls: { used: subscription.agentCalls, total: subscription.agentCallLimit },
      })
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch usage"
    return res.status(500).json(fail(message).body)
  }
})

billingRouter.get("/billing/invoices", async (req, res) => {
  try {
    const user = getAuthenticatedUser(req)
    const subscription = await prisma.subscription.findUnique({ where: { userId: user.id }, select: { id: true } })
    if (!subscription) {
      return res.json(ok([]))
    }

    const invoices = await prisma.invoice.findMany({
      where: { subscriptionId: subscription.id },
      orderBy: { createdAt: "desc" },
      take: 12,
    })

    return res.json(
      ok(
        invoices.map((invoice) => ({
          id: invoice.id,
          stripeInvoiceId: invoice.stripeInvoiceId,
          amount: invoice.amountDue / 100,
          currency: invoice.currency,
          status: invoice.status,
          invoiceUrl: invoice.hostedInvoiceUrl,
          invoicePdf: invoice.invoicePdf,
          createdAt: invoice.createdAt.toISOString(),
        }))
      )
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch invoices"
    return res.status(500).json(fail(message).body)
  }
})

billingRouter.post("/billing/checkout", async (req, res) => {
  try {
    const user = getAuthenticatedUser(req)
    const payload = checkoutSchema.parse(req.body)

    if (!user.email) {
      throw new ValidationError("User email is required for checkout")
    }

    const session = await billingService.createCheckoutSession({
      userId: user.id,
      email: user.email,
      plan: payload.plan,
      successUrl: payload.successUrl,
      cancelUrl: payload.cancelUrl,
    })

    return res.json(ok(session))
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json(fail(error.errors[0].message).body)
    }
    if (error instanceof ValidationError) {
      return res.status(error.statusCode).json(fail(error.message, error.statusCode).body)
    }
    const message = error instanceof Error ? error.message : "Failed to create checkout session"
    return res.status(500).json(fail(message).body)
  }
})

billingRouter.post("/billing/portal", async (req, res) => {
  try {
    const user = getAuthenticatedUser(req)
    const payload = portalSchema.parse(req.body)
    const session = await billingService.createPortalSession(user.id, payload.returnUrl)
    return res.json(ok(session))
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json(fail(error.errors[0].message).body)
    }
    const message = error instanceof Error ? error.message : "Failed to create billing portal session"
    return res.status(500).json(fail(message).body)
  }
})

export default billingRouter
