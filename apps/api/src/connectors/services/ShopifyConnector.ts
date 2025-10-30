import { z } from "zod";
import { Connector } from "../base/Connector.js";
import type { ConnectorAuthContext } from "../base/types.js";
import { retryManager } from "../execution/RetryManager.js";

const API_VERSION = "2023-10";

const credentialsSchema = z.object({
  shopDomain: z.string().min(1, "Shopify shop domain is required"),
  accessToken: z.string().min(1, "Admin API access token is required"),
});

const createProductInput = z.object({
  shopDomain: z.string().optional(),
  title: z.string().min(1, "Product title is required"),
  bodyHtml: z.string().optional(),
  vendor: z.string().optional(),
  productType: z.string().optional(),
  tags: z.array(z.string()).default([]),
  variants: z
    .array(
      z.object({
        price: z.string().optional(),
        sku: z.string().optional(),
        inventoryQuantity: z.number().int().optional(),
      }),
    )
    .default([]),
});

const createOrderInput = z.object({
  shopDomain: z.string().optional(),
  email: z.string().email(),
  lineItems: z
    .array(
      z.object({
        variantId: z.string().min(1),
        quantity: z.number().int().positive(),
      }),
    )
    .min(1),
  note: z.string().optional(),
});

const listOrdersInput = z.object({
  shopDomain: z.string().optional(),
  status: z.enum(["open", "closed", "cancelled", "any"]).default("any"),
  limit: z.number().int().min(1).max(250).default(20),
});

interface ShopifyCredentials {
  shopDomain: string;
  accessToken: string;
}

function resolveCredentials(auth: ConnectorAuthContext, overrideDomain?: string): ShopifyCredentials {
  const shopDomain = overrideDomain ?? (auth.metadata?.shopDomain as string | undefined);
  const accessToken = auth.accessToken ?? auth.apiKey;

  const parsed = credentialsSchema.parse({ shopDomain, accessToken });

  return {
    shopDomain: parsed.shopDomain,
    accessToken: parsed.accessToken,
  };
}

function buildUrl(creds: ShopifyCredentials, path: string, query?: URLSearchParams) {
  const url = new URL(`https://${creds.shopDomain}/admin/api/${API_VERSION}/${path}`);
  if (query) {
    url.search = query.toString();
  }
  return url.toString();
}

async function shopifyRequest<T>(
  creds: ShopifyCredentials,
  path: string,
  init: RequestInit = {},
  query?: URLSearchParams,
): Promise<T> {
  const response = await fetch(buildUrl(creds, path, query), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": creds.accessToken,
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    throw new Error(`Shopify API error ${response.status}`);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return (await response.json()) as T;
}

export class ShopifyConnector extends Connector {
  constructor() {
    super({
      name: "shopify",
      displayName: "Shopify",
      description: "Create products, manage orders, and fetch commerce data from Shopify.",
      category: "SHOPIFY",
      iconUrl: "https://cdn.shopify.com/shopifycloud/web/assets/v1/favicon.ico",
      websiteUrl: "https://www.shopify.com",
      authType: "api_key",
      authConfig: {
        instructions:
          "Provide the Admin API access token as API key. Set the shop domain in metadata.shopDomain or per request.",
      },
    });
  }

  actions = [
    {
      id: "createProduct",
      name: "Create Product",
      description: "Create a product with optional variants.",
      inputSchema: createProductInput,
      execute: async ({ auth, input }) => {
        const payload = createProductInput.parse(input);
        const creds = resolveCredentials(auth, payload.shopDomain);

        const result = await retryManager.run(() =>
          shopifyRequest<{ product: { id: number; handle: string } }>(
            creds,
            "products.json",
            {
              method: "POST",
              body: JSON.stringify({
                product: {
                  title: payload.title,
                  body_html: payload.bodyHtml,
                  vendor: payload.vendor,
                  product_type: payload.productType,
                  tags: payload.tags.join(","),
                  variants: payload.variants.map(variant => ({
                    price: variant.price,
                    sku: variant.sku,
                    inventory_quantity: variant.inventoryQuantity,
                  })),
                },
              }),
            },
          ),
        );

        return {
          productId: result.product.id,
          handle: result.product.handle,
        };
      },
    },
    {
      id: "createOrder",
      name: "Create Order",
      description: "Create an order for existing variants.",
      inputSchema: createOrderInput,
      execute: async ({ auth, input }) => {
        const payload = createOrderInput.parse(input);
        const creds = resolveCredentials(auth, payload.shopDomain);

        const result = await retryManager.run(() =>
          shopifyRequest<{ order: { id: number; name: string } }>(
            creds,
            "orders.json",
            {
              method: "POST",
              body: JSON.stringify({
                order: {
                  email: payload.email,
                  note: payload.note,
                  line_items: payload.lineItems.map(item => ({
                    variant_id: item.variantId,
                    quantity: item.quantity,
                  })),
                },
              }),
            },
          ),
        );

        return {
          orderId: result.order.id,
          name: result.order.name,
        };
      },
    },
    {
      id: "listOrders",
      name: "List Orders",
      description: "List recent orders with status filtering.",
      inputSchema: listOrdersInput,
      execute: async ({ auth, input }) => {
        const payload = listOrdersInput.parse(input);
        const creds = resolveCredentials(auth, payload.shopDomain);

        const params = new URLSearchParams();
        params.set("status", payload.status);
        params.set("limit", String(payload.limit));

        const result = await retryManager.run(() =>
          shopifyRequest<{ orders: Array<Record<string, unknown>> }>(
            creds,
            "orders.json",
            { method: "GET" },
            params,
          ),
        );

        return result.orders ?? [];
      },
    },
  ];

  triggers = [];

  async testConnection(auth: ConnectorAuthContext): Promise<boolean> {
    try {
      const creds = resolveCredentials(auth);
      await retryManager.run(() => shopifyRequest(creds, "shop.json", { method: "GET" }));
      return true;
    } catch {
      return false;
    }
  }
}
