export const mockLinkedInShare = {
  postUrn: "urn:li:ugcPost:123456789",
  text: "Launching NeonHub's automation suite!",
};

export const mockLinkedInCampaign = {
  campaignUrn: "urn:li:sponsoredCampaign:987654321",
  name: "Demand Gen Q4",
};

export const mockLinkedInStats = [
  {
    organizationalEntity: "urn:li:organization:12345",
    totalShareStatistics: {
      shareCount: 12,
      clickCount: 340,
      impressionCount: 9850,
    },
  },
];

export function createMockShare() {
  return { ...mockLinkedInShare };
}

export function createMockCampaign() {
  return { ...mockLinkedInCampaign };
}

export function getMockShareStats() {
  return [...mockLinkedInStats];
}

