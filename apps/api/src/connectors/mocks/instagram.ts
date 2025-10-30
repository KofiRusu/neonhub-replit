export const mockInstagramPost = {
  creationId: "IGC_123456",
  mediaId: "IGM_654321",
  caption: "Launch day!",
  imageUrl: "https://cdn.neonhub.ai/mock-launch.jpg",
};

export const mockInstagramStory = {
  creationId: "IGS_987654",
  mediaId: "IGM_192837",
  mediaUrl: "https://cdn.neonhub.ai/mock-story.mp4",
};

export const mockInstagramInsights = {
  impressions: 1520,
  reach: 980,
  saved: 42,
  likes: 210,
  comments: 18,
};

export function createMockPublishResponse() {
  return { creationId: mockInstagramPost.creationId, mediaId: mockInstagramPost.mediaId };
}

export function listMockInsights() {
  return mockInstagramInsights;
}
