"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FederatedLearningCoordinator = void 0;
const events_1 = require("events");
const Logger_1 = require("../utils/Logger");
const DifferentialPrivacy_1 = require("../privacy/DifferentialPrivacy");
const HomomorphicEncryption_1 = require("../crypto/HomomorphicEncryption");
class FederatedLearningCoordinator extends events_1.EventEmitter {
    constructor(logger) {
        super();
        this.activeRounds = new Map();
        this.participants = new Map();
        this.globalModelVersion = 'v1.0.0';
        this.logger = logger || new Logger_1.ConsoleLogger();
        this.dp = new DifferentialPrivacy_1.DifferentialPrivacy(this.logger);
        this.he = new HomomorphicEncryption_1.HomomorphicEncryption(this.logger);
    }
    /**
     * Registers a participant in the federated learning system
     */
    registerParticipant(participant) {
        this.participants.set(participant.nodeId, participant);
        this.logger.info(`Registered participant: ${participant.nodeId} with reputation ${participant.reputationScore}`);
        this.emit('participantRegistered', participant);
    }
    /**
     * Unregisters a participant
     */
    unregisterParticipant(nodeId) {
        this.participants.delete(nodeId);
        this.logger.info(`Unregistered participant: ${nodeId}`);
        this.emit('participantUnregistered', nodeId);
    }
    /**
     * Starts a new aggregation round
     */
    startAggregationRound(config) {
        const roundId = `round_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const participants = this.selectParticipants(config);
        const round = {
            roundId,
            algorithm: config.algorithm,
            participants,
            modelVersion: this.globalModelVersion,
            startTime: Date.now(),
            status: 'active'
        };
        this.activeRounds.set(roundId, round);
        this.logger.info(`Started aggregation round ${roundId} with ${participants.length} participants`);
        this.emit('roundStarted', round);
        return roundId;
    }
    /**
     * Submits a gradient update from a participant
     */
    async submitGradientUpdate(nodeId, gradients, roundId) {
        const round = this.activeRounds.get(roundId);
        if (!round || round.status !== 'active') {
            throw new Error(`Invalid or inactive round: ${roundId}`);
        }
        if (!round.participants.includes(nodeId)) {
            throw new Error(`Participant ${nodeId} not in round ${roundId}`);
        }
        const participant = this.participants.get(nodeId);
        if (!participant) {
            throw new Error(`Unknown participant: ${nodeId}`);
        }
        // Apply differential privacy if configured
        let processedGradients = gradients.gradients;
        if (gradients.noiseScale) {
            processedGradients = this.dp.addGaussianNoise(gradients.gradients, participant.privacyBudget.epsilon, participant.privacyBudget.delta);
        }
        // Update participant's privacy budget
        const updatedBudget = this.dp.updatePrivacyBudget(participant.privacyBudget, participant.privacyBudget.epsilon, // Simplified - should calculate actual epsilon used
        participant.privacyBudget.delta);
        participant.privacyBudget = updatedBudget;
        this.logger.debug(`Received gradient update from ${nodeId} for round ${roundId}`);
        this.emit('gradientUpdateReceived', { nodeId, gradients: processedGradients, roundId });
        // Check if round is complete
        this.checkRoundCompletion(roundId);
    }
    /**
     * Submits a model update from a participant
     */
    async submitModelUpdate(nodeId, modelUpdate, roundId) {
        const round = this.activeRounds.get(roundId);
        if (!round || round.status !== 'active') {
            throw new Error(`Invalid or inactive round: ${roundId}`);
        }
        if (!round.participants.includes(nodeId)) {
            throw new Error(`Participant ${nodeId} not in round ${roundId}`);
        }
        this.logger.debug(`Received model update from ${nodeId} for round ${roundId}`);
        this.emit('modelUpdateReceived', { nodeId, modelUpdate, roundId });
        // Check if round is complete
        this.checkRoundCompletion(roundId);
    }
    /**
     * Gets the current global model
     */
    getGlobalModel() {
        // Return a placeholder - in practice, this would be stored persistently
        return {
            modelVersion: this.globalModelVersion,
            weights: {},
            metadata: {
                accuracy: 0.85,
                loss: 0.3,
                epoch: 100,
                datasetSize: 10000
            }
        };
    }
    /**
     * Gets active aggregation rounds
     */
    getActiveRounds() {
        return Array.from(this.activeRounds.values()).filter(round => round.status === 'active');
    }
    /**
     * Gets registered participants
     */
    getParticipants() {
        return Array.from(this.participants.values());
    }
    /**
     * Updates participant reputation
     */
    updateParticipantReputation(nodeId, reputationChange) {
        const participant = this.participants.get(nodeId);
        if (participant) {
            participant.reputationScore = Math.max(0, Math.min(1, participant.reputationScore + reputationChange));
            participant.lastContribution = Date.now();
            participant.contributionCount++;
            this.logger.debug(`Updated reputation for ${nodeId}: ${participant.reputationScore}`);
        }
    }
    /**
     * Selects participants for a round based on reputation and availability
     */
    selectParticipants(config) {
        const eligibleParticipants = Array.from(this.participants.values())
            .filter(p => p.status === 'active' && p.reputationScore > 0.5)
            .sort((a, b) => b.reputationScore - a.reputationScore);
        const numParticipants = Math.min(config.maxParticipants, eligibleParticipants.length);
        return eligibleParticipants.slice(0, numParticipants).map(p => p.nodeId);
    }
    /**
     * Checks if an aggregation round is complete and triggers aggregation
     */
    checkRoundCompletion(roundId) {
        // Simplified - in practice, track received updates per participant
        const round = this.activeRounds.get(roundId);
        if (!round)
            return;
        // Placeholder: assume round is complete after receiving updates from all participants
        // In practice, implement proper tracking of received updates
        const isComplete = Math.random() > 0.7; // Simulate completion check
        if (isComplete) {
            this.completeRound(roundId);
        }
    }
    /**
     * Completes an aggregation round
     */
    completeRound(roundId) {
        const round = this.activeRounds.get(roundId);
        if (!round)
            return;
        round.status = 'completed';
        round.endTime = Date.now();
        // Generate aggregated model (simplified)
        const aggregatedModel = {
            modelVersion: `v${parseInt(this.globalModelVersion.split('.')[0]) + 1}.0.0`,
            weights: {}, // Would contain actual aggregated weights
            metadata: {
                accuracy: 0.87,
                loss: 0.25,
                epoch: 101,
                datasetSize: 10000
            }
        };
        round.aggregatedModel = aggregatedModel;
        this.globalModelVersion = aggregatedModel.modelVersion;
        this.logger.info(`Completed aggregation round ${roundId}`);
        this.emit('roundCompleted', round);
        // Update participant reputations
        round.participants.forEach(nodeId => {
            this.updateParticipantReputation(nodeId, 0.05); // Small positive reward
        });
    }
}
exports.FederatedLearningCoordinator = FederatedLearningCoordinator;
//# sourceMappingURL=FederatedLearningCoordinator.js.map