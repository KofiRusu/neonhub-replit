/**
 * Social API Client for TrendAgent
 * Fetches trending data from Twitter/Reddit APIs
 */

import { Buffer } from "node:buffer";

export interface TrendData {
  keyword: string;
  volume: number;
  sentiment: number;
  platform: 'twitter' | 'reddit';
  timestamp: Date;
}

export class SocialApiClient {
  private twitterBearerToken: string;
  private redditClientId: string;
  private redditClientSecret: string;

  constructor() {
    this.twitterBearerToken = process.env.TWITTER_BEARER_TOKEN || '';
    this.redditClientId = process.env.REDDIT_CLIENT_ID || '';
    this.redditClientSecret = process.env.REDDIT_CLIENT_SECRET || '';
  }

  /**
   * Fetch trending topics from Twitter
   */
  async fetchTwitterTrends(_location: string = 'worldwide'): Promise<TrendData[]> {
    // In development, return mock data if no API key
    if (!this.twitterBearerToken || process.env.NODE_ENV === 'development') {
      return this.getMockTwitterData();
    }

    try {
      const url = new URL('https://api.twitter.com/2/tweets/search/recent');
      url.searchParams.set('query', 'trending -is:retweet');
      url.searchParams.set('max_results', '50');
      url.searchParams.set('tweet.fields', 'public_metrics,created_at');

      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${this.twitterBearerToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const text = await response.text();
        console.error('Twitter API error:', response.status, text);
        return this.getMockTwitterData();
      }

      const payload = await response.json();
      if (!payload.data) return this.getMockTwitterData();

      return payload.data.map((tweet: any) => ({
        keyword: tweet.text.split(' ').slice(0, 3).join(' '),
        volume: tweet.public_metrics.like_count + tweet.public_metrics.retweet_count,
        sentiment: 0.5,
        platform: 'twitter' as const,
        timestamp: new Date(tweet.created_at),
      }));
    } catch (error) {
      console.error('Twitter API error:', error);
      return this.getMockTwitterData();
    }
  }

  /**
   * Fetch trending topics from Reddit
   */
  async fetchRedditTrends(subreddit: string = 'all'): Promise<TrendData[]> {
    // In development, return mock data if no API key
    if (!this.redditClientId || process.env.NODE_ENV === 'development') {
      return this.getMockRedditData();
    }

    try {
      const auth = Buffer.from(`${this.redditClientId}:${this.redditClientSecret}`).toString('base64');
      const tokenResponse = await fetch('https://www.reddit.com/api/v1/access_token', {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials',
      });

      if (!tokenResponse.ok) {
        const text = await tokenResponse.text();
        console.error('Reddit token error:', text);
        return this.getMockRedditData();
      }

      const tokenPayload = await tokenResponse.json();
      const accessToken = tokenPayload.access_token;

      const url = new URL(`https://oauth.reddit.com/r/${subreddit}/hot`);
      url.searchParams.set('limit', '50');

      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'User-Agent': process.env.REDDIT_USER_AGENT || 'NeonHub/3.0',
        },
      });

      if (!response.ok) {
        const text = await response.text();
        console.error('Reddit API error:', text);
        return this.getMockRedditData();
      }

      const payload = await response.json();
      return payload.data.children.map((post: any) => ({
        keyword: post.data.title,
        volume: post.data.ups + post.data.num_comments,
        sentiment: post.data.upvote_ratio,
        platform: 'reddit' as const,
        timestamp: new Date(post.data.created_utc * 1000),
      }));
    } catch (error) {
      console.error('Reddit API error:', error);
      return this.getMockRedditData();
    }
  }

  /**
   * Aggregate trends from all platforms
   */
  async aggregateTrends(): Promise<TrendData[]> {
    const [twitter, reddit] = await Promise.all([
      this.fetchTwitterTrends(),
      this.fetchRedditTrends(),
    ]);

    return [...twitter, ...reddit].sort((a, b) => b.volume - a.volume);
  }

  // Mock data for development
  private getMockTwitterData(): TrendData[] {
    return [
      { keyword: 'AI Revolution', volume: 15000, sentiment: 0.8, platform: 'twitter', timestamp: new Date() },
      { keyword: 'Tech Startups', volume: 12000, sentiment: 0.7, platform: 'twitter', timestamp: new Date() },
      { keyword: 'Marketing Trends', volume: 9000, sentiment: 0.6, platform: 'twitter', timestamp: new Date() },
    ];
  }

  private getMockRedditData(): TrendData[] {
    return [
      { keyword: 'SaaS Growth Hacks', volume: 8000, sentiment: 0.75, platform: 'reddit', timestamp: new Date() },
      { keyword: 'Content Marketing', volume: 6500, sentiment: 0.65, platform: 'reddit', timestamp: new Date() },
      { keyword: 'B2B Sales Tips', volume: 5500, sentiment: 0.70, platform: 'reddit', timestamp: new Date() },
    ];
  }
}

export const socialApiClient = new SocialApiClient();
