import { describe, it, expect, beforeEach, afterAll, jest } from "@jest/globals";
import { ShopifyConnector } from "../services/ShopifyConnector.js";
import { retryManager } from "../execution/RetryManager.js";

const connector = new ShopifyConnector();
const fetchSpy = jest.spyOn(global, "fetch");
const retrySpy = jest.spyOn(retryManager, "run");

const auth = {
  apiKey: "shpat_test_token",
  metadata: {
    shopDomain: "demo-store.myshopify.com",
  },
};

beforeEach(() => {
  fetchSpy.mockReset();
  retrySpy.mockImplementation(async fn => fn());
});

afterAll(() => {
  fetchSpy.mockRestore();
  retrySpy.mockRestore();
});

function mockShopifyResponse(body: unknown, status = 200) {
  fetchSpy.mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    async json() {
      return body;
    },
  } as Response);
}

describe("ShopifyConnector", () => {
  it("creates products", async () => {
    const action = connector.actions.find(item => item.id === "createProduct");
    if (!action) throw new Error("createProduct action missing");

    mockShopifyResponse({
      product: { id: 1000, handle: "neonhub", title: "NeonHub License" },
    });

    const result = await action.execute({
      auth,
      input: {
        title: "NeonHub License",
        tags: ["automation", "ai"],
      },
    });

    expect(result).toEqual({ productId: 1000, handle: "neonhub" });
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe(
      "https://demo-store.myshopify.com/admin/api/2023-10/products.json",
    );
    expect(init?.method).toBe("POST");
  });

  it("creates orders with line items", async () => {
    const action = connector.actions.find(item => item.id === "createOrder");
    if (!action) throw new Error("createOrder action missing");

    mockShopifyResponse({
      order: { id: 500, name: "#1001" },
    });

    const result = await action.execute({
      auth,
      input: {
        email: "buyer@example.com",
        lineItems: [
          {
            variantId: "123",
            quantity: 2,
          },
        ],
      },
    });

    expect(result).toEqual({ orderId: 500, name: "#1001" });
    const body = JSON.parse((fetchSpy.mock.calls[0][1]?.body ?? "{}") as string);
    expect(body.order.line_items[0]).toMatchObject({ variant_id: "123", quantity: 2 });
  });

  it("lists orders with filters", async () => {
    const action = connector.actions.find(item => item.id === "listOrders");
    if (!action) throw new Error("listOrders action missing");

    mockShopifyResponse({
      orders: [{ id: 500, name: "#1001" }],
    });

    const result = await action.execute({
      auth,
      input: {
        status: "any",
        limit: 5,
      },
    });

    expect(result).toHaveLength(1);
    const [url] = fetchSpy.mock.calls[0];
    expect(url).toContain("orders.json?status=any&limit=5");
  });
});

