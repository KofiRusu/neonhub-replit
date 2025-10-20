import { prisma } from '../db/prisma.js';
import type { UserSettings, Prisma } from '@prisma/client';

export interface UpdateSettingsData {
  brandVoice?: Record<string, any>;
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  notificationFrequency?: 'realtime' | 'daily' | 'weekly';
  timezone?: string;
  locale?: string;
  dateFormat?: string;
  dataRetention?: number;
  allowAnalytics?: boolean;
  allowPersonalization?: boolean;
  apiRateLimit?: number;
  webhookUrl?: string;
  webhookSecret?: string;
}

export class SettingsService {
  /**
   * Get user settings, creating defaults if they don't exist
   */
  async getSettings(userId: string): Promise<UserSettings> {
    let settings = await prisma.userSettings.findUnique({
      where: { userId },
    });
    
    if (!settings) {
      settings = await this.createDefaultSettings(userId);
    }
    
    return settings;
  }
  
  /**
   * Update user settings
   */
  async updateSettings(
    userId: string,
    data: UpdateSettingsData
  ): Promise<UserSettings> {
    return prisma.userSettings.upsert({
      where: { userId },
      create: { 
        userId, 
        ...data,
        brandVoice: data.brandVoice as Prisma.JsonValue,
      },
      update: {
        ...data,
        brandVoice: data.brandVoice as Prisma.JsonValue,
      },
    });
  }
  
  /**
   * Update brand voice settings only
   */
  async updateBrandVoice(userId: string, brandVoice: Record<string, any>): Promise<UserSettings> {
    return this.updateSettings(userId, { brandVoice });
  }
  
  /**
   * Update notification settings only
   */
  async updateNotifications(
    userId: string, 
    notifications: {
      emailNotifications?: boolean;
      pushNotifications?: boolean;
      notificationFrequency?: 'realtime' | 'daily' | 'weekly';
    }
  ): Promise<UserSettings> {
    return this.updateSettings(userId, notifications);
  }
  
  /**
   * Update privacy settings only
   */
  async updatePrivacy(
    userId: string,
    privacy: {
      dataRetention?: number;
      allowAnalytics?: boolean;
      allowPersonalization?: boolean;
    }
  ): Promise<UserSettings> {
    return this.updateSettings(userId, privacy);
  }
  
  /**
   * Update API settings only
   */
  async updateAPISettings(
    userId: string,
    api: {
      apiRateLimit?: number;
      webhookUrl?: string;
      webhookSecret?: string;
    }
  ): Promise<UserSettings> {
    return this.updateSettings(userId, api);
  }
  
  /**
   * Update regional settings only
   */
  async updateRegional(
    userId: string,
    regional: {
      timezone?: string;
      locale?: string;
      dateFormat?: string;
    }
  ): Promise<UserSettings> {
    return this.updateSettings(userId, regional);
  }
  
  /**
   * Delete user settings (GDPR compliance)
   */
  async deleteSettings(userId: string): Promise<void> {
    await prisma.userSettings.delete({
      where: { userId },
    });
  }
  
  /**
   * Create default settings for a new user
   */
  private async createDefaultSettings(userId: string): Promise<UserSettings> {
    return prisma.userSettings.create({
      data: { 
        userId,
        emailNotifications: true,
        pushNotifications: false,
        notificationFrequency: 'realtime',
        timezone: 'UTC',
        locale: 'en-US',
        dateFormat: 'MM/DD/YYYY',
        dataRetention: 90,
        allowAnalytics: true,
        allowPersonalization: true,
        apiRateLimit: 1000,
      },
    });
  }
  
  /**
   * Get brand voice settings
   */
  async getBrandVoice(userId: string): Promise<Record<string, any> | null> {
    const settings = await this.getSettings(userId);
    return settings.brandVoice as Record<string, any> | null;
  }
  
  /**
   * Check if user has analytics enabled
   */
  async hasAnalyticsEnabled(userId: string): Promise<boolean> {
    const settings = await this.getSettings(userId);
    return settings.allowAnalytics;
  }
  
  /**
   * Check if user has personalization enabled
   */
  async hasPersonalizationEnabled(userId: string): Promise<boolean> {
    const settings = await this.getSettings(userId);
    return settings.allowPersonalization;
  }
  
  /**
   * Get user's API rate limit
   */
  async getApiRateLimit(userId: string): Promise<number> {
    const settings = await this.getSettings(userId);
    return settings.apiRateLimit;
  }
}

export const settingsService = new SettingsService();