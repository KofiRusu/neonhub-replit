export const mockShopifyProduct = {
  productId: 654321,
  handle: "neonhub-ai-platform",
  title: "NeonHub AI Platform Subscription",
};

export const mockShopifyOrder = {
  orderId: 777555,
  name: "#NH-1001",
  email: "customer@example.com",
};

export const mockShopifyOrders = [
  {
    id: 777555,
    name: "#NH-1001",
    total_price: "199.00",
    financial_status: "paid",
  },
];

export function createMockProduct() {
  return { ...mockShopifyProduct };
}

export function createMockOrder() {
  return { ...mockShopifyOrder };
}

export function listMockOrders() {
  return [...mockShopifyOrders];
}

