export const mockGoogleAdsCampaigns = [
  {
    campaign: {
      id: "123",
      name: "Brand - Search",
      status: "ENABLED",
    },
  },
];

export const mockGoogleAdsBudget = {
  resourceName: "customers/999/campaignBudgets/555",
};

export const mockGoogleAdsMetrics = {
  impressions: 15234,
  clicks: 654,
  conversions: 42,
  costMicros: 125000000,
};

export function listMockCampaigns() {
  return [...mockGoogleAdsCampaigns];
}

export function createMockBudget() {
  return { ...mockGoogleAdsBudget };
}

export function getMockMetrics() {
  return { ...mockGoogleAdsMetrics };
}

