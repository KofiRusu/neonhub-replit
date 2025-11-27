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
exports.executeAgentRun = executeAgentRun;
var client_1 = require("@prisma/client");
var prisma_js_1 = require("../../db/prisma.js");
var logger_js_1 = require("../../lib/logger.js");
var run_context_js_1 = require("../../services/orchestration/run-context.js");
var metrics_js_1 = require("../../lib/metrics.js");
var JSON_SERIALIZATION_ERROR_KEY = "__serialization_error";
var toJsonValue = function (value) {
    var _a;
    var _b;
    if (value === undefined) {
        return null;
    }
    if (value === null) {
        return null;
    }
    if (typeof value === "number" || typeof value === "string" || typeof value === "boolean") {
        return value;
    }
    try {
        return JSON.parse(JSON.stringify(value));
    }
    catch (error) {
        return _a = {},
            _a[JSON_SERIALIZATION_ERROR_KEY] = (_b = error.message) !== null && _b !== void 0 ? _b : "unserializable",
            _a;
    }
};
function executeAgentRun(agentId_1, context_1, input_1, executor_1) {
    return __awaiter(this, arguments, void 0, function (agentId, context, input, executor, options) {
        var prisma, runLogger, startedAt, telemetryAgent, telemetryEnabled, run, contextWrapper;
        var _this = this;
        var _a, _b, _c, _d, _e, _f;
        if (options === void 0) { options = {}; }
        return __generator(this, function (_g) {
            switch (_g.label) {
                case 0:
                    if (!context.organizationId || typeof context.organizationId !== "string") {
                        throw new Error("organizationId is required in agent context");
                    }
                    prisma = (_a = context.prisma) !== null && _a !== void 0 ? _a : prisma_js_1.prisma;
                    runLogger = (_b = context.logger) !== null && _b !== void 0 ? _b : logger_js_1.logger;
                    startedAt = new Date();
                    telemetryAgent = (_c = context.agentName) !== null && _c !== void 0 ? _c : agentId;
                    telemetryEnabled = options.emitTelemetry !== false;
                    return [4 /*yield*/, prisma.agentRun.create({
                            data: {
                                agentId: agentId,
                                organizationId: context.organizationId,
                                status: client_1.RunStatus.RUNNING,
                                input: toJsonValue(input),
                                startedAt: startedAt,
                                metrics: toJsonValue({
                                    intent: (_d = options.intent) !== null && _d !== void 0 ? _d : null,
                                    userId: (_e = context.userId) !== null && _e !== void 0 ? _e : null,
                                }),
                            },
                        })];
                case 1:
                    run = _g.sent();
                    runLogger.info({ runId: run.id, agentId: agentId, intent: options.intent }, "Agent run started");
                    contextWrapper = function () { return __awaiter(_this, void 0, void 0, function () {
                        var result, completedAt, metrics, updateData, durationMs, error_1, completedAt, failureMetrics, failureData, durationMs;
                        var _a, _b, _c, _d;
                        return __generator(this, function (_e) {
                            switch (_e.label) {
                                case 0:
                                    _e.trys.push([0, 3, , 5]);
                                    return [4 /*yield*/, executor()];
                                case 1:
                                    result = _e.sent();
                                    completedAt = new Date();
                                    metrics = __assign({ intent: (_a = options.intent) !== null && _a !== void 0 ? _a : null, userId: (_b = context.userId) !== null && _b !== void 0 ? _b : null, durationMs: completedAt.getTime() - startedAt.getTime() }, (options.buildMetrics ? options.buildMetrics(result) : {}));
                                    updateData = {
                                        status: client_1.RunStatus.SUCCESS,
                                        output: toJsonValue(result),
                                        completedAt: completedAt,
                                        metrics: toJsonValue(metrics),
                                    };
                                    return [4 /*yield*/, prisma.agentRun.update({
                                            where: { id: run.id },
                                            data: updateData,
                                        })];
                                case 2:
                                    _e.sent();
                                    durationMs = completedAt.getTime() - startedAt.getTime();
                                    runLogger.info({ runId: run.id, agentId: agentId, intent: options.intent }, "Agent run completed");
                                    if (telemetryEnabled) {
                                        (0, metrics_js_1.recordAgentRun)(telemetryAgent, client_1.RunStatus.SUCCESS, durationMs / 1000, options.intent);
                                    }
                                    return [2 /*return*/, { runId: run.id, result: result }];
                                case 3:
                                    error_1 = _e.sent();
                                    completedAt = new Date();
                                    failureMetrics = {
                                        intent: (_c = options.intent) !== null && _c !== void 0 ? _c : null,
                                        userId: (_d = context.userId) !== null && _d !== void 0 ? _d : null,
                                        durationMs: completedAt.getTime() - startedAt.getTime(),
                                        error: error_1 instanceof Error ? error_1.message : String(error_1),
                                        stack: error_1 instanceof Error ? error_1.stack : undefined,
                                    };
                                    failureData = {
                                        status: client_1.RunStatus.FAILED,
                                        completedAt: completedAt,
                                        metrics: toJsonValue(failureMetrics),
                                    };
                                    return [4 /*yield*/, prisma.agentRun.update({
                                            where: { id: run.id },
                                            data: failureData,
                                        })];
                                case 4:
                                    _e.sent();
                                    durationMs = failureMetrics.durationMs;
                                    runLogger.error({ runId: run.id, agentId: agentId, intent: options.intent, error: error_1 }, "Agent run failed");
                                    if (telemetryEnabled) {
                                        (0, metrics_js_1.recordAgentRun)(telemetryAgent, client_1.RunStatus.FAILED, durationMs / 1000, options.intent);
                                    }
                                    throw error_1;
                                case 5: return [2 /*return*/];
                            }
                        });
                    }); };
                    return [2 /*return*/, (0, run_context_js_1.runWithAgentContext)({
                            runId: run.id,
                            agentId: agentId,
                            agentName: (_f = context.agentName) !== null && _f !== void 0 ? _f : agentId,
                            organizationId: context.organizationId,
                            prisma: prisma,
                        }, contextWrapper)];
            }
        });
    });
}
