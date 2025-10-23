export var FederationMessageType;
(function (FederationMessageType) {
    FederationMessageType["HEARTBEAT"] = "heartbeat";
    FederationMessageType["MODEL_UPDATE"] = "model_update";
    FederationMessageType["GRADIENT_UPDATE"] = "gradient_update";
    FederationMessageType["MODEL_AGGREGATION"] = "model_aggregation";
    FederationMessageType["PRIVACY_BUDGET_UPDATE"] = "privacy_budget_update";
    FederationMessageType["PARTICIPANT_REGISTRATION"] = "participant_registration";
    FederationMessageType["POISONING_DETECTION"] = "poisoning_detection";
    FederationMessageType["KEY_EXCHANGE"] = "key_exchange";
    FederationMessageType["SECURE_COMPUTATION"] = "secure_computation";
    FederationMessageType["DATA_SHARING"] = "data_sharing";
    FederationMessageType["COORDINATION"] = "coordination";
    FederationMessageType["HEALTH_CHECK"] = "health_check";
    FederationMessageType["ERROR_REPORT"] = "error_report";
    FederationMessageType["METRICS_REPORT"] = "metrics_report";
    FederationMessageType["CONFIG_UPDATE"] = "config_update";
    // AIX Protocol Messages
    FederationMessageType["MODEL_SUMMARY_EXCHANGE"] = "model_summary_exchange";
    FederationMessageType["INTELLIGENCE_SHARING_REQUEST"] = "intelligence_sharing_request";
    FederationMessageType["KNOWLEDGE_DISTILLATION"] = "knowledge_distillation";
    FederationMessageType["INTELLIGENCE_AGGREGATION"] = "intelligence_aggregation";
    FederationMessageType["MODEL_VERSION_CHECK"] = "model_version_check";
    FederationMessageType["PRIVACY_POLICY_UPDATE"] = "privacy_policy_update";
    FederationMessageType["MARKETPLACE_BID"] = "marketplace_bid";
    FederationMessageType["MODEL_EVALUATION_REQUEST"] = "model_evaluation_request";
    FederationMessageType["EVALUATION_RESULT"] = "evaluation_result";
    FederationMessageType["COMPRESSION_NEGOTIATION"] = "compression_negotiation";
})(FederationMessageType || (FederationMessageType = {}));
export var MessagePriority;
(function (MessagePriority) {
    MessagePriority[MessagePriority["LOW"] = 0] = "LOW";
    MessagePriority[MessagePriority["NORMAL"] = 1] = "NORMAL";
    MessagePriority[MessagePriority["HIGH"] = 2] = "HIGH";
    MessagePriority[MessagePriority["CRITICAL"] = 3] = "CRITICAL";
})(MessagePriority || (MessagePriority = {}));
export var NodeCapability;
(function (NodeCapability) {
    NodeCapability["MODEL_TRAINING"] = "model_training";
    NodeCapability["DATA_PROCESSING"] = "data_processing";
    NodeCapability["COORDINATION"] = "coordination";
    NodeCapability["STORAGE"] = "storage";
    NodeCapability["COMPUTE"] = "compute";
    NodeCapability["FEDERATED_LEARNING"] = "federated_learning";
    NodeCapability["SECURE_COMPUTATION"] = "secure_computation";
    NodeCapability["HOMOMORPHIC_ENCRYPTION"] = "homomorphic_encryption";
})(NodeCapability || (NodeCapability = {}));
export var NodeStatus;
(function (NodeStatus) {
    NodeStatus["ONLINE"] = "online";
    NodeStatus["OFFLINE"] = "offline";
    NodeStatus["MAINTENANCE"] = "maintenance";
    NodeStatus["ERROR"] = "error";
})(NodeStatus || (NodeStatus = {}));
export class FederationError extends Error {
    constructor(code, message, nodeId, messageId, details) {
        super(message);
        this.name = 'FederationError';
        this.code = code;
        this.nodeId = nodeId;
        this.messageId = messageId;
        this.details = details;
    }
}
export var FederationErrorCode;
(function (FederationErrorCode) {
    FederationErrorCode["CONNECTION_FAILED"] = "CONNECTION_FAILED";
    FederationErrorCode["AUTHENTICATION_FAILED"] = "AUTHENTICATION_FAILED";
    FederationErrorCode["AUTHORIZATION_FAILED"] = "AUTHORIZATION_FAILED";
    FederationErrorCode["MESSAGE_TIMEOUT"] = "MESSAGE_TIMEOUT";
    FederationErrorCode["INVALID_MESSAGE"] = "INVALID_MESSAGE";
    FederationErrorCode["NODE_UNAVAILABLE"] = "NODE_UNAVAILABLE";
    FederationErrorCode["TLS_ERROR"] = "TLS_ERROR";
    FederationErrorCode["POOL_EXHAUSTED"] = "POOL_EXHAUSTED";
    FederationErrorCode["HEALTH_CHECK_FAILED"] = "HEALTH_CHECK_FAILED";
})(FederationErrorCode || (FederationErrorCode = {}));
export var ParticipantStatus;
(function (ParticipantStatus) {
    ParticipantStatus["ACTIVE"] = "active";
    ParticipantStatus["SUSPENDED"] = "suspended";
    ParticipantStatus["BLACKLISTED"] = "blacklisted";
})(ParticipantStatus || (ParticipantStatus = {}));
export var IntelligenceAggregationAlgorithm;
(function (IntelligenceAggregationAlgorithm) {
    IntelligenceAggregationAlgorithm["FED_AVG"] = "fed_avg";
    IntelligenceAggregationAlgorithm["FED_PROX"] = "fed_prox";
    IntelligenceAggregationAlgorithm["SECURE_AGGREGATION"] = "secure_aggregation";
    IntelligenceAggregationAlgorithm["ENSEMBLE_AVERAGE"] = "ensemble_average";
    IntelligenceAggregationAlgorithm["STACKED_GENERALIZATION"] = "stacked_generalization";
    IntelligenceAggregationAlgorithm["META_LEARNING_AGGREGATION"] = "meta_learning_aggregation";
})(IntelligenceAggregationAlgorithm || (IntelligenceAggregationAlgorithm = {}));
export var SecureComputationProtocol;
(function (SecureComputationProtocol) {
    SecureComputationProtocol["SECRET_SHARING"] = "secret_sharing";
    SecureComputationProtocol["HOMOMORPHIC_ENCRYPTION"] = "homomorphic_encryption";
    SecureComputationProtocol["MULTI_PARTY_COMPUTATION"] = "multi_party_computation";
})(SecureComputationProtocol || (SecureComputationProtocol = {}));
export var KeyPurpose;
(function (KeyPurpose) {
    KeyPurpose["HOMOMORPHIC_ENCRYPTION"] = "homomorphic_encryption";
    KeyPurpose["SECURE_AGGREGATION"] = "secure_aggregation";
    KeyPurpose["SIGNATURE_VERIFICATION"] = "signature_verification";
})(KeyPurpose || (KeyPurpose = {}));
export var IntelligenceSharingType;
(function (IntelligenceSharingType) {
    IntelligenceSharingType["MODEL_SUMMARY"] = "model_summary";
    IntelligenceSharingType["GRADIENTS"] = "gradients";
    IntelligenceSharingType["WEIGHTS"] = "weights";
    IntelligenceSharingType["KNOWLEDGE_DISTILLATION"] = "knowledge_distillation";
    IntelligenceSharingType["ENSEMBLE_VOTING"] = "ensemble_voting";
    IntelligenceSharingType["META_LEARNING"] = "meta_learning";
})(IntelligenceSharingType || (IntelligenceSharingType = {}));
export var PrivacyLevel;
(function (PrivacyLevel) {
    PrivacyLevel["PUBLIC"] = "public";
    PrivacyLevel["RESTRICTED"] = "restricted";
    PrivacyLevel["PRIVATE"] = "private";
    PrivacyLevel["CONFIDENTIAL"] = "confidential";
})(PrivacyLevel || (PrivacyLevel = {}));
export var AIXMessageType;
(function (AIXMessageType) {
    AIXMessageType["MODEL_SUMMARY_EXCHANGE"] = "model_summary_exchange";
    AIXMessageType["INTELLIGENCE_SHARING_REQUEST"] = "intelligence_sharing_request";
    AIXMessageType["KNOWLEDGE_DISTILLATION"] = "knowledge_distillation";
    AIXMessageType["INTELLIGENCE_AGGREGATION"] = "intelligence_aggregation";
    AIXMessageType["MODEL_VERSION_CHECK"] = "model_version_check";
    AIXMessageType["PRIVACY_POLICY_UPDATE"] = "privacy_policy_update";
    AIXMessageType["MARKETPLACE_BID"] = "marketplace_bid";
    AIXMessageType["MODEL_EVALUATION_REQUEST"] = "model_evaluation_request";
    AIXMessageType["EVALUATION_RESULT"] = "evaluation_result";
    AIXMessageType["COMPRESSION_NEGOTIATION"] = "compression_negotiation";
})(AIXMessageType || (AIXMessageType = {}));
export var CompressionAlgorithm;
(function (CompressionAlgorithm) {
    CompressionAlgorithm["QUANTIZATION"] = "quantization";
    CompressionAlgorithm["PRUNING"] = "pruning";
    CompressionAlgorithm["DISTILLATION"] = "distillation";
    CompressionAlgorithm["SPARSE_CODING"] = "sparse_coding";
    CompressionAlgorithm["LOW_RANK_APPROXIMATION"] = "low_rank_approximation";
})(CompressionAlgorithm || (CompressionAlgorithm = {}));
//# sourceMappingURL=index.js.map