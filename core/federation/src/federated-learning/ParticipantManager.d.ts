import { Logger } from '../utils/Logger';
import { ParticipantInfo, ParticipantStatus } from '../types';
export declare class ParticipantManager {
    private logger;
    private participants;
    constructor(logger: Logger);
    /**
     * Registers a new participant
     */
    registerParticipant(participant: ParticipantInfo): void;
    /**
     * Updates participant information
     */
    updateParticipant(nodeId: string, updates: Partial<ParticipantInfo>): void;
    /**
     * Gets participant information
     */
    getParticipant(nodeId: string): ParticipantInfo | undefined;
    /**
     * Gets all participants
     */
    getAllParticipants(): ParticipantInfo[];
    /**
     * Gets participants by status
     */
    getParticipantsByStatus(status: ParticipantStatus): ParticipantInfo[];
    /**
     * Gets active participants
     */
    getActiveParticipants(): ParticipantInfo[];
    /**
     * Updates participant reputation score
     */
    updateReputation(nodeId: string, reputationChange: number, reason?: string): void;
    /**
     * Calculates reputation score based on various factors
     */
    calculateReputationScore(participant: ParticipantInfo): number;
    /**
     * Gets top participants by reputation
     */
    getTopParticipants(limit?: number): ParticipantInfo[];
    /**
     * Gets participants eligible for a task based on reputation threshold
     */
    getEligibleParticipants(minReputation?: number): ParticipantInfo[];
    /**
     * Suspends a participant due to poor performance
     */
    suspendParticipant(nodeId: string, reason: string): void;
    /**
     * Blacklists a participant permanently
     */
    blacklistParticipant(nodeId: string, reason: string): void;
    /**
     * Reactivates a suspended participant
     */
    reactivateParticipant(nodeId: string): void;
    /**
     * Removes a participant
     */
    removeParticipant(nodeId: string): void;
    /**
     * Gets participant statistics
     */
    getParticipantStatistics(): {
        total: number;
        active: number;
        suspended: number;
        blacklisted: number;
        averageReputation: number;
        topPerformers: number;
    };
    /**
     * Checks if participant status should change based on reputation
     */
    private checkParticipantStatus;
}
//# sourceMappingURL=ParticipantManager.d.ts.map