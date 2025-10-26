import { z } from "zod";
import { Connector } from "../base/Connector.js";
import type { ConnectorAuthContext } from "../base/types.js";
import { retryManager } from "../execution/RetryManager.js";

const createCustomerSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  description: z.string().optional(),
});

const createCheckoutSchema = z.object({
  priceId: z.string().min(1),
  quantity: z.number().min(1).default(1),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
  customerEmail: z.string().email().optional(),
});

async function stripeFetch<T>(auth: ConnectorAuthContext, path: string, init: RequestInit = {}): Promise<T> {
  const secretKey = auth.apiSecret || auth.apiKey || auth.accessToken;
  if (!secretKey) {
    throw new Error("Stripe connector requires an API secret key");
  }

  const response = await fetch(`https://api.stripe.com/v1/${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
      ...(init.headers || {}),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Stripe API error ${response.status}: ${text}`);
  }

  return (await response.json()) as T;
}

function toFormData(payload: Record<string, string | number | undefined | null>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(payload)) {
    if (value === undefined || value === null) continue;
    params.set(key, String(value));
  }
  return params.toString();
}

export class StripeConnector extends Connector {
  constructor() {
    super({
      name: "stripe",
      displayName: "Stripe",
      description: "Create customers and checkout sessions in Stripe.",
      category: "finance",
      iconUrl: "https://stripe.com/img/v3/home/twitter.png",
      websiteUrl: "https://stripe.com",
      authType: "api_key",
      authConfig: {
        requiredFields: ["apiSecret"],
      },
    });
  }

  actions = [
    {
      id: "createCustomer",
      name: "Create Customer",
      description: "Create a customer in Stripe.",
      inputSchema: createCustomerSchema,
      execute: async ({ auth, input }) => {
        const payload = createCustomerSchema.parse(input);
        return retryManager.run(() =>
          stripeFetch(auth, "customers", {
            method: "POST",
            body: toFormData({
              email: payload.email,
              name: payload.name,
              description: payload.description,
            }),
          })
        );
      },
    },
    {
      id: "createCheckoutSession",
      name: "Create Checkout Session",
      description: "Create a Stripe Checkout session for a price.",
      inputSchema: createCheckoutSchema,
      execute: async ({ auth, input }) => {
        const payload = createCheckoutSchema.parse(input);
        return retryManager.run(() =>
          stripeFetch(auth, "checkout/sessions", {
            method: "POST",
            body: toFormData({
              mode: "subscription",
              success_url: payload.successUrl,
              cancel_url: payload.cancelUrl,
              "line_items[0][price]": payload.priceId,
              "line_items[0][quantity]": payload.quantity,
              customer_email: payload.customerEmail,
              allow_promotion_codes: "true",
            }),
          })
        );
      },
    },
  ];

  triggers = [];

  async testConnection(auth: ConnectorAuthContext): Promise<boolean> {
    try {
      await stripeFetch(auth, "balance", { method: "GET" });
      return true;
    } catch {
      return false;
    }
  }
}
