// Import types from federation module (will be available at runtime)
export var RoutingAlgorithm;
(function (RoutingAlgorithm) {
    RoutingAlgorithm["ROUND_ROBIN"] = "round_robin";
    RoutingAlgorithm["LEAST_CONNECTIONS"] = "least_connections";
    RoutingAlgorithm["WEIGHTED_ROUND_ROBIN"] = "weighted_round_robin";
    RoutingAlgorithm["LEAST_RESPONSE_TIME"] = "least_response_time";
    RoutingAlgorithm["GEOGRAPHIC"] = "geographic";
    RoutingAlgorithm["ADAPTIVE"] = "adaptive";
})(RoutingAlgorithm || (RoutingAlgorithm = {}));
export var LoadBalancingStrategy;
(function (LoadBalancingStrategy) {
    LoadBalancingStrategy["RANDOM"] = "random";
    LoadBalancingStrategy["ROUND_ROBIN"] = "round_robin";
    LoadBalancingStrategy["LEAST_CONNECTIONS"] = "least_connections";
    LoadBalancingStrategy["IP_HASH"] = "ip_hash";
    LoadBalancingStrategy["WEIGHTED"] = "weighted";
})(LoadBalancingStrategy || (LoadBalancingStrategy = {}));
export var GlobalCapability;
(function (GlobalCapability) {
    GlobalCapability["ROUTING"] = "routing";
    GlobalCapability["SCALING"] = "scaling";
    GlobalCapability["FAILOVER"] = "failover";
    GlobalCapability["MONITORING"] = "monitoring";
    GlobalCapability["FEDERATION_COORDINATION"] = "federation_coordination";
    GlobalCapability["LOAD_BALANCING"] = "load_balancing";
})(GlobalCapability || (GlobalCapability = {}));
export var HealthStatus;
(function (HealthStatus) {
    HealthStatus["HEALTHY"] = "healthy";
    HealthStatus["DEGRADED"] = "degraded";
    HealthStatus["UNHEALTHY"] = "unhealthy";
    HealthStatus["UNKNOWN"] = "unknown";
})(HealthStatus || (HealthStatus = {}));
export var ScalingAction;
(function (ScalingAction) {
    ScalingAction["SCALE_UP"] = "scale_up";
    ScalingAction["SCALE_DOWN"] = "scale_down";
    ScalingAction["NO_ACTION"] = "no_action";
})(ScalingAction || (ScalingAction = {}));
export var FailoverType;
(function (FailoverType) {
    FailoverType["AUTOMATIC"] = "automatic";
    FailoverType["MANUAL"] = "manual";
    FailoverType["RECOVERY"] = "recovery";
})(FailoverType || (FailoverType = {}));
export class ConsoleLogger {
    constructor(prefix = '[GlobalOrchestrator]') {
        this.prefix = prefix;
    }
    info(message, meta) {
        console.log(`${this.prefix} ${new Date().toISOString()} INFO: ${message}`, meta || '');
    }
    warn(message, meta) {
        console.warn(`${this.prefix} ${new Date().toISOString()} WARN: ${message}`, meta || '');
    }
    error(message, error, meta) {
        console.error(`${this.prefix} ${new Date().toISOString()} ERROR: ${message}`, error?.stack || error || '', meta || '');
    }
    debug(message, meta) {
        if (process.env.NODE_ENV === 'development') {
            console.debug(`${this.prefix} ${new Date().toISOString()} DEBUG: ${message}`, meta || '');
        }
    }
}
export class GlobalOrchestratorError extends Error {
    constructor(code, message, nodeId, federationId, details) {
        super(message);
        this.name = 'GlobalOrchestratorError';
        this.code = code;
        this.nodeId = nodeId;
        this.federationId = federationId;
        this.details = details;
    }
}
export var GlobalOrchestratorErrorCode;
(function (GlobalOrchestratorErrorCode) {
    GlobalOrchestratorErrorCode["DISCOVERY_FAILED"] = "DISCOVERY_FAILED";
    GlobalOrchestratorErrorCode["HEALTH_CHECK_FAILED"] = "HEALTH_CHECK_FAILED";
    GlobalOrchestratorErrorCode["ROUTING_FAILED"] = "ROUTING_FAILED";
    GlobalOrchestratorErrorCode["SCALING_FAILED"] = "SCALING_FAILED";
    GlobalOrchestratorErrorCode["FAILOVER_FAILED"] = "FAILOVER_FAILED";
    GlobalOrchestratorErrorCode["CONFIGURATION_ERROR"] = "CONFIGURATION_ERROR";
    GlobalOrchestratorErrorCode["FEDERATION_INTEGRATION_ERROR"] = "FEDERATION_INTEGRATION_ERROR";
    GlobalOrchestratorErrorCode["REDIS_CONNECTION_ERROR"] = "REDIS_CONNECTION_ERROR";
})(GlobalOrchestratorErrorCode || (GlobalOrchestratorErrorCode = {}));
export var QualityOfService;
(function (QualityOfService) {
    QualityOfService["BEST_EFFORT"] = "best_effort";
    QualityOfService["RELIABLE"] = "reliable";
    QualityOfService["REAL_TIME"] = "real_time";
})(QualityOfService || (QualityOfService = {}));
export var FederationStatus;
(function (FederationStatus) {
    FederationStatus["ACTIVE"] = "active";
    FederationStatus["INACTIVE"] = "inactive";
    FederationStatus["MAINTENANCE"] = "maintenance";
    FederationStatus["ERROR"] = "error";
})(FederationStatus || (FederationStatus = {}));
export var FailoverStrategy;
(function (FailoverStrategy) {
    FailoverStrategy["AUTOMATIC"] = "automatic";
    FailoverStrategy["MANUAL"] = "manual";
    FailoverStrategy["LOAD_BALANCED"] = "load_balanced";
})(FailoverStrategy || (FailoverStrategy = {}));
//# sourceMappingURL=index.js.map