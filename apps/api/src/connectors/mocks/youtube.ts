export const mockYouTubeUpload = {
  videoId: "yt_upload_123",
  etag: "etag_upload",
};

export const mockYouTubeUpdate = {
  id: "yt_video_456",
  snippet: {
    title: "Updated Title",
    description: "Updated description",
  },
};

export const mockYouTubeStats = {
  views: 1024,
  likes: 256,
  comments: 12,
};

export function createMockUpload() {
  return { ...mockYouTubeUpload };
}

export function createMockUpdate() {
  return { ...mockYouTubeUpdate };
}

export function createMockStats() {
  return { ...mockYouTubeStats };
}
