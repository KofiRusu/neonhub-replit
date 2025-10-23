import { ParticipantStatus, NodeCapability } from '../types';
export class ParticipantManager {
    constructor(logger) {
        this.participants = new Map();
        this.logger = logger;
    }
    /**
     * Registers a new participant
     */
    registerParticipant(participant) {
        this.participants.set(participant.nodeId, { ...participant });
        this.logger.info(`Registered participant: ${participant.nodeId} with initial reputation ${participant.reputationScore}`);
    }
    /**
     * Updates participant information
     */
    updateParticipant(nodeId, updates) {
        const participant = this.participants.get(nodeId);
        if (participant) {
            Object.assign(participant, updates);
            participant.lastContribution = Date.now();
            this.logger.debug(`Updated participant ${nodeId}`);
        }
    }
    /**
     * Gets participant information
     */
    getParticipant(nodeId) {
        return this.participants.get(nodeId);
    }
    /**
     * Gets all participants
     */
    getAllParticipants() {
        return Array.from(this.participants.values());
    }
    /**
     * Gets participants by status
     */
    getParticipantsByStatus(status) {
        return Array.from(this.participants.values()).filter(p => p.status === status);
    }
    /**
     * Gets active participants
     */
    getActiveParticipants() {
        return this.getParticipantsByStatus(ParticipantStatus.ACTIVE);
    }
    /**
     * Updates participant reputation score
     */
    updateReputation(nodeId, reputationChange, reason) {
        const participant = this.participants.get(nodeId);
        if (participant) {
            const oldReputation = participant.reputationScore;
            participant.reputationScore = Math.max(0, Math.min(1, participant.reputationScore + reputationChange));
            participant.lastContribution = Date.now();
            participant.contributionCount++;
            this.logger.info(`Updated reputation for ${nodeId}: ${oldReputation.toFixed(3)} -> ${participant.reputationScore.toFixed(3)} (${reason || 'no reason'})`);
            // Check if participant should be suspended or blacklisted
            this.checkParticipantStatus(nodeId);
        }
    }
    /**
     * Calculates reputation score based on various factors
     */
    calculateReputationScore(participant) {
        let score = 0.5; // Base score
        // Contribution frequency (recent activity)
        const daysSinceLastContribution = (Date.now() - participant.lastContribution) / (1000 * 60 * 60 * 24);
        const recencyScore = Math.max(0, 1 - daysSinceLastContribution / 30); // Decay over 30 days
        score += recencyScore * 0.3;
        // Contribution count (experience)
        const experienceScore = Math.min(1, participant.contributionCount / 100); // Cap at 100 contributions
        score += experienceScore * 0.2;
        // Privacy budget health
        const budgetUsageRatio = participant.privacyBudget.usedBudget / participant.privacyBudget.maxBudget;
        const budgetScore = 1 - budgetUsageRatio; // Higher score for lower usage
        score += budgetScore * 0.2;
        // Capabilities bonus
        const hasFederatedLearning = participant.capabilities.includes(NodeCapability.FEDERATED_LEARNING);
        const hasSecureComputation = participant.capabilities.includes(NodeCapability.SECURE_COMPUTATION);
        const capabilityBonus = (hasFederatedLearning ? 0.1 : 0) + (hasSecureComputation ? 0.1 : 0);
        score += capabilityBonus;
        return Math.max(0, Math.min(1, score));
    }
    /**
     * Gets top participants by reputation
     */
    getTopParticipants(limit = 10) {
        return Array.from(this.participants.values())
            .sort((a, b) => b.reputationScore - a.reputationScore)
            .slice(0, limit);
    }
    /**
     * Gets participants eligible for a task based on reputation threshold
     */
    getEligibleParticipants(minReputation = 0.5) {
        return Array.from(this.participants.values())
            .filter(p => p.status === 'active' && p.reputationScore >= minReputation);
    }
    /**
     * Suspends a participant due to poor performance
     */
    suspendParticipant(nodeId, reason) {
        const participant = this.participants.get(nodeId);
        if (participant) {
            participant.status = ParticipantStatus.SUSPENDED;
            this.logger.warn(`Suspended participant ${nodeId}: ${reason}`);
        }
    }
    /**
     * Blacklists a participant permanently
     */
    blacklistParticipant(nodeId, reason) {
        const participant = this.participants.get(nodeId);
        if (participant) {
            participant.status = ParticipantStatus.BLACKLISTED;
            this.logger.error(`Blacklisted participant ${nodeId}: ${reason}`);
        }
    }
    /**
     * Reactivates a suspended participant
     */
    reactivateParticipant(nodeId) {
        const participant = this.participants.get(nodeId);
        if (participant && participant.status === ParticipantStatus.SUSPENDED) {
            participant.status = ParticipantStatus.ACTIVE;
            this.logger.info(`Reactivated participant ${nodeId}`);
        }
    }
    /**
     * Removes a participant
     */
    removeParticipant(nodeId) {
        this.participants.delete(nodeId);
        this.logger.info(`Removed participant ${nodeId}`);
    }
    /**
     * Gets participant statistics
     */
    getParticipantStatistics() {
        const participants = Array.from(this.participants.values());
        const total = participants.length;
        const active = participants.filter(p => p.status === 'active').length;
        const suspended = participants.filter(p => p.status === 'suspended').length;
        const blacklisted = participants.filter(p => p.status === 'blacklisted').length;
        const averageReputation = total > 0 ? participants.reduce((sum, p) => sum + p.reputationScore, 0) / total : 0;
        const topPerformers = participants.filter(p => p.reputationScore >= 0.8).length;
        return {
            total,
            active,
            suspended,
            blacklisted,
            averageReputation,
            topPerformers
        };
    }
    /**
     * Checks if participant status should change based on reputation
     */
    checkParticipantStatus(nodeId) {
        const participant = this.participants.get(nodeId);
        if (!participant)
            return;
        // Automatic suspension for very low reputation
        if (participant.reputationScore < 0.2 && participant.status === 'active') {
            this.suspendParticipant(nodeId, 'Reputation below threshold');
        }
        // Automatic blacklisting for extremely low reputation
        if (participant.reputationScore < 0.1) {
            this.blacklistParticipant(nodeId, 'Reputation critically low');
        }
        // Reactivation for improved reputation
        if (participant.reputationScore > 0.4 && participant.status === 'suspended') {
            this.reactivateParticipant(nodeId);
        }
    }
}
//# sourceMappingURL=ParticipantManager.js.map