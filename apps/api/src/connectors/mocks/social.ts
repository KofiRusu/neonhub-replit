import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type SocialPost = {
  id: string;
  platform: string;
  content: string;
  metrics: {
    impressions: number;
    engagement: number;
  };
};

const posts: SocialPost[] = JSON.parse(
  readFileSync(path.resolve(__dirname, "../../fixtures/social/posts.json"), "utf-8")
);

export function listSocialPosts(platform?: string): SocialPost[] {
  if (!platform) {
    return posts;
  }
  return posts.filter(post => post.platform === platform);
}
