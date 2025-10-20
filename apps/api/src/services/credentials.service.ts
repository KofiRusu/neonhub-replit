import { prisma } from '../db/prisma.js';
import { encrypt, decrypt, maskToken } from '../lib/encryption.js';
import type { Credential } from '@prisma/client';

export interface DecryptedCredential extends Omit<Credential, 'accessToken' | 'refreshToken' | 'accessSecret'> {
  accessToken?: string;
  refreshToken?: string;
  accessSecret?: string;
}

export interface MaskedCredential extends Omit<Credential, 'accessToken' | 'refreshToken' | 'accessSecret'> {
  accessToken?: string;  // Masked version
  refreshToken?: string; // Masked version
  accessSecret?: string; // Masked version
}

export interface SaveCredentialParams {
  userId: string;
  provider: string;
  accountId?: string;
  accessToken?: string;
  refreshToken?: string;
  accessSecret?: string;
  scope?: string;
  tokenType?: string;
  expiresAt?: Date;
}

export class CredentialService {
  /**
   * Save or update a credential with encryption
   */
  async saveCredential(params: SaveCredentialParams): Promise<Credential> {
    const encrypted = {
      userId: params.userId,
      provider: params.provider,
      accountId: params.accountId || '',
      accessToken: params.accessToken ? encrypt(params.accessToken) : null,
      refreshToken: params.refreshToken ? encrypt(params.refreshToken) : null,
      accessSecret: params.accessSecret ? encrypt(params.accessSecret) : null,
      scope: params.scope || null,
      tokenType: params.tokenType || null,
      expiresAt: params.expiresAt || null,
      status: 'active',
    };
    
    return prisma.credential.upsert({
      where: {
        userId_provider_accountId: {
          userId: params.userId,
          provider: params.provider,
          accountId: params.accountId || '',
        },
      },
      create: encrypted,
      update: encrypted,
    });
  }
  
  /**
   * Get a decrypted credential (internal use only)
   */
  async getCredential(userId: string, provider: string, accountId?: string): Promise<DecryptedCredential | null> {
    const where: any = { 
      userId, 
      provider, 
      status: 'active' 
    };
    
    if (accountId !== undefined) {
      where.accountId = accountId;
    }
    
    const cred = await prisma.credential.findFirst({ where });
    
    if (!cred) return null;
    
    return {
      ...cred,
      accessToken: cred.accessToken ? decrypt(cred.accessToken) : undefined,
      refreshToken: cred.refreshToken ? decrypt(cred.refreshToken) : undefined,
      accessSecret: cred.accessSecret ? decrypt(cred.accessSecret) : undefined,
    };
  }
  
  /**
   * Get masked credentials for API responses (safe for external use)
   */
  async getMaskedCredentials(userId: string): Promise<MaskedCredential[]> {
    const credentials = await prisma.credential.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    
    return credentials.map(cred => ({
      ...cred,
      accessToken: cred.accessToken ? maskToken(decrypt(cred.accessToken)) : undefined,
      refreshToken: cred.refreshToken ? maskToken(decrypt(cred.refreshToken)) : undefined,
      accessSecret: cred.accessSecret ? maskToken(decrypt(cred.accessSecret)) : undefined,
    }));
  }
  
  /**
   * Get a masked credential for a specific provider
   */
  async getMaskedCredential(userId: string, provider: string): Promise<MaskedCredential | null> {
    const cred = await prisma.credential.findFirst({
      where: { userId, provider, status: 'active' },
    });
    
    if (!cred) return null;
    
    return {
      ...cred,
      accessToken: cred.accessToken ? maskToken(decrypt(cred.accessToken)) : undefined,
      refreshToken: cred.refreshToken ? maskToken(decrypt(cred.refreshToken)) : undefined,
      accessSecret: cred.accessSecret ? maskToken(decrypt(cred.accessSecret)) : undefined,
    };
  }
  
  /**
   * Revoke a credential
   */
  async revokeCredential(userId: string, provider: string): Promise<void> {
    await prisma.credential.updateMany({
      where: { userId, provider },
      data: { 
        status: 'revoked',
        updatedAt: new Date(),
      },
    });
  }
  
  /**
   * Delete a credential permanently
   */
  async deleteCredential(userId: string, provider: string): Promise<void> {
    await prisma.credential.deleteMany({
      where: { userId, provider },
    });
  }
  
  /**
   * Check if a credential needs refresh (expires within 5 minutes)
   */
  needsRefresh(credential: DecryptedCredential): boolean {
    if (!credential.expiresAt) return false;
    
    const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);
    return credential.expiresAt < fiveMinutesFromNow;
  }
  
  /**
   * Update last used timestamp
   */
  async markAsUsed(credentialId: string): Promise<void> {
    await prisma.credential.update({
      where: { id: credentialId },
      data: { lastUsedAt: new Date() },
    });
  }
  
  /**
   * Mark credential as expired
   */
  async markAsExpired(credentialId: string): Promise<void> {
    await prisma.credential.update({
      where: { id: credentialId },
      data: { status: 'expired' },
    });
  }
  
  /**
   * Get all credentials for a user by status
   */
  async getCredentialsByStatus(userId: string, status: string): Promise<MaskedCredential[]> {
    const credentials = await prisma.credential.findMany({
      where: { userId, status },
      orderBy: { createdAt: 'desc' },
    });
    
    return credentials.map(cred => ({
      ...cred,
      accessToken: cred.accessToken ? maskToken(decrypt(cred.accessToken)) : undefined,
      refreshToken: cred.refreshToken ? maskToken(decrypt(cred.refreshToken)) : undefined,
      accessSecret: cred.accessSecret ? maskToken(decrypt(cred.accessSecret)) : undefined,
    }));
  }
}

export const credentialService = new CredentialService();