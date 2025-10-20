export interface AuthUser {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
}

export interface DecryptedCredential {
  id: string;
  provider: string;
  accountId?: string | null;
  accessToken?: string;
  refreshToken?: string;
  accessSecret?: string;
  scope?: string | null;
  tokenType?: string | null;
  expiresAt?: Date | null;
  lastUsedAt?: Date | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserSettingsData {
  id: string;
  userId: string;
  brandVoice?: Record<string, any> | null;
  emailNotifications: boolean;
  pushNotifications: boolean;
  notificationFrequency: 'realtime' | 'daily' | 'weekly';
  timezone: string;
  locale: string;
  dateFormat: string;
  dataRetention: number;
  allowAnalytics: boolean;
  allowPersonalization: boolean;
  apiRateLimit: number;
  webhookUrl?: string | null;
  webhookSecret?: string | null;
  createdAt: Date;
  updatedAt: Date;
}