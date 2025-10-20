import { ConsentRecord } from '../types';
export interface ConsentConfig {
    storage: 'encrypted' | 'database';
    retentionPeriod: number;
    requiredPurposes: string[];
    consentTypes: string[];
}
export declare class ConsentManager {
    private consents;
    private config;
    constructor(config: ConsentConfig);
    grantConsent(userId: string, purposes: string[], consentTypes: string[], expiresAt?: Date, metadata?: Record<string, any>): Promise<ConsentRecord>;
    revokeConsent(consentId: string, userId: string): Promise<boolean>;
    checkConsent(userId: string, purpose: string): Promise<boolean>;
    getUserConsents(userId: string): Promise<ConsentRecord[]>;
    getActiveConsents(userId: string): Promise<ConsentRecord[]>;
    getExpiredConsents(): Promise<ConsentRecord[]>;
    renewConsent(consentId: string, newExpiry: Date): Promise<boolean>;
    bulkRevokeConsents(userId: string, purposes?: string[]): Promise<number>;
    getConsentStatistics(): Promise<{
        totalConsents: number;
        activeConsents: number;
        expiredConsents: number;
        revokedConsents: number;
    }>;
    private logAuditEvent;
}
//# sourceMappingURL=ConsentManager.d.ts.map