export const mockFacebookPost = {
  postId: "1234567890_13579",
  message: "Launch day!",
  link: "https://neonhub.ai/blog/launch",
};

export const mockFacebookAd = {
  adId: "2385000000001",
  name: "Q4 Retargeting",
  status: "PAUSED",
};

export const mockFacebookInsights = {
  page_impressions: 12045,
  page_engaged_users: 854,
  page_post_engagements: 642,
};

export function createMockPost() {
  return { ...mockFacebookPost };
}

export function createMockAd() {
  return { ...mockFacebookAd };
}

export function getMockInsights() {
  return { ...mockFacebookInsights };
}
