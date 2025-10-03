import { Router } from "express";
import { ok, fail } from "../lib/http";

export const billingRouter = Router();

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
    // TODO: Integrate with Stripe to get real subscription data
    // const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    
    return res.json(ok(mockPlan));
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
    // TODO: Integrate with Stripe to get real invoices
    // const invoices = await stripe.invoices.list({ customer: customerId });
    
    return res.json(ok(mockInvoices));
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Server error";
    return res.status(500).json(fail(message).body);
  }
});

export default billingRouter;

