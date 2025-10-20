import { EventEmitter } from 'events';
import { AggregationConfig, AggregationAlgorithm, ModelUpdate, GradientUpdate, ParticipantInfo } from '../types';
import { Logger } from '../utils/Logger';
export interface AggregationRound {
    roundId: string;
    algorithm: AggregationAlgorithm;
    participants: string[];
    modelVersion: string;
    startTime: number;
    endTime?: number;
    status: 'active' | 'completed' | 'failed';
    aggregatedModel?: ModelUpdate;
}
export declare class FederatedLearningCoordinator extends EventEmitter {
    private logger;
    private dp;
    private he;
    private activeRounds;
    private participants;
    private globalModelVersion;
    constructor(logger?: Logger);
    /**
     * Registers a participant in the federated learning system
     */
    registerParticipant(participant: ParticipantInfo): void;
    /**
     * Unregisters a participant
     */
    unregisterParticipant(nodeId: string): void;
    /**
     * Starts a new aggregation round
     */
    startAggregationRound(config: AggregationConfig): string;
    /**
     * Submits a gradient update from a participant
     */
    submitGradientUpdate(nodeId: string, gradients: GradientUpdate, roundId: string): Promise<void>;
    /**
     * Submits a model update from a participant
     */
    submitModelUpdate(nodeId: string, modelUpdate: ModelUpdate, roundId: string): Promise<void>;
    /**
     * Gets the current global model
     */
    getGlobalModel(): ModelUpdate;
    /**
     * Gets active aggregation rounds
     */
    getActiveRounds(): AggregationRound[];
    /**
     * Gets registered participants
     */
    getParticipants(): ParticipantInfo[];
    /**
     * Updates participant reputation
     */
    updateParticipantReputation(nodeId: string, reputationChange: number): void;
    /**
     * Selects participants for a round based on reputation and availability
     */
    private selectParticipants;
    /**
     * Checks if an aggregation round is complete and triggers aggregation
     */
    private checkRoundCompletion;
    /**
     * Completes an aggregation round
     */
    private completeRound;
}
//# sourceMappingURL=FederatedLearningCoordinator.d.ts.map