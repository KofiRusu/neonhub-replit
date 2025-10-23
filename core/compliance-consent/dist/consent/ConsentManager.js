import { v4 as uuidv4 } from 'uuid';
export class ConsentManager {
    constructor(config) {
        this.consents = new Map();
        this.config = config;
    }
    async grantConsent(userId, purposes, consentTypes, expiresAt, metadata = {}) {
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
        const consent = {
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
    async revokeConsent(consentId, userId) {
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
    async checkConsent(userId, purpose) {
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
    async getUserConsents(userId) {
        return Array.from(this.consents.values())
            .filter(consent => consent.userId === userId)
            .sort((a, b) => b.grantedAt.getTime() - a.grantedAt.getTime());
    }
    async getActiveConsents(userId) {
        return Array.from(this.consents.values())
            .filter(consent => consent.userId === userId &&
            !consent.revokedAt &&
            (!consent.expiresAt || consent.expiresAt > new Date()));
    }
    async getExpiredConsents() {
        const now = new Date();
        return Array.from(this.consents.values())
            .filter(consent => consent.expiresAt &&
            consent.expiresAt < now &&
            !consent.revokedAt);
    }
    async renewConsent(consentId, newExpiry) {
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
    async bulkRevokeConsents(userId, purposes) {
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
    async getConsentStatistics() {
        const allConsents = Array.from(this.consents.values());
        const now = new Date();
        return {
            totalConsents: allConsents.length,
            activeConsents: allConsents.filter(c => !c.revokedAt && (!c.expiresAt || c.expiresAt > now)).length,
            expiredConsents: allConsents.filter(c => c.expiresAt && c.expiresAt < now && !c.revokedAt).length,
            revokedConsents: allConsents.filter(c => c.revokedAt).length
        };
    }
    async logAuditEvent(action, details) {
        // In a real implementation, this would log to an audit system
        console.log(`[AUDIT] ${action}:`, details);
    }
}
//# sourceMappingURL=ConsentManager.js.map