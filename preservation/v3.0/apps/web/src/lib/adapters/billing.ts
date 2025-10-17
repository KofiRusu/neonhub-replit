/**
 * Billing Data Adapter
 * Connects to backend billing API (sandbox mode until Stripe integration)
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:3001"
const USE_SANDBOX = process.env.NEXT_PUBLIC_BILLING_SANDBOX !== "false" // Default to sandbox

export interface BillingPlan {
  name: string
  price: number
  interval: "month" | "year"
  features: string[]
  current: boolean
}

export interface UsageData {
  apiCalls: { used: number; total: number }
  storage: { used: number; total: number }
  teamSeats: { used: number; total: number }
  emailSends: { used: number; total: number }
}

export interface Invoice {
  id: string
  date: string
  amount: number
  status: "paid" | "pending" | "failed"
  pdfUrl: string
}

export interface BillingInfo {
  plan: BillingPlan
  usage: UsageData
  nextBillingDate: string
  autoRenewal: boolean
}

/**
 * Get current billing plan
 */
export async function getPlan(): Promise<BillingPlan> {
  if (USE_SANDBOX) {
    return mockPlan
  }

  try {
    const response = await fetch(`${API_URL}/billing/plan`, {
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      console.warn("Billing plan API not available, using sandbox data")
      return mockPlan
    }

    const result = await response.json()
    return result.data || result
  } catch (error) {
    console.warn("Billing plan API error, using sandbox data:", error)
    return mockPlan
  }
}

/**
 * Get usage statistics
 */
export async function getUsage(): Promise<UsageData> {
  if (USE_SANDBOX) {
    return mockUsage
  }

  try {
    const response = await fetch(`${API_URL}/billing/usage`, {
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      console.warn("Usage API not available, using sandbox data")
      return mockUsage
    }

    const result = await response.json()
    return result.data || result
  } catch (error) {
    console.warn("Usage API error, using sandbox data:", error)
    return mockUsage
  }
}

/**
 * Get invoice history
 */
export async function getInvoices(): Promise<Invoice[]> {
  if (USE_SANDBOX) {
    return mockInvoices
  }

  try {
    const response = await fetch(`${API_URL}/billing/invoices`, {
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      console.warn("Invoices API not available, using sandbox data")
      return mockInvoices
    }

    const result = await response.json()
    return result.data || result
  } catch (error) {
    console.warn("Invoices API error, using sandbox data:", error)
    return mockInvoices
  }
}

/**
 * Get complete billing information
 */
export async function getBillingInfo(): Promise<BillingInfo> {
  const [plan, usage] = await Promise.all([getPlan(), getUsage()])

  return {
    plan,
    usage,
    nextBillingDate: "2024-02-01",
    autoRenewal: true,
  }
}

/**
 * Check if we're in sandbox mode
 */
export function isSandboxMode(): boolean {
  return USE_SANDBOX
}

/**
 * Check if Stripe is live (from backend)
 */
export function isStripeLive(): boolean {
  return process.env.NEXT_PUBLIC_STRIPE_LIVE === "true"
}

/**
 * Create Stripe checkout session
 */
export async function createCheckoutSession(params: {
  priceId: string
  successUrl: string
  cancelUrl: string
}): Promise<{ url: string }> {
  const response = await fetch(`${API_URL}/billing/checkout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || "Failed to create checkout session")
  }

  const result = await response.json()
  return result.data || result
}

/**
 * Create billing portal session
 */
export async function createPortalSession(params: {
  returnUrl: string
}): Promise<{ url: string }> {
  const response = await fetch(`${API_URL}/billing/portal`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || "Failed to create portal session")
  }

  const result = await response.json()
  return result.data || result
}

// Mock/Sandbox data
const mockPlan: BillingPlan = {
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
}

const mockUsage: UsageData = {
  apiCalls: { used: 43291, total: 100000 },
  storage: { used: 18.5, total: 50 },
  teamSeats: { used: 6, total: 20 },
  emailSends: { used: 8420, total: 50000 },
}

const mockInvoices: Invoice[] = [
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
]

