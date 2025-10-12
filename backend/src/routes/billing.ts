import { Router } from "express";
import { z } from "zod";
import { ok, fail } from "../lib/http";
import { ValidationError } from "../lib/errors";
import {
  isStripeLive,
  createCheckoutSession,
  createPortalSession,
} from "../services/billing/stripe.js";

export const billingRouter = Router();

// Validation schemas
const CheckoutSchema = z.object({
  priceId: z.string().min(1, "Price ID is required"),
  successUrl: z.string().url("Invalid success URL"),
  cancelUrl: z.string().url("Invalid cancel URL"),
});

const PortalSchema = z.object({
  returnUrl: z.string().url("Invalid return URL"),
});

// Mock billing data (until Stripe integration)
const mockPlan = {
  name: "Professional",
  price: 99,
  interval: "month",
  features: [
    "20 AI Agents",
    "100,000 API calls/mo",
    "50 GB Storage",
    "Advanced analytics",
    "Priority support",
    "20 team members",
    "Custom integrations",
    "White-label options",
  ],
  current: true,
};

const mockUsage = {
  apiCalls: { used: 43291, total: 100000 },
  storage: { used: 18.5, total: 50 },
  teamSeats: { used: 6, total: 20 },
  emailSends: { used: 8420, total: 50000 },
};

const mockInvoices = [
  {
    id: "INV-2024-001",
    date: "2024-01-01",
    amount: 99.0,
    status: "paid",
    pdfUrl: "#",
  },
  {
    id: "INV-2023-012",
    date: "2023-12-01",
    amount: 99.0,
    status: "paid",
    pdfUrl: "#",
  },
  {
    id: "INV-2023-011",
    date: "2023-11-01",
    amount: 99.0,
    status: "paid",
    pdfUrl: "#",
  },
  {
    id: "INV-2023-010",
    date: "2023-10-01",
    amount: 99.0,
    status: "paid",
    pdfUrl: "#",
  },
  {
    id: "INV-2023-009",
    date: "2023-09-01",
    amount: 99.0,
    status: "paid",
    pdfUrl: "#",
  },
];

// GET /billing/plan
billingRouter.get("/billing/plan", async (req, res) => {
  try {
    // Return plan with live flag
    const plan = {
      ...mockPlan,
      live: isStripeLive(),
    };
    
    // TODO: If Stripe configured, fetch real subscription
    // const customerId = req.user?.stripeCustomerId;
    // if (customerId && isStripeLive()) {
    //   const subscription = await getSubscription(customerId);
    //   if (subscription) {
    //     plan = transformSubscriptionToPlan(subscription);
    //   }
    // }
    
    return res.json(ok(plan));
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Server error";
    return res.status(500).json(fail(message).body);
  }
});

// GET /billing/usage
billingRouter.get("/billing/usage", async (req, res) => {
  try {
    // TODO: Calculate real usage from:
    // - API call counts from metrics
    // - Storage from file uploads
    // - Team seats from user table
    // - Email sends from email service
    
    return res.json(ok(mockUsage));
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Server error";
    return res.status(500).json(fail(message).body);
  }
});

// GET /billing/invoices
billingRouter.get("/billing/invoices", async (req, res) => {
  try {
    // If Stripe configured, fetch real invoices
    if (isStripeLive()) {
      // TODO: Get customer ID from authenticated user
      // const customerId = req.user?.stripeCustomerId;
      // if (customerId) {
      //   const stripeInvoices = await listInvoices(customerId);
      //   const invoices = stripeInvoices.map(inv => ({
      //     id: inv.id,
      //     date: new Date(inv.created * 1000).toISOString().split('T')[0],
      //     amount: inv.amount_paid / 100,
      //     status: inv.status,
      //     pdfUrl: inv.invoice_pdf || '#',
      //   }));
      //   return res.json(ok(invoices));
      // }
    }
    
    return res.json(ok(mockInvoices));
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Server error";
    return res.status(500).json(fail(message).body);
  }
});

// POST /billing/checkout - Create Stripe checkout session
billingRouter.post("/billing/checkout", async (req, res) => {
  try {
    if (!isStripeLive()) {
      throw new ValidationError("Stripe not configured - billing is in sandbox mode");
    }

    const result = CheckoutSchema.safeParse(req.body);
    if (!result.success) {
      throw new ValidationError(result.error.errors[0].message);
    }

    const { priceId, successUrl, cancelUrl } = result.data;

    // TODO: Get userId and email from authenticated user
    const userId = "demo-user"; // req.user?.id
    const userEmail = "demo@example.com"; // req.user?.email

    const session = await createCheckoutSession({
      priceId,
      successUrl,
      cancelUrl,
      userId,
      userEmail,
    });

    return res.json(ok({ url: session.url }));
  } catch (e: unknown) {
    if (e instanceof ValidationError) {
      return res.status(400).json(fail(e.message).body);
    }
    const message = e instanceof Error ? e.message : "Server error";
    return res.status(500).json(fail(message).body);
  }
});

// POST /billing/portal - Create billing portal session
billingRouter.post("/billing/portal", async (req, res) => {
  try {
    if (!isStripeLive()) {
      throw new ValidationError("Stripe not configured - billing is in sandbox mode");
    }

    const result = PortalSchema.safeParse(req.body);
    if (!result.success) {
      throw new ValidationError(result.error.errors[0].message);
    }

    const { returnUrl } = result.data;

    // TODO: Get customer ID from authenticated user
    const customerId = "cus_demo"; // req.user?.stripeCustomerId

    if (!customerId) {
      throw new ValidationError("No Stripe customer found for this user");
    }

    const session = await createPortalSession({
      customerId,
      returnUrl,
    });

    return res.json(ok({ url: session.url }));
  } catch (e: unknown) {
    if (e instanceof ValidationError) {
      return res.status(400).json(fail(e.message).body);
    }
    const message = e instanceof Error ? e.message : "Server error";
    return res.status(500).json(fail(message).body);
  }
});

export default billingRouter;

