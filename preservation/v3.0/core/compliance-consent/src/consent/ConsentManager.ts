import { v4 as uuidv4 } from 'uuid';
import { ConsentRecord } from '../types';

export interface ConsentConfig {
  storage: 'encrypted' | 'database';
  retentionPeriod: number;
  requiredPurposes: string[];
  consentTypes: string[];
}

export class ConsentManager {
  private consents: Map<string, ConsentRecord> = new Map();
  private config: ConsentConfig;

  constructor(config: ConsentConfig) {
    this.config = config;
  }

  async grantConsent(
    userId: string,
    purposes: string[],
    consentTypes: string[],
    expiresAt?: Date,
    metadata: Record<string, any> = {}
  ): Promise<ConsentRecord> {
    // Validate required purposes
    for (const purpose of this.config.requiredPurposes) {
      if (!purposes.includes(purpose)) {
        throw new Error(`Required purpose '${purpose}' not included in consent`);
      }
    }

    // Validate consent types
    for (const type of consentTypes) {
      if (!this.config.consentTypes.includes(type)) {
        throw new Error(`Invalid consent type '${type}'`);
      }
    }

    const consent: ConsentRecord = {
      id: uuidv4(),
      userId,
      purposes,
      consentTypes,
      grantedAt: new Date(),
      expiresAt,
      source: 'user_grant',
      metadata
    };

    this.consents.set(consent.id, consent);

    // Log audit event
    await this.logAuditEvent('consent_granted', {
      consentId: consent.id,
      userId,
      purposes,
      consentTypes
    });

    return consent;
  }

  async revokeConsent(consentId: string, userId: string): Promise<boolean> {
    const consent = this.consents.get(consentId);
    if (!consent || consent.userId !== userId) {
      return false;
    }

    consent.revokedAt = new Date();
    this.consents.set(consentId, consent);

    // Log audit event
    await this.logAuditEvent('consent_revoked', {
      consentId,
      userId,
      purposes: consent.purposes
    });

    return true;
  }

  async checkConsent(userId: string, purpose: string): Promise<boolean> {
    const userConsents = Array.from(this.consents.values())
      .filter(consent => consent.userId === userId && !consent.revokedAt);

    for (const consent of userConsents) {
      // Check if consent is expired
      if (consent.expiresAt && consent.expiresAt < new Date()) {
        continue;
      }

      // Check if purpose is included
      if (consent.purposes.includes(purpose)) {
        return true;
      }
    }

    return false;
  }

  async getUserConsents(userId: string): Promise<ConsentRecord[]> {
    return Array.from(this.consents.values())
      .filter(consent => consent.userId === userId)
      .sort((a, b) => b.grantedAt.getTime() - a.grantedAt.getTime());
  }

  async getActiveConsents(userId: string): Promise<ConsentRecord[]> {
    return Array.from(this.consents.values())
      .filter(consent =>
        consent.userId === userId &&
        !consent.revokedAt &&
        (!consent.expiresAt || consent.expiresAt > new Date())
      );
  }

  async getExpiredConsents(): Promise<ConsentRecord[]> {
    const now = new Date();
    return Array.from(this.consents.values())
      .filter(consent =>
        consent.expiresAt &&
        consent.expiresAt < now &&
        !consent.revokedAt
      );
  }

  async renewConsent(consentId: string, newExpiry: Date): Promise<boolean> {
    const consent = this.consents.get(consentId);
    if (!consent) {
      return false;
    }

    consent.expiresAt = newExpiry;
    this.consents.set(consentId, consent);

    await this.logAuditEvent('consent_renewed', {
      consentId,
      userId: consent.userId,
      newExpiry
    });

    return true;
  }

  async bulkRevokeConsents(userId: string, purposes?: string[]): Promise<number> {
    let revokedCount = 0;
    const userConsents = Array.from(this.consents.values())
      .filter(consent => consent.userId === userId && !consent.revokedAt);

    for (const consent of userConsents) {
      if (!purposes || purposes.some(p => consent.purposes.includes(p))) {
        consent.revokedAt = new Date();
        this.consents.set(consent.id, consent);
        revokedCount++;

        await this.logAuditEvent('consent_revoked_bulk', {
          consentId: consent.id,
          userId,
          purposes: consent.purposes
        });
      }
    }

    return revokedCount;
  }

  async getConsentStatistics(): Promise<{
    totalConsents: number;
    activeConsents: number;
    expiredConsents: number;
    revokedConsents: number;
  }> {
    const allConsents = Array.from(this.consents.values());
    const now = new Date();

    return {
      totalConsents: allConsents.length,
      activeConsents: allConsents.filter(c =>
        !c.revokedAt && (!c.expiresAt || c.expiresAt > now)
      ).length,
      expiredConsents: allConsents.filter(c =>
        c.expiresAt && c.expiresAt < now && !c.revokedAt
      ).length,
      revokedConsents: allConsents.filter(c => c.revokedAt).length
    };
  }

  private async logAuditEvent(action: string, details: Record<string, any>): Promise<void> {
    // In a real implementation, this would log to an audit system
    console.log(`[AUDIT] ${action}:`, details);
  }
}