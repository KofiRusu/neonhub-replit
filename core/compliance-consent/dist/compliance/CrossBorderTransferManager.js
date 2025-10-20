"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CrossBorderTransferManager = void 0;
const uuid_1 = require("uuid");
class CrossBorderTransferManager {
    constructor() {
        this.transfers = new Map();
    }
    async initiateTransfer(sourceRegion, destinationRegion, dataClassification, legalBasis, safeguards) {
        const transfer = {
            id: (0, uuid_1.v4)(),
            sourceRegion,
            destinationRegion,
            dataClassification,
            legalBasis,
            safeguards,
            timestamp: new Date(),
            status: 'pending'
        };
        // Validate transfer
        const validation = await this.validateTransfer(transfer);
        if (!validation.allowed) {
            transfer.status = 'denied';
        }
        this.transfers.set(transfer.id, transfer);
        await this.logTransfer(transfer);
        return transfer;
    }
    async approveTransfer(transferId) {
        const transfer = this.transfers.get(transferId);
        if (!transfer || transfer.status !== 'pending')
            return false;
        transfer.status = 'approved';
        this.transfers.set(transferId, transfer);
        await this.logTransferUpdate(transfer, 'approved');
        return true;
    }
    async denyTransfer(transferId, reason) {
        const transfer = this.transfers.get(transferId);
        if (!transfer || transfer.status !== 'pending')
            return false;
        transfer.status = 'denied';
        this.transfers.set(transferId, transfer);
        await this.logTransferUpdate(transfer, 'denied', reason);
        return true;
    }
    async getTransfer(transferId) {
        return this.transfers.get(transferId);
    }
    async getTransfersByRegion(region) {
        return Array.from(this.transfers.values())
            .filter(transfer => transfer.sourceRegion === region || transfer.destinationRegion === region)
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }
    async getPendingTransfers() {
        return Array.from(this.transfers.values())
            .filter(transfer => transfer.status === 'pending')
            .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    }
    async validateTransfer(transfer) {
        // Check if destination is in adequacy list
        if (this.isAdequateRegion(transfer.destinationRegion)) {
            return { allowed: true };
        }
        // Check for SCC or BCR
        if (transfer.legalBasis === 'standard_contractual_clauses' ||
            transfer.legalBasis === 'binding_corporate_rules') {
            return { allowed: true };
        }
        // Check data classification restrictions
        if (transfer.dataClassification.level === 'restricted') {
            return {
                allowed: false,
                reason: 'Restricted data cannot be transferred without explicit approval'
            };
        }
        // Require additional safeguards for sensitive data
        if (transfer.dataClassification.level === 'confidential') {
            const additionalSafeguards = ['encryption_at_rest', 'encryption_in_transit', 'access_controls'];
            const missing = additionalSafeguards.filter(s => !transfer.safeguards.includes(s));
            if (missing.length > 0) {
                return {
                    allowed: false,
                    reason: `Missing required safeguards: ${missing.join(', ')}`,
                    additionalSafeguards: missing
                };
            }
        }
        return { allowed: true };
    }
    isAdequateRegion(region) {
        const adequateRegions = [
            'European Economic Area',
            'Switzerland',
            'United Kingdom',
            'Canada',
            'Japan',
            'New Zealand',
            'Argentina',
            'Uruguay'
        ];
        return adequateRegions.some(r => region.toLowerCase().includes(r.toLowerCase()));
    }
    async getTransferMetrics() {
        const allTransfers = Array.from(this.transfers.values());
        const byRegion = {};
        for (const transfer of allTransfers) {
            byRegion[transfer.destinationRegion] = (byRegion[transfer.destinationRegion] || 0) + 1;
        }
        return {
            totalTransfers: allTransfers.length,
            approvedTransfers: allTransfers.filter(t => t.status === 'approved').length,
            deniedTransfers: allTransfers.filter(t => t.status === 'denied').length,
            pendingTransfers: allTransfers.filter(t => t.status === 'pending').length,
            byRegion
        };
    }
    async generateTransferReport(startDate, endDate) {
        const transfers = Array.from(this.transfers.values())
            .filter(t => t.timestamp >= startDate && t.timestamp <= endDate);
        const approved = transfers.filter(t => t.status === 'approved').length;
        const denied = transfers.filter(t => t.status === 'denied').length;
        const total = transfers.length;
        let riskAssessment = 'Low';
        if (denied > approved * 0.3) {
            riskAssessment = 'Medium';
        }
        if (denied > approved * 0.5) {
            riskAssessment = 'High';
        }
        return {
            period: { start: startDate, end: endDate },
            transfers,
            summary: {
                total,
                approved,
                denied,
                riskAssessment
            }
        };
    }
    async logTransfer(transfer) {
        console.log(`[TRANSFER] Initiated transfer ${transfer.id} from ${transfer.sourceRegion} to ${transfer.destinationRegion}`);
    }
    async logTransferUpdate(transfer, action, reason) {
        const reasonText = reason ? ` (${reason})` : '';
        console.log(`[TRANSFER] Transfer ${transfer.id} ${action}${reasonText}`);
    }
}
exports.CrossBorderTransferManager = CrossBorderTransferManager;
//# sourceMappingURL=CrossBorderTransferManager.js.map