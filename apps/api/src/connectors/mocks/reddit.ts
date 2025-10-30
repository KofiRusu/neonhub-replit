export const mockSubreddit = {
  id: "t5_2qh33",
  name: "neonhub",
  title: "NeonHub Community",
  description: "Product updates, growth experiments, and AMA threads.",
  subscribers: 12500,
  activeAccounts: 420,
  over18: false,
};

export const mockSubmission = {
  id: "abc123",
  name: "t3_abc123",
  url: "https://www.reddit.com/r/neonhub/comments/abc123/product_launch_day/",
  permalink: "/r/neonhub/comments/abc123/product_launch_day/",
  subreddit: "r/neonhub",
};

export const mockComment = {
  id: "cmt123",
  name: "t1_cmt123",
  body: "Thanks for the feedback! We'll ship improvements soon.",
  permalink: "/r/neonhub/comments/abc123/comment/cmt123",
};

export function listMockSubreddits() {
  return [mockSubreddit];
}
