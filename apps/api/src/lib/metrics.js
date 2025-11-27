"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rateLimitHits = exports.learningRewards = exports.connectorRequestDuration = exports.connectorRequestsTotal = exports.dbConnectionsActive = exports.dbQueryDuration = exports.httpRequestDuration = exports.httpRequestsTotal = exports.queueJobsPending = exports.queueJobsCompleted = exports.queueJobsAdded = exports.circuitBreakerState = exports.circuitBreakerFailures = exports.toolExecutionDuration = exports.toolExecutionsTotal = exports.agentRunDuration = exports.agentRunsTotal = exports.register = void 0;
exports.recordAgentRun = recordAgentRun;
exports.recordCircuitBreakerFailure = recordCircuitBreakerFailure;
exports.setCircuitBreakerState = setCircuitBreakerState;
exports.recordHttpRequest = recordHttpRequest;
exports.recordQueueJob = recordQueueJob;
exports.updateQueuePending = updateQueuePending;
exports.recordConnectorRequest = recordConnectorRequest;
exports.recordRateLimitHit = recordRateLimitHit;
exports.recordToolExecutionMetric = recordToolExecutionMetric;
exports.recordLearningReward = recordLearningReward;
exports.getMetrics = getMetrics;
var prom_client_1 = require("prom-client");
var logger_js_1 = require("./logger.js");
// Create a Registry to hold all metrics
exports.register = new prom_client_1.Registry();
// Collect default metrics (CPU, memory, event loop, etc.)
(0, prom_client_1.collectDefaultMetrics)({ register: exports.register, prefix: "neonhub_" });
// Agent Run Metrics
exports.agentRunsTotal = new prom_client_1.Counter({
    name: "neonhub_agent_runs_total",
    help: "Total number of agent runs",
    labelNames: ["agent", "status", "intent"],
    registers: [exports.register],
});
exports.agentRunDuration = new prom_client_1.Histogram({
    name: "neonhub_agent_run_duration_seconds",
    help: "Duration of agent runs in seconds",
    labelNames: ["agent", "intent"],
    buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60], // seconds
    registers: [exports.register],
});
exports.toolExecutionsTotal = new prom_client_1.Counter({
    name: "neonhub_tool_executions_total",
    help: "Total number of tool executions",
    labelNames: ["tool", "status"],
    registers: [exports.register],
});
exports.toolExecutionDuration = new prom_client_1.Histogram({
    name: "neonhub_tool_execution_duration_seconds",
    help: "Duration of tool executions in seconds",
    labelNames: ["tool", "status"],
    buckets: [0.05, 0.1, 0.25, 0.5, 1, 2, 5],
    registers: [exports.register],
});
// Circuit Breaker Metrics
exports.circuitBreakerFailures = new prom_client_1.Counter({
    name: "neonhub_circuit_breaker_failures_total",
    help: "Total number of circuit breaker failures",
    labelNames: ["agent"],
    registers: [exports.register],
});
exports.circuitBreakerState = new prom_client_1.Gauge({
    name: "neonhub_circuit_breaker_state",
    help: "Current state of circuit breaker (0=closed, 1=open)",
    labelNames: ["agent"],
    registers: [exports.register],
});
// Queue Metrics
exports.queueJobsAdded = new prom_client_1.Counter({
    name: "neonhub_queue_jobs_added_total",
    help: "Total number of jobs added to queues",
    labelNames: ["queue"],
    registers: [exports.register],
});
exports.queueJobsCompleted = new prom_client_1.Counter({
    name: "neonhub_queue_jobs_completed_total",
    help: "Total number of jobs completed",
    labelNames: ["queue", "status"],
    registers: [exports.register],
});
exports.queueJobsPending = new prom_client_1.Gauge({
    name: "neonhub_queue_jobs_pending",
    help: "Number of pending jobs in queue",
    labelNames: ["queue"],
    registers: [exports.register],
});
// HTTP Request Metrics
exports.httpRequestsTotal = new prom_client_1.Counter({
    name: "neonhub_http_requests_total",
    help: "Total number of HTTP requests",
    labelNames: ["method", "route", "status"],
    registers: [exports.register],
});
exports.httpRequestDuration = new prom_client_1.Histogram({
    name: "neonhub_http_request_duration_seconds",
    help: "Duration of HTTP requests in seconds",
    labelNames: ["method", "route", "status"],
    buckets: [0.001, 0.01, 0.1, 0.5, 1, 2, 5],
    registers: [exports.register],
});
// Database Metrics
exports.dbQueryDuration = new prom_client_1.Histogram({
    name: "neonhub_db_query_duration_seconds",
    help: "Duration of database queries in seconds",
    labelNames: ["operation"],
    buckets: [0.001, 0.01, 0.05, 0.1, 0.5, 1, 2],
    registers: [exports.register],
});
exports.dbConnectionsActive = new prom_client_1.Gauge({
    name: "neonhub_db_connections_active",
    help: "Number of active database connections",
    registers: [exports.register],
});
// Connector Metrics
exports.connectorRequestsTotal = new prom_client_1.Counter({
    name: "neonhub_connector_requests_total",
    help: "Total number of connector requests",
    labelNames: ["connector", "status"],
    registers: [exports.register],
});
exports.connectorRequestDuration = new prom_client_1.Histogram({
    name: "neonhub_connector_request_duration_seconds",
    help: "Duration of connector requests in seconds",
    labelNames: ["connector"],
    buckets: [0.1, 0.5, 1, 2, 5, 10],
    registers: [exports.register],
});
exports.learningRewards = new prom_client_1.Gauge({
    name: "neonhub_learning_reward",
    help: "Latest reward recorded per agent",
    labelNames: ["agent"],
    registers: [exports.register],
});
// Rate Limiter Metrics
exports.rateLimitHits = new prom_client_1.Counter({
    name: "neonhub_rate_limit_hits_total",
    help: "Total number of rate limit hits",
    labelNames: ["agent", "user"],
    registers: [exports.register],
});
// Helper functions for common operations
function recordAgentRun(agent, status, durationSeconds, intent) {
    var normalized = status === "SUCCESS"
        ? "completed"
        : status === "FAILED"
            ? "failed"
            : status === "CANCELLED"
                ? "cancelled"
                : "completed";
    exports.agentRunsTotal.inc({ agent: agent, status: normalized, intent: intent || "unknown" });
    exports.agentRunDuration.observe({ agent: agent, intent: intent || "unknown" }, durationSeconds);
    logger_js_1.logger.debug({ agent: agent, status: normalized, durationSeconds: durationSeconds, intent: intent }, "Recorded agent run metrics");
}
function recordCircuitBreakerFailure(agent) {
    exports.circuitBreakerFailures.inc({ agent: agent });
    logger_js_1.logger.warn({ agent: agent }, "Circuit breaker failure recorded");
}
function setCircuitBreakerState(agent, isOpen) {
    exports.circuitBreakerState.set({ agent: agent }, isOpen ? 1 : 0);
}
function recordHttpRequest(method, route, status, durationSeconds) {
    exports.httpRequestsTotal.inc({ method: method, route: route, status: status.toString() });
    exports.httpRequestDuration.observe({ method: method, route: route, status: status.toString() }, durationSeconds);
}
function recordQueueJob(queue, operation) {
    if (operation === "added") {
        exports.queueJobsAdded.inc({ queue: queue });
    }
    else {
        exports.queueJobsCompleted.inc({ queue: queue, status: operation });
    }
}
function updateQueuePending(queue, count) {
    exports.queueJobsPending.set({ queue: queue }, count);
}
function recordConnectorRequest(connector, status, durationSeconds) {
    exports.connectorRequestsTotal.inc({ connector: connector, status: status });
    exports.connectorRequestDuration.observe({ connector: connector }, durationSeconds);
}
function recordRateLimitHit(agent, user) {
    exports.rateLimitHits.inc({ agent: agent, user: user });
}
function recordToolExecutionMetric(tool, status, durationSeconds) {
    exports.toolExecutionsTotal.inc({ tool: tool, status: status });
    exports.toolExecutionDuration.observe({ tool: tool, status: status }, durationSeconds);
}
function recordLearningReward(agent, reward) {
    if (typeof reward === "number") {
        exports.learningRewards.set({ agent: agent }, reward);
    }
    else {
        exports.learningRewards.set({ agent: agent }, 0);
    }
}
// Get all metrics as string (for /metrics endpoint)
function getMetrics() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, exports.register.metrics()];
        });
    });
}
logger_js_1.logger.info("Prometheus metrics initialized");
