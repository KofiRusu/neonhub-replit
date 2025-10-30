export const mockTikTokCampaign = {
  campaignId: "cmp_1234567890",
  objectiveType: "TRAFFIC",
  budget: 500,
};

export const mockTikTokAdGroup = {
  adGroupId: "adgrp_9876543210",
  placementType: "PLACEMENT_AUTOMATIC",
  optimizationGoal: "OPTIMIZATION_GOAL_CONVERSIONS",
};

export const mockTikTokReport = [
  {
    campaign_name: "Launch Awareness",
    spend: 125.5,
    impressions: 12450,
    clicks: 342,
    conversion: 24,
  },
];

export function createMockCampaign() {
  return { ...mockTikTokCampaign };
}

export function createMockAdGroup() {
  return { ...mockTikTokAdGroup };
}

export function getMockReport() {
  return [...mockTikTokReport];
}

