"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
exports.route = route;
exports.__resetOrchestratorState = __resetOrchestratorState;
var client_1 = require("@prisma/client");
var logger_js_1 = require("../../lib/logger.js");
var registry_js_1 = require("./registry.js");
var policies_js_1 = require("./policies.js");
var bootstrap_js_1 = require("./bootstrap.js");
var agent_run_js_1 = require("../../agents/utils/agent-run.js");
var prisma_js_1 = require("../../db/prisma.js");
var metrics_js_1 = require("../../lib/metrics.js");
var intents_js_1 = require("./intents.js");
var circuitMap = new Map();
var rateState = new Map();
var RATE_LIMIT_PER_MINUTE = 60;
var RATE_WINDOW_MS = 60000;
function startSpan(name) {
    var _a, _b, _c;
    var globalAny = globalThis;
    var tracer = (_c = (_b = (_a = globalAny === null || globalAny === void 0 ? void 0 : globalAny.otel) === null || _a === void 0 ? void 0 : _a.trace) === null || _b === void 0 ? void 0 : _b.getTracer) === null || _c === void 0 ? void 0 : _c.call(_b, "neonhub");
    if (tracer) {
        var span_1 = tracer.startSpan(name);
        return {
            span: span_1,
            end: function (error) {
                if (error instanceof Error) {
                    span_1.recordException(error);
                    span_1.setStatus({ code: 2, message: error.message }); // 2 = ERROR
                }
                span_1.end();
            }
        };
    }
    var startedAt = Date.now();
    return {
        span: null,
        end: function (error) {
            var duration = Date.now() - startedAt;
            if (error) {
                logger_js_1.logger.error({ duration: duration, error: error }, "Orchestrator span completed with error");
            }
            else {
                logger_js_1.logger.debug({ duration: duration }, "Orchestrator span completed");
            }
        }
    };
}
function ensureAuthorized(req) {
    var userId = req.context && typeof req.context.userId === "string" ? req.context.userId : undefined;
    if (!userId) {
        return { ok: false, error: "unauthorized", code: "UNAUTHENTICATED" };
    }
    return undefined;
}
function enforceRateLimit(agent, userId) {
    var key = "".concat(agent, ":").concat(userId);
    var now = Date.now();
    var entry = rateState.get(key);
    if (!entry || now > entry.resetAt) {
        rateState.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
        return undefined;
    }
    if (entry.count >= RATE_LIMIT_PER_MINUTE) {
        // Record rate limit hit in metrics
        (0, metrics_js_1.recordRateLimitHit)(agent, userId);
        return { ok: false, error: "rate_limited", code: "RATE_LIMITED" };
    }
    entry.count += 1;
    return undefined;
}
function getCircuit(agent, handler) {
    var _this = this;
    var existing = circuitMap.get(agent);
    if (existing) {
        return existing;
    }
    var wrapped = (0, policies_js_1.withCircuitBreaker)(function (request) { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
        return [2 /*return*/, handler.handle(request)];
    }); }); }, { failThreshold: 3, cooldownMs: 10000 });
    circuitMap.set(agent, wrapped);
    return wrapped;
}
function attachMeta(response, meta) {
    var _a, _b, _c, _d;
    if (meta === void 0) { meta = {}; }
    if (!meta.agent && !meta.intent && !meta.runId && !meta.metrics) {
        return response;
    }
    return __assign(__assign({}, response), { meta: __assign(__assign(__assign({}, ((_a = response.meta) !== null && _a !== void 0 ? _a : {})), meta), { metrics: __assign(__assign({}, ((_c = (_b = response.meta) === null || _b === void 0 ? void 0 : _b.metrics) !== null && _c !== void 0 ? _c : {})), ((_d = meta.metrics) !== null && _d !== void 0 ? _d : {})) }) });
}
function route(req) {
    return __awaiter(this, void 0, void 0, function () {
        var agentName, span, intentResolution, expectedAgent, registryEntry_1, authResult, userId, rateLimitResult, organizationId, executor, normalizedRequest, response_1, dbAgent, startTime, resolvedRequest_1, _a, runId, response, durationSeconds, status_1, enriched, error_1, fallbackAgent;
        var _this = this;
        var _b, _c, _d, _e, _f;
        return __generator(this, function (_g) {
            switch (_g.label) {
                case 0:
                    span = startSpan("orchestrator.".concat((_b = req.agent) !== null && _b !== void 0 ? _b : "unknown", ".").concat(req.intent));
                    _g.label = 1;
                case 1:
                    _g.trys.push([1, 9, , 10]);
                    return [4 /*yield*/, (0, bootstrap_js_1.ensureOrchestratorBootstrap)()];
                case 2:
                    _g.sent();
                    intentResolution = (0, intents_js_1.resolveAgentForIntent)(req.intent, req.agent);
                    if (!intentResolution.ok) {
                        if ("reason" in intentResolution && intentResolution.reason === "AGENT_REQUIRED") {
                            return [2 /*return*/, attachMeta({ ok: false, error: "agent_required_for_intent", code: "AGENT_REQUIRED" }, { intent: req.intent })];
                        }
                        if ("reason" in intentResolution && intentResolution.reason === "INTENT_AGENT_MISMATCH") {
                            expectedAgent = "expected" in intentResolution ? intentResolution.expected : req.agent;
                            return [2 /*return*/, attachMeta({
                                    ok: false,
                                    error: "Intent ".concat(req.intent, " must run on ").concat(expectedAgent !== null && expectedAgent !== void 0 ? expectedAgent : "registered agent"),
                                    code: "INTENT_AGENT_MISMATCH",
                                }, { intent: req.intent, agent: expectedAgent })];
                        }
                        return [2 /*return*/, attachMeta({ ok: false, error: "intent_resolution_failed", code: "INTENT_RESOLUTION_FAILED" }, { intent: req.intent })];
                    }
                    agentName = intentResolution.agent;
                    registryEntry_1 = (0, registry_js_1.getAgent)(agentName);
                    if (!registryEntry_1) {
                        return [2 /*return*/, attachMeta({ ok: false, error: "agent_not_registered", code: "AGENT_NOT_REGISTERED" }, { agent: agentName, intent: req.intent })];
                    }
                    authResult = ensureAuthorized(req);
                    if (authResult) {
                        return [2 /*return*/, attachMeta(authResult, { agent: agentName, intent: req.intent })];
                    }
                    userId = (_c = req.context) === null || _c === void 0 ? void 0 : _c.userId;
                    rateLimitResult = enforceRateLimit(agentName, userId);
                    if (rateLimitResult) {
                        return [2 /*return*/, attachMeta(rateLimitResult, { agent: agentName, intent: req.intent })];
                    }
                    organizationId = (_d = req.context) === null || _d === void 0 ? void 0 : _d.organizationId;
                    if (!!organizationId) return [3 /*break*/, 4];
                    logger_js_1.logger.warn({ agent: agentName }, "No organizationId in context, skipping AgentRun persistence");
                    executor = (0, policies_js_1.withRetry)(getCircuit(agentName, registryEntry_1.handler), {
                        maxAttempts: 3,
                        baseDelayMs: 75
                    });
                    normalizedRequest = __assign(__assign({}, req), { agent: agentName });
                    return [4 /*yield*/, executor(normalizedRequest)];
                case 3:
                    response_1 = _g.sent();
                    span.end();
                    return [2 /*return*/, attachMeta(response_1, { agent: agentName, intent: req.intent })];
                case 4: return [4 /*yield*/, prisma_js_1.prisma.agent.findFirst({
                        where: {
                            organizationId: organizationId,
                            name: agentName,
                        }
                    })];
                case 5:
                    dbAgent = _g.sent();
                    if (!!dbAgent) return [3 /*break*/, 7];
                    return [4 /*yield*/, prisma_js_1.prisma.agent.create({
                            data: {
                                organization: { connect: { id: organizationId } },
                                name: agentName,
                                slug: agentName.toLowerCase().replace(/agent$/i, ''),
                                kind: "COPILOT", // Default, should be properly typed
                                status: "ACTIVE",
                                description: "Auto-created agent for ".concat(agentName),
                                config: {},
                            }
                        })];
                case 6:
                    // Create agent record if it doesn't exist
                    dbAgent = _g.sent();
                    logger_js_1.logger.info({ agentId: dbAgent.id, agentName: agentName }, "Created new agent record");
                    _g.label = 7;
                case 7:
                    startTime = Date.now();
                    resolvedRequest_1 = __assign(__assign({}, req), { agent: agentName });
                    return [4 /*yield*/, (0, agent_run_js_1.executeAgentRun)(dbAgent.id, {
                            organizationId: organizationId,
                            userId: userId,
                            prisma: prisma_js_1.prisma,
                            agentName: (_e = dbAgent.name) !== null && _e !== void 0 ? _e : agentName,
                        }, resolvedRequest_1.payload, function () { return __awaiter(_this, void 0, void 0, function () {
                            var executor;
                            return __generator(this, function (_a) {
                                executor = (0, policies_js_1.withRetry)(getCircuit(agentName, registryEntry_1.handler), {
                                    maxAttempts: 3,
                                    baseDelayMs: 75,
                                });
                                return [2 /*return*/, executor(resolvedRequest_1)];
                            });
                        }); }, {
                            intent: req.intent,
                            buildMetrics: function (result) { return ({
                                agent: agentName,
                                intent: req.intent,
                                responseOk: result.ok,
                            }); },
                            emitTelemetry: false,
                        })];
                case 8:
                    _a = _g.sent(), runId = _a.runId, response = _a.result;
                    durationSeconds = (Date.now() - startTime) / 1000;
                    status_1 = response.ok ? client_1.RunStatus.SUCCESS : client_1.RunStatus.FAILED;
                    (0, metrics_js_1.recordAgentRun)(agentName, status_1, durationSeconds, req.intent);
                    enriched = attachMeta(response, {
                        agent: agentName,
                        intent: req.intent,
                        runId: runId,
                        metrics: { durationSeconds: durationSeconds },
                    });
                    logger_js_1.logger.info({ runId: runId, agent: agentName, intent: req.intent, durationSeconds: durationSeconds }, "Agent run completed with persistence");
                    if (!response.ok) {
                        logger_js_1.logger.warn({ runId: runId, agent: agentName, intent: req.intent, error: response.error }, "Agent responded with error");
                    }
                    span.end();
                    return [2 /*return*/, enriched];
                case 9:
                    error_1 = _g.sent();
                    span.end(error_1);
                    fallbackAgent = (_f = agentName !== null && agentName !== void 0 ? agentName : req.agent) !== null && _f !== void 0 ? _f : "unknown";
                    if (error_1 instanceof policies_js_1.CircuitBreakerOpenError) {
                        logger_js_1.logger.error({ agent: fallbackAgent }, "Circuit breaker open for agent");
                        // Record circuit breaker failure in metrics
                        (0, metrics_js_1.recordCircuitBreakerFailure)(fallbackAgent);
                        return [2 /*return*/, attachMeta({ ok: false, error: "circuit_open", code: "CIRCUIT_OPEN" }, { agent: fallbackAgent, intent: req.intent })];
                    }
                    logger_js_1.logger.error({ agent: fallbackAgent, intent: req.intent, error: error_1 }, "Agent execution failed");
                    // Record failed agent run
                    (0, metrics_js_1.recordAgentRun)(fallbackAgent, client_1.RunStatus.FAILED, 0, req.intent);
                    return [2 /*return*/, attachMeta({ ok: false, error: "agent_execution_failed", code: "AGENT_EXECUTION_FAILED" }, { agent: fallbackAgent, intent: req.intent })];
                case 10: return [2 /*return*/];
            }
        });
    });
}
function __resetOrchestratorState() {
    circuitMap.clear();
    rateState.clear();
}
