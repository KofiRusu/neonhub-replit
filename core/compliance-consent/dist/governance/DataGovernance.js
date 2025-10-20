"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataGovernance = void 0;
class DataGovernance {
    constructor(config) {
        this.classifications = new Map();
        this.config = config;
    }
    classifyData(dataId, content, category, sensitivity = 1) {
        let level;
        if (sensitivity >= 9) {
            level = 'restricted';
        }
        else if (sensitivity >= 7) {
            level = 'confidential';
        }
        else if (sensitivity >= 4) {
            level = 'internal';
        }
        else {
            level = 'public';
        }
        const classification = {
            level,
            category,
            sensitivity,
            retentionPeriod: this.getRetentionPeriod(level),
            encryptionRequired: this.requiresEncryption(level),
            crossBorderAllowed: this.allowsCrossBorder(level)
        };
        this.classifications.set(dataId, classification);
        return classification;
    }
    getClassification(dataId) {
        return this.classifications.get(dataId);
    }
    updateClassification(dataId, updates) {
        const existing = this.classifications.get(dataId);
        if (!existing)
            return false;
        const updated = { ...existing, ...updates };
        this.classifications.set(dataId, updated);
        return true;
    }
    shouldRetainData(dataId, createdAt) {
        const classification = this.classifications.get(dataId);
        if (!classification)
            return true; // Default to retain if unknown
        const retentionPolicy = this.config.retentionPolicies[classification.level];
        if (!retentionPolicy || retentionPolicy.retentionPeriod === -1) {
            return true; // Indefinite retention
        }
        const age = Date.now() - createdAt.getTime();
        return age <= retentionPolicy.retentionPeriod;
    }
    getDataForDeletion() {
        const toDelete = [];
        for (const [dataId, classification] of this.classifications.entries()) {
            // In a real implementation, you'd have creation timestamps
            // For now, we'll simulate with a check
            if (this.shouldApplyRetentionPolicy(classification)) {
                toDelete.push({
                    dataId,
                    reason: `Retention period exceeded for ${classification.level} data`
                });
            }
        }
        return toDelete;
    }
    applyRetentionPolicy(dataId) {
        const classification = this.classifications.get(dataId);
        if (!classification)
            return 'retain';
        const policy = this.config.retentionPolicies[classification.level];
        if (!policy)
            return 'retain';
        if (policy.legalHold)
            return 'retain';
        if (policy.reviewRequired)
            return 'review';
        return policy.deletionMethod === 'hard' ? 'delete' : 'retain';
    }
    checkCrossBorderCompliance(sourceRegion, destinationRegion, dataId) {
        if (!this.config.crossBorderControls) {
            return { allowed: true };
        }
        const classification = this.classifications.get(dataId);
        if (!classification) {
            return { allowed: false, reason: 'Data not classified' };
        }
        if (!classification.crossBorderAllowed) {
            return { allowed: false, reason: 'Cross-border transfer not allowed for this data classification' };
        }
        // Check for adequacy decisions or SCC requirements
        if (!this.isAdequateRegion(destinationRegion)) {
            return {
                allowed: false,
                reason: `Destination region ${destinationRegion} requires additional safeguards`
            };
        }
        return { allowed: true };
    }
    getEncryptionRequirements(dataId) {
        const classification = this.classifications.get(dataId);
        if (!classification) {
            return { required: this.config.encryptionRequired };
        }
        return {
            required: classification.encryptionRequired || this.config.encryptionRequired,
            algorithm: classification.level === 'restricted' ? 'AES-256-GCM' : 'AES-256-CBC',
            keyRotation: classification.level === 'restricted' ? 30 * 24 * 60 * 60 * 1000 : 365 * 24 * 60 * 60 * 1000
        };
    }
    getGovernanceMetrics() {
        const byLevel = {};
        for (const level of this.config.classificationLevels) {
            byLevel[level] = 0;
        }
        for (const classification of this.classifications.values()) {
            byLevel[classification.level] = (byLevel[classification.level] || 0) + 1;
        }
        return {
            totalClassifications: this.classifications.size,
            byLevel,
            retentionCompliance: 95.5, // Would be calculated based on actual retention checks
            crossBorderTransfers: 0 // Would track actual transfers
        };
    }
    getRetentionPeriod(level) {
        const policy = this.config.retentionPolicies[level];
        return policy ? policy.retentionPeriod : 365 * 24 * 60 * 60 * 1000; // Default 1 year
    }
    requiresEncryption(level) {
        return level === 'confidential' || level === 'restricted' || this.config.encryptionRequired;
    }
    allowsCrossBorder(level) {
        return level !== 'restricted' || !this.config.crossBorderControls;
    }
    shouldApplyRetentionPolicy(classification) {
        // Simplified logic - in reality would check actual timestamps
        return Math.random() > 0.95; // Simulate some data being ready for deletion
    }
    isAdequateRegion(region) {
        // Simplified adequacy check - would include actual adequacy decisions
        const adequateRegions = ['EU', 'EEA', 'UK', 'Switzerland', 'Canada', 'Japan'];
        return adequateRegions.some(r => region.includes(r));
    }
}
exports.DataGovernance = DataGovernance;
//# sourceMappingURL=DataGovernance.js.map